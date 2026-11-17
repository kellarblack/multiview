import type { Game, GameState } from './types';

const LEAGUES = [
  { label: 'NBA', path: 'basketball/nba' },
  { label: 'NFL', path: 'football/nfl' },
  { label: 'MLB', path: 'baseball/mlb' },
  { label: 'NHL', path: 'hockey/nhl' },
  { label: 'EPL', path: 'soccer/eng.1' },
  { label: 'CFB', path: 'football/college-football' },
] as const;

const BASE = import.meta.env.DEV
  ? '/espn-api/apis/site/v2/sports'
  : 'https://site.api.espn.com/apis/site/v2/sports';

interface EspnCompetitor {
  homeAway?: string;
  score?: string;
  winner?: boolean;
  team?: { shortDisplayName?: string; displayName?: string; name?: string; abbreviation?: string };
}

interface EspnOdds {
  details?: string;
  overUnder?: number;
  provider?: { displayName?: string };
}

interface EspnEvent {
  id?: string;
  date?: string;
  links?: { href?: string }[];
  competitions?: {
    competitors?: EspnCompetitor[];
    odds?: EspnOdds[];
    status?: { type?: { state?: string; shortDetail?: string; detail?: string } };
  }[];
}

const stateOf = (value: string | undefined): GameState =>
  value === 'in' || value === 'post' ? value : 'pre';

function side(competitor: EspnCompetitor) {
  const team = competitor.team ?? {};
  return {
    home: competitor.homeAway === 'home',
    name: team.shortDisplayName ?? team.displayName ?? team.name ?? '',
    abbr: team.abbreviation ?? '',
    score: competitor.score ?? '',
    winner: Boolean(competitor.winner),
  };
}

function toGame(league: string, event: EspnEvent): Game | null {
  const competition = event.competitions?.[0];
  if (!competition) return null;
  const sides = (competition.competitors ?? []).map(side);
  const away = sides.find((s) => !s.home) ?? sides[0];
  const home = sides.find((s) => s.home) ?? sides[1];
  if (!away || !home) return null;

  const status = competition.status?.type ?? {};
  const odds = competition.odds?.[0] ?? {};
  const total = Number(odds.overUnder ?? 0);

  return {
    id: event.id ?? `${league}-${away.abbr}-${home.abbr}`,
    league,
    state: stateOf(status.state),
    detail: status.shortDetail ?? status.detail ?? '',
    away,
    home,
    line: odds.details ?? '',
    total: Number.isFinite(total) && total > 0 ? total : 0,
    book: odds.provider?.displayName ?? '',
    date: event.date ?? '',
    link:
      event.links?.map((l) => l.href ?? '').find((href) => href.includes('espn.com')) ??
      'https://www.espn.com/',
  };
}

/** Live, then upcoming (those carry the lines), then finals. Two per league. */
function pick(games: Game[]): Game[] {
  const shown: Game[] = [];
  const perLeague = new Map<string, number>();

  const take = (game: Game) => {
    if (shown.includes(game)) return false;
    const used = perLeague.get(game.league) ?? 0;
    if (used >= 2) return false;
    perLeague.set(game.league, used + 1);
    shown.push(game);
    return true;
  };

  const grab = (state: GameState, max: number) => {
    let added = 0;
    for (const game of games) {
      if (added >= max || shown.length >= 6) break;
      if (game.state === state && take(game)) added += 1;
    }
  };

  grab('in', 3);
  grab('post', 1);
  for (const game of games) {
    if (shown.length >= 6) break;
    if (game.state === 'pre' && (game.line || game.total)) take(game);
  }
  if (shown.length < 4) {
    for (const game of games) {
      if (shown.length >= 4) break;
      if (game.state === 'pre') take(game);
    }
  }
  return shown.slice(0, 6);
}

interface WireGame {
  league: string;
  state: string;
  detail: string;
  line?: string;
  total?: number;
  book?: string;
  date?: string;
  link?: string;
  away: { name: string; abbr: string; score: string; winner: boolean };
  home: { name: string; abbr: string; score: string; winner: boolean };
}

/** The Cloudflare Worker keeps one cached view of all six leagues. */
async function fromWorker(signal?: AbortSignal): Promise<Game[] | null> {
  try {
    const res = await fetch('/api/scores', { signal, cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { games?: WireGame[] };
    if (!Array.isArray(data.games) || !data.games.length) return null;
    return data.games.map((game, index) => ({
      id: `${game.league}-${game.away.abbr}-${game.home.abbr}-${index}`,
      league: game.league,
      state: stateOf(game.state),
      detail: game.detail,
      away: { ...game.away, home: false },
      home: { ...game.home, home: true },
      line: game.line ?? '',
      total: Number(game.total ?? 0) || 0,
      book: game.book ?? '',
      date: game.date ?? '',
      link: game.link ?? 'https://www.espn.com/',
    }));
  } catch {
    return null;
  }
}

export async function fetchGames(signal?: AbortSignal): Promise<Game[]> {
  const wired = await fromWorker(signal);
  if (wired) return pick(wired);

  const responses = await Promise.allSettled(
    LEAGUES.map(async (league) => {
      const res = await fetch(`${BASE}/${league.path}/scoreboard`, { signal, cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { events?: EspnEvent[] };
      return (data.events ?? [])
        .map((event) => toGame(league.label, event))
        .filter((game): game is Game => game !== null);
    }),
  );

  const games: Game[] = [];
  for (const result of responses) {
    if (result.status === 'fulfilled') games.push(...result.value);
  }

  const rank: Record<GameState, number> = { in: 0, post: 1, pre: 2 };
  games.sort(
    (a, b) => rank[a.state] - rank[b.state] || a.date.localeCompare(b.date),
  );
  return pick(games);
}

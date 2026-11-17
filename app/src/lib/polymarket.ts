import type { Market } from './types';

const GAMMA = import.meta.env.DEV ? '/poly-api' : 'https://gamma-api.polymarket.com';
const TAGS = ['nba', 'nfl', 'nhl', 'mlb', 'epl'] as const;
const LABELS: Record<(typeof TAGS)[number], string> = {
  nba: 'NBA',
  nfl: 'NFL',
  nhl: 'NHL',
  mlb: 'MLB',
  epl: 'EPL',
};

interface GammaMarket {
  closed?: boolean;
  question?: string;
  groupItemTitle?: string;
  outcomePrices?: string | string[];
  volume?: number | string;
}

interface GammaEvent {
  slug?: string;
  title?: string;
  markets?: GammaMarket[];
}

const priceOf = (market: GammaMarket): number => {
  const raw = market.outcomePrices;
  if (!raw) return 0;
  const list = typeof raw === 'string' ? (JSON.parse(raw) as string[]) : raw;
  const yes = Number.parseFloat(list[0] ?? '');
  return Number.isFinite(yes) ? yes : 0;
};

const nameOf = (market: GammaMarket): string =>
  (market.groupItemTitle ?? market.question ?? '')
    .replace(/^(will|will the)\s+/i, '')
    .replace(/\s+(win|be named|be)\s+.*$/i, '')
    .replace(/\?$/, '')
    .trim();

const isPlaceholder = (market: GammaMarket): boolean => {
  const name = nameOf(market);
  return !name || /\b(other|field|another team|team [a-z]|none|yes|no)\b/i.test(name);
};

const titleOf = (event: GammaEvent): string => {
  let text = (event.title ?? '').split(':').slice(1).join(':') || event.title || '';
  text = text
    .replace(/\b(19|20)\d{2}(-\d{2})?\b/g, ' ')
    .replace(/\b(nba|nfl|nhl|mlb|epl|premier league|pro football|mls|soccer|ufc)\b/gi, ' ')
    .replace(/\b(the|of|to|a|an)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (/champion/.test(text)) return 'champion';
  if (/winner|win\b/.test(text)) return 'winner';
  if (/playoff|seed|qualify|advance/.test(text)) return 'playoffs';
  return text.split(' ').slice(0, 3).join(' ');
};

function pickFor(league: string, events: GammaEvent[]): Market | null {
  if (!events.length) return null;
  const event =
    events.find((e) => /champion|winner/i.test(`${e.slug ?? ''} ${e.title ?? ''}`)) ??
    events[0];
  if (!event) return null;

  const all = (event.markets ?? []).filter((m) => m && !m.closed);
  const pools = [
    all.filter((m) => !isPlaceholder(m) && Number(m.volume ?? 0) >= 500),
    all.filter((m) => !isPlaceholder(m)),
  ];

  for (const pool of pools) {
    const best = pool.reduce<{ price: number; market: GammaMarket | null }>(
      (acc, market) => {
        const price = priceOf(market);
        return price > acc.price ? { price, market } : acc;
      },
      { price: 0, market: null },
    );
    if (best.market && best.price > 0) {
      return {
        league,
        market: titleOf(event),
        name: nameOf(best.market),
        pct: Math.round(best.price * 1000) / 10,
        url: `https://polymarket.com/event/${event.slug ?? ''}`,
      };
    }
  }
  return null;
}

export async function fetchMarkets(signal?: AbortSignal): Promise<Market[]> {
  const results = await Promise.allSettled(
    TAGS.map(async (tag) => {
      const res = await fetch(
        `${GAMMA}/events?closed=false&limit=12&tag_slug=${tag}`,
        { signal, cache: 'no-store' },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const events = (await res.json()) as GammaEvent[];
      return pickFor(LABELS[tag], events);
    }),
  );

  return results
    .flatMap((result) => (result.status === 'fulfilled' && result.value ? [result.value] : []))
    .sort((a, b) => b.pct - a.pct);
}

import type { Game } from '../lib/types';

const clock = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
};

const statusText = (game: Game): string => {
  if (game.state === 'pre' && game.date) return clock(game.date) || game.detail;
  return game.detail;
};

export function Board({ games }: { games: Game[] }) {
  if (!games.length) return null;

  const live = games.filter((game) => game.state === 'in').length;
  const upcoming = games.filter((game) => game.state === 'pre').length;
  const book = games.find((game) => (game.line || game.total) && game.book)?.book;
  const lead = live ? `${live} live` : upcoming ? `${upcoming} upcoming` : 'final';

  return (
    <section className="section">
      <div className="section-head">
        <h2>the board</h2>
        <span className="section-note">
          {lead}
          {book ? ` · ${book.toLowerCase()} lines` : ''}
        </span>
      </div>
      <div className="board-row">
        {games.map((game) => {
          const detail = statusText(game);
          const away = game.state === 'pre' ? '' : game.away.score;
          const home = game.state === 'pre' ? '' : game.home.score;
          return (
            <a
              key={game.id}
              className="board-card"
              href={game.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${game.league} ${game.away.name} at ${game.home.name} ${detail}`}
            >
              <span className="board-top">
                <span>{game.league}</span>
                <span className={`board-state is-${game.state}`}>
                  {game.state === 'in' && <i />}
                  {detail}
                </span>
              </span>
              <span className={`board-team${game.away.winner ? ' is-winner' : ''}`}>
                <span>{game.away.abbr || game.away.name}</span>
                <b>{away}</b>
              </span>
              <span className={`board-team${game.home.winner ? ' is-winner' : ''}`}>
                <span>{game.home.abbr || game.home.name}</span>
                <b>{home}</b>
              </span>
              <span className="board-book">
                {game.line && <span>{game.line}</span>}
                {game.total ? <span>{game.line ? '· ' : ''}o{game.total}</span> : null}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

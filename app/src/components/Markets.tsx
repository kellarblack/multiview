import type { Market } from '../lib/types';

export function Markets({ markets }: { markets: Market[] }) {
  if (!markets.length) return null;
  return (
    <section className="section">
      <div className="section-head">
        <h2>markets</h2>
        <span className="section-note">polymarket · implied chance</span>
      </div>
      <div className="market-row">
        {markets.map((market) => (
          <a
            key={market.url}
            className="market-cell"
            href={market.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${market.market}: ${market.name} ${market.pct} percent on polymarket`}
          >
            <span className="market-top">
              <span>
                {market.league} · {market.market}
              </span>
              <b>{market.pct}%</b>
            </span>
            <span className="market-name">{market.name}</span>
            <span className="market-bar">
              <i style={{ width: `${Math.max(2, Math.min(100, market.pct))}%` }} />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

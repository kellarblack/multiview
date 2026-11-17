import type { Board, Layout } from '../lib/types';
import { LIMITS } from '../lib/storage';

interface Props {
  board: Board;
  onLayout: (layout: Layout) => void;
  onRemove: (id: string) => void;
  onAdd: (text: string) => void;
  onOpenHome: () => void;
}

export function Wall({ board, onLayout, onRemove, onAdd, onOpenHome }: Props) {
  const tiles = board.tiles.slice(0, LIMITS.maxTiles);

  return (
    <div className="wall">
      <div className="wall-bar">
        <div className="wall-layouts" role="group" aria-label="Layout">
          {LIMITS.layouts.map((layout) => (
            <button
              key={layout}
              type="button"
              aria-pressed={board.layout === layout}
              onClick={() => onLayout(layout)}
            >
              {layout}-up
            </button>
          ))}
        </div>
        <span className="wall-count">
          {tiles.length} of {LIMITS.maxTiles} tiles
        </span>
        <a className="link-btn" href="#share">
          share
        </a>
      </div>

      {tiles.length === 0 ? (
        <div className="wall-empty">
          <p>nothing on this wall yet.</p>
          <div className="wall-empty-actions">
            <button type="button" className="btn primary" onClick={onOpenHome}>
              paste a link
            </button>
            <button
              type="button"
              className="btn"
              onClick={() =>
                onAdd(
                  [
                    'https://www.youtube.com/channel/UCGWTUS6esxeTcmFJN_RwbEQ/live',
                    'https://www.youtube.com/channel/UCIALMKvObZNtJ6AmdCLP7Lg/live',
                    'https://www.youtube.com/watch?v=6QFVhVT187M',
                    'https://www.youtube.com/watch?v=Lhk3Gu0YeRs',
                  ].join(' '),
                )
              }
            >
              load demo
            </button>
          </div>
        </div>
      ) : (
        <div className={`grid cols-${board.layout}`} data-cols={board.layout}>
          {tiles.map((tile) => (
            <div key={tile.id} className="tile">
              {tile.embed ? (
                <iframe
                  src={tile.embed}
                  title={tile.name}
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  loading="lazy"
                />
              ) : (
                <div className="tile-blocked">
                  <p>{tile.name} cannot be framed.</p>
                </div>
              )}
              <div className="tile-ui">
                <span className="tile-name">{tile.name}</span>
                <button type="button" onClick={() => onRemove(tile.id)} aria-label={`Remove ${tile.name}`}>
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Board } from './components/Board';
import { Markets } from './components/Markets';
import { Slate } from './components/Slate';
import { Wall } from './components/Wall';
import { ShareDialog } from './components/ShareDialog';
import { PlanDialog } from './components/PlanDialog';
import { WallsDialog, type WallPreset } from './components/WallsDialog';
import { useBoards } from './hooks/useBoards';
import { usePolled } from './hooks/usePolled';
import { fetchGames } from './lib/espn';
import { fetchMarkets } from './lib/polymarket';
import { LIMITS } from './lib/storage';
import type { Layout, View } from './lib/types';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [shareOpen, setShareOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [wallsOpen, setWallsOpen] = useState(false);
  const boards = useBoards();

  const games = usePolled(fetchGames, [], 90_000);
  const markets = usePolled(fetchMarkets, [], 600_000);

  const hasTiles = boards.active.tiles.length > 0;

  const presets = useMemo(() => LIMITS.layouts, []);

  const addUrls = (text: string) => {
    const result = boards.add(text);
    if (result.added) setView('wall');
    return result;
  };

  const pickPreset = (preset: WallPreset) => {
    boards.clear();
    boards.add(preset.links.join(' '));
    setView('wall');
  };

  return (
    <div className="app">
      <Nav view={view} onNavigate={setView} />

      <main className="main">
        {view === 'home' ? (
          <div className="home">
            <Hero onAdd={addUrls} hasTiles={hasTiles} onBlank={() => setView('wall')} />

            <Board games={games.data} />
            <Markets markets={markets.data} />
            <Slate onOpen={(urls) => addUrls(urls.join(' '))} />

            <section className="try-wall">
              <span className="try-copy">try a wall</span>
              <div className="try-sizes" role="group" aria-label="Screen count">
                {presets.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      boards.setLayout(size as Layout);
                      setView('wall');
                    }}
                  >
                    {size}-up
                  </button>
                ))}
              </div>
            </section>

            <button type="button" className="walls-cta" onClick={() => setWallsOpen(true)}>
              <span className="walls-copy">
                <b>ready-made walls</b>
                <span>{PRESET_COUNT} walls — sport, news, toons, tech and more.</span>
              </span>
              <span className="walls-go">browse →</span>
            </button>

            <section className="pricing">
              <p>
                <span className="pill ok">
                  <i />
                  everything free
                </span>
                every wall, every tile, no account, no card, no trial timer.
                <span className="price-later">later: pro $5 once · the app you download stays yours.</span>
              </p>
              <button type="button" className="link-btn" onClick={() => setPlanOpen(true)}>
                plans →
              </button>
            </section>

            <footer className="footer">
              <div className="footer-links">
                <button type="button" className="link-btn" onClick={() => setShareOpen(true)}>
                  share
                </button>
                <a className="link-btn" href="https://multiview.cc/help">
                  help &amp; devices
                </a>
                <a className="link-btn" href="https://multiview.cc/legal">
                  legal
                </a>
                <a className="link-btn" href="https://multiview.cc/status">
                  status
                </a>
              </div>
              <span className="footer-note">multiview.cc · free right now</span>
            </footer>
          </div>
        ) : (
          <Wall
            board={boards.active}
            onLayout={(layout) => boards.setLayout(layout)}
            onRemove={boards.remove}
            onAdd={addUrls}
            onOpenHome={() => setView('home')}
          />
        )}
      </main>

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />
      <PlanDialog open={planOpen} onClose={() => setPlanOpen(false)} />
      <WallsDialog open={wallsOpen} onClose={() => setWallsOpen(false)} onPick={pickPreset} />
    </div>
  );
}

const PRESET_COUNT = 4;

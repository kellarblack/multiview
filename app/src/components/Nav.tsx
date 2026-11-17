import type { View } from '../lib/types';

interface Props {
  view: View;
  onNavigate: (view: View) => void;
}

const ITEMS: { view: View; label: string }[] = [
  { view: 'home', label: 'home' },
  { view: 'wall', label: 'wall' },
];

export function Nav({ view, onNavigate }: Props) {
  return (
    <header className="topbar">
      <nav className="view-nav" aria-label="Sections">
        {ITEMS.map((item) => (
          <button
            key={item.view}
            type="button"
            aria-current={view === item.view ? 'page' : undefined}
            onClick={() => onNavigate(item.view)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="spacer" />
      <a className="plan-chip" href="#plans">
        <span className="dot" aria-hidden="true" />
        everything free
        <span aria-hidden="true">→</span>
      </a>
    </header>
  );
}

import { useState, type FormEvent } from 'react';

interface Props {
  onAdd: (text: string) => void;
  hasTiles: boolean;
  onBlank: () => void;
}

export function Hero({ onAdd, hasTiles, onBlank }: Props) {
  const [value, setValue] = useState('');
  const [hint, setHint] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    onAdd(text);
    setValue('');
    setHint(null);
  };

  return (
    <section className="hero">
      <div className="hero-copy">
        <h1>
          four streams.
          <br />
          one screen.
        </h1>
        <p className="hero-sub">paste a link. it plays. no account, no cable box.</p>

        <form className="hero-paste" onSubmit={submit}>
          <input
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setHint(null);
            }}
            spellCheck={false}
            autoComplete="off"
            aria-label="Paste a link"
            placeholder="paste a youtube, twitch or web link"
          />
          <button type="submit" className="btn primary">
            add
          </button>
        </form>

        <div className="hero-alt">
          <button type="button" className="btn" onClick={onBlank}>
            open wall
          </button>
          {!hasTiles && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                onAdd(
                  [
                    'https://www.youtube.com/channel/UCGWTUS6esxeTcmFJN_RwbEQ/live',
                    'https://www.youtube.com/channel/UCIALMKvObZNtJ6AmdCLP7Lg/live',
                    'https://www.youtube.com/watch?v=6QFVhVT187M',
                    'https://www.youtube.com/watch?v=Lhk3Gu0YeRs',
                  ].join(' '),
                );
                setHint('demo loaded — four live channels');
              }}
            >
              load demo
            </button>
          )}
          <a className="btn ghost" href="https://multiview.cc/multiview-beta.zip" download>
            download
          </a>
        </div>

        <p className="hero-fine">
          <strong>free right now</strong> · everything included · no account
          <span className="fine-later">· pro $5 once, later</span>
          <a className="link-btn" href="#plans">
            plans
          </a>
        </p>
        {hint && <p className="hero-hint">{hint}</p>}
      </div>

      <div className="hero-visual" aria-hidden="true">
        <div className="hero-frame">
          <div className="hero-cell">
            <img src="https://i.ytimg.com/vi/p4aNGqai4ec/maxres2.jpg" alt="" loading="lazy" />
            <span className="cell-tag">premier league</span>
          </div>
          <div className="hero-cell">
            <img src="https://i.ytimg.com/vi/y-jR93AytPc/maxres2.jpg" alt="" loading="lazy" />
            <span className="cell-tag">nba</span>
          </div>
          <div className="hero-cell">
            <img src="https://i.ytimg.com/vi/QkGOollG-S4/maxres2.jpg" alt="" loading="lazy" />
            <span className="cell-tag">mlb</span>
          </div>
          <div className="hero-cell">
            <img src="https://i.ytimg.com/vi/MRO9RbJuZLg/maxres2.jpg" alt="" loading="lazy" />
            <span className="cell-tag">college football</span>
          </div>
          <p className="hero-caption">four games. one screen.</p>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef } from 'react';

export interface WallPreset {
  key: string;
  name: string;
  blurb: string;
  links: string[];
}

export const PRESETS: WallPreset[] = [
  {
    key: 'sports',
    name: 'Sports',
    blurb: 'NBA · MLB · UFC · Olympics',
    links: [
      'https://www.youtube.com/watch?v=y-jR93AytPc',
      'https://www.youtube.com/watch?v=QkGOollG-S4',
      'https://www.youtube.com/watch?v=p4aNGqai4ec',
      'https://www.youtube.com/watch?v=MRO9RbJuZLg',
    ],
  },
  {
    key: 'news',
    name: 'News desk',
    blurb: '4 live news channels',
    links: [
      'https://www.youtube.com/channel/UCGWTUS6esxeTcmFJN_RwbEQ/live',
      'https://www.youtube.com/channel/UCIALMKvObZNtJ6AmdCLP7Lg/live',
      'https://www.youtube.com/watch?v=6QFVhVT187M',
      'https://www.youtube.com/watch?v=Lhk3Gu0YeRs',
    ],
  },
  {
    key: 'toons',
    name: 'Toons',
    blurb: 'Family Guy · American Dad · South Park · more',
    links: [
      'https://www.youtube.com/watch?v=nIyaCRNwxhU',
      'https://www.youtube.com/watch?v=4In8wOZreGQ',
      'https://www.youtube.com/watch?v=3zcO7qaUiHs',
      'https://www.youtube.com/watch?v=ALGbqW-tUAQ',
    ],
  },
  {
    key: 'tech',
    name: 'Tech',
    blurb: 'LTT · MKBHD · Corridor · Mark Rober',
    links: [
      'https://www.youtube.com/watch?v=Se6OL_DsGo8',
      'https://www.youtube.com/watch?v=ie920kzulsc',
      'https://www.youtube.com/watch?v=IIy0uIqFjb0',
      'https://www.youtube.com/watch?v=QkGOollG-S4',
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (preset: WallPreset) => void;
}

export function WallsDialog({ open, onClose, onPick }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog className="sheet" ref={ref} aria-labelledby="walls-title" onClose={onClose}>
      <div className="sheet-head">
        <div>
          <h2 id="walls-title">ready-made walls</h2>
          <p className="sheet-sub">one tap fills four tiles with live channels.</p>
        </div>
        <button type="button" className="btn icon" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="sheet-body">
        <div className="walls-grid">
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className="wall-option"
              onClick={() => {
                onPick(preset);
                onClose();
              }}
            >
              <b>{preset.name}</b>
              <span>{preset.blurb}</span>
            </button>
          ))}
        </div>
      </div>
    </dialog>
  );
}

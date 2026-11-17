import { useEffect, useRef, useState } from 'react';

const LINE = 'four streams. one screen.';
const TITLE = 'multiview.cc — four streams, one screen';

const NETWORKS = {
  x: (url: string, text: string) =>
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  threads: (url: string, text: string) =>
    `https://www.threads.com/intent/post?text=${encodeURIComponent(`${text} ${url}`)}`,
  bluesky: (url: string, text: string) =>
    `https://bsky.app/intent/compose?text=${encodeURIComponent(`${text} ${url}`)}`,
  reddit: (url: string, text: string) =>
    `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  whatsapp: (url: string, text: string) =>
    `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  telegram: (url: string, text: string) =>
    `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  facebook: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
} as const;

type Network = keyof typeof NETWORKS;

const ORDER: { key: Network | 'email'; label: string }[] = [
  { key: 'x', label: 'X' },
  { key: 'threads', label: 'threads' },
  { key: 'bluesky', label: 'bluesky' },
  { key: 'reddit', label: 'reddit' },
  { key: 'whatsapp', label: 'whatsapp' },
  { key: 'telegram', label: 'telegram' },
  { key: 'facebook', label: 'facebook' },
  { key: 'email', label: 'email' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ShareDialog({ open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const url = typeof location === 'undefined' ? 'https://multiview.cc/' : location.origin + location.pathname;

  const share = (network: Network | 'email') => {
    if (network === 'email') {
      const body = encodeURIComponent(`${LINE}\n${url}\n\nfree right now, no account.`);
      location.href = `mailto:?subject=${encodeURIComponent(TITLE)}&body=${body}`;
      return;
    }
    window.open(NETWORKS[network](url, LINE), '_blank', 'noopener,noreferrer,width=680,height=760');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <dialog className="sheet" ref={ref} aria-labelledby="share-title" onClose={onClose}>
      <div className="sheet-head">
        <div>
          <h2 id="share-title">share this wall</h2>
          <p className="sheet-sub">send the link, or post it.</p>
        </div>
        <button type="button" className="btn icon" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="sheet-body">
        <div className="share-actions">
          <button type="button" className="btn primary" onClick={() => void copy()}>
            {copied ? 'link copied' : 'copy link'}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              if (navigator.share) void navigator.share({ title: 'multiview.cc', text: LINE, url });
              else void copy();
            }}
          >
            share…
          </button>
        </div>
        <p className="share-lead">post it:</p>
        <div className="share-sites" role="group" aria-label="Post the wall link to">
          {ORDER.map((item) => (
            <button key={item.key} type="button" onClick={() => share(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
        <p className="share-note">
          each one opens a post with the wall link already in it — edit the words before you send.
        </p>
      </div>
    </dialog>
  );
}

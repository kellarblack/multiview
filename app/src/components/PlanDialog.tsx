import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PlanDialog({ open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog className="sheet" ref={ref} aria-labelledby="plan-title" onClose={onClose}>
      <div className="sheet-head">
        <div>
          <h2 id="plan-title">plan</h2>
          <p className="sheet-sub">
            everything is free right now. the $5 pro tier comes later, and the app you download is yours.
          </p>
        </div>
        <button type="button" className="btn icon" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="sheet-body">
        <span className="pill ok">
          <i />
          free right now
        </span>
        <h3 className="plan-headline">everything is free right now.</h3>
        <p className="plan-copy">
          every wall, every tile, the download — all of it. no account, no card, no trial timer. the $5 pro tier
          is for later; the app you keep is free.
        </p>

        <div className="plan-row">
          <div>
            <b>today</b>
            <span>free · no account needed</span>
          </div>
          <div>
            <b>later</b>
            <span>pro · $5 one time</span>
          </div>
          <div>
            <b>yours</b>
            <span>the downloaded app stays free</span>
          </div>
        </div>

        <a className="btn" href="https://multiview.cc/multiview-beta.zip" download>
          download for computer
        </a>
      </div>
    </dialog>
  );
}

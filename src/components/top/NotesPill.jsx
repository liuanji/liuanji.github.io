import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { PlainBanners } from './controls';

// Stands in for the notices at the top of the page once they have scrolled out
// of view: a pill in the bottom-right corner with a soft dot per notice, which
// grows into a card holding the notices themselves (children) under the mouse,
// or on a tap or Enter. Leaving it, minimizing, following a link in one,
// clicking outside or Escape shrinks it back. "Hide for an hour" in the card
// hides the pill for HIDE_FOR_MS, across reloads; if the same notices are still
// there after that it comes back, and new ones bring it back at once.
// notes are { key, color, label }; anchor is the notices' own box.
const HIDE_FOR_MS = 60 * 60 * 1000;
const HIDDEN_KEY = 'gpu-status-notes-hidden';
const SPRING = { type: 'spring', stiffness: 420, damping: 36 };

function readHidden() {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY)) ?? null;
  } catch {
    return null;
  }
}

function Dots({ notes }) {
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      {notes.map((note) => (
        <span key={note.key} className="h-2 w-2 rounded-full" style={{ backgroundColor: note.color }} />
      ))}
    </span>
  );
}

export default function NotesPill({ notes, anchor, children }) {
  const [past, setPast] = useState(false);
  const [open, setOpen] = useState(false);
  // { signature, until }: which notices were tucked away, and until when.
  const [hidden, setHidden] = useState(readHidden);
  const card = useRef(null);
  const signature = notes.map((note) => note.key).join('|');
  const tucked = hidden?.signature === signature && Date.now() < hidden.until;
  const shown = notes.length > 0 && past && !tucked;
  const count = notes.length === 1 ? '1 note' : `${notes.length} notes`;

  const hide = () => {
    const next = { signature, until: Date.now() + HIDE_FOR_MS };
    setOpen(false);
    setHidden(next);
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
    } catch {
      // Without storage it stays hidden only while the page is open.
    }
  };

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = anchor.current?.getBoundingClientRect();
      // Shown only once the whole box is above the top of the screen.
      setPast(Boolean(box) && box.bottom < 72);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [anchor, signature]);

  // Brings the pill back when the grace period ends.
  useEffect(() => {
    if (!tucked) return undefined;
    const timer = setTimeout(() => setHidden((current) => ({ ...current })), hidden.until - Date.now() + 50);
    return () => clearTimeout(timer);
  }, [tucked, hidden]);

  // An open card shrinks back on a click outside it or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => {
      if (!card.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  useEffect(() => {
    if (!shown) setOpen(false);
  }, [shown]);

  // A mouse resting on the pill grows it; leaving the card shrinks it again
  // after a moment, so a brief slip past the edge does not.
  const leaveTimer = useRef(undefined);
  useEffect(() => () => clearTimeout(leaveTimer.current), []);
  const hoverIn = (event) => {
    if (event.pointerType !== 'mouse' || !shown) return;
    clearTimeout(leaveTimer.current);
    setOpen(true);
  };
  const hoverOut = (event) => {
    if (event.pointerType !== 'mouse') return;
    leaveTimer.current = setTimeout(() => setOpen(false), 300);
  };

  // In the body, since the page's animated wrapper would pin a fixed element to itself.
  return createPortal(
    <div
      aria-hidden={!shown}
      className={`fixed bottom-6 right-6 z-30 flex justify-end transition-[opacity,transform] duration-300 ease-out ${
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <motion.div
        ref={card}
        onPointerEnter={hoverIn}
        onPointerLeave={hoverOut}
        layout
        transition={SPRING}
        style={{ borderRadius: open ? 18 : 999 }}
        className={`overflow-hidden border border-border-light bg-white/95 backdrop-blur-sm ${open ? 'shadow-xl' : 'shadow-md'}`}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {open ? (
            <motion.div
              key="card"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.08, duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="w-[30rem] max-w-[calc(100vw-3rem)] px-5 pb-2 pt-4"
              role="dialog"
              aria-label={`${count} for you`}
              onClick={(event) => {
                if (event.target.closest('button[data-banner-link], a')) setOpen(false);
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-widest text-data-grey/80">
                  <Dots notes={notes} />
                  {count} for you
                </span>
                <span className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={hide}
                    className="rounded-full px-2.5 py-1 font-mono text-[11px] text-data-grey/70 transition-colors hover:bg-paper hover:text-inkwell"
                  >
                    Hide for an hour
                  </button>
                  <button
                    type="button"
                    aria-label="Minimize"
                    title="Minimize"
                    onClick={() => setOpen(false)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-data-grey/70 transition-colors hover:bg-paper hover:text-inkwell"
                  >
                    <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </button>
                </span>
              </div>
              <div className="-mr-3 mt-1 max-h-[calc(100vh-10rem)] divide-y divide-border-light overflow-y-auto overscroll-contain pr-3 [scrollbar-width:thin]">
                <PlainBanners.Provider value>{children}</PlainBanners.Provider>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="pill"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.08, duration: 0.15 } }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              className="flex items-center"
            >
              <button
                type="button"
                tabIndex={shown ? 0 : -1}
                aria-expanded={false}
                onClick={() => setOpen(true)}
                title={notes.map((note) => note.label).join(' · ')}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-data-grey transition-colors hover:text-inkwell focus-visible:outline-none"
              >
                <Dots notes={notes} />
                {count} for you
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>,
    document.body,
  );
}

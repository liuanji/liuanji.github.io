import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Croissant } from 'lucide-react';
import { Banner, PlainBanners } from './controls';
import { allClearPhrase } from './easterEggs';

// Always in the bottom-right corner: a pill with a soft dot per notice for the
// viewer, which grows into a card holding the notices themselves (children)
// under the mouse, or on a tap or Enter. Leaving it, minimizing, following a
// link in one, clicking outside or Escape shrinks it back. "Hide for an hour"
// shrinks it to a small circle with the count for HIDE_FOR_MS, across reloads,
// which a hover leaves alone and a click brings back; if the same notices are
// still there after that it grows back, and new ones bring it back at once.
// With no notices it is a little croissant in a circle, which shows a happy
// phrase under the mouse and a few kind words on a click.
// notes are { key, color, label, urgent }.
const HIDE_FOR_MS = 60 * 60 * 1000;
const HIDDEN_KEY = 'gpu-status-notes-hidden';
const SPRING = { type: 'spring', stiffness: 420, damping: 36 };
const CRUST = '#B7792B';
const BUTTER = '#F6DFAE';

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
        <span key={note.key} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: note.color }} />
      ))}
    </span>
  );
}

// The all-clear croissant: two tiny sparkles twinkle beside it in turn, as if
// it were fresh and shiny, and it hops when the mouse arrives. Still for
// viewers who prefer reduced motion.
const SPARKLE = '#E3B655';
const SPARKLES = [
  { className: '-right-1.5 -top-1 h-2 w-2', delay: '0s' },
  { className: '-left-1.5 bottom-0 h-1.5 w-1.5', delay: '1.3s' },
];

function FreshCroissant({ hopping }) {
  return (
    <span className="relative flex h-5 w-5 items-center justify-center" aria-hidden="true">
      {!hopping &&
        SPARKLES.map((sparkle) => (
          <svg
            key={sparkle.delay}
            viewBox="0 0 10 10"
            className={`pointer-events-none absolute scale-0 motion-safe:animate-twinkle ${sparkle.className}`}
            style={{ animationDelay: sparkle.delay }}
          >
            <path d="M5 0 Q5.6 4.4 10 5 Q5.6 5.6 5 10 Q4.4 5.6 0 5 Q4.4 4.4 5 0 Z" fill={SPARKLE} />
          </svg>
        ))}
      <Croissant
        className={`h-4 w-4 ${hopping ? '-rotate-12 scale-110 motion-safe:animate-hop' : ''}`}
        strokeWidth={1.8}
        style={{ color: CRUST, fill: BUTTER }}
      />
    </span>
  );
}

export default function NotesPill({ notes, me = null, children }) {
  const [open, setOpen] = useState(false);
  // With no notices: the croissant circle shows its phrase while the mouse rests on it.
  const [peek, setPeek] = useState(false);
  // { signature, until }: which notices were quieted, and until when.
  const [hidden, setHidden] = useState(readHidden);
  const card = useRef(null);
  const leaveTimer = useRef(undefined);
  const signature = notes.map((note) => note.key).join('|');
  const any = notes.length > 0;
  const quiet = any && hidden?.signature === signature && Date.now() < hidden.until;
  const count = notes.length === 1 ? '1 note' : `${notes.length} notes`;
  // Waiting notices tint the pill and give it a slow glow in the colour of the
  // most pressing one, so they are hard to miss without being loud.
  const calling = any && !open && !quiet;
  const lead = (notes.find((note) => note.urgent) ?? notes[0])?.color;
  const minutesLeft = quiet ? Math.max(1, Math.ceil((hidden.until - Date.now()) / 60000)) : 0;

  // Back to the smallest form: the circle, not the phrase it shows under the mouse.
  const minimize = () => {
    setOpen(false);
    setPeek(false);
  };

  const unhide = () => {
    setHidden(null);
    setOpen(true);
    try {
      localStorage.removeItem(HIDDEN_KEY);
    } catch {
      // Nothing stored to forget.
    }
  };

  const hide = () => {
    const next = { signature, until: Date.now() + HIDE_FOR_MS };
    setOpen(false);
    setHidden(next);
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
    } catch {
      // Without storage it stays quiet only while the page is open.
    }
  };

  // Lets the pill speak up again when the hour ends, and keeps its countdown fresh.
  useEffect(() => {
    if (!quiet) return undefined;
    const timer = setTimeout(() => setHidden((current) => ({ ...current })), 30 * 1000);
    return () => clearTimeout(timer);
  }, [quiet, hidden]);

  // An open card shrinks back on a click outside it or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => {
      if (!card.current?.contains(event.target)) minimize();
    };
    const escape = (event) => event.key === 'Escape' && minimize();
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  // Notices arriving or clearing start the pill afresh.
  useEffect(() => {
    setOpen(false);
    setPeek(false);
  }, [any]);

  // A mouse resting on the pill grows it; leaving the card shrinks it again
  // after a moment, so a brief slip past the edge does not.
  useEffect(() => () => clearTimeout(leaveTimer.current), []);
  const hoverIn = (event) => {
    if (event.pointerType !== 'mouse' || quiet) return;
    clearTimeout(leaveTimer.current);
    if (any) setOpen(true);
    else setPeek(true);
  };
  const hoverOut = (event) => {
    if (event.pointerType !== 'mouse') return;
    leaveTimer.current = setTimeout(() => {
      setOpen(false);
      setPeek(false);
    }, 300);
  };

  // In the body, since the page's animated wrapper would pin a fixed element to itself.
  return createPortal(
    <div className="fixed bottom-6 right-6 z-30 flex justify-end">
      <motion.div
        ref={card}
        onPointerEnter={hoverIn}
        onPointerLeave={hoverOut}
        layout
        transition={SPRING}
        style={{
          borderRadius: open ? 18 : 999,
          ...(calling && {
            borderColor: `${lead}66`,
            backgroundImage: `linear-gradient(${lead}12, ${lead}12)`,
            '--glow': `${lead}2E`,
          }),
        }}
        className={`overflow-hidden border border-border-light bg-white/95 backdrop-blur-sm ${open ? 'shadow-xl' : 'shadow-md'} ${
          calling ? 'motion-safe:animate-glow' : ''
        }`}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {open && !any ? (
            <motion.div
              key="clear-card"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.08, duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="w-[30rem] max-w-[calc(100vw-3rem)] px-5 pb-2 pt-4"
              role="dialog"
              aria-label="All clear"
            >
              {/* Laid out like the notes card: a header, then one notice in the banners' style. */}
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-widest text-data-grey/80">
                  <Croissant className="h-3.5 w-3.5" strokeWidth={2} style={{ color: CRUST, fill: BUTTER }} />
                  All clear
                </span>
                <button
                  type="button"
                  aria-label="Minimize"
                  title="Minimize"
                  onClick={minimize}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-data-grey/70 transition-colors hover:bg-paper hover:text-inkwell"
                >
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.25} />
                </button>
              </div>
              <div className="mt-1">
                <PlainBanners.Provider value>
                  <Banner icon={Croissant} color={CRUST}>
                    <p className="text-inkwell">{allClearPhrase()}.</p>
                    <p className="text-data-grey">
                      Nothing needs you right now: none of your GPUs is resting, nobody’s oven is borrowed, and your
                      scratch space is tidy. Happy baking{me ? `, ${me}` : ''}!
                    </p>
                  </Banner>
                </PlainBanners.Provider>
              </div>
            </motion.div>
          ) : open ? (
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
                    onClick={minimize}
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
          ) : quiet ? (
            <motion.button
              key="quiet"
              type="button"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.08, duration: 0.15 } }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              onClick={unhide}
              aria-label={`${count} hidden for ${minutesLeft} more min. Show them.`}
              title={`${count} hidden for ${minutesLeft} more min · click to show`}
              className="flex h-9 w-9 items-center justify-center font-mono text-xs text-data-grey/70 transition-colors hover:text-inkwell focus-visible:outline-none"
            >
              {notes.length}
            </motion.button>
          ) : any ? (
            <motion.button
              key="pill"
              type="button"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.08, duration: 0.15 } }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              aria-expanded={false}
              onClick={() => setOpen(true)}
              title={notes.map((note) => note.label).join(' · ')}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-inkwell focus-visible:outline-none"
            >
              <Dots notes={notes} />
              {count} for you
            </motion.button>
          ) : (
            <motion.button
              key={peek ? 'clear-peek' : 'clear'}
              type="button"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.06, duration: 0.15 } }}
              exit={{ opacity: 0, transition: { duration: 0.06 } }}
              onClick={() => setOpen(true)}
              aria-label={`All clear: ${allClearPhrase()}`}
              className={`flex items-center justify-center text-sm text-data-grey focus-visible:outline-none ${
                peek ? 'gap-2 px-4 py-2.5' : 'h-10 w-10'
              }`}
            >
              <FreshCroissant hopping={peek} />
              {peek && <span className="whitespace-nowrap">{allClearPhrase()}</span>}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>,
    document.body,
  );
}

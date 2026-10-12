import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { ROAM_POSES } from './BakeryCat';
import { CatThing } from './CatThings';
import { SCRAPBOOK, SCRAPBOOK_SIZE, markViewed, replayOf, useScrapbook } from './scrapbook';

// A moment's little scene, drawn at the page's own size (as she roams) and
// shrunk to fit its card: her feet at (x, y), on her stage. Her drawing's box
// is the roaming cat's (RoamingCat.jsx, VIEW and WIDTH): 100 x 62 of the 120 x
// 100 frame, 86 px wide, her feet at (60, 88) in it.
const SCENE = { width: 150, height: 116 };
const UNIT = 0.86;
const SHRINK = 0.66;
// Where her feet stand on each stage, down the scene.
const STAGE_FEET = { none: 80, ring: 48, panel: 100, side: 78 };
const DEFAULT_FEET = 84;

const RING_COLORS = { track: '#DCE3F7', compute: '#6F86D6', memoryTrack: '#DDF1E8', memory: '#5BBE98' };
// A GPU's ring, as on its tile (64 px; arcs of radius 28 and 21).
function Ring({ left, top, size = 64 }) {
  return (
    <svg className="absolute" style={{ left, top }} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="none" stroke={RING_COLORS.track} strokeWidth="4" />
      <circle
        cx="32"
        cy="32"
        r="28"
        fill="none"
        stroke={RING_COLORS.compute}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="140 176"
        transform="rotate(-90 32 32)"
      />
      <circle cx="32" cy="32" r="21" fill="none" stroke={RING_COLORS.memoryTrack} strokeWidth="3" />
      <circle
        cx="32"
        cy="32"
        r="21"
        fill="none"
        stroke={RING_COLORS.memory}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="80 132"
        transform="rotate(-90 32 32)"
      />
    </svg>
  );
}

const PANEL = 'absolute border border-[#E6DED2] bg-white';
// What she stands on: a panel's top edge, or its end; a GPU's tile (on it,
// or beside it) or its ring; a pop-up card, or its side to cling to; the
// notes pill or its all-clear croissant; the inside of a panel; or nothing.
function Stage({ kind, x, y }) {
  if (kind === 'none') return null;
  if (kind === 'ring') return <Ring left={x - 32} top={y - 2} />;
  if (kind === 'side') {
    return (
      <div
        className={`${PANEL} rounded-xl shadow-md`}
        style={{ left: x - 100, top: y - 70, width: 100, height: 120 }}
      />
    );
  }
  if (kind === 'panel') {
    return <div className={`${PANEL} rounded-xl`} style={{ left: x - 60, top: y - 86, width: 120, height: 92 }} />;
  }
  if (kind === 'tile' || kind === 'beside') {
    const box = kind === 'tile' ? { left: x - 42, top: y, width: 84 } : { left: x - 104, top: y - 64, width: 80 };
    return (
      <div className={`${PANEL} overflow-hidden rounded-xl`} style={{ ...box, height: 64 }}>
        <Ring left={box.width / 2 - 24} top={10} size={48} />
      </div>
    );
  }
  if (kind === 'card') {
    return (
      <div className={`${PANEL} rounded-xl shadow-md`} style={{ left: x - 70, top: y, width: 140, height: 40 }}>
        <div className="mx-3 mt-3 h-1.5 w-16 rounded-full bg-[#E9E4DC]" />
        <div className="mx-3 mt-2 h-1.5 w-24 rounded-full bg-[#F1ECE5]" />
      </div>
    );
  }
  if (kind === 'pill') {
    return (
      <div
        className={`${PANEL} flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 font-sans text-[11px] text-inkwell`}
        style={{ left: x - 66, top: y, width: 132, height: 30 }}
      >
        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#E39A55]" />
        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#8EA2E8]" />2 notes for you
      </div>
    );
  }
  if (kind === 'croissant') {
    return (
      <div className={`${PANEL} rounded-full`} style={{ left: x - 18, top: y, width: 36, height: 36 }}>
        <CatThing kind="croissant" x={18} y={25} scale={0.62} />
      </div>
    );
  }
  // A panel's top edge, or (end) its right-hand end, just past her.
  const box = kind === 'end' ? { left: x - 104, width: 118 } : { left: x - 68, width: 136 };
  return <div className={`${PANEL} rounded-t-xl border-b-0`} style={{ ...box, top: y, height: 40 }} />;
}

// A pointer, as on the page.
function Cursor({ x, y }) {
  return (
    <svg className="absolute" style={{ left: x, top: y }} width="14" height="20" viewBox="0 0 14 20" aria-hidden="true">
      <path
        d="M1 1v15l4-3.6 2.8 6 2.6-1.2-2.8-5.8H13z"
        fill="white"
        stroke="#3B3346"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Said({ what, x, y }) {
  return (
    <span
      className="absolute -translate-x-1/2 whitespace-nowrap font-mono text-[11px] text-[#C98A50]"
      style={{ left: x, top: y }}
    >
      {what === 'heart' ? (
        <svg viewBox="-5 -1 10 9" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M0 1.6c-1.6-2.4-5-1.2-4.2 1.4C-3.6 5 0 7 0 7s3.6-2 4.2-4c.8-2.6-2.6-3.8-4.2-1.4z" fill="#F08A93" />
        </svg>
      ) : (
        what
      )}
    </span>
  );
}

// Not yet seen (ghost): only her outline and her things', faint, with no
// stage or words.
export function Vignette({ moment, ghost = false }) {
  const { pose = 'sit', mood, facing = -1, lift = 0, tilt = 0, stage = 'edge', things = [], say, cursor } = moment;
  const Pose = ROAM_POSES[pose] ?? ROAM_POSES.sit;
  const x = SCENE.width / 2 + (moment.dx ?? 0);
  const y = moment.at ?? STAGE_FEET[stage] ?? DEFAULT_FEET;
  // (CatThing leaves front be.)
  const thing = ({ dx = 0, dy = 0, ...item }, index) => (
    <CatThing key={`${item.kind}-${index}`} {...item} x={x + dx} y={y + dy} />
  );
  return (
    <div
      className="relative"
      style={{
        width: SCENE.width,
        height: SCENE.height,
        ...(moment.zoom && { transform: `scale(${moment.zoom})`, transformOrigin: `${x}px ${y}px` }),
      }}
    >
      {!ghost && <Stage kind={stage} x={x} y={y} />}
      <div className="absolute inset-0" style={ghost ? { filter: 'brightness(0)', opacity: 0.1 } : undefined}>
        {things.filter((item) => !item.front).map(thing)}
        <svg
          viewBox="10 30 100 62"
          width={100 * UNIT}
          height={62 * UNIT}
          className="absolute left-0 top-0 overflow-visible"
          style={{ transform: `translate(${x - 50 * UNIT}px, ${y - lift - 58 * UNIT}px)` }}
          aria-hidden="true"
        >
          <g transform={tilt ? `rotate(${tilt} 60 88)` : undefined}>
            {/* Drawn facing left; mirrored about its feet to face right. */}
            <g transform={facing > 0 ? 'translate(120 0) scale(-1 1)' : undefined}>
              <Pose mood={mood} />
            </g>
          </g>
        </svg>
        {things.filter((item) => item.front).map(thing)}
      </div>
      {!ghost && cursor && <Cursor x={x + cursor.dx} y={y + cursor.dy} />}
      {!ghost && say && <Said what={say} x={x - 6} y={y - lift - 72} />}
    </div>
  );
}

const dateOf = (at) => new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

// A moment's card; one she has had, and can be asked to do again while she
// roams (onAgain), is a button that asks her.
function Moment({ moment, at, fresh, onAgain }) {
  const Card = onAgain ? 'button' : 'div';
  return (
    <li className="relative flex">
      <Card
        {...(onAgain && {
          type: 'button',
          onClick: onAgain,
          title: 'Again!',
          'aria-label': `${moment.label}. Do it again.`,
        })}
        className={`flex w-full flex-col items-center rounded-xl px-1 pb-2 pt-1 ${
          at ? 'border border-[#EADFCF] bg-white' : 'border border-dashed border-[#E3DCD1]'
        } ${
          onAgain
            ? 'transition-[box-shadow,border-color] hover:border-[#E3C9A8] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20'
            : ''
        }`}
      >
        <div className="overflow-hidden" style={{ width: SCENE.width * SHRINK, height: SCENE.height * SHRINK }}>
          {/* Still (her animations paused). */}
          <div className="[&_*]:!animate-none" style={{ transform: `scale(${SHRINK})`, transformOrigin: 'top left' }}>
            <Vignette moment={moment} ghost={!at} />
          </div>
        </div>
        <p className={`mt-1 text-center text-[11px] leading-snug ${at ? 'text-inkwell' : 'text-data-grey/70'}`}>
          {moment.label}
        </p>
        <p className="font-mono text-[10px] text-data-grey/80">{at ? dateOf(at) : '·'}</p>
      </Card>
      {fresh && (
        <span className="absolute right-1.5 top-1.5 rounded-full bg-[#F7E4CF] px-1.5 font-mono text-[9px] uppercase tracking-wide text-[#B0654F]">
          new
        </span>
      )}
    </li>
  );
}

// The scrapbook itself, over the page: each kind of moment with how many of
// it she has done, then a card for each.
// A page she has had, clicked while she roams, closes the book and asks her
// to do it again (where it can be asked for: see replayOf).
export function ScrapbookDialog({ open, onOpenChange, name, roaming = false }) {
  const { kept, viewed } = useScrapbook();
  const count = Object.keys(kept).length;
  const close = (next) => {
    // Looked through: what is new now is no longer new next time.
    if (!next) markViewed();
    onOpenChange(next);
  };
  const again = (code) => () => {
    close(false);
    setTimeout(() => window.dispatchEvent(new CustomEvent('bakery-cat-do', { detail: code })), 250);
  };
  return (
    <Dialog.Root open={open} onOpenChange={close}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#2B2A33]/20 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(86vh,820px)] w-[min(760px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[#EADFCF] bg-[#FBF8F3] shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <header className="border-b border-[#EFE6D9] px-5 pb-4 pt-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Dialog.Title className="font-tight text-lg font-semibold text-inkwell">
                  {name}’s scrapbook
                </Dialog.Title>
                <Dialog.Description className="mt-1 max-w-prose text-sm leading-relaxed text-data-grey">
                  Her firsts, fresh from the oven and kept in this browser.
                </Dialog.Description>
              </div>
              <Dialog.Close
                aria-label="Close"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-data-grey transition-colors hover:bg-[#F1EAE0] hover:text-inkwell focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20"
              >
                <X className="h-4 w-4" strokeWidth={2.25} />
              </Dialog.Close>
            </div>
            <div className="mt-3 flex items-center gap-3 font-mono text-[11px] text-data-grey">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F0E6D8]">
                <span
                  className="block h-full rounded-full bg-[#E39A55]"
                  style={{ width: `${(count / SCRAPBOOK_SIZE) * 100}%` }}
                />
              </span>
              <span className="tabular-nums text-inkwell">
                {count} of {SCRAPBOOK_SIZE}
              </span>
            </div>
          </header>
          <div className="overflow-y-auto overscroll-contain px-5 pb-6 sm:px-6">
            {SCRAPBOOK.map((group) => {
              const seen = group.moments.filter((moment) => kept[moment.id]).length;
              return (
                <section key={group.key} className="mt-5">
                  <h3 className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-widest text-data-grey">
                    <span>{group.title}</span>
                    <span className="tabular-nums">
                      {seen}/{group.moments.length}
                    </span>
                  </h3>
                  <ul className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
                    {group.moments.map((moment) => (
                      <Moment
                        key={moment.id}
                        moment={moment}
                        at={kept[moment.id]}
                        fresh={Boolean(kept[moment.id] && kept[moment.id] > viewed)}
                        onAgain={roaming && kept[moment.id] && replayOf(moment.id) ? again(replayOf(moment.id)) : null}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MORPH_MS, OutfitContext, ROAM_POSES, SETTLES, moodOf, seasonOutfit } from './BakeryCat';
import { JOY_EVENT, JOY_FADE, changeJoy, joyLevel, readJoy } from './joy';
import { keepMoment } from './scrapbook';
import { BAG_HEIGHT, BED_HALF, BED_LIFT, CONFETTI_S, CatThing, GIFTS, Gift, LOSS, WISHES, ToyIcon } from './CatThings';
import { RING_SERIES } from '../shared/DetailBoxes';

// The bakery cat let out to roam the page. It lives on the edges of the panels
// marked data-cat-perch that are in view: mostly resting on a panel's top edge
// as a loaf (or peeking over it), or round its side, peeking out; now and then
// strolling along its edge, climbing a side, hopping between top and side, or
// leaping to another panel, and leaping back into view when its panel scrolls
// away. It answers to its owner: a click and it purrs, a double click and it
// blinks slowly back, a few clicks and it rolls over and hops off, a press and
// hold to pet it, and it can be picked up and dropped on another panel. It
// plays with the pointer when it comes close, dozes off when the pointer has
// been still for a while (and stretches when it wakes), and when nobody has
// played with it for some time it knocks on its panel or wanders off. One pose
// blends into the next, with a crouch or a stretch between where a cat would.
// Only the cat itself takes clicks, and it keeps to the panels' edges.

// The drawing's box (its 120 x 100 frame cropped round the cat) and how big it
// is drawn.
const VIEW = { x: 10, y: 30, width: 100, height: 62 };
const WIDTH = 86;
const UNIT = WIDTH / VIEW.width;
const HEIGHT = VIEW.height * UNIT;
// Where its feet are, and where it is held when picked up, in that box.
const FEET = { x: (60 - VIEW.x) * UNIT, y: (88 - VIEW.y) * UNIT };
// Where a thought bubble starts, just off the tip of its ear (sitting up).
const BUBBLE = { x: (83 - VIEW.x) * UNIT, y: (23 - VIEW.y) * UNIT };
const SCRUFF = { x: (60 - VIEW.x) * UNIT, y: (30 - VIEW.y) * UNIT };
// Room it keeps from a panel's ends, from the top of the window (where the
// site's navigation bar sits) and from its sides.
const MARGIN = 58;
const TOP_CLEAR = 120;
// How far down the window a panel's top edge must be for the cat to sit on it
// with its head clear of the site's navigation bar (which stays put at the
// top), and at least TOP_CLEAR.
function topClear() {
  const bar = document.querySelector('nav')?.getBoundingClientRect();
  const under = bar && bar.bottom > 0 && bar.top <= 0 ? bar.bottom : 0;
  return Math.max(TOP_CLEAR, under + HEIGHT + 6);
}
const SIDE_CLEAR = 16;
// Paces, in pixels a second, and how long things take, in milliseconds.
const STROLL = 36;
const CHASE = 90;
const LEAP_MS = 720;
const HOP_MS = 480;
const DROP_MS = 380;
const SPRING_MS = 260;
// Held still over a panel (moving no more than STILL_PX) for TRAP_HOLD_MS
// before being let go, it is trapped inside it.
const STILL_PX = 6;
const TRAP_HOLD_MS = 2000;
// How fast it trots about while trapped in a panel, in pixels a second.
const TRAPPED_PACE = 160;
// How high above what is under it it can be carried before it takes fright.
const SCARED_AT = 140;
const SETTLE_MS = 1200;
const DOZE_AFTER = 3 * 60 * 1000;
// How long a nap lasts, in seconds, unless her mood says (FEELS, napFor).
const NAP_FOR = [8, 11];
// What may happen on a walk or a run along a panel's top edge, and how likely:
// a trip partway along, tumbling down onto a panel below (if one is in view);
// stopping to sniff; a fright at nothing, a jump and a look round; a pounce on
// a speck; or, running for the panel's end, a slip off it, left hanging by its
// front paws till it scrambles back up.
const MISHAPS = {
  walk: { trip: 0.12, sniff: 0.12, spook: 0.06, pounce: 0.06 },
  run: { trip: 0.25, slip: 0.2, spook: 0.05 },
};

// (All of its chances are written up in BEHAVIOUR.md, next to this file;
// keep the two in step.)
// How it carries itself on what it has eaten lately. Each time it stirs on a
// panel's top edge it picks one of four kinds of thing to do (plan): (i) a move
// (moves: a walk or a run along its edge, which may end in a trip and a tumble
// to a panel below; a leap to another panel; or a hop round to a panel's
// side); (ii) a visit to a running GPU's tile in view (gpus: bouncing on it
// till it tips, a warm nap, spinning its ring, running on its ring like a
// hamster wheel, or peekaboo behind it); (iii) a thought bubble wishing for
// something to do with its owner (a toy, a treat, a dance); or (iv) one of its
// other doings (IDLE, and its mood's own acts). Besides: its energy (low, it
// often just dozes on where it lies), its pace, its face, how soon it dozes
// off, how long it rests between, how far off it notices the pointer, and how
// likely it is to play keep-away with it. Starving, it drags itself about,
// begs and naps, too tired for games but glad of a warm GPU; well fed, it runs,
// kneads the panel ("makes biscuits"), gets the zoomies, plays hard to get and
// bounces on GPUs; full, it is at its liveliest, and hardly ever sleeps (dozes:
// the chance it dozes off when the pointer has been still for doze). Hungry,
// it naps a lot: in its beds, nodding off, flopping over, dreaming of cookies.
const FEELS = {
  napping: {
    energy: 0.15,
    pace: 0.55,
    face: 'hungry',
    restFace: 'hungry',
    doze: 25 * 1000,
    dozes: 1,
    napFor: [24, 40],
    rest: [14, 26],
    notice: 150,
    tease: 0,
    plan: { move: 0.35, card: 0.08, bubble: 0, other: 0.57 },
    moves: { walk: 0.85, leap: 0.15 },
    gpus: { warm: 1 },
    begs: true,
    acts: ['sleep', 'beg'],
  },
  hungry: {
    energy: 0.4,
    pace: 0.8,
    face: 'hungry',
    restFace: 'content',
    doze: 60 * 1000,
    dozes: 1,
    napFor: [16, 28],
    rest: [9, 18],
    notice: 170,
    tease: 0.08,
    plan: { move: 0.3, card: 0.1, bubble: 0.05, other: 0.55 },
    moves: { walk: 0.6, run: 0.1, leap: 0.2, side: 0.1 },
    gpus: { warm: 0.55, spin: 0.15, peekaboo: 0.15, oil: 0.15 },
    begs: true,
    acts: ['beg', 'groom', 'sleep'],
  },
  content: {
    energy: 0.65,
    pace: 1,
    face: 'content',
    restFace: 'purring',
    doze: DOZE_AFTER,
    dozes: 1,
    napFor: [20, 30],
    rest: [6, 13],
    notice: 170,
    tease: 0.2,
    plan: { move: 0.3, card: 0.12, bubble: 0.1, other: 0.48 },
    moves: { walk: 0.45, run: 0.2, leap: 0.2, side: 0.15 },
    gpus: {
      warm: 0.16,
      spin: 0.12,
      wobble: 0.15,
      wheel: 0.15,
      peekaboo: 0.08,
      swing: 0.1,
      steal: 0.08,
      kick: 0.08,
      oil: 0.08,
    },
    // (A nap twice: twice as likely as the others.)
    acts: ['groom', 'knead', 'sleep', 'sleep'],
  },
  purring: {
    energy: 0.85,
    pace: 1.2,
    face: 'content',
    restFace: 'purring',
    doze: DOZE_AFTER,
    dozes: 1,
    napFor: [18, 26],
    rest: [4, 9],
    notice: 210,
    tease: 0.4,
    plan: { move: 0.3, card: 0.13, bubble: 0.12, other: 0.45 },
    moves: { walk: 0.35, run: 0.3, leap: 0.2, side: 0.15 },
    gpus: {
      wobble: 0.19,
      wheel: 0.19,
      swing: 0.15,
      spin: 0.11,
      peekaboo: 0.06,
      warm: 0.05,
      steal: 0.09,
      kick: 0.08,
      oil: 0.08,
    },
    acts: ['knead', 'zoom', 'groom', 'sleep', 'sleep'],
  },
  loaf: {
    energy: 1,
    pace: 1.25,
    face: 'purring',
    restFace: 'purring',
    doze: DOZE_AFTER,
    // Full, it hardly ever sleeps.
    dozes: 0.03,
    rest: [3, 8],
    notice: 170,
    tease: 0.15,
    plan: { move: 0.3, card: 0.14, bubble: 0.18, other: 0.38 },
    moves: { walk: 0.3, run: 0.35, leap: 0.2, side: 0.15 },
    gpus: {
      wobble: 0.19,
      wheel: 0.19,
      swing: 0.15,
      spin: 0.11,
      peekaboo: 0.06,
      warm: 0.05,
      steal: 0.09,
      kick: 0.08,
      oil: 0.08,
    },
    acts: ['belly', 'groom', 'knead'],
  },
};
// What it does for each of those, for how long, and what it says.
const ACTS = {
  beg: { pose: 'beg', mood: 'hungry', ms: 3200, say: 'mew' },
  groom: { pose: 'groom', mood: 'purring', ms: 3000 },
  knead: { pose: 'knead', mood: 'purring', ms: 3600, say: 'prr' },
  belly: { pose: 'belly', mood: 'purring', ms: 4500, say: 'heart' },
};
const BORED_AFTER = 2 * 60 * 1000;
// Moves a cat makes between two poses, and for how long.
const BETWEEN = {
  'sleep>': ['stretch', 900],
  'rest>walk': ['crouch', 180],
  'rest>reach': ['crouch', 160],
  'walk>rest': ['crouch', 200],
};
// Its everyday poses, which it moves between (rather than fading): sitting up,
// lying down as a loaf, curled asleep, peeking over an edge, and coming up
// from behind one.
const MORPHS = new Set(['sit', 'rest', 'sleep', 'peek', 'emerge', 'lurk']);
// The face each of those wears whatever its mood.
const MORPH_FACE = { sleep: 'asleep', peek: 'content', emerge: 'content', lurk: 'content' };


const random = (from, to) => from + Math.random() * (to - from);
const page = (rect) => ({
  left: rect.left + window.scrollX,
  right: rect.right + window.scrollX,
  top: rect.top + window.scrollY,
  bottom: rect.bottom + window.scrollY,
});

// The panels it can sit on that are in view, with their top edges on screen.
function visiblePerches() {
  return [...document.querySelectorAll('[data-cat-perch]')].filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 2 * MARGIN + 40 && rect.top > topClear() && rect.top < window.innerHeight - 24;
  });
}

// Whether it fits on a panel's side: the panel tall enough and the side clear
// of the window's edge.
function sideFits(perch, side) {
  const rect = perch.getBoundingClientRect();
  if (rect.height < 120) return false;
  return side === 'left' ? rect.left > HEIGHT + SIDE_CLEAR : rect.right < window.innerWidth - HEIGHT - SIDE_CLEAR;
}

// A spot on a panel's edge: along the top from its left, or down a side from its top.
function spotOn(perch, along = null, side = 'top') {
  const edge = page(perch.getBoundingClientRect());
  // A GPU's tile, visited now and then: the middle of its top edge; its ring
  // (run on like a wheel): the top of the ring.
  if (perch.hasAttribute('data-cat-gpu')) return { x: (edge.left + edge.right) / 2, y: edge.top + 1 };
  if (perch.hasAttribute('data-cat-ring')) {
    // Measured by its holder, which does not turn as the ring spins.
    const holder = page(perch.parentElement.getBoundingClientRect());
    return { x: (holder.left + holder.right) / 2, y: holder.top + 2 };
  }
  if (side === 'top') {
    // (Kept clear of its ends; on one too narrow for that, the notes' little
    // all-clear croissant, at its middle.)
    const inset = Math.min(MARGIN, (edge.right - edge.left) / 2);
    const x = along ?? random(edge.left + inset, edge.right - inset);
    return { x: Math.min(edge.right - inset, Math.max(edge.left + inset, x)), y: edge.top + 1 };
  }
  const y = along ?? random(edge.top + 40, edge.bottom - 30);
  return {
    x: side === 'left' ? edge.left - 1 : edge.right + 1,
    y: Math.min(edge.bottom - 30, Math.max(edge.top + 40, y)),
  };
}

// How far its feet are above the panel beneath them (or the bottom of the window).
function heightAbove(x, feet) {
  const tops = [...document.querySelectorAll('[data-cat-perch]')]
    .map((element) => page(element.getBoundingClientRect()))
    .filter((edge) => x >= edge.left && x <= edge.right && edge.top >= feet - 10)
    .map((edge) => edge.top);
  return Math.min(window.scrollY + window.innerHeight, ...tops) - feet;
}

// A panel below a spot (in page coordinates), in view, to fall onto.
function perchBelow(x, y) {
  return visiblePerches()
    .map((element) => ({ element, edge: page(element.getBoundingClientRect()) }))
    .filter(({ edge }) => x > edge.left + 20 && x < edge.right - 20 && edge.top > y + 40 && edge.top < y + 520)
    .sort((a, b) => a.edge.top - b.edge.top)[0]?.element;
}

// The running GPUs' tiles in view, to visit.
function tileInView(element) {
  const rect = element.getBoundingClientRect();
  return rect.width > 40 && rect.top > topClear() && rect.bottom < window.innerHeight - 10;
}
function runningGpus() {
  return [...document.querySelectorAll('[data-cat-gpu][data-busy]')].filter(tileInView);
}
// The idle GPUs' tiles in view, to get running.
function idleGpus() {
  return [...document.querySelectorAll('[data-cat-gpu]:not([data-busy])')].filter(tileInView);
}

// A gentle shake of a panel, as if knocked on.
function shake(element) {
  element?.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-2px) rotate(-0.15deg)' },
      { transform: 'translateX(2px) rotate(0.15deg)' },
      { transform: 'translateX(-1px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 360, easing: 'ease-in-out' },
  );
}

// Little things it does now and then, when it stirs on a panel's top edge
// (with the things some of them bring: a butterfly, a box, a croissant, a
// sunbeam, a crumb), and which of them it is up to in each mood. And two more
// with the pointer: rubbing against it when it rests near, and pouncing on it
// when it whips past. (Notes: cheering the notes pill's all-clear, only while
// it shows.)
const IDLE = {
  // (A bed twice: twice as likely as the others.)
  napping: ['yawn', 'sunbeam', 'crumb', 'sneeze', 'bed', 'bed', 'doze', 'flop', 'dream'],
  hungry: ['crumb', 'yawn', 'sneeze', 'butterfly', 'box', 'birdwatch', 'bed', 'bed', 'doze', 'flop', 'dream', 'notes'],
  content: [
    'notes',
    'fling',
    'atyou',
    'bed',
    'bed',
    'doze',
    'butterfly',
    'box',
    'croissant',
    'sunbeam',
    'tail',
    'yawn',
    'sneeze',
    'crumb',
    'dance',
    'birdwatch',
    'scratch',
    'dough',
    'backflip',
  ],
  purring: [
    'notes',
    'fling',
    'atyou',
    'bed',
    'bed',
    'doze',
    'butterfly',
    'box',
    'croissant',
    'tail',
    'dance',
    'sneeze',
    'crumb',
    'sunbeam',
    'birdwatch',
    'scratch',
    'dough',
    'backflip',
  ],
  loaf: [
    'sunbeam',
    'box',
    'yawn',
    'croissant',
    'dance',
    'sneeze',
    'scratch',
    'dough',
    'backflip',
    'notes',
    'fling',
    'atyou',
  ],
};
const BUNT_EVERY = 15 * 1000;
// And some only at certain levels (her mood from her tummy, napping to loaf;
// her spirits, joy.js), added to the list when they apply: starving, an
// empty bowl; hungry or starving, a rumbling tummy; full, a food coma; in
// high spirits (and not hungry), pronking for joy; in low spirits, kicking a
// pebble.
const GATED = {
  emptybowl: (mood) => mood === 'napping',
  rumble: (mood) => mood === 'napping' || mood === 'hungry',
  foodcoma: (mood) => mood === 'loaf',
  pronk: (mood, spirits) => spirits === 'happy' && mood !== 'napping' && mood !== 'hungry',
  pebble: (mood, spirits) => spirits === 'sad' || spirits === 'glum',
};

// Soft colours for the notes and sparkles of a dance.
const NOTE_COLORS = {
  '♪': ['#E39A55', '#8EA2E8', '#D98E9C'],
  '♫': ['#B07AA1', '#5BBE98', '#E39A55'],
  '✦': ['#E3B655', '#F2B8C2', '#9FB4E8'],
  '~': ['#E39A55', '#E3B655', '#D98E9C'],
};

// How long the dot a click shows, and the menu it opens, stay up untouched.
const DOT_MS = 3500;
// How long a thought bubble with a toy it wishes for waits to be clicked.
const WISH_MS = 20000;
const MENU_MS = 6000;

// What it cheers as an idle GPU it has given some oil runs: a few of these, in
// Chinese, Japanese, Malay, Korean and Vietnamese, in a random order each time.
const CHEERS = ['加油!', '頑張れ!', 'Semangat!', '화이팅!', 'Cố lên!'];

// The GPU visits that move or shake a tile (or its ring), left out in quiet mode.
const MOVES_TILES = new Set(['wobble', 'steal', 'kick', 'spin', 'wheel', 'swing']);

// Pop-up cards (a GPU's details, a disk, a baker; not its own card): how near
// one must open to be noticed (from the cat's middle to the card's nearest
// edge), how much of the cat one must cover to have it blocked, how long it
// leaves before taking on a card it is under again, and what it does about
// one (see BEHAVIOUR.md): opened from its panel by a click, opened near it, or
// over it (then it never lets it be).
const POPUP_NEAR = 300;
const POPUP_BLOCKS = 0.35;
const POPUP_REST_MS = 6000;
const POPUP_OUTCOMES = {
  clicked: { nothing: 0.2, scared: 0.1, startle: 0.1, over: 0.6 },
  near: { nothing: 0.35, scared: 0.15, startle: 0.1, over: 0.4 },
  blocked: { scared: 0.4, over: 0.6 },
};
// What it may be up to for it to notice one.
const POPUP_MODES = new Set(['rest', 'sit', 'walk', 'act', 'sleep', 'tease', 'chase']);
// The bakery's card (behind the page's "Live" dot, BakeryStatus.jsx) she
// never lets be: whenever it opens, wherever she is, up onto its oven she goes
// (as soon as she is free to).
// Its oven's top, a perch the width of the oven's scene (OVEN_UNITS across in
// the scene's own units), saying how the oven is.
const OVEN_UNITS = 160;
function ovenOf(card) {
  return card?.querySelector?.('[data-cat-oven]') ?? null;
}
// A server's packing counter (its status pill's card, HostPacking.jsx), the
// same: its counter a perch, saying how the packing is. Either is a scene she
// goes to whenever its card opens.
function packOf(card) {
  return card?.querySelector?.('[data-cat-pack]') ?? null;
}
function sceneOf(card) {
  return ovenOf(card) ?? packOf(card);
}
// How long after one earned cookie before the next is handed out.
const COOKIE_REST_MS = 3 * 60 * 1000;
// Presents it leaves by the notes pill: no sooner than GIFT_EVERY_MS after the
// last, at a GIFT_CHANCE of its stirs, while none is waiting to be picked up
// (kept in this browser, the one waiting and when the last came).
const GIFT_KEY = 'gpu-status-cat-gift';
const GIFT_LAST_KEY = 'gpu-status-cat-gift-last';
const GIFT_EVERY_MS = 3 * 3600 * 1000;
const GIFT_CHANCE = 0.05;
// The day it last said hello (in this browser), for its first hello each day.
const HELLO_KEY = 'gpu-status-cat-hello';
const stored = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const store = (key, value) => {
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked.
  }
};
const dayKey = () => new Date().toLocaleDateString('en-CA');

// The pop-up card in a wrapper Radix put in the page: a dialog (not a menu or
// a tooltip), and not the cat's own card.
function popupCard(wrapper) {
  const card = wrapper?.querySelector?.('[role="dialog"]');
  return card && !card.querySelector('[data-cat-card]') ? card : null;
}
function openPopups() {
  return [...document.querySelectorAll('[data-radix-popper-content-wrapper]')].map(popupCard).filter(Boolean);
}
// How much of the cat, standing at x, y, a box (in the page) covers, 0 to 1.
function coverOf(edge, x, y) {
  const wide = Math.min(x + WIDTH / 2, edge.right) - Math.max(x - WIDTH / 2, edge.left);
  const high = Math.min(y, edge.bottom) - Math.max(y - HEIGHT, edge.top);
  return wide > 0 && high > 0 ? (wide * high) / (WIDTH * HEIGHT) : 0;
}
// How far a box (in the page) is from a point.
function gapTo(edge, x, y) {
  return Math.hypot(Math.max(edge.left - x, 0, x - edge.right), Math.max(edge.top - y, 0, y - edge.bottom));
}

// The notes pill (bottom right), while notices wait for her viewer: of the
// times she would do something, now and then (NOTES_CHANCE, and not again for
// NOTES_REST_MS) she goes and sits on it to catch their eye instead (see
// BEHAVIOUR.md). Once the notes have been opened she leaves them be for
// NOTES_SEEN_MS.
const NOTES_CHANCE = 0.2;
const NOTES_REST_MS = 2 * 60 * 1000;
const NOTES_SEEN_MS = 10 * 60 * 1000;
// The pill while it shows one of these (data-cat-notes: "pill" with notices
// waiting, "clear" as its all-clear croissant, "quiet" hidden for now; "open"
// and "clear-open" opened), in view.
function notesIn(...shown) {
  const notes = document.querySelector('[data-cat-notes]');
  if (!notes || !shown.includes(notes.getAttribute('data-cat-notes'))) return null;
  const rect = notes.getBoundingClientRect();
  return rect.width > 30 && rect.top > topClear() && rect.bottom <= window.innerHeight ? notes : null;
}
// Where a spot along a panel's top is measured from: its left end; but the
// notes pill's right end, since it grows leftwards as it opens.
const fromEnd = (perch, edge) => (perch.hasAttribute('data-cat-notes') ? edge.right : edge.left);
const easeInOut = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
// Two poses taken in turn, every so many milliseconds: the strides of a run.
const strides = (one, two, every) => (time) => (Math.floor(time / every) % 2 ? one : two);

// Her spirits for the day (see joy.js) on top of her mood: what each level
// changes. Sad, she has little go in her, plays no games, often (sadness)
// mopes, sulks, sits under her own rain cloud or cries instead of what she
// would have done, and often ignores the pointer; glum, a little of the same;
// happy, more go, more games, and a dance or the zoomies now and then (cheer).
// (Low, nothing lively either: no dances, backflips, tail chases or
// zoomies, and only the quiet GPU card visits.)
const LIVELY = new Set(['dance', 'backflip', 'tail', 'zoom']);
const BOISTEROUS = new Set(['wobble', 'wheel', 'swing', 'steal', 'kick', 'spin']);
const quietGpus = (gpus) => {
  const calm = Object.fromEntries(Object.entries(gpus).filter(([name]) => !BOISTEROUS.has(name)));
  return Object.keys(calm).length ? calm : { warm: 1 };
};
const JOY_FEELS = {
  sad: (base) => ({
    energy: base.energy * 0.6,
    pace: base.pace * 0.7,
    moves: { walk: 0.85, leap: 0.15 },
    tease: 0,
    sadness: 0.55,
    ignores: 0.6,
    face: 'sad',
    restFace: 'sad',
    gpus: { warm: 0.7, peekaboo: 0.3 },
    low: true,
  }),
  glum: (base) => ({
    energy: base.energy * 0.85,
    pace: base.pace * 0.85,
    moves: { ...base.moves, run: (base.moves.run ?? 0) * 0.3 },
    tease: base.tease * 0.5,
    sadness: 0.15,
    ignores: 0.2,
    restFace: 'sad',
    gpus: quietGpus(base.gpus),
    low: true,
  }),
  happy: (base) => ({
    energy: Math.min(1, base.energy + 0.1),
    tease: Math.min(0.6, base.tease * 1.5 + 0.05),
    cheer: 0.12,
  }),
};
// How much each thing lifts (or knocks) her spirits.
const JOY = {
  click: 3,
  pet: 5,
  treat: 10,
  cookie: 6,
  blink: 2,
  gift: 6,
  hello: 4,
  toy: 10,
  game: 8,
  played: 6,
  wish: 12,
  caught: 6,
  dance: 5,
  asked: 3,
  noticed: 5,
  fright: -2,
  drop: -4,
  trapped: -3,
  fall: -6,
};

// What a click on the cat offers.
const OPTIONS = [
  ['treat', 'Give a treat'],
  ['toy', 'Toss a toy'],
  ['dance', 'Dance'],
  ['follow', 'Follow me'],
  ['home', 'Send home'],
];
// Follow me: after the pointer through the air for a while (FOLLOW_MS), one
// of these ways (never the same twice running), each with how fast it can go
// (px a second) and how it bobs (px, every rate ms): gliding like a flying
// squirrel, on a toaster jetpack, on a broomstick, doggy-paddling, riding a
// flying croissant, or holding a balloon.
const FOLLOW_MS = [10000, 15000];
const FOLLOWS = {
  glide: { speed: 360, bob: 3, rate: 900 },
  jet: { speed: 440, bob: 1.5, rate: 160 },
  broom: { speed: 380, bob: 3, rate: 700 },
  paddle: { speed: 220, bob: 4, rate: 520 },
  croissant: { speed: 300, bob: 5, rate: 1100 },
  balloon: { speed: 190, bob: 6, rate: 1300 },
};

export default function RoamingCat({ onHome, meal, peek = false, quiet = false }) {
  const box = useRef(null);
  const cat = useRef(null);
  const menuBox = useRef(null);
  const tilt = useRef(null);
  const homeRef = useRef(onHome);
  homeRef.current = onHome;
  // Quiet mode: it does not move or shake anything of the page's.
  const quietRef = useRef(quiet);
  quietRef.current = quiet;
  const moodRef = useRef('content');
  moodRef.current = moodOf(meal);
  // Its owner's cookies today (one a GPU-hour their jobs held): each time the
  // count goes up a whole one, one is due to her, handed out of a little oven
  // (one at a time; the count starting again at midnight is not one).
  const cookies = useRef({ seen: null, due: false });
  const today = Math.floor(meal?.today ?? 0);
  if (meal && cookies.current.seen !== null && today > cookies.current.seen) cookies.current.due = true;
  if (meal) cookies.current.seen = today;
  const layer = useRef(null);
  const mealRef = useRef(meal);
  mealRef.current = meal;
  // A present it left by the notes pill, waiting to be picked up.
  const [gift, setGift] = useState(() => {
    try {
      return JSON.parse(stored(GIFT_KEY) ?? 'null');
    } catch {
      return null;
    }
  });
  const giftRef = useRef(gift);
  giftRef.current = gift;
  // What it wears for the season, if anything (a witch's hat, a scarf, a red bow).
  const [outfit, setOutfit] = useState(() => seasonOutfit());
  const outfitRef = useRef(outfit);
  outfitRef.current = outfit;
  const [menu, setMenu] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [look, setLook] = useState({
    pose: null,
    facing: -1,
    mood: 'content',
    side: 'top',
    flip: 1,
    previous: null,
    change: 0,
  });
  const [effects, setEffects] = useState([]);
  const [things, setThings] = useState([]);
  const [wish, setWish] = useState(null);
  const [heli, setHeli] = useState(null);

  // Hearts, "prr", z's or a crunch rising off the cat for a moment.
  const say = (kind) => {
    const id = `${kind}-${performance.now()}`;
    setEffects((current) => [...current.slice(-4), { id, kind }]);
    setTimeout(() => setEffects((current) => current.filter((item) => item.id !== id)), 1700);
  };

  useEffect(() => {
    const now = performance.now();
    // Out of the owner's name and onto the first panel in view.
    const start = document.querySelector('[data-cat-home]')?.getBoundingClientRect();
    const state = {
      mode: 'idle',
      x: start ? start.left + window.scrollX + start.width / 2 : window.scrollX + window.innerWidth - 80,
      y: start ? start.top + window.scrollY : window.scrollY + 120,
      facing: -1,
      side: 'top',
      perch: null,
      along: 0,
      until: now,
      pointer: { x: -9999, y: -9999, at: 0 },
      scrolledAt: 0,
      lastPlay: now,
      chaseRest: 0,
      clicks: [],
      press: null,
    };
    cat.current = state;

    // The pose shown, blending from the last, through a move between them
    // where a cat would make one.
    let shown = { pose: '', facing: 0, mood: '', side: '' };
    let between = null;
    const show = (wanted, mood = 'content') => {
      const time = performance.now();
      if (between && time < between.until) return;
      between = null;
      // A move through in-betweens just over: it is in the pose it was going
      // to (the move's last drawing is that very pose's, so no fading).
      if (shown.settledInto) {
        const into = shown.settledInto;
        setLook((current) => ({ ...current, pose: into, morph: null, previous: null }));
        shown = { ...shown, pose: into, settledInto: null };
      }
      // From a walk it lies down before sinking to peek over its edge.
      const pose = wanted === 'peek' && shown.pose === 'walk' ? 'rest' : wanted;
      const side =
        state.mode === 'leap' || state.mode === 'held' ? 'top' : state.mode === 'fall' ? state.targetSide : state.side;
      // On a side it clings on upright, drawn out to the right of the edge and
      // mirrored for a left side; elsewhere it faces the way it is going.
      const flip = side === 'left' ? -1 : side === 'right' ? 1 : -state.facing;
      if (pose === shown.pose && flip === shown.flip && mood === shown.mood && side === shown.side) return;
      // Between two everyday poses, facing the same way: it moves from one to
      // the other, then settles into the new pose. Through drawn in-betweens
      // where it has them (lying down, sitting or getting up), which start and
      // end on the poses' own drawings, so without fading in or out.
      const settle = SETTLES[`${shown.pose}>${pose}`];
      if (
        pose !== shown.pose &&
        (settle || (MORPHS.has(pose) && MORPHS.has(shown.pose))) &&
        flip === shown.flip &&
        side === shown.side &&
        time - (shown.since ?? 0) > 300 &&
        !(shown.pose === 'sleep' && pose !== 'rest')
      ) {
        const morph = {
          from: shown.pose,
          to: pose,
          fromMood: MORPH_FACE[shown.pose] ?? shown.mood,
          toMood: MORPH_FACE[pose] ?? mood,
        };
        between = { until: time + (settle ? settle.ms : MORPH_MS) };
        setLook((current) => ({
          pose: 'morph',
          morph,
          flip,
          mood,
          side,
          previous: settle ? null : current.pose,
          previousMorph: current.morph,
          previousFlip: current.flip,
          previousMood: current.mood,
          change: current.change + (settle ? 0 : 1),
        }));
        shown = { pose: 'morph', flip, mood, side, since: time, settledInto: settle ? pose : null };
        return;
      }
      const step = shown.pose && pose !== shown.pose && (BETWEEN[`${shown.pose}>${pose}`] ?? BETWEEN[`${shown.pose}>`]);
      const next = step ? step[0] : pose;
      if (step) between = { until: time + step[1] };
      // Otherwise it just changes, at once: a crossfade leaves a see-through
      // double (or, turning round, a mirrored ghost beside it) for a moment.
      const changed = next !== shown.pose || flip !== shown.flip;
      setLook((current) => ({
        pose: next,
        flip,
        mood,
        side,
        previous: null,
        previousMorph: current.morph,
        previousFlip: current.flip,
        previousMood: current.mood,
        change: current.change,
      }));
      shown = { pose: next, flip, mood, side, since: changed ? time : shown.since };
    };
    const place = () => {
      const anchor = state.mode === 'held' ? SCRUFF : FEET;
      // Lifted off its edge a little in some of its doings: a hop, a pounce, in a box.
      const lift = ['script', 'tease', 'game', 'slip'].includes(state.mode) ? (state.lift ?? 0) : 0;
      if (box.current) {
        const left = state.x - anchor.x;
        const top = state.y - anchor.y - lift;
        box.current.style.transform = `translate(${left}px, ${top}px)`;
        box.current.style.opacity = state.hidden ? '0' : '';
        // Trapped in a panel, only what is within its walls shows.
        if (state.inside && !state.escaping) {
          const edge = page(state.inside.getBoundingClientRect());
          const [l, t, r, b] = [edge.left - left, edge.top - top, edge.right - left, edge.bottom - top];
          box.current.style.clipPath = `polygon(${l}px ${t}px, ${r}px ${t}px, ${r}px ${b}px, ${l}px ${b}px)`;
        } else if (box.current.style.clipPath) box.current.style.clipPath = '';
      }
      // Its eyes on the pointer while it is awake (in its drawing's units,
      // mirrored as it is drawn), and its head tilted a moment now and then.
      if (box.current) {
        const now = performance.now();
        const awake = state.mode !== 'sleep' && shown.mood !== 'asleep' && !['sleep', 'snooze'].includes(shown.pose);
        let [lookX, lookY] = [0, 0];
        if (awake && state.pointer.cx != null) {
          const dx = state.pointer.cx + window.scrollX - state.x;
          const dy = state.pointer.cy + window.scrollY - (state.y - 36 - lift);
          const far = Math.hypot(dx, dy) || 1;
          const reach = Math.min(1, far / 80);
          lookX = (dx / far) * 1.4 * reach * (shown.flip < 0 ? -1 : 1);
          lookY = (dy / far) * reach;
        }
        box.current.style.setProperty('--cat-look-x', `${lookX.toFixed(2)}px`);
        box.current.style.setProperty('--cat-look-y', `${lookY.toFixed(2)}px`);
        box.current.style.setProperty('--cat-tilt', `${now < (state.tiltUntil ?? 0) ? state.tiltSign * 11 : 0}deg`);
      }
      // Up on the bakery's oven, or on her way up there, down off it or away,
      // she is drawn over its card (pop-ups are z-50).
      if (layer.current) {
        const oven = (element) =>
          element?.isConnected &&
          (element.hasAttribute('data-cat-scene') ||
            element.hasAttribute('data-cat-oven') ||
            element.hasAttribute('data-cat-oven-front'));
        const leaping = state.mode === 'leap' && (oven(state.target) || oven(state.leapFrom));
        layer.current.style.zIndex = oven(state.perch) || oven(state.go?.card) || leaping ? '55' : '';
      }
      if (tilt.current) {
        // Its nose is on the left unless the drawing is mirrored to face right.
        const nose = state.facing < 0 ? 1 : -1;
        // A rocking on its feet: dying away as it finds its balance after a
        // drop, or a wiggle, a sway or a dizzy wobble in its doings.
        const rocking =
          state.mode === 'wobble'
            ? { amp: 10, freq: 2.2, decay: 3, from: state.started }
            : state.mode === 'trip'
              ? { amp: 12, freq: 5, decay: 0, from: state.until - 520 }
              : state.mode === 'script' || state.mode === 'enter' || state.mode === 'go'
                ? state.rock
                : null;
        const turn = (box, origin, angle) => {
          tilt.current.style.transformBox = box;
          tilt.current.style.transformOrigin = origin;
          tilt.current.style.transform = angle ? `rotate(${angle}deg)` : '';
        };
        if (['script', 'enter', 'plummet', 'go'].includes(state.mode) && state.spin != null) {
          // Turning head over heels (a backflip), round its middle.
          turn('fill-box', 'center', state.spin);
        } else if (state.mode === 'held') {
          // Swinging from its scruff (60, 30 in the drawing).
          turn('view-box', '60px 30px', state.swing ?? 0);
        } else if (rocking) {
          const seconds = (performance.now() - rocking.from) / 1000;
          const rock =
            rocking.amp * Math.exp(-rocking.decay * seconds) * Math.sin(2 * Math.PI * rocking.freq * seconds);
          // Round its feet, or (hanging) round its paws on the edge (60, 88).
          if (rocking.origin === 'paws') turn('view-box', '60px 88px', rock);
          else turn('fill-box', 'center bottom', rock);
        } else {
          tilt.current.style.transformBox = 'fill-box';
          tilt.current.style.transformOrigin = 'center';
          tilt.current.style.transform =
            state.mode === 'leap' || state.mode === 'go' || state.mode === 'follow'
              ? `rotate(${(state.tilt ?? 0) * nose}deg)`
              : '';
        }
      }
    };
    // The menu a click opens; while it is open the cat stays where it is.
    // A click on it first shows just a small dot; the dot opens the menu.
    // Either goes away by itself after a while (the menu not while the
    // pointer is on it).
    const closeMenu = () => {
      clearTimeout(state.menuTimer);
      state.menu = false;
      setMenu(false);
    };
    const menuFor = (phase, ms) => {
      clearTimeout(state.menuTimer);
      state.menu = phase;
      setMenu(phase);
      if (ms) state.menuTimer = setTimeout(closeMenu, ms);
    };
    const openMenu = () => menuFor('dot', DOT_MS);
    state.expandMenu = () => menuFor('open', MENU_MS);
    state.holdMenu = (holding) => menuFor('open', holding ? 0 : MENU_MS / 2);
    // Sent home: a last leap back into its owner's name, fading as it goes.
    const goHome = () => {
      closeMenu();
      const home = document.querySelector('[data-cat-home]')?.getBoundingClientRect();
      if (!home) {
        homeRef.current?.();
        return;
      }
      const to = { x: home.left + window.scrollX + home.width / 2, y: home.top + window.scrollY + home.height };
      Object.assign(state, {
        mode: 'leap',
        from: { x: state.x, y: state.y },
        to,
        target: null,
        homing: true,
        started: performance.now(),
        duration: LEAP_MS,
        height: 40,
      });
      state.side = 'top';
      state.facing = to.x < state.x ? -1 : 1;
      setLeaving(true);
    };
    const leapTo = (perch, along = null, duration = LEAP_MS, side = 'top') => {
      if (!perch) return;
      closeMenu();
      if (perch !== state.perch) releaseTile();
      // Off a panel, it crouches to spring first.
      if (state.perch && duration !== DROP_MS && state.mode !== 'spring') {
        state.mode = 'spring';
        state.until = performance.now() + SPRING_MS;
        state.spring = [perch, along, duration, side];
        return;
      }
      const to = spotOn(perch, along, side);
      // Let go, it glides straight down to its spot; otherwise it leaps there.
      const falling = duration === DROP_MS;
      Object.assign(state, {
        mode: falling ? 'fall' : 'leap',
        leapFrom: state.perch,
        gravity: false,
        tumbling: false,
        from: { x: state.x, y: state.y },
        to,
        target: perch,
        targetSide: side,
        started: performance.now(),
        duration,
        height: 30 + Math.abs(to.y - state.y) * 0.25,
      });
      state.side = 'top';
      if (!falling) state.facing = to.x < state.x ? -1 : 1;
    };
    // Her spirits, kept in step with the bar on her card.
    let joy = readJoy();
    const onJoy = (event) => (joy = event.detail);
    window.addEventListener(JOY_EVENT, onJoy);
    const cheerUp = (amount) => {
      state.joyedAt = performance.now();
      joy = changeJoy(amount);
    };
    const feel = () => {
      const base = FEELS[moodRef.current] ?? FEELS.content;
      const level = JOY_FEELS[joyLevel(joy)];
      return level ? { ...base, ...level(base) } : base;
    };
    // Her scrapbook (scrapbook.js): the first time she does each thing, a new
    // page, with a little book rising off her. Not while she is doing what she
    // was asked for from the list on her card (state.manual, till she next
    // rests or something else of her own starts).
    const saw = (id) => {
      if (!state.manual && keepMoment(id)) say('page');
    };
    // A table of her doings, each noted (as group:name) as it starts.
    const noted = (group, table) =>
      Object.fromEntries(
        Object.entries(table).map(([name, make]) => [name, (...args) => (saw(`${group}:${name}`), make(...args))]),
      );
    // One of its mood's own doings, or a nap, or a dash along its panel.
    // Curled up asleep, for a nap's length (longer, hungrier), unless the
    // pointer comes near her first.
    const fallAsleep = (time) => {
      state.mode = 'sleep';
      state.until = time + random(...(feel().napFor ?? NAP_FOR)) * 1000;
    };
    const act = (name, time) => {
      saw(`act:${name}`);
      if (name === 'sleep') {
        fallAsleep(time);
        return;
      }
      if (name === 'zoom') {
        const edge = page(state.perch.getBoundingClientRect());
        const far = state.x < (edge.left + edge.right) / 2 ? edge.right - MARGIN : edge.left + MARGIN;
        state.mode = 'zoom';
        state.zooms = [far, random(edge.left + MARGIN, edge.right - MARGIN)];
        return;
      }
      const doing = ACTS[name];
      state.mode = 'act';
      state.act = doing;
      state.until = time + doing.ms;
      if (doing.say) say(doing.say);
    };
    const rest = (time, seconds = feel().rest) => {
      state.manual = false;
      if (things.current) putThing(null);
      if (state.wish) wishFor(null);
      state.spin = null;
      state.hidden = false;
      state.lift = 0;
      state.rock = null;
      state.mode = 'rest';
      state.until = time + random(...seconds) * 1000;
      // On a top edge, mostly a loaf, sometimes peeking over; on a side, clinging on.
      state.restPose = state.side !== 'top' ? 'cling' : Math.random() < 0.8 ? 'rest' : 'peek';
    };
    // A panel nearby to bolt to, on the far side of the cat from the pointer.
    const escapePerch = () => {
      const from = { x: state.x - window.scrollX, y: state.y - window.scrollY };
      const pointer = { x: state.pointer.x - window.scrollX, y: state.pointer.y - window.scrollY };
      return visiblePerches()
        .filter((element) => element !== state.perch)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const centre = {
            x: Math.min(rect.right - MARGIN, Math.max(rect.left + MARGIN, from.x)),
            y: rect.top,
          };
          const distance = Math.hypot(centre.x - from.x, centre.y - from.y);
          const away =
            Math.hypot(centre.x - pointer.x, centre.y - pointer.y) > Math.hypot(from.x - pointer.x, from.y - pointer.y);
          return { element, distance, away };
        })
        .filter(({ away, distance }) => away && distance < 600)
        .sort((a, b) => a.distance - b.distance)[0]?.element;
    };
    // A game of keep-away: some games it is slow and easy to catch, some quick.
    const startTease = (time) => {
      saw('pointer:tease');
      const roll = Math.random();
      Object.assign(state, {
        mode: 'tease',
        until: time + 7000,
        lastNear: time,
        lift: 0,
        dart: null,
        teaseFrom: time,
        teasePace: roll < 0.4 ? 0.55 : roll < 0.8 ? 1 : 1.5,
      });
    };
    // How quick it is in this game, flagging as the game goes on.
    const teasePace = (time) => (state.teasePace ?? 1) * Math.max(0.6, 1 - (time - (state.teaseFrom ?? time)) / 15000);
    // A dodge away from a grab: a quick hop off along its edge (or over the
    // grab, at an end).
    const dodge = (fromX, time) => {
      if (!state.perch || onSide()) return;
      const away = state.x >= fromX ? 1 : -1;
      let to = onEdge(state.x + away * 150);
      if (Math.abs(to - state.x) < 40) to = onEdge(state.x - away * 170);
      state.dart = { from: state.x, to, started: time };
      state.facing = to < state.x ? -1 : 1;
      state.lastNear = time;
    };
    // Caught! It gives in, rolls belly-up and purrs.
    const caught = (time) => {
      saw('pointer:caught');
      cheerUp(JOY.caught);
      state.dart = null;
      state.resume = null;
      state.chaseRest = time + 4000;
      play(
        [
          { pose: 'belly', mood: 'purring', ms: 2400, start: () => (say('heart'), say('prr')) },
          { pose: 'sit', mood: 'purring', ms: 1200, start: () => say('heart') },
        ],
        time,
      );
    };
    // Playing with a toy: yarn rolled along the edge; a feather on a string
    // from the pointer; a laser dot that follows the pointer along the edge; a
    // wind-up mouse zipping to and fro; bubbles floating up to be popped.
    const startGame = (kind, time) => {
      if (!state.perch || onSide()) return;
      saw(`game:${kind}`);
      cheerUp(JOY.game);
      if (kind === 'yarn') {
        rollYarn();
        return;
      }
      const dir = roomy();
      state.mode = 'game';
      state.lift = 0;
      state.game = {
        kind,
        until: time + (kind === 'bubbles' ? 16000 : 13000),
        nextPounce: time + 500,
        hop: null,
        dot: { perch: state.perch, x: onEdge(state.x + dir * 90) },
        mouse: { x: onEdge(state.x + dir * 130), dir, speed: 120, pauseUntil: time + 700 },
        catches: 0,
        bubbles: [],
        spawned: 0,
        swing: 0,
      };
      state.lastPlay = time;
      say('♪');
    };
    // The laser dot, from the pointer: on the top edge of the card it is
    // over or just above (the smallest, where cards sit in cards); it stays
    // put while the pointer is away from every card or still a while. Drawn
    // wherever it is, while she plays or leaps after it.
    const aimLaser = (time) => {
      const game = state.game;
      const { x, y, at } = state.pointer;
      const live = time - at < 5000;
      // Which card (a heavier look round the page, so every 90 ms)...
      if (time > (game.aimAt ?? 0)) {
        game.aimAt = time + 90;
        let best = null;
        if (live) {
          for (const element of visiblePerches()) {
            const edge = page(element.getBoundingClientRect());
            if (x < edge.left + 12 || x > edge.right - 12) continue;
            const gap = y >= edge.top - 30 && y <= edge.bottom ? 0 : Math.abs(y - edge.top);
            if (gap > 140) continue;
            const score = gap * 10000 + (edge.bottom - edge.top);
            if (!best || score < best.score) best = { perch: element, score };
          }
        }
        game.aimed = best?.perch ?? null;
      }
      // ...and where along it, every frame, so the dot keeps up with the pointer.
      if (live && game.aimed?.isConnected) {
        const edge = page(game.aimed.getBoundingClientRect());
        game.dot = { perch: game.aimed, x: Math.min(edge.right - 14, Math.max(edge.left + 14, x)) };
      }
      const { perch, x: dotX } = game.dot;
      if (perch.isConnected) putThing({ kind: 'laser', x: dotX, y: page(perch.getBoundingClientRect()).top });
    };
    const endGame = (time) => {
      cheerUp(JOY.played);
      putThing(null);
      state.game = null;
      state.lift = 0;
      state.chaseRest = time + 4000;
      sit(time, 'purring', 1600);
      say('heart');
    };
    // A hop within a game: across to a spot, or straight up, with something
    // done at its height and on landing.
    const gameHop = (to, height, ms, pose, extra = {}) => {
      state.facing = to === state.x ? state.facing : to < state.x ? -1 : 1;
      state.game.hop = { from: state.x, to, height, ms, pose, started: performance.now(), ...extra };
    };
    // A pick from a table of weights ({ name: weight }), leaving out a name.
    const pick = (weights, except = null) => {
      const names = Object.keys(weights).filter((name) => name !== except && weights[name] > 0);
      let roll = Math.random() * names.reduce((total, name) => total + weights[name], 0);
      return names.find((name) => (roll -= weights[name]) < 0) ?? names[names.length - 1];
    };
    // What it does when it stirs on a panel's top edge: one of four kinds of
    // thing (its mood's plan), and within that one thing (see FEELS).
    const decide = (time) => {
      state.manual = false;
      // Dressed up for the season: a page for it.
      if (outfitRef.current) saw(`season:${outfitRef.current}`);
      // Its first stir of the day: hello.
      if (helloDue && !onSide()) {
        helloDue = false;
        store(HELLO_KEY, dayKey());
        play(hello(), time);
        return;
      }
      // Now and then, a present for the notes pill.
      const pill = notesIn('pill', 'clear', 'quiet');
      if (
        !giftRef.current &&
        pill &&
        !onSide() &&
        Date.now() - Number(stored(GIFT_LAST_KEY) ?? 0) > GIFT_EVERY_MS &&
        Math.random() < GIFT_CHANCE
      ) {
        play(bringGift(pill), time);
        return;
      }
      // A cookie her owner has earned: out of a little oven, first thing.
      if (cookies.current.due && time > (state.cookieRest ?? 0)) {
        cookies.current.due = false;
        state.cookieRest = time + COOKIE_REST_MS;
        play(earned.cookie(), time);
        return;
      }
      // Notices waiting for her viewer: now and then she goes to call them over.
      if (time > (state.notesRest ?? 0) && Math.random() < NOTES_CHANCE && visitNotes(notesIn('pill'), time)) return;
      // Low in spirits, she often does something sad instead; high, now and
      // then she dances or gets the zoomies.
      if (Math.random() < (feel().sadness ?? 0)) {
        const names = ['cry', 'rain', 'sulk', 'mope'].filter((name) => name !== state.lastSad);
        const name = names[Math.floor(Math.random() * names.length)];
        state.lastSad = name;
        play(doings[name](), time);
        return;
      }
      if (Math.random() < (feel().cheer ?? 0)) {
        if (Math.random() < 0.5) play(doings.dance(), time);
        else act('zoom', time);
        return;
      }
      const plan = feel().plan;
      let kind = pick(plan);
      // A card visit with no running GPU in view, or a wish it is too low for,
      // becomes one of its other doings.
      if (kind === 'card' && !runningGpus().length && !idleGpus().length) kind = 'other';
      if (kind === 'card') {
        visitGpu(pick(feel().gpus));
      } else if (kind === 'bubble') {
        play(doings.wish(), time);
      } else if (kind === 'other') {
        const others = [
          ...(IDLE[moodRef.current] ?? IDLE.content),
          ...feel().acts,
          ...Object.keys(GATED).filter((name) => GATED[name](moodRef.current, joyLevel(joy))),
        ];
        // (Off to her notes only to cheer the all-clear: notices waiting have
        // their own chance, above.)
        const clear = notesIn('clear');
        const choices = others.filter(
          (name) => name !== state.lastIdle && !(feel().low && LIVELY.has(name)) && (name !== 'notes' || clear),
        );
        const name = choices[Math.floor(Math.random() * choices.length)];
        state.lastIdle = name;
        if (name === 'notes') visitNotes(clear, time);
        else if (doings[name]) play(doings[name](), time);
        else act(name, time);
      } else {
        const move = pick(feel().moves);
        const other = move === 'leap' ? otherPerch() : null;
        if (move === 'run') stroll(true);
        else if (move === 'leap' && other) leapTo(other);
        else if (move === 'side') {
          const edge = page(state.perch.getBoundingClientRect());
          const side = state.x < (edge.left + edge.right) / 2 ? 'left' : 'right';
          if (sideFits(state.perch, side)) leapTo(state.perch, null, HOP_MS, side);
          else stroll();
        } else stroll();
      }
    };
    const otherPerch = () => {
      const perches = visiblePerches().filter((element) => element !== state.perch);
      return perches[Math.floor(Math.random() * perches.length)];
    };
    const sit = (time, mood, ms) => {
      state.mode = 'sit';
      state.mood = mood;
      state.until = time + ms;
    };
    const onSide = () => state.side !== 'top';
    // A stroll along its edge (or a climb along its side) to somewhere a fair
    // way off; along a top edge it may trip partway (if there is a panel below
    // to fall onto).
    const stroll = (running = false) => {
      const edge = page(state.perch.getBoundingClientRect());
      const [low, high] = onSide() ? [edge.top + 40, edge.bottom - 30] : [edge.left + MARGIN, edge.right - MARGIN];
      const at = onSide() ? state.y : state.x;
      let goal = random(low, high);
      for (let tries = 0; tries < 4 && Math.abs(goal - at) < 60; tries++) goal = random(low, high);
      state.mode = 'walk';
      state.goal = goal;
      state.walkFrom = state.x;
      state.running = running && !onSide();
      state.mishap = null;
      if (onSide()) return;
      let roll = Math.random();
      const kind = Object.entries(MISHAPS[state.running ? 'run' : 'walk']).find(
        ([, chance]) => (roll -= chance) < 0,
      )?.[0];
      if (kind === 'slip') {
        // Off for the far end of the panel, to slip off it.
        state.goal = state.x < (low + high) / 2 ? high : low;
        state.mishap = { kind };
      } else if (kind) state.mishap = { kind, at: random(0.3, 0.75) };
    };

    // Its doings, each a list of steps: a pose (and face) held for a while,
    // or walked in to a spot on its edge, with what happens to the thing it is
    // playing with, how high it is lifted, and how it rocks, along the way.
    // start(step, time) runs as a step begins; frame(step, time, k) every frame,
    // k going from 0 to 1 over the step.
    // The things about it: none, one, or a few (bubbles).
    const things = { current: null };
    const putThing = (next) => {
      things.current = next;
      setThings(next ? (Array.isArray(next) ? next : [next]) : []);
    };
    // A toy it is wishing for, in a thought bubble over its head.
    const wishFor = (toy) => {
      state.wish = toy;
      setWish(toy);
    };
    const play = (steps, time) => {
      state.mode = 'script';
      state.steps = steps;
      state.step = null;
      state.lift = 0;
      state.rock = null;
      state.lastPlayed = time;
    };
    // Its edge, and a spot on it so far from the cat, on the side with room.
    const edgeNow = () => page(state.perch.getBoundingClientRect());
    const onEdge = (x) => {
      const edge = edgeNow();
      return Math.min(edge.right - MARGIN, Math.max(edge.left + MARGIN, x));
    };
    const roomy = () => {
      const edge = edgeNow();
      return state.x - edge.left > edge.right - state.x ? -1 : 1;
    };
    const hop = (to, height, landed = 0) => ({
      pose: 'leap',
      ms: 400,
      start: (step) => {
        step.from = state.x;
        step.to = typeof to === 'function' ? to() : to;
        state.facing = step.to < step.from ? -1 : 1;
      },
      frame: (step, time, k) => {
        state.x = step.from + (step.to - step.from) * k;
        state.lift = (step.lifted ?? 0) * (1 - k) + landed * k + height * Math.sin(Math.PI * k);
      },
    });
    // The dances. Each is a run of beats (BEAT ms each): a pose held on the
    // beat, a bounce or a hop, which way it faces, a step along its edge, and a
    // note or a sparkle now and then; and each ends in a bow.
    const BEAT = 420;
    const cheer = () => say(['♪', '♫', '✦'][Math.floor(Math.random() * 3)]);
    const beat = (pose, { hop = 5, face, move = 0, note = false, ms = BEAT, rock } = {}) => ({
      pose,
      mood: 'purring',
      ms,
      rock,
      start: (step) => {
        step.from = state.x;
        if (face) state.facing = face;
        if (note) cheer();
      },
      frame: (step, time, k) => {
        state.lift = hop * Math.sin(Math.PI * k);
        if (move) state.x = onEdge(step.from + move * k);
      },
    });
    const spin = (pose, turns, { hop = 14, ms = BEAT * 1.4 } = {}) => ({
      pose,
      mood: 'purring',
      ms,
      frame: (step, time, k) => {
        state.facing = Math.floor(k * turns * 2) % 2 ? 1 : -1;
        state.lift = hop * Math.sin(Math.PI * k);
      },
    });
    const bow = () => [
      { pose: 'crouch', ms: 600 },
      { pose: 'sit', mood: 'purring', ms: 1000, start: () => (say('heart'), say('✦')) },
    ];
    const dances = noted('dance', {
      // Happy paws: up on its hind legs, waving one paw then the other, and
      // now and then both thrown up with a hop.
      paws: () =>
        [1, 2, 3].flatMap(() => [
          beat('wave', { face: -1, note: true }),
          beat('wave', { face: 1 }),
          beat('wave', { face: -1 }),
          beat('cheer', { hop: 16, note: true, ms: BEAT * 1.3 }),
        ]),
      // The shuffle: side-steps along its edge, three one way and three back,
      // bobbing, with a hooray hop at each end.
      shuffle: () => {
        const dir = roomy();
        const side = (way) => [1, 2, 3].map((n) => beat('walk', { face: way, move: way * 18, hop: 6, note: n === 2 }));
        return [
          ...side(dir),
          beat('cheer', { hop: 14, note: true }),
          ...side(-dir),
          beat('cheer', { hop: 14 }),
          ...side(dir),
          beat('cheer', { hop: 18, note: true, ms: BEAT * 1.4 }),
        ];
      },
      // The twirl: spinning hops on the spot, faster and higher, then a leap
      // with both paws up.
      twirl: () => [
        spin('wave', 2, { hop: 10 }),
        beat('cheer', { note: true }),
        spin('wave', 3, { hop: 16 }),
        beat('cheer', { note: true }),
        spin('cheer', 4, { hop: 22, ms: BEAT * 1.6 }),
        beat('cheer', { hop: 34, note: true, ms: BEAT * 1.6 }),
      ],
      // The moonwalk: gliding backwards along its edge while it walks
      // forwards, a spin, and a pose; then back again.
      moonwalk: () => {
        const dir = roomy();
        const glide = (way) => ({
          pose: 'walk',
          mood: 'purring',
          ms: BEAT * 4,
          start: (step) => {
            step.from = state.x;
            state.facing = -way;
            cheer();
          },
          frame: (step, time, k) => {
            state.x = onEdge(step.from + way * 90 * k);
            state.lift = 2 * Math.abs(Math.sin(k * 8 * Math.PI));
          },
        });
        return [
          glide(dir),
          spin('walk', 2, { hop: 8 }),
          beat('cheer', { hop: 12, note: true, ms: BEAT * 1.4 }),
          glide(-dir),
          spin('walk', 2, { hop: 8 }),
          beat('wave', { hop: 12, face: dir, note: true, ms: BEAT * 1.6 }),
        ];
      },
      // Disco: a glitter ball comes down over her and, in shades under its
      // turning lights, she points up at it and down at the floor in turn,
      // hips bouncing; a spin, the point held; and up the ball goes.
      disco: () => {
        const at = { x: state.x, from: performance.now() };
        const ball = (time, extra = {}) =>
          putThing({ kind: 'disco', x: at.x, y: state.y, count: time - at.from, ...extra });
        const lit = (step) => ({
          ...step,
          frame: (s, time, k) => {
            step.frame?.(s, time, k);
            ball(time);
          },
        });
        const points = (note) =>
          [1, 2, 3, 4].map((n) => lit(beat(n % 2 ? 'disco' : 'disco2', { hop: 3, note: note && n === 1 })));
        const hold = beat('disco', { hop: 0, ms: BEAT * 2.4 });
        return [
          {
            pose: 'sit',
            mood: 'purring',
            ms: 800,
            start: () => say('!'),
            frame: (step, time, k) => ball(time, { ty: -70 * (1 - easeInOut(k)) }),
          },
          ...points(true),
          ...points(false),
          lit(spin('cheer', 2, { hop: 12 })),
          lit({ ...hold, start: (step, time) => (hold.start(step, time), say('✦')) }),
          {
            pose: 'disco',
            mood: 'purring',
            ms: 700,
            frame: (step, time, k) => ball(time, { ty: -70 * easeInOut(k), opacity: 1 - k }),
          },
        ];
      },
      // The robot: arms stiff and square, one forearm up and one down,
      // switched with a jolt on the beat ("beep", "boop"); a sharp about-turn;
      // a glitch, very fast ("01"); a slump as she powers down; and a hop as
      // she boots up again.
      robot: () => {
        const tick = (pose, word, extra = {}) => ({
          pose,
          mood: 'content',
          ms: BEAT,
          ...extra,
          start: (step) => {
            if (word) say(word);
            extra.start?.(step);
          },
        });
        const up = beat('cheer', { hop: 16, ms: BEAT * 1.4 });
        return [
          tick('robot', 'beep'),
          tick('robot2'),
          tick('robot', 'boop'),
          tick('robot2'),
          tick('robot', null, { start: () => (state.facing = -state.facing) }),
          tick('robot2', 'beep'),
          tick('robot'),
          tick('robot2', 'boop'),
          ...[0, 1, 2, 3, 4, 5].map((n) => tick(n % 2 ? 'robot2' : 'robot', n ? null : '01', { ms: 110 })),
          { pose: 'sit', mood: 'drowsy', ms: 900, start: () => say('…') },
          { ...up, start: (step, time) => (up.start(step, time), say('beep boop!')) },
        ];
      },
      // The hula: in a grass skirt and a flower garland, swaying her hips from
      // side to side, arms flowing out the way she sways; a slow turn; and a
      // hop with "aloha!".
      hula: () => {
        const sway = (pose, way, note) =>
          beat(pose, { hop: 1.5, move: way * 10, note, ms: BEAT * 1.6, rock: { amp: 4, freq: 1.5, decay: 0 } });
        const bye = beat('cheer', { hop: 14, ms: BEAT * 1.4 });
        return [
          sway('hula', -1, true),
          sway('hula2', 1),
          sway('hula', -1),
          sway('hula2', 1, true),
          sway('hula', -1),
          sway('hula2', 1),
          spin('hula', 2, { hop: 6, ms: BEAT * 2 }),
          { ...bye, start: (step, time) => (bye.start(step, time), say('aloha!')) },
        ];
      },
    });
    // Visits to a running GPU's tile: bouncing on it till it lurches and
    // tips (a fright, and off it leaps, the tile springing back); a warm nap
    // on the hottest; or pawing at its ring to spin it. Each ends with a leap
    // back to a panel.
    // A GPU's tile it has set wobbling or tipped: let go (springing back if
    // tipped) as it leaves, however it leaves.
    // A pretend reading over an idle GPU's ring while it runs: compute and
    // memory arcs (in the ring's own sizes and colours) and the percentage, in
    // place of its own "0%" (hidden meanwhile: a disc of the tile's colour
    // would not hide it on a tinted, see-through tile, a reserved one's).
    const SVG = 'http://www.w3.org/2000/svg';
    const pretendRing = (ring) => {
      const holder = ring.parentElement;
      const size = Number(ring.getAttribute('width')) || 64;
      const middle = size / 2;
      const svg = document.createElementNS(SVG, 'svg');
      for (const [name, value] of Object.entries({ width: size, height: size, viewBox: `0 0 ${size} ${size}` }))
        svg.setAttribute(name, value);
      svg.style.cssText = 'position:absolute;inset:0;pointer-events:none';
      const tracks = [...ring.querySelectorAll('circle')].slice(0, 2);
      const series = [RING_SERIES.compute, RING_SERIES.memory];
      const arcs = tracks.map((track, index) => {
        const arc = document.createElementNS(SVG, 'circle');
        for (const name of ['cx', 'cy', 'r', 'stroke-width']) arc.setAttribute(name, track.getAttribute(name));
        arc.setAttribute('fill', 'none');
        arc.setAttribute('stroke', series[index].color);
        arc.setAttribute('stroke-linecap', 'round');
        arc.setAttribute('transform', `rotate(-90 ${middle} ${middle})`);
        return arc;
      });
      const own = holder.querySelector('span');
      const label = document.createElementNS(SVG, 'text');
      const font = getComputedStyle(own ?? holder);
      label.setAttribute('x', middle);
      label.setAttribute('y', middle + 4.5);
      label.setAttribute('text-anchor', 'middle');
      label.style.cssText = `font: ${font.fontWeight} ${font.fontSize} ${font.fontFamily}; fill: ${font.color}; font-variant-numeric: tabular-nums`;
      svg.append(...arcs, label);
      holder.appendChild(svg);
      if (own) own.style.visibility = 'hidden';
      const gone = () => {
        svg.remove();
        if (own) own.style.visibility = '';
      };
      let shares = [0, 0];
      const set = (compute, memory) => {
        shares = [compute, memory];
        arcs.forEach((arc, index) => {
          const circumference = 2 * Math.PI * Number(arc.getAttribute('r'));
          const length = Math.max(0, Math.min(1, shares[index])) * circumference;
          arc.setAttribute('stroke-dasharray', `${length} ${circumference}`);
          arc.style.opacity = length > 0.5 ? '1' : '0';
        });
        label.textContent = `${Math.round(Math.max(0, compute) * 100)}%`;
      };
      set(0, 0);
      return {
        set,
        // Winding down to nothing, then gone.
        windDown: (ms) => {
          const [compute, memory] = shares;
          const from = performance.now();
          const step = (now) => {
            const k = Math.min(1, (now - from) / ms);
            set(compute * (1 - k) ** 2, memory * (1 - k) ** 2);
            if (k < 1) requestAnimationFrame(step);
            else gone();
          };
          requestAnimationFrame(step);
        },
        remove: gone,
      };
    };
    // An idle tile it got running: stopped (sputtering out, or at once).
    const stopOilRun = (sputter = false) => {
      const run = state.oilRun;
      if (!run) return;
      state.oilRun = null;
      run.hum.forEach((animation) => animation && animation.cancel());
      if (sputter) run.pretend?.windDown(1200);
      else run.pretend?.remove();
      run.face.style.opacity = '';
      setTimeout(() => (run.face.style.transition = ''), 600);
    };
    const releaseTile = () => {
      stopOilRun();
      const held = state.tileHeld;
      if (!held) return;
      state.tileHeld = null;
      held.tile.style.transform = '';
      if (!held.tip) return;
      setTimeout(() => {
        held.tip.cancel();
        held.tile
          .animate(
            [{ transform: held.tipped }, { transform: `rotate(${-held.side * 1.5}deg)` }, { transform: 'none' }],
            {
              duration: 800,
              easing: 'ease-out',
            },
          )
          .finished.then(() => (held.tile.style.transformOrigin = ''))
          .catch(() => {});
      }, 450);
    };
    const leaveTile = () => ({
      pose: 'sit',
      ms: 1,
      start: () => leapTo(otherPerch() ?? state.home ?? visiblePerches()[0]),
    });
    const gpuVisits = noted('gpu', {
      wobble: (tile) => {
        const side = Math.random() < 0.5 ? -1 : 1;
        const tipped = `translateY(5px) rotate(${side * 6}deg)`;
        state.tileHeld = { tile, side, tipped, tip: null };
        return [
          { pose: 'sit', mood: 'purring', ms: 400, start: () => say('♪') },
          {
            pose: 'hop',
            ms: 1700,
            frame: (step, time, k) => {
              state.lift = Math.abs(Math.sin(k * 6 * Math.PI)) * 12;
              tile.style.transform = `rotate(${Math.sin(k * 12 * Math.PI) * (0.6 + k)}deg)`;
            },
          },
          {
            pose: 'startle',
            ms: 700,
            rock: { amp: 8, freq: 6, decay: 2 },
            start: () => {
              tile.style.transform = '';
              tile.style.transformOrigin = side < 0 ? 'left bottom' : 'right bottom';
              state.tileHeld.tip = tile.animate([{ transform: 'none' }, { transform: tipped }], {
                duration: 360,
                easing: 'cubic-bezier(.3,1.7,.6,1)',
                fill: 'forwards',
              });
              say('!');
            },
          },
          // Off it leaps; the tile springs back once it is off.
          leaveTile(),
        ];
      },
      warm: () => [
        {
          pose: 'rest',
          mood: 'purring',
          ms: 1400,
          start: () => say('prr'),
          frame: () => Math.random() < 0.03 && say('~'),
        },
        { pose: 'melt', ms: 5000, frame: () => (Math.random() < 0.02 ? say('~') : Math.random() < 0.006 && say('z')) },
        { pose: 'stretch', ms: 900 },
        leaveTile(),
      ],
      // Up onto its ring, and running on it like a hamster wheel, faster and
      // faster, the ring spinning under it, till it is flung off, tumbling, and
      // lands dizzy on a panel; the ring spins down.
      wheel: (tile) => {
        const ring = tile.querySelector('[data-cat-ring]');
        if (!ring) return [leaveTile()];
        return [
          { pose: 'sit', mood: 'hungry', ms: 500, start: () => say('!') },
          {
            pose: 'crouch',
            ms: 1,
            start: () => {
              state.resume = { onCard: true, steps: () => wheelRun(ring) };
              leapTo(ring, null, HOP_MS);
            },
          },
        ];
      },
      // Up to its ring and hanging from the top of it by its front paws,
      // swinging to and fro (the ring swaying with it), then letting go.
      swing: (tile) => {
        const ring = tile.querySelector('[data-cat-ring]');
        if (!ring) return [leaveTile()];
        return [
          { pose: 'sit', mood: 'hungry', ms: 500, start: () => say('!') },
          {
            pose: 'crouch',
            ms: 1,
            start: () => {
              state.resume = { onCard: true, steps: () => ringSwing(ring) };
              leapTo(ring, null, HOP_MS);
            },
          },
        ];
      },
      // Stealing it: down beside it, braced against its side, pushing it along
      // and off the edge of the screen, going with it; then back, pleased.
      // A helicopter brings the tile back later.
      steal: (tile) => [
        { pose: 'sit', mood: 'hungry', ms: 500, start: () => say('!') },
        { pose: 'crouch', ms: 1, start: () => startSteal(tile) },
      ],
      // Kicking it off: down beside it, back to it, three mule kicks (it jolts
      // and leans further each time) till it topples off the screen; then back
      // to a panel, pleased. A helicopter brings the tile back later.
      kick: (tile) => [
        { pose: 'sit', mood: 'hungry', ms: 500, start: () => say('!') },
        { pose: 'crouch', ms: 1, start: () => startKick(tile) },
      ],
      // Getting an idle GPU going: a puzzled look, oil poured in from a little
      // can ("glug"), cheers ("加油!", "頑張れ!", "Semangat!", "화이팅!", "Cố lên!") and the tile runs a while (bright, its
      // ring whirring, humming and glowing), then sputters out.
      oil: (tile) => {
        const face = tile.querySelector('.rounded-2xl') ?? tile;
        const ring = tile.querySelector('[data-cat-ring]');
        return [
          { pose: 'sit', mood: 'hungry', ms: 700, start: () => say('?') },
          {
            pose: 'pour',
            ms: 2200,
            frame: (step, now, k) => {
              if (Math.floor(k * 3) !== step.beat) {
                step.beat = Math.floor(k * 3);
                say('glug');
              }
            },
          },
          {
            pose: 'cheer',
            ms: 3800,
            start: (step) => {
              // Two or three cheers, shuffled: the first now, the rest as it runs.
              step.cheers = [...CHEERS].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2));
              say(step.cheers.shift());
              face.style.transition = 'opacity 0.5s';
              face.style.opacity = '1';
              state.oilRun = {
                face,
                ring,
                pretend: ring ? pretendRing(ring) : null,
                hum: [
                  !quietRef.current &&
                    tile.animate(
                      [
                        { transform: 'translate(0, 0)' },
                        { transform: 'translate(0.7px, -0.5px)' },
                        { transform: 'translate(-0.6px, 0.4px)' },
                        { transform: 'translate(0, 0)' },
                      ],
                      { duration: 130, iterations: Infinity },
                    ),
                  face.animate(
                    [
                      { boxShadow: '0 0 0 0 rgba(91, 190, 152, 0)' },
                      { boxShadow: '0 0 14px 2px rgba(91, 190, 152, 0.45)' },
                    ],
                    { duration: 900, direction: 'alternate', iterations: Infinity },
                  ),
                ],
              };
            },
            frame: (step, now, k) => {
              state.lift = Math.abs(Math.sin(k * 10 * Math.PI)) * 6;
              // The reading climbs, then flickers as a busy GPU's does.
              const rise = Math.min(1, k * 4);
              state.oilRun?.pretend?.set(
                rise * (0.74 + 0.07 * Math.sin(now / 170) + 0.03 * Math.sin(now / 53)),
                Math.min(1, k * 2.5) * (0.46 + 0.02 * Math.sin(now / 260)),
              );
              if (Math.floor(k * 4) !== step.beat) {
                step.beat = Math.floor(k * 4);
                if (step.beat) say(step.beat % 2 && step.cheers?.length ? step.cheers.shift() : '~');
              }
            },
          },
          {
            pose: 'sit',
            mood: 'hungry',
            ms: 1100,
            start: () => {
              stopOilRun(true);
              say('…');
            },
          },
          leaveTile(),
        ];
      },
      // Peekaboo: hiding behind the tile, peeking over its top, ducking down
      // and popping up again.
      peekaboo: () => [
        { pose: 'peek', ms: 1400 },
        { pose: 'lurk', ms: 900 },
        { pose: 'peek', ms: 1100, start: () => say('!') },
        { pose: 'lurk', ms: 800 },
        { pose: 'emerge', ms: 500 },
        { pose: 'peek', ms: 1300, start: () => say('heart') },
        leaveTile(),
      ],
      spin: (tile) => {
        const ring = tile.querySelector('[data-cat-ring]');
        const spin = () =>
          ring?.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], {
            duration: 1600,
            easing: 'cubic-bezier(.2,.8,.3,1)',
          });
        return [
          { pose: 'sit', ms: 600 },
          { pose: 'dangle', ms: 1000, start: () => spin() },
          { pose: 'sit', mood: 'hungry', ms: 1100, start: () => say('!') },
          { pose: 'dangle', ms: 1000, start: () => spin() },
          { pose: 'sit', mood: 'purring', ms: 1300, start: () => say('heart') },
          leaveTile(),
        ];
      },
    });
    // Swinging from a GPU's ring by its front paws, higher, then dying down;
    // then it lets go and drops to a panel.
    const ringSwing = (ring) => [
      {
        pose: 'ringhang',
        mood: 'purring',
        ms: 5200,
        rock: { amp: 26, freq: 0.7, decay: 0, origin: 'paws' },
        start: () => {
          state.tileHeld = { tile: ring };
          say('♪');
        },
        frame: (step, time, k) => {
          // The swing dies down at the end; the ring sways against it.
          if (state.rock) state.rock.amp = 26 * Math.min(1, (1 - k) / 0.25);
          const seconds = (time - step.started) / 1000;
          ring.style.transform = `rotate(${-6 * Math.sin(2 * Math.PI * 0.7 * seconds) * Math.min(1, (1 - k) / 0.25)}deg)`;
          const beat = Math.floor(k * 4);
          if (beat !== step.beat) {
            step.beat = beat;
            if (beat && beat < 3) say(beat % 2 ? '♫' : '♪');
          }
        },
      },
      {
        pose: 'leap',
        ms: 1,
        start: () => {
          state.tileHeld = null;
          ring.style.transform = '';
          const to = otherPerch() ?? visiblePerches()[0];
          state.perch = null;
          leapTo(to);
        },
      },
    ];
    // Running on a GPU's ring as a wheel: its strides quicken and the ring
    // spins under it; then flung off.
    const wheelRun = (ring) => {
      let angle = 0;
      let last = null;
      state.tileHeld = { tile: ring };
      return [
        {
          pose: 'run2',
          mood: 'hungry',
          ms: 4200,
          start: () => say('♪'),
          frame: (step, time, k) => {
            const dt = last == null ? 0 : (time - last) / 1000;
            last = time;
            // Speeding up to nearly a turn a second.
            const turning = 90 + 240 * k;
            angle -= state.facing * turning * dt;
            ring.style.transform = `rotate(${angle}deg)`;
            // Her strides keep pace with the rim under her feet (the ring is
            // about 188 px round; a half stride covers 12 px of it), one bob
            // each.
            const rim = (turning / 360) * 188;
            const half = Math.min(340, Math.max(140, (12 / rim) * 1000));
            step.stride = (step.stride ?? 0) + (dt * 1000) / half;
            step.pose = Math.floor(step.stride) % 2 ? 'run' : 'run2';
            state.lift = Math.abs(Math.sin(Math.PI * step.stride)) * 2.5;
          },
        },
        {
          pose: 'tumble',
          ms: 1,
          start: () => {
            // Flung off: the ring spins down by itself.
            state.tileHeld = null;
            ring.style.transform = '';
            ring
              .animate(
                [{ transform: `rotate(${angle}deg)` }, { transform: `rotate(${angle - state.facing * 180}deg)` }],
                {
                  duration: 2200,
                  easing: 'cubic-bezier(.1,.6,.3,1)',
                },
              )
              .finished.catch(() => {});
            say('!');
            state.leapPose = 'tumble';
            state.resume = {
              steps: () => [
                { pose: 'balance', ms: 1400, rock: { amp: 9, freq: 1.6, decay: 1.2 }, start: () => say('~') },
              ],
            };
            const to = otherPerch() ?? visiblePerches()[0];
            state.perch = null;
            leapTo(to);
          },
        },
      ];
    };
    // The steal: pushing a GPU's tile off the nearer edge of the screen.
    const PAW_REACH = (60 - 34) * UNIT;
    const startSteal = (tile) => {
      const rect = tile.getBoundingClientRect();
      const base = page(rect);
      const dir = (rect.left + rect.right) / 2 < window.innerWidth / 2 ? -1 : 1;
      Object.assign(state, {
        mode: 'steal',
        steal: { tile, base, dir, dx: 0, speed: 90, started: performance.now(), from: { x: state.x, y: state.y } },
      });
      state.facing = dir;
    };
    // The kick: three mule kicks at a GPU's tile till it topples off the screen.
    const KICK_REACH = (92 - 60) * UNIT;
    const startKick = (tile) => {
      const rect = tile.getBoundingClientRect();
      const base = page(rect);
      // It falls towards the nearer side of the screen; the cat stands on the
      // other side of it, its back to it.
      const dir = (rect.left + rect.right) / 2 < window.innerWidth / 2 ? -1 : 1;
      Object.assign(state, {
        mode: 'kick',
        steal: { tile, base, dir, dx: 0, started: performance.now(), from: { x: state.x, y: state.y } },
      });
      state.facing = -dir;
    };
    // What comes to bring a tile (or the cat) back: a helicopter or a UFO,
    // half and half.
    const craft = () => state.forceCraft ?? (Math.random() < 0.5 ? 'heli' : 'ufo');
    // A stolen tile, to be brought back by helicopter (or UFO) in a while.
    const stolenAway = (steal, heliIn) => {
      state.stolen = {
        tile: steal.tile,
        base: steal.base,
        dx: steal.dx,
        dir: steal.dir,
        heliAt: performance.now() + heliIn,
        craft: craft(),
      };
      state.steal = null;
    };
    // Off to a running GPU's tile (the hottest, for a nap), and the visit once there.
    const visitGpu = (asked) => {
      if (!state.perch) return false;
      // Quiet, it only visits in ways that leave the tile be.
      if (quietRef.current && MOVES_TILES.has(asked)) {
        const calm = Object.fromEntries(Object.entries(feel().gpus).filter(([name]) => !MOVES_TILES.has(name)));
        asked = Object.keys(calm).length ? pick(calm) : 'warm';
      }
      const running = runningGpus();
      const idle = idleGpus();
      // One tile stolen at a time; an idle tile to get running, or a running one
      // for everything else (making do with whichever there is).
      let kind = (asked === 'steal' || asked === 'kick') && state.stolen ? 'wobble' : asked;
      if (kind === 'oil' && !idle.length) kind = running.length ? 'wobble' : null;
      if (kind && kind !== 'oil' && !running.length) kind = idle.length ? 'oil' : null;
      if (!kind) return false;
      const tiles = kind === 'oil' ? idle : running;
      const tile =
        kind === 'warm'
          ? tiles.sort((a, b) => Number(b.dataset.heat ?? 0) - Number(a.dataset.heat ?? 0))[0]
          : tiles[Math.floor(Math.random() * tiles.length)];
      state.resume = { onCard: true, steps: () => gpuVisits[kind](tile) };
      leapTo(tile);
      return true;
    };

    // Ways of having a treat: tossed, caught in the air; held up, begged for;
    // dropped somewhere, hunted for; or a little bowl of them.
    const munch = () => [
      { pose: 'crouch', ms: 900, start: () => (putThing(null), say('nom')) },
      { pose: 'sit', mood: 'purring', ms: 900, start: () => say('crunch') },
      { pose: 'groom', ms: 1300, start: () => say('heart') },
    ];
    // Wishes played out with its owner: a belly rub (stroked by the pointer,
    // and maybe a playful grab), a brushing (a comb on the pointer), a photo
    // shoot (three poses, a flash for each).
    const near = (reach) =>
      time() - state.pointer.at < 400 &&
      Math.hypot(state.pointer.x - state.x, state.pointer.y - (state.y - 18)) < reach;
    const time = () => performance.now();
    const strokes = (step) => {
      // A stroke: the pointer moving over it.
      const moved = Math.hypot(
        state.pointer.x - (step.lastX ?? state.pointer.x),
        state.pointer.y - (step.lastY ?? state.pointer.y),
      );
      step.lastX = state.pointer.x;
      step.lastY = state.pointer.y;
      step.travel = (step.travel ?? 0) + (near(48) ? moved : 0);
      if (step.travel > 90) {
        step.travel = 0;
        step.count = (step.count ?? 0) + 1;
        return true;
      }
      return false;
    };
    const wanted = noted('wish', {
      rub: () => [
        { pose: 'squirm', ms: 300, start: () => say('heart') },
        {
          pose: 'squirm',
          ms: 9000,
          frame: (step) => {
            if (strokes(step)) {
              say(step.count % 2 ? 'heart' : 'prr');
              // A few rubs in, now and then: a playful grab at the hand.
              if (step.count >= 4 && !step.grabbed && Math.random() < 0.35) {
                step.grabbed = true;
                state.rock = { amp: 8, freq: 7, decay: 1.4, from: time() };
                say('!');
              }
            }
            if (step.count >= 7) step.done = true;
          },
        },
        { pose: 'sit', mood: 'purring', ms: 1200, start: () => (say('heart'), say('prr')) },
      ],
      brush: () => [
        {
          pose: 'sit',
          mood: 'purring',
          ms: 9000,
          start: () => say('♪'),
          frame: (step) => {
            const close =
              time() - state.pointer.at < 3000 &&
              Math.hypot(state.pointer.x - state.x, state.pointer.y - state.y) < 160;
            putThing(close ? { kind: 'comb', x: state.pointer.x + 6, y: state.pointer.y + 4 } : null);
            if (strokes(step)) {
              say('~');
              if (step.count % 2) say('prr');
            }
            step.pose = near(60) ? 'lean' : 'sit';
            if (step.count >= 8) step.done = true;
          },
        },
        { pose: 'sit', mood: 'purring', ms: 400, rock: { amp: 9, freq: 6, decay: 3 }, start: () => putThing(null) },
        { pose: 'sit', mood: 'purring', ms: 1000, start: () => say('✦') },
      ],
      photo: () => {
        const snap = (pose, mood, ms) => ({
          pose,
          mood,
          ms,
          frame: (step, now, k) => {
            if (k > 0.55 && !step.snapped) {
              step.snapped = true;
              say('flash');
              say('click!');
            }
          },
        });
        return [
          { pose: 'sit', ms: 500, start: () => say('!') },
          snap('wink', 'content', 1400),
          snap('glam', 'content', 1700),
          snap('cheer', 'purring', 1500),
          { pose: 'sit', mood: 'purring', ms: 900, start: () => say('heart') },
        ];
      },
    });
    // Trapped in a panel (dropped well inside it): it falls to the floor,
    // looks round, paws at a wall, bats at something in the panel (which
    // jiggles), and at last leaps up and out over the top onto its edge.
    const trap = (panel, time) => {
      state.manual = false;
      cheerUp(JOY.trapped);
      const edge = page(panel.getBoundingClientRect());
      const floor = edge.bottom - 10;
      const dropped = state.y;
      const wall = state.x < (edge.left + edge.right) / 2 ? edge.left + 36 : edge.right - 36;
      // Something in the panel to bat at: a picture or a block of text, small
      // enough, above the floor.
      const things = [...panel.querySelectorAll('svg, h2, h3, p, button, div')].filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
          style.display !== 'inline' &&
          rect.width > 14 &&
          rect.width < 220 &&
          rect.height > 10 &&
          rect.height < 120 &&
          rect.bottom + window.scrollY < floor - 24 &&
          rect.left + window.scrollX > edge.left + 30 &&
          rect.right + window.scrollX < edge.right - 30 &&
          !element.closest('[data-cat]')
        );
      });
      const target = things[Math.floor(Math.random() * things.length)];
      const targetAt = target && page(target.getBoundingClientRect());
      const jiggle = () =>
        !quietRef.current &&
        target?.animate(
          [
            { transform: 'none' },
            { transform: 'translateY(-3px) rotate(-5deg)' },
            { transform: 'rotate(4deg)' },
            { transform: 'none' },
          ],
          { duration: 420, easing: 'ease-out' },
        );
      const reach = targetAt ? Math.max(16, Math.min(90, floor - targetAt.bottom - 20)) : 30;
      // Out onto its top edge, at last.
      const out = () => {
        const top = page(panel.getBoundingClientRect());
        Object.assign(state, { inside: null, escaping: false, squeezing: false, lift: 0, y: top.top + 1 });
        state.x = Math.min(top.right - MARGIN, Math.max(top.left + MARGIN, state.x));
        state.along = state.x - top.left;
      };
      const leapOut = () => ({
        pose: 'leap',
        ms: 620,
        start: () => {
          state.escaping = true;
          say('!');
        },
        frame: (step, now, k) => {
          const top = page(panel.getBoundingClientRect()).top + 1;
          state.lift = (floor - top) * k + 34 * Math.sin(Math.PI * k);
        },
      });
      // Its ways out: a leap up over the top; breaking the glass (paws on it,
      // a tap, cracks, a crash, shards flying) and jumping out; or squeezing
      // flat out through a wall and hopping up onto the edge.
      const escapes = {
        over: () => [
          { pose: 'crouch', ms: 500, rock: { amp: 3.5, freq: 5.5, decay: 0 } },
          leapOut(),
          { pose: 'crouch', ms: 300, start: out },
        ],
        glass: () => {
          const crack = (count) => ({ kind: 'cracks', front: true, x: state.x, y: floor - 28, count });
          const shards = Array.from({ length: 9 }, (_, index) => ({
            angle: (index / 9) * Math.PI * 2 + Math.random() * 0.4,
            speed: random(60, 140),
            spin: random(-400, 400),
          }));
          return [
            { pose: 'press', ms: 900, start: () => say('?') },
            { pose: 'press', ms: 260, rock: { amp: 4, freq: 4, decay: 4 }, start: () => putThing(crack(1)) },
            { pose: 'press', ms: 500 },
            { pose: 'press', ms: 260, rock: { amp: 4, freq: 4, decay: 4 }, start: () => putThing(crack(2)) },
            { pose: 'press', ms: 500, start: () => putThing(crack(3)) },
            {
              pose: 'cheer',
              ms: 900,
              start: (step) => {
                step.at = { x: state.x, y: floor - 28 };
                state.escaping = true;
                say('crash!');
              },
              frame: (step, now, k) =>
                putThing(
                  shards.map((shard, index) => ({
                    kind: 'shard',
                    id: `shard-${index}`,
                    front: true,
                    x: step.at.x + Math.cos(shard.angle) * shard.speed * k,
                    y: step.at.y + Math.sin(shard.angle) * shard.speed * k + 160 * k * k,
                    rotate: shard.spin * k,
                    opacity: 1 - k,
                  })),
                ),
            },
            { ...leapOut(), start: () => putThing(null) },
            { pose: 'crouch', ms: 300, start: out },
          ];
        },
        squeeze: () => {
          const toLeft = state.x < (edge.left + edge.right) / 2;
          const wallAt = () => {
            const now = page(panel.getBoundingClientRect());
            return toLeft ? now.left : now.right;
          };
          return [
            { to: toLeft ? edge.left + 36 : edge.right - 36, speed: TRAPPED_PACE },
            { pose: 'crouch', ms: 500, start: () => ((state.facing = toLeft ? -1 : 1), say('…')) },
            {
              pose: 'sniff',
              ms: 1300,
              start: (step) => {
                step.from = state.x;
                state.squeezing = true;
              },
              frame: (step, now, k) => (state.x = step.from + (wallAt() + (toLeft ? -40 : 40) - step.from) * k),
            },
            {
              pose: 'sit',
              mood: 'hungry',
              ms: 500,
              start: () => {
                state.escaping = true;
                say('!');
              },
            },
            {
              pose: 'leap',
              ms: 560,
              start: (step) => {
                step.from = state.x;
                step.to = wallAt() + (toLeft ? 46 : -46);
              },
              frame: (step, now, k) => {
                const top = page(panel.getBoundingClientRect()).top + 1;
                state.x = step.from + (step.to - step.from) * k;
                state.lift = (floor - top) * k + 30 * Math.sin(Math.PI * k);
              },
            },
            { pose: 'crouch', ms: 300, start: out },
          ];
        },
      };
      // More ways out: climbing up the inside of a wall and over the top; a
      // balloon floating it up and out; digging down through the floor and
      // popping up over the top edge; or vanishing in a puff of smoke and
      // reappearing on the top edge.
      const wallSide = state.x < (edge.left + edge.right) / 2 ? -1 : 1;
      const climbHeight = () => floor - page(panel.getBoundingClientRect()).top - 4;
      Object.assign(escapes, {
        climb: () => [
          { to: wallSide < 0 ? edge.left + 40 : edge.right - 40, speed: TRAPPED_PACE },
          {
            pose: 'climb',
            ms: 1800,
            start: () => {
              state.facing = wallSide < 0 ? -1 : 1;
              state.squeezing = true;
            },
            frame: (step, now, k) => {
              // Paws on the inside of the wall, climbing.
              const walls = page(panel.getBoundingClientRect());
              state.x = wallSide < 0 ? walls.left + 3 : walls.right - 3;
              state.lift = (climbHeight() - 20) * k;
            },
          },
          {
            pose: 'scramble',
            ms: 700,
            start: () => {
              state.escaping = true;
              state.lift = climbHeight();
            },
          },
          {
            pose: 'leap',
            ms: 380,
            start: (step) => (step.from = state.x),
            frame: (step, now, k) => {
              const walls = page(panel.getBoundingClientRect());
              const onto = wallSide < 0 ? walls.left + MARGIN : walls.right - MARGIN;
              state.x = step.from + (onto - step.from) * k;
              state.lift = climbHeight() + 4 + 14 * Math.sin(Math.PI * k);
            },
          },
          { pose: 'crouch', ms: 300, start: out },
        ],
        balloon: () => {
          // The balloon by how high its string's end is above the floor.
          const balloon = (high, extra = {}) => putThing({ kind: 'balloon', x: state.x, y: floor - high, ...extra });
          return [
            {
              pose: 'sit',
              mood: 'hungry',
              ms: 1300,
              start: () => say('!'),
              frame: (step, now, k) => balloon(50 + 140 * (1 - k)),
            },
            {
              pose: 'hang',
              mood: 'purring',
              ms: 2600,
              start: () => say('♪'),
              frame: (step, now, k) => {
                const top = climbHeight() + 40;
                state.lift = top * (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
                if (state.lift > top - 60) state.escaping = true;
                balloon(state.lift + 1);
              },
            },
            {
              pose: 'leap',
              ms: 420,
              start: () => say('heart'),
              frame: (step, now, k) => {
                state.lift = climbHeight() + 40 - 36 * k;
                balloon(climbHeight() + 41 + 140 * k, { opacity: 1 - k });
              },
            },
            { pose: 'crouch', ms: 300, start: () => (putThing(null), out()) },
          ];
        },
        dig: () => [
          {
            pose: 'scratch',
            ms: 1600,
            start: () => say('scritch'),
            frame: (step, now, k) =>
              putThing({
                kind: 'dirt',
                x: state.x + state.facing * (20 + 30 * (k % 0.25) * 4),
                y: floor - 30 * Math.sin(Math.PI * ((k * 4) % 1)),
              }),
          },
          {
            pose: 'scratch',
            ms: 900,
            frame: (step, now, k) => {
              // Sinking down through the floor, out of sight.
              state.lift = -60 * k;
              putThing({ kind: 'dirt', x: state.x, y: floor, opacity: 1 - k });
            },
          },
          {
            pose: 'emerge',
            ms: 1400,
            start: () => {
              putThing(null);
              out();
              state.mode = 'script';
              say('!');
            },
          },
          { pose: 'peek', ms: 600 },
          { pose: 'sit', mood: 'purring', ms: 700, start: () => say('heart') },
        ],
        poof: () => {
          const puff = (x, y, k) => ({ kind: 'puff', front: true, x, y, scale: 0.6 + k, opacity: 1 - k });
          return [
            { pose: 'crouch', ms: 700, rock: { amp: 4, freq: 6, decay: 0 }, start: () => say('✦') },
            {
              pose: 'crouch',
              ms: 700,
              start: (step) => {
                step.at = { x: state.x, y: floor - 20 };
                state.hidden = true;
                say('poof!');
              },
              frame: (step, now, k) => putThing(puff(step.at.x, step.at.y, k)),
            },
            {
              pose: 'sit',
              mood: 'purring',
              ms: 900,
              start: (step) => {
                out();
                state.mode = 'script';
                step.at = { x: state.x, y: state.y - 20 };
                state.hidden = false;
                say('✦');
              },
              frame: (step, now, k) => putThing(puff(step.at.x, step.at.y, k)),
            },
            { pose: 'sit', mood: 'purring', ms: 600, start: () => (putThing(null), say('heart')) },
          ];
        },
      });
      const escape = () => {
        const ways = Object.keys(escapes).filter((way) => way !== state.lastEscape);
        const way = state.escapeAs ?? ways[Math.floor(Math.random() * ways.length)];
        state.lastEscape = way;
        saw(`escape:${way}`);
        return escapes[way]();
      };
      Object.assign(state, { inside: panel, perch: panel, side: 'top', escaping: false, x: state.x, y: floor });
      const batAt = () => ({
        pose: 'reach',
        ms: 460,
        start: () => (state.facing = targetAt && (targetAt.left + targetAt.right) / 2 < state.x ? -1 : state.facing),
        frame: (step, now, k) => {
          state.lift = reach * Math.sin(Math.PI * k);
          if (k > 0.5 && !step.hit) {
            step.hit = true;
            jiggle();
          }
        },
      });
      play(
        [
          {
            pose: 'tumble',
            ms: 380,
            frame: (step, now, k) => (state.lift = Math.max(0, floor - dropped) * (1 - k * k)),
          },
          { pose: 'balance', ms: 700, rock: { amp: 9, freq: 2.2, decay: 2.5 }, start: () => say('?') },
          { pose: 'sit', mood: 'hungry', ms: 550, start: () => (state.facing = -1) },
          { pose: 'sit', mood: 'hungry', ms: 550, start: () => ((state.facing = 1), say('?')) },
          { to: wall, speed: TRAPPED_PACE },
          { pose: 'reach', ms: 300, start: () => (state.facing = wall < (edge.left + edge.right) / 2 ? -1 : 1) },
          { pose: 'sit', mood: 'hungry', ms: 220 },
          { pose: 'reach', ms: 300, start: () => say('!') },
          ...(targetAt
            ? [
                { to: (targetAt.left + targetAt.right) / 2, speed: TRAPPED_PACE },
                batAt(),
                { pose: 'sit', mood: 'hungry', ms: 300 },
                batAt(),
              ]
            : []),
          { pose: 'sit', mood: 'hungry', ms: 700, start: () => say('…') },
          ...escape(),
        ],
        time,
      );
    };
    // Back into view after the page scrolled its panel away: from below, up a
    // ladder, floating up on a balloon, or bounced off a trampoline; from
    // above, down under a parachute or abseiling down a rope; from either,
    // lowered by the helicopter, or simply leaping in from the edge.
    const WAYS_IN = {
      below: ['leap', 'ladder', 'balloon', 'trampoline', 'heli', 'superhero', 'pogo', 'bubble'],
      above: ['leap', 'parachute', 'abseil', 'heli', 'superhero', 'umbrella'],
    };
    const comeBack = (perch, fromAbove, time) => {
      state.manual = false;
      const ways = WAYS_IN[fromAbove ? 'above' : 'below'].filter((way) => way !== state.lastWayIn);
      const way = ways[Math.floor(Math.random() * ways.length)];
      state.lastWayIn = way;
      if (way === 'leap') {
        leapTo(perch, state.x);
        return;
      }
      const to = spotOn(perch, state.x);
      const screenTop = window.scrollY + topClear() - 60;
      const screenBottom = window.scrollY + window.innerHeight;
      const side = to.x < window.scrollX + window.innerWidth / 2 ? -1 : 1;
      Object.assign(state, {
        mode: 'enter',
        enter: { way, perch, to, started: time, screenTop, screenBottom, side, craft: way === 'heli' ? craft() : null },
        x: to.x,
        y: fromAbove ? screenTop : screenBottom + 60,
        spin: null,
        rock: null,
      });
      state.facing = -side;
      saw(`in:${state.enter.craft ?? way}`);
    };
    const arrive = (time) => {
      const { perch } = state.enter;
      putThing(null);
      Object.assign(state, {
        enter: null,
        spin: null,
        rock: null,
        perch,
        side: 'top',
        mode: 'land',
        until: time + 320,
      });
      const edge = page(perch.getBoundingClientRect());
      state.along = state.x - edge.left;
    };
    // Pop-up cards. When one opens from its panel (its owner clicked something
    // there) or near it, or comes down over it (or it finds itself under one),
    // it may let it be, jump and stare at it, take fright and run off, or go
    // over and up onto it (by one of its ways, to a spot along its top picked
    // at random) and do something there: read it through little glasses, peek
    // over its top, swat at it (it jiggles), nap on it, knead it, or sniff
    // along it. One over it, it never lets be. Not in quiet mode. When the
    // pop-up closes under it, it drops back down onto a panel.
    const popupReactions = noted('popup', {
      read: () => [
        { pose: 'read', ms: 3600, start: () => say('hmm') },
        { pose: 'sit', mood: 'purring', ms: 900, start: () => say('!') },
      ],
      peek: () => [
        { pose: 'peek', ms: 2400 },
        { pose: 'lurk', ms: 700 },
        { pose: 'peek', ms: 1400, start: () => say('?') },
      ],
      swat: (card) => [
        { pose: 'sit', mood: 'hungry', ms: 400 },
        ...[0, 1].flatMap(() => [
          {
            pose: 'reach',
            ms: 300,
            start: () =>
              card.animate(
                [{ transform: 'none' }, { transform: 'translateY(2px) rotate(-1deg)' }, { transform: 'none' }],
                { duration: 260 },
              ),
          },
          { pose: 'sit', mood: 'hungry', ms: 300 },
        ]),
        { pose: 'sit', mood: 'purring', ms: 900, start: () => say('!') },
      ],
      nap: () => [
        { pose: 'rest', mood: 'purring', ms: 1500, start: () => say('prr') },
        { pose: 'sleep', ms: 6000, frame: () => Math.random() < 0.004 && say('z') },
      ],
      knead: () => [
        { pose: 'knead', mood: 'purring', ms: 3200, start: () => say('prr') },
        { pose: 'rest', mood: 'purring', ms: 1400 },
      ],
      sniff: () => {
        const edge = edgeNow();
        return [
          { pose: 'sniff', ms: 1200, start: () => say('sniff') },
          { to: random(edge.left + MARGIN, edge.right - MARGIN) },
          { pose: 'sniff', ms: 1000, start: () => say('sniff') },
          { pose: 'sit', ms: 900, start: () => say('?') },
        ];
      },
    });
    const startled = () => [
      {
        pose: 'startle',
        ms: 520,
        start: () => say('!'),
        frame: (step, now, k) => (state.lift = 26 * Math.sin(Math.PI * k)),
      },
      { pose: 'sit', mood: 'hungry', ms: 1200, start: () => say('?') },
    ];

    // Up on the bakery's oven (its card's scene, BakeryStatus.jsx: the oven's
    // top 88 of its 160 units across, from 36; its two dials at 49 and 60 and
    // its power button at 112, a little below the top; its window 46 to 114
    // across and 53 to 91 down; the counter it stands on at 106 down; a kitchen
    // timer on top in the middle when late). What she does there depends on
    // how the oven is, and she has her paws on it: a whole bake (switched on,
    // watched till done, switched off, the door opened and the pastry eaten),
    // or just the eating of one already baked; down at its window, paws on the
    // glass, peering in, then polishing it; turning up the heat (the glow
    // flares, the steam rushes, and it is too hot for her); warming herself
    // in its steam; late, batting the timer till it rings; closed, a nap with
    // the dozing oven, or knocking on it. Half the time she does a second
    // thing before she goes. She tells the card what she does to it (a
    // 'bakery-oven' event), and it does it.
    // A spot on the oven's top (or the counter), u along in the scene's units,
    // on the page.
    const ovenX = (oven, u) => {
      const rect = oven.getBoundingClientRect();
      return rect.left + window.scrollX + (u * rect.width) / OVEN_UNITS;
    };
    const ovenTell = (what) => window.dispatchEvent(new CustomEvent('bakery-oven', { detail: what }));
    const ovenIs = (oven) => ({ on: oven.dataset.ovenOn === 'true', done: oven.dataset.ovenDone === 'true' });
    const ovenFits = (oven) => {
      const { catOven: kind } = oven.dataset;
      if (kind === 'closed') return ['snooze', 'knock', 'window'];
      const { on, done } = ovenIs(oven);
      const fits = !on && done ? ['steal', 'window'] : on ? ['bake', 'dial', 'window', 'warm'] : ['bake', 'window'];
      if (kind === 'delayed') fits.push('timer');
      return fits;
    };
    // Done at a card's scene (the oven, a packing counter): half the time
    // (again) another thing there, else off to a panel in view that the card
    // does not cover.
    const offScene = (scene, again = true) => ({
      pose: 'sit',
      ms: 300,
      start: (step, time) => {
        if (again && scene.isConnected && Math.random() < 0.5) {
          const [table, fits, key] = scene.hasAttribute('data-cat-pack')
            ? [packReactions, packFits, 'pack']
            : [ovenReactions, ovenFits, 'oven'];
          play(table[pickAfresh(key, fits(scene))](scene, false), time);
          return;
        }
        const card = (scene.closest('[role="dialog"]') ?? scene).getBoundingClientRect();
        const clear = visiblePerches()
          .map((perch) => ({ perch, rect: perch.getBoundingClientRect() }))
          .filter(
            ({ rect }) =>
              rect.top < card.top - 30 || rect.top > card.bottom + 10 || rect.right < card.left || rect.left > card.right,
          )
          .sort(
            (a, b) =>
              Math.abs(a.rect.top + window.scrollY - state.y) - Math.abs(b.rect.top + window.scrollY - state.y),
          );
        if (clear.length) leapTo(clear[0].perch);
      },
    });
    const snooze = (ms) => ({ pose: 'sleep', ms, frame: () => Math.random() < 0.005 && say('z') });
    // Over to a dial or the power button, her paw hanging down onto it (her
    // drawing's x 53, 7 in from her middle: to her left facing left, to her
    // right facing right), and a press.
    const pawOn = (oven, u, facing, what, words) => [
      { to: ovenX(oven, u) + facing * -(60 - 53) * UNIT },
      { pose: 'sit', ms: 450, start: () => (state.facing = facing) },
      { pose: 'dangle', ms: 600 },
      { pose: 'dangle', ms: 450, start: () => (ovenTell(what), say(words), what !== 'hot' && saw('oven:knob')) },
    ];
    // Lying over the front, a paw hanging down, watching it bake ("mm…") till
    // it is done (or up to most): a cheer if it is.
    const watchIt = (oven, most = 9000) => [
      { to: ovenX(oven, 80) },
      {
        pose: 'dangle',
        ms: most,
        start: () => (say('mm…'), saw('oven:watch')),
        frame: (step, time) => {
          if (time - step.started > 1800 && ovenIs(oven).done) step.done = true;
        },
      },
      {
        pose: 'cheer',
        ms: 900,
        start: (step) => {
          step.pose = ovenIs(oven).done ? 'cheer' : 'sit';
          say(ovenIs(oven).done ? '✦' : '…');
        },
      },
    ];
    // The door: she paws at it (it opens only on a baked pastry with the oven
    // off; else it rattles), the tray slides out, and up the pastry hops onto
    // the top beside her, to be eaten ("nom", "crunch"), a heart.
    const takeOut = (oven) => {
      const kind = oven.dataset.ovenPastry;
      const spot = () => ovenX(oven, 100);
      const pastry = (extra) => putThing({ kind: 'pastry', variant: kind, x: spot(), y: state.y, ...extra });
      const eat = [
        {
          pose: 'startle',
          ms: 700,
          start: () => (say('!'), saw('oven:steal')),
          // Up out of the window (its middle, 80 across and 42 down from the
          // top) onto the top beside her.
          frame: (step, time, k) => {
            const rect = oven.getBoundingClientRect();
            const from = { x: ovenX(oven, 80), y: state.y + (42 * rect.width) / OVEN_UNITS };
            pastry({
              x: from.x + (spot() - from.x) * k,
              y: from.y + (state.y - from.y) * k - 40 * Math.sin(Math.PI * k),
              rotate: 360 * k,
            });
          },
        },
        { pose: 'crouch', ms: 700, start: () => pastry() },
        { pose: 'crouch', ms: 700, start: () => (say('nom'), pastry({ scale: 0.7 })) },
        { pose: 'crouch', ms: 700, start: () => pastry({ scale: 0.4 }) },
        { pose: 'sit', mood: 'purring', ms: 900, start: () => (pastry({ scale: 0.4, opacity: 0 }), say('crunch')) },
        { pose: 'groom', ms: 1300, start: () => (putThing(null), say('heart')) },
      ];
      return [
        { to: ovenX(oven, 66) },
        { pose: 'sit', ms: 500, start: () => (state.facing = 1) },
        { pose: 'dangle', ms: 700, start: () => say('…') },
        {
          pose: 'dangle',
          ms: 900,
          start: () => {
            const ready = ovenIs(oven).done && !ovenIs(oven).on;
            ovenTell('take');
            state.steps.unshift(...(ready ? eat : [{ pose: 'sit', mood: 'sulk', ms: 1400, start: () => say('?') }]));
          },
        },
      ];
    };
    const ovenReactions = noted('oven', {
      // A whole bake: switched on if it is off, watched till it is done,
      // switched off, and out it comes.
      bake: (oven, again) => {
        const { on, done } = ovenIs(oven);
        return [
          ...(!on && !done ? [...pawOn(oven, 112, 1, 'on', '♪'), { pose: 'sit', mood: 'purring', ms: 600 }] : []),
          ...(!done ? watchIt(oven) : []),
          ...(on || !done ? pawOn(oven, 112, 1, 'off', '!') : []),
          { pose: 'sit', mood: 'purring', ms: 500 },
          ...takeOut(oven),
          offScene(oven, again),
        ];
      },
      // Baked already, and the oven off: out it comes.
      steal: (oven, again) => [...takeOut(oven), offScene(oven, again)],
      // Watching it bake, and a mew at you for it.
      watch: (oven, again) => [
        ...watchIt(oven, 7000),
        { pose: 'sniff', ms: 1000, start: () => say('sniff') },
        { pose: 'beg', mood: 'hungry', ms: 1800, start: () => say('mew') },
        offScene(oven, again),
      ],
      // The power button: off ("!", a jump, then an innocent wink), or on to
      // help ("♪", "✦").
      knob: (oven, again) => {
        const { on } = ovenIs(oven);
        return [
          ...pawOn(oven, 112, 1, on ? 'off' : 'on', on ? '!' : '♪'),
          ...(on
            ? [
                { pose: 'startle', ms: 520, frame: (step, time, k) => (state.lift = 14 * Math.sin(Math.PI * k)) },
                { pose: 'sit', ms: 900, start: () => ((state.facing = -1), say('…')) },
                { pose: 'wink', ms: 1000 },
              ]
            : [
                { pose: 'sit', mood: 'purring', ms: 1200, start: () => say('✦') },
                { pose: 'cheer', ms: 800 },
              ]),
          offScene(oven, again),
        ];
      },
      // The heat dial turned up ("click"): the glow flares and the steam
      // rushes up round her; too hot ("hot!"), a jump, a sneeze, a lick.
      dial: (oven, again) => [
        ...pawOn(oven, 60, -1, 'hot', 'click'),
        { pose: 'sit', ms: 900, start: () => say('…') },
        {
          pose: 'startle',
          ms: 600,
          start: () => say('hot!'),
          frame: (step, time, k) => (state.lift = 24 * Math.sin(Math.PI * k)),
        },
        { pose: 'sit', mood: 'sneeze', ms: 900, start: () => say('achoo!') },
        { pose: 'groom', ms: 1300 },
        offScene(oven, again),
      ],
      // Down onto the counter in front of the window: up on her hind legs,
      // paws on the glass, peering in ("mm…" at a pastry baking, "…" in a
      // cold oven); then polishing it, paws going round ("squeak"), a sparkle;
      // and back up on top.
      window: (oven, again) => {
        const front = oven.parentElement?.querySelector('[data-cat-oven-front]');
        if (!front) return [offScene(oven, again)];
        const lit = ovenIs(oven).on;
        // Up on her toes, paws on the glass.
        const up = () => (state.lift = 12);
        return [
          {
            pose: 'sit',
            ms: 400,
            start: () => {
              state.resume = {
                steps: () => [
                  { pose: 'sit', ms: 500, start: () => (state.facing = -1) },
                  { pose: 'press', ms: 2600, start: () => say(lit ? 'mm…' : '…'), frame: up },
                  ...[0, 1, 2].flatMap((beat) => [
                    {
                      pose: 'wave',
                      ms: 320,
                      start: () => beat === 0 && say('squeak'),
                      frame: up,
                    },
                    { pose: 'press', ms: 320, frame: up },
                  ]),
                  { pose: 'cheer', ms: 800, start: () => say('✦') },
                  { pose: 'sit', mood: 'purring', ms: 700, start: () => say(lit ? 'heart' : '…') },
                  {
                    pose: 'sit',
                    ms: 300,
                    start: () => {
                      state.resume = { steps: () => [offScene(oven, again)] };
                      leapTo(oven, ovenX(oven, 80), HOP_MS);
                    },
                  },
                ],
              };
              leapTo(front, ovenX(oven, 80), HOP_MS);
            },
          },
        ];
      },
      // Into the steam over the middle: a loaf, purring, then fast asleep.
      warm: (oven, again) => [
        { to: ovenX(oven, 80) },
        { pose: 'sit', mood: 'purring', ms: 700, start: () => say('~') },
        { pose: 'rest', mood: 'purring', ms: 1600, start: () => say('prr') },
        snooze(random(9000, 13000)),
        { pose: 'stretch', mood: 'yawn', ms: 1300 },
        { pose: 'sit', mood: 'purring', ms: 700, start: () => say('heart') },
        offScene(oven, again),
      ],
      // Late: beside the kitchen timer, she bats it (her paw at her drawing's
      // x 36, 30 up), and it rings: a leap, a puff of fright, a glare.
      timer: (oven, again) => [
        { to: ovenX(oven, 90) + (60 - 36) * UNIT - 4 },
        { pose: 'sit', ms: 800, start: () => ((state.facing = -1), say('?')) },
        { pose: 'reach', ms: 300 },
        { pose: 'sit', ms: 450 },
        { pose: 'reach', ms: 300, start: () => ovenTell('ring') },
        {
          pose: 'startle',
          ms: 600,
          start: () => say('!'),
          frame: (step, time, k) => (state.lift = 30 * Math.sin(Math.PI * k)),
        },
        { pose: 'hiss', ms: 900, start: () => say('hsss') },
        { pose: 'sit', mood: 'sulk', ms: 1400, start: () => say('…') },
        offScene(oven, again),
      ],
      // Closed: curled up beside the dozing oven, its z's and hers.
      snooze: (oven, again) => [
        { to: ovenX(oven, 70) },
        { pose: 'sit', mood: 'drowsy', ms: 1200, start: () => say('…') },
        { pose: 'rest', mood: 'drowsy', ms: 1300 },
        snooze(random(10000, 14000)),
        { pose: 'stretch', mood: 'yawn', ms: 1300 },
        offScene(oven, again),
      ],
      // Closed: she knocks on it (it rattles), and nobody comes ("…", "mew?");
      // she lies down by it a while.
      knock: (oven, again) => [
        { to: ovenX(oven, 80) },
        { pose: 'sit', ms: 600, start: () => say('?') },
        ...[0, 1].flatMap(() => [
          { pose: 'pat', ms: 300, start: () => (say('knock'), ovenTell('knock')) },
          { pose: 'sit', ms: 350 },
        ]),
        { pose: 'sit', ms: 1400, start: () => say('…') },
        { pose: 'sit', mood: 'sad', ms: 1200, start: () => say('mew?') },
        { pose: 'rest', mood: 'drowsy', ms: 1500 },
        snooze(random(6000, 8000)),
        offScene(oven, again),
      ],
    });
    // At a server's packing counter (its status pill's card, HostPacking.jsx:
    // a scene 144 units across from 8 and 60 down from 34; the pile of six,
    // 34 to 70 across, its top pastry 71 down; the counter's line 88.6 down;
    // the box 95 to 129 across, its front's top 72). She stands at the
    // counter, between the pile and the box, and has her paws in it: if the
    // box is (nearly) empty, in she hops (if it fits, she sits), peeking over
    // its front, and the packing waits for her; she takes the packing over a
    // while, carrying pastries from the pile into the box herself; she sneaks
    // one off the pile and eats it; she cheers a full box off; and with the
    // counter asleep (the server not answering, or closed) she naps on the
    // box, or nudges the sleeping pile. She tells the counter what she does
    // to it (a 'bakery-pack' event: hold, go, pick).
    const packTell = (what) => window.dispatchEvent(new CustomEvent('bakery-pack', { detail: what }));
    // A spot in the counter's scene, on the page, and the scene's scale.
    const packAt = (counter, u, v = 88.6) => {
      const rect = counter.parentElement.querySelector('svg').getBoundingClientRect();
      const scale = rect.width / 144;
      return { x: rect.left + window.scrollX + (u - 8) * scale, y: rect.top + window.scrollY + (v - 34) * scale, scale };
    };
    // The pile's spots, in the order they go (as HostPacking.jsx's PILE).
    const PACK_PILE = [
      [52, 71],
      [61, 79.5],
      [43, 79.5],
      [70, 88],
      [52, 88],
      [34, 88],
    ];
    const packFits = (counter) => {
      const { catPack: kind, packLeft, packPhase: phase } = counter.dataset;
      if (kind === 'asleep') return ['nap', 'nudge'];
      const left = Number(packLeft);
      const fits = phase === 'packing' && left >= 2 ? ['help', 'snack'] : phase === 'packing' && left ? ['snack'] : [];
      if (phase === 'packing' && left >= 5) fits.push('box');
      return fits.length ? fits : ['cheer'];
    };
    // Her paw at her drawing's (dx, dy), on the page.
    const pawAt = (dx, dy) => ({ x: state.x - state.facing * (dx - 60) * UNIT, y: state.y - (88 - dy) * UNIT });
    // One of the pile's pastries (at the counter's size), wherever it is.
    const packPastry = (counter, extra) =>
      putThing({
        kind: 'pastry',
        variant: counter.dataset.packPastry,
        scale: (packAt(counter, 0).scale * 0.5) / 0.68,
        ...extra,
      });
    // The top one off the pile, into her reaching paw (facing the pile, on
    // her left); then (kept) held in front of her.
    const pickOne = (counter) => ({
      pose: 'reach',
      ms: 450,
      start: (step) => {
        step.from = PACK_PILE[PACK_PILE.length - Number(counter.dataset.packLeft)] ?? PACK_PILE[0];
        packTell('pick');
      },
      frame: (step, time, k) => {
        const from = packAt(counter, ...step.from);
        const paw = pawAt(36, 62);
        packPastry(counter, {
          x: from.x + (paw.x - from.x) * k,
          y: from.y + (paw.y - from.y) * k - 14 * Math.sin(Math.PI * k),
        });
      },
    });
    const packReactions = noted('pack', {
      // In she hops (the packing waiting for her), peeking over the box's
      // front, ducks, peeks again; out she hops, and it goes on.
      box: (counter, again) => {
        const box = counter.parentElement.querySelector('[data-cat-pack-box]');
        const at = packAt(counter, 86).x;
        return [
          { to: at },
          { pose: 'sit', ms: 700, start: () => ((state.facing = 1), say('?')) },
          {
            pose: 'crouch',
            ms: 300,
            start: () => {
              packTell('hold');
              state.resume = {
                steps: () => [
                  { pose: 'peek', ms: 1900, start: () => say('prr') },
                  { pose: 'lurk', ms: 900 },
                  { pose: 'peek', ms: 1800, start: () => say('heart') },
                  {
                    pose: 'peek',
                    ms: 300,
                    start: () => {
                      state.resume = {
                        steps: () => [{ pose: 'sit', ms: 500, start: () => packTell('go') }, offScene(counter, again)],
                      };
                      leapTo(counter, at, HOP_MS);
                    },
                  },
                ],
              };
              if (box) leapTo(box, null, HOP_MS);
            },
          },
        ];
      },
      // The packing held, she packs two or three herself: each off the pile
      // into her paw, then over and down into the box; a cheer, and it goes on.
      help: (counter, again) => {
        const count = Math.min(3, Number(counter.dataset.packLeft));
        const into = (step, time, k) => {
          const box = packAt(counter, 112, 70);
          const paw = pawAt(36, 62);
          packPastry(counter, {
            x: paw.x + (box.x - paw.x) * k,
            y: paw.y + (box.y - paw.y) * k - 16 * Math.sin(Math.PI * k),
            opacity: k > 0.8 ? 0 : 1,
          });
        };
        return [
          { to: packAt(counter, 86).x },
          { pose: 'sit', ms: 500, start: () => (packTell('hold'), say('!')) },
          ...Array.from({ length: count }, () => [
            { pose: 'sit', ms: 300, start: () => (state.facing = -1) },
            pickOne(counter),
            { pose: 'sit', ms: 300, start: () => (state.facing = 1) },
            { pose: 'reach', ms: 450, frame: into },
            { pose: 'sit', ms: 250, start: () => putThing(null) },
          ]).flat(),
          { pose: 'cheer', ms: 900, start: () => (packTell('go'), say('✦')) },
          offScene(counter, again),
        ];
      },
      // A glance each way, one off the pile, and eaten ("nom", "crunch");
      // "shh", with a wink.
      snack: (counter, again) => {
        const front = () => ({ x: state.x - 16, y: state.y });
        return [
          { to: packAt(counter, 86).x },
          { pose: 'sit', ms: 500, start: () => (state.facing = 1) },
          { pose: 'sit', ms: 500, start: () => (state.facing = -1) },
          pickOne(counter),
          { pose: 'crouch', ms: 700, start: () => packPastry(counter, front()) },
          { pose: 'crouch', ms: 700, start: () => (say('nom'), packPastry(counter, { ...front(), scale: 0.9 })) },
          {
            pose: 'sit',
            mood: 'purring',
            ms: 900,
            start: () => (packPastry(counter, { ...front(), scale: 0.5, opacity: 0 }), say('crunch')),
          },
          { pose: 'groom', ms: 1200, start: () => putThing(null) },
          { pose: 'wink', ms: 1000, start: () => say('shh') },
          offScene(counter, again),
        ];
      },
      // A full box going off (or a new one coming): she claps it away.
      cheer: (counter, again) => [
        { to: packAt(counter, 86).x },
        { pose: 'sit', ms: 400, start: () => (state.facing = 1) },
        ...[0, 1, 2].flatMap((beat) => [
          { pose: 'clap', mood: 'purring', ms: 300, start: () => beat === 0 && say('✦') },
          { pose: 'clap2', mood: 'purring', ms: 300 },
        ]),
        { pose: 'sit', mood: 'purring', ms: 700, start: () => say('heart') },
        offScene(counter, again),
      ],
      // Asleep: up on the box, curled up asleep on it.
      nap: (counter, again) => {
        const box = counter.parentElement.querySelector('[data-cat-pack-box]');
        const at = packAt(counter, 86).x;
        return [
          { to: at },
          {
            pose: 'sit',
            mood: 'drowsy',
            ms: 900,
            start: () => {
              say('…');
              state.resume = {
                steps: () => [
                  { pose: 'rest', mood: 'drowsy', ms: 1200 },
                  snooze(random(9000, 13000)),
                  { pose: 'stretch', mood: 'yawn', ms: 1300 },
                  {
                    pose: 'sit',
                    ms: 300,
                    start: () => {
                      state.resume = { steps: () => [offScene(counter, again)] };
                      leapTo(counter, at, HOP_MS);
                    },
                  },
                ],
              };
              if (box) leapTo(box, null, HOP_MS);
            },
          },
        ];
      },
      // Asleep: she taps the sleeping pile ("mew?"), twice; nothing; she lies
      // down by it a while.
      nudge: (counter, again) => [
        { to: packAt(counter, 86).x },
        { pose: 'sit', ms: 500, start: () => (state.facing = -1) },
        ...[0, 1].flatMap(() => [
          { pose: 'reach', ms: 300, start: () => say('mew?') },
          { pose: 'sit', ms: 500 },
        ]),
        { pose: 'sit', mood: 'sad', ms: 1200, start: () => say('…') },
        { pose: 'rest', mood: 'drowsy', ms: 1300 },
        snooze(random(6000, 8000)),
        offScene(counter, again),
      ],
    });
    // Her owner has earned another cookie (a GPU-hour): a little oven turns
    // up beside her, "ding!", its door drops open and out hops the cookie;
    // she eats it, pleased.
    const earned = noted('oven', {
      cookie: () => {
        const dir = roomy();
        const at = onEdge(state.x + dir * 46);
        const land = () => state.x + dir * 20;
        const oven = (open, extra = {}) => ({ kind: 'minioven', x: at, y: state.y, count: open, scale: 1.3, ...extra });
        const cookie = (extra) => ({ kind: 'treat', x: land(), y: state.y - 4, ...extra });
        return [
          { pose: 'sit', ms: 900, start: () => ((state.facing = dir), putThing(oven(0)), say('?')) },
          {
            pose: 'startle',
            ms: 520,
            start: () => say('ding!'),
            frame: (step, time, k) => {
              state.lift = 14 * Math.sin(Math.PI * k);
              putThing(oven(k));
            },
          },
          {
            pose: 'sit',
            ms: 600,
            frame: (step, time, k) => {
              const from = at - dir * 3;
              putThing([
                oven(1),
                cookie({
                  x: from + (land() - from) * k,
                  y: state.y - 12 - 4 + 8 * k - 26 * Math.sin(Math.PI * k),
                  rotate: dir * 360 * k,
                }),
              ]);
            },
          },
          { pose: 'crouch', ms: 700, start: () => putThing([oven(1), cookie()]) },
          { pose: 'crouch', ms: 800, start: () => (say('nom'), putThing([oven(1), cookie({ scale: 0.6 })])) },
          {
            pose: 'sit',
            mood: 'purring',
            ms: 900,
            start: () => {
              putThing([oven(1, { opacity: 0 }), cookie({ scale: 0.6, opacity: 0 })]);
              say('crunch');
              cheerUp(JOY.cookie);
            },
          },
          { pose: 'groom', ms: 1300, start: () => (putThing(null), say('heart')) },
        ];
      },
    });

    // Going over to a pop-up card ('go'): a run of phases, each placing it (x,
    // y in the page) as k goes from 0 to 1 from where the last one left it.
    // Its spot on the card is kept as a distance from the card's left (or, on
    // its side, down from its top), so it follows the card.
    const goSpot = () => {
      const { card, along } = state.go;
      const edge = page(card.getBoundingClientRect());
      return { x: Math.min(edge.right - MARGIN, Math.max(edge.left + MARGIN, edge.left + along)), y: edge.top + 1 };
    };
    const goSide = () => {
      const { card, side, down } = state.go;
      const edge = page(card.getBoundingClientRect());
      return { x: side === 'left' ? edge.left - 1 : edge.right + 1, y: edge.top + down };
    };
    // How high an arc onto the card's top must rise to keep above the card
    // all the way (the card is drawn over the cat, so it would vanish behind
    // it), from a little after it sets off.
    const clearance = (from, target) => {
      const edge = page(state.go.card.getBoundingClientRect());
      let need = 0;
      for (let k = 0.2; k < 0.98; k += 0.02) {
        const eased = 0.5 * k + 0.25 * (1 - Math.cos(Math.PI * k));
        const x = from.x + (target.x - from.x) * eased;
        if (x < edge.left - WIDTH / 2 + 12 || x > edge.right + WIDTH / 2 - 12) continue;
        const y = from.y + (target.y - from.y) * eased;
        need = Math.max(need, (y - edge.top + 2) / (4 * k * (1 - k)));
      }
      return Math.min(260, need);
    };
    // An arc through the air to where to() says, nose up as it rises and down
    // as it comes in to land, or turning head over heels forwards (spin).
    const goArc = ({ to = goSpot, ms = LEAP_MS, height = null, pose = 'leap', spin = false, begin } = {}) => ({
      pose,
      ms,
      start: (phase) => {
        begin?.();
        state.side = 'top';
        const target = to();
        state.facing = target.x < state.x ? -1 : 1;
        phase.height = height ?? 30 + Math.abs(target.y - state.y) * 0.25;
        if (to === goSpot) phase.height = Math.max(phase.height, clearance(phase.from, target));
      },
      frame: (phase, k) => {
        const target = to();
        const eased = 0.5 * k + 0.25 * (1 - Math.cos(Math.PI * k));
        const pace = 0.5 + 0.25 * Math.PI * Math.sin(Math.PI * k);
        const dx = target.x - phase.from.x;
        state.x = phase.from.x + dx * eased;
        state.y = phase.from.y + (target.y - phase.from.y) * eased - phase.height * 4 * k * (1 - k);
        if (spin) state.spin = state.facing * 360 * easeInOut(k);
        else {
          const rise = phase.height * 4 * (1 - 2 * k) - (target.y - phase.from.y) * pace;
          state.tilt = Math.max(-18, Math.min(18, (0.6 * Math.atan2(rise, Math.abs(dx * pace) + 60) * 180) / Math.PI));
        }
      },
    });
    // A pose held a while where it is (rocking, if it likes).
    const goPause = (pose, ms, extra = {}) => ({ pose, ms, ...extra });
    // Along the top of its own panel towards x (kept to the panel, and going
    // no more than most), at a pace.
    const goTrot = (x, speed, pose, most) => ({
      pose,
      start: (phase) => {
        const edge = page(state.go.from.getBoundingClientRect());
        const to = Math.min(edge.right - MARGIN, Math.max(edge.left + MARGIN, x()));
        phase.to = Math.abs(to - state.x) > most ? state.x + Math.sign(to - state.x) * most : to;
        phase.ms = (Math.abs(phase.to - state.x) / speed) * 1000;
        if (phase.to !== state.x) state.facing = phase.to < state.x ? -1 : 1;
      },
      frame: (phase, k) => {
        state.x = phase.from.x + (phase.to - phase.from.x) * k;
        state.y = page(state.go.from.getBoundingClientRect()).top + 1;
      },
    });
    // Skidding to a stop along the card's top, just landed.
    const goSkid = () => ({
      pose: 'skid',
      ms: 400,
      start: (phase) => (phase.dir = state.facing),
      frame: (phase, k) => {
        const edge = page(state.go.card.getBoundingClientRect());
        const x = phase.from.x + phase.dir * 32 * (1 - (1 - k) ** 2);
        state.x = Math.min(edge.right - MARGIN, Math.max(edge.left + MARGIN, x));
        state.y = edge.top + 1;
      },
    });
    // Where on its own panel it sets off from: as near the spot as its panel
    // goes, short of it by a run-up, and not from under the card (from just
    // clear of its near side instead).
    const takeoff = (short) => () => {
      const spot = goSpot();
      const dir = Math.sign(spot.x - state.x) || 1;
      const edge = page(state.go.card.getBoundingClientRect());
      const x = spot.x - dir * short;
      if (coverOf(edge, x, page(state.go.from.getBoundingClientRect()).top) < 0.1) return x;
      return dir > 0 ? edge.left - WIDTH / 2 - 10 : edge.right + WIDTH / 2 + 10;
    };
    // Its ways over (each only where it fits; see goWaysFor).
    const goWays = noted('over', {
      // A plain leap.
      leap: () => [goPause(onSide() ? 'cling' : 'crouch', SPRING_MS), goArc()],
      // Stalking it, rump waggling, then a long, low pounce and a skid to a stop.
      pounce: () => [
        goPause('stalk', 1000, {
          rock: { amp: 3, freq: 5.5, decay: 0 },
          start: () => (state.facing = goSpot().x < state.x ? -1 : 1),
        }),
        goArc({ ms: 560, height: 14 }),
        goSkid(),
      ],
      // Creeping up along its panel, a paw at a time, and a quiet hop on.
      sneak: () => [
        goTrot(takeoff(70), STROLL * 1.3, strides('creep', 'creep2', 260), 200),
        goPause('crouch', 260),
        goArc({ ms: 560, height: 16 }),
      ],
      // A dash along its panel and a flying leap, skidding to a stop on it.
      dash: () => [
        goTrot(takeoff(110), CHASE * 2.2, strides('run', 'run2', 110), 420),
        goArc({ ms: 600, height: 26 }),
        goSkid(),
      ],
      // A somersault onto it, landed with both paws up.
      flip: () => [
        goPause('crouch', 420, { rock: { amp: 3.5, freq: 5.5, decay: 0 } }),
        goArc({ ms: 820, height: 70, pose: 'tuck', spin: true }),
        goPause('cheer', 800, { start: () => ((state.spin = null), say('✦')) }),
      ],
      // A leap to its side, clinging on, a climb up it, and a hop up over its top.
      climb: () => [
        goPause(onSide() ? 'cling' : 'crouch', SPRING_MS),
        goArc({ to: goSide }),
        goPause('cling', 300, { start: () => (state.side = state.go.side) }),
        {
          pose: 'climb',
          start: (phase) => {
            phase.down = state.go.down;
            phase.ms = Math.max(500, ((phase.down - 40) / 70) * 1000);
          },
          frame: (phase, k) => {
            state.go.down = phase.down + (40 - phase.down) * k;
            const spot = goSide();
            state.x = spot.x;
            state.y = spot.y;
          },
        },
        goArc({ ms: 440, height: 26 }),
      ],
      // Up and across holding a balloon, and, over its spot, letting go to drop
      // onto it; the balloon floats off.
      balloon: () => [
        goPause(onSide() ? 'cling' : 'sit', 400, { mood: 'purring', start: () => say('!') }),
        {
          pose: 'hang',
          mood: 'purring',
          start: (phase) => {
            const spot = goSpot();
            state.side = 'top';
            state.facing = spot.x < state.x ? -1 : 1;
            phase.ms = Math.min(3000, Math.max(1600, Math.hypot(spot.x - state.x, spot.y - state.y) * 7));
          },
          frame: (phase, k, time) => {
            // Up first to over the card's top, then across to over its spot.
            const spot = goSpot();
            const high = Math.min(phase.from.y, spot.y - 56);
            const up = easeInOut(Math.min(1, k / 0.5));
            const across = easeInOut(Math.max(0, (k - 0.3) / 0.7));
            state.x =
              phase.from.x + (spot.x - phase.from.x) * across + Math.sin(time / 400) * 6 * Math.sin(Math.PI * k);
            state.y = phase.from.y + (high - phase.from.y) * up + (spot.y - 56 - high) * across;
            putThing({ kind: 'balloon', x: state.x, y: state.y });
          },
        },
        {
          pose: 'leap',
          ms: 420,
          frame: (phase, k) => {
            const spot = goSpot();
            state.x = spot.x;
            state.y = phase.from.y + (spot.y - phase.from.y) * k * k;
            putThing({ kind: 'balloon', x: spot.x, y: phase.from.y - 170 * k, opacity: 1 - k });
          },
        },
      ],
      // Opening an umbrella and drifting down onto it, swaying.
      umbrella: () => [
        goPause(onSide() ? 'cling' : 'crouch', SPRING_MS),
        {
          pose: 'brolly',
          start: (phase, time) => {
            const spot = goSpot();
            state.side = 'top';
            state.facing = spot.x < state.x ? -1 : 1;
            state.rock = { amp: 7, freq: 0.8, decay: 0, from: time };
            phase.ms = Math.min(3000, Math.max(1600, Math.hypot(spot.x - state.x, spot.y - state.y) * 6));
          },
          frame: (phase, k, time) => {
            const spot = goSpot();
            const eased = easeInOut(k);
            state.x =
              phase.from.x + (spot.x - phase.from.x) * eased + Math.sin(time / 520) * 12 * Math.sin(Math.PI * k);
            // A little hop up off its edge first.
            const hop = k < 0.4 ? 26 * Math.sin(Math.PI * k * 2.5) : 0;
            state.y = phase.from.y + (spot.y - phase.from.y) * eased - hop;
          },
        },
        goPause('sit', 500, { mood: 'purring' }),
      ],
    });
    // The ways over that fit: a leap always; from a panel's top, a somersault,
    // a pounce and (with a run along its panel to make) a creep or a dash, the
    // last three not out from under the card; a climb when the card's near
    // side has room; a balloon up to a card above it, an umbrella down to one
    // well below.
    const goWaysFor = (card, spotX, blocked) => {
      const edge = page(card.getBoundingClientRect());
      const ways = onSide() ? ['leap'] : ['leap', 'flip'];
      const panel = state.perch && !onSide() ? page(state.perch.getBoundingClientRect()) : null;
      if (panel && !blocked && panel.right - panel.left > 2 * MARGIN + 40) {
        ways.push('pounce');
        const off = Math.min(
          panel.right - MARGIN,
          Math.max(panel.left + MARGIN, spotX - Math.sign(spotX - state.x) * 70),
        );
        if (Math.abs(off - state.x) > 60) ways.push('sneak', 'dash');
      }
      if (sideFits(card, state.x < (edge.left + edge.right) / 2 ? 'left' : 'right')) ways.push('climb');
      if (edge.top < state.y - 40) ways.push('balloon');
      if (edge.top > state.y + 60) ways.push('umbrella');
      return ways;
    };
    const goOver = (card, blocked) => {
      // The bakery's card: up onto its oven (drawn over the card), there to
      // do something with it; a packing counter's, onto its counter.
      const oven = state.forcePopup?.reaction ? null : ovenOf(card);
      const counter = state.forcePopup?.reaction || oven ? null : packOf(card);
      const target = oven ?? counter ?? card;
      const rect = target.getBoundingClientRect();
      // Nowhere on it to sit: too narrow, or its top under the navigation bar
      // or down at the bottom of the window.
      if (rect.width < 2 * MARGIN + 20 || rect.top < topClear() || rect.top > window.innerHeight - 30) return false;
      const edge = page(rect);
      const along = random(MARGIN, edge.right - edge.left - MARGIN);
      let steps;
      if (oven) {
        const fits = ovenFits(oven);
        const name = ovenReactions[state.forceOven] ? state.forceOven : pickAfresh('oven', fits);
        state.lastAt = { ...state.lastAt, oven: name };
        steps = () => ovenReactions[name](oven);
      } else if (counter) {
        const name = packReactions[state.forcePack] ? state.forcePack : pickAfresh('pack', packFits(counter));
        state.lastAt = { ...state.lastAt, pack: name };
        steps = () => packReactions[name](counter);
      } else {
        const reactions = Object.keys(popupReactions).filter((name) => name !== state.lastPopup);
        const reaction = state.forcePopup?.reaction ?? reactions[Math.floor(Math.random() * reactions.length)];
        state.lastPopup = reaction;
        steps = () => popupReactions[reaction](card);
      }
      const ways = goWaysFor(target, edge.left + along, blocked);
      const fresh = ways.filter((name) => name !== state.lastGo);
      const way =
        state.forcePopup?.way ??
        (fresh.length ? fresh : ways)[Math.floor(Math.random() * (fresh.length || ways.length))];
      state.lastGo = way;
      closeMenu();
      releaseTile();
      state.resume = { steps };
      state.go = {
        card: target,
        way,
        along,
        side: state.x < (edge.left + edge.right) / 2 ? 'left' : 'right',
        // For a climb, how far down its side it lands.
        down: Math.min(edge.bottom - edge.top - 30, random(70, 130)),
        from: state.perch,
        phases: goWays[way](),
        index: -1,
      };
      Object.assign(state, { mode: 'go', spin: null, rock: null, tilt: 0, lift: 0 });
      return true;
    };
    // There: onto the card's top, and on with what it came to do.
    const landOn = (card, time) => {
      putThing(null);
      const edge = page(card.getBoundingClientRect());
      Object.assign(state, {
        go: null,
        spin: null,
        rock: null,
        tilt: 0,
        perch: card,
        side: 'top',
        mode: 'land',
        until: time + 60,
      });
      state.along = state.x - edge.left;
    };
    // Its pop-up card gone from under it, or gone before it got there: down it
    // drops onto the panel below, else the first in view.
    const dropDown = () => {
      state.perch = null;
      say('!');
      const perches = visiblePerches();
      const below = perches
        .map((element) => ({ element, edge: page(element.getBoundingClientRect()) }))
        .filter(({ edge }) => edge.top > state.y - 20)
        .sort((a, b) => a.edge.top - b.edge.top)[0]?.element;
      const to = below ?? perches[0];
      if (to) leapTo(to, state.x, DROP_MS);
      else state.mode = 'idle';
    };

    // Scared of a pop-up card: puffed up and hissing at it (unless it came
    // down over it, when it bolts first and hisses once clear), then off along
    // its panel away from it as fast as it can go, till well clear of it; or,
    // if its panel ends first, to the end and over to a panel well away from
    // it. There, a while cowering or hiding with just its eyes over its edge,
    // and a peek, before it settles.
    const fleeing = strides('flee', 'flee2', 100);
    const faceCard = (card) => {
      if (!card.isConnected) return;
      const edge = page(card.getBoundingClientRect());
      state.facing = (edge.left + edge.right) / 2 < state.x ? -1 : 1;
    };
    const hissAt = (card) => ({
      pose: 'hiss',
      ms: 1100,
      start: () => (faceCard(card), say('hsss!')),
      frame: (step, now, k) => (state.lift = 22 * Math.sin(Math.PI * Math.min(1, k * 2.5))),
    });
    const afterFright = (card, hissed) => [
      ...(hissed ? [] : [hissAt(card)]),
      Math.random() < 0.5
        ? { pose: 'cower', ms: 2000, start: () => faceCard(card) }
        : { pose: 'lurk', ms: 2200, start: () => faceCard(card) },
      { pose: 'peek', ms: 1400, start: () => say('?') },
    ];
    const runFrom = (card, blocked, time) => {
      cheerUp(JOY.fright);
      const edge = page(card.getBoundingClientRect());
      const middle = (edge.left + edge.right) / 2;
      // A panel to bolt to: in view, its far end from the card clear of it and
      // further from it than the cat is now; the nearest such.
      const refuge = () => {
        const here = gapTo(edge, state.x, state.y - HEIGHT / 2);
        return visiblePerches()
          .filter((element) => element !== state.perch)
          .map((element) => {
            const panel = page(element.getBoundingClientRect());
            const x = middle < (panel.left + panel.right) / 2 ? panel.right - MARGIN : panel.left + MARGIN;
            return {
              element,
              x,
              away: gapTo(edge, x, panel.top - HEIGHT / 2),
              cover: coverOf(edge, x, panel.top),
              distance: Math.hypot(x - state.x, panel.top - state.y),
            };
          })
          .filter(({ away, cover, distance }) => cover < 0.05 && away > Math.max(here, 120) && distance < 800)
          .sort((a, b) => a.distance - b.distance)[0];
      };
      const bolt = (to, hissed) => ({
        pose: 'crouch',
        ms: 120,
        start: () => {
          state.resume = { steps: () => afterFright(card, hissed) };
          leapTo(to.element, to.x);
        },
      });
      const panel = state.perch && !onSide() ? edgeNow() : null;
      if (!panel || panel.right - panel.left < 2 * MARGIN + 40) {
        const to = refuge();
        if (!to) return false;
        if (onSide()) {
          state.resume = { steps: () => afterFright(card, false) };
          leapTo(to.element, to.x);
        } else play([bolt(to, false)], time);
        return true;
      }
      const [low, high] = [panel.left + MARGIN, panel.right - MARGIN];
      const away = state.x < middle ? -1 : 1;
      // Clear of the card that way, and at least a good dash.
      const clear = (dir) =>
        dir < 0
          ? Math.min(edge.left - WIDTH / 2 - 50, state.x - 160)
          : Math.max(edge.right + WIDTH / 2 + 50, state.x + 160);
      const dir = [away, -away].find((way) => clear(way) >= low && clear(way) <= high);
      const steps = blocked ? [] : [hissAt(card)];
      if (dir) steps.push({ pose: fleeing, to: clear(dir), speed: CHASE * 2.4 }, ...afterFright(card, !blocked));
      else {
        const to = refuge();
        steps.push({ pose: fleeing, to: away < 0 ? low : high, speed: CHASE * 2.4 });
        if (to) steps.push(bolt(to, !blocked));
        else steps.push(...afterFright(card, !blocked));
      }
      play(steps, time);
      return true;
    };

    // A pop-up card opened, kept open by a click, or found over it: whether it
    // notices, and what it does about it.
    const onPopup = (card, time = performance.now()) => {
      if (quietRef.current || state.inside || !card?.isConnected || !POPUP_MODES.has(state.mode)) return;
      // (The card she is up on, on its oven, she is drawn over.)
      if (state.perch && card.contains(state.perch)) return;
      const scene = sceneOf(card);
      const rect = card.getBoundingClientRect();
      const edge = page(rect);
      const press = state.lastPress;
      const kind =
        coverOf(edge, state.x, state.y) >= POPUP_BLOCKS
          ? 'blocked'
          : press && time - press.at < 1500 && state.perch?.contains?.(press.target)
            ? 'clicked'
            : rect.bottom > 0 &&
                rect.top < window.innerHeight &&
                gapTo(edge, state.x, state.y - HEIGHT / 2) < POPUP_NEAR
              ? 'near'
              : state.forcePopup || scene
                ? 'clicked'
                : null;
      if (!kind) return;
      const wrapper = card.closest('[data-radix-popper-content-wrapper]');
      // Once each time one opens; one over it, whenever it finds itself under
      // it again a while later.
      if (kind === 'blocked' ? time - (state.popupAt ?? -Infinity) < POPUP_REST_MS : state.popupSeen === wrapper)
        return;
      state.popupSeen = wrapper;
      if (scene) state.sceneSeen = wrapper;
      const weights = { ...POPUP_OUTCOMES[kind] };
      if (state.mode === 'sleep' && weights.nothing) weights.nothing *= 2;
      const outcome = state.forcePopup?.outcome ?? (scene ? 'over' : pick(weights));
      if (outcome === 'nothing') return;
      state.manual = false;
      state.popupAt = time;
      // Any game with the pointer is dropped for it, and not taken up again
      // for a while.
      state.dart = null;
      state.chaseRest = time + 8000;
      if (state.wish) wishFor(null);
      if (things.current) putThing(null);
      const blocked = kind === 'blocked';
      if (outcome === 'over' && goOver(card, blocked)) return;
      if ((outcome === 'scared' || blocked) && runFrom(card, blocked, time)) {
        saw('popup:scared');
        return;
      }
      if (!onSide()) {
        play(startled(), time);
        saw('popup:startle');
      }
    };
    const popupWatch = new MutationObserver((changes) => {
      for (const change of changes) {
        for (const node of change.addedNodes) {
          if (node.nodeType !== 1) continue;
          const card = popupCard(
            node.matches('[data-radix-popper-content-wrapper]')
              ? node
              : node.querySelector('[data-radix-popper-content-wrapper]'),
          );
          // A moment for it to find its place first.
          if (card) setTimeout(() => onPopup(card), 150);
        }
      }
    });
    popupWatch.observe(document.body, { childList: true });

    // The notes pill. While notices wait (see NOTES_CHANCE), over she goes and
    // sits on it to catch her viewer's eye, in one of her ways: waving hello;
    // knocking on it (it jumps a little at each tap; not in quiet mode);
    // planting a little sign on it; ringing a hand bell; or peekaboo from
    // behind it. Then one more hopeful look, and back to a panel. Opened while
    // she is there, she cheers first; cleared, she cheers the all-clear;
    // hidden, she just goes. With nothing waiting (one of her other
    // interactions), she hops onto its all-clear croissant to applaud it or
    // give it a thumbs up. Put down on it, she does whichever fits.
    const bump = (pill) => {
      if (quietRef.current) return;
      pill.parentElement?.animate([{ transform: 'none' }, { transform: 'translateY(2px)' }, { transform: 'none' }], {
        duration: 200,
        easing: 'ease-out',
      });
    };
    // Popping up out of nothing, k from 0 to 1 (a little past, and back).
    const popIn = (k) => 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2;
    // Sat looking out at her viewer, waiting to be noticed.
    const hopeful = (frame) => ({ pose: 'sit', mood: 'content', ms: random(1800, 2400), frame });
    const noteBids = noted('notes', {
      // Up on her haunches waving a paw, bobbing as she waves; twice.
      wave: () => {
        const waving = (call, ms) => ({
          pose: 'hello',
          mood: 'purring',
          ms,
          start: () => say(call),
          frame: (step, time) => (state.lift = 2.5 * Math.abs(Math.sin(((time - step.started) / 500) * Math.PI))),
        });
        return [waving('mew!', 1600), { pose: 'sit', mood: 'purring', ms: 500 }, waving('hi!', 1400), hopeful()];
      },
      // Knock knock: three taps on it with her paws, a call, and two more.
      knock: (pill) => {
        const tap = (pause) => [
          { pose: 'pat', ms: 220, start: () => (say('tap'), bump(pill)) },
          { pose: 'sit', ms: pause },
        ];
        return [
          ...tap(240),
          ...tap(240),
          ...tap(400),
          { pose: 'sit', mood: 'purring', ms: 1300, start: () => say('knock knock!') },
          ...tap(240),
          ...tap(500),
          hopeful(),
        ];
      },
      // A little sign planted on it in front of her, pointing down at it,
      // tapped so it wobbles, and pulled up again.
      sign: () => {
        const text = ['look ↓', 'psst ↓', 'news ↓'][Math.floor(Math.random() * 3)];
        const sign = (extra) => putThing({ kind: 'sign', x: state.x + state.facing * 34, y: state.y, text, ...extra });
        return [
          { pose: 'reach', ms: 420, frame: (step, time, k) => sign({ scale: popIn(k) }) },
          { pose: 'sit', mood: 'purring', ms: 700, start: () => say('!'), frame: () => sign() },
          {
            pose: 'reach',
            mood: 'purring',
            ms: 1400,
            start: () => say('look!'),
            frame: (step, time, k) => sign({ rotate: 7 * Math.sin((time - step.started) / 65) * (1 - k) }),
          },
          hopeful(() => sign()),
          { pose: 'reach', ms: 320, frame: (step, time, k) => sign({ scale: 1 - k }) },
          { pose: 'sit', ms: 200, start: () => putThing(null) },
        ];
      },
      // A hand bell, rung high in a paw so it swings; rung again, and set
      // down beside her, standing on its mouth.
      bell: () => {
        const held = (extra) => putThing({ kind: 'bell', x: state.x + state.facing * 20.6, y: state.y - 28, ...extra });
        const ring = (ms) => ({
          pose: 'reach',
          mood: 'purring',
          ms,
          start: () => say('ding!'),
          frame: (step, time) => {
            const t = (time - step.started) / 1000;
            held({ rotate: 26 * Math.sin(2 * Math.PI * 2.6 * t) * Math.min(1, t * 6) });
            if (t * 1000 > ms / 2 && !step.again) {
              step.again = true;
              say('♪');
            }
          },
        });
        const down = () => putThing({ kind: 'bell', x: state.x + state.facing * 30, y: state.y - 17.8 });
        return [
          { pose: 'reach', ms: 280, frame: (step, time, k) => held({ scale: popIn(k) }) },
          ring(1500),
          { pose: 'reach', mood: 'purring', ms: 500, frame: () => held() },
          ring(1100),
          { pose: 'sit', mood: 'purring', ms: 400, frame: down },
          hopeful(down),
        ];
      },
      // Peekaboo: ducked down behind it, up with just her eyes over its top
      // ("psst!"), down again, and up with a hop and a "boo!".
      peekaboo: () => [
        { pose: 'lurk', ms: 1300 },
        { pose: 'emerge', ms: 1000, start: () => say('psst!') },
        { pose: 'lurk', ms: 900 },
        {
          pose: 'cheer',
          mood: 'purring',
          ms: 600,
          start: () => say('boo!'),
          frame: (step, time, k) => (state.lift = 16 * Math.sin(Math.PI * k)),
        },
        { pose: 'sit', mood: 'purring', ms: 500, start: () => say('heart') },
        hopeful(),
      ],
    });
    // Back from the notes to a panel in view, and (the notes opened) not
    // under them.
    const offNotes = (notes) => {
      state.bidding = null;
      const card = page(notes.getBoundingClientRect());
      const spots = visiblePerches().flatMap((element) => {
        const edge = page(element.getBoundingClientRect());
        const right =
          edge.top < card.top - 10 ? edge.right - MARGIN : Math.min(edge.right - MARGIN, card.left - WIDTH / 2 - 10);
        return right >= edge.left + MARGIN ? [{ element, x: random(edge.left + MARGIN, right) }] : [];
      });
      const to = spots[Math.floor(Math.random() * spots.length)];
      if (!to) return false;
      leapTo(to.element, to.x);
      return true;
    };
    // What she brought fades as she goes.
    const fadeThing = () => {
      if (things.current && !Array.isArray(things.current)) putThing({ ...things.current, opacity: 0 });
    };
    // Cheering the all-clear: applause (a little burst of confetti going up
    // as she starts), or a thumbs up with a wink.
    const pickOf = (list) => list[Math.floor(Math.random() * list.length)];
    const cheers = noted('cheer', {
      applause: () => {
        const clapping = (ms, extra) => ({ pose: strides('clap2', 'clap', 170), mood: 'purring', ms, ...extra });
        return [
          clapping(1900, {
            start: (step) => {
              say(pickOf(['all clear!', 'bravo!', 'yay!']));
              step.burst = { x: state.x, y: state.y - 50 };
            },
            frame: (step, time) =>
              putThing({ kind: 'confetti', ...step.burst, t: Math.min(CONFETTI_S, (time - step.started) / 1000) }),
          }),
          { pose: 'sit', mood: 'purring', ms: 600, start: () => (putThing(null), say('✦')) },
          clapping(1100),
          { pose: 'sit', mood: 'purring', ms: 900 },
        ];
      },
      thumbs: () => [
        {
          pose: 'thumbs',
          mood: 'wink',
          ms: 1900,
          start: () => (say(pickOf(['nice!', 'all good!', 'good job!'])), say('✦')),
          frame: (step, time, k) => (state.lift = k < 0.2 ? 10 * Math.sin((Math.PI * k) / 0.2) : 0),
        },
        { pose: 'sit', mood: 'purring', ms: 900 },
      ],
    });
    // Hidden for now (a little circle with the count): a sniff at it, a
    // puzzled pat or two, or a lie-down on it, purring.
    const curious = {
      sniff: () => [{ pose: 'sniff', ms: 1300, start: () => say('sniff') }],
      pat: () => [
        { pose: 'pat', ms: 240, start: () => say('?') },
        { pose: 'sit', ms: 320 },
        { pose: 'pat', ms: 240 },
        { pose: 'sit', ms: 800 },
      ],
      loaf: () => [{ pose: 'rest', mood: 'purring', ms: 2400, start: () => say('prr') }],
    };
    // An equal pick of names, never the one picked last for this key.
    const pickAfresh = (key, names) => {
      const fresh = names.filter((name) => name !== state.lastAt?.[key]);
      const name = pickOf(fresh.length ? fresh : names);
      state.lastAt = { ...state.lastAt, [key]: name };
      return name;
    };
    // What she does there, by what it shows as she lands (each an equal pick,
    // never the same twice running): notices waiting, one of her ways of
    // calling her viewer over (or way); all clear, a cheer (or way); open, a
    // look at them as at a pop-up card (reading them through her glasses,
    // peeking over, kneading or sniffing along); hidden for now, one of the
    // curious things. Each turned to face into the page first, and ending with
    // a last look ("?", or a heart) and a leap back to a panel.
    const atNotes = (notes, way = null) => {
      const shown = notes.getAttribute('data-cat-notes');
      const steps = [
        {
          pose: 'sit',
          mood: 'purring',
          ms: 300,
          start: () => (state.facing = state.x > window.scrollX + window.innerWidth / 2 ? -1 : 1),
        },
      ];
      state.bidding = null;
      let last = '?';
      if (shown === 'pill') {
        const ways = Object.keys(noteBids).filter(
          (name) => name !== state.lastBid && !(quietRef.current && name === 'knock'),
        );
        const bid = noteBids[way] ? way : pickOf(ways);
        state.lastBid = bid;
        state.bidding = notes;
        state.notesRest = Math.max(state.notesRest ?? 0, performance.now() + NOTES_REST_MS);
        steps.push(...noteBids[bid](notes));
      } else if (shown === 'clear' || shown === 'clear-open') {
        steps.push(...cheers[cheers[way] ? way : pickAfresh('cheer', Object.keys(cheers))]());
        last = 'heart';
      } else if (shown === 'open') {
        steps.push(...popupReactions[pickAfresh('look', ['read', 'peek', 'knead', 'sniff'])](notes));
        last = 'heart';
      } else steps.push(...curious[pickAfresh('curious', Object.keys(curious))]());
      return [
        ...steps,
        { pose: 'sit', ms: 700, start: () => (say(last), fadeThing()) },
        { pose: 'crouch', ms: 1, start: () => offNotes(notes) },
      ];
    };
    // Off to the notes (from a panel), to do there what fits when she lands.
    const visitNotes = (notes, time, way = null) => {
      if (!notes || !state.perch || state.inside) return false;
      if (notes.getAttribute('data-cat-notes') === 'pill') state.notesRest = time + NOTES_REST_MS;
      closeMenu();
      if (state.wish) wishFor(null);
      if (things.current) putThing(null);
      state.resume = { steps: () => atNotes(notes, way) };
      say('!');
      const rect = notes.getBoundingClientRect();
      const x = window.scrollX + rect.left + rect.width / 2 + random(-10, 10);
      const far = Math.hypot(x - state.x, window.scrollY + rect.top - state.y);
      leapTo(notes, x, Math.min(1150, Math.max(LEAP_MS, far * 1.1)));
      return true;
    };
    // Her notes opened while she was calling: a cheer, and back to a panel.
    const noticed = (time) => {
      const pill = state.bidding;
      state.bidding = null;
      state.resume = null;
      state.notesRest = time + NOTES_SEEN_MS;
      saw('notes:noticed');
      cheerUp(JOY.noticed);
      fadeThing();
      play(
        [
          {
            pose: 'cheer',
            mood: 'purring',
            ms: 650,
            start: () => (say('heart'), say('yay!')),
            frame: (step, now, k) => (state.lift = 14 * Math.sin(Math.PI * k)),
          },
          { pose: 'sit', mood: 'purring', ms: 800, start: () => say('heart') },
          { pose: 'crouch', ms: 1, start: () => offNotes(pill) },
        ],
        time,
      );
    };
    // Mishaps along a walk (each carries on to where it was going).
    const mishaps = noted('mishap', {
      sniff: (goal) => [{ pose: 'sniff', ms: 1400, start: () => say('sniff') }, { to: goal }],
      spook: (goal) => [
        {
          pose: 'startle',
          ms: 520,
          start: () => say('!'),
          frame: (step, time, k) => (state.lift = 24 * Math.sin(Math.PI * k)),
        },
        { pose: 'sit', mood: 'hungry', ms: 700, start: () => say('?') },
        { to: goal },
      ],
      pounce: () => [
        { pose: 'crouch', ms: 700, rock: { amp: 3.5, freq: 5.5, decay: 0 } },
        hop(onEdge(state.x + state.facing * 45), 18),
        { pose: 'reach', ms: 300 },
        { pose: 'sit', mood: 'purring', ms: 900, start: () => say('!') },
      ],
    });
    // Toys tossed to it (besides the yarn): a bouncy ball, a loose feather, a
    // toy mouse.
    const tossed = noted('toss', {
      // It bounces off along the edge, lower each time; it gives chase,
      // pounces, and bats it.
      ball: () => {
        const dir = roomy();
        const from = state.x + dir * 30;
        const end = onEdge(state.x + dir * 170);
        const ball = (x, y, extra = {}) => putThing({ kind: 'ball', x, y, ...extra });
        return [
          { pose: 'sit', ms: 300, start: () => ((state.facing = dir), say('!')) },
          {
            pose: 'walk',
            ms: 1600,
            start: (step) => (step.from = state.x),
            frame: (step, time, k) => {
              ball(from + (end - from) * k, state.y - 4.6 - Math.abs(Math.sin(Math.PI * 3 * k)) * 60 * (1 - k));
              state.x = step.from + (end - dir * 44 - step.from) * k;
            },
          },
          { ...hop(end - dir * 10, 22), start: (step) => hop(end - dir * 10, 22).start(step) },
          {
            pose: 'reach',
            ms: 420,
            start: () => say('!'),
            frame: (step, time, k) => ball(end + dir * 26 * k, state.y - 4.6, { rotate: dir * 360 * k }),
          },
          { pose: 'sit', mood: 'purring', ms: 900, start: () => say('heart') },
          { pose: 'sit', mood: 'purring', ms: 500, start: () => ball(end + dir * 26, state.y - 4.6, { opacity: 0 }) },
        ];
      },
      // A feather drifts down, swaying; it watches, swats, and leaps to catch it.
      feather: () => {
        const at = onEdge(state.x + roomy() * 40);
        const top = state.y - 190;
        const feather = (x, y, rotate) => putThing({ kind: 'feather', string: false, x, y: y - 34, rotate });
        return [
          {
            pose: 'sit',
            ms: 2400,
            frame: (step, time, k) => {
              const x = at + Math.sin(k * 5 * Math.PI) * 24;
              feather(x, top + (state.y - 78 - top) * k, Math.sin(k * 5 * Math.PI) * 30);
              state.facing = x < state.x ? -1 : 1;
            },
          },
          { pose: 'reach', ms: 260 },
          { pose: 'sit', ms: 240 },
          { pose: 'reach', ms: 260, frame: (step, time, k) => feather(at, state.y - 78 + 10 * k, 15) },
          {
            ...hop(at, 30),
            pose: 'reach',
            start: (step) => hop(at, 30).start(step),
            frame: (step, time, k) => {
              hop(at, 30).frame(step, time, k);
              if (k > 0.5 && things.current) {
                putThing(null);
                say('!');
              }
            },
          },
          { pose: 'sit', mood: 'purring', ms: 1100, start: () => say('heart') },
        ];
      },
      // A toy mouse lands on the edge: it wiggles, pounces, flings it into the
      // air, runs after it, and flings it back.
      mouse: () => {
        const dir = roomy();
        const at = onEdge(state.x + dir * 100);
        const far = onEdge(at + dir * 60);
        const mouse = (x, y, extra = {}) => putThing({ kind: 'mouse', x, y, flip: -dir, ...extra });
        const fling = (from, to) => ({
          pose: 'sit',
          ms: 700,
          start: () => say('!'),
          frame: (step, time, k) =>
            mouse(from + (to - from) * k, state.y - 80 * Math.sin(Math.PI * k), {
              rotate: (to > from ? 1 : -1) * 360 * k,
            }),
        });
        return [
          {
            pose: 'sit',
            ms: 500,
            frame: (step, time, k) => mouse(at, state.y - 140 * (1 - k) ** 2, { rotate: 200 * (1 - k) }),
          },
          { pose: 'crouch', ms: 750, rock: { amp: 3.5, freq: 5.5, decay: 0 }, start: () => (state.facing = dir) },
          { ...hop(at - dir * 12, 26), start: (step) => hop(at - dir * 12, 26).start(step) },
          { pose: 'reach', ms: 300 },
          fling(at, far),
          { to: far - dir * 26, speed: STROLL * 2.4 },
          { pose: 'reach', ms: 300, start: () => (state.facing = dir) },
          fling(far, at),
          { pose: 'sit', mood: 'purring', ms: 1000, start: () => (state.facing = -dir) },
          { pose: 'sit', mood: 'purring', ms: 500, start: () => (mouse(at, state.y, { opacity: 0 }), say('heart')) },
        ];
      },
      // A little robot vacuum comes trundling along its edge ("whirr"): it
      // sniffs it, hops on and rides it, sitting proud, to the end of its
      // panel ("bonk"), round and back again, loafing on it; then it hops off,
      // and the robot trundles away.
      roomba: () => {
        const dir = roomy();
        const lift = 11;
        // Not far: it comes in from a little way off, carries the cat a
        // couple of hundred pixels on (or to the panel's end), and back.
        const meet = onEdge(state.x + dir * 60);
        const end = onEdge(state.x + dir * 240);
        const back = onEdge(end - dir * 170);
        const robot = { x: onEdge(meet + dir * 170), facing: -dir };
        const draw = (opacity = 1) => putThing({ kind: 'roomba', x: robot.x, y: state.y, flip: robot.facing, opacity });
        // The robot on its way to x, at a pace, with the cat aboard or not.
        const roll = (to, speed, pose, { mood, riding = false, words } = {}) => ({
          pose,
          mood,
          start: (step) => {
            step.from = robot.x;
            step.ms = Math.max(1, (Math.abs(onEdge(to) - robot.x) / speed) * 1000);
            robot.facing = onEdge(to) < robot.x ? -1 : 1;
            if (words) say(words);
          },
          frame: (step, time, k) => {
            robot.x = step.from + (onEdge(to) - step.from) * k;
            if (riding) {
              state.x = robot.x;
              state.facing = robot.facing;
              state.lift = lift;
            }
            draw();
          },
        });
        const aboard = () => (state.lift = lift);
        return [
          roll(meet + dir * 40, 80, 'sit', { mood: 'chatter', words: 'whirr' }),
          { pose: 'sniff', ms: 800, start: () => ((state.facing = dir), say('sniff')) },
          { pose: 'crouch', ms: 500, rock: { amp: 3, freq: 5.5, decay: 0 } },
          { ...hop(() => robot.x, 24, lift), start: (step) => hop(() => robot.x, 24, lift).start(step) },
          roll(end, 60, 'sit', { mood: 'purring', riding: true, words: '♪' }),
          {
            pose: 'sit',
            mood: 'hungry',
            ms: 700,
            rock: { amp: 6, freq: 3, decay: 3 },
            start: () => say('bonk'),
            frame: aboard,
          },
          roll(back, 55, 'rest', { mood: 'purring', riding: true, words: 'prr' }),
          { pose: 'sit', mood: 'purring', ms: 500, start: () => say('heart'), frame: aboard },
          {
            ...hop(() => robot.x - robot.facing * 46, 24, 0),
            start: (step) => ((step.lifted = lift), hop(() => robot.x - robot.facing * 46, 24).start(step)),
          },
          roll(back - dir * 160, 80, 'sit', { mood: 'purring' }),
          { pose: 'sit', mood: 'purring', ms: 400, start: () => draw(0) },
        ];
      },
      // A paper aeroplane comes gliding in from the side, looping gently down;
      // it watches it come, wiggles, leaps and catches it out of the air,
      // lands with it crumpled into a ball under its paws, and bats the ball
      // off its edge.
      plane: () => {
        const dir = roomy();
        const from = { x: state.x + dir * 280, y: state.y - 170 };
        const caught = { x: onEdge(state.x + dir * 34), y: state.y - 74 };
        const flight = (k) => ({
          x: from.x + (caught.x - from.x) * k,
          y: from.y + (caught.y - from.y) * k + Math.sin(k * Math.PI * 2) * 18,
        });
        const plane = (k) => {
          const here = flight(k);
          const ahead = flight(Math.min(1, k + 0.01));
          const angle = (Math.atan2(ahead.y - here.y, ahead.x - here.x) * 180) / Math.PI;
          putThing({
            kind: 'plane',
            x: here.x,
            y: here.y,
            flip: dir > 0 ? -1 : 1,
            rotate: dir > 0 ? ((angle + 360) % 360) - 180 : angle,
          });
        };
        const ball = (extra = {}) => putThing({ kind: 'paperball', x: state.x + dir * 16, y: state.y - 5, ...extra });
        return [
          {
            pose: 'sit',
            ms: 2200,
            start: () => ((state.facing = dir), say('?')),
            frame: (step, time, k) => plane(k * 0.8),
          },
          {
            pose: 'crouch',
            ms: 500,
            rock: { amp: 3.5, freq: 5.5, decay: 0 },
            frame: (step, time, k) => plane(0.8 + 0.12 * k),
          },
          {
            ...hop(caught.x, 44),
            pose: 'reach',
            start: (step) => hop(caught.x, 44).start(step),
            frame: (step, time, k) => {
              hop(caught.x, 44).frame(step, time, k);
              if (k < 0.5) plane(0.92 + 0.16 * k);
              else putThing({ kind: 'paperball', x: state.x + dir * 14, y: state.y - state.lift - 30 });
            },
          },
          { pose: 'reach', ms: 700, start: () => say('!'), frame: () => ball() },
          {
            pose: 'reach',
            ms: 900,
            frame: (step, time, k) =>
              ball({
                x: state.x + dir * (16 + 150 * k),
                y: state.y - 5 - 40 * Math.sin(Math.PI * Math.min(1, k * 1.4)) + 80 * Math.max(0, k - 0.7),
                opacity: 1 - Math.max(0, (k - 0.6) / 0.4),
              }),
          },
          { pose: 'sit', mood: 'purring', ms: 900, start: () => (putThing(null), say('heart')) },
        ];
      },
      // A bakery paper bag turns up on its edge: it sniffs it, wiggles, and
      // dives in. The bag rustles and scoots along the edge; its head pops up
      // out of the top to look round ("♪"), ducks down, the bag scoots again,
      // it pops up once more, and out it hops.
      bag: () => {
        const dir = roomy();
        let at = onEdge(state.x + dir * 70);
        const bag = (extra = {}) => putThing({ kind: 'paperbag', x: at, y: state.y, ...extra });
        const scoot = (by, ms) => ({
          pose: 'sit',
          ms,
          start: (step) => {
            step.from = at;
            state.hidden = true;
            say('rustle');
          },
          frame: (step, time, k) => {
            at = onEdge(step.from + by * k);
            state.x = at;
            bag({ rotate: Math.sin(k * Math.PI * 6) * 6 });
          },
        });
        const up = (pose, ms, words) => ({
          pose,
          ms,
          start: () => {
            state.hidden = false;
            if (words) say(words);
          },
          frame: () => {
            state.lift = BAG_HEIGHT;
            state.x = at;
            bag();
          },
        });
        return [
          {
            pose: 'sit',
            ms: 600,
            start: () => (state.facing = dir),
            frame: (step, time, k) => bag({ y: state.y - 120 * (1 - k) ** 2 }),
          },
          { pose: 'sit', ms: 300, start: () => say('!') },
          { to: at - dir * 34 },
          { pose: 'sniff', ms: 800, start: () => say('sniff') },
          { pose: 'crouch', ms: 600, rock: { amp: 3.5, freq: 5.5, decay: 0 } },
          { ...hop(at, 30, BAG_HEIGHT), start: (step) => hop(at, 30, BAG_HEIGHT).start(step) },
          scoot(dir * 40, 1300),
          up('peek', 1500, '♪'),
          up('lurk', 600),
          scoot(-dir * 30, 1000),
          up('peek', 1100, '?'),
          {
            ...hop(() => onEdge(at + dir * 50), 26, 0),
            start: (step) => ((step.lifted = BAG_HEIGHT), hop(() => onEdge(at + dir * 50), 26).start(step)),
          },
          { pose: 'sit', mood: 'purring', ms: 800, start: () => (bag({ opacity: 0 }), say('heart')) },
        ];
      },
      // A strip of bubble wrap on its edge: its first step pops a bubble
      // ("pop!") and it jumps; then, delighted, it marches the length of it,
      // popping bubble after bubble, and sits proudly at the end.
      wrap: () => {
        const dir = roomy();
        const start = onEdge(state.x + dir * 30);
        const bubble = (n) => start + dir * (4 + 8 * n);
        let popped = 0;
        const wrap = (extra = {}) =>
          putThing({ kind: 'wrap', x: start, y: state.y, flip: dir, count: popped, ...extra });
        // Its front paws, a little ahead of it.
        const pops = () => {
          const paws = state.x + dir * 12;
          let count = 0;
          while (count < 12 && dir * (paws - bubble(count)) >= 0) count += 1;
          if (count > popped) {
            popped = count;
            wrap();
            say('pop!');
          }
        };
        const march = (to, speed) => ({
          pose: 'walk',
          start: (step) => {
            step.from = state.x;
            step.end = onEdge(to);
            step.ms = Math.max(1, (Math.abs(step.end - step.from) / speed) * 1000);
            state.facing = dir;
          },
          frame: (step, time, k) => {
            state.x = step.from + (step.end - step.from) * k;
            state.lift = popped ? 1.5 : 0;
            pops();
          },
        });
        return [
          { pose: 'sit', ms: 600, start: () => ((state.facing = dir), wrap(), say('?')) },
          march(bubble(0) - dir * 12, STROLL),
          {
            pose: 'startle',
            ms: 600,
            start: () => say('!'),
            frame: (step, time, k) => (state.lift = 1.5 + 20 * Math.sin(Math.PI * k)),
          },
          { pose: 'sit', ms: 700, start: () => say('?'), frame: () => (state.lift = 1.5) },
          { pose: 'sit', mood: 'purring', ms: 500, start: () => say('♪'), frame: () => (state.lift = 1.5) },
          march(bubble(11) - dir * 4, STROLL * 1.1),
          { pose: 'sit', mood: 'purring', ms: 1200, start: () => say('heart'), frame: () => (state.lift = 1.5) },
          { pose: 'sit', ms: 500, start: () => wrap({ opacity: 0 }) },
        ];
      },
      // Flying a kite: it runs along its edge with the string, the kite
      // climbing into the sky behind it; it stops, sits and watches it dance in
      // the wind ("♪"); then the wind drops, the kite drifts down, and it
      // pounces on it.
      kite: () => {
        const dir = roomy();
        const end = onEdge(state.x + dir * 200);
        let kite = { x: state.x - dir * 30, y: state.y - 6 };
        const draw = (extra = {}) => {
          const paw = { x: state.x + state.facing * 8, y: state.y - 14 };
          putThing({ kind: 'kite', x: kite.x, y: kite.y, tx: paw.x - kite.x, ty: paw.y - kite.y, ...extra });
        };
        return [
          { pose: 'sit', ms: 700, start: () => ((state.facing = dir), say('!')), frame: () => draw() },
          {
            pose: strides('run', 'run2', 120),
            start: (step) => {
              step.from = state.x;
              step.ms = Math.max(600, (Math.abs(end - state.x) / (CHASE * 1.5)) * 1000);
            },
            frame: (step, time, k) => {
              state.x = step.from + (end - step.from) * k;
              kite = {
                x: state.x - dir * (40 + 70 * k),
                y: state.y - 10 - 120 * Math.min(1, k * 1.3) + Math.sin(time / 300) * 4,
              };
              draw();
            },
          },
          {
            pose: 'sit',
            mood: 'chatter',
            ms: 3000,
            start: () => ((state.facing = -dir), say('♪')),
            frame: (step, time) => {
              kite = {
                x: state.x - dir * 110 + Math.sin(time / 520) * 18,
                y: state.y - 130 + Math.sin(time / 330) * 9,
              };
              draw();
            },
          },
          {
            pose: 'sit',
            ms: 1500,
            start: (step) => (step.kite = { ...kite }),
            frame: (step, time, k) => {
              kite = {
                x: step.kite.x + (state.x - dir * 40 - step.kite.x) * k + Math.sin(k * Math.PI * 3) * 10,
                y: step.kite.y + (state.y - 12 - step.kite.y) * k * k,
              };
              draw();
            },
          },
          { pose: 'crouch', ms: 500, rock: { amp: 3.5, freq: 5.5, decay: 0 }, frame: () => draw() },
          {
            ...hop(() => onEdge(kite.x + dir * 10), 26),
            pose: 'reach',
            start: (step) => hop(() => onEdge(kite.x + dir * 10), 26).start(step),
            frame: (step, time, k) => {
              hop(0, 26).frame(step, time, k);
              draw();
            },
          },
          { pose: 'sit', mood: 'purring', ms: 900, start: () => (draw({ opacity: 0 }), say('heart')) },
        ];
      },
      // A fish-shaped kicker toy: it wiggles, pounces on it, rolls onto its
      // back hugging it, and bunny-kicks it with its hind feet ("mrrp!"),
      // over and over; then lies there with it, purring.
      kicker: () => {
        const dir = roomy();
        const at = onEdge(state.x + dir * 80);
        // Its head towards the cat.
        const toy = (extra = {}) => putThing({ kind: 'kicker', x: at, y: state.y, flip: dir > 0 ? 1 : -1, ...extra });
        return [
          {
            pose: 'sit',
            ms: 600,
            start: () => (state.facing = dir),
            frame: (step, time, k) => toy({ y: state.y - 120 * (1 - k) ** 2, rotate: 160 * (1 - k) }),
          },
          { pose: 'crouch', ms: 800, rock: { amp: 3.5, freq: 5.5, decay: 0 }, start: () => say('!') },
          { ...hop(at, 26), start: (step) => hop(at, 26).start(step) },
          {
            pose: strides('bunnykick', 'bunnykick2', 170),
            ms: 2600,
            start: () => (putThing(null), say('mrrp!')),
            frame: (step, time, k) => {
              if (k > 0.5 && !step.again) {
                step.again = true;
                say('!');
              }
            },
          },
          { pose: 'belly', mood: 'purring', ms: 1400, start: () => say('prr') },
          { pose: 'sit', mood: 'purring', ms: 900, start: () => (toy({ x: state.x + dir * 30 }), say('heart')) },
          { pose: 'sit', mood: 'purring', ms: 400, start: () => toy({ x: state.x + dir * 30, opacity: 0 }) },
        ];
      },
      // A crinkle tunnel along its edge: it peers into it, wiggles, and dashes
      // in; out of sight, the tunnel rustles and shivers as it runs through,
      // and out it bursts at the far end, skidding to a stop, pleased.
      tunnel: () => {
        const dir = roomy();
        // The whole run (34 px before it, the tube, and 40 px out beyond it)
        // kept to where it can stand on its edge, which ends short of the
        // panel's ends (else, coming out, it would snap back over the tube);
        // on a narrow panel, a shorter tube.
        const [low, high] = [onEdge(-Infinity), onEdge(Infinity)];
        const length = Math.max(48, Math.min(96, high - low - 34 - 40));
        const [before, after] = [34 + length / 2, 40 + length / 2];
        const wanted = state.x + dir * (40 + length / 2);
        const middle =
          dir > 0
            ? Math.max(low + before, Math.min(high - after, wanted))
            : Math.min(high - before, Math.max(low + after, wanted));
        const near = middle - (dir * length) / 2;
        const far = middle + (dir * length) / 2;
        const tube = (t = 0, extra = {}) => putThing({ kind: 'tunnel', x: middle, y: state.y, rope: length, t, ...extra });
        const dash = (to, ms) => ({
          pose: strides('run', 'run2', 110),
          ms,
          start: (step) => ((step.from = state.x), (state.facing = dir)),
          frame: (step, time, k) => (state.x = step.from + (to - step.from) * k),
        });
        return [
          {
            pose: 'sit',
            ms: 600,
            start: () => (state.facing = dir),
            frame: (step, time, k) => tube(0, { y: state.y - 100 * (1 - k) ** 2 }),
          },
          { pose: 'sit', ms: 400, start: () => say('?') },
          { to: near - dir * 34 },
          { pose: 'sniff', ms: 800, start: () => ((state.facing = dir), say('sniff')) },
          { pose: 'crouch', ms: 700, rock: { amp: 3.5, freq: 5.5, decay: 0 } },
          // In as its nose reaches the opening (half of it is some 36 px), and
          // out once clear of the far one, so it is never drawn over the tube.
          dash(near - dir * 30, 300),
          {
            ...dash(far + dir * 30, 1600),
            start: (step) => {
              step.from = state.x;
              state.hidden = true;
              say('rustle');
            },
            frame: (step, time, k) => {
              // Through it, with a stop halfway for a rustle about.
              const along = k < 0.4 ? k / 0.8 : k < 0.6 ? 0.5 : 0.5 + (k - 0.6) / 0.8;
              state.x = step.from + (far + dir * 30 - step.from) * along;
              tube(k);
              if (k > 0.45 && !step.middle) {
                step.middle = true;
                say('rustle');
              }
            },
          },
          {
            ...dash(onEdge(far + dir * 40), 300),
            start: (step) => {
              step.from = state.x;
              state.hidden = false;
              say('!');
            },
          },
          { pose: 'skid', ms: 380 },
          { pose: 'sit', mood: 'purring', ms: 1000, start: () => ((state.facing = -dir), say('heart')) },
          { pose: 'sit', mood: 'purring', ms: 400, start: () => tube(0, { opacity: 0 }) },
        ];
      },
      // A spinning top lands, whirring, and wanders along its edge; it
      // watches, bats it, and it skitters off; it chases round and round
      // after it till the top topples, and sits there dizzy, eyes spinning.
      top: () => {
        const dir = roomy();
        const home = onEdge(state.x + dir * 60);
        let x = home;
        let turns = 0;
        const top = (extra = {}) => putThing({ kind: 'top', x, y: state.y, count: turns, ...extra });
        return [
          {
            pose: 'sit',
            ms: 600,
            start: () => (state.facing = dir),
            frame: (step, time, k) => {
              turns = time / 140;
              top({ y: state.y - 100 * (1 - k) ** 2 });
            },
          },
          {
            pose: 'sit',
            mood: 'chatter',
            ms: 1800,
            start: () => say('!'),
            frame: (step, time, k) => {
              turns = time / 140;
              x = home - dir * 22 * Math.sin(Math.PI * k);
              top({ rotate: Math.sin(time / 90) * 4 });
            },
          },
          {
            pose: 'reach',
            ms: 320,
            start: () => say('!'),
            frame: (step, time) => {
              turns = time / 140;
              top({ rotate: Math.sin(time / 90) * 4 });
            },
          },
          {
            pose: strides('run', 'run2', 110),
            ms: 1400,
            start: (step) => (step.from = state.x),
            frame: (step, time, k) => {
              turns = time / 120;
              x = onEdge(home + dir * 90 * Math.sin((Math.PI / 2) * k));
              top({ rotate: dir * 8 * Math.sin(time / 70) });
              // Round and round after it.
              state.facing = Math.floor(time / 160) % 2 ? dir : -dir;
              state.x = step.from + (x - dir * 30 - step.from) * Math.min(1, k * 1.2);
            },
          },
          {
            pose: 'sit',
            ms: 500,
            frame: (step, time, k) => {
              turns += 0.01;
              top({ rotate: dir * 85 * k, y: state.y - 3 * k });
            },
          },
          {
            pose: 'dizzy',
            ms: 2200,
            rock: { amp: 7, freq: 1.4, decay: 0 },
            start: () => say('?'),
          },
          { pose: 'sit', mood: 'purring', ms: 800, start: () => say('heart') },
          { pose: 'sit', mood: 'purring', ms: 400, start: () => top({ rotate: dir * 85, opacity: 0 }) },
        ];
      },
    });
    const treats = noted('treat', {
      // Tossed from the pointer (or from above): it races to where it will
      // come down and leaps to catch it.
      toss: () => {
        const dir = roomy();
        const land = onEdge(state.x + dir * 120);
        const overhead =
          state.pointer.y > window.scrollY &&
          state.pointer.y < state.y - 40 &&
          Math.abs(state.pointer.x - state.x) < 400;
        const from = overhead ? { x: state.pointer.x, y: state.pointer.y } : { x: land - dir * 220, y: state.y - 200 };
        // Where the treat is a share f of the way along its arc, ending at the
        // height of the cat's head as it leaps.
        const treatAt = (f) => ({
          kind: 'treat',
          x: from.x + (land - from.x) * f,
          y: from.y + (state.y - 62 - from.y) * f - 90 * f * (1 - f),
          rotate: f * 540,
        });
        return [
          { pose: 'sit', ms: 350, start: () => ((state.facing = dir), say('!'), putThing(treatAt(0))) },
          {
            pose: 'walk',
            ms: 750,
            start: (step) => (step.from = state.x),
            frame: (step, time, k) => {
              putThing(treatAt(k * 0.75));
              state.x = step.from + (land - step.from) * Math.min(1, k * 1.15);
            },
          },
          {
            pose: 'reach',
            ms: 320,
            frame: (step, time, k) => {
              state.lift = 26 * Math.sin(Math.PI * k);
              if (k < 0.5) putThing(treatAt(0.75 + k * 0.5));
              else if (things.current) {
                putThing(null);
                say('!');
              }
            },
          },
          ...munch(),
        ];
      },
      // Held up just above it: it sits up and begs, paws at it, and it drops
      // into its paws.
      beg: () => {
        const held = (lower = 0) => putThing({ kind: 'treat', x: state.x, y: state.y - 82 + lower, rotate: -20 });
        return [
          { pose: 'sit', ms: 300, start: () => (held(), say('!')) },
          {
            pose: 'beg',
            mood: 'hungry',
            ms: 1300,
            frame: (step, time) => held(Math.sin(time / 180) * 2),
          },
          { pose: 'reach', ms: 280 },
          { pose: 'beg', mood: 'hungry', ms: 280 },
          { pose: 'reach', ms: 380, frame: (step, time, k) => held(30 * k) },
          ...munch(),
        ];
      },
      // Dropped somewhere along its edge: it looks this way and that, sniffs
      // it out, and nibbles it up.
      hunt: () => {
        const dir = roomy();
        const at = onEdge(state.x + dir * random(90, 150));
        return [
          {
            pose: 'sit',
            ms: 600,
            frame: (step, time, k) =>
              putThing({ kind: 'treat', x: at, y: state.y - 4 - 150 * (1 - k) ** 2, rotate: 300 * k }),
          },
          { pose: 'sit', ms: 450, start: () => ((state.facing = -dir), say('?')) },
          { pose: 'sit', ms: 450, start: () => ((state.facing = dir), say('sniff')) },
          { to: at - dir * 24 },
          {
            pose: 'crouch',
            ms: 1100,
            start: () => say('nom'),
            frame: (step, time, k) => putThing({ kind: 'treat', x: at, y: state.y - 4, scale: 1 - k }),
          },
          { pose: 'sit', mood: 'purring', ms: 900, start: () => (putThing(null), say('crunch')) },
          { pose: 'groom', ms: 1300, start: () => say('heart') },
        ];
      },
      // A little bowl of them: it trots over and crunches through them one by one.
      bowl: () => {
        const dir = roomy();
        const at = onEdge(state.x + dir * 90);
        const bowl = (count, extra = {}) => putThing({ kind: 'bowl', x: at, y: state.y, count, ...extra });
        return [
          { pose: 'sit', ms: 500, start: () => (bowl(3), say('!')) },
          { to: at - dir * 30, speed: STROLL * 2.2 },
          {
            pose: 'crouch',
            ms: 2700,
            start: () => (state.facing = dir),
            frame: (step, time, k) => {
              const left = 3 - Math.floor(k * 3);
              if (left !== step.left) {
                step.left = left;
                bowl(left);
                if (left < 3) say('crunch');
              }
            },
          },
          { pose: 'groom', ms: 1500, start: () => (bowl(0), say('heart')) },
          { pose: 'sit', mood: 'purring', ms: 800, start: () => bowl(0, { opacity: 0 }) },
        ];
      },
      // A warm taiyaki (a fish-shaped cake from the bakery) drops in beside
      // it, steaming: it goes over, sniffs it, blows on it ("fuu~") till the
      // steam is gone, eats it from the tail up, and licks its lips.
      taiyaki: () => {
        const dir = roomy();
        const at = onEdge(state.x + dir * 80);
        // Its tail towards the cat, for the first bite.
        const cake = (extra = {}) => putThing({ kind: 'taiyaki', x: at, y: state.y, flip: -dir, bake: 1, ...extra });
        return [
          {
            pose: 'sit',
            ms: 600,
            start: () => (state.facing = dir),
            frame: (step, time, k) => cake({ y: state.y - 120 * (1 - k) ** 2 }),
          },
          { pose: 'sit', ms: 400, start: () => say('!') },
          { to: at - dir * 30 },
          { pose: 'sniff', ms: 900, start: () => say('sniff') },
          {
            pose: 'sit',
            mood: 'yawn',
            ms: 1300,
            start: () => say('fuu~'),
            frame: (step, time, k) => cake({ bake: 1 - k }),
          },
          ...[1, 2, 3].map((count) => ({
            pose: 'crouch',
            ms: 800,
            start: () => (cake({ bake: 0, count }), say(count === 3 ? 'crunch' : 'nom')),
          })),
          { pose: 'crouch', ms: 500, start: () => putThing(null) },
          { pose: 'sit', mood: 'purring', ms: 900, start: () => say('heart') },
          { pose: 'groom', ms: 1300 },
        ];
      },
      // A birthday cupcake, its candle lit: it gazes at the flame, takes a
      // breath and blows it out ("fuu!"), cheers, eats up the frosting, and
      // sits back with a frosting moustache, which it licks off.
      cupcake: () => {
        const dir = roomy();
        const at = onEdge(state.x + dir * 70);
        const cake = (extra = {}) => ({ kind: 'cupcake', x: at, y: state.y, count: 1, bake: 1, ...extra });
        return [
          { pose: 'sit', ms: 700, start: () => ((state.facing = dir), putThing(cake()), say('!')) },
          { to: at - dir * 28 },
          { pose: 'sit', mood: 'chatter', ms: 1400, start: () => (state.facing = dir) },
          { pose: 'sit', ms: 500, start: () => say('…') },
          { pose: 'sit', mood: 'yawn', ms: 600, start: () => (putThing(cake({ count: 0 })), say('fuu!')) },
          { pose: 'cheer', ms: 1000, start: () => (say('✦'), say('♪'), say('✦')) },
          {
            pose: 'crouch',
            ms: 1600,
            start: () => say('nom'),
            frame: (step, time, k) => putThing(cake({ count: 0, bake: 1 - k })),
          },
          {
            pose: 'sit',
            mood: 'purring',
            ms: 1500,
            start: () =>
              putThing([cake({ count: 0, bake: 0 }), { kind: 'frosting', front: true, x: state.x, y: state.y - 28 }]),
          },
          {
            pose: 'groom',
            ms: 1300,
            start: () => (putThing(cake({ count: 0, bake: 0, opacity: 0 })), say('heart')),
          },
        ];
      },
      // Sushi on a little conveyor belt along its edge: plates come round to
      // it one by one (egg, salmon, salmon roe, salmon again); it watches them
      // come, grabs the first salmon nigiri off its plate and eats it, and the
      // rest roll on by and away.
      sushi: () => {
        const dir = roomy();
        const edge = edgeNow();
        const near = state.x + dir * 30;
        const room = dir > 0 ? edge.right - 8 - near : near - edge.left - 8;
        const length = Math.max(90, Math.min(190, room));
        const plates = ['tamago', 'salmon', 'ikura', 'salmon'];
        const speed = 42;
        const gap = 1100;
        let clock = 0;
        let grabbed = false;
        // How far plate n has come along the belt, ms into the run.
        const travelled = (n, ms) => ((ms - n * gap) / 1000) * speed;
        const scene = (time, shown = 1) => {
          const ms = time - clock;
          putThing([
            {
              kind: 'conveyor',
              x: dir > 0 ? near : near - length,
              y: state.y,
              rope: length,
              count: (-dir * ms * speed) / 1000,
              opacity: shown,
            },
            ...plates
              .map((variant, n) => {
                const d = travelled(n, ms);
                if (d < 0 || d > length - 8) return null;
                // Fading in at the far end and out at the near one.
                const fade = Math.min(1, d / 10, (length - 8 - d) / 10);
                return {
                  kind: 'sushi',
                  variant: n === 1 && grabbed ? 'empty' : variant,
                  x: near + dir * (length - 6 - d),
                  y: state.y - 7,
                  opacity: fade * shown,
                };
              })
              .filter(Boolean),
          ]);
        };
        // When the first salmon comes within reach.
        const grabAt = gap + ((length - 26) / speed) * 1000;
        return [
          {
            pose: 'sit',
            ms: 500,
            start: () => ((state.facing = dir), (clock = performance.now()), say('!')),
            frame: (step, time) => scene(time),
          },
          { pose: 'sit', mood: 'chatter', ms: grabAt - 500, frame: (step, time) => scene(time) },
          {
            pose: 'reach',
            ms: 420,
            start: () => say('!'),
            frame: (step, time, k) => {
              if (k > 0.4) grabbed = true;
              scene(time);
            },
          },
          { pose: 'crouch', ms: 1500, start: () => say('nom'), frame: (step, time) => scene(time) },
          {
            pose: 'sit',
            mood: 'purring',
            ms: 1800,
            start: () => say('heart'),
            frame: (step, time, k) => scene(time, k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1),
          },
          { pose: 'sit', mood: 'purring', ms: 300, start: () => putThing(null) },
        ];
      },
      // Gradient descent: a little chart of a loss curve stands beside it and
      // a cookie is let go at the top. Down it rolls, into a dip on the way (a
      // local minimum), and stops there; the cat looks ("?"), goes round it
      // and gives it a nudge (a gradient, "∇"), and on it rolls, over the hump
      // and down into the lowest point, rocking to a stop; the cat eats it
      // there ("converged!").
      descent: () => {
        const dir = roomy();
        const edge = edgeNow();
        // The lowest point just in front of it, the chart's start beyond.
        const reach = LOSS.low * LOSS.width + 6;
        let low = state.x + dir * 44;
        if (dir > 0 && low + reach > edge.right) low = Math.max(state.x + 10, edge.right - reach);
        if (dir < 0 && low - reach < edge.left) low = Math.min(state.x - 10, edge.left + reach);
        const at = (u) => low + dir * (LOSS.low - u) * LOSS.width;
        const chart = (extra = {}) => ({ kind: 'loss', x: low, y: state.y, flip: dir, ...extra });
        const cookie = (u, hop = 0) => ({
          kind: 'treat',
          x: at(u),
          y: state.y - LOSS.height(u) - 3.5 - hop,
          rotate: -dir * u * 900,
        });
        const show = (u, hop = 0) => putThing([chart(), cookie(u, hop)]);
        // Rocking to a stop at u.
        const settle = (u) => (k) => u + 0.05 * Math.exp(-4 * k) * Math.sin(k * 16);
        return [
          { pose: 'sit', ms: 800, start: () => ((state.facing = dir), show(0), say('!')) },
          { pose: 'sit', mood: 'chatter', ms: 1100, frame: (step, time, k) => show(LOSS.dip * k * k) },
          { pose: 'sit', mood: 'chatter', ms: 900, frame: (step, time, k) => show(settle(LOSS.dip)(k)) },
          { pose: 'sit', ms: 700, start: () => say('?') },
          { to: at(LOSS.dip - 0.16), speed: STROLL * 1.6 },
          { pose: 'reach', ms: 420, start: () => ((state.facing = -dir), say('∇')) },
          {
            pose: 'sit',
            mood: 'chatter',
            ms: 1400,
            frame: (step, time, k) => {
              const u = LOSS.dip + (LOSS.low - LOSS.dip) * k * k * (3 - 2 * k);
              // A little hop over the hump.
              show(u, Math.max(0, 4 * (1 - Math.abs(u - 0.44) / 0.06)));
            },
          },
          { pose: 'sit', ms: 1000, frame: (step, time, k) => show(settle(LOSS.low)(k)) },
          { to: at(LOSS.low) - dir * 24, speed: STROLL * 1.8 },
          { pose: 'crouch', ms: 900, start: () => ((state.facing = dir), putThing(chart()), say('nom')) },
          { pose: 'sit', mood: 'purring', ms: 1400, start: () => say('converged!') },
          { pose: 'sit', mood: 'purring', ms: 600, start: () => putThing(chart({ opacity: 0 })) },
        ];
      },
      // Gone fishing: a little rod in its paws, it casts, the line dropping
      // down the front of its panel; a long wait, the float bobbing; a tug
      // ("!"), and it reels in a fish-shaped cookie on the hook.
      fishing: () => {
        const dir = roomy();
        const rod = (rope, count = 0) =>
          putThing({ kind: 'rod', front: true, x: state.x + dir * 8, y: state.y - 6, flip: dir, rope, count });
        return [
          { pose: 'sit', ms: 600, start: () => ((state.facing = dir), rod(0), say('!')) },
          { pose: 'reach', ms: 500, start: () => say('~'), frame: (step, time, k) => rod(64 * k) },
          { pose: 'sit', ms: 2800, start: () => say('…'), frame: (step, time) => rod(64 + Math.sin(time / 320) * 2) },
          {
            pose: 'sit',
            mood: 'hungry',
            ms: 500,
            start: () => say('!'),
            frame: (step, time, k) => rod(64 + 9 * Math.sin(Math.PI * Math.min(1, k * 2))),
          },
          { pose: 'reach', ms: 1200, frame: (step, time, k) => rod(64 * (1 - k), 1) },
          { pose: 'crouch', ms: 900, start: () => (putThing(null), say('nom')) },
          { pose: 'sit', mood: 'purring', ms: 900, start: () => say('crunch') },
          { pose: 'groom', ms: 1300, start: () => say('heart') },
        ];
      },
      // An ice cream cone drops into its paws: it holds it up and licks it
      // ("lick"), a lick at a time, till the cold gets to it, a brain freeze:
      // the cone set down, both paws to its head ("!!"), shivering. Then on
      // with it, more slowly, scoop and cone and all ("crunch").
      icecream: () => {
        // Its paws, held up before its chest (BakeryCat's Holding).
        const paws = () => ({ x: state.x, y: state.y - (88 - 68.6) * UNIT });
        let left = 1;
        const held = (extra = {}) => putThing({ kind: 'cone', variant: 'held', count: left, front: true, ...paws(), ...extra });
        const licks = (times, pace) =>
          Array.from({ length: times }, () => [
            {
              pose: 'lick',
              ms: pace,
              start: () => {
                left = Math.max(0, left - 0.13);
                say('lick');
              },
              frame: () => held(),
            },
            { pose: 'hold', mood: 'purring', ms: pace * 0.9, frame: () => held() },
          ]).flat();
        return [
          {
            pose: 'hold',
            ms: 600,
            start: () => say('!'),
            frame: (step, time, k) => held({ y: paws().y - 110 * (1 - k) ** 2 }),
          },
          { pose: 'hold', mood: 'purring', ms: 700, start: () => say('♪'), frame: () => held() },
          ...licks(3, 400),
          {
            pose: 'freeze',
            ms: 1700,
            rock: { amp: 2.5, freq: 7, decay: 0 },
            start: () => say('!!'),
            frame: () =>
              putThing({
                kind: 'cone',
                count: left,
                // Set down just in front of it.
                x: state.x + state.facing * 24,
                y: state.y - 4,
                rotate: state.facing * 70,
              }),
          },
          { pose: 'sit', mood: 'drowsy', ms: 700, start: () => say('…') },
          ...licks(3, 560),
          { pose: 'hold', mood: 'purring', ms: 600, start: () => ((left = 0), say('nom')), frame: () => held() },
          {
            pose: 'hold',
            mood: 'purring',
            ms: 700,
            start: () => say('crunch'),
            frame: (step, time, k) => held({ scale: 1 - 0.6 * k, opacity: k > 0.7 ? 0 : 1 }),
          },
          { pose: 'groom', ms: 1300, start: () => (putThing(null), say('heart')) },
        ];
      },
      // A bowl of noodles lands beside it, steaming: it sniffs, then slurps a
      // long strand up into its mouth ("slurp~"), cheeks puffed full, and
      // another; a lick of its lips.
      noodles: () => {
        const dir = roomy();
        const at = onEdge(state.x + dir * 34);
        const mouth = () => ({ x: state.x, y: state.y - (88 - 54.4) * UNIT });
        const bowl = (extra = {}) => putThing({ kind: 'noodles', x: at, y: state.y, front: true, ...extra });
        const strand = (t) => {
          const lips = mouth();
          bowl({ t, tx: lips.x - at, ty: lips.y - state.y });
        };
        return [
          {
            pose: 'sit',
            ms: 600,
            start: () => (state.facing = dir),
            frame: (step, time, k) => bowl({ y: state.y - 110 * (1 - k) ** 2 }),
          },
          { pose: 'sit', ms: 400, start: () => say('!') },
          { to: at - dir * 32 },
          { pose: 'sniff', ms: 800, start: () => say('sniff') },
          ...[0, 1].flatMap(() => [
            { pose: 'slurp', ms: 1200, start: () => say('slurp~'), frame: (step, time, k) => strand(k) },
            { pose: 'sit', mood: 'purring', ms: 600, start: () => (bowl(), say('mm')) },
          ]),
          { pose: 'groom', ms: 1300, start: () => (bowl({ opacity: 0 }), say('heart')) },
        ];
      },
      // A mochi for Mochi: a soft round rice cake on a little dish. It bites
      // and pulls, leaning back ("mmf"), and the mochi stretches and stretches,
      // till it lets go of the dish and springs into its mouth ("boing"); it
      // chews, cheeks full, and purrs.
      mochi: () => {
        const dir = roomy();
        const at = onEdge(state.x + dir * 34);
        const cake = (extra = {}) => putThing({ kind: 'mochicake', x: at, y: state.y, front: true, ...extra });
        // Its mouth, leaning back as it pulls (BakeryCat's Tugging).
        const mouth = () => ({ x: state.x - state.facing * (65.8 - 60) * UNIT, y: state.y - (88 - 55) * UNIT });
        const pull = (t) => {
          const lips = mouth();
          cake({ t, tx: lips.x - at, ty: lips.y - state.y });
        };
        return [
          {
            pose: 'sit',
            ms: 600,
            start: () => (state.facing = dir),
            frame: (step, time, k) => cake({ y: state.y - 110 * (1 - k) ** 2 }),
          },
          { pose: 'sit', ms: 400, start: () => say('!') },
          { to: at - dir * 34 },
          { pose: 'sniff', ms: 700, start: () => say('sniff') },
          {
            pose: 'tug',
            ms: 1600,
            rock: { amp: 1.5, freq: 4, decay: 0 },
            start: () => say('mmf'),
            frame: (step, time, k) => pull(0.2 + 0.7 * k),
          },
          {
            pose: 'tug',
            ms: 600,
            start: () => say('mmmf!'),
            frame: (step, time) => pull(0.9 + 0.08 * Math.sin(time / 60)),
          },
          {
            pose: 'startle',
            ms: 450,
            start: () => (cake({ variant: 'empty' }), say('boing')),
            frame: (step, time, k) => (state.lift = 12 * Math.sin(Math.PI * k)),
          },
          { pose: 'slurp', ms: 1200, start: () => say('nom') },
          { pose: 'sit', mood: 'purring', ms: 900, start: () => say('heart') },
          { pose: 'sit', mood: 'purring', ms: 400, start: () => cake({ variant: 'empty', opacity: 0 }) },
        ];
      },
      // A durian: it trots over, sniffs, and recoils, eyes screwed shut,
      // tongue out ("yuck!"), the smell rising off it; then it pushes the
      // thing away along its edge ("hmph"), and off it rolls.
      durian: () => {
        const dir = roomy();
        let at = onEdge(state.x + dir * 50);
        const fruit = (extra = {}) => putThing({ kind: 'durian', x: at, y: state.y, ...extra });
        return [
          {
            pose: 'sit',
            ms: 600,
            start: () => (state.facing = dir),
            frame: (step, time, k) => fruit({ y: state.y - 110 * (1 - k) ** 2 }),
          },
          { pose: 'sit', ms: 500, start: () => say('?') },
          { to: at - dir * 30 },
          { pose: 'sniff', ms: 900, start: () => (say('sniff'), fruit({ count: 0.5 })) },
          {
            pose: 'yuck',
            ms: 1500,
            rock: { amp: 2.5, freq: 5, decay: 2 },
            start: () => ((state.facing = dir), say('yuck!'), fruit({ count: 1 })),
          },
          {
            pose: 'push',
            ms: 1300,
            start: (step) => ((step.from = at), say('hmph')),
            frame: (step, time, k) => {
              at = onEdge(step.from + dir * 50 * k);
              state.x = at - dir * 24;
              // Rolling, its smell still rising straight up off it.
              putThing([
                { kind: 'durian', x: at, y: state.y, rotate: dir * 160 * k },
                { kind: 'durian', variant: 'smell', x: at, y: state.y, count: 1 },
              ]);
            },
          },
          {
            pose: 'sit',
            ms: 900,
            start: (step) => (step.from = at),
            frame: (step, time, k) =>
              putThing([
                {
                  kind: 'durian',
                  x: step.from + dir * 90 * k,
                  y: state.y,
                  rotate: dir * (160 + 400 * k),
                  opacity: k > 0.6 ? 0 : 1,
                },
                { kind: 'durian', variant: 'smell', x: step.from + dir * 90 * k, y: state.y, count: 1 - k },
              ]),
          },
          { pose: 'groom', ms: 1300, start: () => (putThing(null), say('…')) },
        ];
      },
    });
    // Curled up asleep a while (lifted into a bed, if in one), z's rising, and
    // now and then (or for sure: dreams 1) a dream of a fish-shaped cookie in
    // a cloud over its head, with a murmur. scene(dream) gives the things
    // about it to show, given the dream's own.
    const nap = (scene = (dream) => dream, lift = 0, dreams = 0.4) => ({
      pose: 'sleep',
      ms: random(...(feel().napFor ?? NAP_FOR)) * 1000,
      start: (step) => {
        step.dreams = Math.random() < dreams;
        const about = scene([]);
        putThing(about.length ? about : null);
      },
      frame: (step, time, k) => {
        state.lift = lift;
        if (Math.random() < 0.006) say('z');
        if (!step.dreams) return;
        const shown = Math.min(1, Math.max(0, (k - 0.15) * 6), Math.max(0, (0.88 - k) * 6));
        const dream =
          shown > 0
            ? [
                {
                  kind: 'dream',
                  x: state.x + (state.facing < 0 ? -7 : 7),
                  y: state.y - lift - 22,
                  flip: state.facing < 0 ? 1 : -1,
                  opacity: shown,
                },
              ]
            : [];
        const about = scene(dream);
        putThing(about.length ? about : null);
        if (!step.murmured && k > 0.5) {
          step.murmured = true;
          say('mm…');
        }
      },
    });
    const doings = noted('doing', {
      // A butterfly flutters by: it watches, wiggles its rump, and pounces as
      // the butterfly gets away.
      butterfly: () => {
        const dir = roomy();
        const from = { x: state.x + dir * 230, y: state.y - 120 };
        const over = { x: onEdge(state.x + dir * 38), y: state.y - 58 };
        return [
          {
            pose: 'sit',
            ms: 2600,
            start: () => (state.facing = dir),
            frame: (step, time, k) =>
              putThing({
                kind: 'butterfly',
                x: from.x + (over.x - from.x) * k,
                y: from.y + (over.y - from.y) * k + Math.sin(k * 14) * 9,
              }),
          },
          {
            pose: 'crouch',
            ms: 900,
            rock: { amp: 3, freq: 5, decay: 0 },
            frame: (step, time) =>
              putThing({
                kind: 'butterfly',
                x: over.x + Math.sin(time / 160) * 4,
                y: over.y + Math.sin(time / 110) * 3,
              }),
          },
          {
            ...hop(() => onEdge(state.x + dir * 22), 30),
            pose: 'reach',
            frame: (step, time, k) => {
              hop(0, 30).frame(step, time, k);
              putThing({ kind: 'butterfly', x: over.x + dir * 60 * k, y: over.y - 90 * k });
            },
          },
          {
            pose: 'sit',
            ms: 1500,
            start: () => say('?'),
            frame: (step, time, k) =>
              putThing({
                kind: 'butterfly',
                x: over.x + dir * (60 + 220 * k),
                y: over.y - 90 - 140 * k,
                opacity: 1 - k,
              }),
          },
        ];
      },
      // A bakery box: if it fits, it sits, peeking over the rim.
      box: () => {
        const dir = roomy();
        const at = onEdge(state.x + dir * 80);
        const out = onEdge(at + dir * 46) === at + dir * 46 ? at + dir * 46 : at - dir * 46;
        return [
          { pose: 'sit', ms: 900, start: () => ((state.facing = dir), putThing({ kind: 'box', x: at, y: state.y })) },
          { to: at - dir * 34 },
          { pose: 'crouch', ms: 300 },
          hop(at, 26, 22),
          {
            pose: 'peek',
            ms: 3800,
            start: () => {
              state.lift = 22;
              say('heart');
            },
          },
          { ...hop(out, 26, 0), start: (step) => ((step.lifted = 22), hop(out, 26).start(step)) },
          { pose: 'sit', ms: 900, start: () => putThing({ kind: 'box', x: at, y: state.y, opacity: 0 }) },
        ];
      },
      // A croissant on the edge: it pats it, looks at its owner, and knocks it off.
      croissant: () => {
        const dir = roomy();
        const at = onEdge(state.x + dir * 90);
        const croissant = (extra = {}) => putThing({ kind: 'croissant', x: at, y: state.y, ...extra });
        return [
          { pose: 'sit', ms: 700, start: () => croissant() },
          { to: at - dir * 30 },
          { pose: 'sit', ms: 900, start: () => (state.facing = dir) },
          { pose: 'reach', ms: 350, start: () => croissant({ x: at + dir * 2 }) },
          { pose: 'sit', ms: 700 },
          { pose: 'reach', ms: 350, start: () => croissant({ x: at + dir * 5 }) },
          { pose: 'sit', ms: 1200 },
          {
            pose: 'reach',
            ms: 900,
            frame: (step, time, k) =>
              croissant({
                x: at + dir * (5 + 26 * k),
                y: state.y + 150 * k * k,
                rotate: dir * 220 * k,
                opacity: 1 - k,
              }),
          },
          { pose: 'sit', mood: 'purring', ms: 1300, start: () => (putThing(null), say('heart')) },
        ];
      },
      // A sunbeam falls on its edge: it settles into it for a nap.
      sunbeam: () => {
        const at = onEdge(state.x + roomy() * random(40, 90));
        return [
          { pose: 'sit', ms: 900, start: () => putThing({ kind: 'sunbeam', x: at, y: state.y }) },
          { to: at },
          { pose: 'rest', mood: 'purring', ms: 1600, start: () => say('prr') },
          { pose: 'sleep', ms: 6500, frame: () => Math.random() < 0.006 && say('z') },
          { pose: 'stretch', ms: 1000 },
          { pose: 'sit', ms: 900, start: () => putThing({ kind: 'sunbeam', x: at, y: state.y, opacity: 0 }) },
        ];
      },
      // Chasing its own tail round and round, then dizzy.
      tail: () => [
        { pose: 'sit', ms: 500 },
        {
          pose: 'walk',
          ms: 2000,
          frame: (step, time, k) => {
            state.facing = Math.floor(k * 10) % 2 ? 1 : -1;
            state.lift = Math.abs(Math.sin(k * 10 * Math.PI)) * 3;
          },
        },
        { pose: 'balance', ms: 1300, rock: { amp: 8, freq: 1.6, decay: 1.6 }, start: () => say('~') },
        { pose: 'sit', mood: 'purring', ms: 700 },
      ],
      // A big yawn: sitting up, or in a long stretch, front paws out.
      yawn: () =>
        Math.random() < 0.5
          ? [
              { pose: 'sit', ms: 400 },
              { pose: 'sit', mood: 'yawn', ms: 1500 },
              { pose: 'sit', mood: 'purring', ms: 800 },
            ]
          : [
              { pose: 'sit', mood: 'drowsy', ms: 500 },
              { pose: 'stretch', mood: 'yawn', ms: 1600 },
              { pose: 'sit', mood: 'drowsy', ms: 900 },
            ],
      // Low in spirits (see JOY_FEELS). Crying: sat with her eyes squeezed
      // shut, tears dropping, sobbing; then a sniffle and a wipe with a paw.
      cry: () => {
        const tears = (time) =>
          putThing(
            [0, 1, 2, 3].map((n) => {
              const k = (time / 900 + n * 0.37) % 1;
              const side = n % 2 ? 1 : -1;
              return {
                kind: 'tear',
                x: state.x + side * (6 + 3 * k),
                y: state.y - 32 + 26 * k * k,
                opacity: 1 - k * 0.6,
              };
            }),
          );
        return [
          { pose: 'sit', mood: 'sad', ms: 900, start: () => say('…') },
          {
            pose: 'sit',
            mood: 'cry',
            ms: 3400,
            start: () => say('sob'),
            frame: (step, time, k) => {
              tears(time);
              if (!step.again && k > 0.5) {
                step.again = true;
                say('sob');
              }
            },
          },
          { pose: 'groom', ms: 1300, start: () => (putThing(null), say('sniff')) },
          { pose: 'sit', mood: 'sad', ms: 1200 },
        ];
      },
      // A little rain cloud of her own gathers over her head and rains on her
      // while she sits there ("sigh…"); she lies down under it, and it drifts
      // off.
      rain: () => {
        const cloud = (time, extra = {}) =>
          putThing({ kind: 'raincloud', x: state.x, y: state.y - 76, count: time / 40, ...extra });
        return [
          {
            pose: 'sit',
            mood: 'sad',
            ms: 900,
            frame: (step, time, k) => cloud(time, { y: state.y - 110 + 34 * k, opacity: k }),
          },
          { pose: 'sit', mood: 'sad', ms: 3200, start: () => say('sigh…'), frame: (step, time) => cloud(time) },
          { pose: 'rest', mood: 'sad', ms: 1800, frame: (step, time) => cloud(time, { y: state.y - 62 }) },
          {
            pose: 'rest',
            mood: 'sad',
            ms: 1200,
            frame: (step, time, k) => cloud(time, { x: state.x + 80 * k, y: state.y - 62 - 30 * k, opacity: 1 - k }),
          },
        ];
      },
      // Sulking: down as a loaf, eyes shut and a pout, a grumble scribbled
      // over her head ("hmph").
      sulk: () => [
        { pose: 'sit', mood: 'sad', ms: 600, start: () => say('hmph') },
        {
          pose: 'rest',
          mood: 'sulk',
          ms: 4200,
          frame: (step, time) =>
            putThing({ kind: 'grumble', x: state.x + 12, y: state.y - 44 + Math.sin(time / 260) * 1.5 }),
        },
        { pose: 'rest', mood: 'sad', ms: 900, start: () => putThing(null) },
      ],
      // Moping: she trails off slowly to the far end of her panel, head down,
      // and sits there a while ("sigh…").
      mope: () => {
        // Off towards the far end, but not far.
        const edge = edgeNow();
        const far = onEdge(state.x + (state.x < (edge.left + edge.right) / 2 ? 1 : -1) * 180);
        return [
          { to: far, speed: STROLL * 0.55, pose: 'walk', mood: 'sad' },
          { pose: 'sit', mood: 'sad', ms: 2800, start: () => say('sigh…') },
          { pose: 'rest', mood: 'sad', ms: 1500 },
        ];
      },
      // Hungry, it naps a lot. In one of its beds (not the one it used last,
      // or the one asked for): a bread basket, a proofing basket, a doughnut
      // bed, a flour sack or a croissant cushion turns up beside it; it goes
      // over, sniffs it, climbs in (or up), turns round, lies down, kneads it
      // a little, and curls up asleep, now and then dreaming of a cookie;
      // then a yawning stretch, out, and the bed is gone. Or, sleepy where it
      // is, it curls up and a tea towel drifts down over it, till it wakes
      // and the towel slips off.
      bed: (asked) => {
        const kinds = Object.keys(BED_LIFT).filter((name) => name !== state.lastBed);
        const kind = BED_LIFT[asked] !== undefined ? asked : kinds[Math.floor(Math.random() * kinds.length)];
        state.lastBed = kind;
        saw(`bed:${kind}`);
        const lift = BED_LIFT[kind];
        const keep = () => (state.lift = lift);
        if (kind === 'towel') {
          const towel = (extra = {}) => ({
            kind: 'bed',
            variant: 'towel',
            layer: 'front',
            front: true,
            x: state.x,
            y: state.y,
            flip: state.facing < 0 ? 1 : -1,
            ...extra,
          });
          return [
            { pose: 'sit', mood: 'drowsy', ms: 900, start: () => say('~') },
            { pose: 'rest', mood: 'drowsy', ms: 1300 },
            {
              pose: 'sleep',
              ms: 1100,
              frame: (step, time, k) =>
                putThing(towel({ y: state.y - 34 * (1 - k) ** 2, opacity: Math.min(1, k * 3) })),
            },
            nap((dream) => [towel(), ...dream]),
            {
              pose: 'sleep',
              ms: 500,
              start: () => say('!'),
              frame: (step, time, k) =>
                putThing(towel({ x: state.x - state.facing * 26 * k, y: state.y + 4 * k, opacity: 1 - k })),
            },
            { pose: 'stretch', mood: 'yawn', ms: 1300, start: () => putThing(null) },
            { pose: 'sit', mood: 'purring', ms: 800 },
          ];
        }
        const dir = roomy();
        const at = onEdge(state.x + dir * random(70, 110));
        const out = onEdge(at + dir * 60) === at + dir * 60 ? at + dir * 60 : at - dir * 60;
        const bed = (opacity = 1) => [
          { kind: 'bed', variant: kind, layer: 'back', x: at, y: state.y, opacity },
          { kind: 'bed', variant: kind, layer: 'front', front: true, x: at, y: state.y, opacity },
        ];
        return [
          { pose: 'sit', mood: 'drowsy', ms: 900, start: () => ((state.facing = dir), putThing(bed()), say('!')) },
          // Up to it, just clear of its rim (which is drawn over her), her nose
          // (some 26 px ahead of her middle) at its edge.
          { to: at - dir * (BED_HALF[kind] + 20) },
          { pose: 'sniff', ms: 900, start: () => say('sniff') },
          hop(at, 24, lift),
          // Round it turns, twice, and (a moment later, so it lies down
          // through its in-betweens) down it lies.
          {
            pose: 'walk',
            ms: 1100,
            frame: (step, time, k) => {
              keep();
              state.facing = k < 0.6 && Math.floor((k / 0.6) * 4) % 2 ? -dir : dir;
            },
          },
          { pose: 'rest', mood: 'drowsy', ms: 1100, frame: keep },
          { pose: 'knead', mood: 'purring', ms: 1600, start: () => say('prr'), frame: keep },
          { pose: 'rest', mood: 'asleep', ms: 600, frame: keep },
          nap((dream) => [...bed(), ...dream], lift),
          { pose: 'stretch', mood: 'yawn', ms: 1300, frame: keep, start: () => putThing(bed()) },
          { ...hop(out, 24, 0), start: (step) => ((step.lifted = lift), hop(out, 24).start(step)) },
          { pose: 'sit', ms: 900, start: () => putThing(bed(0)) },
        ];
      },
      // Nodding off where it sits: eyelids drooping, its head nodding down,
      // jerked up again ("!"), nodding again, till it gives in, lies down and
      // curls up asleep; a yawning stretch when it wakes.
      doze: () => [
        { pose: 'sit', mood: 'drowsy', ms: 1500 },
        { pose: 'nod', mood: 'asleep', ms: 1400 },
        { pose: 'sit', mood: 'content', ms: 700, start: () => say('!') },
        { pose: 'sit', mood: 'drowsy', ms: 1200 },
        { pose: 'nod', mood: 'asleep', ms: 1600 },
        { pose: 'rest', mood: 'asleep', ms: 1300 },
        nap(),
        { pose: 'stretch', mood: 'yawn', ms: 1300, start: () => putThing(null) },
      ],
      // A big yawn, and over it flops onto its back, fast asleep with its paws
      // in the air; a while later it wakes ("?"), rolls back over and sits up.
      flop: () => {
        const roll = state.facing < 0 ? 1 : -1;
        return [
          { pose: 'sit', mood: 'drowsy', ms: 700 },
          { pose: 'sit', mood: 'yawn', ms: 1400 },
          { pose: 'rest', mood: 'drowsy', ms: 1100 },
          { pose: 'rest', mood: 'drowsy', ms: 240, frame: (step, time, k) => (state.spin = roll * 50 * k) },
          {
            pose: 'snooze',
            ms: 300,
            start: () => say('~'),
            frame: (step, time, k) => (state.spin = -roll * 25 * (1 - k)),
          },
          {
            pose: 'snooze',
            ms: random(7000, 9000),
            start: () => (state.spin = null),
            frame: () => Math.random() < 0.006 && say('z'),
          },
          { pose: 'belly', ms: 900, start: () => say('?') },
          { pose: 'belly', ms: 240, frame: (step, time, k) => (state.spin = -roll * 50 * k) },
          { pose: 'sit', ms: 300, frame: (step, time, k) => (state.spin = roll * 25 * (1 - k)) },
          { pose: 'sit', mood: 'purring', ms: 800, start: () => (state.spin = null) },
        ];
      },
      // Curled up asleep, dreaming of one of its fish-shaped cookies, with a
      // murmur ("mm…"); it wakes, looks round for the cookie ("?") and mews.
      dream: () => [
        { pose: 'rest', mood: 'drowsy', ms: 1300 },
        nap((dream) => dream, 0, 1),
        { pose: 'sit', mood: 'hungry', ms: 900, start: () => (putThing(null), say('?')) },
        { pose: 'beg', mood: 'hungry', ms: 1500, start: () => say('mew') },
      ],
      // A sneeze, with a little hop, and a startled look.
      sneeze: () => [
        { pose: 'sit', ms: 500 },
        { pose: 'sit', mood: 'sneeze', ms: 700 },
        {
          pose: 'sit',
          mood: 'sneeze',
          ms: 240,
          start: () => say('achoo!'),
          frame: (step, time, k) => (state.lift = 7 * Math.sin(Math.PI * k)),
        },
        { pose: 'sit', mood: 'hungry', ms: 1100 },
        { pose: 'sit', mood: 'purring', ms: 500 },
      ],
      // A crumb of cookie: sniffed, nibbled up, and a paw licked after.
      crumb: () => {
        const dir = roomy();
        const at = onEdge(state.x + dir * 80);
        return [
          { pose: 'sit', ms: 600, start: () => putThing({ kind: 'crumb', x: at, y: state.y }) },
          { to: at - dir * 22 },
          { pose: 'crouch', ms: 700, start: () => ((state.facing = dir), say('sniff')) },
          {
            pose: 'crouch',
            ms: 1300,
            start: () => say('nom'),
            frame: (step, time, k) => putThing({ kind: 'crumb', x: at, y: state.y, scale: 1 - k }),
          },
          { pose: 'groom', ms: 1800, start: () => putThing(null) },
        ];
      },
      // A thought bubble with a toy it would love to play with; clicked, the
      // game is on. Left too long, the bubble fades and it looks let down.
      wish: () => {
        const toys = Object.keys(WISHES).filter((toy) => toy !== state.lastWish);
        const toy = toys[Math.floor(Math.random() * toys.length)];
        state.lastWish = toy;
        return [
          {
            pose: 'sit',
            ms: WISH_MS,
            start: () => wishFor(toy),
            frame: (step) => !state.wish && (step.done = true),
          },
          { pose: 'sit', mood: 'hungry', ms: 1300, start: () => (wishFor(null), say('…')) },
        ];
      },
      // A bird flutters in and lands nearby: it stares, chattering ("ek ek"),
      // wiggles to pounce, and the bird is off.
      birdwatch: () => {
        const dir = roomy();
        const land = onEdge(state.x + dir * 110);
        const from = { x: state.x + dir * 300, y: state.y - 150 };
        const bird = (x, y, extra = {}) => putThing({ kind: 'bird', x, y, flip: -dir, ...extra });
        return [
          {
            pose: 'chatter',
            ms: 2200,
            start: () => ((state.facing = dir), say('!')),
            frame: (step, time, k) => {
              const eased = 1 - (1 - k) ** 2;
              bird(from.x + (land - from.x) * eased, from.y + (state.y - from.y) * eased + Math.sin(k * 9) * 6);
              if (Math.floor(k * 3) !== step.beat) {
                step.beat = Math.floor(k * 3);
                if (step.beat) say('ek ek');
              }
            },
          },
          {
            pose: 'chatter',
            ms: 1500,
            frame: (step, time) => bird(land, state.y - Math.abs(Math.sin(time / 260)) * 2, { flying: false }),
          },
          {
            pose: 'crouch',
            ms: 900,
            rock: { amp: 3.5, freq: 5.5, decay: 0 },
            frame: () => bird(land, state.y, { flying: false }),
          },
          {
            ...hop(onEdge(land - dir * 30), 24),
            frame: (step, time, k) => {
              hop(0, 24).frame(step, time, k);
              bird(land + dir * 120 * k, state.y - 150 * k);
            },
            start: (step) => hop(onEdge(land - dir * 30), 24).start(step),
          },
          { pose: 'sit', mood: 'hungry', ms: 1100, start: () => (putThing(null), say('?')) },
        ];
      },
      // A good scratch at its edge, leaving claw marks that fade.
      scratch: () => [
        { pose: 'sit', ms: 300 },
        {
          pose: 'scratch',
          ms: 2400,
          start: () => say('scritch'),
          frame: (step, time, k) =>
            putThing({ kind: 'claws', x: state.x + state.facing * 28, y: state.y, opacity: Math.min(1, k * 3) }),
        },
        {
          pose: 'sit',
          mood: 'purring',
          ms: 1000,
          start: () => putThing({ kind: 'claws', x: state.x + state.facing * 28, y: state.y, opacity: 0 }),
        },
      ],
      // A ball of dough: patted into shape, paws in turn, and it bakes golden.
      dough: () => {
        const dir = roomy();
        const at = () => state.x + dir * 30;
        return [
          {
            pose: 'sit',
            ms: 500,
            start: () => ((state.facing = dir), putThing({ kind: 'dough', x: at(), y: state.y, bake: 0 })),
          },
          {
            pose: 'pat',
            ms: 3000,
            frame: (step, time, k) => {
              putThing({ kind: 'dough', x: at(), y: state.y, bake: k * 0.5 });
              if (Math.floor(k * 4) !== step.beat) {
                step.beat = Math.floor(k * 4);
                say('pat');
              }
            },
          },
          {
            pose: 'sit',
            ms: 1300,
            start: () => say('✦'),
            frame: (step, time, k) => putThing({ kind: 'dough', x: at(), y: state.y, bake: 0.5 + k * 0.5 }),
          },
          { pose: 'sit', mood: 'purring', ms: 1000, start: () => say('heart') },
          {
            pose: 'sit',
            mood: 'purring',
            ms: 500,
            start: () => putThing({ kind: 'dough', x: at(), y: state.y, bake: 1, opacity: 0 }),
          },
        ];
      },
      // A backflip: a crouch and a wiggle, a spring high into the air, tucked
      // into a ball, turning head over heels backwards, and a landing stuck
      // with both paws up.
      backflip: () => {
        // Backwards: head up and over towards its tail.
        const over = state.facing < 0 ? 360 : -360;
        return [
          { pose: 'crouch', ms: 550, rock: { amp: 3.5, freq: 5.5, decay: 0 }, start: () => say('!') },
          {
            pose: 'tuck',
            ms: 700,
            frame: (step, now, k) => {
              state.lift = 50 * Math.sin(Math.PI * k);
              state.spin = over * (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
            },
          },
          { pose: 'cheer', ms: 900, start: () => ((state.spin = null), say('✦')) },
          { pose: 'sit', mood: 'purring', ms: 800, start: () => say('heart') },
        ];
      },
      // A dance, one of several, picked at random.
      dance: () => {
        const names = Object.keys(dances).filter((name) => name !== state.lastDance);
        const name = names[Math.floor(Math.random() * names.length)];
        state.lastDance = name;
        return [{ pose: 'sit', mood: 'purring', ms: 350, start: () => say('♪') }, ...dances[name](), ...bow()];
      },
      // Now and then, being a cat: something within reach (a bouncy ball, a
      // ball of yarn, a cookie, a croissant, a paper ball or her toy mouse)
      // she eyes, looks at you, taps once, then bats clean off the screen,
      // spinning away past the nearer side of the window; a faint "…bonk"
      // from out of sight, and she sits there looking innocent.
      fling: () => {
        const dir = state.x - window.scrollX < window.innerWidth / 2 ? -1 : 1;
        const [kind, rise] = [
          ['ball', 4.6],
          ['yarn', 0],
          ['treat', 3.5],
          ['croissant', 0],
          ['paperball', 5],
          ['mouse', 0],
        ][Math.floor(Math.random() * 6)];
        const at = onEdge(state.x + dir * 26);
        const item = (extra = {}) =>
          putThing({ kind, x: at, y: state.y - rise, ...(kind === 'mouse' && { flip: -dir }), ...extra });
        const away = dir < 0 ? window.scrollX - 80 : window.scrollX + window.innerWidth + 80;
        const far = Math.abs(away - at);
        return [
          { pose: 'sit', ms: 800, start: () => ((state.facing = dir), item(), say('?')) },
          { pose: 'sit', mood: 'content', ms: 900, start: () => (state.facing = -dir) },
          { pose: 'reach', ms: 280, start: () => ((state.facing = dir), item({ x: at + dir * 3 })) },
          { pose: 'sit', ms: 600, frame: () => item({ x: at + dir * 3 }) },
          {
            pose: 'reach',
            mood: 'hungry',
            ms: Math.min(1600, 600 + far * 0.6),
            start: () => say('!'),
            frame: (step, time, k) =>
              item({
                x: at + (away - at) * k,
                y: state.y - rise - (120 + far * 0.12) * 4 * k * (1 - k) - 40 * k,
                rotate: dir * 900 * k,
              }),
          },
          { pose: 'sit', mood: 'content', ms: 1300, start: () => (putThing(null), say('…')) },
          { pose: 'sit', mood: 'content', ms: 600, start: () => say('…bonk') },
          { pose: 'wink', ms: 1100, start: () => (state.facing = -dir) },
        ];
      },
      // Starving: her bowl, and it is empty. She noses it along her edge,
      // looks up ("…"), and paws it over, upside down ("mew?").
      emptybowl: () => {
        const dir = roomy();
        let at = onEdge(state.x + dir * 30);
        const bowl = (extra = {}) => putThing({ kind: 'bowl', x: at, y: state.y, count: 0, ...extra });
        const over = { rotate: dir * 180, y: state.y - 8 };
        return [
          { pose: 'sit', mood: 'hungry', ms: 800, start: () => ((state.facing = dir), bowl(), say('?')) },
          { pose: 'sniff', ms: 1000, start: () => say('sniff') },
          {
            pose: 'sniff',
            ms: 1500,
            start: (step) => ((step.from = state.x), (step.at = at)),
            frame: (step, time, k) => {
              state.x = onEdge(step.from + dir * 30 * k);
              at = step.at + (state.x - step.from);
              bowl();
            },
          },
          { pose: 'sit', mood: 'sad', ms: 1500, start: () => say('…') },
          {
            pose: 'reach',
            mood: 'hungry',
            ms: 520,
            frame: (step, time, k) =>
              bowl({ rotate: dir * 180 * easeInOut(k), y: state.y - 8 * easeInOut(k) - 10 * Math.sin(Math.PI * k) }),
          },
          { pose: 'sit', mood: 'hungry', ms: 1600, start: () => say('mew?'), frame: () => bowl(over) },
          { pose: 'sit', mood: 'sad', ms: 700, start: () => bowl({ ...over, opacity: 0 }) },
        ];
      },
      // Hungry: her tummy rumbles ("grrr…", wobbly lines at her middle); she
      // jumps, looks down at it ("?"), and licks her lips.
      rumble: () => {
        const lines = (time, opacity = 1) =>
          putThing({ kind: 'rumble', front: true, x: state.x + Math.sin(time / 35) * 1.2, y: state.y - 14, opacity });
        return [
          { pose: 'sit', ms: 700 },
          { pose: 'sit', mood: 'hungry', ms: 1400, start: () => say('grrr…'), frame: (step, time) => lines(time) },
          {
            pose: 'startle',
            ms: 520,
            start: () => say('!'),
            frame: (step, time, k) => ((state.lift = 14 * Math.sin(Math.PI * k)), lines(time, 1 - k)),
          },
          { pose: 'sit', mood: 'hungry', ms: 1000, start: () => (putThing(null), say('?')) },
          { pose: 'groom', ms: 1300, start: () => say('~') },
        ];
      },
      // Full: a food coma. She slumps back, round tummy up, pats it in turn
      // ("prr"), lets out a little burp (a bubble), and nods off sitting there.
      foodcoma: () => [
        { pose: 'stuffed', ms: 1300, start: () => say('prr') },
        ...[0, 1, 2].flatMap(() => [
          { pose: 'stuffed2', ms: 360 },
          { pose: 'stuffed', ms: 440 },
        ]),
        {
          pose: 'stuffed',
          ms: 1300,
          start: () => say('burp'),
          frame: (step, time, k) =>
            putThing({
              kind: 'bubble',
              x: state.x - state.facing * 4,
              y: state.y - 40 - 24 * k,
              scale: 0.6,
              opacity: 1 - k,
            }),
        },
        { pose: 'stuffed', mood: 'drowsy', ms: 2600, start: () => putThing(null) },
        { pose: 'stuffed', mood: 'asleep', ms: 1800, start: () => say('z') },
        { pose: 'sit', mood: 'purring', ms: 800 },
      ],
      // High spirits: pronking, springing straight up on stiff legs, again and
      // again along her edge.
      pronk: () => {
        const dir = roomy();
        const bound = (n) => ({
          pose: 'pronk',
          ms: 520,
          start: (step) => {
            step.from = state.x;
            state.facing = dir;
            if (n % 2 === 0) cheer();
          },
          frame: (step, time, k) => {
            state.x = onEdge(step.from + dir * 22 * k);
            state.lift = 26 * Math.sin(Math.PI * k);
          },
        });
        return [
          { pose: 'sit', mood: 'purring', ms: 400, start: () => say('!') },
          ...[0, 1, 2, 3, 4].flatMap((n) => [bound(n), { pose: 'crouch', ms: 140 }]),
          { pose: 'sit', mood: 'purring', ms: 1000, start: () => say('heart') },
        ];
      },
      // Low spirits: kicking a pebble slowly along her edge, head down,
      // trailing after it; the last kick sends it rolling away ("sigh…").
      pebble: () => {
        const dir = roomy();
        let at = onEdge(state.x + dir * 20);
        const stone = (extra = {}) => putThing({ kind: 'pebble', x: at, y: state.y, ...extra });
        const kick = (far) => ({
          pose: 'reach',
          mood: 'sad',
          ms: 420,
          start: (step) => ((state.facing = dir), (step.at = at)),
          frame: (step, time, k) => {
            const eased = 1 - (1 - k) ** 2;
            at = onEdge(step.at + dir * far * eased);
            stone({ rotate: dir * far * 6 * eased });
          },
        });
        const trail = () => ({
          pose: 'walk',
          mood: 'sad',
          start: (step) => {
            step.from = state.x;
            step.to = onEdge(at - dir * 20);
            step.ms = Math.max(200, (Math.abs(step.to - step.from) / (STROLL * 0.55)) * 1000);
          },
          frame: (step, time, k) => {
            state.x = step.from + (step.to - step.from) * k;
            stone();
          },
        });
        return [
          { pose: 'sit', mood: 'sad', ms: 800, start: () => ((state.facing = dir), stone()) },
          kick(34),
          trail(),
          kick(40),
          trail(),
          kick(70),
          {
            pose: 'sit',
            mood: 'sad',
            ms: 1600,
            start: () => say('sigh…'),
            frame: (step, time, k) => stone({ opacity: 1 - k }),
          },
        ];
      },
      // The pointer resting near: it comes over and rubs against it, back and
      // forth, purring.
      bunt: () => {
        const at = onEdge(state.pointer.x);
        return [
          { to: at, speed: STROLL * 1.8 },
          {
            pose: 'walk',
            ms: 2200,
            start: () => say('prr'),
            frame: (step, time, k) => {
              const sway = Math.sin(k * 3 * Math.PI);
              state.x = onEdge(at + sway * 16);
              state.facing = Math.cos(k * 3 * Math.PI) > 0 ? 1 : -1;
              if (Math.floor(k * 3) !== step.beat) {
                step.beat = Math.floor(k * 3);
                say('heart');
              }
            },
          },
          { pose: 'sit', mood: 'purring', ms: 1400 },
        ];
      },
      // The pointer whipping past: a crouch, a wiggle of the rump, and a pounce.
      pounce: () => {
        const at = onEdge(state.pointer.x);
        return [
          {
            pose: 'crouch',
            ms: 750,
            rock: { amp: 3.5, freq: 5.5, decay: 0 },
            start: () => (state.facing = at < state.x ? -1 : 1),
          },
          { ...hop(at, 20 + Math.min(40, Math.abs(at - state.x) * 0.15)), ms: 420 },
          { pose: 'reach', ms: 350 },
          { pose: 'sit', ms: 700, start: () => say('!') },
        ];
      },
    });

    // Now and then, the other way: something thrown at whoever is watching.
    // She looks at you with it beside her, winds up (one eye shut to aim)
    // and lets fly; it comes at you face on, growing as it nears, and hits the
    // glass somewhere about the middle of the window. A rubber ball bounces
    // back ("boing!") and she catches it; a ball of dough sticks ("splot"),
    // sags, slides down a little and drops away (she is sorry: "oops"); a
    // cream puff splats ("splat!"), dripping, and she claps, giggling, till
    // it fades; a ball of paper bonks off ("tok!") and falls, and she looks
    // the other way, whistling.
    const atYou = noted(
      'atyou',
      Object.fromEntries(
        [
          ['ball', 4.6],
          ['dough', 5.4],
          ['puff', 6],
          ['paper', 4.6],
        ].map(([variant, r0]) => [
          variant,
          () => {
            const dir = Math.random() < 0.5 ? -1 : 1;
            // Where her paw is, in the drawing, on the page (it faces left;
            // mirrored to face right).
            const drawn = (dx, dy) => ({ x: state.x - state.facing * (dx - 60) * UNIT, y: state.y - (88 - dy) * UNIT });
            const near = Math.min(window.innerWidth, window.innerHeight) * random(0.07, 0.095);
            const hit = {
              x: window.scrollX + window.innerWidth * random(0.35, 0.65),
              y: window.scrollY + window.innerHeight * random(0.32, 0.5),
            };
            const thing = (extra) => ({ id: 'lob', kind: 'lobbed', variant, ...extra });
            const beside = onEdge(state.x + dir * 26);
            const spin = { ball: 220, dough: 140, puff: 40, paper: 540 }[variant] * dir;
            const flight = {
              pose: 'lob',
              ms: 760,
              start: (step) => (step.from = drawn(32.2, 38.4)),
              frame: (step, time, k) => {
                // Coming at you: slow to grow at first, then rushing up.
                const r = r0 / (1 - k * (1 - r0 / near));
                const w = 0.45 * k + 0.55 * ((r - r0) / (near - r0));
                putThing(
                  thing({
                    count: r,
                    x: step.from.x + (hit.x - step.from.x) * w,
                    y: step.from.y + (hit.y - step.from.y) * w - 70 * Math.sin(Math.PI * k),
                    rotate: spin * k,
                  }),
                );
              },
            };
            // Off the glass and down out of the window (as it looks then, given
            // where it is, k of the way down).
            const drop = (ms, from, look) => ({
              ms,
              frame: (step, time, k) =>
                look({ x: hit.x, y: from + (window.scrollY + window.innerHeight + near * 2 - from) * k * k }, k),
            });
            const bonk = (text, t, extra = []) => [
              ...extra,
              { id: 'bonk', kind: 'bonk', x: hit.x, y: hit.y, count: near, t, text },
            ];
            const windUp = [
              {
                pose: 'sit',
                ms: 900,
                start: () => {
                  state.facing = dir;
                  putThing(thing({ count: r0, x: beside, y: state.y - r0 }));
                  say('?');
                },
              },
              {
                pose: 'windup',
                ms: 900,
                rock: { amp: 1.5, freq: 3, decay: 0 },
                start: () => say('…'),
                frame: (step, time) => {
                  const paw = drawn(32.2, 38.4);
                  putThing(thing({ count: r0, x: paw.x, y: paw.y + Math.sin(time / 90) }));
                },
              },
              flight,
            ];
            if (variant === 'ball')
              return [
                ...windUp,
                {
                  pose: 'sit',
                  mood: 'content',
                  ms: 420,
                  start: () => say('!'),
                  frame: (step, time, k) =>
                    putThing(bonk('boing!', k, [thing({ count: near * (1 + 0.1 * Math.sin(Math.PI * k)), ...hit })])),
                },
                {
                  pose: 'clap',
                  ms: 780,
                  start: (step) => (step.to = drawn(60, 70.8)),
                  frame: (step, time, k) => {
                    // Back the way it came, shrinking, into her paws.
                    const r = near - (near - r0) * (1 - (1 - k) ** 2);
                    putThing(
                      bonk('boing!', Math.min(1, 0.4 + k), [
                        thing({
                          count: r,
                          x: hit.x + (step.to.x - hit.x) * k,
                          y: hit.y + (step.to.y - hit.y) * k - 60 * Math.sin(Math.PI * k),
                          rotate: -spin * k,
                        }),
                      ]),
                    );
                  },
                },
                {
                  pose: 'clap2',
                  mood: 'purring',
                  ms: 1100,
                  start: () => {
                    const paws = drawn(60, 70.8);
                    putThing(thing({ count: r0, ...paws }));
                    say('heart');
                  },
                },
                { pose: 'sit', mood: 'purring', ms: 600, start: () => putThing(thing({ count: r0, x: beside, y: state.y - r0, opacity: 0 })) },
              ];
            if (variant === 'dough') {
              const sag = near * 0.35;
              return [
                ...windUp,
                {
                  pose: 'startle',
                  ms: 520,
                  start: () => say('!'),
                  frame: (step, time, k) =>
                    putThing(bonk('splot', k, [{ id: 'lob', kind: 'smear', variant, count: near, t: 0, ...hit }])),
                },
                {
                  pose: 'oops',
                  ms: 2400,
                  start: () => say('oops'),
                  frame: (step, time, k) =>
                    putThing({ id: 'lob', kind: 'smear', variant, count: near, t: k, x: hit.x, y: hit.y + sag * k * k }),
                },
                {
                  pose: 'oops',
                  ...drop(700, hit.y + sag, (at, k) =>
                    putThing({ id: 'lob', kind: 'smear', variant, count: near, t: 1, rotate: dir * 40 * k, ...at }),
                  ),
                },
                { pose: 'sit', mood: 'content', ms: 700, start: () => putThing(null) },
                { pose: 'wink', ms: 1000 },
              ];
            }
            if (variant === 'puff')
              return [
                ...windUp,
                {
                  pose: 'sit',
                  mood: 'purring',
                  ms: 520,
                  frame: (step, time, k) =>
                    putThing(bonk('splat!', k, [{ id: 'lob', kind: 'smear', variant: 'cream', count: near, t: 0.1 * k, ...hit }])),
                },
                ...[0, 1, 2, 3].flatMap((beat) =>
                  ['clap2', 'clap'].map((pose, half) => ({
                    pose,
                    mood: 'purring',
                    ms: 380,
                    start: () => beat + half === 0 && say('hehe'),
                    frame: (step, time, k) =>
                      putThing({
                        id: 'lob',
                        kind: 'smear',
                        variant: 'cream',
                        count: near,
                        t: 0.1 + 0.9 * ((beat * 2 + half + k) / 8),
                        ...hit,
                      }),
                  })),
                ),
                {
                  pose: 'wink',
                  ms: 1400,
                  start: () => putThing({ id: 'lob', kind: 'smear', variant: 'cream', count: near, t: 1, opacity: 0, ...hit }),
                },
              ];
            return [
              ...windUp,
              {
                pose: 'sit',
                mood: 'content',
                ms: 300,
                start: () => say('!'),
                frame: (step, time, k) => putThing(bonk('tok!', k * 0.4, [thing({ count: near, ...hit, rotate: spin })])),
              },
              {
                pose: 'sit',
                mood: 'content',
                ...drop(800, hit.y, (at, k) =>
                  putThing(bonk('tok!', 0.4 + 0.6 * k, [thing({ count: near, rotate: spin + dir * 200 * k, ...at })])),
                ),
              },
              { pose: 'sit', mood: 'content', ms: 600, start: () => (putThing(null), say('…')) },
              { pose: 'sit', mood: 'purring', ms: 1600, start: () => ((state.facing = -dir), say('♪')) },
              { pose: 'wink', ms: 900, start: () => (state.facing = dir) },
            ];
          },
        ]),
      ),
    );
    // One of them, by herself: not the one she threw last.
    doings.atyou = () => {
      const names = Object.keys(atYou).filter((name) => name !== state.lastAtYou);
      state.lastAtYou = names[Math.floor(Math.random() * names.length)];
      return atYou[state.lastAtYou]();
    };

    // Treats and toys from its card; on a side, it hops up first.
    const onTreat = () => {
      if (!state.perch) return;
      state.lastPlay = performance.now();
      cheerUp(JOY.treat);
      if (onSide()) {
        leapTo(state.perch, null, HOP_MS);
        setTimeout(onTreat, HOP_MS + 300);
        return;
      }
      // One of several ways of having a treat, at random.
      const names = Object.keys(treats).filter((name) => name !== state.lastTreat);
      const name = names[Math.floor(Math.random() * names.length)];
      state.lastTreat = name;
      play(treats[name](), performance.now());
    };
    const onToy = () => {
      if (!state.perch) return;
      cheerUp(JOY.toy);
      if (onSide()) {
        leapTo(state.perch, null, HOP_MS);
        setTimeout(onToy, HOP_MS + 300);
        return;
      }
      // One of several toys, at random.
      const names = ['yarn', ...Object.keys(tossed)].filter((name) => name !== state.lastTossed);
      const name = names[Math.floor(Math.random() * names.length)];
      state.lastTossed = name;
      state.lastPlay = performance.now();
      if (name === 'yarn') rollYarn();
      else play(tossed[name](), performance.now());
    };
    // A ball of yarn rolled along its edge, for it to run after and pounce on.
    const rollYarn = () => {
      saw('game:yarn');
      const edge = page(state.perch.getBoundingClientRect());
      const goRight = state.x < (edge.left + edge.right) / 2;
      const end = goRight ? edge.right - MARGIN : edge.left + MARGIN;
      Object.assign(state, {
        mode: 'crouch',
        until: performance.now() + 600,
        then: 'toy',
        ball: { x: state.x + (goRight ? 34 : -34), to: end, at: performance.now() },
        lastPlay: performance.now(),
      });
      state.facing = goRight ? 1 : -1;
    };
    window.addEventListener('bakery-cat-treat', onTreat);
    window.addEventListener('bakery-cat-toy', onToy);
    // Asked from its card to do something in particular: it does it, from its
    // panel's top edge (hopping up off a side, or off a GPU's tile, first).
    // Asked (from her card or her scrapbook) to visit the bakery's oven, or
    // a packing counter (the first server's in view): its card opened (and
    // kept open) if it isn't, then over she goes, to do that (or, asked for
    // nothing in particular, what fits).
    const visitScene = (kind, name) => {
      const find = kind === 'pack' ? packOf : ovenOf;
      const force = kind === 'pack' ? 'forcePack' : 'forceOven';
      const open = () => openPopups().find(find);
      const go = () => {
        state[force] = name;
        const card = open();
        const went = Boolean(card) && goOver(card, false);
        state[force] = null;
        if (!went) say('?');
      };
      if (open()) go();
      else {
        const triggers = [...document.querySelectorAll(kind === 'pack' ? '[data-pack-trigger]' : '[data-bakery-trigger]')];
        const inView = triggers.find((trigger) => {
          const rect = trigger.getBoundingClientRect();
          return rect.width && rect.top > topClear() && rect.bottom < window.innerHeight - 40;
        });
        (inView ?? triggers[0])?.click();
        setTimeout(go, 450);
      }
    };
    const onDo = (event) => {
      const [group, name] = String(event.detail).split(':');
      const busy = ['held', 'leap', 'fall', 'spring', 'steal', 'emerge', 'popout', 'home', 'slip', 'trip'];
      if (!state.perch || state.inside || busy.includes(state.mode)) return;
      const retry = () => setTimeout(() => onDo(event), SPRING_MS + LEAP_MS + 500);
      if (!event.retried) {
        event.retried = true;
        cheerUp(group === 'treat' ? JOY.treat : group === 'toss' ? JOY.toy : group === 'game' ? JOY.game : JOY.asked);
      }
      if (onSide()) {
        leapTo(state.perch, null, HOP_MS);
        retry();
        return;
      }
      if (state.perch.closest?.('[data-cat-gpu]')) {
        leapTo(otherPerch() ?? visiblePerches()[0]);
        retry();
        return;
      }
      const time = performance.now();
      closeMenu();
      if (state.wish) wishFor(null);
      if (things.current) putThing(null);
      state.lastPlay = time;
      // Asked for: not for her scrapbook.
      state.manual = true;
      if (group === 'doing' && name === 'notes') {
        if (!visitNotes(notesIn('pill', 'clear', 'quiet'), time)) say('?');
      } else if (group === 'notes') {
        if (!visitNotes(notesIn('pill', 'clear', 'quiet'), time, name)) say('?');
      } else if (group === 'follow') startFollow(name, time);
      else if (group === 'dance' && dances[name]) {
        play([{ pose: 'sit', mood: 'purring', ms: 350 }, ...dances[name](), ...bow()], time);
      } else if (group === 'move') stroll(name === 'run');
      else if (group === 'mishap' && mishaps[name]) play(mishaps[name](state.x), time);
      else if (group === 'doing' && doings[name]) play(doings[name](), time);
      else if (group === 'act') act(name, time);
      else if (group === 'wish' && wanted[name]) play(wanted[name](), time);
      else if (group === 'game') startGame(name, time);
      else if (group === 'treat' && treats[name]) play(treats[name](), time);
      else if (group === 'toss' && tossed[name]) play(tossed[name](), time);
      else if (group === 'atyou' && atYou[name]) play(atYou[name](), time);
      else if (group === 'oven' && name === 'cookie') play(earned.cookie(), time);
      else if (group === 'oven') visitScene('oven', name);
      else if (group === 'pack') visitScene('pack', name);
      else if (group === 'bed' && BED_LIFT[name] !== undefined) play(doings.bed(name), time);
      else if (group === 'gpu' && !visitGpu(name)) say('?');
    };
    window.addEventListener('bakery-cat-do', onDo);
    // Something on the page changed (fresh readings, another range): now and
    // then, if it is about, a tilt of its head.
    const tiltHead = () => {
      state.tiltUntil = performance.now() + 1100;
      state.tiltSign = Math.random() < 0.5 ? -1 : 1;
    };
    const onPageChanged = () => {
      if (Math.random() < 0.4 && ['rest', 'sit', 'walk'].includes(state.mode)) tiltHead();
    };
    window.addEventListener('bakery-page-changed', onPageChanged);

    const onPointerMove = (event) => {
      const time = performance.now();
      // How fast the pointer is moving, smoothed, in pixels a second.
      const gap = time - state.pointer.at;
      if (gap > 0 && gap < 200) {
        const speed = (Math.hypot(event.pageX - state.pointer.x, event.pageY - state.pointer.y) / gap) * 1000;
        state.pointerSpeed = 0.6 * (state.pointerSpeed ?? 0) + 0.4 * speed;
      } else state.pointerSpeed = 0;
      state.pointer = {
        x: event.pageX,
        y: event.pageY,
        cx: event.clientX,
        cy: event.clientY,
        at: time,
        // Over a chart (its hover dot, for the cat to stalk).
        chart: event.target.closest?.('.recharts-wrapper') ?? null,
      };
      // Asleep, only the pointer coming near wakes her.
      if (state.mode === 'sleep' && Math.hypot(event.pageX - state.x, event.pageY - (state.y - 18)) < feel().notice) {
        sit(time, 'content', 1500);
      }
      const press = state.press;
      if (press && state.mode !== 'held' && Math.hypot(event.pageX - press.x, event.pageY - press.y) > 5) {
        clearTimeout(press.timer);
        if ((state.mode === 'steal' || state.mode === 'kick') && state.steal) {
          // Picked up mid-steal or mid-kick: the tile is put back by helicopter
          // soon, from off the side of the screen.
          const steal = state.steal;
          steal.tile.style.transformOrigin = '';
          steal.dx =
            steal.dir < 0
              ? window.scrollX - steal.base.right - 40
              : window.scrollX + window.innerWidth - steal.base.left + 40;
          steal.tile.style.transform = `translateX(${steal.dx}px)`;
          stolenAway(steal, 2500);
        }
        state.mode = 'held';
        Object.assign(state, {
          swing: 0,
          swingV: 0,
          heldVx: 0,
          heldX: event.pageX,
          inside: null,
          stillAt: { x: event.pageX, y: event.pageY },
          stillSince: time,
        });
        if (state.wish) wishFor(null);
        if (state.follow) {
          state.follow = null;
          putThing(null);
          state.tilt = 0;
        }
        if (state.go) {
          state.go = null;
          putThing(null);
          Object.assign(state, { spin: null, rock: null, tilt: 0 });
        }
        state.resume = null;
        state.bidding = null;
        state.manual = false;
        releaseTile();
        state.side = 'top';
        state.perch = null;
      }
      if (state.mode === 'held') {
        // Held still (moved only a little) since when: held still over a
        // panel long enough, let go, and it is trapped inside it.
        if (!state.stillAt || Math.hypot(event.pageX - state.stillAt.x, event.pageY - state.stillAt.y) > STILL_PX) {
          state.stillAt = { x: event.pageX, y: event.pageY };
          state.stillSince = time;
        }
        // Carried up high it takes fright.
        const scared = heightAbove(event.pageX, event.pageY + FEET.y - SCRUFF.y) > SCARED_AT;
        if (scared && !state.scared) say('!');
        state.scared = scared;
        state.x = event.pageX;
        state.y = event.pageY;
        place();
      }
    };
    const onPointerUp = (event) => {
      const press = state.press;
      if (!press) return;
      state.press = null;
      clearTimeout(press.timer);
      const time = performance.now();
      state.lastPlay = time;
      if (state.mode === 'held') {
        // From hanging by its scruff at the pointer to standing on its feet,
        // without moving on screen.
        state.x += FEET.x - SCRUFF.x;
        state.y += FEET.y - SCRUFF.y;
        // It stays put where it was put a moment, before it plays again.
        state.chaseRest = time + 2500;
        // Dropped on its owner's name: back to hiding behind it, peeking over.
        const name = document.querySelector('[data-cat-home]')?.getBoundingClientRect();
        if (
          name &&
          event.clientX > name.left - 24 &&
          event.clientX < name.right + 24 &&
          event.clientY > name.top - 30 &&
          event.clientY < name.bottom + 30
        ) {
          Object.assign(state, { mode: 'emerge', perch: null, side: 'top', peeked: false, inside: null });
          say('heart');
          return;
        }
        // Dropped on (or just above) the notes pill: she stays on it, and
        // does there what fits.
        const notes = document.querySelector('[data-cat-notes]');
        const pill = notes?.getBoundingClientRect();
        if (
          pill &&
          event.clientX > pill.left - 24 &&
          event.clientX < pill.right + 24 &&
          event.clientY > pill.top - 90 &&
          event.clientY < pill.bottom
        ) {
          state.manual = false;
          state.resume = { steps: () => atNotes(notes) };
          leapTo(notes, event.pageX, DROP_MS);
          state.scared = false;
          return;
        }
        // Held still over well inside a panel a while, then let go: trapped in
        // it, till it finds a way out.
        const stillLongEnough = time - (state.stillSince ?? time) >= TRAP_HOLD_MS;
        const inside = [...document.querySelectorAll('[data-cat-perch]')].find((element) => {
          if (!stillLongEnough) return false;
          const edge = page(element.getBoundingClientRect());
          return (
            edge.bottom - edge.top >= 120 &&
            event.pageX > edge.left + 20 &&
            event.pageX < edge.right - 20 &&
            event.pageY > edge.top + 40 &&
            event.pageY < edge.bottom - 10
          );
        });
        if (inside) {
          trap(inside, time);
          return;
        }
        // Dropped beside a panel's side: it clings on there, where it was let go.
        const beside = [...document.querySelectorAll('[data-cat-perch]')]
          .flatMap((element) => {
            const edge = page(element.getBoundingClientRect());
            if (event.pageY < edge.top + 20 || event.pageY > edge.bottom - 10) return [];
            return [
              { element, side: 'left', distance: edge.left - event.pageX },
              { element, side: 'right', distance: event.pageX - edge.right },
            ];
          })
          .filter(({ element, side, distance }) => distance > -14 && distance < 50 && sideFits(element, side))
          .sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance))[0];
        if (beside) {
          leapTo(beside.element, state.y, DROP_MS, beside.side);
          return;
        }
        // Dropped over nothing at all (no panel anywhere below): it falls off
        // the bottom of the screen, tumbling, and comes back by a way in.
        const anyBelow = [...document.querySelectorAll('[data-cat-perch]')].some((element) => {
          const edge = page(element.getBoundingClientRect());
          return event.pageX >= edge.left && event.pageX <= edge.right && edge.top >= event.pageY - 30;
        });
        if (!anyBelow) {
          Object.assign(state, { mode: 'plummet', started: time, from: { x: state.x, y: state.y }, perch: null });
          saw('mishap:fall');
          cheerUp(JOY.fall);
          state.wasScared = state.scared;
          state.scared = false;
          say('!');
          return;
        }
        // Dropped elsewhere: onto the panel under the pointer, else the nearest in view.
        const perches = visiblePerches();
        const below = perches
          .map((element) => ({ element, edge: page(element.getBoundingClientRect()) }))
          .filter(({ edge }) => event.pageX >= edge.left && event.pageX <= edge.right && edge.top >= event.pageY - 30)
          .sort((a, b) => a.edge.top - b.edge.top)[0]?.element;
        const nearest = perches
          .map((element) => {
            const edge = page(element.getBoundingClientRect());
            return { element, distance: Math.abs(edge.top - event.pageY) };
          })
          .sort((a, b) => a.distance - b.distance)[0]?.element;
        leapTo(below ?? nearest, event.pageX, DROP_MS);
        // Let go from up high, it drops, gathering speed, and has to steady itself.
        const height = state.mode === 'fall' ? state.to.y - state.y : 0;
        if (height > SCARED_AT) {
          state.gravity = true;
          saw('mishap:drop');
          cheerUp(JOY.drop);
          state.duration = Math.min(750, Math.max(300, Math.sqrt((2 * height) / 2600) * 1000));
        }
        state.scared = false;
        return;
      }
      if (press.petting) {
        if (state.mode !== 'go' && state.mode !== 'follow') rest(time);
        return;
      }
      if (state.inside) {
        say('?');
        return;
      }
      // A click: purr, and what can be done for it pops up; two quick ones, a
      // slow blink; more, it rolls over and hops off. On a side it stays peeking.
      state.clicks = [...state.clicks.filter((at) => time - at < 700), time];
      clearTimeout(state.clickTimer);
      state.clickTimer = setTimeout(() => {
        const count = state.clicks.length;
        state.clicks = [];
        const at = performance.now();
        cheerUp(JOY.click);
        if (count === 1) {
          if (state.menu) {
            closeMenu();
            return;
          }
          openMenu();
        } else closeMenu();
        if (onSide() || state.mode === 'go' || state.mode === 'follow') {
          say('prr');
          say('heart');
          if (count >= 3 && state.mode !== 'go') leapTo(state.perch, null, HOP_MS);
          return;
        }
        if (count >= 3) {
          state.mode = 'roll';
          state.until = at + 650;
        } else if (count === 2) {
          sit(at, 'purring', 1800);
          say('heart');
        } else {
          sit(at, 'purring', 2400);
          say('prr');
          say('heart');
        }
      }, 320);
    };
    const onScroll = () => {
      state.scrolledAt = performance.now();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    // The menu closes on a press anywhere else, or Escape; its options act here.
    const onPressAway = (event) => {
      state.lastPress = { target: event.target, at: performance.now() };
      // A pop-up already opened by hovering, which the click then keeps open:
      // as if it had opened now.
      const trigger = event.target.closest?.('[aria-haspopup="dialog"]');
      // (inside its panel, or the panel itself inside it)
      if (trigger && state.perch?.contains && (state.perch.contains(trigger) || trigger.contains(state.perch))) {
        setTimeout(() => {
          if (trigger.getAttribute('aria-expanded') !== 'true') return;
          const content = document.getElementById(trigger.getAttribute('aria-controls'));
          const card = popupCard(content?.closest('[data-radix-popper-content-wrapper]'));
          if (card) onPopup(card);
        }, 300);
      }
      if (
        state.mode === 'tease' &&
        !state.dart &&
        !event.target.closest?.('[data-cat]') &&
        Math.hypot(event.pageX - state.x, event.pageY - (state.y - 20)) < 130
      ) {
        dodge(event.pageX, performance.now());
      }
      if (state.menu && !menuBox.current?.contains(event.target) && !event.target.closest?.('[data-cat]')) {
        closeMenu();
      }
    };
    const onKey = (event) => {
      if (event.key === 'Escape' && state.menu) closeMenu();
    };

    // Called by name ("mochi" typed anywhere but into a field) or to a spot (a
    // double-click on the page, not on anything that does something): ears
    // up, eyes wide ("!"), it comes, along its panel or leaping to the panel
    // there, and sits looking up ("mrrp?"), rubbing against the pointer if it
    // is close ("prr").
    const CALLABLE = new Set(['rest', 'sit', 'walk', 'act', 'sleep']);
    const perchAt = (x, y) => {
      const panels = visiblePerches()
        .map((element) => ({ element, edge: page(element.getBoundingClientRect()) }))
        .filter(({ edge }) => x > edge.left + 20 && x < edge.right - 20);
      const above = panels.filter(({ edge }) => edge.top <= y + 30).sort((a, b) => b.edge.top - a.edge.top)[0];
      const below = panels.filter(({ edge }) => edge.top > y + 30).sort((a, b) => a.edge.top - b.edge.top)[0];
      return (above ?? below)?.element ?? null;
    };
    const pointerClose = () =>
      performance.now() - state.pointer.at < 8000 &&
      Math.hypot(state.pointer.x - state.x, state.pointer.y - (state.y - 18)) < 120;
    const answerCall = () => [
      { pose: 'sit', mood: 'chatter', ms: 700, start: () => say('mrrp?') },
      {
        pose: 'lean',
        mood: 'purring',
        ms: 1400,
        start: (step) => {
          if (!pointerClose()) step.pose = 'sit';
          say('prr');
        },
      },
      { pose: 'sit', mood: 'purring', ms: 700, start: () => say('heart') },
    ];
    const comeTo = (x, y, id) => {
      const time = performance.now();
      if (!state.perch || state.inside || !CALLABLE.has(state.mode)) return false;
      const target = perchAt(x, y) ?? state.perch;
      const perk = {
        pose: 'sit',
        mood: 'chatter',
        ms: 650,
        start: () => {
          state.facing = x < state.x ? -1 : 1;
          tiltHead();
          say('!');
          saw(id);
        },
      };
      if (target === state.perch && !onSide()) play([perk, { to: x }, ...answerCall()], time);
      else {
        play(
          [
            perk,
            {
              pose: 'crouch',
              ms: 250,
              start: () => {
                state.resume = { steps: answerCall };
                leapTo(target, x);
              },
            },
          ],
          time,
        );
      }
      return true;
    };
    let typed = '';
    const onTyped = (event) => {
      if (event.key?.length !== 1 || event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      typed = (typed + event.key.toLowerCase()).slice(-5);
      if (typed !== 'mochi') return;
      typed = '';
      if (state.pointer.cx != null) comeTo(state.pointer.cx + window.scrollX, state.pointer.cy + window.scrollY, 'call:name');
      else if (CALLABLE.has(state.mode) && state.perch) {
        play([{ pose: 'sit', mood: 'chatter', ms: 700, start: () => (tiltHead(), say('!'), saw('call:name')) }, ...answerCall()], performance.now());
      }
    };
    const onDoubleClick = (event) => {
      if (
        event.target.closest?.(
          'button, a, input, textarea, select, label, [role="tab"], [role="dialog"], [role="menu"], [data-cat-layer], [data-radix-popper-content-wrapper]',
        )
      )
        return;
      // (The word a double-click selects is not something to pounce on.)
      window.getSelection()?.removeAllRanges();
      state.selectRest = performance.now() + 1500;
      comeTo(event.pageX, event.pageY, 'call:here');
    };

    // Playing with the page itself, when it is about on a panel's top: it
    // dashes after the highlight of a tab you pick and swats at it; stalks a
    // chart's hover dot along its panel and pounces when it stops; pounces on
    // text you select on its panel (or looks round at it, nearby); and,
    // scrolled hard, hangs on by its front paws and scrambles back up.
    const playful = () => state.perch && !state.inside && !onSide() && ['rest', 'sit', 'walk'].includes(state.mode);
    const onTabClick = (event) => {
      const tab = event.target.closest?.('[role="tab"]');
      const time = performance.now();
      if (!tab || !playful() || time < (state.tabRest ?? 0)) return;
      const rect = tab.getBoundingClientRect();
      if (Math.abs(rect.top + rect.height / 2 - (state.y - window.scrollY)) > 450) return;
      state.tabRest = time + 5000;
      const x = onEdge(rect.left + rect.width / 2 + window.scrollX);
      const dir = x < state.x ? -1 : 1;
      play(
        [
          { pose: 'sit', ms: 250, start: () => ((state.facing = dir), say('!'), saw('page:tabs')) },
          {
            pose: strides('run', 'run2', 110),
            start: (step) => {
              step.from = state.x;
              step.to = Math.abs(x - state.x) > 30 ? x - dir * 24 : state.x;
              step.ms = Math.max(200, (Math.abs(step.to - step.from) / (CHASE * 1.4)) * 1000);
            },
            frame: (step, now, k) => (state.x = step.from + (step.to - step.from) * k),
          },
          { pose: 'reach', ms: 320 },
          { pose: 'sit', mood: 'purring', ms: 800, start: () => say(Math.random() < 0.5 ? '?' : 'heart') },
        ],
        time,
      );
    };
    const onSelection = () => {
      clearTimeout(state.selectTimer);
      state.selectTimer = setTimeout(() => {
        const time = performance.now();
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.rangeCount || !playful()) return;
        if (time < (state.selectRest ?? 0)) return;
        const text = selection.toString().trim();
        if (text.length < 2 || text.length > 300) return;
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (!rect.width || rect.bottom < 0 || rect.top > window.innerHeight) return;
        const x = rect.left + rect.width / 2 + window.scrollX;
        const mine = state.perch.contains(range.commonAncestorContainer);
        if (!mine && Math.hypot(x - state.x, rect.top + window.scrollY - state.y) > 400) return;
        state.selectRest = time + 6000;
        const dir = x < state.x ? -1 : 1;
        play(
          mine
            ? [
                {
                  pose: 'crouch',
                  ms: 600,
                  rock: { amp: 3.5, freq: 5.5, decay: 0 },
                  start: () => ((state.facing = dir), saw('page:select')),
                },
                hop(onEdge(x), 26),
                { pose: 'reach', ms: 320, start: () => say('!') },
                { pose: 'sit', mood: 'purring', ms: 800, start: () => say('?') },
              ]
            : [{ pose: 'sit', mood: 'chatter', ms: 1100, start: () => ((state.facing = dir), say('?'), saw('page:select')) }],
          time,
        );
      }, 350);
    };
    const onScrollHard = () => {
      const time = performance.now();
      const last = state.scrollSample;
      state.scrollSample = { y: window.scrollY, time };
      if (!last || time - last.time > 200 || time < (state.clingRest ?? 0) || !playful()) return;
      if (Math.abs(window.scrollY - last.y) / Math.max(1, time - last.time) < 4) return;
      const rect = state.perch.getBoundingClientRect();
      if (rect.top < topClear() || rect.top > window.innerHeight - 40) return;
      state.clingRest = time + 8000;
      play(
        [
          { pose: 'hang', mood: 'hungry', ms: 900, start: () => (say('!'), saw('page:scroll')) },
          { pose: 'scramble', ms: 500 },
          { pose: 'sit', mood: 'hungry', ms: 700, start: () => say('…') },
        ],
        time,
      );
    };
    // A chart's hover dot, stalked along its panel till it stops (or the
    // pointer leaves the chart), then pounced on.
    const stalkChart = () => [
      { pose: 'crouch', ms: 400, start: () => (say('!'), saw('page:chart')) },
      {
        pose: strides('creep', 'creep2', 220),
        ms: 9000,
        start: (step, time) => (step.last = time),
        frame: (step, time) => {
          const dt = Math.min(0.05, (time - step.last) / 1000);
          step.last = time;
          if (!state.pointer.chart || time - state.pointer.at > 1800) {
            step.done = true;
            return;
          }
          const gap = onEdge(state.pointer.cx + window.scrollX) - state.x;
          if (Math.abs(gap) > 3) {
            state.x += Math.sign(gap) * Math.min(Math.abs(gap), 110 * dt);
            state.facing = gap < 0 ? -1 : 1;
          }
        },
      },
      { pose: 'crouch', ms: 450, rock: { amp: 3.5, freq: 5.5, decay: 0 } },
      hop(() => onEdge(state.x + state.facing * 22), 22),
      { pose: 'reach', ms: 320, start: () => say('!') },
      { pose: 'sit', mood: 'purring', ms: 800 },
    ];

    // Its first stir each day (in this browser): a wave hello ("hi!"), how
    // many cookies you baked it yesterday, and over to rub against the pointer.
    let helloDue = stored(HELLO_KEY) !== dayKey();
    const hello = () => {
      const yesterday = mealRef.current?.yesterday;
      const count = Math.round(yesterday ?? 0);
      const near = state.pointer.cx != null && performance.now() - state.pointer.at < 20000;
      const to = near ? onEdge(state.pointer.cx + window.scrollX) : null;
      return [
        { pose: 'hello', ms: 1500, start: () => (say('hi!'), saw('hello:day'), cheerUp(JOY.hello)) },
        ...(yesterday == null
          ? []
          : [
              {
                pose: 'sit',
                mood: 'purring',
                ms: 1900,
                start: () => say(count > 0 ? `${count} cookie${count === 1 ? '' : 's'} yesterday!` : 'missed you!'),
              },
            ]),
        ...(to != null && Math.abs(to - state.x) > 20 ? [{ to }] : []),
        ...(near ? [{ pose: 'lean', mood: 'purring', ms: 1400, start: () => say('prr') }] : []),
        { pose: 'sit', mood: 'purring', ms: 700, start: () => say('heart') },
      ];
    };

    // A present: it finds something by its feet ("?"), sniffs it, picks it up
    // ("!"), takes it over to the notes pill and drops it there beside it
    // ("mrrp"), a heart; it stays there till picked up (a click).
    const placeGift = (kind, notes) => {
      const rect = notes.getBoundingClientRect();
      const item = {
        kind,
        right: Math.round(window.innerWidth - rect.left + 6),
        bottom: Math.round(window.innerHeight - rect.bottom + 2),
      };
      store(GIFT_KEY, JSON.stringify(item));
      store(GIFT_LAST_KEY, String(Date.now()));
      setGift(item);
    };
    const bringGift = (notes) => {
      const kinds = Object.keys(GIFTS);
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const drop = () => {
        const spot = () => {
          const rect = notes.getBoundingClientRect();
          return { x: rect.left + window.scrollX - 12, y: rect.bottom + window.scrollY - 2 };
        };
        return [
          { pose: 'sit', ms: 500, start: () => ((state.facing = -1), say('mrrp')) },
          {
            pose: 'reach',
            ms: 450,
            frame: (step, time, k) => {
              const to = spot();
              putThing({
                kind: 'gift',
                variant: kind,
                x: state.x + (to.x - state.x) * k,
                y: state.y - 20 + (to.y - state.y + 20) * k - 18 * Math.sin(Math.PI * k),
              });
            },
          },
          {
            pose: 'sit',
            mood: 'purring',
            ms: 900,
            start: () => {
              putThing(null);
              if (notes.isConnected) placeGift(kind, notes);
              say('heart');
            },
          },
        ];
      };
      return [
        {
          pose: 'sit',
          ms: 700,
          start: () => {
            putThing({ kind: 'gift', variant: kind, x: onEdge(state.x + state.facing * 24), y: state.y });
            say('?');
          },
        },
        { pose: 'sniff', ms: 800, start: () => say('sniff') },
        { pose: 'crouch', ms: 400, start: () => (putThing(null), say('!')) },
        {
          pose: 'sit',
          ms: 200,
          start: () => {
            state.resume = { steps: drop };
            const rect = notes.getBoundingClientRect();
            leapTo(notes, rect.left + window.scrollX + rect.width * 0.6);
          },
        },
      ];
    };
    // Picked up (a click on it): a little cheer from it.
    const onGiftTaken = () => {
      cheerUp(JOY.gift);
      if (CALLABLE.has(state.mode)) say('heart');
    };
    window.addEventListener('pointerdown', onPressAway);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keydown', onTyped);
    document.addEventListener('dblclick', onDoubleClick);
    document.addEventListener('click', onTabClick, true);
    document.addEventListener('selectionchange', onSelection);
    window.addEventListener('scroll', onScrollHard, { passive: true });
    window.addEventListener('bakery-cat-gift-taken', onGiftTaken);
    state.takeWish = () => {
      const toy = state.wish;
      if (!toy) return;
      state.manual = false;
      cheerUp(JOY.wish);
      wishFor(null);
      if (toy === 'treat') onTreat();
      else if (wanted[toy]) play(wanted[toy](), performance.now());
      else if (toy === 'dance') play(doings.dance(), performance.now());
      else startGame(toy, performance.now());
    };
    // (What comes of these is a surprise, so it goes in her scrapbook.)
    state.choose = (kind) => {
      closeMenu();
      state.manual = false;
      if (kind === 'treat') onTreat();
      else if (kind === 'toy') onToy();
      else if (kind === 'follow') {
        cheerUp(JOY.game);
        startFollow(null, performance.now());
      } else if (kind === 'dance') {
        cheerUp(JOY.dance);
        // On a side it hops up to dance.
        if (onSide()) {
          leapTo(state.perch, null, HOP_MS);
          setTimeout(() => state.choose('dance'), SPRING_MS + HOP_MS + 400);
        } else if (state.perch) play(doings.dance(), performance.now());
      } else goHome();
    };
    // Follow me: off its panel and after the pointer through the air, one of
    // its ways (or way), for a while; then down onto the panel below it, or
    // the nearest in view.
    const startFollow = (way, time) => {
      const ways = Object.keys(FOLLOWS).filter((name) => name !== state.lastFollow);
      const chosen = FOLLOWS[way] ? way : ways[Math.floor(Math.random() * ways.length)];
      state.lastFollow = chosen;
      saw(`follow:${chosen}`);
      closeMenu();
      releaseTile();
      if (state.wish) wishFor(null);
      putThing(null);
      Object.assign(state, {
        mode: 'follow',
        perch: null,
        side: 'top',
        game: null,
        go: null,
        resume: null,
        spin: null,
        rock: null,
        tilt: 0,
        lift: 0,
        follow: {
          way: chosen,
          until: time + random(...FOLLOW_MS),
          x: state.x,
          y: state.y,
          vx: 0,
          vy: -120,
          from: time,
        },
      });
      say('!');
    };
    const endFollow = () => {
      putThing(null);
      state.follow = null;
      state.tilt = 0;
      say('✦');
      const perches = visiblePerches();
      const near = (element) => {
        const edge = page(element.getBoundingClientRect());
        return Math.hypot(Math.min(edge.right, Math.max(edge.left, state.x)) - state.x, edge.top - state.y);
      };
      const to = perchBelow(state.x, state.y) ?? perches.sort((a, b) => near(a) - near(b))[0];
      if (to) leapTo(to, state.x);
      else state.mode = 'idle';
    };
    // In development, one of its doings can be started by name from the console.
    if (import.meta.env.DEV) {
      window.mochiState = state;
      window.mochi = (name) => {
        // (Not for her scrapbook either; book:<id> keeps a page, to try it.)
        if (name.startsWith('book:')) return keepMoment(name.slice(5));
        // outfit:<halloween|christmas|lunarnewyear> (or outfit: for none) to try one on.
        if (name.startsWith('outfit:')) {
          setOutfit(name.slice(7) || null);
          return true;
        }
        if (name === 'tilt') {
          tiltHead();
          return true;
        }
        state.manual = true;
        // joy:<0-100> sets her spirits.
        if (name.startsWith('joy:')) {
          joy = changeJoy(Number(name.slice(4)) - joy);
          return true;
        }
        // craft:heli or craft:ufo (or craft: for either) for what comes next.
        if (name.startsWith('craft:')) {
          state.forceCraft = name.slice(6) || null;
          return true;
        }
        if (!state.perch || onSide() || state.mode !== 'rest') return false;
        if (name === 'tease') startTease(performance.now());
        else if (name.startsWith('follow:')) startFollow(name.slice(7), performance.now());
        else if (['yarn', 'feather', 'laser', 'mouse', 'bubbles'].includes(name)) startGame(name, performance.now());
        else if (name.startsWith('treat:')) play(treats[name.slice(6)](), performance.now());
        else if (name.startsWith('toss:')) play(tossed[name.slice(5)](), performance.now());
        else if (name.startsWith('atyou:')) play(atYou[name.slice(6)](), performance.now());
        else if (name === 'oven:cookie') play(earned.cookie(), performance.now());
        else if (name.startsWith('oven:')) visitScene('oven', name.slice(5));
        else if (name.startsWith('pack:')) visitScene('pack', name.slice(5));
        else if (name.startsWith('bed:')) play(doings.bed(name.slice(4)), performance.now());
        else if (name.startsWith('gpu:')) return visitGpu(name.slice(4));
        // notes:<way> (or notes: for any) sends her to the notes pill, there to
        // call (a way of calling) or cheer (applause, thumbs), as fits.
        else if (name.startsWith('notes:')) {
          return visitNotes(notesIn('pill', 'clear', 'quiet'), performance.now(), name.slice(6));
        } else if (name === 'run') stroll(true);
        else if (name.startsWith('popup:')) {
          // popup:<outcome>[:<way>[:<reaction>]], or popup:<reaction> (over, by a leap).
          const card = openPopups()[0];
          if (!card) return false;
          const [, first, way, reaction] = name.split(':');
          state.forcePopup = popupReactions[first]
            ? { outcome: 'over', way: 'leap', reaction: first }
            : { outcome: first, way, reaction };
          state.popupSeen = null;
          state.popupAt = null;
          onPopup(card);
          state.forcePopup = null;
        } else if (name === 'plummet') {
          Object.assign(state, {
            mode: 'plummet',
            started: performance.now(),
            from: { x: state.x, y: state.y },
            perch: null,
          });
          state.wasScared = false;
        } else if (name.startsWith('in:')) {
          const [, way, from] = name.split(':');
          const perches = visiblePerches();
          const perch = from === 'above' ? perches[0] : perches[perches.length - 1];
          state.lastWayIn = null;
          const keep = WAYS_IN[from];
          WAYS_IN[from] = [way];
          comeBack(perch, from === 'above', performance.now());
          WAYS_IN[from] = keep;
        } else if (name.startsWith('trap:')) {
          const [, way, index] = name.split(':');
          const panel = [...document.querySelectorAll('[data-cat-perch]')][Number(index)];
          state.escapeAs = way;
          const edge = page(panel.getBoundingClientRect());
          state.x = edge.left + (edge.right - edge.left) * 0.55;
          state.y = edge.top + (edge.bottom - edge.top) * 0.4;
          trap(panel, performance.now());
          state.escapeAs = null;
        } else if (name.startsWith('wish:')) play(wanted[name.slice(5)](), performance.now());
        else if (name === 'slip') {
          stroll(true);
          const edge = page(state.perch.getBoundingClientRect());
          state.goal = state.x < (edge.left + edge.right) / 2 ? edge.right - MARGIN : edge.left + MARGIN;
          state.mishap = { kind: 'slip' };
        } else if (mishaps[name]) play(mishaps[name](state.x), performance.now());
        else if (name === 'trip') {
          const below = perchBelow(state.x, state.y);
          if (!below) return false;
          Object.assign(state, { mode: 'trip', until: performance.now() + 520, tripTo: below });
        } else if (name.startsWith('dance:')) {
          state.lastDance = null;
          play([{ pose: 'sit', mood: 'purring', ms: 350 }, ...dances[name.slice(6)](), ...bow()], performance.now());
        } else play(doings[name](), performance.now());
        return true;
      };
    }
    // A press on the cat: held still it is petting, moved it picks the cat up.
    state.onPointerDown = (event) => {
      event.preventDefault();
      const time = performance.now();
      if (state.mode === 'emerge') {
        state.mode = 'popout';
        state.until = time + 550;
        say('!');
        return;
      }
      // Mid-game of keep-away, a click on it is a grab: mostly it is caught, but
      // it may dodge at the last moment (the quicker it is, the likelier).
      if (state.mode === 'tease') {
        if (!state.dart && Math.random() < 0.3 * teasePace(time)) dodge(event.pageX, time);
        else caught(time);
        return;
      }
      state.lastPlay = time;
      const press = { x: event.pageX, y: event.pageY, petting: false };
      press.timer = setTimeout(() => {
        press.petting = true;
        saw('pointer:pet');
        cheerUp(JOY.pet);
        if (!onSide() && state.mode !== 'go' && state.mode !== 'follow') state.mode = 'pet';
        say('heart');
        press.hearts = setInterval(() => (state.press === press ? say('heart') : clearInterval(press.hearts)), 900);
      }, 450);
      state.press = press;
    };

    // Out it comes. Already out when the page loads (and its owner's name in
    // view), it pokes its head up from behind the name and waits there,
    // peeking and looking round, till clicked; otherwise it leaps straight in.
    const home = document.querySelector('[data-cat-home]')?.getBoundingClientRect();
    if (peek && home && home.top > 0 && home.bottom < window.innerHeight) {
      state.mode = 'emerge';
      state.x = home.left + window.scrollX + home.width / 2;
      state.y = home.top + window.scrollY + 2;
    } else leapTo(visiblePerches()[0]);
    let last = performance.now();
    let frame = requestAnimationFrame(function step(time) {
      frame = requestAnimationFrame(step);
      // Seconds since the last frame, so its pace is the same at any frame rate.
      const dt = Math.min(0.05, Math.max(0, time - last) / 1000);
      last = time;
      if (state.popupSeen && !state.popupSeen.isConnected) state.popupSeen = null;
      // Left alone (nobody has played with her for a minute), her spirits
      // sink a little each minute she is out.
      if (!state.joyTick) state.joyTick = time + 60 * 1000;
      if (time > state.joyTick) {
        state.joyTick = time + 60 * 1000;
        if (time - (state.joyedAt ?? 0) > 60 * 1000) joy = changeJoy(-JOY_FADE);
      }
      // Perched on a pop-up card that has closed: it drops down onto a panel.
      if (state.perch && !state.perch.isConnected && !state.inside && state.mode !== 'go') dropDown();
      // Calling at the notes pill: opened, she is delighted; cleared, she
      // cheers the all-clear; hidden, she just goes.
      const calling = state.bidding;
      if (calling && state.perch === calling && ['land', 'script', 'sit', 'rest'].includes(state.mode)) {
        const notes = calling.getAttribute('data-cat-notes');
        if (notes === 'open') noticed(time);
        else if (notes !== 'pill') {
          state.resume = null;
          if (things.current) putThing(null);
          if (notes === 'clear' || notes === 'clear-open') play(atNotes(calling), time);
          else {
            say('?');
            offNotes(calling);
          }
        }
      }
      // Under a pop-up card (one opened over it, or one it has wandered in
      // under): it never lets that be.
      if (time > (state.blockCheck ?? 0)) {
        state.blockCheck = time + 400;
        // The notes opened (with her there or not): she leaves them be a while.
        if (document.querySelector('[data-cat-notes="open"]')) {
          state.notesRest = Math.max(state.notesRest ?? 0, time + NOTES_SEEN_MS);
        }
        if (POPUP_MODES.has(state.mode) && !quietRef.current && !state.inside) {
          const over = openPopups().find(
            (card) => coverOf(page(card.getBoundingClientRect()), state.x, state.y) >= POPUP_BLOCKS,
          );
          if (over) onPopup(over, time);
          // The bakery's card (or a packing counter's) open, and she has not
          // been to it since it opened (busy when it did): now she goes.
          const scene = openPopups().find(sceneOf);
          if (!over && scene && state.sceneSeen !== scene.closest('[data-radix-popper-content-wrapper]')) {
            onPopup(scene, time);
          }
        }
      }
      // Trapped in a panel: it keeps to the panel's floor, between its walls.
      if (state.inside) {
        const edge = page(state.inside.getBoundingClientRect());
        state.y = edge.bottom - 10;
        if (!state.squeezing) state.x = Math.min(edge.right - 34, Math.max(edge.left + 34, state.x));
      }
      // Follow its panel as the page moves, riding along while the page
      // scrolls; once the scrolling has settled with its panel out of view, one
      // leap in from the edge it left by onto the nearest panel in view.
      else if (
        state.perch &&
        [
          'rest',
          'walk',
          'sit',
          'sleep',
          'crouch',
          'spring',
          'pet',
          'chase',
          'knock',
          'roll',
          'toy',
          'land',
          'act',
          'zoom',
          'wobble',
          'trip',
          'splat',
          'skid',
          'script',
          'tease',
          'game',
        ].includes(state.mode)
      ) {
        const rect = state.perch.getBoundingClientRect();
        const edge = page(rect);
        const spot = onSide()
          ? spotOn(state.perch, edge.top + state.along, state.side)
          : spotOn(state.perch, fromEnd(state.perch, edge) + state.along);
        state.x = spot.x;
        state.y = spot.y;
        const onScreen = spot.y - window.scrollY;
        // Gone when its head would be under the navigation bar. (Not the notes
        // pill, fixed in view: opened tall, she is only there a moment more.)
        const above = onScreen < topClear() - 12;
        if (
          (above || onScreen > window.innerHeight - 10 || !rect.width) &&
          time - state.scrolledAt > SETTLE_MS &&
          !state.perch.hasAttribute('data-cat-notes')
        ) {
          const perches = visiblePerches();
          const perch = above ? perches[0] : perches[perches.length - 1];
          if (perch) {
            state.x = Math.min(window.scrollX + window.innerWidth - MARGIN, Math.max(window.scrollX + MARGIN, state.x));
            state.y = above ? window.scrollY + topClear() - 40 : window.scrollY + window.innerHeight + 20;
            state.perch = null;
            comeBack(perch, above, time);
          }
        }
      }
      const along = () => {
        if (!state.perch) return;
        const edge = page(state.perch.getBoundingClientRect());
        state.along = onSide() ? state.y - edge.top : state.x - fromEnd(state.perch, edge);
      };
      // Near enough to play with, unless its menu is open and the pointer is on its way there.
      const pointerNear =
        !state.menu &&
        time - state.pointer.at < 1500 &&
        Math.hypot(state.pointer.x - state.x, state.pointer.y - (state.y - 18)) < feel().notice;

      // The pointer comes near while it is resting, strolling or busy with
      // something of its own: it comes to play (hopping up off a panel's side
      // first), or, hungry, begs.
      const busy = state.mode === 'act' && state.act.pose !== 'beg';
      if (pointerNear && time > state.chaseRest && (state.mode === 'rest' || state.mode === 'walk' || busy)) {
        state.manual = false;
        if (!onSide() && Math.random() < (feel().ignores ?? 0)) {
          // Not in the mood: she turns away ("hmph").
          state.chaseRest = time + 5000;
          state.facing = state.pointer.x < state.x ? 1 : -1;
          say('hmph');
        } else if (onSide()) {
          state.chaseRest = 0;
          leapTo(state.perch, state.pointer.x, HOP_MS);
        } else if (feel().begs && !busy && Math.random() < 0.6) {
          state.chaseRest = time + 3000;
          act('beg', time);
        } else if (!busy && Math.random() < feel().tease) {
          // Keep-away: it plays hard to get.
          startTease(time);
          say('♪');
        } else if ((state.pointerSpeed ?? 0) > 700 && Math.abs(state.pointer.x - state.x) > 70 && Math.random() < 0.6) {
          state.chaseRest = time + 3000;
          play(doings.pounce(), time);
        } else {
          state.mode = 'chase';
          state.until = time + 6000;
          saw('pointer:chase');
        }
      }
      // The pointer resting still just above it: it comes to rub against it.
      const still = time - state.pointer.at;
      if (
        (state.mode === 'rest' || state.mode === 'walk') &&
        !onSide() &&
        !state.menu &&
        still > 1200 &&
        still < 8000 &&
        time > (state.buntRest ?? 0) &&
        Math.abs(state.pointer.x - state.x) < 110 &&
        state.pointer.y < state.y + 10 &&
        state.pointer.y > state.y - 120
      ) {
        state.buntRest = time + BUNT_EVERY;
        state.manual = false;
        play(doings.bunt(), time);
      }

      // A helicopter bringing a stolen tile back: rising with it off screen,
      // carrying it across, lowering it into its place, and flying off.
      const stolen = state.stolen;
      if (stolen && time > stolen.heliAt) {
        stolen.heliFrom = stolen.heliFrom ?? time;
        const k = (time - stolen.heliFrom) / 4200;
        const across = Math.min(1, Math.max(0, (k - 0.15) / 0.55));
        const eased = across < 0.5 ? 2 * across * across : 1 - (-2 * across + 2) ** 2 / 2;
        const up = k < 0.15 ? k / 0.15 : k > 0.75 ? Math.max(0, (1 - k) / 0.25) : 1;
        const ox = stolen.dx * (1 - eased);
        const oy = -150 * up;
        const middle = (stolen.base.left + stolen.base.right) / 2;
        // (A UFO holds it in its beam of light, switched off as it leaves.)
        const ufo = stolen.craft === 'ufo';
        if (k < 1) {
          stolen.tile.style.transform = `translate(${ox}px, ${oy}px)`;
          setHeli({ kind: stolen.craft, x: middle + ox, y: stolen.base.top + oy - 46, rope: ufo ? 47 : 40 });
        } else {
          stolen.tile.style.transform = '';
          const away = Math.min(1, (k - 1) / 0.3);
          setHeli({
            kind: stolen.craft,
            x: middle - stolen.dir * 260 * away,
            y: stolen.base.top - 46 - 300 * away,
            rope: ufo ? 47 * Math.max(0, 1 - away * 4) : 40,
            opacity: 1 - away,
          });
          if (away >= 1) {
            state.stolen = null;
            setHeli(null);
          }
        }
      }

      // Leaping after the laser dot to another card: it keeps moving.
      if (state.game?.kind === 'laser' && ['spring', 'leap', 'land'].includes(state.mode)) aimLaser(time);
      switch (state.mode) {
        case 'leap': {
          // Nearly a steady pace across, an arc up and down, and the cat tilted
          // along it: nose up as it rises, down as it comes in to land.
          const t = Math.min(1, (time - state.started) / state.duration);
          const eased = 0.5 * t + 0.25 * (1 - Math.cos(Math.PI * t));
          const pace = 0.5 + 0.25 * Math.PI * Math.sin(Math.PI * t);
          const dx = state.to.x - state.from.x;
          state.x = state.from.x + dx * eased;
          state.y = state.from.y + (state.to.y - state.from.y) * eased - state.height * 4 * t * (1 - t);
          const rise = state.height * 4 * (1 - 2 * t) - (state.to.y - state.from.y) * pace;
          state.tilt = Math.max(-18, Math.min(18, (0.6 * Math.atan2(rise, Math.abs(dx * pace) + 60) * 180) / Math.PI));
          show(state.leapPose ?? 'leap');
          if (t >= 1 && state.homing) {
            state.mode = 'home';
            homeRef.current?.();
          } else if (t >= 1) {
            state.tilt = 0;
            state.leapPose = null;
            state.perch = state.target;
            state.side = state.targetSide;
            along();
            state.mode = 'land';
            state.until = time + 320;
          }
          break;
        }
        case 'fall': {
          // Let go: easing down onto its spot, still dangling for a top edge,
          // already clinging on for a side.
          // From up high it drops instead, gathering speed, legs flailing.
          const t = Math.min(1, (time - state.started) / state.duration);
          const eased = 1 - (1 - t) ** 3;
          state.x = state.from.x + (state.to.x - state.from.x) * eased;
          state.y = state.from.y + (state.to.y - state.from.y) * (state.gravity ? t * t : eased);
          show(state.tumbling ? 'tumble' : state.gravity ? 'scared' : state.targetSide === 'top' ? 'held' : 'cling');
          if (t >= 1) {
            state.perch = state.target;
            state.side = state.targetSide;
            along();
            state.mode = state.tumbling ? 'splat' : state.gravity ? 'wobble' : 'land';
            state.started = time;
            state.until = time + (state.tumbling ? 1300 : state.gravity ? 1200 : 320);
            if (state.tumbling) say('✦');
            state.tumbling = false;
          }
          break;
        }
        case 'slip': {
          // Ran off the end: a skid that will not stop, hanging on by its
          // front paws (kicking), scrambling back up, and a hop back on.
          const edge = page(state.perch.getBoundingClientRect());
          const dir = state.slipDir;
          const corner = dir > 0 ? edge.right - 14 : edge.left + 14;
          const t = time - state.started;
          state.y = edge.top + 1;
          if (t < 340) {
            state.x = state.slipFrom + (corner - state.slipFrom) * (t / 340);
            show('skid');
          } else if (t < 2000) {
            state.x = corner;
            if (!state.slipSaid) {
              state.slipSaid = true;
              say('!');
            }
            show('hang');
          } else if (t < 2700) {
            show('scramble');
          } else if (t < 3100) {
            const k = (t - 2700) / 400;
            const safe = dir > 0 ? edge.right - MARGIN : edge.left + MARGIN;
            state.x = corner + (safe - corner) * k;
            state.lift = 18 * Math.sin(Math.PI * k);
            show('leap');
          } else {
            state.lift = 0;
            along();
            play(
              [
                { pose: 'sit', mood: 'hungry', ms: 600, start: () => say('~') },
                { pose: 'groom', ms: 1500 },
              ],
              time,
            );
          }
          break;
        }
        case 'steal': {
          // Down beside the tile, braced against it, then pushing it along
          // (faster and faster) till it and the cat are off the screen; then
          // back in from that edge, pleased with itself.
          const steal = state.steal;
          const t = time - steal.started;
          const { base, dir } = steal;
          const side = (dx) => (dir < 0 ? base.right + dx + PAW_REACH : base.left + dx - PAW_REACH);
          state.facing = dir;
          if (t < 450) {
            const k = t / 450;
            state.x = steal.from.x + (side(0) - steal.from.x) * k;
            state.y = steal.from.y + (base.bottom - steal.from.y) * k - 24 * Math.sin(Math.PI * k);
            show('leap');
          } else if (t < 1050) {
            state.x = side(0);
            state.y = base.bottom;
            if (!steal.braced) {
              steal.braced = true;
              say('!');
            }
            show('push');
          } else {
            steal.speed = Math.min(300, steal.speed + 140 * dt);
            steal.dx += dir * steal.speed * dt;
            steal.tile.style.transform = `translateX(${steal.dx}px)`;
            state.x = side(steal.dx);
            state.y = base.bottom;
            if (Math.floor(t / 900) !== steal.beat) {
              steal.beat = Math.floor(t / 900);
              say('hup');
            }
            show('push');
            const gone =
              dir < 0
                ? base.right + steal.dx < window.scrollX - 10
                : base.left + steal.dx > window.scrollX + window.innerWidth + 10;
            if (gone) steal.goneAt = steal.goneAt ?? time;
            if (steal.goneAt && time - steal.goneAt > 700) {
              stolenAway(steal, random(6000, 9000));
              // Back in from that edge onto the nearest panel in view.
              state.x = dir < 0 ? window.scrollX - 40 : window.scrollX + window.innerWidth + 40;
              state.perch = null;
              state.resume = {
                steps: () => [
                  { pose: 'sit', mood: 'purring', ms: 900, start: () => say('✦') },
                  { pose: 'groom', ms: 1400 },
                ],
              };
              const perches = visiblePerches();
              const back = perches.sort(
                (a, b) =>
                  Math.abs(page(a.getBoundingClientRect()).top - state.y) -
                  Math.abs(page(b.getBoundingClientRect()).top - state.y),
              )[0];
              if (back) leapTo(back, dir < 0 ? window.scrollX + 120 : window.scrollX + window.innerWidth - 120);
              else rest(time);
            }
          }
          break;
        }
        case 'kick': {
          const steal = state.steal;
          const t = time - steal.started;
          const { base, dir, tile } = steal;
          // Beside the tile, its back to it, hind paws reaching its side.
          const spot = dir < 0 ? base.right + KICK_REACH : base.left - KICK_REACH;
          state.facing = -dir;
          const kicks = [1100, 1800, 2500];
          if (t < 450) {
            const k = t / 450;
            state.x = steal.from.x + (spot - steal.from.x) * k;
            state.y = steal.from.y + (base.bottom - steal.from.y) * k - 24 * Math.sin(Math.PI * k);
            show('leap');
          } else if (t < 2800) {
            state.x = spot;
            state.y = base.bottom;
            const done = kicks.filter((at) => t >= at).length;
            const kicking = kicks.some((at) => t >= at && t < at + 320);
            show(kicking ? 'kick' : 'crouch');
            if (done !== (steal.kicks ?? 0)) {
              steal.kicks = done;
              say(done < 3 ? 'thump' : '!');
            }
            // Each kick jolts it and leaves it leaning further.
            const lean = dir * done * 3;
            const jolt = kicking ? dir * 5 : 0;
            tile.style.transformOrigin = dir < 0 ? 'left bottom' : 'right bottom';
            tile.style.transform = `translateX(${dir * done * 6 + jolt}px) rotate(${lean}deg)`;
          } else if (t < 4300) {
            // Over it goes, tumbling off the bottom of the screen.
            const k = (t - 2800) / 1500;
            tile.style.transform = `translate(${dir * (18 + 120 * k)}px, ${1100 * k * k}px) rotate(${dir * (9 + 120 * k)}deg)`;
            if (!steal.watched) {
              steal.watched = true;
              say('✦');
            }
            show('sit', 'purring');
          } else {
            // Gone; parked off the side of the screen for the helicopter to fetch.
            tile.style.transformOrigin = '';
            steal.dx = dir < 0 ? window.scrollX - base.right - 40 : window.scrollX + window.innerWidth - base.left + 40;
            tile.style.transform = `translateX(${steal.dx}px)`;
            stolenAway(steal, random(6000, 9000));
            state.resume = { steps: () => [{ pose: 'groom', ms: 1400 }] };
            const back = visiblePerches().sort(
              (a, b) =>
                Math.abs(page(a.getBoundingClientRect()).top - state.y) -
                Math.abs(page(b.getBoundingClientRect()).top - state.y),
            )[0];
            if (back) {
              state.perch = null;
              leapTo(back, state.x);
            } else rest(time);
          }
          break;
        }
        case 'go': {
          // Over to a pop-up card, a phase at a time (see goWays); if the card
          // closes before it gets there, it drops back down onto a panel.
          const go = state.go;
          if (!go.card.isConnected) {
            putThing(null);
            Object.assign(state, { go: null, spin: null, rock: null, tilt: 0, side: 'top' });
            dropDown();
            break;
          }
          let phase = go.phases[go.index];
          if (!phase || !(time - phase.started < phase.ms)) {
            go.index += 1;
            phase = go.phases[go.index];
            if (!phase) {
              landOn(go.card, time);
              break;
            }
            phase.started = time;
            phase.from = { x: state.x, y: state.y };
            state.rock = phase.rock ? { ...phase.rock, from: time } : null;
            state.tilt = 0;
            phase.start?.(phase, time);
          }
          const k = phase.ms ? Math.min(1, (time - phase.started) / phase.ms) : 1;
          phase.frame?.(phase, k, time);
          show(typeof phase.pose === 'function' ? phase.pose(time) : phase.pose, phase.mood ?? feel().face);
          break;
        }
        case 'enter': {
          // Coming back into view, by one of its ways in.
          const enter = state.enter;
          const t = time - enter.started;
          const { to, way, screenTop, screenBottom, side } = enter;
          const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
          if (way === 'ladder') {
            // A ladder slides up to the edge; it climbs it and steps off.
            const length = screenBottom - to.y + 20;
            const climbMs = Math.min(2600, Math.max(1200, length * 9));
            const rise = Math.min(1, t / 500);
            const sink = t > 900 + climbMs ? Math.min(1, (t - 900 - climbMs) / 500) : 0;
            putThing({ kind: 'ladder', x: to.x, y: to.y + (1 - rise + sink) * length, rope: length });
            if (t < 600) {
              state.y = screenBottom + 60;
              show('climb');
            } else if (t < 600 + climbMs) {
              const k = (t - 600) / climbMs;
              state.x = to.x + 2;
              state.y = screenBottom + 40 - (screenBottom + 40 - (to.y + 30)) * k;
              state.facing = -1;
              show('climb');
            } else if (t < 900 + climbMs) {
              const k = (t - 600 - climbMs) / 300;
              state.x = to.x + 2 + 26 * k;
              state.y = to.y + 30 - 30 * k - 14 * Math.sin(Math.PI * k);
              show('leap');
            } else if (sink >= 1) arrive(time);
            else show('sit', 'purring');
          } else if (way === 'balloon') {
            // Floating up holding a balloon's string; onto the edge; let go.
            const k = Math.min(1, t / 2400);
            if (t < 2400) {
              state.y = screenBottom + 40 - (screenBottom + 40 - (to.y - 26)) * ease(k);
              state.x = to.x + Math.sin(t / 400) * 6;
              putThing({ kind: 'balloon', x: state.x, y: state.y });
              show('hang', 'purring');
            } else if (t < 2800) {
              const j = (t - 2400) / 400;
              state.y = to.y - 26 + 26 * j;
              state.x = to.x;
              putThing({ kind: 'balloon', x: to.x, y: to.y - 26 - 160 * j, opacity: 1 - j });
              show('leap');
            } else arrive(time);
          } else if (way === 'trampoline') {
            // A trampoline at the bottom of the screen; a bounce, a somersault
            // high up onto the edge.
            const pad = { x: to.x - side * 70, y: screenBottom - 16 };
            const showing = t < 1600 ? Math.min(1, t / 300) : Math.max(0, 1 - (t - 1600) / 400);
            putThing({ kind: 'trampoline', x: pad.x, y: pad.y + (1 - showing) * 40 });
            if (t < 500) {
              state.x = pad.x;
              state.y = pad.y + 40 * (1 - Math.min(1, t / 300));
              show('crouch');
            } else if (t < 1300) {
              const k = (t - 500) / 800;
              state.x = pad.x + (to.x - pad.x) * k;
              state.y = pad.y + (to.y - pad.y) * k - 90 * Math.sin(Math.PI * k);
              state.spin = (side < 0 ? 1 : -1) * 360 * ease(k);
              show('tuck');
            } else if (t < 1900) {
              state.spin = null;
              state.x = to.x;
              state.y = to.y;
              show('cheer');
            } else arrive(time);
          } else if (way === 'parachute') {
            // Down under a parachute, swaying; it folds away on landing.
            const k = Math.min(1, t / 2600);
            state.x = to.x + Math.sin(t / 500) * 10 * (1 - k);
            state.y = screenTop + (to.y - screenTop) * ease(k);
            state.rock = { amp: 8 * (1 - k), freq: 0.9, decay: 0, from: enter.started, origin: 'paws' };
            if (t < 2600) {
              // Its strings meet at its paws.
              putThing({ kind: 'parachute', x: state.x, y: state.y - 2 });
              show('hang', 'purring');
            } else if (t < 3000) {
              const j = (t - 2600) / 400;
              putThing({
                kind: 'parachute',
                x: to.x + 10 * j,
                y: to.y - 2 + 10 * j,
                scale: 1 - 0.6 * j,
                opacity: 1 - j,
              });
              state.rock = null;
              show('crouch');
            } else arrive(time);
          } else if (way === 'abseil') {
            // A rope drops from the top of the screen; it slides down it.
            const drop = Math.min(1, t / 400);
            const ropeLength = (to.y - 40 - screenTop) * drop;
            if (t < 400) {
              putThing({ kind: 'rope', x: to.x, y: screenTop, rope: ropeLength });
              state.y = screenTop - 60;
              show('hang');
            } else if (t < 1800) {
              const k = (t - 400) / 1400;
              putThing({ kind: 'rope', x: to.x, y: screenTop, rope: to.y - 40 - screenTop });
              state.x = to.x;
              state.y = screenTop + (to.y - 40 - screenTop) * ease(k);
              show('hang', 'purring');
            } else if (t < 2100) {
              const k = (t - 1800) / 300;
              state.y = to.y - 40 + 40 * k * k;
              putThing({ kind: 'rope', x: to.x, y: screenTop, rope: (to.y - 40 - screenTop) * (1 - k) });
              show('leap');
            } else arrive(time);
          } else if (way === 'superhero') {
            // Flying in from the side of the screen like a superhero, cape
            // streaming, and landing with paws up.
            const from = { x: side < 0 ? window.scrollX - 80 : window.scrollX + window.innerWidth + 80, y: to.y - 140 };
            if (t < 1300) {
              const k = ease(t / 1300);
              state.x = from.x + (to.x - from.x) * k;
              state.y = from.y + (to.y - from.y) * k - 40 * Math.sin(Math.PI * k);
              state.facing = side < 0 ? 1 : -1;
              show('fly');
            } else if (t < 2000) {
              state.x = to.x;
              state.y = to.y;
              if (!enter.landed) {
                enter.landed = true;
                say('✦');
              }
              show('cheer');
            } else arrive(time);
          } else if (way === 'pogo') {
            // Bouncing up from the bottom of the screen on a pogo stick, in
            // three hops, and hopping off onto the edge.
            const hops = 3;
            const hopMs = 520;
            const stand = 16 * UNIT;
            if (t < hops * hopMs) {
              const hop = Math.floor(t / hopMs);
              const k = (t % hopMs) / hopMs;
              const fromY = screenBottom + 30 - ((screenBottom + 30 - (to.y - stand)) * hop) / hops;
              const toY = screenBottom + 30 - ((screenBottom + 30 - (to.y - stand)) * (hop + 1)) / hops;
              state.x = to.x + side * 20 * (1 - (hop + k) / hops);
              state.y = fromY + (toY - fromY) * k - 70 * Math.sin(Math.PI * k);
              if (hop !== enter.hop) {
                enter.hop = hop;
                say('boing');
              }
              show('pogo');
            } else if (t < hops * hopMs + 350) {
              const k = (t - hops * hopMs) / 350;
              state.x = to.x;
              state.y = to.y - stand + stand * k - 16 * Math.sin(Math.PI * k);
              show('leap');
            } else arrive(time);
          } else if (way === 'bubble') {
            // Floating up inside a big bubble, which pops at the edge.
            if (t < 2600) {
              const k = ease(Math.min(1, t / 2600));
              state.x = to.x + Math.sin(t / 450) * 8;
              state.y = screenBottom + 60 - (screenBottom + 60 - (to.y - 20)) * k;
              putThing({ kind: 'bigbubble', x: state.x, y: state.y - 22, scale: 0.86 + 0.03 * Math.sin(t / 200) });
              show('float');
            } else if (t < 2900) {
              const k = (t - 2600) / 300;
              if (!enter.popped) {
                enter.popped = true;
                say('pop!');
              }
              putThing({ kind: 'bigbubble', x: to.x, y: to.y - 42, scale: 0.9 + 0.4 * k, opacity: 1 - k });
              state.x = to.x;
              state.y = to.y - 20 + 20 * k * k;
              show('float');
            } else arrive(time);
          } else if (way === 'umbrella') {
            // Drifting down from the top under an umbrella, swaying.
            const k = Math.min(1, t / 2800);
            state.x = to.x + Math.sin(t / 520) * 14 * (1 - k);
            state.y = screenTop + (to.y - screenTop) * ease(k);
            state.rock = { amp: 7 * (1 - k), freq: 0.8, decay: 0, from: enter.started };
            if (t < 2800) show('brolly');
            else if (t < 3300) {
              state.rock = null;
              show('sit', 'purring');
            } else arrive(time);
          } else if (enter.craft === 'ufo') {
            // A UFO glides in with it floating in its beam of light, beams it
            // down onto the edge, switches the beam off, and zips away.
            const from = side < 0 ? window.scrollX - 80 : window.scrollX + window.innerWidth + 80;
            const hover = to.y - 160 + Math.sin(t / 320) * 3;
            const ux = from + (to.x - from) * ease(Math.min(1, t / 1700));
            if (t < 1700) {
              putThing({ kind: 'ufo', x: ux, y: hover, rope: 76 });
              state.x = ux;
              state.y = hover + 76 + Math.sin(t / 260) * 2;
              state.facing = side < 0 ? 1 : -1;
              show('float');
            } else if (t < 2800) {
              const feet = hover + 76 + (to.y - hover - 76) * ease((t - 1700) / 1100);
              putThing({ kind: 'ufo', x: to.x, y: hover, rope: feet - hover });
              state.x = to.x;
              state.y = feet;
              show('float');
            } else if (t < 3200) {
              putThing({ kind: 'ufo', x: to.x, y: hover, rope: (to.y - hover) * (1 - (t - 2800) / 400) });
              state.y = to.y;
              if (!enter.landed) {
                enter.landed = true;
                say('✦');
              }
              show('sit', 'purring');
            } else if (t < 3800) {
              const k = (t - 3200) / 600;
              putThing({ kind: 'ufo', x: to.x - side * 420 * k * k, y: hover - 260 * k * k, rope: 0, opacity: 1 - k });
              state.y = to.y;
              show('sit', 'purring');
            } else arrive(time);
          } else {
            // The helicopter flies in with it hanging from its rope, lowers it
            // onto the edge, and flies off.
            const from = side < 0 ? window.scrollX - 80 : window.scrollX + window.innerWidth + 80;
            const fly = Math.min(1, t / 1800);
            const lower = t > 1800 ? Math.min(1, (t - 1800) / 600) : 0;
            const hx = from + (to.x - from) * ease(fly);
            const hy = to.y - 150 + 40 * lower;
            if (t < 2400) {
              putThing({ kind: 'heli', x: hx, y: hy, rope: 40 });
              state.x = hx;
              state.y = hy + 46;
              state.facing = side < 0 ? 1 : -1;
              show('hang', 'purring');
            } else if (t < 2700) {
              const k = (t - 2400) / 300;
              state.y = hy + 46 + (to.y - hy - 46) * k * k;
              putThing({ kind: 'heli', x: hx, y: hy, rope: 40 });
              show('leap');
            } else if (t < 3600) {
              const k = (t - 2700) / 900;
              putThing({ kind: 'heli', x: to.x - side * 300 * k, y: hy - 200 * k, rope: 40, opacity: 1 - k });
              state.y = to.y;
              show('sit', 'purring');
            } else arrive(time);
          }
          break;
        }
        case 'plummet': {
          // Falling, faster and faster, tumbling, off the bottom of the screen;
          // a moment later, back by one of its ways in.
          const seconds = (time - state.started) / 1000;
          state.x = state.from.x;
          state.y = state.from.y + 0.5 * 2600 * seconds * seconds;
          state.spin = (state.facing < 0 ? 1 : -1) * seconds * 540;
          show(state.wasScared ? 'scared' : 'tumble');
          if (state.y - window.scrollY > window.innerHeight + 120) {
            state.spin = null;
            state.goneAt = state.goneAt ?? time;
            if (time - state.goneAt > 900) {
              state.goneAt = null;
              const perches = visiblePerches();
              const perch = perches[perches.length - 1];
              if (perch) {
                state.x = Math.min(
                  window.scrollX + window.innerWidth - MARGIN,
                  Math.max(window.scrollX + MARGIN, state.x),
                );
                state.y = window.scrollY + window.innerHeight + 20;
                comeBack(perch, false, time);
              } else state.mode = 'idle';
            }
          }
          break;
        }
        case 'skid':
          show('skid');
          if (time > state.until) rest(time);
          break;
        case 'trip': {
          // A stumble, teetering; then over it goes, tumbling down.
          show('stumble');
          if (time > state.until) {
            const to = spotOn(state.tripTo, state.x);
            const height = to.y - state.y;
            Object.assign(state, {
              mode: 'fall',
              from: { x: state.x, y: state.y },
              to,
              target: state.tripTo,
              targetSide: 'top',
              started: time,
              duration: Math.min(800, Math.max(360, Math.sqrt((2 * height) / 2600) * 1000)),
              gravity: true,
              tumbling: true,
            });
            state.side = 'top';
          }
          break;
        }
        case 'splat':
          // Landed in a heap, seeing stars; then up, wobbling.
          show('splat');
          if (time > state.until) {
            Object.assign(state, { mode: 'wobble', started: time, until: time + 1100 });
          }
          break;
        case 'wobble':
          // Landed from a height: braced, rocking side to side till it is steady.
          show('balance');
          if (time > state.until) rest(time);
          break;
        case 'land':
          show(onSide() ? 'cling' : 'crouch');
          if (time > state.until) {
            // Landed mid-game of keep-away: the game goes on here.
            if (state.resume?.steps) {
              // A GPU visit only on the tile (or its ring) it set off for, still
              // in view; else it just rests where it landed. Anything else
              // carries on wherever it landed.
              const tile = state.perch?.closest?.('[data-cat-gpu]');
              const onCard = Boolean(tile) && tileInView(tile);
              if (state.resume.onCard ? onCard : true) play(state.resume.steps(), time);
              else rest(time);
            } else if (state.resume === 'laser' && state.game && !onSide()) {
              // Over after the laser dot: the game goes on here.
              state.mode = 'game';
              state.game.hop = null;
            } else if (state.resume === 'tease' && !onSide()) {
              const { teasePace: pace, teaseFrom: from } = state;
              startTease(time);
              Object.assign(state, { teasePace: pace, teaseFrom: from, until: time + 4000 });
              say('♪');
            } else rest(time);
            state.resume = null;
          }
          break;
        case 'rest': {
          show(state.restPose, state.restPose === 'rest' ? feel().restFace : feel().face);
          // On the notes pill with nothing more to do there: back to a panel.
          if (state.perch?.hasAttribute('data-cat-notes') && !state.menu && offNotes(state.perch)) break;
          // The pointer over a chart on its own panel: it stalks the hover dot.
          if (
            state.pointer.chart &&
            !onSide() &&
            state.perch?.contains?.(state.pointer.chart) &&
            time - state.pointer.at < 600 &&
            time > (state.chartRest ?? 0)
          ) {
            state.chartRest = time + 12000;
            play(stalkChart(), time);
            break;
          }
          // The pointer resting still near it a couple of seconds: a slow blink
          // (a cat's "I trust you"), eyes drooping shut and opening again; again
          // a while later if it stays.
          {
            const still = time - state.pointer.at;
            const close = Math.hypot(state.pointer.x - state.x, state.pointer.y - (state.y - 18)) < feel().notice;
            if (!state.menu && close && still > 1800 && still < 60000 && time > (state.blinkAt ?? 0)) {
              state.blinkAt = time + 7000;
              const pose = state.restPose;
              play(
                [
                  { pose, mood: 'drowsy', ms: 450 },
                  { pose, mood: 'asleep', ms: 700 },
                  { pose, mood: 'drowsy', ms: 300 },
                  {
                    pose,
                    mood: 'purring',
                    ms: 900,
                    start: () => {
                      cheerUp(JOY.blink);
                      saw('pet:blink');
                      if (Math.random() < 0.4) say('heart');
                    },
                  },
                ],
                time,
              );
              break;
            }
          }
          // The pointer still a long while: it dozes off (one roll for each
          // still spell; full, it hardly ever does).
          if (time - state.pointer.at > feel().doze && !onSide()) {
            if (state.dozeRoll !== state.pointer.at) {
              state.dozeRoll = state.pointer.at;
              state.dozesOff = Math.random() < (feel().dozes ?? 1);
            }
            if (state.dozesOff) {
              fallAsleep(time);
              break;
            }
          }
          if (time < state.until || state.menu) break;
          if (state.perch?.hasAttribute('data-cat-gpu')) {
            leapTo(otherPerch() ?? visiblePerches()[0]);
            break;
          }
          // Low on energy, it often just dozes on where it is.
          if (Math.random() > feel().energy + 0.35) {
            rest(time);
            break;
          }
          const bored = time - state.lastPlay > BORED_AFTER;
          const perch = state.perch;
          if (bored && Math.random() < 0.3) {
            // Nobody has played for a while: it knocks on its panel.
            state.mode = 'knock';
            state.until = time + 1400;
            state.knocks = [time + 300, time + 800];
          } else if (onSide()) {
            // On a side: back up onto the top edge, a climb, or off to another panel.
            const roll = Math.random();
            if (roll < 0.45) leapTo(perch, null, HOP_MS);
            else if (roll < 0.85) stroll();
            else leapTo(otherPerch() ?? perch, null, LEAP_MS);
          } else decide(time);
          break;
        }
        case 'walk': {
          // Along the top, or climbing up or down a side.
          const at = onSide() ? state.y : state.x;
          const pace = state.running ? CHASE * 1.7 : STROLL * feel().pace;
          const step = pace * dt * Math.sign(state.goal - at);
          const next = Math.abs(state.goal - at) <= Math.abs(step) ? state.goal : at + step;
          if (onSide()) {
            state.y = next;
            const up = step < 0;
            state.facing = state.side === 'left' ? (up ? 1 : -1) : up ? -1 : 1;
          } else {
            state.x = next;
            state.facing = step < 0 ? -1 : 1;
          }
          along();
          show(
            onSide() ? 'climb' : state.running ? (Math.floor(time / 120) % 2 ? 'run' : 'run2') : 'walk',
            feel().face,
          );
          // A mishap partway along: a trip (if there is a panel below to fall
          // onto), a sniff, a fright, a pounce.
          const mishap = state.mishap;
          if (mishap?.at != null && !onSide()) {
            const travelled = Math.abs(state.x - state.walkFrom) / Math.max(1, Math.abs(state.goal - state.walkFrom));
            if (travelled >= mishap.at) {
              state.mishap = null;
              if (mishap.kind === 'trip') {
                const below = perchBelow(state.x, state.y);
                if (below) {
                  Object.assign(state, { mode: 'trip', until: time + 520, tripTo: below });
                  say('!');
                  saw('mishap:trip');
                  break;
                }
              } else {
                state.running = false;
                play(mishaps[mishap.kind](state.goal), time);
                break;
              }
            }
          }
          if (next === state.goal) {
            // A run ends in a skid; full of beans, it may set straight off
            // again somewhere else.
            if (state.running && state.mishap?.kind === 'slip') {
              Object.assign(state, {
                mode: 'slip',
                started: time,
                slipFrom: state.x,
                slipDir: state.facing,
                slipSaid: false,
                running: false,
                mishap: null,
              });
              saw('mishap:slip');
            } else if (state.running) Object.assign(state, { mode: 'skid', until: time + 380, running: false });
            else if (Math.random() < 0.5 * feel().energy) stroll();
            else rest(time);
          }
          break;
        }
        case 'chase': {
          // Playing with the pointer: trotting after it along its panel, batting
          // at it with quick swipes when close, purring when it rests on the cat.
          const dx = state.pointer.x - state.x;
          const distance = Math.hypot(dx, state.pointer.y - (state.y - 18));
          // It turns to the pointer only once it is clearly to one side.
          if (Math.abs(dx) > 18) state.facing = dx < 0 ? -1 : 1;
          if (distance < 40) {
            show('sit', 'purring');
            if (time > (state.purredAt ?? 0) + 1600) {
              state.purredAt = time;
              say('prr');
            }
          } else if (Math.abs(dx) < 90 || !state.perch) {
            show(Math.floor(time / 240) % 2 ? 'reach' : 'sit');
          } else {
            const edge = page(state.perch.getBoundingClientRect());
            const next = Math.min(
              edge.right - MARGIN,
              Math.max(edge.left + MARGIN, state.x + CHASE * dt * Math.sign(dx)),
            );
            show(next === state.x ? 'reach' : 'walk');
            state.x = next;
            along();
          }
          if (pointerNear) state.lastNear = time;
          if (time > state.until || time - (state.lastNear ?? time) > 1000) {
            state.chaseRest = time + 3000;
            rest(time, [4, 10]);
          }
          break;
        }
        case 'spring':
          show(onSide() ? 'cling' : 'crouch');
          if (time > state.until) {
            const [perch, at, duration, side] = state.spring;
            const from = state.perch;
            state.mode = 'leaping';
            state.perch = null;
            leapTo(perch, at, duration, side);
            // (Where it sprang from, for the leap: see place.)
            state.leapFrom = from;
          }
          break;
        case 'crouch':
          show('crouch');
          if (time > state.until) state.mode = 'toy';
          break;
        case 'toy': {
          // The ball rolls ahead; the cat runs after it and pounces.
          const ball = state.ball;
          const roll = Math.min(1, (time - ball.at) / 1600);
          const x = ball.x + (ball.to - ball.x) * (1 - (1 - roll) ** 2);
          putThing({ kind: 'yarn', x, y: state.y, rotate: x * 5 });
          const gap = x - state.x;
          if (Math.abs(gap) > 26) state.x += Math.sign(gap) * Math.min(Math.abs(gap) - 26, CHASE * 1.6 * dt);
          along();
          show('walk');
          if (roll >= 1 && Math.abs(x - state.x) <= 27) {
            putThing(null);
            sit(time, 'purring', 1800);
            say('heart');
          }
          break;
        }
        case 'knock':
          show(onSide() ? 'cling' : 'reach');
          if (state.knocks.length && time > state.knocks[0]) {
            state.knocks.shift();
            if (!quietRef.current) shake(state.perch);
          }
          if (time > state.until) {
            state.lastPlay = time - BORED_AFTER / 2;
            rest(time);
          }
          break;
        case 'act':
          show(state.act.pose, state.act.mood);
          if (time > state.until && !state.menu) rest(time);
          break;
        case 'zoom': {
          // The zoomies: a dash to the far end of its panel and partway back.
          const goal = state.zooms[0];
          const step = CHASE * 2.6 * dt * Math.sign(goal - state.x);
          state.x = Math.abs(goal - state.x) <= Math.abs(step) ? goal : state.x + step;
          state.facing = step < 0 ? -1 : 1;
          along();
          show('walk', 'content');
          if (state.x === goal) state.zooms.shift();
          if (!state.zooms.length) sit(time, 'purring', 1600);
          break;
        }
        case 'tease': {
          // Keep-away: whenever the pointer comes close it scampers off along
          // its edge, glancing back between dashes; cornered at an end, it
          // hops clean over the pointer to the far side, and now and then it
          // bolts to another panel nearby, away from the pointer, and carries
          // on the game there.
          const dx = state.pointer.x - state.x;
          const close =
            time - state.pointer.at < 1500 && Math.abs(dx) < 110 && Math.abs(state.pointer.y - (state.y - 20)) < 120;
          if (close) state.lastNear = time;
          const edge = edgeNow();
          if (state.dart) {
            const k = Math.min(1, (time - state.dart.started) / 520);
            state.x = state.dart.from + (state.dart.to - state.dart.from) * k;
            state.lift = 48 * Math.sin(Math.PI * k);
            show('leap');
            if (k >= 1) {
              state.dart = null;
              state.lift = 0;
            }
          } else if (close) {
            const away = dx > 0 ? -1 : 1;
            const next = state.x + away * CHASE * 1.6 * teasePace(time) * dt;
            const cornered = next < edge.left + MARGIN || next > edge.right - MARGIN;
            // Very close, or cornered: a chance to bolt to another panel.
            const pressed = Math.hypot(dx, state.pointer.y - (state.y - 20)) < 60;
            let bolt = null;
            if ((cornered || pressed) && time > (state.boltRoll ?? 0)) {
              state.boltRoll = time + 1500;
              if (Math.random() < (cornered ? 0.5 : 0.35) * Math.min(1, teasePace(time))) bolt = escapePerch();
            }
            if (bolt) {
              state.resume = 'tease';
              leapTo(bolt, state.x);
            } else if (cornered) {
              const to = onEdge(state.pointer.x - away * 170);
              state.dart = { from: state.x, to, started: time };
              state.facing = to < state.x ? -1 : 1;
            } else {
              state.x = next;
              state.facing = away;
              show('walk', 'purring');
            }
          } else {
            state.facing = dx < 0 ? -1 : 1;
            show('sit', 'purring');
          }
          along();
          if (!state.dart && (time > state.until || time - state.lastNear > 2500)) {
            state.chaseRest = time + 3000;
            sit(time, 'purring', 1200);
            say('heart');
          }
          break;
        }
        case 'script': {
          // One of its doings, a step at a time.
          let step = state.step;
          if (!step || step.done) {
            step = state.steps.shift();
            if (!step) {
              rest(time);
              break;
            }
            step.started = time;
            state.step = step;
            state.rock = step.rock ? { ...step.rock, from: time } : null;
            state.lift = 0;
            step.start?.(step, time);
            if (step.to !== undefined && typeof step.to === 'number' && !step.frame) step.goal = onEdge(step.to);
          }
          const k = step.ms ? Math.min(1, (time - step.started) / step.ms) : 0;
          if (step.goal !== undefined) {
            // Walking in to a spot.
            const pace = (step.speed ?? STROLL * 1.5) * dt * Math.sign(step.goal - state.x);
            state.x = Math.abs(step.goal - state.x) <= Math.abs(pace) ? step.goal : state.x + pace;
            if (pace) state.facing = pace < 0 ? -1 : 1;
            if (state.x === step.goal) step.done = true;
          } else {
            step.frame?.(step, time, k);
            if (k >= 1) step.done = true;
          }
          along();
          show(typeof step.pose === 'function' ? step.pose(time) : (step.pose ?? 'walk'), step.mood ?? feel().face);
          break;
        }
        case 'follow': {
          // After the pointer: towards a spot just behind it and below it,
          // eased, at no more than its way's pace, kept in view; bobbing,
          // and (side on, or on a broom or a croissant) nose up climbing and
          // down diving.
          const follow = state.follow;
          const way = FOLLOWS[follow.way];
          if (time > follow.until) {
            endFollow();
            break;
          }
          const px = state.pointer.cx != null ? state.pointer.cx + window.scrollX : follow.x;
          const py = state.pointer.cy != null ? state.pointer.cy + window.scrollY : follow.y;
          const left = window.scrollX + 50;
          const right = window.scrollX + window.innerWidth - 50;
          const top = window.scrollY + topClear() + 40;
          const bottom = window.scrollY + window.innerHeight - 20;
          const tx = Math.min(right, Math.max(left, px + (follow.x < px ? -48 : 48)));
          const ty = Math.min(bottom, Math.max(top, py + 46));
          let wx = (tx - follow.x) * 2.4;
          let wy = (ty - follow.y) * 2.4;
          const fast = Math.hypot(wx, wy);
          if (fast > way.speed) {
            wx *= way.speed / fast;
            wy *= way.speed / fast;
          }
          const ease = Math.min(1, dt * 3);
          follow.vx += (wx - follow.vx) * ease;
          follow.vy += (wy - follow.vy) * ease;
          follow.x += follow.vx * dt;
          follow.y += follow.vy * dt;
          if (Math.abs(follow.vx) > 25) state.facing = follow.vx < 0 ? -1 : 1;
          const t = time - follow.from;
          state.x = follow.x + (follow.way === 'balloon' ? Math.sin(t / 700) * 5 : 0);
          state.y = follow.y + Math.sin((t / way.rate) * 2 * Math.PI) * way.bob;
          state.tilt = ['glide', 'paddle', 'broom', 'croissant'].includes(follow.way)
            ? Math.max(-14, Math.min(14, -follow.vy * 0.06))
            : 0;
          if (follow.way === 'croissant') {
            putThing({ kind: 'flycroissant', x: state.x, y: state.y, flip: state.facing < 0 ? 1 : -1 });
            show('rest', 'purring');
          } else if (follow.way === 'balloon') {
            putThing({ kind: 'balloon', x: state.x, y: state.y });
            show('hang', 'purring');
          } else if (follow.way === 'paddle') show(Math.floor(t / 260) % 2 ? 'paddle' : 'paddle2');
          else show(follow.way);
          if (Math.floor(t / 2600) !== follow.beat) {
            follow.beat = Math.floor(t / 2600);
            if (follow.beat) say(follow.way === 'paddle' ? '~' : '♪');
          }
          break;
        }
        case 'sit':
          show('sit', state.mood);
          if (time > state.until && !state.menu) rest(time);
          break;
        case 'pet':
          show('sit', 'purring');
          break;
        case 'roll':
          show('roll', 'purring');
          if (time > state.until) leapTo(otherPerch() ?? state.perch);
          break;
        case 'sleep':
          show('sleep');
          if (Math.random() < 0.004) say('z');
          // Slept her fill: up, still drowsy (with a stretch).
          if (time > state.until) sit(time, 'drowsy', 1200);
          break;
        case 'held': {
          // Carried by the scruff: it swings like a pendulum with the
          // pointer's sway, its body trailing behind and swinging back when
          // the pointer stops; shaken hard, it flails.
          const vx = dt ? (state.x - (state.heldX ?? state.x)) / dt : 0;
          state.heldX = state.x;
          state.heldVx = 0.7 * (state.heldVx ?? 0) + 0.3 * vx;
          const lean = Math.max(-40, Math.min(40, state.heldVx * 0.05));
          state.swingV = (state.swingV ?? 0) + (90 * (lean - (state.swing ?? 0)) - 7 * (state.swingV ?? 0)) * dt;
          state.swing = Math.max(-55, Math.min(55, (state.swing ?? 0) + state.swingV * dt));
          const wild = Math.abs(state.swing) > 22 || Math.abs(state.swingV) > 160;
          show(state.scared || wild ? 'scared' : 'held');
          break;
        }
        case 'home':
          break;
        case 'emerge': {
          // Keeping to the name as the header settles while the page loads.
          const name = document.querySelector('[data-cat-home]')?.getBoundingClientRect();
          if (name) {
            state.x = name.left + window.scrollX + name.width / 2;
            state.y = name.top + window.scrollY + 2;
          }
          // The pointer near: it raises its head higher and puts its paws up on
          // the name; gone again, it sinks back to just its eyes.
          const near = Math.hypot(state.pointer.x - state.x, state.pointer.y - (state.y - 16)) < 70;
          if (near) state.peeked = true;
          show(near ? 'peek' : state.peeked ? 'lurk' : 'emerge');
          break;
        }
        case 'game': {
          const game = state.game;
          const edge = edgeNow();
          // A hop under way.
          if (game.hop) {
            const hop = game.hop;
            const k = Math.min(1, (time - hop.started) / hop.ms);
            state.x = hop.from + (hop.to - hop.from) * k;
            state.lift = hop.height * Math.sin(Math.PI * k);
            show(hop.pose, 'hungry');
            if (!hop.peaked && k >= 0.5) {
              hop.peaked = true;
              hop.peak?.();
            }
            if (k >= 1) {
              game.hop = null;
              state.lift = 0;
              hop.land?.();
            }
          }
          const busy = !!game.hop || time < (game.holdUntil ?? 0);
          if (game.kind === 'laser') {
            // The dot follows the pointer onto the top edge of whichever card
            // it is over; she runs after it and pounces, and when it is on
            // another card's edge, she leaps over there and carries on.
            aimLaser(time);
            const dot = game.dot;
            if (dot.perch !== state.perch && dot.perch.isConnected && !busy && time > (game.leaptAt ?? 0)) {
              game.leaptAt = time + 900;
              game.until += 1500;
              state.resume = 'laser';
              state.lift = 0;
              leapTo(dot.perch, dot.x - Math.sign(dot.x - state.x || 1) * 36);
              break;
            }
            const dx = dot.x - state.x;
            if (busy) {
              // in the air
            } else if (Math.abs(dx) > 70) {
              state.x += Math.sign(dx) * CHASE * 1.9 * dt;
              state.facing = dx < 0 ? -1 : 1;
              show('walk', 'hungry');
            } else if (Math.abs(dx) > 10 && time > game.nextPounce) {
              gameHop(onEdge(dot.x), 22, 380, 'reach');
              game.nextPounce = time + 650;
            } else show('crouch');
          } else if (game.kind === 'feather') {
            // The feather swings from the pointer; it stays under it, bats at
            // it, and leaps up after it when it dangles just overhead.
            const px = state.pointer.x;
            game.swing = Math.max(-35, Math.min(35, game.swing * 0.88 - (px - (game.lastX ?? px)) * 2.2));
            game.lastX = px;
            putThing({ kind: 'feather', x: px, y: state.pointer.y, rotate: game.swing });
            const dx = onEdge(px) - state.x;
            const above = state.y - (state.pointer.y + 44);
            if (busy) {
              // in the air
            } else if (Math.abs(dx) > 26) {
              state.x += Math.sign(dx) * CHASE * 1.3 * dt;
              state.facing = dx < 0 ? -1 : 1;
              show('walk', 'hungry');
            } else if (above > 30 && above < 110 && time > game.nextPounce) {
              gameHop(state.x, Math.min(60, above - 10), 480, 'reach');
              game.nextPounce = time + 900;
            } else if (above <= 30 && above > -40) show(Math.floor(time / 220) % 2 ? 'reach' : 'sit', 'hungry');
            else show('sit', 'hungry');
          } else if (game.kind === 'mouse') {
            // The mouse zips to and fro along the edge, stopping now and then;
            // it stalks it and pounces, and three catches will do.
            const mouse = game.mouse;
            if (time > mouse.pauseUntil) {
              mouse.x += mouse.dir * mouse.speed * dt;
              if (mouse.x < edge.left + 24) ((mouse.x = edge.left + 24), (mouse.dir = 1));
              if (mouse.x > edge.right - 24) ((mouse.x = edge.right - 24), (mouse.dir = -1));
              if (Math.random() < 0.012) {
                mouse.pauseUntil = time + random(400, 1200);
                mouse.speed = random(70, 170);
                if (Math.random() < 0.4) mouse.dir *= -1;
              }
            }
            putThing({ kind: 'mouse', x: mouse.x, y: state.y, flip: mouse.dir });
            const dx = mouse.x - state.x;
            if (busy) {
              if (!game.hop) show('reach', 'purring');
            } else if (Math.abs(dx) < 85 && time > game.nextPounce) {
              const lead = time > mouse.pauseUntil ? mouse.dir * mouse.speed * 0.35 : 0;
              gameHop(onEdge(mouse.x + lead), 26, 420, 'leap', {
                land: () => {
                  const now = performance.now();
                  if (Math.abs(mouse.x - state.x) < 28) {
                    game.catches += 1;
                    say('!');
                    game.holdUntil = now + 900;
                    mouse.x = onEdge(state.x + state.facing * 18);
                    mouse.pauseUntil = now + 900;
                    mouse.dir = state.facing;
                    mouse.speed = 210;
                    if (game.catches >= 3) game.until = now + 900;
                  }
                },
              });
              game.nextPounce = time + 900;
            } else {
              state.x += Math.sign(dx) * STROLL * 1.9 * dt;
              state.facing = dx < 0 ? -1 : 1;
              show('walk', 'hungry');
            }
          } else {
            // Bubbles drift up about it; it leaps to pop the ones just overhead.
            if (game.spawned < 8 && time > (game.nextSpawn ?? 0)) {
              game.bubbles.push({
                id: game.spawned,
                x: onEdge(state.x + random(-90, 90)),
                y: state.y - 8,
                rise: random(16, 26),
                phase: Math.random() * 6,
              });
              game.spawned += 1;
              game.nextSpawn = time + random(700, 1300);
            }
            for (const bubble of game.bubbles) {
              bubble.y -= bubble.rise * dt;
              bubble.x += Math.sin(time / 500 + bubble.phase) * 10 * dt;
            }
            game.bubbles = game.bubbles.filter((bubble) => !bubble.popped && bubble.y > state.y - 240);
            putThing(
              game.bubbles.map((bubble) => ({
                kind: 'bubble',
                id: bubble.id,
                x: bubble.x,
                y: bubble.y,
                opacity: bubble.y < state.y - 200 ? 0.4 : 1,
              })),
            );
            const target = game.bubbles
              .filter((bubble) => state.y - bubble.y > 40 && state.y - bubble.y < 150)
              .sort((a, b) => Math.abs(a.x - state.x) - Math.abs(b.x - state.x))[0];
            if (busy) {
              // in the air
            } else if (target && Math.abs(target.x - state.x) > 14) {
              const dx = target.x - state.x;
              state.x += Math.sign(dx) * CHASE * 1.2 * dt;
              state.facing = dx < 0 ? -1 : 1;
              show('walk', 'hungry');
            } else if (target && time > game.nextPounce) {
              gameHop(state.x, Math.max(15, Math.min(70, state.y - target.y - 40)), 480, 'reach', {
                peak: () => {
                  const head = state.y - state.lift - 40;
                  const popped = game.bubbles.find(
                    (bubble) => Math.abs(bubble.x - state.x) < 30 && Math.abs(bubble.y - head) < 34,
                  );
                  if (popped) {
                    popped.popped = true;
                    say('pop!');
                  }
                },
              });
              game.nextPounce = time + 700;
            } else show('sit', 'hungry');
            if (game.spawned >= 8 && !game.bubbles.length) game.until = 0;
          }
          state.x = onEdge(state.x);
          along();
          if (time > game.until && !game.hop) endGame(time);
          break;
        }
        case 'popout':
          // Clicked while peeking: up it pops, paws on the name, and off it
          // goes, to a spot picked at random on any panel in view (a longer
          // leap, the further it is).
          show('peek');
          if (time > state.until) {
            const perches = visiblePerches();
            const perch = perches[Math.floor(Math.random() * perches.length)];
            if (perch) {
              const rect = perch.getBoundingClientRect();
              const x = window.scrollX + random(rect.left + MARGIN, Math.max(rect.left + MARGIN, rect.right - MARGIN));
              const far = Math.hypot(x - state.x, window.scrollY + rect.top - state.y);
              leapTo(perch, x, Math.min(1150, Math.max(LEAP_MS, far * 1.1)));
            } else state.mode = 'idle';
          }
          break;
        default:
          // Not out yet: waits for a panel to come into view.
          if (time > state.until) {
            state.until = time + 1000;
            leapTo(visiblePerches()[0]);
          }
          break;
      }
      place();
    });
    return () => {
      cancelAnimationFrame(frame);
      stopOilRun();
      for (const tile of [state.steal?.tile, state.stolen?.tile]) {
        if (tile) Object.assign(tile.style, { transform: '', transformOrigin: '' });
      }
      clearTimeout(state.clickTimer);
      clearTimeout(state.menuTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('bakery-cat-treat', onTreat);
      window.removeEventListener('bakery-cat-toy', onToy);
      window.removeEventListener('bakery-cat-do', onDo);
      window.removeEventListener('bakery-page-changed', onPageChanged);
      popupWatch.disconnect();
      window.removeEventListener(JOY_EVENT, onJoy);
      window.removeEventListener('pointerdown', onPressAway);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keydown', onTyped);
      document.removeEventListener('dblclick', onDoubleClick);
      document.removeEventListener('click', onTabClick, true);
      document.removeEventListener('selectionchange', onSelection);
      window.removeEventListener('scroll', onScrollHard);
      window.removeEventListener('bakery-cat-gift-taken', onGiftTaken);
      clearTimeout(state.selectTimer);
    };
  }, []);

  const Pose = look.pose ? (ROAM_POSES[look.pose] ?? ROAM_POSES.rest) : null;
  const Previous = look.previous ? ROAM_POSES[look.previous] : null;
  // A drawing faces left; mirrored about its feet (x = 60) to face right.
  const mirror = (flip) => (flip < 0 ? 'translate(120 0) scale(-1 1)' : undefined);
  const motion =
    look.pose === 'roll'
      ? 'motion-safe:animate-cat-roll'
      : look.pose === 'tumble'
        ? 'motion-safe:animate-cat-tumble'
        : look.pose === 'rest'
          ? 'motion-safe:animate-cat-breathe'
          : '';
  const poseBox = { transformBox: 'fill-box', transformOrigin: 'center bottom' };
  return createPortal(
    // Above the page's panels (their popups go to z-10) but under its floating
    // bars: the navigation bar (z-50), the notes pill and the range rail (z-30).
    // (Over it, up on the bakery's oven or on her way there: see place.)
    // (data-cat-layer: a click on her is not one outside the bakery's card.)
    <div
      ref={layer}
      data-cat-layer
      className="pointer-events-none absolute left-0 top-0 z-20"
      style={{ width: 0, height: 0 }}
    >
      {/* The thing it is playing with, behind it. */}
      {things
        .filter((item) => !item.front)
        .map((item, index) => (
          <CatThing key={item.id ?? `${item.kind}-${index}`} {...item} />
        ))}
      <div ref={box} className="absolute left-0 top-0" style={{ width: WIDTH, height: HEIGHT }}>
        <svg
          viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`}
          width={WIDTH}
          height={HEIGHT}
          data-cat
          data-pose={look.pose}
          aria-hidden="true"
          className="pointer-events-auto touch-none overflow-visible"
          style={{ opacity: leaving ? 0 : 1, transition: `opacity ${LEAP_MS}ms ease-in` }}
          onPointerDown={(event) => cat.current?.onPointerDown?.(event)}
        >
          {/* Tilted along a leap; rolling over or breathing; the last pose
              fading as the new one (or the same, turned round) comes in. */}
          <OutfitContext.Provider value={outfit}>
          <g ref={tilt} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <g
              className={motion}
              style={{
                ...poseBox,
                transformOrigin: look.pose === 'roll' || look.pose === 'tumble' ? 'center' : 'center bottom',
              }}
            >
              {Previous && (
                <g key={`out-${look.change}`} className="motion-safe:animate-cat-pose-out opacity-0">
                  <g transform={mirror(look.previousFlip)}>
                    <Previous
                      mood={look.previousMood}
                      morph={look.previousMorph && { ...look.previousMorph, settled: true }}
                    />
                  </g>
                </g>
              )}
              <g key={`in-${look.change}`} className="motion-safe:animate-cat-pose-in">
                <g transform={mirror(look.flip)}>{Pose && <Pose mood={look.mood} morph={look.morph} />}</g>
              </g>
            </g>
          </g>
          </OutfitContext.Provider>
        </svg>
        {/* A toy it wishes for, in a thought bubble: clicked, the game is on.
            Left unclicked a few seconds, it gives a wiggle now and then. */}
        {wish && (
          <button
            type="button"
            onClick={() => cat.current?.takeWish?.()}
            aria-label={`Mochi would love to ${WISHES[wish]}. Go on.`}
            className="pointer-events-auto absolute rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20 motion-safe:animate-cat-nudge"
            style={{ left: BUBBLE.x - 4, bottom: HEIGHT - BUBBLE.y - 3, transformOrigin: '4px 39px' }}
          >
            <svg
              viewBox="0 0 50 42"
              width="50"
              height="42"
              className="overflow-visible motion-safe:animate-cat-step"
              style={{ animationDuration: '2.4s' }}
            >
              {/* Growing out from beside its ear: a little circle, a bigger one, the cloud. */}
              <circle
                cx="4"
                cy="39"
                r="2"
                fill="white"
                stroke="#D5DCE6"
                strokeWidth="1"
                className="motion-safe:animate-cat-pose-in"
              />
              <circle
                cx="10"
                cy="33"
                r="3"
                fill="white"
                stroke="#D5DCE6"
                strokeWidth="1"
                className="motion-safe:animate-cat-pose-in"
                style={{ animationDelay: '0.15s' }}
              />
              <g className="motion-safe:animate-cat-pose-in" style={{ animationDelay: '0.3s' }}>
                <path
                  d="M17 29c-6 0-8-7-3-10-2-6 5-11 10-8 3-6 13-6 15 0 6-1 10 5 7 10 4 4 0 10-5 9-3 4-10 4-13 1-3 2-8 1-11-2z"
                  fill="white"
                  stroke="#D5DCE6"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
                <g transform="translate(31 19.5) scale(0.95)">
                  <ToyIcon kind={wish} />
                </g>
              </g>
            </svg>
          </button>
        )}
        {/* What can be done for it, popped up above it by a click. */}
        {menu === 'dot' && (
          <button
            type="button"
            ref={menuBox}
            aria-label="What to do with Mochi"
            onClick={() => cat.current?.expandMenu?.()}
            className="pointer-events-auto absolute bottom-full left-1/2 mb-1.5 flex h-4 -translate-x-1/2 items-center gap-[3px] rounded-full border border-border-light bg-white px-1.5 shadow-sm transition-colors hover:bg-[#F1F3F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20 motion-safe:animate-cat-pose-in"
          >
            {[0, 1, 2].map((dot) => (
              <span key={dot} className="h-[3px] w-[3px] rounded-full bg-[#A3ADBB]" />
            ))}
          </button>
        )}
        {menu === 'open' && (
          <div
            ref={menuBox}
            role="menu"
            aria-label="Mochi"
            onPointerEnter={() => cat.current?.holdMenu?.(true)}
            onPointerLeave={() => cat.current?.holdMenu?.(false)}
            className="pointer-events-auto absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 items-center gap-0.5 whitespace-nowrap rounded-full border border-border-light bg-white p-0.5 shadow-sm motion-safe:animate-cat-pose-in"
          >
            {OPTIONS.map(([kind, label]) => (
              <button
                key={kind}
                type="button"
                role="menuitem"
                onClick={() => cat.current?.choose?.(kind)}
                className="rounded-full px-2.5 py-0.5 font-mono text-[11px] text-data-grey transition-colors hover:bg-[#F1F3F6] hover:text-inkwell focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20"
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {effects.map(({ id, kind }) => (
          <span
            aria-hidden="true"
            key={id}
            className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] text-[#C98A50] motion-safe:animate-cat-float"
            style={NOTE_COLORS[kind] ? { color: NOTE_COLORS[kind][id.length % NOTE_COLORS[kind].length] } : undefined}
          >
            {kind === 'heart' ? (
              <svg viewBox="-5 -1 10 9" className="h-3.5 w-3.5">
                <path
                  d="M0 1.6c-1.6-2.4-5-1.2-4.2 1.4C-3.6 5 0 7 0 7s3.6-2 4.2-4c.8-2.6-2.6-3.8-4.2-1.4z"
                  fill="#F08A93"
                />
              </svg>
            ) : kind === 'flash' ? (
              <svg viewBox="-20 -20 40 40" className="absolute -left-8 top-2 -z-10 h-16 w-16">
                <circle r="15" fill="#FFF7DA" opacity="0.55" />
                <path
                  d="M0-19v7M0 12v7M-19 0h7M12 0h7M-13-13l5 5M8 8l5 5M13-13l-5 5M-8 8l-5 5"
                  stroke="#F2C94C"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            ) : kind === 'page' ? (
              // A new page in her scrapbook: a little open book.
              <svg viewBox="-9 -7 18 13" className="h-3.5 w-[18px]">
                <path
                  d="M0-3.2C-2.4-5-5.6-5.2-8-4v8.4c2.4-1.2 5.6-1 8 .8 2.4-1.8 5.6-2 8-.8V-4c-2.4-1.2-5.6-1-8 .8z"
                  fill="#FFF8EE"
                  stroke="#C49A62"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
                <path
                  d="M0-3.2v8.4M-5.6-1.6l3 .4M-5.6.6l3 .4M2.6-1.2l3-.4M2.6 1l3-.4"
                  stroke="#D9B98A"
                  strokeWidth="0.8"
                />
              </svg>
            ) : kind === 'z' ? (
              <span className="font-semibold text-[#A3B1C6]">z</span>
            ) : kind === 'treat' ? (
              <svg viewBox="-4 -3 9 6" className="h-3 w-4">
                <path
                  d="M-3 0q3-2.6 6 0q-3 2.6-6 0zm6 0 1.8-1.6v3.2z"
                  fill="#E39A55"
                  stroke="#C47A35"
                  strokeWidth="0.5"
                />
              </svg>
            ) : (
              kind
            )}
          </span>
        ))}
      </div>
      {/* A helicopter bringing back a GPU's tile it stole. */}
      {heli && <CatThing {...heli} />}
      {/* A present it left by the notes pill, till picked up. */}
      {gift && (
        <button
          type="button"
          aria-label={`A present from your cat: ${GIFTS[gift.kind] ?? 'something'}. Pick it up.`}
          title={`A present: ${GIFTS[gift.kind] ?? 'something'}`}
          className="pointer-events-auto fixed rounded-md transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20 motion-safe:animate-cat-pose-in"
          style={{ right: gift.right, bottom: gift.bottom, width: 30, height: 22 }}
          onClick={() => {
            keepMoment(`gift:${gift.kind}`);
            store(GIFT_KEY, null);
            setGift(null);
            window.dispatchEvent(new CustomEvent('bakery-cat-gift-taken'));
          }}
        >
          <svg viewBox="-11 -14 22 15" width="30" height="22" aria-hidden="true">
            <Gift variant={gift.kind} />
          </svg>
        </button>
      )}
      {/* Things in front of it: cracks and shards of the glass it is trapped behind. */}
      {things
        .filter((item) => item.front)
        .map((item, index) => (
          <CatThing key={item.id ?? `${item.kind}-${index}`} {...item} />
        ))}
    </div>,
    document.body,
  );
}

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MORPH_MS, ROAM_POSES, moodOf } from './BakeryCat';
import { CatThing, TOYS, ToyIcon } from './CatThings';

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
const SIDE_CLEAR = 16;
// Paces, in pixels a second, and how long things take, in milliseconds.
const STROLL = 36;
const CHASE = 90;
const LEAP_MS = 720;
const HOP_MS = 480;
const DROP_MS = 380;
const SPRING_MS = 260;
// How high above what is under it it can be carried before it takes fright.
const SCARED_AT = 140;
const SETTLE_MS = 1200;
const DOZE_AFTER = 3 * 60 * 1000;
// How it carries itself on what it has eaten lately: its energy (the better
// fed, the livelier: the more often it is up and strolling about, climbing and
// hopping between panels rather than dozing on where it lies), its pace, its
// face, how soon it dozes off, how long it rests between outings, how readily
// it leaps away, how far off it notices the pointer, how likely it is to play
// keep-away with it, and what else it gets up to now and then (a chance each
// time it stirs on a panel's top edge). Starving, it drags itself about, begs
// and naps, too tired for games; well fed, it kneads the panel ("makes
// biscuits"), gets the zoomies and plays hard to get; full, it is at its
// liveliest, though it still lolls belly-up and grooms.
const FEELS = {
  napping: {
    energy: 0.15,
    pace: 0.55,
    face: 'hungry',
    restFace: 'hungry',
    doze: 40 * 1000,
    rest: [14, 26],
    leap: 0.35,
    notice: 150,
    tease: 0,
    begs: true,
    acts: { sleep: 0.45, beg: 0.25 },
  },
  hungry: {
    energy: 0.4,
    pace: 0.8,
    face: 'hungry',
    restFace: 'content',
    doze: DOZE_AFTER,
    rest: [9, 18],
    leap: 0.8,
    notice: 170,
    tease: 0.08,
    begs: true,
    acts: { beg: 0.25, groom: 0.05 },
  },
  content: {
    energy: 0.65,
    pace: 1,
    face: 'content',
    restFace: 'purring',
    doze: DOZE_AFTER,
    rest: [6, 13],
    leap: 1,
    notice: 170,
    tease: 0.2,
    acts: { groom: 0.15, knead: 0.05 },
  },
  purring: {
    energy: 0.85,
    pace: 1.2,
    face: 'content',
    restFace: 'purring',
    doze: DOZE_AFTER,
    rest: [4, 9],
    leap: 1.1,
    notice: 210,
    tease: 0.4,
    acts: { knead: 0.2, zoom: 0.14, groom: 0.1 },
  },
  loaf: {
    energy: 1,
    pace: 1.25,
    face: 'purring',
    restFace: 'purring',
    doze: DOZE_AFTER,
    rest: [3, 8],
    leap: 1.2,
    notice: 170,
    tease: 0.15,
    acts: { belly: 0.22, groom: 0.18, knead: 0.12 },
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

// Poses it swaps between too quickly to blend: batting at the pointer.
const SWIPE = new Set(['sit', 'reach']);
// And the moves of a dance, which change crisply on the beat.
const DANCE = new Set(['cheer', 'wave', 'walk', 'sit']);

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
    return rect.width > 2 * MARGIN + 40 && rect.top > TOP_CLEAR && rect.top < window.innerHeight - 24;
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
  if (side === 'top') {
    const x = along ?? random(edge.left + MARGIN, edge.right - MARGIN);
    return { x: Math.min(edge.right - MARGIN, Math.max(edge.left + MARGIN, x)), y: edge.top + 1 };
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
// when it whips past.
const IDLE = {
  napping: ['yawn', 'sunbeam', 'crumb', 'sneeze'],
  hungry: ['crumb', 'yawn', 'sneeze', 'butterfly', 'box', 'wish'],
  content: ['butterfly', 'box', 'croissant', 'sunbeam', 'tail', 'yawn', 'sneeze', 'crumb', 'dance', 'wish'],
  purring: ['butterfly', 'box', 'croissant', 'tail', 'dance', 'sneeze', 'crumb', 'sunbeam', 'wish'],
  loaf: ['sunbeam', 'box', 'yawn', 'croissant', 'dance', 'sneeze', 'wish'],
};
// The chance of one each time it stirs, at no energy; the livelier, the likelier.
const IDLE_CHANCE = 0.25;
const BUNT_EVERY = 15 * 1000;

// Soft colours for the notes and sparkles of a dance.
const NOTE_COLORS = {
  '♪': ['#E39A55', '#8EA2E8', '#D98E9C'],
  '♫': ['#B07AA1', '#5BBE98', '#E39A55'],
  '✦': ['#E3B655', '#F2B8C2', '#9FB4E8'],
};

// How long the dot a click shows, and the menu it opens, stay up untouched.
const DOT_MS = 3500;
// How long a thought bubble with a toy it wishes for waits to be clicked.
const WISH_MS = 20000;
const MENU_MS = 6000;

// What a click on the cat offers.
const OPTIONS = [
  ['treat', 'Give a treat'],
  ['toy', 'Toss a toy'],
  ['dance', 'Dance'],
  ['home', 'Send home'],
];

export default function RoamingCat({ onHome, meal, peek = false }) {
  const box = useRef(null);
  const cat = useRef(null);
  const menuBox = useRef(null);
  const tilt = useRef(null);
  const homeRef = useRef(onHome);
  homeRef.current = onHome;
  const moodRef = useRef('content');
  moodRef.current = moodOf(meal);
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
    const show = (pose, mood = 'content') => {
      const time = performance.now();
      if (between && time < between.until) return;
      between = null;
      const side =
        state.mode === 'leap' || state.mode === 'held' ? 'top' : state.mode === 'fall' ? state.targetSide : state.side;
      // On a side it clings on upright, drawn out to the right of the edge and
      // mirrored for a left side; elsewhere it faces the way it is going.
      const flip = side === 'left' ? -1 : side === 'right' ? 1 : -state.facing;
      if (pose === shown.pose && flip === shown.flip && mood === shown.mood && side === shown.side) return;
      // Between two everyday poses, facing the same way: it moves from one to
      // the other, then settles into the new pose.
      if (
        pose !== shown.pose &&
        MORPHS.has(pose) &&
        MORPHS.has(shown.pose) &&
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
        between = { until: time + MORPH_MS };
        setLook((current) => ({
          pose: 'morph',
          morph,
          flip,
          mood,
          side,
          previous: current.pose,
          previousMorph: current.morph,
          previousFlip: current.flip,
          previousMood: current.mood,
          change: current.change + 1,
        }));
        shown = { pose: 'morph', flip, mood, side, since: time };
        return;
      }
      const step = shown.pose && pose !== shown.pose && (BETWEEN[`${shown.pose}>${pose}`] ?? BETWEEN[`${shown.pose}>`]);
      const next = step ? step[0] : pose;
      if (step) between = { until: time + step[1] };
      // Blended, turning round included, unless it is a quick swipe of a paw or
      // the last change was only a moment ago (then it just changes).
      const changed = next !== shown.pose || flip !== shown.flip;
      const quick =
        (SWIPE.has(next) && SWIPE.has(shown.pose)) ||
        (DANCE.has(next) &&
          DANCE.has(shown.pose) &&
          (next === 'cheer' || next === 'wave' || shown.pose === 'cheer' || shown.pose === 'wave'));
      const blend = changed && time - (shown.since ?? 0) > 300 && !quick;
      setLook((current) => ({
        pose: next,
        flip,
        mood,
        side,
        previous: blend ? current.pose : null,
        previousMorph: current.morph,
        previousFlip: current.flip,
        previousMood: current.mood,
        change: current.change + (blend ? 1 : 0),
      }));
      shown = { pose: next, flip, mood, side, since: changed ? time : shown.since };
    };
    const place = () => {
      const anchor = state.mode === 'held' ? SCRUFF : FEET;
      // Lifted off its edge a little in some of its doings: a hop, a pounce, in a box.
      const lift = ['script', 'tease', 'game'].includes(state.mode) ? (state.lift ?? 0) : 0;
      if (box.current) {
        box.current.style.transform = `translate(${state.x - anchor.x}px, ${state.y - anchor.y - lift}px)`;
      }
      if (tilt.current) {
        // Its nose is on the left unless the drawing is mirrored to face right.
        const nose = state.facing < 0 ? 1 : -1;
        // A rocking on its feet: dying away as it finds its balance after a
        // drop, or a wiggle, a sway or a dizzy wobble in its doings.
        const rocking =
          state.mode === 'wobble'
            ? { amp: 10, freq: 2.2, decay: 3, from: state.started }
            : state.mode === 'script'
              ? state.rock
              : null;
        if (rocking) {
          const seconds = (performance.now() - rocking.from) / 1000;
          const rock =
            rocking.amp * Math.exp(-rocking.decay * seconds) * Math.sin(2 * Math.PI * rocking.freq * seconds);
          tilt.current.style.transformOrigin = 'center bottom';
          tilt.current.style.transform = `rotate(${rock}deg)`;
        } else {
          tilt.current.style.transformOrigin = 'center';
          tilt.current.style.transform = state.mode === 'leap' ? `rotate(${(state.tilt ?? 0) * nose}deg)` : '';
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
        gravity: false,
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
    const feel = () => FEELS[moodRef.current] ?? FEELS.content;
    // One of its mood's own doings, or a nap, or a dash along its panel.
    const act = (name, time) => {
      if (name === 'sleep') {
        state.mode = 'sleep';
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
    const pickAct = () => {
      let roll = Math.random();
      for (const [name, chance] of Object.entries(feel().acts)) {
        if (roll < chance) return name;
        roll -= chance;
      }
      return null;
    };
    const rest = (time, seconds = feel().rest) => {
      if (things.current) putThing(null);
      if (state.wish) wishFor(null);
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
        dot: onEdge(state.x + dir * 90),
        mouse: { x: onEdge(state.x + dir * 130), dir, speed: 120, pauseUntil: time + 700 },
        catches: 0,
        bubbles: [],
        spawned: 0,
        swing: 0,
      };
      state.lastPlay = time;
      say('♪');
    };
    const endGame = (time) => {
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
    const dances = {
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
    };
    // Ways of having a treat: tossed, caught in the air; held up, begged for;
    // dropped somewhere, hunted for; or a little bowl of them.
    const munch = () => [
      { pose: 'crouch', ms: 900, start: () => (putThing(null), say('nom')) },
      { pose: 'sit', mood: 'purring', ms: 900, start: () => say('crunch') },
      { pose: 'groom', ms: 1300, start: () => say('heart') },
    ];
    // Toys tossed to it (besides the yarn): a bouncy ball, a loose feather, a
    // toy mouse.
    const tossed = {
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
    };
    const treats = {
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
    };
    const doings = {
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
      // A big yawn.
      yawn: () => [
        { pose: 'sit', ms: 400 },
        { pose: 'sit', mood: 'yawn', ms: 1500 },
        { pose: 'sit', mood: 'purring', ms: 800 },
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
        const toys = Object.keys(TOYS).filter((toy) => toy !== state.lastWish);
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
      // A dance, one of several, picked at random.
      dance: () => {
        const names = Object.keys(dances).filter((name) => name !== state.lastDance);
        const name = names[Math.floor(Math.random() * names.length)];
        state.lastDance = name;
        return [{ pose: 'sit', mood: 'purring', ms: 350, start: () => say('♪') }, ...dances[name](), ...bow()];
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
    };

    // Treats and toys from its card; on a side, it hops up first.
    const onTreat = () => {
      if (!state.perch) return;
      state.lastPlay = performance.now();
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

    const onPointerMove = (event) => {
      const time = performance.now();
      // How fast the pointer is moving, smoothed, in pixels a second.
      const gap = time - state.pointer.at;
      if (gap > 0 && gap < 200) {
        const speed = (Math.hypot(event.pageX - state.pointer.x, event.pageY - state.pointer.y) / gap) * 1000;
        state.pointerSpeed = 0.6 * (state.pointerSpeed ?? 0) + 0.4 * speed;
      } else state.pointerSpeed = 0;
      state.pointer = { x: event.pageX, y: event.pageY, at: time };
      if (state.mode === 'sleep') {
        sit(time, 'content', 1500);
      }
      const press = state.press;
      if (press && state.mode !== 'held' && Math.hypot(event.pageX - press.x, event.pageY - press.y) > 5) {
        clearTimeout(press.timer);
        state.mode = 'held';
        if (state.wish) wishFor(null);
        state.resume = null;
        state.side = 'top';
        state.perch = null;
      }
      if (state.mode === 'held') {
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
          state.duration = Math.min(750, Math.max(300, Math.sqrt((2 * height) / 2600) * 1000));
        }
        state.scared = false;
        return;
      }
      if (press.petting) {
        rest(time);
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
        if (count === 1) {
          if (state.menu) {
            closeMenu();
            return;
          }
          openMenu();
        } else closeMenu();
        if (onSide()) {
          say('prr');
          say('heart');
          if (count >= 3) leapTo(state.perch, null, HOP_MS);
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
    window.addEventListener('pointerdown', onPressAway);
    window.addEventListener('keydown', onKey);
    state.takeWish = () => {
      const toy = state.wish;
      if (!toy) return;
      wishFor(null);
      startGame(toy, performance.now());
    };
    state.choose = (kind) => {
      closeMenu();
      if (kind === 'treat') onTreat();
      else if (kind === 'toy') onToy();
      else if (kind === 'dance') {
        // On a side it hops up to dance.
        if (onSide()) {
          leapTo(state.perch, null, HOP_MS);
          setTimeout(() => state.choose('dance'), SPRING_MS + HOP_MS + 400);
        } else if (state.perch) play(doings.dance(), performance.now());
      } else goHome();
    };
    // In development, one of its doings can be started by name from the console.
    if (import.meta.env.DEV) {
      window.mochiState = state;
      window.mochi = (name) => {
        if (!state.perch || onSide() || state.mode !== 'rest') return false;
        if (name === 'tease') startTease(performance.now());
        else if (TOYS[name]) startGame(name, performance.now());
        else if (name.startsWith('treat:')) play(treats[name.slice(6)](), performance.now());
        else if (name.startsWith('toss:')) play(tossed[name.slice(5)](), performance.now());
        else if (name.startsWith('dance:')) {
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
        if (!onSide()) state.mode = 'pet';
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
      // Follow its panel as the page moves, riding along while the page
      // scrolls; once the scrolling has settled with its panel out of view, one
      // leap in from the edge it left by onto the nearest panel in view.
      if (
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
          'script',
          'tease',
          'game',
        ].includes(state.mode)
      ) {
        const rect = state.perch.getBoundingClientRect();
        const edge = page(rect);
        const spot = onSide()
          ? spotOn(state.perch, edge.top + state.along, state.side)
          : spotOn(state.perch, edge.left + state.along);
        state.x = spot.x;
        state.y = spot.y;
        const onScreen = spot.y - window.scrollY;
        const above = onScreen < TOP_CLEAR - 30;
        if ((above || onScreen > window.innerHeight - 10 || !rect.width) && time - state.scrolledAt > SETTLE_MS) {
          const perches = visiblePerches();
          const perch = above ? perches[0] : perches[perches.length - 1];
          if (perch) {
            state.x = Math.min(window.scrollX + window.innerWidth - MARGIN, Math.max(window.scrollX + MARGIN, state.x));
            state.y = above ? window.scrollY + TOP_CLEAR - 40 : window.scrollY + window.innerHeight + 20;
            state.perch = null;
            leapTo(perch, state.x);
          }
        }
      }
      const along = () => {
        if (!state.perch) return;
        const edge = page(state.perch.getBoundingClientRect());
        state.along = onSide() ? state.y - edge.top : state.x - edge.left;
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
        if (onSide()) {
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
        play(doings.bunt(), time);
      }

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
          show('leap');
          if (t >= 1 && state.homing) {
            state.mode = 'home';
            homeRef.current?.();
          } else if (t >= 1) {
            state.tilt = 0;
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
          show(state.gravity ? 'scared' : state.targetSide === 'top' ? 'held' : 'cling');
          if (t >= 1) {
            state.perch = state.target;
            state.side = state.targetSide;
            along();
            state.mode = state.gravity ? 'wobble' : 'land';
            state.started = time;
            state.until = time + (state.gravity ? 1200 : 320);
          }
          break;
        }
        case 'wobble':
          // Landed from a height: braced, rocking side to side till it is steady.
          show('balance');
          if (time > state.until) rest(time);
          break;
        case 'land':
          show(onSide() ? 'cling' : 'crouch');
          if (time > state.until) {
            // Landed mid-game of keep-away: the game goes on here.
            if (state.resume === 'tease' && !onSide()) {
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
          if (time - state.pointer.at > feel().doze && !onSide()) {
            state.mode = 'sleep';
            break;
          }
          if (time < state.until || state.menu) break;
          // Low on energy, it often just dozes on where it is.
          if (Math.random() > feel().energy + 0.35) {
            rest(time);
            break;
          }
          const bored = time - state.lastPlay > BORED_AFTER;
          const roll = Math.random();
          const perch = state.perch;
          const doing = !onSide() && !bored ? pickAct() : null;
          const choices = (IDLE[moodRef.current] ?? IDLE.content).filter((name) => name !== state.lastIdle);
          const idle =
            !onSide() && !bored && Math.random() < IDLE_CHANCE + 0.35 * feel().energy
              ? choices[Math.floor(Math.random() * choices.length)]
              : null;
          if (idle) {
            state.lastIdle = idle;
            play(doings[idle](), time);
          } else if (doing) {
            act(doing, time);
          } else if (bored && roll < 0.3) {
            // Nobody has played for a while: it knocks on its panel.
            state.mode = 'knock';
            state.until = time + 1400;
            state.knocks = [time + 300, time + 800];
          } else if (roll < (bored ? 0.3 : 0) + 0.3 * feel().leap) {
            const other = otherPerch();
            if (other) leapTo(other);
            else rest(time);
          } else if (onSide() && roll < 0.65) {
            // Back up onto the top edge.
            leapTo(perch, null, HOP_MS);
          } else if (!onSide() && roll < 0.5) {
            // Round onto a side of the panel, the one nearer.
            const edge = page(perch.getBoundingClientRect());
            const side = state.x < (edge.left + edge.right) / 2 ? 'left' : 'right';
            if (sideFits(perch, side)) leapTo(perch, null, HOP_MS, side);
            else rest(time);
          } else {
            const edge = page(perch.getBoundingClientRect());
            state.mode = 'walk';
            state.goal = onSide()
              ? random(edge.top + 40, edge.bottom - 30)
              : random(edge.left + MARGIN, edge.right - MARGIN);
          }
          break;
        }
        case 'walk': {
          // Along the top, or climbing up or down a side.
          const at = onSide() ? state.y : state.x;
          const step = STROLL * feel().pace * dt * Math.sign(state.goal - at);
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
          show(onSide() ? 'climb' : 'walk', feel().face);
          if (next === state.goal) {
            // Full of beans, it may set straight off again somewhere else.
            const edge = page(state.perch.getBoundingClientRect());
            if (Math.random() < 0.5 * feel().energy) {
              state.goal = onSide()
                ? random(edge.top + 40, edge.bottom - 30)
                : random(edge.left + MARGIN, edge.right - MARGIN);
            } else rest(time);
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
            state.mode = 'leaping';
            state.perch = null;
            leapTo(perch, at, duration, side);
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
            shake(state.perch);
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
          show(step.pose ?? 'walk', step.mood ?? feel().face);
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
          break;
        case 'held':
          show(state.scared ? 'scared' : 'held');
          break;
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
            // The dot follows the pointer along the edge; it runs after it and pounces.
            if (Math.abs(state.pointer.y - state.y) < 260 && time - state.pointer.at < 5000)
              game.dot = onEdge(state.pointer.x);
            putThing({ kind: 'laser', x: game.dot, y: state.y - 1 });
            const dx = game.dot - state.x;
            if (busy) {
              // in the air
            } else if (Math.abs(dx) > 70) {
              state.x += Math.sign(dx) * CHASE * 1.9 * dt;
              state.facing = dx < 0 ? -1 : 1;
              show('walk', 'hungry');
            } else if (Math.abs(dx) > 10 && time > game.nextPounce) {
              gameHop(game.dot, 22, 380, 'reach');
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
          // Clicked while peeking: up it pops, paws on the name, and off it goes.
          show('peek');
          if (time > state.until) {
            const perch = visiblePerches()[0];
            if (perch) leapTo(perch);
            else state.mode = 'idle';
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
      clearTimeout(state.clickTimer);
      clearTimeout(state.menuTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('bakery-cat-treat', onTreat);
      window.removeEventListener('bakery-cat-toy', onToy);
      window.removeEventListener('pointerdown', onPressAway);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const Pose = look.pose ? (ROAM_POSES[look.pose] ?? ROAM_POSES.rest) : null;
  const Previous = look.previous ? ROAM_POSES[look.previous] : null;
  // A drawing faces left; mirrored about its feet (x = 60) to face right.
  const mirror = (flip) => (flip < 0 ? 'translate(120 0) scale(-1 1)' : undefined);
  const motion =
    look.pose === 'roll'
      ? 'motion-safe:animate-cat-roll'
      : look.pose === 'rest'
        ? 'motion-safe:animate-cat-breathe'
        : '';
  const poseBox = { transformBox: 'fill-box', transformOrigin: 'center bottom' };
  return createPortal(
    <div className="pointer-events-none absolute left-0 top-0 z-40" style={{ width: 0, height: 0 }}>
      {/* The thing it is playing with, behind it. */}
      {things.map((item, index) => (
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
          <g ref={tilt} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <g
              className={motion}
              style={{ ...poseBox, transformOrigin: look.pose === 'roll' ? 'center' : 'center bottom' }}
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
        </svg>
        {/* A toy it wishes for, in a thought bubble: clicked, the game is on. */}
        {wish && (
          <button
            type="button"
            onClick={() => cat.current?.takeWish?.()}
            aria-label={`Mochi would love to play with ${TOYS[wish]}. Play with Mochi.`}
            className="pointer-events-auto absolute rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20"
            style={{ left: BUBBLE.x - 4, bottom: HEIGHT - BUBBLE.y - 3 }}
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
            className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-[11px] text-[#C98A50] motion-safe:animate-cat-float"
            style={NOTE_COLORS[kind] ? { color: NOTE_COLORS[kind][id.length % NOTE_COLORS[kind].length] } : undefined}
          >
            {kind === 'heart' ? (
              <svg viewBox="-5 -1 10 9" className="h-3.5 w-3.5">
                <path
                  d="M0 1.6c-1.6-2.4-5-1.2-4.2 1.4C-3.6 5 0 7 0 7s3.6-2 4.2-4c.8-2.6-2.6-3.8-4.2-1.4z"
                  fill="#F08A93"
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
    </div>,
    document.body,
  );
}

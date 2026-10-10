import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ROAM_POSES, moodOf } from './BakeryCat';

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
const WIDTH = 72;
const UNIT = WIDTH / VIEW.width;
const HEIGHT = VIEW.height * UNIT;
// Where its feet are, and where it is held when picked up, in that box.
const FEET = { x: (60 - VIEW.x) * UNIT, y: (88 - VIEW.y) * UNIT };
const SCRUFF = { x: (60 - VIEW.x) * UNIT, y: (30 - VIEW.y) * UNIT };
// Room it keeps from a panel's ends, from the top of the window (where the
// site's navigation bar sits) and from its sides.
const MARGIN = 50;
const TOP_CLEAR = 110;
const SIDE_CLEAR = 16;
// Paces, in pixels a second, and how long things take, in milliseconds.
const STROLL = 36;
const CHASE = 90;
const LEAP_MS = 720;
const HOP_MS = 480;
const DROP_MS = 380;
const SPRING_MS = 260;
const SETTLE_MS = 1200;
const DOZE_AFTER = 3 * 60 * 1000;
// How it carries itself on what it has eaten lately: its pace, its face, how
// soon it dozes off, how long it rests, how readily it leaps away, how far off
// it notices the pointer, and what else it gets up to now and then (a chance
// each time it stirs on a panel's top edge). Starving, it drags itself about,
// begs and naps; well fed, it kneads the panel ("makes biscuits") and gets the
// zoomies; full, it lolls belly-up and grooms.
const FEELS = {
  napping: {
    pace: 0.55,
    face: 'hungry',
    restFace: 'hungry',
    doze: 40 * 1000,
    rest: [12, 24],
    leap: 0.35,
    notice: 150,
    begs: true,
    acts: { beg: 0.3, sleep: 0.25 },
  },
  hungry: {
    pace: 0.8,
    face: 'hungry',
    restFace: 'content',
    doze: DOZE_AFTER,
    rest: [8, 18],
    leap: 0.8,
    notice: 170,
    begs: true,
    acts: { beg: 0.25, groom: 0.05 },
  },
  content: {
    pace: 1,
    face: 'content',
    restFace: 'purring',
    doze: DOZE_AFTER,
    rest: [8, 18],
    leap: 1,
    notice: 170,
    acts: { groom: 0.15, knead: 0.05 },
  },
  purring: {
    pace: 1.2,
    face: 'content',
    restFace: 'purring',
    doze: DOZE_AFTER,
    rest: [6, 14],
    leap: 1.1,
    notice: 210,
    acts: { knead: 0.2, zoom: 0.14, groom: 0.1 },
  },
  loaf: {
    pace: 0.75,
    face: 'purring',
    restFace: 'purring',
    doze: DOZE_AFTER,
    rest: [12, 24],
    leap: 0.5,
    notice: 170,
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
  'rest>sit': ['crouch', 160],
  'rest>reach': ['crouch', 160],
  'sit>rest': ['crouch', 200],
  'walk>rest': ['crouch', 200],
};

// Poses it swaps between too quickly to blend: batting at the pointer.
const SWIPE = new Set(['sit', 'reach']);

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

// What a click on the cat offers.
const OPTIONS = [
  ['treat', 'Give a treat'],
  ['toy', 'Toss a toy'],
  ['home', 'Send home'],
];

export default function RoamingCat({ onHome, meal }) {
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
    pose: 'leap',
    facing: -1,
    mood: 'content',
    side: 'top',
    flip: 1,
    previous: null,
    change: 0,
  });
  const [effects, setEffects] = useState([]);
  const [toy, setToy] = useState(null);

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
      const side = state.mode === 'leap' || state.mode === 'held' ? 'top' : state.side;
      // On a side it clings on upright, drawn out to the right of the edge and
      // mirrored for a left side; elsewhere it faces the way it is going.
      const flip = side === 'left' ? -1 : side === 'right' ? 1 : -state.facing;
      if (pose === shown.pose && flip === shown.flip && mood === shown.mood && side === shown.side) return;
      const step = shown.pose && pose !== shown.pose && (BETWEEN[`${shown.pose}>${pose}`] ?? BETWEEN[`${shown.pose}>`]);
      const next = step ? step[0] : pose;
      if (step) between = { until: time + step[1] };
      // Blended, turning round included, unless it is a quick swipe of a paw or
      // the last change was only a moment ago (then it just changes).
      const changed = next !== shown.pose || flip !== shown.flip;
      const blend = changed && time - (shown.since ?? 0) > 300 && !(SWIPE.has(next) && SWIPE.has(shown.pose));
      setLook((current) => ({
        pose: next,
        flip,
        mood,
        side,
        previous: blend ? current.pose : null,
        previousFlip: current.flip,
        previousMood: current.mood,
        change: current.change + (blend ? 1 : 0),
      }));
      shown = { pose: next, flip, mood, side, since: changed ? time : shown.since };
    };
    const place = () => {
      const anchor = state.mode === 'held' ? SCRUFF : FEET;
      if (box.current) {
        box.current.style.transform = `translate(${state.x - anchor.x}px, ${state.y - anchor.y}px)`;
      }
      if (tilt.current) {
        // Its nose is on the left unless the drawing is mirrored to face right.
        const nose = state.facing < 0 ? 1 : -1;
        tilt.current.style.transform = state.mode === 'leap' ? `rotate(${(state.tilt ?? 0) * nose}deg)` : '';
      }
    };
    // The menu a click opens; while it is open the cat stays where it is.
    const closeMenu = () => {
      state.menu = false;
      setMenu(false);
    };
    const openMenu = () => {
      state.menu = true;
      setMenu(true);
    };
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
      Object.assign(state, {
        mode: 'leap',
        from: { x: state.x, y: state.y },
        to,
        target: perch,
        targetSide: side,
        started: performance.now(),
        duration,
        height: duration === DROP_MS ? 10 : 30 + Math.abs(to.y - state.y) * 0.25,
      });
      state.side = 'top';
      state.facing = to.x < state.x ? -1 : 1;
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
      state.mode = 'rest';
      state.until = time + random(...seconds) * 1000;
      // On a top edge, mostly a loaf, sometimes peeking over; on a side, clinging on.
      state.restPose = state.side !== 'top' ? 'cling' : Math.random() < 0.8 ? 'rest' : 'peek';
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

    // Treats and toys from its card; on a side, it hops up first.
    const onTreat = () => {
      if (!state.perch) return;
      state.lastPlay = performance.now();
      if (onSide()) {
        leapTo(state.perch, null, HOP_MS);
        setTimeout(onTreat, HOP_MS + 300);
        return;
      }
      sit(performance.now(), 'purring', 2600);
      say('treat');
      setTimeout(() => say('crunch'), 700);
    };
    const onToy = () => {
      if (!state.perch) return;
      if (onSide()) {
        leapTo(state.perch, null, HOP_MS);
        setTimeout(onToy, HOP_MS + 300);
        return;
      }
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
      state.pointer = { x: event.pageX, y: event.pageY, at: time };
      if (state.mode === 'sleep') {
        sit(time, 'content', 1500);
      }
      const press = state.press;
      if (press && state.mode !== 'held' && Math.hypot(event.pageX - press.x, event.pageY - press.y) > 5) {
        clearTimeout(press.timer);
        state.mode = 'held';
        state.side = 'top';
        state.perch = null;
      }
      if (state.mode === 'held') {
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
          leapTo(beside.element, event.pageY, DROP_MS, beside.side);
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
      if (state.menu && !menuBox.current?.contains(event.target) && !event.target.closest?.('[data-cat]')) {
        closeMenu();
      }
    };
    const onKey = (event) => {
      if (event.key === 'Escape' && state.menu) closeMenu();
    };
    window.addEventListener('pointerdown', onPressAway);
    window.addEventListener('keydown', onKey);
    state.choose = (kind) => {
      closeMenu();
      if (kind === 'treat') onTreat();
      else if (kind === 'toy') onToy();
      else goHome();
    };
    // A press on the cat: held still it is petting, moved it picks the cat up.
    state.onPointerDown = (event) => {
      event.preventDefault();
      const time = performance.now();
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

    leapTo(visiblePerches()[0]);
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
            state.until = time + 220;
          }
          break;
        }
        case 'land':
          show(onSide() ? 'cling' : 'crouch');
          if (time > state.until) rest(time);
          break;
        case 'rest': {
          show(state.restPose, state.restPose === 'rest' ? feel().restFace : feel().face);
          if (pointerNear && time > state.chaseRest && !onSide()) {
            // Hungry, it begs its owner rather than plays.
            if (feel().begs && Math.random() < 0.6) {
              state.chaseRest = time + 8000;
              act('beg', time);
              break;
            }
            state.mode = 'chase';
            state.until = time + 6000;
            break;
          }
          if (time - state.pointer.at > feel().doze && !onSide()) {
            state.mode = 'sleep';
            break;
          }
          if (time < state.until || state.menu) break;
          const bored = time - state.lastPlay > BORED_AFTER;
          const roll = Math.random();
          const perch = state.perch;
          const doing = !onSide() && !bored ? pickAct() : null;
          if (doing) {
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
          if (pointerNear && time > state.chaseRest && !onSide()) {
            state.mode = 'chase';
            state.until = time + 6000;
            break;
          }
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
          if (next === state.goal) rest(time);
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
            state.chaseRest = time + 6000;
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
          setToy({ x, y: state.y });
          const gap = x - state.x;
          if (Math.abs(gap) > 26) state.x += Math.sign(gap) * Math.min(Math.abs(gap) - 26, CHASE * 1.6 * dt);
          along();
          show('walk');
          if (roll >= 1 && Math.abs(x - state.x) <= 27) {
            setToy(null);
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
          show('held');
          break;
        case 'home':
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
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('bakery-cat-treat', onTreat);
      window.removeEventListener('bakery-cat-toy', onToy);
      window.removeEventListener('pointerdown', onPressAway);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const Pose = ROAM_POSES[look.pose] ?? ROAM_POSES.rest;
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
      {toy && (
        <svg
          aria-hidden="true"
          viewBox="-6 -6 12 12"
          className="absolute h-[16px] w-[16px]"
          style={{ transform: `translate(${toy.x - 8}px, ${toy.y - 16}px) rotate(${toy.x * 5}deg)` }}
        >
          <circle r="5" fill="#9FB4E8" stroke="#7E95CF" strokeWidth="1" />
          <path
            d="M-3.5 -1.5q3.5-3 7 0M-3 2q3-2.5 6 0M-1 -4.5q2 5 0 9"
            fill="none"
            stroke="#7E95CF"
            strokeWidth="0.8"
          />
        </svg>
      )}
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
                    <Previous mood={look.previousMood} />
                  </g>
                </g>
              )}
              <g key={`in-${look.change}`} className="motion-safe:animate-cat-pose-in">
                <g transform={mirror(look.flip)}>
                  <Pose mood={look.mood} />
                </g>
              </g>
            </g>
          </g>
        </svg>
        {/* What can be done for it, popped up above it by a click. */}
        {menu && (
          <div
            ref={menuBox}
            role="menu"
            aria-label="Mochi"
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

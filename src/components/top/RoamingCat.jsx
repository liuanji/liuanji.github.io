import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ROAM_POSES } from './BakeryCat';

// The bakery cat let out to roam the page. It lives on the top edges of the
// panels marked data-cat-perch that are in view, mostly resting there as a
// loaf, now and then strolling along its panel or leaping to another, and
// leaping back into view when its panel scrolls away. It answers to its
// owner: a click and it purrs, a double click and it blinks slowly back, a
// few clicks and it rolls over and hops off, a press and hold to pet it, and
// it can be picked up and dropped on another panel. It watches the pointer
// and creeps after it when it comes close, dozes off when the pointer has been
// still for a while, and when nobody has played with it for some time it
// knocks on its panel or wanders off on its own. Only the cat itself takes
// clicks; it sits above the panels' edges, never on their readings.

// The drawing's box (its 120 x 100 frame cropped round the cat) and how big it
// is drawn: about as tall as a server's name.
const VIEW = { x: 10, y: 30, width: 100, height: 62 };
const WIDTH = 46;
const UNIT = WIDTH / VIEW.width;
const HEIGHT = VIEW.height * UNIT;
// Where its feet are, and where it is held when picked up, in that box.
const FEET = { x: (60 - VIEW.x) * UNIT, y: (88 - VIEW.y) * UNIT };
const SCRUFF = { x: (60 - VIEW.x) * UNIT, y: (30 - VIEW.y) * UNIT };
// Room it keeps from a panel's ends, and from the top of the window, where the
// site's navigation bar sits.
const MARGIN = 34;
const TOP_CLEAR = 100;
// Paces, in pixels a second, and how long things take, in milliseconds.
const STROLL = 32;
const CHASE = 60;
const LEAP_MS = 720;
const DROP_MS = 380;
const DOZE_AFTER = 3 * 60 * 1000;
const BORED_AFTER = 2 * 60 * 1000;

const random = (from, to) => from + Math.random() * (to - from);
const page = (rect) => ({
  left: rect.left + window.scrollX,
  right: rect.right + window.scrollX,
  top: rect.top + window.scrollY,
});

// The panels it can sit on that are in view, with their top edges on screen.
function visiblePerches() {
  return [...document.querySelectorAll('[data-cat-perch]')].filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 2 * MARGIN + 40 && rect.top > TOP_CLEAR && rect.top < window.innerHeight - 24;
  });
}

function spotOn(perch, along = null) {
  const edge = page(perch.getBoundingClientRect());
  const x = along ?? random(edge.left + MARGIN, edge.right - MARGIN);
  return { x: Math.min(edge.right - MARGIN, Math.max(edge.left + MARGIN, x)), y: edge.top + 1 };
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

export default function RoamingCat() {
  const box = useRef(null);
  const cat = useRef(null);
  const [look, setLook] = useState({ pose: 'leap', facing: -1, mood: 'content' });
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
      perch: null,
      along: 0,
      until: now,
      pointer: { x: -9999, y: -9999, at: 0 },
      lastPlay: now,
      chaseRest: 0,
      clicks: [],
      press: null,
    };
    cat.current = state;
    let shown = { pose: '', facing: 0, mood: '' };
    const show = (pose, mood = 'content') => {
      if (pose !== shown.pose || state.facing !== shown.facing || mood !== shown.mood) {
        shown = { pose, facing: state.facing, mood };
        setLook({ pose, facing: state.facing, mood });
      }
    };
    const place = () => {
      const anchor = state.mode === 'held' ? SCRUFF : FEET;
      if (box.current) {
        box.current.style.transform = `translate(${state.x - anchor.x}px, ${state.y - anchor.y}px)`;
      }
    };
    const leapTo = (perch, along = null, duration = LEAP_MS) => {
      if (!perch) return;
      const to = spotOn(perch, along);
      Object.assign(state, {
        mode: 'leap',
        from: { x: state.x, y: state.y },
        to,
        target: perch,
        started: performance.now(),
        duration,
        height: duration === DROP_MS ? 8 : 34 + Math.abs(to.y - state.y) * 0.25,
      });
      state.facing = to.x < state.x ? -1 : 1;
    };
    const rest = (time, seconds = [8, 18]) => {
      state.mode = 'rest';
      state.until = time + random(...seconds) * 1000;
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

    // Treats and toys from its card.
    const onTreat = () => {
      if (!state.perch) return;
      state.lastPlay = performance.now();
      sit(performance.now(), 'purring', 2600);
      say('treat');
      setTimeout(() => say('crunch'), 700);
    };
    const onToy = () => {
      if (!state.perch) return;
      const edge = page(state.perch.getBoundingClientRect());
      const goRight = state.x < (edge.left + edge.right) / 2;
      const end = goRight ? edge.right - MARGIN : edge.left + MARGIN;
      Object.assign(state, {
        mode: 'crouch',
        until: performance.now() + 600,
        then: 'toy',
        ball: { x: state.x + (goRight ? 26 : -26), to: end, at: performance.now() },
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
        sit(time, 'content', 1200);
      }
      const press = state.press;
      if (press && state.mode !== 'held' && Math.hypot(event.pageX - press.x, event.pageY - press.y) > 5) {
        clearTimeout(press.timer);
        state.mode = 'held';
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
        // Dropped: onto the panel under the pointer, else the nearest in view.
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
      // A click: purr; two quick ones, a slow blink; more, it rolls over and hops off.
      state.clicks = [...state.clicks.filter((at) => time - at < 700), time];
      clearTimeout(state.clickTimer);
      state.clickTimer = setTimeout(() => {
        const count = state.clicks.length;
        state.clicks = [];
        const at = performance.now();
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
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    // A press on the cat: held still it is petting, moved it picks the cat up.
    state.onPointerDown = (event) => {
      event.preventDefault();
      const time = performance.now();
      state.lastPlay = time;
      const press = { x: event.pageX, y: event.pageY, petting: false };
      press.timer = setTimeout(() => {
        press.petting = true;
        state.mode = 'pet';
        say('heart');
        press.hearts = setInterval(() => (state.press === press ? say('heart') : clearInterval(press.hearts)), 900);
      }, 450);
      state.press = press;
    };

    leapTo(visiblePerches()[0]);
    let frame = requestAnimationFrame(function step(time) {
      frame = requestAnimationFrame(step);
      // Follow its panel as the page moves; leap back into view if it goes.
      if (
        state.perch &&
        ['rest', 'walk', 'sit', 'sleep', 'crouch', 'pet', 'chase', 'knock', 'roll', 'toy', 'land'].includes(state.mode)
      ) {
        const rect = state.perch.getBoundingClientRect();
        if (rect.top < TOP_CLEAR - 30 || rect.top > window.innerHeight - 10 || !rect.width) {
          const perch = visiblePerches()[0];
          if (perch) {
            const fromLeft = Math.random() < 0.5;
            state.x = window.scrollX + (fromLeft ? -30 : window.innerWidth + 30);
            state.y = Math.max(window.scrollY + 40, page(perch.getBoundingClientRect()).top - 70);
            leapTo(perch);
          }
        } else {
          const spot = spotOn(state.perch, page(rect).left + state.along);
          state.x = spot.x;
          state.y = spot.y;
        }
      }
      const along = () => {
        if (state.perch) state.along = state.x - page(state.perch.getBoundingClientRect()).left;
      };
      const pointerNear =
        time - state.pointer.at < 1500 && Math.hypot(state.pointer.x - state.x, state.pointer.y - (state.y - 12)) < 150;

      switch (state.mode) {
        case 'leap': {
          const t = Math.min(1, (time - state.started) / state.duration);
          const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
          state.x = state.from.x + (state.to.x - state.from.x) * eased;
          state.y = state.from.y + (state.to.y - state.from.y) * eased - state.height * 4 * t * (1 - t);
          show('leap');
          if (t >= 1) {
            state.perch = state.target;
            along();
            state.mode = 'land';
            state.until = time + 200;
          }
          break;
        }
        case 'land':
          show('crouch');
          if (time > state.until) rest(time);
          break;
        case 'rest': {
          show('rest');
          if (pointerNear && time > state.chaseRest) {
            state.mode = 'chase';
            state.until = time + 3500;
            break;
          }
          if (time - state.pointer.at > DOZE_AFTER) {
            state.mode = 'sleep';
            break;
          }
          if (time < state.until) break;
          const bored = time - state.lastPlay > BORED_AFTER;
          const roll = Math.random();
          if (bored && roll < 0.35) {
            // Nobody has played for a while: it knocks on its panel.
            state.mode = 'knock';
            state.until = time + 1400;
            state.knocks = [time + 300, time + 800];
          } else if (roll < (bored ? 0.7 : 0.35)) {
            const perch = otherPerch();
            if (perch) {
              state.mode = 'crouch';
              state.until = time + 550;
              state.then = perch;
            } else rest(time);
          } else {
            const edge = page(state.perch.getBoundingClientRect());
            state.mode = 'walk';
            state.goal = random(edge.left + MARGIN, edge.right - MARGIN);
          }
          break;
        }
        case 'walk': {
          const step = (STROLL / 60) * Math.sign(state.goal - state.x);
          state.facing = step < 0 ? -1 : 1;
          state.x = Math.abs(state.goal - state.x) <= Math.abs(step) ? state.goal : state.x + step;
          along();
          show('walk');
          if (state.x === state.goal) rest(time);
          break;
        }
        case 'chase': {
          // Watching the pointer and creeping after it along its panel.
          const dx = state.pointer.x - state.x;
          state.facing = dx < 0 ? -1 : 1;
          if (Math.abs(dx) > 40 && state.perch) {
            const edge = page(state.perch.getBoundingClientRect());
            state.x = Math.min(
              edge.right - MARGIN,
              Math.max(edge.left + MARGIN, state.x + (CHASE / 60) * Math.sign(dx)),
            );
            along();
            show('walk');
          } else show('reach');
          if (time > state.until || !pointerNear) {
            state.chaseRest = time + 20000;
            rest(time, [4, 10]);
          }
          break;
        }
        case 'crouch':
          show('crouch');
          if (time > state.until) {
            if (state.then === 'toy') {
              state.mode = 'toy';
            } else leapTo(state.then);
          }
          break;
        case 'toy': {
          // The ball rolls ahead; the cat runs after it and pounces.
          const ball = state.ball;
          const roll = Math.min(1, (time - ball.at) / 1600);
          const x = ball.x + (ball.to - ball.x) * (1 - (1 - roll) ** 2);
          setToy({ x, y: state.y });
          const gap = x - state.x;
          if (Math.abs(gap) > 18) state.x += Math.sign(gap) * Math.min(Math.abs(gap) - 18, (CHASE * 1.6) / 60);
          along();
          show('walk');
          if (roll >= 1 && Math.abs(x - state.x) <= 19) {
            setToy(null);
            sit(time, 'purring', 1800);
            say('heart');
          }
          break;
        }
        case 'knock':
          show('reach');
          if (state.knocks.length && time > state.knocks[0]) {
            state.knocks.shift();
            shake(state.perch);
          }
          if (time > state.until) {
            state.lastPlay = time - BORED_AFTER / 2;
            rest(time);
          }
          break;
        case 'sit':
          show('sit', state.mood);
          if (time > state.until) rest(time);
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
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('bakery-cat-treat', onTreat);
      window.removeEventListener('bakery-cat-toy', onToy);
    };
  }, []);

  const Pose = ROAM_POSES[look.pose] ?? ROAM_POSES.rest;
  const rolling = look.pose === 'roll';
  return createPortal(
    <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-40" style={{ width: 0, height: 0 }}>
      {toy && (
        <svg
          viewBox="-6 -6 12 12"
          className="absolute h-[11px] w-[11px]"
          style={{ transform: `translate(${toy.x - 5.5}px, ${toy.y - 11}px) rotate(${toy.x * 6}deg)` }}
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
          className={`pointer-events-auto cursor-grab touch-none overflow-visible active:cursor-grabbing ${
            look.pose === 'rest' ? 'motion-safe:animate-cat-breathe' : ''
          }`}
          style={{
            transform: `scaleX(${-look.facing}) ${rolling ? 'rotate(360deg)' : ''}`,
            transformOrigin: `${FEET.x}px ${FEET.y}px`,
            transition: rolling ? 'transform 0.6s ease-in-out' : undefined,
          }}
          onPointerDown={(event) => cat.current?.onPointerDown?.(event)}
        >
          <Pose mood={look.mood} />
        </svg>
        {effects.map(({ id, kind }) => (
          <span
            key={id}
            className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-[9px] text-[#C98A50] motion-safe:animate-cat-float"
          >
            {kind === 'heart' ? (
              <svg viewBox="-5 -1 10 9" className="h-2.5 w-2.5">
                <path
                  d="M0 1.6c-1.6-2.4-5-1.2-4.2 1.4C-3.6 5 0 7 0 7s3.6-2 4.2-4c.8-2.6-2.6-3.8-4.2-1.4z"
                  fill="#F08A93"
                />
              </svg>
            ) : kind === 'z' ? (
              <span className="font-semibold text-[#A3B1C6]">z</span>
            ) : kind === 'treat' ? (
              <svg viewBox="-4 -3 9 6" className="h-2 w-3">
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

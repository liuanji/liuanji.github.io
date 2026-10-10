import { PASTRIES } from '../bakery/pastries';

// The things the roaming cat finds about the page and plays with, each drawn
// small and soft, with its base at (0, 0) where it rests on a panel's edge.

// A ball of yarn, rolled along a panel's edge.
function Yarn() {
  return (
    <g transform="translate(0 -6)">
      <circle r="5" fill="#9FB4E8" stroke="#7E95CF" strokeWidth="1" />
      <path d="M-3.5 -1.5q3.5-3 7 0M-3 2q3-2.5 6 0M-1 -4.5q2 5 0 9" fill="none" stroke="#7E95CF" strokeWidth="0.8" />
    </g>
  );
}

// A butterfly, its wings beating.
function Butterfly() {
  return (
    <g>
      <g className="motion-safe:animate-cat-flap" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        <path
          d="M0 0C-3-6-10-7-9-2-8 2-3 2 0 0zM0 0C3-6 10-7 9-2 8 2 3 2 0 0z"
          fill="#F4C6D0"
          stroke="#D99AAA"
          strokeWidth="0.7"
        />
        <path
          d="M0 0C-3 4-7 6-6 2-5 0-2 0 0 0zM0 0C3 4 7 6 6 2 5 0 2 0 0 0z"
          fill="#E8D6F2"
          stroke="#C3A8D6"
          strokeWidth="0.7"
        />
      </g>
      <path d="M0-3v6M0-3l-1.6-2.4M0-3l1.6-2.4" stroke="#8B6F7E" strokeWidth="0.8" strokeLinecap="round" />
    </g>
  );
}

// A bakery box with its flaps open: if it fits, it sits.
function Box() {
  return (
    <g>
      <path
        d="M-22-22l-7-7 9-1 3 8zM22-22l7-7-9-1-3 8z"
        fill="#EBCB98"
        stroke="#C49A62"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <rect x="-22" y="-22" width="44" height="22" rx="1.5" fill="#E4C08E" stroke="#C49A62" strokeWidth="1.2" />
      <path d="M-22-17.5h44" stroke="#C49A62" strokeWidth="0.8" opacity="0.6" />
      <circle cx="0" cy="-9" r="3.6" fill="#F3B9B3" stroke="#D99088" strokeWidth="0.8" />
      <path d="M-1.6-9.4q1.6-1.6 3.2 0" fill="none" stroke="#B66E66" strokeWidth="0.7" strokeLinecap="round" />
    </g>
  );
}

// One of the bakery's croissants, small, left on the edge.
const CROISSANT = PASTRIES.find((pastry) => pastry.the === 'the croissant');
function Croissant() {
  return (
    <g transform="scale(0.62) translate(-80 -83)">
      {CROISSANT.shapes.map(({ tag: Shape, topping: _topping, ...shape }, index) => (
        <Shape key={index} {...shape} />
      ))}
    </g>
  );
}

// A crumb of one of its fish-shaped cookies.
function Crumb() {
  return (
    <path
      d="M-4.5-2.2q4.5-3.4 9 0q-4.5 3.4-9 0zm9 0 2.4-2v4z"
      fill="#E39A55"
      stroke="#C47A35"
      strokeWidth="0.7"
      transform="translate(-1.5 -2.4)"
    />
  );
}

// A soft sunbeam slanting down onto the edge, with motes of dust in it.
function Sunbeam() {
  return (
    <g>
      <defs>
        <linearGradient id="cat-sunbeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE2A8" stopOpacity="0" />
          <stop offset="1" stopColor="#FFD58A" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <path d="M-4-170h30L44 0h-80z" fill="url(#cat-sunbeam)" />
      <ellipse cx="4" cy="0" rx="42" ry="3" fill="#FFD58A" opacity="0.35" />
      <g fill="#F5C76E" className="motion-safe:animate-cat-breathe">
        <circle cx="2" cy="-60" r="1" opacity="0.7" />
        <circle cx="16" cy="-110" r="0.8" opacity="0.6" />
        <circle cx="-8" cy="-30" r="0.9" opacity="0.6" />
        <circle cx="22" cy="-40" r="0.7" opacity="0.5" />
      </g>
    </g>
  );
}

// The toys it asks for in a thought bubble, each played its own way.

// A feather on a string, hanging from the pointer at (0, 0), swinging.
function Feather({ string = true }) {
  return (
    <g>
      {string && <path d="M0 0v22" stroke="#A3ADBB" strokeWidth="0.9" />}
      <circle cx="0" cy="22.5" r="1.6" fill="#E3B655" stroke="#C9973D" strokeWidth="0.6" />
      <path d="M0 24c-5 4-6 13-1 21 1 1.4 2 1.4 3 0 4-8 3-17-2-21z" fill="#F2B8C2" stroke="#D98E9C" strokeWidth="0.8" />
      <path
        d="M0.4 25v19M0.4 30l-3 2.5M0.4 35l-3.2 2.5M0.4 40l-2.6 2M0.4 30l3 2M0.4 35l3 2"
        fill="none"
        stroke="#D98E9C"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
    </g>
  );
}

// A laser pointer's dot on the edge.
function Laser() {
  return (
    <g>
      <circle r="6.5" fill="#F25C5C" opacity="0.16" className="motion-safe:animate-pulse" />
      <circle r="2.5" fill="#E5484D" />
      <circle r="1" cx="-0.6" cy="-0.6" fill="#FFD1D1" />
    </g>
  );
}

// A grey wind-up mouse, facing right, a key in its back.
function ToyMouse() {
  return (
    <g>
      <path d="M-9-1.5c-5 0-7.5-3-5.5-6" fill="none" stroke="#8E98A8" strokeWidth="1" strokeLinecap="round" />
      <path d="M-1-9v-3M-3.4-12h4.8" stroke="#C9973D" strokeWidth="1.2" strokeLinecap="round" />
      <path
        d="M-10 0c0-6 4.5-9 9.5-9S9 -6 11 0z"
        fill="#C3CAD5"
        stroke="#8E98A8"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="2.5" cy="-8" r="2.8" fill="#F3B9B3" stroke="#8E98A8" strokeWidth="0.9" />
      <circle cx="6.6" cy="-4" r="0.9" fill="#3B3346" />
      <circle cx="11" cy="-0.6" r="0.9" fill="#E49AA5" />
    </g>
  );
}

// A soap bubble, centred on (0, 0).
function Bubble() {
  return (
    <g>
      <circle r="7" fill="#D8E8FF" fillOpacity="0.35" stroke="#9DBCEB" strokeWidth="0.9" />
      <path d="M-4.2-2.6a5 5 0 0 1 3.4-2.4" fill="none" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );
}

const THINGS = {
  yarn: Yarn,
  butterfly: Butterfly,
  box: Box,
  croissant: Croissant,
  crumb: Crumb,
  sunbeam: Sunbeam,
  feather: Feather,
  laser: Laser,
  mouse: ToyMouse,
  bubble: Bubble,
};
// How far each reaches round its base, for the box it is drawn in.
const REACH = {
  yarn: 8,
  butterfly: 12,
  box: 32,
  croissant: 16,
  crumb: 8,
  sunbeam: 175,
  feather: 50,
  laser: 8,
  mouse: 16,
  bubble: 9,
};

// The toys, by what it calls them, for the thought bubble's label.
export const TOYS = {
  yarn: 'a ball of yarn',
  feather: 'the feather wand',
  laser: 'the laser pointer',
  mouse: 'the wind-up mouse',
  bubbles: 'bubbles',
};

// Each toy small, for the thought bubble, in a 24 x 24 box round (0, 0).
export function ToyIcon({ kind }) {
  switch (kind) {
    case 'yarn':
      return (
        <g transform="translate(0 7) scale(1.5)">
          <Yarn />
        </g>
      );
    case 'feather':
      return (
        <g transform="rotate(35) scale(0.6) translate(0 -34)">
          <Feather string={false} />
        </g>
      );
    case 'laser':
      return (
        <g>
          <path d="M-8 6-1-1" stroke="#8E98A8" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M1-3 5-7" stroke="#F25C5C" strokeWidth="1" strokeDasharray="1.4 1.4" opacity="0.8" />
          <circle cx="6.5" cy="-8" r="1.9" fill="#E5484D" />
        </g>
      );
    case 'mouse':
      return (
        <g transform="translate(1 5) scale(0.95)">
          <ToyMouse />
        </g>
      );
    default:
      return (
        <g>
          <g transform="translate(-3 2) scale(0.9)">
            <Bubble />
          </g>
          <g transform="translate(6 -5) scale(0.55)">
            <Bubble />
          </g>
          <g transform="translate(6 7) scale(0.4)">
            <Bubble />
          </g>
        </g>
      );
  }
}

// A thing at (x, y) on the page, turned and scaled and faded as it moves.
export function CatThing({ kind, x, y, rotate = 0, scale = 1, flip = 1, opacity = 1 }) {
  const Thing = THINGS[kind];
  const reach = REACH[kind];
  if (!Thing) return null;
  return (
    <svg
      aria-hidden="true"
      viewBox={`${-reach} ${-reach} ${2 * reach} ${2 * reach}`}
      width={2 * reach}
      height={2 * reach}
      className="absolute left-0 top-0 overflow-visible transition-opacity duration-500 motion-safe:animate-cat-pose-in"
      style={{
        transform: `translate(${x - reach}px, ${y - reach}px)`,
        opacity,
      }}
    >
      <g transform={`rotate(${rotate}) scale(${scale * flip} ${scale})`}>
        <Thing />
      </g>
    </svg>
  );
}

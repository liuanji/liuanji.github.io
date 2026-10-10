import { PASTRIES } from './pastries';

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

const THINGS = { yarn: Yarn, butterfly: Butterfly, box: Box, croissant: Croissant, crumb: Crumb, sunbeam: Sunbeam };
// How far each reaches round its base, for the box it is drawn in.
const REACH = { yarn: 8, butterfly: 12, box: 32, croissant: 16, crumb: 8, sunbeam: 175 };

// A thing at (x, y) on the page, turned and scaled and faded as it moves.
export function CatThing({ kind, x, y, rotate = 0, scale = 1, opacity = 1 }) {
  const Thing = THINGS[kind];
  const reach = REACH[kind];
  if (!Thing) return null;
  return (
    <svg
      aria-hidden="true"
      viewBox={`${-reach} ${-reach} ${2 * reach} ${2 * reach}`}
      width={2 * reach}
      height={2 * reach}
      className="absolute left-0 top-0 overflow-visible transition-opacity duration-500"
      style={{
        transform: `translate(${x - reach}px, ${y - reach}px)`,
        opacity,
      }}
    >
      <g transform={`rotate(${rotate}) scale(${scale})`}>
        <Thing />
      </g>
    </svg>
  );
}

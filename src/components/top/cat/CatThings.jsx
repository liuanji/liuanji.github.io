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

// A treat: one of its fish-shaped cookies, full size, centred on (0, 0).
function Treat() {
  return (
    <g transform="scale(1.7)">
      <path
        d="M-4.5 0q4.5-3.4 9 0q-4.5 3.4-9 0zm9 0 2.4-2v4z"
        fill="#E39A55"
        stroke="#C47A35"
        strokeWidth="0.6"
        transform="translate(-1.2 0)"
      />
      <circle cx="-3" cy="-0.5" r="0.45" fill="#7A4A22" />
    </g>
  );
}

// A little bowl of treats, with up to three left in it.
function TreatBowl({ count = 3 }) {
  return (
    <g>
      {[-5, 4, -0.5].slice(0, count).map((x, index) => (
        <g key={index} transform={`translate(${x} ${index === 2 ? -11.5 : -9}) rotate(${index ? -14 : 12})`}>
          <Treat />
        </g>
      ))}
      <path d="M-13-8h26l-3.4 8h-19.2z" fill="#9FB4E8" stroke="#7E95CF" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M-11-5.4h22" stroke="#C9D6F4" strokeWidth="1" strokeLinecap="round" />
    </g>
  );
}

// A bouncy rubber ball, centred on (0, 0).
function Ball() {
  return (
    <g>
      <circle r="4.6" fill="#F2B8C2" stroke="#D98E9C" strokeWidth="0.9" />
      <path d="M-4.4 1.2q4.4-2.6 8.8 0" fill="none" stroke="#FCE3E7" strokeWidth="1.1" />
      <circle cx="-1.6" cy="-1.8" r="0.9" fill="white" opacity="0.8" />
    </g>
  );
}

// A little bird, facing right, its wing beating (when flying), base at (0, 0).
function Bird({ flying = true }) {
  return (
    <g transform="translate(0 -6)">
      <path d="M-8 0l-5-2 1 3z" fill="#7E95CF" />
      <ellipse rx="7.5" ry="5.6" fill="#9FB4E8" stroke="#7E95CF" strokeWidth="0.9" />
      <ellipse cx="1" cy="1.6" rx="4.4" ry="3" fill="#E8EEFB" />
      <circle cx="6" cy="-3.4" r="3.6" fill="#9FB4E8" stroke="#7E95CF" strokeWidth="0.9" />
      <path d="M9.2-3.6l3 1-3 1z" fill="#E3B655" />
      <circle cx="7" cy="-4.2" r="0.8" fill="#3B3346" />
      <g
        className={flying ? 'motion-safe:animate-cat-flap' : undefined}
        style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}
      >
        <path d="M-3-2c-1-6 4-9 7-7-1 3-3 6-7 7z" fill="#B6C6EE" stroke="#7E95CF" strokeWidth="0.8" />
      </g>
      {!flying && <path d="M-1 5.6v1.6M2 5.6v1.6" stroke="#C49A62" strokeWidth="0.9" strokeLinecap="round" />}
    </g>
  );
}

// A ball of dough, patted flatter, baking golden (bake from 0 to 1) into a bun.
function Dough({ bake = 0 }) {
  const squash = 1 - 0.35 * Math.min(1, bake * 2);
  const mix = (a, b) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, bake * 2 - 1))).join(',')})`;
  const fill = mix([243, 226, 190], [227, 182, 85]);
  const edge = mix([205, 172, 120], [201, 151, 61]);
  return (
    <g transform={`scale(${2 - squash}, ${squash})`}>
      <path d="M-9 0c-1-6 3-10 9-10s10 4 9 10z" fill={fill} stroke={edge} strokeWidth="1.2" />
      {bake > 0.5 && <path d="M-4-5l2 2M1-6l2 2M5-4.6l1.6 1.8" stroke={edge} strokeWidth="1" strokeLinecap="round" />}
    </g>
  );
}

// A little comb, held by the pointer at (0, 0).
function Comb() {
  return (
    <g transform="rotate(-20)">
      <rect x="-10" y="-3" width="20" height="5" rx="2" fill="#C9A7D6" stroke="#9E7CB3" strokeWidth="0.8" />
      <path d="M-8 2v5M-5 2v5M-2 2v5M1 2v5M4 2v5M7 2v5" stroke="#9E7CB3" strokeWidth="1.1" strokeLinecap="round" />
    </g>
  );
}

// Claw marks scratched along an edge.
function Claws() {
  return <path d="M-6-1l3-3M-2-1l3-3M2-1l3-3" stroke="#C49A62" strokeWidth="1.1" strokeLinecap="round" opacity="0.8" />;
}

// Cracks in the glass, spreading as it is tapped (count: 1 to 3), centred on (0, 0).
function Cracks({ count = 1 }) {
  const lines = [
    'M0 0l-9-6-5 1M0 0l8-8 3-6M0 0l10 3',
    'M0 0l-6 11-6 4M0 0l4 12M-9-6l-4-8M8-8l9 0',
    'M10 3l8 7M4 12l6 8M-6 11l-10 2M-14-5l-8-3M11-14l3-8',
  ];
  return (
    <g
      fill="none"
      stroke="#7F8CA3"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="scale(1.45)"
    >
      <circle r="2.4" fill="#E6EBF2" stroke="#7F8CA3" strokeWidth="0.9" />
      {lines.slice(0, count).map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  );
}

// A shard of broken glass, centred on (0, 0).
function Shard() {
  return <path d="M-4-3l7-1-2 6z" fill="#E6EEF8" stroke="#A9B6C8" strokeWidth="0.8" strokeLinejoin="round" />;
}

// A balloon on a string, the string's end at (0, 0).
function Balloon() {
  return (
    <g>
      <path d="M0 0c-3-8 3-14 0-22" fill="none" stroke="#A3ADBB" strokeWidth="0.9" />
      <path d="M0-22l-2.4 3h4.8z" fill="#E79AA8" />
      <ellipse cx="0" cy="-34" rx="10" ry="12" fill="#F2B8C2" stroke="#D98E9C" strokeWidth="1" />
      <path d="M-5-40q2-4 6-4" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
    </g>
  );
}

// A few specks of dirt, dug up.
function Dirt() {
  return (
    <g fill="#B98B5A">
      <circle cx="-4" cy="-2" r="1.6" />
      <circle cx="2" cy="-4" r="1.2" />
      <circle cx="5" cy="-1" r="1.4" />
      <circle cx="-1" cy="-6" r="1" />
    </g>
  );
}

// A puff of smoke, for a vanishing trick, centred on (0, 0).
function Puff() {
  return (
    <g fill="#EEF1F6" stroke="#C5CDD9" strokeWidth="1">
      <circle cx="-9" cy="2" r="7" />
      <circle cx="8" cy="3" r="7.5" />
      <circle cx="0" cy="-5" r="9" />
      <circle cx="1" cy="6" r="7" />
    </g>
  );
}

// A little helicopter, rotor whirring, a rope hanging from it to a hook at
// (0, rope) below; its middle at (0, 0).
function Helicopter({ rope = 40 }) {
  return (
    <g>
      <path d={`M0 6V${rope}`} stroke="#A3ADBB" strokeWidth="1" />
      <path d={`M-3 ${rope}q0 4 3 4t3-4`} fill="none" stroke="#8E98A8" strokeWidth="1.4" />
      <path d="M14 -1h18l3-6" fill="none" stroke="#D9A066" strokeWidth="3" strokeLinecap="round" />
      <circle
        cx="35"
        cy="-7"
        r="3.4"
        fill="none"
        stroke="#A3ADBB"
        strokeWidth="1"
        className="motion-safe:animate-spin"
      />
      <ellipse cx="0" cy="-1" rx="16" ry="10" fill="#F2C27D" stroke="#C9973D" strokeWidth="1.2" />
      <path d="M-14-3a14 9 0 0 1 12-8v12h-12z" fill="#BFD3F2" stroke="#8EA6DF" strokeWidth="0.9" />
      <path d="M-10 10l-3 4h26M8 10l-2 4" fill="none" stroke="#8E98A8" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M0-11v-4" stroke="#8E98A8" strokeWidth="1.6" />
      <g
        className="motion-safe:animate-cat-flap"
        style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDuration: '0.12s' }}
      >
        <path d="M-26-15h52" stroke="#5B6474" strokeWidth="2" strokeLinecap="round" />
      </g>
    </g>
  );
}

// A wooden ladder, its top at (0, 0), reaching down rope pixels.
function Ladder({ rope = 100 }) {
  const rungs = Array.from({ length: Math.max(1, Math.floor(rope / 11)) }, (_, index) => 6 + index * 11);
  return (
    <g stroke="#B07A3E" strokeLinecap="round">
      <path d={`M-7 -2V${rope}M7 -2V${rope}`} strokeWidth="2.6" />
      <path d={rungs.map((y) => `M-7 ${y}H7`).join('')} strokeWidth="2" />
    </g>
  );
}

// A rope hanging from (0, 0) down rope pixels.
function Rope({ rope = 100 }) {
  return <path d={`M0 0V${rope}`} stroke="#C49A62" strokeWidth="2" strokeDasharray="5 2" strokeLinecap="round" />;
}

// A little parachute, its strings meeting at (0, 0), the canopy above.
function Parachute() {
  return (
    <g>
      <path d="M0 0L-17-40M0 0L-6-42M0 0L6-42M0 0L17-40" stroke="#A3ADBB" strokeWidth="0.8" />
      <path
        d="M-22-38c0-14 10-22 22-22s22 8 22 22c-4-3-7-3-11 0-4-3-7-3-11 0-4-3-7-3-11 0-4-3-7-3-11 0z"
        fill="#F2B8C2"
        stroke="#D98E9C"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M-11-38c0-12 5-20 11-21M11-38c0-12-5-20-11-21" fill="none" stroke="#E79AA8" strokeWidth="0.9" />
    </g>
  );
}

// A small trampoline, the top of its mat at (0, 0).
function Trampoline() {
  return (
    <g>
      <path d="M-20 2l-4 10M20 2l4 10" stroke="#8E98A8" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="0" cy="2" rx="24" ry="4" fill="#9FB4E8" stroke="#7E95CF" strokeWidth="1.2" />
      <path d="M-18 2h36" stroke="#C9D6F4" strokeWidth="1" />
    </g>
  );
}

// A big soap bubble to float in, centred on (0, 0).
function BigBubble() {
  return (
    <g>
      <circle r="40" fill="#D8E8FF" fillOpacity="0.28" stroke="#9DBCEB" strokeWidth="1.2" />
      <path
        d="M-26-18a30 30 0 0 1 18-16"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path d="M22 24a30 30 0 0 1-8 7" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
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
  treat: Treat,
  ball: Ball,
  bird: Bird,
  dough: Dough,
  comb: Comb,
  claws: Claws,
  cracks: Cracks,
  shard: Shard,
  balloon: Balloon,
  dirt: Dirt,
  puff: Puff,
  heli: Helicopter,
  ladder: Ladder,
  rope: Rope,
  parachute: Parachute,
  trampoline: Trampoline,
  bigbubble: BigBubble,
  bowl: TreatBowl,
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
  treat: 12,
  ball: 7,
  bird: 16,
  dough: 22,
  comb: 14,
  claws: 8,
  cracks: 38,
  shard: 7,
  balloon: 48,
  dirt: 8,
  puff: 18,
  heli: 60,
  ladder: 20,
  rope: 10,
  parachute: 30,
  trampoline: 28,
  bigbubble: 44,
  bowl: 20,
};

// What it may wish for in a thought bubble, as its label puts it: a toy to
// play with, a treat, or a dance.
export const WISHES = {
  yarn: 'play with a ball of yarn',
  feather: 'play with the feather wand',
  laser: 'play with the laser pointer',
  mouse: 'play with the wind-up mouse',
  bubbles: 'play with bubbles',
  treat: 'have a treat',
  dance: 'dance',
  rub: 'have a belly rub',
  brush: 'be brushed',
  photo: 'pose for a photo',
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
    case 'treat':
      return (
        <g transform="rotate(-15) scale(1.15)">
          <Treat />
        </g>
      );
    case 'rub':
      return (
        <g>
          <ellipse cx="0" cy="3" rx="5.4" ry="4.4" fill="#FCEBD6" stroke="#C98A50" strokeWidth="1" />
          {[-5, -1.6, 1.6, 5].map((x, index) => (
            <ellipse
              key={index}
              cx={x}
              cy={index % 3 ? -4.6 : -3}
              rx="1.8"
              ry="2"
              fill="#FCEBD6"
              stroke="#C98A50"
              strokeWidth="0.9"
            />
          ))}
          <path
            d="M0 2.4c-1-1.6-3.4-.8-2.8 1 .4 1.4 2.8 2.6 2.8 2.6s2.4-1.2 2.8-2.6c.6-1.8-1.8-2.6-2.8-1z"
            fill="#F08A93"
          />
        </g>
      );
    case 'brush':
      return (
        <g transform="scale(0.9)">
          <Comb />
        </g>
      );
    case 'photo':
      return (
        <g>
          <rect x="-9" y="-5" width="18" height="12" rx="2.4" fill="#8E98A8" />
          <rect x="-4" y="-8" width="6" height="4" rx="1" fill="#8E98A8" />
          <circle cx="0" cy="1" r="4" fill="#DCE2EA" stroke="#5B6474" strokeWidth="1" />
          <circle cx="0" cy="1" r="1.6" fill="#5B6474" />
          <circle cx="6" cy="-2.4" r="1" fill="#F2C94C" />
        </g>
      );
    case 'dance':
      return (
        <g fill="#B07AA1">
          <path d="M-6 5.5a2.6 2 0 1 1-1.6-1.9V-6l7-2v9.4a2.6 2 0 1 1-1.6-1.9v-6.2l-3.8 1.1z" />
          <path d="M6 1.5a2.2 1.7 0 1 1-1.4-1.6V-8l4.4 1.6-0.6 1.6-2.4-.8z" fill="#E39A55" />
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
export function CatThing({
  kind,
  x,
  y,
  rotate = 0,
  scale = 1,
  flip = 1,
  opacity = 1,
  count,
  string,
  flying,
  bake,
  rope,
}) {
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
        <Thing count={count} string={string} flying={flying} bake={bake} rope={rope} />
      </g>
    </svg>
  );
}

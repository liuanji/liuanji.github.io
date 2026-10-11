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

// A little flying saucer (the helicopter's stand-in, half the time), its
// middle at (0, 0): a glass dome with a small alien in it, soft lights round
// its rim, and a beam of light shining down to (0, rope) (none at 0).
function Ufo({ rope = 40 }) {
  const spread = 10 + rope * 0.28;
  const lights = ['#F2C27D', '#F2B8C2', '#BFD3F2', '#B9D6B2', '#F2C27D'];
  return (
    <g>
      {rope > 2 && (
        <g>
          <path d={`M-7 4L${-spread} ${rope}H${spread}L7 4z`} fill="#FFF3C4" opacity="0.45" />
          <path d={`M-4 4L${-spread * 0.55} ${rope}H${spread * 0.55}L4 4z`} fill="#FFF8DE" opacity="0.55" />
          {[0.35, 0.65, 0.95].map((at) => (
            <ellipse
              key={at}
              cx="0"
              cy={4 + (rope - 4) * at}
              rx={7 + (spread - 7) * at}
              ry={1.4 + at}
              fill="none"
              stroke="#EAD79A"
              strokeWidth="0.8"
              opacity="0.6"
            />
          ))}
        </g>
      )}
      <path d="M-10.5-2.5a10.5 10 0 0 1 21 0z" fill="#DCE8F5" stroke="#9BB0CC" strokeWidth="1" />
      <ellipse cx="0" cy="-5.6" rx="3.8" ry="3.4" fill="#BCD7B4" />
      <path d="M-1.8-8.6l-1.2-2.8M1.8-8.6l1.2-2.8" stroke="#9CC193" strokeWidth="0.8" strokeLinecap="round" />
      <circle cx="-3" cy="-11.6" r="0.8" fill="#9CC193" />
      <circle cx="3" cy="-11.6" r="0.8" fill="#9CC193" />
      <circle cx="-1.4" cy="-6" r="1" fill="#3B3346" />
      <circle cx="1.4" cy="-6" r="1" fill="#3B3346" />
      <path d="M-6-8.4q2-3 5.6-3.2" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
      <ellipse cx="0" cy="0" rx="24" ry="6.5" fill="#C9CEDB" stroke="#8C95AB" strokeWidth="1.2" />
      <ellipse cx="0" cy="-1.6" rx="17" ry="2.4" fill="#DCE0EA" />
      {[-15, -7.5, 0, 7.5, 15].map((x, index) => (
        <circle
          key={x}
          cx={x}
          cy="2.4"
          r="1.4"
          fill={lights[index]}
          className="motion-safe:animate-pulse"
          style={{ animationDelay: `${-index * 0.3}s` }}
        />
      ))}
      <ellipse cx="0" cy="5" rx="7" ry="2.2" fill="#A9B2C6" />
    </g>
  );
}

// Beds for a nap, each standing on the edge with its bottom middle at (0, 0):
// the part behind the cat (layer "back") and the part in front of it, which
// it sinks in behind (layer "front"). A wicker bread basket lined with a
// gingham cloth; a round proofing basket (a banneton), ridged and floury; a
// plush bed like a doughnut, iced and sprinkled; a flour sack; a big
// croissant cushion; and a gingham tea towel, which it sleeps under (only a
// front, draped over the far end of a curled-up cat facing left).
const GINGHAM = { base: '#FBF1EE', check: '#E7B3AE', edge: '#D49A94' };
function Gingham({ d, id }) {
  return (
    <g>
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
      <path d={d} fill={GINGHAM.base} />
      <g clipPath={`url(#${id})`} fill={GINGHAM.check} opacity="0.75">
        {Array.from({ length: 14 }, (_, index) => (
          <rect key={`v${index}`} x={-40 + index * 6} y="-40" width="3" height="60" opacity="0.6" />
        ))}
        {Array.from({ length: 10 }, (_, index) => (
          <rect key={`h${index}`} x="-45" y={-40 + index * 6} width="90" height="3" opacity="0.6" />
        ))}
      </g>
      <path d={d} fill="none" stroke={GINGHAM.edge} strokeWidth="1" strokeLinejoin="round" />
    </g>
  );
}
function Bed({ variant = 'basket', layer = 'back' }) {
  const front = layer === 'front';
  if (variant === 'basket') {
    return front ? (
      <g>
        <path
          d="M-37-15A37 7.5 0 0 0 37-15L33-2Q31 0 27 0H-27Q-31 0-33-2Z"
          fill="#E4C08E"
          stroke="#C49A62"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M-34-6.6Q0 1 34-6.6M-35.4-11Q0-2.6 35.4-11M-24-6.6v6M-12-4.6v4.6M0-4v4M12-4.6v4.6M24-6.6v6"
          fill="none"
          stroke="#C49A62"
          strokeWidth="0.8"
          opacity="0.7"
        />
        <Gingham id="basket-cloth" d="M-37-15A37 7.5 0 0 0-14-8.2L-20 2-27-6-34 1Z" />
      </g>
    ) : (
      <g>
        <ellipse cx="0" cy="-15" rx="37" ry="7.5" fill="#D2A872" stroke="#C49A62" strokeWidth="1.2" />
        <ellipse cx="0" cy="-14.4" rx="31" ry="5" fill="#C29560" />
      </g>
    );
  }
  if (variant === 'banneton') {
    return front ? (
      <g>
        <path
          d="M-34-16A34 8 0 0 0 34-16Q33-4 26-1Q23 0 18 0H-18Q-23 0-26-1Q-33-4-34-16Z"
          fill="#EBD3A6"
          stroke="#C9A46C"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M-33.2-12Q0-1.6 33.2-12M-31-7.6Q0 1.2 31-7.6M-26.6-3.4Q0 3.6 26.6-3.4"
          fill="none"
          stroke="#C9A46C"
          strokeWidth="1"
          opacity="0.75"
        />
        <g fill="white" opacity="0.8">
          <circle cx="-14" cy="-9" r="0.9" />
          <circle cx="6" cy="-6" r="0.7" />
          <circle cx="19" cy="-10" r="0.8" />
          <circle cx="-4" cy="-3" r="0.6" />
        </g>
      </g>
    ) : (
      <g>
        <ellipse cx="0" cy="-16" rx="34" ry="8" fill="#DDBF8C" stroke="#C9A46C" strokeWidth="1.2" />
        <ellipse cx="0" cy="-15.4" rx="28" ry="5.4" fill="#F4ECDD" />
        <ellipse cx="0" cy="-15.4" rx="20" ry="3.6" fill="none" stroke="#E2D2B4" strokeWidth="0.8" />
      </g>
    );
  }
  if (variant === 'donut') {
    // A plush ring, thick and rounded: its far side rising behind the cat,
    // its near side in front, iced pink and sprinkled, the icing dripping
    // over its front, the cat curled up in the soft hollow in the middle.
    const sprinkle = ([x, y, angle, color]) => (
      <rect
        key={`${x},${y}`}
        x={x - 2}
        y={y - 0.7}
        width="4"
        height="1.4"
        rx="0.7"
        fill={color}
        transform={`rotate(${angle} ${x} ${y})`}
      />
    );
    if (!front) {
      return (
        <g>
          <ellipse cx="0" cy="-15" rx="44" ry="15" fill="#E3B783" stroke="#C99E6C" strokeWidth="1.2" />
          <ellipse cx="0" cy="-18" rx="41" ry="11.5" fill="#F2C1CC" />
          <ellipse cx="0" cy="-18" rx="29" ry="6" fill="#D6A877" />
          <ellipse cx="0" cy="-17" rx="23" ry="3.6" fill="#E9C9A0" opacity="0.7" />
          {[
            [-35, -21, 30, '#B9D6B2'],
            [-18, -26.6, -20, '#BFD3F2'],
            [0, -27.4, 60, '#F2C27D'],
            [17, -26.6, -40, '#B9D6B2'],
            [35, -21.2, 20, '#BFD3F2'],
          ].map(sprinkle)}
        </g>
      );
    }
    return (
      <g>
        <path
          d="M-29-18A29 6 0 0 0 29-18L44-15A44 15 0 0 1-44-15Z"
          fill="#E3B783"
          stroke="#C99E6C"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d="M-38-7.6A44 15 0 0 0 38-7.6" fill="none" stroke="#D2A26C" strokeWidth="2.4" opacity="0.5" />
        <path d="M-29-18A29 6 0 0 0 29-18L41-18A41 11.5 0 0 1-41-18Z" fill="#F2C1CC" />
        <path
          d="M-29.6-9.6v2.8a1.6 1.6 0 0 0 3.2 0v-3.4zM4-6.8v3a1.7 1.7 0 0 0 3.4 0v-3.1zM27.6-10.2v2.4a1.5 1.5 0 0 0 3 0v-3.2z"
          fill="#F2C1CC"
        />
        <path
          d="M-16-11.2Q0-8.8 16-11.2"
          fill="none"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.6"
        />
        {[
          [-34, -13.6, 40, '#BFD3F2'],
          [-17, -10.2, -30, '#F2C27D'],
          [-3, -8.8, 70, '#B9D6B2'],
          [15, -10.2, -10, '#BFD3F2'],
          [33, -13.4, 30, '#F2C27D'],
        ].map(sprinkle)}
      </g>
    );
  }
  if (variant === 'sack') {
    if (front) return null;
    return (
      <g>
        <path
          d="M-37 0C-40-6-39-13-34-15.6-38-18-36-21-32-19.4-14-21.6 14-21.6 32-19.4 36-21 38-18 34-15.6 39-13 40-6 37 0Z"
          fill="#EFE6D6"
          stroke="#C8B89A"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d="M-31-16.8Q0-19 31-16.8" fill="none" stroke="#C8B89A" strokeWidth="0.8" strokeDasharray="2 1.6" />
        <text
          x="0"
          y="-6"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="6.4"
          fontWeight="600"
          letterSpacing="0.8"
          fill="#9AAAC8"
        >
          FLOUR
        </text>
        <path d="M-17-12.2l2 2.2M-15-12.2l-2 2.2M15-12.2l2 2.2M17-12.2l-2 2.2" stroke="#C9B38A" strokeWidth="0.8" />
      </g>
    );
  }
  if (variant === 'croissant') {
    if (front) return null;
    // Its lobes, from the tips (curling down) in to the plump middle one.
    const lobes = [
      [-33, -5, 7.5, 5.4, -40],
      [33, -5, 7.5, 5.4, 40],
      [-21, -10, 11.5, 9, -22],
      [21, -10, 11.5, 9, 22],
      [0, -12.5, 15, 12, 0],
    ];
    return (
      <g>
        {lobes.map(([x, y, rx, ry, angle]) => (
          <g key={x} transform={`rotate(${angle} ${x} ${y})`}>
            <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#EBBE7E" stroke="#C98E4A" strokeWidth="1.2" />
            <path
              d={`M${x - rx * 0.55} ${y - ry * 0.45}q${rx * 0.55} ${-ry * 0.42} ${rx * 1.1} 0`}
              fill="none"
              stroke="#F6DCAE"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>
    );
  }
  // The tea towel, draped over the cat's back half: following the curve of
  // its back, falling to the edge past its rump, a folded edge by its
  // shoulder, a stripe along its hem and a little fringe.
  if (!front) return null;
  const towel =
    'M-3.6-18.9C1-20.7 10-20.9 17-19.5 24-18.1 28.6-12.9 29.6-6L30.4 0H-2.4C-1.2-3.8-0.4-7.8-1.2-11.2-1.8-14-2.6-16.8-3.6-18.9Z';
  return (
    <g>
      <Gingham id="towel" d={towel} />
      <clipPath id="towel-hem">
        <path d={towel} />
      </clipPath>
      <path d="M-4-3.4H31" stroke={GINGHAM.edge} strokeWidth="1.3" opacity="0.8" clipPath="url(#towel-hem)" />
      <path
        d="M-1.4-0.8C-0.4-4.6 0.4-8 -0.4-11.4-1-14-1.8-16.4-2.6-18.2"
        fill="none"
        stroke={GINGHAM.edge}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M3-17.6Q11-19.8 19-17.6"
        fill="none"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d={Array.from({ length: 12 }, (_, index) => `M${(0.2 + index * 2.6).toFixed(1)} 0.4v2`).join('')}
        stroke={GINGHAM.edge}
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </g>
  );
}
// How high a cat lies in (or on) each bed, from the edge.
export const BED_LIFT = { basket: 2, banneton: 2, donut: 8, sack: 17, croissant: 21, towel: 0 };

// A dream, in a cloud over a sleeping cat's head: a fish-shaped cookie. The
// little bubbles leading up to it start at (0, 0).
function Dream() {
  return (
    <g>
      <circle cx="0" cy="0" r="1.6" fill="white" stroke="#CBD5E1" strokeWidth="0.9" />
      <circle cx="5" cy="-6" r="2.6" fill="white" stroke="#CBD5E1" strokeWidth="0.9" />
      <path
        d="M4-20c-3-7 5-12 10-8 2-5 11-5 13 0 5-2 10 3 7 8 4 3 1 9-4 8-2 4-9 5-12 1-4 3-11 2-12-2-5 0-6-5-2-7z"
        fill="white"
        stroke="#CBD5E1"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M11-21.4q5-4 10 0q-5 4-10 0zm10 0 2.6-2.4v4.8z" fill="#E39A55" stroke="#C47A35" strokeWidth="0.6" />
    </g>
  );
}

// Treats besides its cookies.
// A warm taiyaki, a fish-shaped cake from the bakery, lying on the edge (its
// bottom at y = 0) head to the left, steaming while hot (bake, 0 to 1), with
// bites (count, up to 3) taken from its tail end.
function Taiyaki({ count = 0, bake = 0 }) {
  const bites = [
    [17, -8, 5.6],
    [10, -8.5, 6.6],
    [2, -8, 7.6],
  ].slice(0, count);
  return (
    <g>
      {bake > 0.02 && (
        <path
          d="M-6-19q-2.4-3 0-6t0-6M0-21q-2.4-3 0-6t0-6M6-19q-2.4-3 0-6t0-6"
          fill="none"
          stroke="#D3DAE5"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity={bake}
          className="motion-safe:animate-pulse"
        />
      )}
      <mask id="taiyaki-bites">
        <rect x="-20" y="-20" width="44" height="24" fill="white" />
        {bites.map(([x, y, r]) => (
          <circle key={x} cx={x} cy={y} r={r} fill="black" />
        ))}
      </mask>
      <g mask="url(#taiyaki-bites)">
        <path
          d="M-15-8C-15-14-9-16-2-15.6 5-15 10-13 12-10.4L17-14C18.4-9.6 18.4-6.4 17-2L12-5.6C10-2.8 5-.6-2-.4-9-.2-15-2-15-8Z"
          fill="#E2A95E"
          stroke="#B97A35"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path
          d="M-3-11.4q2-2 4 0M3-11.4q2-2 4 0M0-7.4q2-2 4 0M6-7.4q2-2 4 0M-6-7.4q2-2 4 0"
          fill="none"
          stroke="#B97A35"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path d="M-7.4-13q1.8 5 0 10" fill="none" stroke="#B97A35" strokeWidth="0.9" strokeLinecap="round" />
        <circle cx="-11" cy="-9.6" r="1.3" fill="#5B4636" />
        <path d="M-12-13.4q3-1.6 6-.6" fill="none" stroke="#F3CF96" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </g>
  );
}

// A birthday cupcake on the edge (its bottom at y = 0): a pleated paper case,
// a swirl of frosting (bake: how much of it is left, 0 to 1) with sprinkles,
// and a candle, lit (count 1), or blown out and smoking (count 0).
function Cupcake({ count = 1, bake = 1 }) {
  return (
    <g>
      <path d="M-9.4-12h18.8L6.4 0h-12.8z" fill="#BFD3F2" stroke="#8EA6DF" strokeWidth="1" strokeLinejoin="round" />
      <path d="M-6.2-11.4l1 11M-2.1-11.4l.4 11M2.1-11.4l-.4 11M6.2-11.4l-1 11" stroke="#8EA6DF" strokeWidth="0.7" />
      <path d="M-9.8-12c.4-1.8 1.6-2.8 3-2.8h13.6c1.4 0 2.6 1 3 2.8z" fill="#C89A6A" />
      {bake > 0.02 && (
        <g transform={`translate(0 -13) scale(1 ${bake.toFixed(3)}) translate(0 13)`}>
          <path
            d="M-10.4-13c-1.2-3.6 1.4-5.8 4.4-5.6-.6-3.6 2.6-5.8 6-5 3.2-.8 6.4 1.4 5.8 5 3-.2 5.6 2 4.4 5.6z"
            fill="#FFF4EC"
            stroke="#E7C9C2"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <path d="M-5.6-17.6q5.6 2.2 11.2 0M-2.8-21.6q2.8 1.4 5.6 0" fill="none" stroke="#E7C9C2" strokeWidth="0.8" />
          {[
            [-6, -15.2, 30, '#B9D6B2'],
            [3, -16, -40, '#BFD3F2'],
            [-1.6, -19.6, 70, '#F2C27D'],
            [6.4, -14.4, 10, '#F2B8C2'],
          ].map(([x, y, angle, color]) => (
            <rect
              key={x}
              x={x - 1.6}
              y={y - 0.6}
              width="3.2"
              height="1.2"
              rx="0.6"
              fill={color}
              transform={`rotate(${angle} ${x} ${y})`}
            />
          ))}
        </g>
      )}
      {bake > 0.6 && (
        <g>
          <rect x="-1.2" y="-33" width="2.4" height="9.6" rx="0.8" fill="#F2B8C2" stroke="#D98E9C" strokeWidth="0.6" />
          <path d="M-1.2-30.6l2.4-1.4M-1.2-27.4l2.4-1.4" stroke="white" strokeWidth="0.7" />
          <path d="M0-33v-1.6" stroke="#5B6474" strokeWidth="0.6" />
          {count > 0 ? (
            <g className="motion-safe:animate-pulse">
              <circle cx="0" cy="-37.6" r="4.6" fill="#FCE9B8" opacity="0.45" />
              <path d="M0-41.6c-2.4 3-2.6 5-.2 6.4 2.6-1.4 2.6-3.4.2-6.4z" fill="#F4C46A" />
              <path d="M0-39.2c-1 1.4-1 2.4 0 3 1-.6 1-1.6 0-3z" fill="#FCE9B8" />
            </g>
          ) : (
            <path d="M0-35c-2-3 2-5 0-8s2-5 0-8" fill="none" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" />
          )}
        </g>
      )}
    </g>
  );
}

// A frosting moustache, its middle at (0, 0).
function Frosting() {
  return (
    <path
      d="M-5.6 1c-1.2-2.4 1-4 3-3 .8-1.8 3.6-1.8 4.4 0 2-1 4.2.6 3 3z"
      fill="#FFF4EC"
      stroke="#E7C9C2"
      strokeWidth="0.7"
      strokeLinejoin="round"
    />
  );
}

// A little conveyor belt for sushi, lying along the edge from (0, 0) for rope
// pixels to the right, the marks on its belt carried along (count: how far).
function Conveyor({ rope = 160, count = 0 }) {
  const marks = [];
  for (let x = 4 + (((count % 10) + 10) % 10); x < rope - 3; x += 10) marks.push(x);
  return (
    <g>
      <rect x="0" y="-7" width={rope} height="7" rx="3.5" fill="#B9C0CD" stroke="#8C95AB" strokeWidth="1" />
      <path d={`M3.4-5.6H${rope - 3.4}`} stroke="#D6DBE4" strokeWidth="1.2" strokeLinecap="round" />
      <path d={marks.map((x) => `M${x.toFixed(1)} -6v2.4`).join('')} stroke="#8C95AB" strokeWidth="0.8" />
      <circle cx="3.6" cy="-3.5" r="2" fill="#A3ADBB" />
      <circle cx={rope - 3.6} cy="-3.5" r="2" fill="#A3ADBB" />
    </g>
  );
}

// A plate of sushi standing at (0, 0): salmon or egg (tamago) nigiri, a
// gunkan of salmon roe (ikura) wrapped in nori, or (empty) just the plate, its
// rim's colour giving its price as in a sushi bar.
const SUSHI_RIMS = { salmon: '#E7A8A0', tamago: '#9FB4E8', ikura: '#9CC193', empty: '#E7A8A0' };
function Sushi({ variant = 'salmon' }) {
  return (
    <g>
      <ellipse cx="0" cy="-1.6" rx="10" ry="2.4" fill="white" stroke={SUSHI_RIMS[variant]} strokeWidth="1.4" />
      {(variant === 'salmon' || variant === 'tamago') && (
        <rect x="-6" y="-7.6" width="12" height="5" rx="2.4" fill="#FBFAF6" stroke="#D9D4C8" strokeWidth="0.7" />
      )}
      {variant === 'salmon' && (
        <g>
          <path
            d="M-7.4-7.6c0-2.4 3-3.4 7.4-3.4s7.4 1 7.4 3.4c-2 .8-12.8.8-14.8 0z"
            fill="#F0A57C"
            stroke="#D98A62"
            strokeWidth="0.7"
          />
          <path
            d="M-4.4-9.6l1.4 1.6M-1-10l1.4 1.8M2.4-9.8l1.4 1.6"
            stroke="#FBE3D6"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        </g>
      )}
      {variant === 'tamago' && (
        <g>
          <rect x="-7" y="-11.4" width="14" height="4.2" rx="1.4" fill="#F4D58D" stroke="#D9B65E" strokeWidth="0.7" />
          <rect x="-1.6" y="-11.8" width="3.2" height="9.4" fill="#5B6474" />
        </g>
      )}
      {variant === 'ikura' && (
        <g>
          <rect x="-6.4" y="-9.4" width="12.8" height="7.6" rx="2" fill="#4A5262" />
          <path d="M-5.4-8.4h10.8" stroke="#6B7484" strokeWidth="0.8" />
          {[-3.8, -1.3, 1.3, 3.8, -2.5, 0, 2.5].map((x, index) => (
            <circle
              key={index}
              cx={x}
              cy={index < 4 ? -10.4 : -12.2}
              r="1.4"
              fill="#F2A07B"
              stroke="#D9825C"
              strokeWidth="0.5"
            />
          ))}
        </g>
      )}
    </g>
  );
}

// Gradient descent: a loss curve, as a little chart standing on the edge with
// its lowest point (the global minimum) at (0, 0). From its start, LOSS.width
// × LOSS.low to the right, it falls into a dip (a local minimum) at
// LOSS.dip of the way along, over a hump, and down to the lowest point at
// LOSS.low, rising a little after. Axes, "loss" and "θ".
export const LOSS = {
  width: 150,
  dip: 0.32,
  low: 0.8,
  end: 0.95,
  // Its height above the edge a share u of the way along.
  height: (u) => 2 + (46 * (u - 0.8) ** 2) / 0.64 - 14 * Math.exp(-(((u - 0.32) / 0.07) ** 2)),
};
function Loss({ flip = 1 }) {
  const points = Array.from({ length: 61 }, (_, index) => {
    const u = (index / 60) * LOSS.end;
    return [(LOSS.low - u) * LOSS.width, -LOSS.height(u)];
  });
  const line = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  const start = points[0][0];
  const end = points[points.length - 1][0];
  // Its words read the right way round however it is turned.
  const label = (x, y, text, extra = {}) => (
    <text
      x="0"
      y="0"
      transform={`translate(${x} ${y}) scale(${flip} 1)`}
      textAnchor="middle"
      fontFamily="JetBrains Mono, monospace"
      fontSize="6"
      fill="#A3ADBB"
      {...extra}
    >
      {text}
    </text>
  );
  return (
    <g>
      <path d={`${line}L${end.toFixed(1)} 0L${start.toFixed(1)} 0Z`} fill="#F3E6D6" opacity="0.7" />
      <path d={`M${start + 4} -54V0H${end - 6}`} fill="none" stroke="#C2CAD6" strokeWidth="0.9" />
      <path
        d={`M${start + 2} -51.6l2-2.4 2 2.4M${end - 3.6} -2l-2.4 2 2.4 2`}
        fill="none"
        stroke="#C2CAD6"
        strokeWidth="0.9"
      />
      <path d={line} fill="none" stroke="#D08C5B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {label(start + 11, -46, 'loss')}
      {label(end - 4, -5, 'θ')}
    </g>
  );
}

// Gone fishing: a little rod held at (0, 0), reaching up and out to the
// right, its line hanging rope pixels from the tip with a float a little way
// above the hook, and (count 1) a fish-shaped cookie caught on it.
function Rod({ rope = 0, count = 0 }) {
  const tip = { x: 34, y: -30 };
  const end = tip.y + rope;
  return (
    <g>
      <path d={`M0 0Q16-19 ${tip.x} ${tip.y}`} fill="none" stroke="#B07A3E" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="5" cy="-4.6" r="2.6" fill="#E3CCA6" stroke="#B07A3E" strokeWidth="0.9" />
      {rope > 1 && (
        <g>
          <path d={`M${tip.x} ${tip.y}V${end}`} stroke="#A3ADBB" strokeWidth="0.7" />
          {rope > 16 && (
            <g>
              <circle cx={tip.x} cy={end - 12} r="2.5" fill="#F2B8B0" stroke="#D98E86" strokeWidth="0.7" />
              <path d={`M${tip.x - 2.5} ${end - 12}h5`} stroke="white" strokeWidth="1.2" />
            </g>
          )}
          <path d={`M${tip.x} ${end}q0 3.4 2.4 3.4t2-2.6`} fill="none" stroke="#8E98A8" strokeWidth="0.9" />
          {count > 0 && (
            <g transform={`translate(${tip.x + 1.6} ${end + 9}) rotate(90)`}>
              <path
                d="M-5.4 0q5.4-4 10.8 0q-5.4 4-10.8 0zm10.8 0 2.8-2.4v4.8z"
                fill="#E39A55"
                stroke="#C47A35"
                strokeWidth="0.7"
              />
            </g>
          )}
        </g>
      )}
    </g>
  );
}

// Toys besides its old favourites.
// A little robot vacuum on the edge (its wheels at y = 0): a soft light on
// top, and a side brush whirling at its front (to the right).
function Roomba() {
  return (
    <g>
      <rect x="-26" y="-12" width="52" height="11" rx="5.5" fill="#D9DEE8" stroke="#8C95AB" strokeWidth="1.1" />
      <path d="M-22.6-10.2h45.2" stroke="#EEF1F6" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M-25.4-4.4h50.8" stroke="#AEB7C6" strokeWidth="1.8" />
      <circle cx="0" cy="-10.4" r="1.5" fill="#8FD3B4" className="motion-safe:animate-pulse" />
      <ellipse cx="-14" cy="-0.6" rx="3" ry="1.3" fill="#5B6474" />
      <ellipse cx="14" cy="-0.6" rx="3" ry="1.3" fill="#5B6474" />
      <g
        className="motion-safe:animate-spin"
        style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDuration: '0.6s' }}
      >
        <path
          d="M24.5-5l4 1.2M24.5-5l-1.2 4M24.5-5l-4-1.2M24.5-5l1.2-4"
          stroke="#8E98A8"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}

// A paper aeroplane, its middle at (0, 0), flying to the right.
function Plane() {
  return (
    <g transform="scale(1.35)">
      <path d="M-13-1 14-4-11-9-8-3.6z" fill="white" stroke="#A3ADBB" strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M-8-3.6 14-4-13-1z" fill="#EEF1F6" stroke="#A3ADBB" strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M-4-6.6l3 1.2" stroke="#D9C2A0" strokeWidth="0.8" strokeLinecap="round" />
    </g>
  );
}
// A ball of crumpled paper, its middle at (0, 0).
function PaperBall() {
  return (
    <g>
      <circle r="4.6" fill="#F6F7F9" stroke="#A3ADBB" strokeWidth="0.9" />
      <path d="M-3-1l2 1 1-2.4 2 1.4M-2 2.4l1.6-1.6 1.8 1.2" fill="none" stroke="#C2CAD6" strokeWidth="0.7" />
    </g>
  );
}

// A paper bag from the bakery, standing on the edge (its bottom at y = 0, its
// open top BAG_HEIGHT up), crumpled at the rim, stamped with a little
// croissant.
export const BAG_HEIGHT = 30;
function PaperBag() {
  return (
    <g>
      <path
        d="M-17 0-16-28-13.4-30-10-28.4-6.6-30.4-3.2-28.6 0-30.6 3.4-28.6 6.8-30.4 10.2-28.6 13.4-30.4 16-29 17 0Z"
        fill="#DCBB8E"
        stroke="#B48E5A"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M-11-27v26M11-27v26" stroke="#C9A877" strokeWidth="0.8" opacity="0.8" />
      <path d="M-16.4-25.4h32.8" stroke="#C9A877" strokeWidth="0.8" />
      <path
        d="M-6-12.4c-.6-2 1-3.6 2.6-3.2.8-1.8 3.6-2 4.8-.4 1.6-1 3.8 0 3.6 2 1.6.4 1.8 2.4.2 3z"
        fill="#E9C9A0"
        stroke="#B48E5A"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <path d="M-2.6-12.6l.6-2.4M1.2-12.4v-2.8M4.2-12l-.6-2.2" stroke="#B48E5A" strokeWidth="0.6" />
    </g>
  );
}

// A strip of bubble wrap lying along the edge from (0, 0), 96 pixels to the
// right, the first count of its twelve bubbles popped.
function Wrap({ count = 0 }) {
  return (
    <g>
      <rect x="0" y="-1.6" width="96" height="1.8" rx="0.9" fill="#E6EEF8" stroke="#A9B6C8" strokeWidth="0.7" />
      {Array.from({ length: 12 }, (_, index) => {
        const x = 4 + index * 8;
        return index < count ? (
          <path
            key={index}
            d={`M${x - 3.2} -1.8l1.6-.9 1.6.9 1.6-.9 1.6.9`}
            fill="none"
            stroke="#A9B6C8"
            strokeWidth="0.7"
          />
        ) : (
          <g key={index}>
            <path d={`M${x - 3.4} -1.6a3.4 3.4 0 0 1 6.8 0z`} fill="#F4F8FD" stroke="#A9B6C8" strokeWidth="0.8" />
            <circle cx={x - 1} cy="-3.4" r="0.7" fill="white" />
          </g>
        );
      })}
    </g>
  );
}

// A kite, its middle at (0, 0): two soft panels on crossed sticks, a tail of
// little bows fluttering below, and its string running to (tx, ty).
function Kite({ tx = 0, ty = 60 }) {
  return (
    <g>
      <path
        d={`M0 4Q${(tx * 0.45).toFixed(1)} ${(ty * 0.5 + 16).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`}
        fill="none"
        stroke="#A3ADBB"
        strokeWidth="0.7"
      />
      <g
        className="motion-safe:animate-cat-wave"
        style={{ transformBox: 'fill-box', transformOrigin: 'center top', animationDuration: '0.9s' }}
      >
        <path d="M0 14q-4 6 0 12t0 12" fill="none" stroke="#A3ADBB" strokeWidth="0.8" />
        <path
          d="M-3 19.4 0 21.4-3 23.4zM3 19.4 0 21.4 3 23.4zM-3 31.4 0 33.4-3 35.4zM3 31.4 0 33.4 3 35.4z"
          fill="#F2C27D"
        />
      </g>
      <path d="M0-16 11-2 0 14-11-2z" fill="#F2B8C2" stroke="#D98E9C" strokeWidth="1" strokeLinejoin="round" />
      <path d="M0-16 11-2 0 14z" fill="#BFD3F2" stroke="#8EA6DF" strokeWidth="1" strokeLinejoin="round" />
      <path d="M0-16V14M-11-2H11" stroke="#C49A62" strokeWidth="0.8" />
    </g>
  );
}

// For a cat low in spirits.
// A tear, falling, its top at (0, 0).
function Tear() {
  return (
    <path
      d="M0 0c-1.4 2.2-2.2 3.6-1 4.8s2.8 0 2.3-1.7C1.1 2.2.6 1.2 0 0z"
      fill="#B9CBF2"
      stroke="#8EA6DF"
      strokeWidth="0.6"
    />
  );
}
// A little rain cloud of its own, its middle at (0, 0), rain falling from it
// (count: how far the drops have fallen, for them to move).
function RainCloud({ count = 0 }) {
  const fall = ((count % 9) + 9) % 9;
  return (
    <g>
      <g stroke="#9FB4E8" strokeWidth="1" strokeLinecap="round" opacity="0.8">
        {[-12, -6, 0, 6, 12].map((x, index) => {
          const y = 8 + ((fall + index * 3.4) % 18);
          return <path key={x} d={`M${x} ${y.toFixed(1)}l-1 3.4`} />;
        })}
      </g>
      <path
        d="M-17 6c-4.4 0-5.6-6-1-7.4C-18-6-12-9-8-6.4-6.6-11 2-12 4.6-7c3.4-2.8 9-.6 8.8 3.6 4.6.2 5 8.4.2 9.4z"
        fill="#D5DCE6"
        stroke="#A9B6C8"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </g>
  );
}
// A grumble: a scribbled tangle over a sulking cat's head, its middle at (0, 0).
function Grumble() {
  return (
    <path
      d="M-8 1c2-6 8-6 7-1s-8 4-6-1 9-5 10 0-4 6-6 2 4-7 8-4"
      fill="none"
      stroke="#8E98A8"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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
  ufo: Ufo,
  bed: Bed,
  dream: Dream,
  tear: Tear,
  raincloud: RainCloud,
  grumble: Grumble,
  taiyaki: Taiyaki,
  cupcake: Cupcake,
  frosting: Frosting,
  conveyor: Conveyor,
  sushi: Sushi,
  loss: Loss,
  rod: Rod,
  roomba: Roomba,
  plane: Plane,
  paperball: PaperBall,
  paperbag: PaperBag,
  wrap: Wrap,
  kite: Kite,
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
  ufo: 30,
  bed: 46,
  dream: 36,
  tear: 6,
  raincloud: 24,
  grumble: 12,
  taiyaki: 22,
  cupcake: 22,
  frosting: 8,
  conveyor: 20,
  sushi: 12,
  loss: 30,
  rod: 20,
  roomba: 32,
  plane: 16,
  paperball: 6,
  paperbag: 20,
  wrap: 20,
  kite: 24,
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
  variant,
  layer,
  tx,
  ty,
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
        <Thing
          count={count}
          string={string}
          flying={flying}
          bake={bake}
          rope={rope}
          variant={variant}
          layer={layer}
          flip={flip}
          tx={tx}
          ty={ty}
        />
      </g>
    </svg>
  );
}

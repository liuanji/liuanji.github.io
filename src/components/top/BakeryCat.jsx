// The bakery cat: a small ginger tabby each user keeps on /top. It eats one
// fish-shaped cookie per GPU-hour their jobs spend computing (GPU time weighted
// by load, so GPUs held idle feed it nothing), shows how well it has eaten over
// the last three days in its mood, and grows with their GPU hours ever. Drawn
// in a 120 x 100 box with its feet on y = 88.

const FUR = '#F2BE86';
const STRIPE = '#E19A57';
const BELLY = '#FCEBD6';
const EDGE = '#C98A50';
const PINK = '#F3A7A0';
const EYE = '#3B3346';
const COOKIE = { fill: '#E39A55', edge: '#C47A35' };
const BOWL = { fill: '#9FB4E8', edge: '#7E95CF' };

// How many cookies a day fill it up: past this it is as happy as it gets, so
// heavy users get a happy cat rather than a giant one.
export const APPETITE = 24;
// Its growth, from its owner's GPU hours ever, at the bakery's milestones.
export const STAGES = [
  { key: 'kitten', label: 'Kitten', from: 0, scale: 0.62, head: 1.25 },
  { key: 'young', label: 'Young cat', from: 100, scale: 0.82, head: 1.1 },
  { key: 'grown', label: 'Grown cat', from: 1000, scale: 1, head: 1 },
  { key: 'baker', label: 'Head baker cat', from: 10000, scale: 1, head: 1, hat: true },
];

export function stageOf(hours) {
  return STAGES.filter((stage) => hours >= stage.from).pop();
}

// Its mood from the cookies of the last three days, a day's worth at a time.
export function moodOf(meal) {
  const daily = (meal?.recent ?? 0) / 3;
  if (daily < 0.2) return 'napping';
  if (daily < APPETITE / 6) return 'hungry';
  if (daily < APPETITE / 2) return 'content';
  if (daily < APPETITE * 0.85) return 'purring';
  return 'loaf';
}

export const MOODS = {
  napping: { label: 'napping', title: (name) => `${name} is napping in the bread basket` },
  hungry: { label: 'hungry', title: (name) => `${name} is hungry` },
  content: { label: 'content', title: (name) => `${name} is content` },
  purring: { label: 'purring', title: (name) => `${name} is purring` },
  loaf: { label: 'a happy loaf', title: (name) => `${name} is a happy loaf` },
};

// The head: ears (down when hungry), face, eyes for the mood, and a chef's hat
// for a head baker cat.
function Head({ mood, hat }) {
  const hungry = mood === 'hungry';
  const happy = mood === 'purring';
  return (
    <>
      <path
        d={hungry ? 'M42 44 36 30 50 37z' : 'M43 42 41 25 53 34z'}
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d={hungry ? 'M78 44 84 30 70 37z' : 'M77 42 79 25 67 34z'}
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d={hungry ? 'M43 41 40 33 47 37z' : 'M45 39 44 30 50 35z'} fill={PINK} opacity="0.8" />
      <path d={hungry ? 'M77 41 80 33 73 37z' : 'M75 39 76 30 70 35z'} fill={PINK} opacity="0.8" />
      <ellipse cx="60" cy="46" rx="20.5" ry="17" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <path d="M56 30.5v4.5M60 30v5.5M64 30.5v4.5" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="60" cy="52" rx="8" ry="5.6" fill={BELLY} />
      {happy ? (
        <path d="M50 46q3-3.5 6 0M64 46q3-3.5 6 0" fill="none" stroke={EYE} strokeWidth="1.8" strokeLinecap="round" />
      ) : hungry ? (
        <>
          <circle cx="53" cy="45.5" r="3.6" fill={EYE} />
          <circle cx="67" cy="45.5" r="3.6" fill={EYE} />
          <circle cx="54.2" cy="44.2" r="1.3" fill="white" />
          <circle cx="68.2" cy="44.2" r="1.3" fill="white" />
        </>
      ) : (
        <>
          <circle cx="53" cy="45.5" r="2.7" fill={EYE} />
          <circle cx="67" cy="45.5" r="2.7" fill={EYE} />
          <circle cx="53.9" cy="44.5" r="0.9" fill="white" />
          <circle cx="67.9" cy="44.5" r="0.9" fill="white" />
        </>
      )}
      <path d="M58.4 50h3.2l-1.6 1.8z" fill={PINK} stroke={EDGE} strokeWidth="0.6" strokeLinejoin="round" />
      {hungry ? (
        <ellipse cx="60" cy="54.6" rx="1.4" ry="1.6" fill={EYE} />
      ) : (
        <path d="M57 52.6q1.5 2 3 0q1.5 2 3 0" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
      )}
      <ellipse cx="47.5" cy="51" rx="3.4" ry="2" fill={PINK} opacity={happy ? 0.75 : 0.45} />
      <ellipse cx="72.5" cy="51" rx="3.4" ry="2" fill={PINK} opacity={happy ? 0.75 : 0.45} />
      <path
        d="M44 50h-8M44 53l-7.5 2M76 50h8M76 53l7.5 2"
        stroke={EDGE}
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.7"
      />
      {hat && (
        <>
          <path
            d="M47 32c-5-1-6-8-1-10 1-5 7-7 11-4 3-4 10-3 11 2 5 0 8 6 3 9z"
            fill="white"
            stroke="#CBD5E1"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <rect x="47" y="29.5" width="26" height="5" rx="1.6" fill="white" stroke="#CBD5E1" strokeWidth="1.4" />
        </>
      )}
    </>
  );
}

// Sitting up, tail curled round, for every mood but the loaf and the nap.
function Sitting({ mood, stage }) {
  return (
    <g transform={`translate(60 88) scale(${stage.scale}) translate(-60 -88)`}>
      <path d="M76 84c14 1 20-8 15-17-2-4-6-4-7 0" fill="none" stroke={EDGE} strokeWidth="7.4" strokeLinecap="round" />
      <path d="M76 84c14 1 20-8 15-17-2-4-6-4-7 0" fill="none" stroke={FUR} strokeWidth="5" strokeLinecap="round" />
      <path
        d="M44 89c-6 0-9-6-7.5-14C38.5 62 45 55 60 55s21.5 7 23.5 20c1.5 8-1.5 14-7.5 14z"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M52 89c-3-4-3-14 8-17 11 3 11 13 8 17z" fill={BELLY} />
      <ellipse cx="52" cy="88.5" rx="5.6" ry="3.4" fill={BELLY} stroke={EDGE} strokeWidth="1.4" />
      <ellipse cx="68" cy="88.5" rx="5.6" ry="3.4" fill={BELLY} stroke={EDGE} strokeWidth="1.4" />
      <g transform={`translate(60 60) scale(${stage.head}) translate(-60 -60)`}>
        <Head mood={mood} hat={stage.hat} />
      </g>
    </g>
  );
}

// Its happiest: a "cat loaf", paws tucked under, scored like a bloomer.
function Loaf({ stage }) {
  return (
    <g transform={`translate(60 88) scale(${stage.scale}) translate(-60 -88)`}>
      <path
        d="M30 88c-4 0-6-4-5-9 2-12 14-19 35-19s33 7 35 19c1 5-1 9-5 9z"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M52 66l6 6M64 65l6 6M76 67l5 5" stroke={STRIPE} strokeWidth="2" strokeLinecap="round" />
      <path d="M88 84c6 0 9-3 8-7" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M88 84c6 0 9-3 8-7" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <path
        d="M30 58 28 44 39 51zM54 58 56 44 45 51z"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <ellipse cx="42" cy="64" rx="15.5" ry="13" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <ellipse cx="42" cy="68.5" rx="6.4" ry="4.4" fill={BELLY} />
      <path d="M34 63q2.5-3 5 0M45 63q2.5-3 5 0" fill="none" stroke={EYE} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M40.8 66.5h2.4l-1.2 1.4z" fill={PINK} />
      <ellipse cx="32" cy="67.5" rx="2.6" ry="1.6" fill={PINK} opacity="0.75" />
      <ellipse cx="52" cy="67.5" rx="2.6" ry="1.6" fill={PINK} opacity="0.75" />
    </g>
  );
}

// Unfed for days: curled up asleep on the bread basket, until the next cookie.
function Napping() {
  return (
    <g>
      <path d="M24 78h72l-6 14H30z" fill="#E4C08E" stroke="#C49A62" strokeWidth="1.4" strokeLinejoin="round" />
      <path
        d="M28 83h64M31 88h58M38 78v14M48 78v14M58 78v14M68 78v14M78 78v14M88 78v12"
        stroke="#C49A62"
        strokeWidth="0.8"
        opacity="0.7"
      />
      <path d="M30 79c0-14 14-21 32-21s30 8 30 21z" fill={FUR} stroke={EDGE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M62 63l3 5M72 64l1 5M82 68l-2 4" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M90 78c4-4 1-12-8-10" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M90 78c4-4 1-12-8-10" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <path
        d="M33 66 31 53 41 60zM53 62 56 50 45 56z"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <ellipse cx="43" cy="69" rx="14" ry="10.5" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <path d="M36 69q2.5 2 5 0M46 69q2.5 2 5 0" fill="none" stroke={EYE} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M42 72.2h2l-1 1.2z" fill={PINK} />
    </g>
  );
}

// Its bowl of fish-shaped cookies, with up to five showing.
function Bowl({ x, y, count }) {
  const fish = [
    [-7, -9],
    [0, -10],
    [7, -9],
    [-3.5, -12.5],
    [3.5, -12.5],
  ].slice(0, count);
  return (
    <g>
      <path
        d={`M${x - 13} ${y - 7}h26l-3 7h-20z`}
        fill={BOWL.fill}
        stroke={BOWL.edge}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {fish.map(([dx, dy]) => (
        <path
          key={`${dx},${dy}`}
          d={`M${x + dx - 3} ${y + dy}q3-2.6 6 0q-3 2.6-6 0zm6 0 1.8-1.6v3.2z`}
          fill={COOKIE.fill}
          stroke={COOKIE.edge}
          strokeWidth="0.6"
        />
      ))}
    </g>
  );
}

// The cat in its scene: on the counter beside its bowl (as full as today's
// cookies), dreaming of a cookie when hungry, purring when well fed.
export function CatScene({ mood, stage, today = 0, className = '' }) {
  const fill = Math.min(5, Math.ceil((today / APPETITE) * 5));
  return (
    <svg viewBox="0 14 140 84" className={className} aria-hidden="true">
      <line x1="8" y1="92.5" x2="132" y2="92.5" stroke="#E9EEF4" strokeWidth="2" strokeLinecap="round" />
      {mood === 'napping' ? (
        <g transform="translate(10 0)">
          <Napping />
          <text x="80" y="52" fontFamily="JetBrains Mono, monospace" fontSize="9" fontWeight="600" fill="#A3B1C6">
            z
          </text>
          <text x="87" y="44" fontFamily="JetBrains Mono, monospace" fontSize="12" fontWeight="600" fill="#A3B1C6">
            Z
          </text>
        </g>
      ) : (
        <>
          <g transform="translate(-8 4)">
            {mood === 'loaf' ? <Loaf stage={stage} /> : <Sitting mood={mood} stage={stage} />}
          </g>
          <Bowl x={108} y={92} count={fill} />
          {mood === 'hungry' && (
            <g>
              <circle cx="84" cy="44" r="1.6" fill="#CBD5E1" />
              <circle cx="89" cy="38" r="2.4" fill="#CBD5E1" />
              <ellipse cx="100" cy="29" rx="11" ry="8" fill="white" stroke="#CBD5E1" strokeWidth="1.2" />
              <path d="M95 29q5-4 10 0q-5 4-10 0zm10 0 2.6-2.4v4.8z" fill={COOKIE.fill} />
            </g>
          )}
          {(mood === 'purring' || mood === 'loaf') && (
            <text
              x={mood === 'loaf' ? 58 : 84}
              y={mood === 'loaf' ? 56 : 40}
              fontFamily="JetBrains Mono, monospace"
              fontSize="8"
              fill={EDGE}
            >
              prr
            </text>
          )}
        </>
      )}
    </svg>
  );
}

// The poses of a roaming cat, in the same 120 x 100 box with its feet (or
// belly) on y = 88, its head to the left; flip it to face right.
export const ROAM_POSES = {
  // Resting on a panel's edge: a loaf, breathing.
  rest: () => <Loaf stage={STAGES[2]} />,
  // Sitting up, for a purr, a slow blink, petting or a treat.
  sit: ({ mood = 'content' }) => <Sitting mood={mood} stage={STAGES[2]} />,
  // Rolling over (the whole drawing turns), purring.
  roll: () => <Sitting mood="purring" stage={STAGES[2]} />,
  // Reaching a paw out after the pointer.
  reach: () => (
    <>
      <Sitting mood="content" stage={STAGES[2]} />
      <ellipse
        cx="36"
        cy="58"
        rx="5.4"
        ry="3.8"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.4"
        transform="rotate(-30 36 58)"
      />
    </>
  ),
  walk: () => <Walking />,
  crouch: () => (
    <g transform="translate(0 88) scale(1 0.86) translate(0 -88)">
      <Loaf stage={STAGES[2]} />
    </g>
  ),
  leap: () => <Leaping />,
  sleep: () => (
    <g transform="translate(0 9)">
      <Curled />
    </g>
  ),
  held: () => <Dangling />,
};

function Walking() {
  return (
    <g>
      <path d="M82 70c6-4 8-14 4-20" fill="none" stroke={EDGE} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M82 70c6-4 8-14 4-20" fill="none" stroke={FUR} strokeWidth="3.4" strokeLinecap="round" />
      <g className="motion-safe:animate-cat-step">
        <path d="M44 78v10M68 79v9" stroke={EDGE} strokeWidth="5" strokeLinecap="round" />
        <path d="M44 78v10M68 79v9" stroke={FUR} strokeWidth="3" strokeLinecap="round" />
      </g>
      <g className="motion-safe:animate-cat-step" style={{ animationDelay: '-0.2s' }}>
        <path d="M52 79v9M76 78v10" stroke={EDGE} strokeWidth="5" strokeLinecap="round" />
        <path d="M52 79v9M76 78v10" stroke={FUR} strokeWidth="3" strokeLinecap="round" />
      </g>
      <ellipse cx="62" cy="74" rx="22" ry="9.5" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <path d="M58 66l2 5M66 66l1 5M74 67l-1 5" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M32 60 31 48 40 55zM48 58 50 46 41 52z"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <ellipse cx="40" cy="64" rx="12.5" ry="10.5" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <circle cx="36" cy="63" r="2.2" fill={EYE} />
      <circle cx="36.7" cy="62.3" r="0.7" fill="white" />
      <path d="M29.5 66.5h2.4l-1.2 1.4z" fill={PINK} />
    </g>
  );
}

function Leaping() {
  return (
    <g transform="translate(60 76) rotate(-10) translate(-60 -74)">
      <path d="M84 72c8-1 14-6 16-12" fill="none" stroke={EDGE} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M84 72c8-1 14-6 16-12" fill="none" stroke={FUR} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M44 76l-12 6M48 78l-10 8M76 76l12 6M72 78l10 8" stroke={EDGE} strokeWidth="5" strokeLinecap="round" />
      <path d="M44 76l-12 6M48 78l-10 8M76 76l12 6M72 78l10 8" stroke={FUR} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="60" cy="74" rx="25" ry="8.5" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <path d="M56 67l2 4M64 66.5l1 4.5M72 67.5l-1 4" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M28 60 26 48 36 55zM44 58 46 46 37 52z"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <ellipse cx="36" cy="64" rx="12" ry="10" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <circle cx="31" cy="63" r="2.3" fill={EYE} />
      <circle cx="31.7" cy="62.2" r="0.7" fill="white" />
      <path d="M25 66.5h2.4l-1.2 1.4z" fill={PINK} />
    </g>
  );
}

// Asleep, curled up with its nose tucked in (the nap, without its basket).
function Curled() {
  return (
    <g>
      <path d="M30 79c0-14 14-21 32-21s30 8 30 21z" fill={FUR} stroke={EDGE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M62 63l3 5M72 64l1 5M82 68l-2 4" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M90 78c4-4 1-12-8-10" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M90 78c4-4 1-12-8-10" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <path
        d="M33 66 31 53 41 60zM53 62 56 50 45 56z"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <ellipse cx="43" cy="69" rx="14" ry="10.5" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <path d="M36 69q2.5 2 5 0M46 69q2.5 2 5 0" fill="none" stroke={EYE} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M42 72.2h2l-1 1.2z" fill={PINK} />
    </g>
  );
}

// Held up by the scruff, legs and tail dangling; its scruff is at (60, 26).
function Dangling() {
  return (
    <g transform="translate(0 6)">
      <path d="M66 82c4 6 2 12-2 14" fill="none" stroke={EDGE} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M66 82c4 6 2 12-2 14" fill="none" stroke={FUR} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M52 78v10M58 80v9M62 80v9M68 78v10" stroke={EDGE} strokeWidth="5" strokeLinecap="round" />
      <path d="M52 78v10M58 80v9M62 80v9M68 78v10" stroke={FUR} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="60" cy="66" rx="12" ry="16" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <ellipse cx="60" cy="69" rx="6.5" ry="10" fill={BELLY} />
      <g transform="translate(0 -6)">
        <Head mood="hungry" />
      </g>
    </g>
  );
}

export { Bowl };

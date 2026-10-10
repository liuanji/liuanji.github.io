import { useEffect, useState } from 'react';

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

// Its mood from the cookies of the last three days, a day's worth at a time:
// two a day (a GPU kept busy for a couple of hours) keeps hunger away, eight a
// day has it purring, and eighteen fills it to a loaf.
export function moodOf(meal) {
  const daily = (meal?.recent ?? 0) / 3;
  if (daily < 0.2) return 'napping';
  if (daily < APPETITE / 12) return 'hungry';
  if (daily < APPETITE / 3) return 'content';
  if (daily < APPETITE * 0.75) return 'purring';
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
  const asleep = mood === 'asleep';
  const yawning = mood === 'yawn';
  const sneezing = mood === 'sneeze';
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
      {asleep || yawning ? (
        <path d="M50 45q3 3 6 0M64 45q3 3 6 0" fill="none" stroke={EYE} strokeWidth="1.8" strokeLinecap="round" />
      ) : sneezing ? (
        <path
          d="M50 43.4l5.4 2.2-5.4 2.2M70 43.4l-5.4 2.2 5.4 2.2"
          fill="none"
          stroke={EYE}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : happy ? (
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
      {yawning ? (
        <>
          <ellipse cx="60" cy="55.6" rx="3.4" ry="4.2" fill="#9C4A55" stroke={EDGE} strokeWidth="0.8" />
          <ellipse cx="60" cy="57.6" rx="2" ry="1.6" fill={PINK} />
        </>
      ) : hungry || sneezing ? (
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
function Sitting({ mood, stage, raised = false }) {
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
      {/* Its front paws, one lifted off the ground when it is raised. */}
      {!raised && <ellipse cx="52" cy="88.5" rx="5.6" ry="3.4" fill={BELLY} stroke={EDGE} strokeWidth="1.4" />}
      <ellipse cx="68" cy="88.5" rx="5.6" ry="3.4" fill={BELLY} stroke={EDGE} strokeWidth="1.4" />
      <g transform={`translate(60 60) scale(${stage.head}) translate(-60 -60)`}>
        <Head mood={mood} hat={stage.hat} />
      </g>
    </g>
  );
}

// Its happiest: a "cat loaf", facing out, paws tucked under its chin, tail
// wrapped round the front, its back domed like a loaf.
function Loaf({ stage, mood = 'purring', kneading = false }) {
  // Kneading ("making biscuits"): its front paws press down in turn.
  const knead = (delay) =>
    kneading ? { className: 'motion-safe:animate-cat-knead', style: { animationDelay: delay } } : {};
  return (
    <g transform={`translate(60 88) scale(${stage.scale}) translate(-60 -88)`}>
      <path
        d="M38 88c-4 0-6-2.5-6-6.5 0-10 11-17 28-17s28 7 28 17c0 4-2 6.5-6 6.5z"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M37 75l4 2M36 81l4 1M83 75l-4 2M84 81l-4 1" stroke={STRIPE} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M86 84c-2 3.5-9 4.5-14 3.6" fill="none" stroke={EDGE} strokeWidth="5" strokeLinecap="round" />
      <path d="M86 84c-2 3.5-9 4.5-14 3.6" fill="none" stroke={FUR} strokeWidth="3" strokeLinecap="round" />
      <g {...knead('0s')}>
        <ellipse cx="54.5" cy="87" rx="3.8" ry="2.1" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      </g>
      <g {...knead('-0.35s')}>
        <ellipse cx="65.5" cy="87" rx="3.8" ry="2.1" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      </g>
      <g transform="translate(60 69) scale(0.7) translate(-60 -46)">
        <Head mood={mood} hat={stage.hat} />
      </g>
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
// With away set (it is out roaming the page), its spot is empty: just its bowl
// and a trail of paw prints leading off.
export function CatScene({ mood, stage, today = 0, away = false, className = '' }) {
  const fill = Math.min(5, Math.ceil((today / APPETITE) * 5));
  return (
    <svg viewBox="0 14 140 84" className={className} aria-hidden="true">
      <line x1="8" y1="92.5" x2="132" y2="92.5" stroke="#E9EEF4" strokeWidth="2" strokeLinecap="round" />
      {away ? (
        <>
          <Bowl x={108} y={92} count={fill} />
          {[
            [30, 88],
            [40, 84],
            [50, 87],
            [60, 82],
            [70, 84],
            [80, 78],
          ].map(([x, y], index) => (
            <g
              key={index}
              transform={`translate(${x} ${y}) rotate(${index % 2 ? 20 : -10})`}
              fill={STRIPE}
              opacity={0.25 + index * 0.1}
            >
              <ellipse cx="0" cy="0" rx="2.1" ry="1.7" />
              <circle cx="-2" cy="-2.4" r="0.8" />
              <circle cx="0" cy="-3" r="0.8" />
              <circle cx="2" cy="-2.4" r="0.8" />
            </g>
          ))}
        </>
      ) : mood === 'napping' ? (
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
  rest: ({ mood = 'purring' }) => <Loaf stage={STAGES[2]} mood={mood} />,
  // Well fed: kneading the panel like dough ("making biscuits").
  knead: () => <Loaf stage={STAGES[2]} kneading />,
  // Hungry: sat up on its haunches, paws together under its chin.
  beg: ({ mood = 'hungry' }) => <Begging mood={mood} />,
  // Dancing: up on its hind legs with both paws thrown up, or one waving.
  cheer: () => <Dancing />,
  wave: () => <Dancing waving />,
  // Washing its face with a licked paw.
  groom: () => <Grooming />,
  // Full: rolled over belly-up, paws in the air.
  belly: () => <BellyUp />,
  // Sitting up, for a purr, a slow blink, petting or a treat.
  sit: ({ mood = 'content' }) => <Sitting mood={mood} stage={STAGES[2]} />,
  // Rolling over (the whole drawing turns), purring.
  roll: () => <Sitting mood="purring" stage={STAGES[2]} />,
  // Reaching a paw out after the pointer.
  reach: () => (
    <>
      <Sitting mood="content" stage={STAGES[2]} raised />
      <path d="M47 72Q41 66 38 59.5" fill="none" stroke={EDGE} strokeWidth="7" strokeLinecap="round" />
      <path d="M47 72Q41 66 38 59.5" fill="none" stroke={FUR} strokeWidth="4.6" strokeLinecap="round" />
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
  walk: ({ mood = 'content' }) => <Walking mood={mood} />,
  crouch: () => (
    <g transform="translate(0 88) scale(1 0.86) translate(0 -88)">
      <Loaf stage={STAGES[2]} />
    </g>
  ),
  leap: () => <Leaping />,
  sleep: () => <Curled />,
  held: () => <Dangling />,
  // Held up high: stiff with fright, legs splayed and paddling, tail puffed.
  scared: () => <Scared />,
  // Landed from a height: braced on wide-set legs, tail up, steadying itself.
  balance: () => <Balancing />,
  // Waking up: a long stretch, front paws out, rump up.
  stretch: () => <Stretching />,
  // Peeking: just its head and front paws over an edge.
  peek: () => <Peeking />,
  // Coming out: its head rising from behind an edge, then a look round.
  emerge: () => <Peeking emerging />,
  // On its way from one of its everyday poses to another (see Morph).
  morph: ({ morph }) => (morph ? <Morph {...morph} /> : null),
  // Clinging to a card's side, upright, the card's edge the line x = 60.
  cling: ({ mood = 'content' }) => <Clinging mood={mood} />,
  // Climbing up or down a card's side, paws taking turns.
  climb: () => <Clinging mood="content" climbing />,
};

// Hanging on to the side of a card (to the right of x = 60, mirrored for a
// left side), front paws hooked over its edge, tail hanging down.
function Clinging({ mood, climbing = false }) {
  const step = (delay) =>
    climbing ? { className: 'motion-safe:animate-cat-climb', style: { animationDelay: delay } } : {};
  return (
    <g>
      <path d="M76 96c3 6 1 12-3 15" fill="none" stroke={EDGE} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M76 96c3 6 1 12-3 15" fill="none" stroke={FUR} strokeWidth="3.4" strokeLinecap="round" />
      <ellipse cx="72" cy="84" rx="11" ry="15" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <ellipse cx="70" cy="86" rx="5.8" ry="9.5" fill={BELLY} />
      <path d="M79 76l3 1M80 82l3 .5M80 88h3" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <g transform="translate(74 58) scale(0.78) translate(-60 -46)">
        <Head mood={mood} />
      </g>
      <g {...step('0s')}>
        <ellipse cx="59.5" cy="73" rx="4.6" ry="3.4" fill={BELLY} stroke={EDGE} strokeWidth="1.4" />
        <ellipse cx="63" cy="97" rx="5" ry="3.2" fill={BELLY} stroke={EDGE} strokeWidth="1.4" />
      </g>
      <g {...step('-0.25s')}>
        <ellipse cx="60" cy="81" rx="4.6" ry="3.4" fill={BELLY} stroke={EDGE} strokeWidth="1.4" />
      </g>
    </g>
  );
}

// Waking up: the long stretch, chest and front paws flat out along the floor,
// rump and tail up.
function Stretching() {
  return (
    <g>
      <path d="M81 63c6-5 6-14 1-19-2-2-5-1-4 2" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M81 63c6-5 6-14 1-19-2-2-5-1-4 2" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M74 70v15" stroke={EDGE} strokeWidth="6.6" strokeLinecap="round" />
      <path d="M74 70v15" stroke={FUR} strokeWidth="4.2" strokeLinecap="round" />
      <ellipse
        cx="74"
        cy="86.4"
        rx="3.6"
        ry="2.2"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 74 86.4)"
      />
      <path d="M81 68v17" stroke={EDGE} strokeWidth="6.6" strokeLinecap="round" />
      <path d="M81 68v17" stroke={FUR} strokeWidth="4.2" strokeLinecap="round" />
      <ellipse
        cx="81"
        cy="86.4"
        rx="3.6"
        ry="2.2"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 81 86.4)"
      />
      <ellipse
        cx="63"
        cy="72"
        rx="20"
        ry="9.5"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        transform="rotate(-24 63 72)"
      />
      <path d="M64 63l2 4M71 59.5l2 3.5M77 57l1.5 3.5" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M50 84.5H31" stroke={EDGE} strokeWidth="6.6" strokeLinecap="round" />
      <path d="M50 84.5H31" stroke={FUR} strokeWidth="4.2" strokeLinecap="round" />
      <ellipse
        cx="29"
        cy="86.6"
        rx="3.6"
        ry="2.2"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 29 86.6)"
      />
      <g transform="translate(44 74) scale(0.68) translate(-60 -46)">
        <Head mood="asleep" />
      </g>
      <ellipse cx="35.5" cy="86.8" rx="3.6" ry="2.2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
    </g>
  );
}

// Peeking over an edge (the line y = 88): its head cut off by the edge just
// below its eyes, front paws hooked over it. Emerging, only its head comes up
// from behind the edge, ear tips first, to just its eyes, and stays so, looking
// this way and that now and then.
function Peeking({ emerging = false }) {
  return (
    <g>
      <clipPath id="cat-peek-edge">
        <rect x="0" y="0" width="120" height="88" />
      </clipPath>
      <g clipPath="url(#cat-peek-edge)">
        <g className={emerging ? 'motion-safe:animate-cat-emerge' : undefined}>
          <g
            className={emerging ? 'motion-safe:animate-cat-look' : undefined}
            style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}
          >
            <g transform="translate(60 79) scale(0.85) translate(-60 -45.5)">
              <Head mood="content" />
            </g>
          </g>
        </g>
      </g>
      {!emerging && (
        <>
          <ellipse cx="48.5" cy="86.6" rx="4.8" ry="2.8" fill={BELLY} stroke={EDGE} strokeWidth="1.4" />
          <ellipse cx="71.5" cy="86.6" rx="4.8" ry="2.8" fill={BELLY} stroke={EDGE} strokeWidth="1.4" />
        </>
      )}
    </g>
  );
}

// Trotting along, head turned to its owner, tail up with a curl at the tip.
function Walking({ mood = 'content' }) {
  return (
    <g>
      <path d="M81 70c8-1 11-9 8-17-1-3-5-3-5 0" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M81 70c8-1 11-9 8-17-1-3-5-3-5 0" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <g className="motion-safe:animate-cat-step">
        <path d="M46 75v10" stroke={EDGE} strokeWidth="6.6" strokeLinecap="round" />
        <path d="M46 75v10" stroke={FUR} strokeWidth="4.2" strokeLinecap="round" />
        <ellipse cx="46" cy="86.4" rx="3.6" ry="2.2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
        <path d="M76 75v10" stroke={EDGE} strokeWidth="6.6" strokeLinecap="round" />
        <path d="M76 75v10" stroke={FUR} strokeWidth="4.2" strokeLinecap="round" />
        <ellipse cx="76" cy="86.4" rx="3.6" ry="2.2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      </g>
      <g className="motion-safe:animate-cat-step" style={{ animationDelay: '-0.2s' }}>
        <path d="M54 75v10" stroke={EDGE} strokeWidth="6.6" strokeLinecap="round" />
        <path d="M54 75v10" stroke={FUR} strokeWidth="4.2" strokeLinecap="round" />
        <ellipse cx="54" cy="86.4" rx="3.6" ry="2.2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
        <path d="M68 75v10" stroke={EDGE} strokeWidth="6.6" strokeLinecap="round" />
        <path d="M68 75v10" stroke={FUR} strokeWidth="4.2" strokeLinecap="round" />
        <ellipse cx="68" cy="86.4" rx="3.6" ry="2.2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      </g>
      <ellipse cx="63" cy="72" rx="21" ry="11.5" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <ellipse cx="61" cy="77.5" rx="12" ry="4" fill={BELLY} />
      <path d="M63 61.5l1 4M70 62l.5 4M77 64l-1 3.5" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <g transform="translate(45 59) scale(0.74) translate(-60 -46)">
        <Head mood={mood} />
      </g>
    </g>
  );
}

// Mid-leap: stretched out, front paws reaching ahead, back legs pushing off,
// tail streaming behind.
function Leaping() {
  return (
    <g transform="rotate(-8 60 74)">
      <path d="M80 71c8 0 13-4 16-10 1-2 4-2 4 1" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M80 71c8 0 13-4 16-10 1-2 4-2 4 1" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M72 76L88 81" stroke={EDGE} strokeWidth="5.6" strokeLinecap="round" />
      <path d="M72 76L88 81" stroke={FUR} strokeWidth="3.4" strokeLinecap="round" />
      <ellipse
        cx="88"
        cy="81"
        rx="3.3"
        ry="2"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(18 88 81)"
      />
      <path d="M75 74L92 77.5" stroke={EDGE} strokeWidth="5.6" strokeLinecap="round" />
      <path d="M75 74L92 77.5" stroke={FUR} strokeWidth="3.4" strokeLinecap="round" />
      <ellipse
        cx="92"
        cy="77.5"
        rx="3.3"
        ry="2"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(12 92 77.5)"
      />
      <path d="M50 77L35 82.5" stroke={EDGE} strokeWidth="5.6" strokeLinecap="round" />
      <path d="M50 77L35 82.5" stroke={FUR} strokeWidth="3.4" strokeLinecap="round" />
      <ellipse
        cx="35"
        cy="82.5"
        rx="3.3"
        ry="2"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(-18 35 82.5)"
      />
      <path d="M53 75L38 79" stroke={EDGE} strokeWidth="5.6" strokeLinecap="round" />
      <path d="M53 75L38 79" stroke={FUR} strokeWidth="3.4" strokeLinecap="round" />
      <ellipse
        cx="38"
        cy="79"
        rx="3.3"
        ry="2"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(-14 38 79)"
      />
      <ellipse cx="62" cy="72" rx="21" ry="9.5" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <ellipse cx="60" cy="77" rx="12" ry="3.4" fill={BELLY} />
      <path d="M63 63l1 4M70 63.5l.5 4M77 65l-1 3.5" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <g transform="translate(42 61) scale(0.72) translate(-60 -46)">
        <Head mood="content" />
      </g>
    </g>
  );
}

// Asleep, curled into a low round loaf, head tucked down on its front, tail
// wrapped round.
function Curled() {
  return (
    <g>
      <path
        d="M34 88c-4 0-6-2-6-5.5 0-9 12-15 31-15s31 6 31 15c0 3.5-2 5.5-6 5.5z"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M64 70l1.5 3.5M72 70.5l.5 3.5M80 72.5l-1 3" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M88 83c-3 5-24 6-36 4" fill="none" stroke={EDGE} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M88 83c-3 5-24 6-36 4" fill="none" stroke={FUR} strokeWidth="3.2" strokeLinecap="round" />
      <g transform="translate(45 75) rotate(-10) scale(0.66) translate(-60 -46)">
        <Head mood="asleep" />
      </g>
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

// Held up too high for comfort, by the scruff at (60, 26): stiff, trembling, a
// bead of sweat, legs splayed and paddling at the air, tail puffed out.
function Scared() {
  return (
    <g className="motion-safe:animate-cat-tremble">
      <g transform="translate(0 6)">
        <path d="M65 82c5 5 5 11 2 15" fill="none" stroke={EDGE} strokeWidth="9" strokeLinecap="round" />
        <path d="M65 82c5 5 5 11 2 15" fill="none" stroke={FUR} strokeWidth="6.6" strokeLinecap="round" />
        <path d="M67.5 86l2.5-1.5M69 91l2.6-.4M68.5 96l2.4 1" stroke={STRIPE} strokeWidth="1.4" strokeLinecap="round" />
        <g className="motion-safe:animate-cat-step" style={{ animationDuration: '0.26s' }}>
          <path d="M51 72l-8 7" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
          <path d="M51 72l-8 7" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
          <path d="M64 80l5 9" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
          <path d="M64 80l5 9" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
          <ellipse
            cx="42"
            cy="80"
            rx="3.4"
            ry="2.2"
            fill={BELLY}
            stroke={EDGE}
            strokeWidth="1.2"
            transform="rotate(40 42 80)"
          />
          <ellipse
            cx="69.5"
            cy="90"
            rx="3.4"
            ry="2.2"
            fill={BELLY}
            stroke={EDGE}
            strokeWidth="1.2"
            transform="rotate(-60 69.5 90)"
          />
        </g>
        <g className="motion-safe:animate-cat-step" style={{ animationDuration: '0.26s', animationDelay: '-0.13s' }}>
          <path d="M69 72l8 7" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
          <path d="M69 72l8 7" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
          <path d="M56 80l-5 9" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
          <path d="M56 80l-5 9" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
          <ellipse
            cx="78"
            cy="80"
            rx="3.4"
            ry="2.2"
            fill={BELLY}
            stroke={EDGE}
            strokeWidth="1.2"
            transform="rotate(-40 78 80)"
          />
          <ellipse
            cx="50.5"
            cy="90"
            rx="3.4"
            ry="2.2"
            fill={BELLY}
            stroke={EDGE}
            strokeWidth="1.2"
            transform="rotate(60 50.5 90)"
          />
        </g>
        <ellipse cx="60" cy="66" rx="12" ry="16" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
        <ellipse cx="60" cy="69" rx="6.5" ry="10" fill={BELLY} />
        <g transform="translate(0 -6)">
          <Head mood="hungry" />
        </g>
        <path
          d="M83 28c-2 3-3 5-1.4 6.6s3.8 0 3.2-2.4c-.3-1.2-1-2.6-1.8-4.2z"
          fill="#B9CBF2"
          stroke="#8EA6DF"
          strokeWidth="0.8"
        />
      </g>
    </g>
  );
}

// Steadying itself after a drop: braced on wide-set legs, body low, tail up
// straight for balance, eyes wide.
function Balancing() {
  return (
    <g>
      <path d="M81 68c3-7 3-16-1-23-1-2-4-1-3 1" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M81 68c3-7 3-16-1-23-1-2-4-1-3 1" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M47 75l-6 11" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M47 75l-6 11" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M77 75l6 11" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M77 75l6 11" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <ellipse
        cx="40"
        cy="86.6"
        rx="3.4"
        ry="2.2"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 40 86.6)"
      />
      <ellipse
        cx="84"
        cy="86.6"
        rx="3.4"
        ry="2.2"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 84 86.6)"
      />
      <path d="M54 78l-2 8" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M54 78l-2 8" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M70 78l2 8" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M70 78l2 8" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <ellipse
        cx="51.5"
        cy="86.8"
        rx="3.4"
        ry="2.2"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 51.5 86.8)"
      />
      <ellipse
        cx="72.5"
        cy="86.8"
        rx="3.4"
        ry="2.2"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 72.5 86.8)"
      />
      <ellipse cx="62" cy="73" rx="21" ry="10" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <ellipse cx="61" cy="78" rx="12" ry="3.6" fill={BELLY} />
      <path d="M63 63.5l1 4M70 64l.5 4M77 66l-1 3.5" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <g transform="translate(45 60) scale(0.74) translate(-60 -46)">
        <Head mood="hungry" />
      </g>
    </g>
  );
}

// Dancing on its hind legs, happy: both front paws thrown up in a hooray, or
// (waving) one paw up high waving and the other at its chest.
function Dancing({ waving = false }) {
  return (
    <g>
      <path d="M74 86c12 0 16-7 13-15 3-1 5 1 5 3" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M74 86c12 0 16-7 13-15 3-1 5 1 5 3" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      {!waving && (
        <g>
          <path d="M47 67 32 48" fill="none" stroke={EDGE} strokeWidth="8.4" strokeLinecap="round" />
          <path d="M47 67 32 48" fill="none" stroke={FUR} strokeWidth="5.8" strokeLinecap="round" />
          <ellipse
            cx="30.5"
            cy="46"
            rx="4.9"
            ry="4.4"
            fill={BELLY}
            stroke={EDGE}
            strokeWidth="1.3"
            transform="rotate(-35 30.5 46)"
          />
          <ellipse cx="30.5" cy="46" rx="1.7" ry="1.4" fill={PINK} opacity="0.75" />
        </g>
      )}
      <g
        className={waving ? 'motion-safe:animate-cat-wave' : undefined}
        style={{ transformBox: 'fill-box', transformOrigin: 'left bottom' }}
      >
        <path d="M73 67 88 48" fill="none" stroke={EDGE} strokeWidth="8.4" strokeLinecap="round" />
        <path d="M73 67 88 48" fill="none" stroke={FUR} strokeWidth="5.8" strokeLinecap="round" />
        <ellipse
          cx="89.5"
          cy="46"
          rx="4.9"
          ry="4.4"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.3"
          transform="rotate(35 89.5 46)"
        />
        <ellipse cx="89.5" cy="46" rx="1.7" ry="1.4" fill={PINK} opacity="0.75" />
      </g>
      <path
        d="M47 89c-5 0-7-5-6-12 1.5-12 7-21 19-21s17.5 9 19 21c1 7-1 12-6 12z"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M53 88c-3-5-3-17 7-21 10 4 10 16 7 21z" fill={BELLY} />
      <ellipse cx="52" cy="88.5" rx="5.2" ry="3" fill={BELLY} stroke={EDGE} strokeWidth="1.4" />
      <ellipse cx="68" cy="88.5" rx="5.2" ry="3" fill={BELLY} stroke={EDGE} strokeWidth="1.4" />
      <g transform="translate(60 44) scale(0.92) translate(-60 -46)">
        <Head mood="purring" />
      </g>
      {/* Waving, its other arm is bent across its chest. */}
      {waving && (
        <g>
          <path d="M45 67q3 7 10 5.6" fill="none" stroke={EDGE} strokeWidth="7.6" strokeLinecap="round" />
          <path d="M45 67q3 7 10 5.6" fill="none" stroke={FUR} strokeWidth="5.2" strokeLinecap="round" />
          <ellipse cx="57" cy="72" rx="4.4" ry="3.6" fill={BELLY} stroke={EDGE} strokeWidth="1.3" />
        </g>
      )}
    </g>
  );
}

// Begging: sat up tall on its haunches, front paws together under its chin,
// big hungry eyes, bobbing a little.
function Begging({ mood = 'hungry' }) {
  return (
    <g className="motion-safe:animate-cat-step" style={{ animationDuration: '1.4s' }}>
      <path d="M74 86c12 0 17-6 14-13" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M74 86c12 0 17-6 14-13" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <path
        d="M47 89c-5 0-7-5-6-12 1.5-12 7-21 19-21s17.5 9 19 21c1 7-1 12-6 12z"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M53 88c-3-5-3-17 7-21 10 4 10 16 7 21z" fill={BELLY} />
      <ellipse cx="52" cy="88.5" rx="5.2" ry="3" fill={BELLY} stroke={EDGE} strokeWidth="1.4" />
      <ellipse cx="68" cy="88.5" rx="5.2" ry="3" fill={BELLY} stroke={EDGE} strokeWidth="1.4" />
      <g transform="translate(60 44) scale(0.92) translate(-60 -46)">
        <Head mood={mood} />
      </g>
      <ellipse cx="55.5" cy="64" rx="4" ry="3.2" fill={BELLY} stroke={EDGE} strokeWidth="1.3" />
      <ellipse cx="64.5" cy="64" rx="4" ry="3.2" fill={BELLY} stroke={EDGE} strokeWidth="1.3" />
    </g>
  );
}

// Grooming: sitting, eyes shut, a paw up at its cheek, washing in strokes.
function Grooming() {
  return (
    <g>
      <Sitting mood="purring" stage={STAGES[2]} raised />
      <g className="motion-safe:animate-cat-step" style={{ animationDuration: '0.7s' }}>
        <path d="M47 74Q42 64 48 57" fill="none" stroke={EDGE} strokeWidth="6.6" strokeLinecap="round" />
        <path d="M47 74Q42 64 48 57" fill="none" stroke={FUR} strokeWidth="4.2" strokeLinecap="round" />
        <ellipse
          cx="49"
          cy="55.5"
          rx="4.4"
          ry="3.4"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.3"
          transform="rotate(-25 49 55.5)"
        />
      </g>
    </g>
  );
}

// Belly-up: lying back with its belly to the sky, head tipped back, front
// paws curled at its chest and back legs loose in the air.
function BellyUp() {
  return (
    <g>
      <path d="M83 85c6 1 10-1 12-4" fill="none" stroke={EDGE} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M83 85c6 1 10-1 12-4" fill="none" stroke={FUR} strokeWidth="3.4" strokeLinecap="round" />
      <g className="motion-safe:animate-cat-step" style={{ animationDuration: '1.6s' }}>
        <path d="M73 76l5-8" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M73 76l5-8" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <path d="M78 78l8-5" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M78 78l8-5" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <ellipse
          cx="79"
          cy="66.5"
          rx="3.5"
          ry="2.4"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(30 79 66.5)"
        />
        <ellipse
          cx="87.5"
          cy="72"
          rx="3.5"
          ry="2.4"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(55 87.5 72)"
        />
      </g>
      <ellipse cx="62" cy="80" rx="22" ry="8.6" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <ellipse cx="63" cy="77.2" rx="15" ry="5" fill={BELLY} />
      <g transform="translate(39 76) rotate(-22) scale(0.66) translate(-60 -46)">
        <Head mood="purring" />
      </g>
      <g>
        <path d="M50 75q-1-6 3-9" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M50 75q-1-6 3-9" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <path d="M56 74q1-6 5-8" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M56 74q1-6 5-8" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <ellipse
          cx="54"
          cy="65.5"
          rx="3.5"
          ry="2.4"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(-20 54 65.5)"
        />
        <ellipse
          cx="61.5"
          cy="65"
          rx="3.5"
          ry="2.4"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(-10 61.5 65)"
        />
      </g>
    </g>
  );
}

// Where the parts of the cat are in its everyday poses, to move between them:
// its head (centre, size, tilt), its body and belly (as ellipses: centre and
// radii), its front paws (centre and radii, or none), and its tail.
const SHAPES = {
  sit: {
    head: [60, 46, 1, 0],
    body: [60, 72.5, 23, 17],
    belly: [60, 81, 8, 8],
    paws: [
      [52, 88.5, 5.6, 3.4],
      [68, 88.5, 5.6, 3.4],
    ],
    tail: 'sit',
  },
  rest: {
    head: [60, 69, 0.7, 0],
    body: [60, 77.5, 28, 11],
    belly: [60, 84, 6, 3],
    paws: [
      [54.5, 87, 3.8, 2.1],
      [65.5, 87, 3.8, 2.1],
    ],
    tail: 'rest',
  },
  sleep: {
    head: [45, 75, 0.66, -10],
    body: [60, 78.5, 30, 10],
    belly: [58, 84, 6, 2],
    paws: [
      [52, 87, 1, 0.6],
      [60, 87, 1, 0.6],
    ],
    tail: 'sleep',
  },
  peek: {
    head: [60, 79, 0.85, 0],
    body: [60, 104, 19, 12],
    belly: [60, 106, 6, 6],
    paws: [
      [48.5, 86.6, 4.8, 2.8],
      [71.5, 86.6, 4.8, 2.8],
    ],
    tail: null,
    // Cut off at the edge it peeks over.
    edge: 88,
  },
};
SHAPES.emerge = { ...SHAPES.peek, head: [60, 88, 0.85, 0], paws: SHAPES.sleep.paws };
const TAILS = {
  sit: ['M76 84c14 1 20-8 15-17-2-4-6-4-7 0', 7.4, 5],
  rest: ['M86 84c-2 3.5-9 4.5-14 3.6', 5, 3],
  sleep: ['M88 83c-3 5-24 6-36 4', 5.4, 3.2],
};
export const MORPH_MS = 520;

// On the move from one everyday pose to another (sitting, lying down as a
// loaf, curled asleep, peeking over an edge): its head, body, paws and tail
// glide from where they were to where they will be, the head sinking or
// rising, the body settling or straightening, its face changing halfway.
function Morph({ from, to, fromMood = 'content', toMood = 'content', settled = false }) {
  const [arrived, setArrived] = useState(settled);
  const [halfway, setHalfway] = useState(settled);
  useEffect(() => {
    if (settled) return undefined;
    // Drawn where it was first, then let glide; its face changes halfway.
    let frame = requestAnimationFrame(() => (frame = requestAnimationFrame(() => setArrived(true))));
    const timer = setTimeout(() => setHalfway(true), MORPH_MS / 2);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [settled]);
  const a = SHAPES[from] ?? SHAPES.sit;
  const b = SHAPES[to] ?? SHAPES.sit;
  const at = arrived ? b : a;
  const glide = { transition: `transform ${MORPH_MS}ms ease-in-out, opacity ${MORPH_MS / 2}ms ease-in-out` };
  const blob = ([cx, cy, rx, ry], unit = 10) => ({
    ...glide,
    transform: `translate(${cx}px, ${cy}px) scale(${rx / unit}, ${ry / unit})`,
  });
  const [hx, hy, hs, hr] = at.head;
  const tails = [a.tail, b.tail].filter((tail, index, all) => tail && all.indexOf(tail) === index);
  return (
    <g>
      <clipPath id="cat-morph-edge">
        <rect x="0" y="0" width="120" style={{ ...glide, height: `${at.edge ?? 92}px` }} />
      </clipPath>
      <g clipPath="url(#cat-morph-edge)">
        {tails.map((tail) => (
          <g key={tail} style={{ ...glide, opacity: at.tail === tail ? 1 : 0 }}>
            <path d={TAILS[tail][0]} fill="none" stroke={EDGE} strokeWidth={TAILS[tail][1]} strokeLinecap="round" />
            <path d={TAILS[tail][0]} fill="none" stroke={FUR} strokeWidth={TAILS[tail][2]} strokeLinecap="round" />
          </g>
        ))}
        <ellipse
          rx="10"
          ry="10"
          fill={FUR}
          stroke={EDGE}
          strokeWidth="1.6"
          vectorEffect="non-scaling-stroke"
          style={blob(at.body)}
        />
        <ellipse rx="10" ry="10" fill={BELLY} style={blob(at.belly)} />
        <g style={{ ...glide, transform: `translate(${hx}px, ${hy}px) rotate(${hr}deg) scale(${hs})` }}>
          <g transform="translate(-60 -46)">
            <Head mood={halfway ? toMood : fromMood} />
          </g>
        </g>
        {at.paws.map((paw, index) => (
          <ellipse
            key={index}
            rx="5"
            ry="3"
            fill={BELLY}
            stroke={EDGE}
            strokeWidth="1.4"
            vectorEffect="non-scaling-stroke"
            style={{
              ...blob(paw, 1),
              transform: `translate(${paw[0]}px, ${paw[1]}px) scale(${paw[2] / 5}, ${paw[3] / 3})`,
              // Tucked away out of sight when lying asleep or coming up from behind an edge.
              opacity: paw[2] < 1.5 ? 0 : 1,
            }}
          />
        ))}
      </g>
    </g>
  );
}

export { Bowl };

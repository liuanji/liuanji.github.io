import { useEffect, useState } from 'react';

// The bakery cat: a small ginger tabby each user keeps on /top. It eats one
// fish-shaped cookie per GPU-hour their jobs hold (the GPU hours on the
// leaderboard, not weighted by load), shows how well it has eaten over the
// last three days in its mood, and grows with their GPU hours ever. Drawn in a
// 120 x 100 box with its feet on y = 88.

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
  const chattering = mood === 'chatter';
  const winking = mood === 'wink';
  // Frightened: ears out flat to the sides, eyes wide; hissing, its brows
  // down too and its mouth open on two little fangs.
  const hissing = mood === 'hiss';
  // Drowsy: lids half down over its eyes.
  const drowsy = mood === 'drowsy';
  const fright = mood === 'fright' || hissing;
  const ears = fright
    ? ['M42 45 28 37 48 37.5z', 'M78 45 92 37 72 37.5z', 'M42.5 43 32 38.4 46 38.6z', 'M77.5 43 88 38.4 74 38.6z']
    : hungry
      ? ['M42 44 36 30 50 37z', 'M78 44 84 30 70 37z', 'M43 41 40 33 47 37z', 'M77 41 80 33 73 37z']
      : ['M43 42 41 25 53 34z', 'M77 42 79 25 67 34z', 'M45 39 44 30 50 35z', 'M75 39 76 30 70 35z'];
  return (
    <>
      <path d={ears[0]} fill={FUR} stroke={EDGE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d={ears[1]} fill={FUR} stroke={EDGE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d={ears[2]} fill={PINK} opacity="0.8" />
      <path d={ears[3]} fill={PINK} opacity="0.8" />
      <ellipse cx="60" cy="46" rx="20.5" ry="17" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <path d="M56 30.5v4.5M60 30v5.5M64 30.5v4.5" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="60" cy="52" rx="8" ry="5.6" fill={BELLY} />
      {hissing ? (
        // Screwed tight shut, > <.
        <path
          d="M49.6 43l5.8 2.6-5.8 2.6M70.4 43l-5.8 2.6 5.8 2.6"
          fill="none"
          stroke={EYE}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : fright ? (
        // Big, glossy and wide, under little worried brows.
        <>
          <circle cx="53" cy="45.8" r="4" fill={EYE} />
          <circle cx="67" cy="45.8" r="4" fill={EYE} />
          <circle cx="54.4" cy="44.2" r="1.6" fill="white" />
          <circle cx="68.4" cy="44.2" r="1.6" fill="white" />
          <circle cx="51.6" cy="47.6" r="0.8" fill="white" />
          <circle cx="65.6" cy="47.6" r="0.8" fill="white" />
          <path
            d="M49.4 39.6q3-1.8 6-.4M70.6 39.6q-3-1.8-6-.4"
            fill="none"
            stroke={EDGE}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </>
      ) : drowsy ? (
        <>
          <path d="M50.2 45.4a2.8 2.8 0 0 0 5.6 0z" fill={EYE} />
          <path d="M64.2 45.4a2.8 2.8 0 0 0 5.6 0z" fill={EYE} />
          <path
            d="M49.4 45.2q3.6-1.4 7.2 0M63.4 45.2q3.6-1.4 7.2 0"
            fill="none"
            stroke={EYE}
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </>
      ) : winking ? (
        <>
          <path d="M50 46q3-3.5 6 0" fill="none" stroke={EYE} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="67" cy="45.5" r="2.9" fill={EYE} />
          <circle cx="68" cy="44.4" r="1" fill="white" />
        </>
      ) : chattering ? (
        <>
          <circle cx="53" cy="45.5" r="3.4" fill={EYE} />
          <circle cx="67" cy="45.5" r="3.4" fill={EYE} />
          <circle cx="54.1" cy="44.3" r="1.2" fill="white" />
          <circle cx="68.1" cy="44.3" r="1.2" fill="white" />
        </>
      ) : asleep || yawning ? (
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
      {hissing ? (
        <>
          <path
            d="M54.6 53.2q5.4 7.4 10.8 0q-5.4 1.8-10.8 0z"
            fill="#9C4A55"
            stroke={EDGE}
            strokeWidth="0.7"
            strokeLinejoin="round"
          />
          <path d="M56.2 53.8l1.1 2.4 1-2.1zM63.8 53.8l-1.1 2.4-1-2.1z" fill="white" />
        </>
      ) : fright ? (
        <ellipse cx="60" cy="55.2" rx="1.7" ry="2.1" fill="#9C4A55" stroke={EDGE} strokeWidth="0.6" />
      ) : chattering ? (
        <ellipse cx="60" cy="55" rx="2.2" ry="1.8" fill="#9C4A55" stroke={EDGE} strokeWidth="0.6" />
      ) : yawning ? (
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
function Sitting({ mood, stage, raised = false, holding = false }) {
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
      {!raised && !holding && (
        <ellipse cx="52" cy="88.5" rx="5.6" ry="3.4" fill={BELLY} stroke={EDGE} strokeWidth="1.4" />
      )}
      {!holding && <ellipse cx="68" cy="88.5" rx="5.6" ry="3.4" fill={BELLY} stroke={EDGE} strokeWidth="1.4" />}
      <g transform={`translate(60 60) scale(${stage.head}) translate(-60 -60)`}>
        <Head mood={mood} hat={stage.hat} />
      </g>
    </g>
  );
}

// Its happiest: a "cat loaf", facing out, paws tucked under its chin, tail
// wrapped round the front, its back domed like a loaf.
function Loaf({ stage, mood = 'purring', kneading = false, dangling = false }) {
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
      {dangling ? (
        // A paw hung down over the edge in front, swinging.
        <g
          className="motion-safe:animate-cat-wave"
          style={{ transformBox: 'fill-box', transformOrigin: 'center top', animationDuration: '0.8s' }}
        >
          <path d="M53 85q-1 7 0 13" fill="none" stroke={EDGE} strokeWidth="6.4" strokeLinecap="round" />
          <path d="M53 85q-1 7 0 13" fill="none" stroke={FUR} strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="53" cy="99.5" rx="3.8" ry="3.2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
        </g>
      ) : (
        <g {...knead('0s')}>
          <ellipse cx="54.5" cy="87" rx="3.8" ry="2.1" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
        </g>
      )}
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
  // Asleep on its back, paws drooping in the air.
  snooze: () => <BellyUp asleep />,
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
  // (With a big yawn, when it is a yawning face it is stretching with.)
  stretch: ({ mood }) => <Stretching yawning={mood === 'yawn'} />,
  // Peeking: just its head and front paws over an edge.
  peek: () => <Peeking />,
  // Coming out: its head rising from behind an edge, then a look round.
  emerge: () => <Peeking emerging />,
  // Back down to just its eyes after a look over the edge, without rising again.
  lurk: () => <Peeking emerging risen />,
  // On its way from one of its everyday poses to another (see Morph).
  morph: ({ morph }) => (morph ? <Morph {...morph} /> : null),
  // On a GPU's tile: a hop, paws tucked; a fright, back arched; melted flat
  // on a warm one; lying over the edge with a paw dangling at its ring.
  hop: () => <Hopping />,
  startle: () => <Startled />,
  melt: () => <Melted />,
  dangle: () => <Loaf stage={STAGES[2]} mood="hungry" dangling />,
  // Running: a gallop in two strides (stretched out, then gathered under),
  // and a skid to a stop.
  run: ({ mood = 'content' }) => <Galloping mood={mood} />,
  run2: ({ mood = 'content' }) => <Galloping mood={mood} gathered />,
  skid: () => <Skidding />,
  // Hanging by its front paws from an edge (the line y = 88), legs kicking, as
  // after slipping off a panel's end or swinging from a GPU's ring; pulling
  // itself back up; and stopping to sniff along its way.
  hang: ({ mood = 'hungry' }) => <Hanging mood={mood} />,
  scramble: () => <Scrambling />,
  sniff: () => <Sniffing />,
  // Bird watching (chattering at it), scratching the edge, patting dough;
  // and with its owner: squirming belly-up for a rub, leaning into a brush,
  // posing for photos (a wink, and lounging like a film star).
  chatter: () => <Chattering />,
  // Reading something below it through little round glasses, head bent.
  read: () => <Reading />,
  // Pushing something along (to its left): leaning in, front paws braced flat
  // against it, hind legs digging in, straining.
  push: () => <Pushing />,
  // Pouring from a little oil can held out in front (to its left), drops
  // falling from the spout.
  pour: () => <Pouring />,
  // A mule kick: front paws planted, both hind legs kicked straight out behind
  // (to its right, reaching x = 92).
  kick: () => <Kicking />,
  // Mid-backflip: tucked into a tight ball, paws pulled in, happy.
  tuck: () => <Tucked />,
  // Trapped in a panel: up on its hind legs, front paws pressed flat on the
  // glass in front of it.
  press: () => <Pressing />,
  scratch: () => <Scratching />,
  pat: () => <Patting />,
  squirm: () => <Squirming />,
  lean: () => <Leaning />,
  wink: () => <Sitting mood="wink" stage={STAGES[2]} />,
  glam: () => <Lounging />,
  // Ways back into view: flying in like a superhero (a little cape), bouncing
  // on a pogo stick, floating in a bubble, drifting down under an umbrella.
  fly: () => <Flying />,
  pogo: () => <Pogo />,
  float: () => <Floating />,
  brolly: () => <Brolly />,
  // Tripping off its edge: a stumble, a tumble through the air, and a splat.
  stumble: () => <Stumbling />,
  tumble: () => <Tumbling />,
  splat: () => <Splat />,
  // Clinging to a card's side, upright, the card's edge the line x = 60.
  cling: ({ mood = 'content' }) => <Clinging mood={mood} />,
  // Climbing up or down a card's side, paws taking turns.
  climb: () => <Clinging mood="content" climbing />,
  // Over to a pop-up card: stalking it, rump waggling, before a pounce; and
  // creeping up on it, low, a paw lifted (front, then hind).
  stalk: () => <Stalking />,
  creep: () => <Creeping />,
  creep2: () => <Creeping hind />,
  // Scared of one: puffed up like a Halloween cat, hissing; fleeing flat out,
  // ears pinned back (in two strides, like a gallop); and cowering, pressed
  // flat and trembling.
  hiss: () => <Hissing />,
  flee: () => <Fleeing />,
  flee2: () => <Fleeing gathered />,
  cower: () => <Cowering />,
};

// A bead of sweat off a frightened cat, its top at (x, y).
function SweatDrop({ x, y }) {
  return (
    <path
      d={`M${x} ${y}c-2 3-3 5-1.4 6.6s3.8 0 3.2-2.4c-.3-1.2-1-2.6-1.8-4.2z`}
      fill="#B9CBF2"
      stroke="#8EA6DF"
      strokeWidth="0.8"
    />
  );
}

// Stalking, about to pounce: chest down by the ground with its forelegs
// stretched out ahead, its back rising to a rump held high over hind legs
// bunched under it, tail out low behind with its tip turned up, eyes locked on
// ahead. (The waggle of its rump is its whole drawing rocking.)
function Stalking() {
  return (
    <g>
      <path d="M89 75c6 1 11 1.6 15-.4q2-1 1.4-3.8" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M89 75c6 1 11 1.6 15-.4q2-1 1.4-3.8" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M48 86.2H25M52 86.8H31" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M48 86.2H25M52 86.8H31" stroke={FUR} strokeWidth="3.7" strokeLinecap="round" />
      <ellipse cx="23.6" cy="87" rx="3.4" ry="2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      <ellipse cx="29.6" cy="87.6" rx="3.4" ry="2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      <ellipse cx="79.6" cy="87.3" rx="3.4" ry="2.1" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      <ellipse cx="86.4" cy="87.3" rx="3.4" ry="2.1" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      <path
        d="M46 86.6C41 84.6 42 77 48 74.4C58 70 70 63.6 80 63.4C88 63.2 92.4 70 91 77C90 82.4 87 86 82 86C72 83.6 60 87.4 46 86.6z"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M77.6 69c5.4 1.4 8 6.6 6 12.6" fill="none" stroke={EDGE} strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="62" cy="83.4" rx="10" ry="2.4" fill={BELLY} transform="rotate(-6 62 83.4)" />
      <path d="M62 68.6l1.4 3.4M69 66.4l1 3.4M76 65l.4 3.4" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <g transform="translate(41 73.6) scale(0.7) translate(-60 -46)">
        <Head mood="chatter" />
      </g>
    </g>
  );
}

// Creeping up on something: low and long, belly near the ground, legs bent,
// head down and forward, tail held out low behind; a front paw lifted
// mid-step, or (hind) a back one.
function Creeping({ hind = false }) {
  const leg = (d) => (
    <>
      <path d={d} fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
  const paw = (x, y, angle = 0) => (
    <ellipse
      cx={x}
      cy={y}
      rx="3.4"
      ry="2.1"
      fill={BELLY}
      stroke={EDGE}
      strokeWidth="1.2"
      transform={`rotate(${angle} ${x} ${y})`}
    />
  );
  return (
    <g>
      <path d="M84 74c7 1 13 3 18 7q2 1.4 3.6 0" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M84 74c7 1 13 3 18 7q2 1.4 3.6 0" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      {leg('M54 79l-3 4 1 3.6')}
      {paw(51.6, 87.2)}
      {leg('M72 79l3 4-1 3.6')}
      {paw(74.4, 87.2)}
      {hind ? (
        <>
          {leg('M48 79l-4 4 .4 3.6')}
          {paw(44, 87.2)}
          {leg('M79 79l6 1.6 4 .4')}
          {paw(90, 81, 20)}
        </>
      ) : (
        <>
          {leg('M48 79l-5 3-5 .4')}
          {paw(36.4, 82.6, -10)}
          {leg('M79 79l3 4 .4 3.6')}
          {paw(83, 87.2)}
        </>
      )}
      <ellipse cx="64" cy="76" rx="22" ry="7.6" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <ellipse cx="62" cy="80.6" rx="12" ry="2.6" fill={BELLY} />
      <path d="M63 68.6l1 3.4M70 68.8l.4 3.4M77 70l-.8 3" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <g transform="translate(42 67.4) scale(0.7) translate(-60 -46)">
        <Head mood="chatter" />
      </g>
    </g>
  );
}

// Puffed up in fright like a Halloween cat: up on stiff, straight legs, back
// arched high with every hair on end, tail a bottle brush, ears flat back,
// hissing; trembling all over.
function Hissing() {
  // The outline of its arched back, bristling: points round the arch, every
  // other one standing out.
  const back = Array.from({ length: 21 }, (_, index) => {
    const angle = Math.PI + (Math.PI * index) / 20;
    const out = index % 2 ? 1.1 : 1;
    return `${(63 + 21 * out * Math.cos(angle)).toFixed(1)} ${(76 + 29 * out * Math.sin(angle)).toFixed(1)}`;
  });
  const leg = (d) => (
    <>
      <path d={d} fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d={d} fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
    </>
  );
  return (
    <g className="motion-safe:animate-cat-tremble">
      <path d="M81 68c4-9 6-22 3-35" fill="none" stroke={EDGE} strokeWidth="13" strokeLinecap="round" />
      <path d="M81 68c4-9 6-22 3-35" fill="none" stroke={FUR} strokeWidth="10.4" strokeLinecap="round" />
      <path
        d="M78.4 38l-3.2-1.6M89.6 38.6l3.2-1.2M77.6 45l-3.4-.8M90.6 46l3.4-.4M77.8 52.4l-3.4-.2M90.4 53.6l3.2.2M78.6 60l-3.2.4M89 61l3 .8"
        stroke={EDGE}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {leg('M47 74l-2 12M52 74.6l-.6 11.6')}
      {leg('M74 74.6l.6 11.6M79 74l2 12')}
      <ellipse cx="44.6" cy="87.4" rx="3.2" ry="2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      <ellipse cx="51.2" cy="87.6" rx="3.2" ry="2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      <ellipse cx="74.8" cy="87.6" rx="3.2" ry="2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      <ellipse cx="81.4" cy="87.4" rx="3.2" ry="2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      <path
        d={`M${back.join(' L')} Q63 71.6 42 76z`}
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <ellipse cx="63" cy="73.4" rx="10" ry="2.4" fill={BELLY} />
      <path d="M58 52l1 4.2M65 50.6l-.2 4.4M72 53.4l-1 4" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <g transform="translate(41 63) scale(0.76) translate(-60 -46)">
        <Head mood="hiss" />
      </g>
    </g>
  );
}

// Fleeing in a fright: galloping flat out with its ears pinned back and eyes
// wide, a bead of sweat flying off, and dust lines streaming behind.
function Fleeing({ gathered = false }) {
  return (
    <g>
      <path d="M103 62h6M101 69h10M104 76h6" stroke="#CBD5E1" strokeWidth="1.6" strokeLinecap="round" />
      <Galloping mood="fright" gathered={gathered} />
      <SweatDrop x={gathered ? 61 : 56} y={gathered ? 43 : 42} />
    </g>
  );
}

// Cowering: pressed flat and low as a squashed loaf, tail tight round it, ears
// out flat, eyes wide, a bead of sweat; trembling.
function Cowering() {
  return (
    <g className="motion-safe:animate-cat-tremble">
      <path
        d="M36 88c-4 0-6.4-2-6.4-5 0-7.4 12.4-12.6 30.4-12.6s30.4 5.2 30.4 12.6c0 3-2.4 5-6.4 5z"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M36 79l4 1.6M84 79l-4 1.6" stroke={STRIPE} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M88 85c-2 3-9 3.8-15 3" fill="none" stroke={EDGE} strokeWidth="5" strokeLinecap="round" />
      <path d="M88 85c-2 3-9 3.8-15 3" fill="none" stroke={FUR} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="54.5" cy="87.2" rx="3.8" ry="2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      <ellipse cx="65.5" cy="87.2" rx="3.8" ry="2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      <g transform="translate(60 74.4) scale(0.7) translate(-60 -46)">
        <Head mood="fright" />
      </g>
      <SweatDrop x={73} y={58} />
    </g>
  );
}

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
function Stretching({ yawning = false }) {
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
        <Head mood={yawning ? 'yawn' : 'asleep'} />
      </g>
      <ellipse cx="35.5" cy="86.8" rx="3.6" ry="2.2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
    </g>
  );
}

// Peeking over an edge (the line y = 88): its head cut off by the edge just
// below its eyes, front paws hooked over it. Emerging, only its head comes up
// from behind the edge, ear tips first, to just its eyes, and stays so, looking
// this way and that now and then.
function Peeking({ emerging = false, risen = false }) {
  return (
    <g>
      <clipPath id="cat-peek-edge">
        <rect x="0" y="0" width="120" height="88" />
      </clipPath>
      <g clipPath="url(#cat-peek-edge)">
        <g
          className={emerging && !risen ? 'motion-safe:animate-cat-emerge' : undefined}
          transform={risen ? 'translate(0 9)' : undefined}
        >
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

// A hop, all four paws tucked under, tail up: bouncing on a GPU's tile.
function Hopping() {
  return (
    <g>
      <path d="M81 68c7-2 9-10 6-17-1-2.6-4.6-2-4 .6" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path
        d="M81 68c7-2 9-10 6-17-1-2.6-4.6-2-4 .6"
        fill="none"
        stroke={FUR}
        strokeWidth="3.8"
        strokeLinecap="round"
      />
      <ellipse
        cx="50"
        cy="83.5"
        rx="3.4"
        ry="2.2"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 50 83.5)"
      />
      <ellipse
        cx="56"
        cy="84.5"
        rx="3.4"
        ry="2.2"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 56 84.5)"
      />
      <ellipse
        cx="68"
        cy="84.5"
        rx="3.4"
        ry="2.2"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 68 84.5)"
      />
      <ellipse
        cx="74"
        cy="83.5"
        rx="3.4"
        ry="2.2"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 74 83.5)"
      />
      <ellipse cx="62" cy="72" rx="20" ry="12.5" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <ellipse cx="61" cy="78" rx="11" ry="4.4" fill={BELLY} />
      <path d="M63 61l1 4M70 61.5l.5 4M77 63.5l-1 3.5" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <g transform="translate(45 58) scale(0.74) translate(-60 -46)">
        <Head mood="purring" />
      </g>
    </g>
  );
}

// A fright: back hunched up high, fur bristling along it, legs stiff and
// splayed, tail puffed straight up, eyes wide.
function Startled() {
  return (
    <g>
      <path d="M81 68c4-8 5-18 2-29" fill="none" stroke={EDGE} strokeWidth="10.5" strokeLinecap="round" />
      <path d="M81 68c4-8 5-18 2-29" fill="none" stroke={FUR} strokeWidth="8" strokeLinecap="round" />
      <path
        d="M79 44l-2.6-1.4M86.4 45l2.6-1.2M78.6 52l-2.8-.8M87.4 53.6l2.8-.6M79.4 60l-2.6-.4"
        stroke={EDGE}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path d="M46 75l-3 11" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M46 75l-3 11" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M52 74.6l-1 11.6" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M52 74.6l-1 11.6" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M72 74.6l1 11.6" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M72 74.6l1 11.6" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M78 75l3 11" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M78 75l3 11" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <ellipse cx="42.6" cy="87.2" rx="3.4" ry="2.2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      <ellipse cx="50.8" cy="87.4" rx="3.4" ry="2.2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      <ellipse cx="73.2" cy="87.4" rx="3.4" ry="2.2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      <ellipse cx="81.4" cy="87.2" rx="3.4" ry="2.2" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      <path
        d="M41 78c-1-15 8-27 21-27s22 12 21 27c-6-2.6-13-3.6-21-3.6s-15 1-21 3.6z"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <ellipse cx="62" cy="73" rx="10" ry="2.6" fill={BELLY} />
      <path
        d="M49 57.5l1-3.4 2.2 2.4.8-3.6 2.4 2.2.6-3.6 2.6 2 .4-3.6 2.6 1.8.4-3.4 2.4 2 .6-3.4 2.2 2.4.8-3.2 1.8 2.8"
        fill="none"
        stroke={EDGE}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M60 58l.6 4M67 58.4l-.2 4M73 61l-.8 3.4" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <g transform="translate(40 60) scale(0.74) translate(-60 -46)">
        <Head mood="hungry" />
      </g>
    </g>
  );
}

// Melted flat on a warm GPU: sprawled out, legs stretched front and back,
// cheek down, eyes shut, blissful.
function Melted() {
  return (
    <g>
      <path d="M88 84c5 0 9 1.6 11 4" fill="none" stroke={EDGE} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M88 84c5 0 9 1.6 11 4" fill="none" stroke={FUR} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M44 86H30" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M44 86H30" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M84 86.5h12" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M84 86.5h12" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <ellipse
        cx="28.5"
        cy="86.8"
        rx="3.4"
        ry="2.2"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 28.5 86.8)"
      />
      <ellipse
        cx="97.5"
        cy="87.2"
        rx="3.4"
        ry="2.2"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 97.5 87.2)"
      />
      <ellipse cx="63" cy="83.5" rx="26" ry="6.6" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <path d="M58 78l1 3M66 77.5l.5 3M74 78l-1 3" stroke={STRIPE} strokeWidth="1.7" strokeLinecap="round" />
      <g transform="translate(38 80) rotate(-8) scale(0.62) translate(-60 -46)">
        <Head mood="asleep" />
      </g>
    </g>
  );
}

// Galloping: stretched right out, front legs reaching ahead and hind legs
// pushing off behind, ears back; or gathered, all four legs bunched under it.
function Galloping({ mood = 'content', gathered = false }) {
  return (
    <g>
      {gathered ? (
        <g>
          <path d="M78 70c7-3 9-11 5-17-1-2-4-1-3 1" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
          <path d="M78 70c7-3 9-11 5-17-1-2-4-1-3 1" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
          <path d="M52 78l6 8" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
          <path d="M52 78l6 8" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
          <path d="M55 78l7 9" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
          <path d="M55 78l7 9" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
          <path d="M72 78l-7 8" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
          <path d="M72 78l-7 8" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
          <path d="M70 79l-9 8" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
          <path d="M70 79l-9 8" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
          <ellipse
            cx="58.5"
            cy="87.2"
            rx="3.4"
            ry="2.2"
            fill={BELLY}
            stroke={EDGE}
            strokeWidth="1.2"
            transform="rotate(30 58.5 87.2)"
          />
          <ellipse
            cx="62.5"
            cy="88"
            rx="3.4"
            ry="2.2"
            fill={BELLY}
            stroke={EDGE}
            strokeWidth="1.2"
            transform="rotate(30 62.5 88)"
          />
          <ellipse
            cx="64.5"
            cy="87.2"
            rx="3.4"
            ry="2.2"
            fill={BELLY}
            stroke={EDGE}
            strokeWidth="1.2"
            transform="rotate(-30 64.5 87.2)"
          />
          <ellipse
            cx="60.5"
            cy="88"
            rx="3.4"
            ry="2.2"
            fill={BELLY}
            stroke={EDGE}
            strokeWidth="1.2"
            transform="rotate(-30 60.5 88)"
          />
          <ellipse cx="62" cy="72.5" rx="18" ry="11" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
          <ellipse cx="61" cy="78" rx="10" ry="4.2" fill={BELLY} />
          <path d="M62 62.5l1 4M68.5 63l.4 4M75 65.5l-.8 3.4" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
          <g transform="translate(46 62) scale(0.72) translate(-60 -46)">
            <Head mood={mood} />
          </g>
        </g>
      ) : (
        <g>
          <path d="M84 66c7-1 12-5 15-11" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
          <path d="M84 66c7-1 12-5 15-11" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
          <path d="M48 74 33 80" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
          <path d="M48 74 33 80" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
          <path d="M51 76 37 86" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
          <path d="M51 76 37 86" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
          <path d="M76 74l16 6" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
          <path d="M76 74l16 6" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
          <path d="M73 76l13 10" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
          <path d="M73 76l13 10" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
          <ellipse
            cx="31.5"
            cy="80.5"
            rx="3.4"
            ry="2.2"
            fill={BELLY}
            stroke={EDGE}
            strokeWidth="1.2"
            transform="rotate(-15 31.5 80.5)"
          />
          <ellipse
            cx="35.5"
            cy="86.6"
            rx="3.4"
            ry="2.2"
            fill={BELLY}
            stroke={EDGE}
            strokeWidth="1.2"
            transform="rotate(-30 35.5 86.6)"
          />
          <ellipse
            cx="93.5"
            cy="80.5"
            rx="3.4"
            ry="2.2"
            fill={BELLY}
            stroke={EDGE}
            strokeWidth="1.2"
            transform="rotate(15 93.5 80.5)"
          />
          <ellipse
            cx="87.5"
            cy="86.6"
            rx="3.4"
            ry="2.2"
            fill={BELLY}
            stroke={EDGE}
            strokeWidth="1.2"
            transform="rotate(30 87.5 86.6)"
          />
          <ellipse
            cx="62"
            cy="70"
            rx="23"
            ry="9"
            fill={FUR}
            stroke={EDGE}
            strokeWidth="1.6"
            transform="rotate(-4 62 70)"
          />
          <ellipse cx="61" cy="75" rx="13" ry="3.4" fill={BELLY} />
          <path d="M60 61.5l1 4M67.5 61l.4 4M75 62l-.8 3.6" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
          <g transform="translate(41 62) rotate(-6) scale(0.72) translate(-60 -46)">
            <Head mood={mood} />
          </g>
        </g>
      )}
    </g>
  );
}

// Skidding to a stop: leaning back, front legs braced out stiff ahead, tail up,
// eyes wide.
function Skidding() {
  return (
    <g>
      <path d="M83 64c5-5 6-14 2-21-1-2-4-1-3 1" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M83 64c5-5 6-14 2-21-1-2-4-1-3 1" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <g>
        <path d="M48 78 36 87" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M48 78 36 87" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <path d="M52 79 42 87.5" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M52 79 42 87.5" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <path d="M76 77l2 10" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M76 77l2 10" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <path d="M80 75l3 12" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M80 75l3 12" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <ellipse
          cx="34.5"
          cy="88"
          rx="3.4"
          ry="2.2"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(-15 34.5 88)"
        />
        <ellipse
          cx="40.5"
          cy="88.2"
          rx="3.4"
          ry="2.2"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(-15 40.5 88.2)"
        />
        <ellipse
          cx="78.5"
          cy="88"
          rx="3.4"
          ry="2.2"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(0 78.5 88)"
        />
        <ellipse
          cx="83.5"
          cy="88"
          rx="3.4"
          ry="2.2"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(0 83.5 88)"
        />
      </g>
      <ellipse
        cx="64"
        cy="72"
        rx="20"
        ry="10.5"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        transform="rotate(-12 64 72)"
      />
      <ellipse cx="62" cy="77" rx="11" ry="3.8" fill={BELLY} transform="rotate(-12 62 77)" />
      <path d="M66 61l1.4 3.8M73 61l.8 4M79 63.5l-.4 3.8" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <g transform="translate(44 58) rotate(-10) scale(0.72) translate(-60 -46)">
        <Head mood="hungry" />
      </g>
      <path d="M26 87.5h7M24 84h5" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

// Hanging by its front paws from an edge, its paws hooked over it, its head
// just below, body dangling, hind legs kicking, tail hanging.
function Hanging({ mood = 'hungry' }) {
  return (
    <g>
      <path d="M64 128c3 6 2 11-2 14" fill="none" stroke={EDGE} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M64 128c3 6 2 11-2 14" fill="none" stroke={FUR} strokeWidth="3.4" strokeLinecap="round" />
      <g className="motion-safe:animate-cat-step" style={{ animationDuration: '0.34s' }}>
        <path d="M55 127l-2 9" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M55 127l-2 9" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <ellipse
          cx="52.6"
          cy="137"
          rx="3.4"
          ry="2.3"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(0 52.6 137)"
        />
      </g>
      <g className="motion-safe:animate-cat-step" style={{ animationDuration: '0.34s', animationDelay: '-0.17s' }}>
        <path d="M65 127l2 9" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M65 127l2 9" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <ellipse
          cx="67.4"
          cy="137"
          rx="3.4"
          ry="2.3"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(0 67.4 137)"
        />
      </g>
      <ellipse cx="60" cy="120" rx="10.5" ry="13" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <ellipse cx="60" cy="122" rx="5.6" ry="8" fill={BELLY} />
      <path d="M50 101 46 90" fill="none" stroke={EDGE} strokeWidth="6.6" strokeLinecap="round" />
      <path d="M50 101 46 90" fill="none" stroke={FUR} strokeWidth="4.2" strokeLinecap="round" />
      <path d="M70 101 74 90" fill="none" stroke={EDGE} strokeWidth="6.6" strokeLinecap="round" />
      <path d="M70 101 74 90" fill="none" stroke={FUR} strokeWidth="4.2" strokeLinecap="round" />
      <g transform="translate(60 104) scale(0.72) translate(-60 -46)">
        <Head mood={mood} />
      </g>
      <ellipse
        cx="45.5"
        cy="87.4"
        rx="4"
        ry="3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 45.5 87.4)"
      />
      <ellipse
        cx="74.5"
        cy="87.4"
        rx="4"
        ry="3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 74.5 87.4)"
      />
    </g>
  );
}

// Hauling itself back up over an edge, as onto a windowsill: forearms flat
// along the edge, paws together under its chin, head up and screwed up with
// effort (a bead of sweat), body hanging below, hind legs kicking in turn.
function Scrambling() {
  return (
    <g>
      <path d="M64 114c2 6 7 9 11 7" fill="none" stroke={EDGE} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M64 114c2 6 7 9 11 7" fill="none" stroke={FUR} strokeWidth="3.4" strokeLinecap="round" />
      <g className="motion-safe:animate-cat-step" style={{ animationDuration: '0.24s' }}>
        <path d="M55 113l-3 9" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M55 113l-3 9" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <ellipse
          cx="51.6"
          cy="123"
          rx="3.4"
          ry="2.3"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(15 51.6 123)"
        />
      </g>
      <g className="motion-safe:animate-cat-step" style={{ animationDuration: '0.24s', animationDelay: '-0.12s' }}>
        <path d="M65 113l3 9" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M65 113l3 9" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <ellipse
          cx="68.4"
          cy="123"
          rx="3.4"
          ry="2.3"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(-15 68.4 123)"
        />
      </g>
      <ellipse cx="60" cy="98.5" rx="11" ry="17" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <ellipse cx="60" cy="102" rx="5.6" ry="10" fill={BELLY} />
      <path d="M42 90 52 86.6" fill="none" stroke={EDGE} strokeWidth="7" strokeLinecap="round" />
      <path d="M42 90 52 86.6" fill="none" stroke={FUR} strokeWidth="4.6" strokeLinecap="round" />
      <path d="M78 90 68 86.6" fill="none" stroke={EDGE} strokeWidth="7" strokeLinecap="round" />
      <path d="M78 90 68 86.6" fill="none" stroke={FUR} strokeWidth="4.6" strokeLinecap="round" />
      <g transform="translate(60 71) scale(0.74) translate(-60 -46)">
        <Head mood="sneeze" />
      </g>
      <ellipse
        cx="54"
        cy="86.4"
        rx="4.2"
        ry="2.8"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 54 86.4)"
      />
      <ellipse
        cx="66"
        cy="86.4"
        rx="4.2"
        ry="2.8"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 66 86.4)"
      />
      <path
        d="M74 56c-1.6 2.4-2.4 4-1.2 5.2s3 0 2.6-1.8c-.2-1-.8-2-1.4-3.4z"
        fill="#B9CBF2"
        stroke="#8EA6DF"
        strokeWidth="0.7"
      />
    </g>
  );
}

// Stopping to sniff: nose down to the edge, rump up, tail up, ears forward.
function Sniffing() {
  return (
    <g>
      <path d="M83 66c5-5 7-14 3-21-1-2-4-1-3 1" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M83 66c5-5 7-14 3-21-1-2-4-1-3 1" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M48 77l-2 9" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M48 77l-2 9" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M54 78l-1 9" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M54 78l-1 9" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M74 76l1 10" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M74 76l1 10" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M80 74l2 12" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M80 74l2 12" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <ellipse
        cx="45.6"
        cy="87.4"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 45.6 87.4)"
      />
      <ellipse
        cx="52.6"
        cy="87.6"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 52.6 87.6)"
      />
      <ellipse
        cx="75.4"
        cy="87.6"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 75.4 87.6)"
      />
      <ellipse
        cx="82.4"
        cy="87.4"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 82.4 87.4)"
      />
      <ellipse
        cx="66"
        cy="72"
        rx="19"
        ry="10"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        transform="rotate(10 66 72)"
      />
      <ellipse cx="64" cy="77" rx="10.5" ry="3.6" fill={BELLY} transform="rotate(10 64 77)" />
      <path d="M64 62.5l1 4M71 64l.4 4M77 67l-.8 3.6" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <g transform="translate(42 75) rotate(-14) scale(0.7) translate(-60 -46)">
        <Head mood="content" />
      </g>
    </g>
  );
}

// Up on its hind legs, front paws pressed flat against the glass in front of
// it (pink pads and toe beans showing), eyes wide.
function Pressing() {
  return (
    <g>
      <path d="M74 86c12 0 16-7 13-15 3-1 5 1 5 3" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M74 86c12 0 16-7 13-15 3-1 5 1 5 3" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
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
        <Head mood="hungry" />
      </g>
      <g>
        <ellipse cx="46" cy="60" rx="5.6" ry="6" fill={BELLY} stroke={EDGE} strokeWidth="1.3" />
        <ellipse cx="46" cy="62" rx="2.6" ry="2.2" fill={PINK} />
        <circle cx="43.4" cy="57" r="1.1" fill={PINK} />
        <circle cx="46" cy="56.2" r="1.1" fill={PINK} />
        <circle cx="48.6" cy="57" r="1.1" fill={PINK} />
      </g>
      <g>
        <ellipse cx="74" cy="60" rx="5.6" ry="6" fill={BELLY} stroke={EDGE} strokeWidth="1.3" />
        <ellipse cx="74" cy="62" rx="2.6" ry="2.2" fill={PINK} />
        <circle cx="71.4" cy="57" r="1.1" fill={PINK} />
        <circle cx="74" cy="56.2" r="1.1" fill={PINK} />
        <circle cx="76.6" cy="57" r="1.1" fill={PINK} />
      </g>
    </g>
  );
}

// Tucked into a tight ball mid-backflip: paws pulled in under its chin, tail
// wrapped round, eyes shut with glee.
function Tucked() {
  return (
    <g>
      <path d="M71 79c8 2 13-4 11-11-1-3-4-3-5 0" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M71 79c8 2 13-4 11-11-1-3-4-3-5 0" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <circle cx="60" cy="70" r="14.5" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <ellipse cx="60" cy="75" rx="8" ry="6.5" fill={BELLY} />
      <g transform="translate(60 61) scale(0.64) translate(-60 -46)">
        <Head mood="purring" />
      </g>
      <ellipse
        cx="53"
        cy="73"
        rx="3.4"
        ry="2.4"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(20 53 73)"
      />
      <ellipse
        cx="67"
        cy="73"
        rx="3.4"
        ry="2.4"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(-20 67 73)"
      />
      <ellipse
        cx="55"
        cy="81"
        rx="3.4"
        ry="2.4"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(10 55 81)"
      />
      <ellipse
        cx="65"
        cy="81"
        rx="3.4"
        ry="2.4"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(-10 65 81)"
      />
    </g>
  );
}

// Pushing something along to its left: leaning right in, front paws braced
// flat against it (at x = 34), hind legs digging in behind, tail out straight,
// face screwed up with effort.
function Pushing() {
  return (
    <g>
      <path d="M80 70c6 0 11-2 15-6" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M80 70c6 0 11-2 15-6" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <g className="motion-safe:animate-cat-step" style={{ animationDuration: '0.36s' }}>
        <path d="M74 77l8 10" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M74 77l8 10" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <ellipse
          cx="83"
          cy="87.6"
          rx="3.4"
          ry="2.3"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(20 83 87.6)"
        />
      </g>
      <g className="motion-safe:animate-cat-step" style={{ animationDuration: '0.36s', animationDelay: '-0.18s' }}>
        <path d="M70 79l5 8" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M70 79l5 8" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <ellipse
          cx="76"
          cy="87.8"
          rx="3.4"
          ry="2.3"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(20 76 87.8)"
        />
      </g>
      <ellipse
        cx="62"
        cy="72"
        rx="20"
        ry="10"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        transform="rotate(14 62 72)"
      />
      <ellipse cx="60" cy="77" rx="11" ry="3.6" fill={BELLY} transform="rotate(14 60 77)" />
      <path d="M62 62l1.6 3.8M69 64l1 4M76 67.6l-.2 3.8" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M50 70 36 66" fill="none" stroke={EDGE} strokeWidth="6.6" strokeLinecap="round" />
      <path d="M50 70 36 66" fill="none" stroke={FUR} strokeWidth="4.2" strokeLinecap="round" />
      <path d="M51 75 36 74" fill="none" stroke={EDGE} strokeWidth="6.6" strokeLinecap="round" />
      <path d="M51 75 36 74" fill="none" stroke={FUR} strokeWidth="4.2" strokeLinecap="round" />
      <ellipse
        cx="34.6"
        cy="65.6"
        rx="3.8"
        ry="2.4"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(80 34.6 65.6)"
      />
      <ellipse
        cx="34.6"
        cy="74"
        rx="3.8"
        ry="2.4"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(80 34.6 74)"
      />
      <g transform="translate(46 64) rotate(10) scale(0.7) translate(-60 -46)">
        <Head mood="sneeze" />
      </g>
    </g>
  );
}

// A mule kick: head down, front paws planted, rump up, both hind legs kicked
// straight out behind, tail up, a cheeky face.
function Kicking() {
  return (
    <g>
      <path d="M77 58c3-7 2-14-3-18-2-1-4 1-3 3" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M77 58c3-7 2-14-3-18-2-1-4 1-3 3" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M76 64 91 61" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M76 64 91 61" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M75 68 91 69" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M75 68 91 69" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <ellipse
        cx="92.6"
        cy="60.8"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(80 92.6 60.8)"
      />
      <ellipse
        cx="92.6"
        cy="69.2"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(80 92.6 69.2)"
      />
      <ellipse
        cx="62"
        cy="72"
        rx="19"
        ry="9.5"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        transform="rotate(-20 62 72)"
      />
      <ellipse cx="60" cy="77" rx="10" ry="3.4" fill={BELLY} transform="rotate(-20 60 77)" />
      <path d="M62 63l1.6 3.8M69 60l1.4 4M75 57.6l.6 4" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M50 79l-2 8" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M50 79l-2 8" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M55 80l-1 7" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M55 80l-1 7" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <ellipse
        cx="47.6"
        cy="87.6"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 47.6 87.6)"
      />
      <ellipse
        cx="53.6"
        cy="87.8"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 53.6 87.8)"
      />
      <g transform="translate(43 72) scale(0.7) translate(-60 -46)">
        <Head mood="wink" />
      </g>
      <path d="M95 60l4-3M96 66h5M95 72l4 3" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

// Pouring from a little golden oil can held out in front in both paws, tipped
// so drops fall from its spout.
function Pouring() {
  return (
    <g>
      <Sitting mood="purring" stage={STAGES[2]} holding />
      <path d="M51 74 45 69" fill="none" stroke={EDGE} strokeWidth="6.6" strokeLinecap="round" />
      <path d="M51 74 45 69" fill="none" stroke={FUR} strokeWidth="4.2" strokeLinecap="round" />
      <path d="M54 77 48 73" fill="none" stroke={EDGE} strokeWidth="6.6" strokeLinecap="round" />
      <path d="M54 77 48 73" fill="none" stroke={FUR} strokeWidth="4.2" strokeLinecap="round" />
      <g transform="rotate(-28 33 66)">
        <path d="M40 62c5-1 7 3 6 6" fill="none" stroke="#B07A3E" strokeWidth="1.6" strokeLinecap="round" />
        <rect x="27" y="60" width="13" height="11" rx="2.4" fill="#E3B655" stroke="#C9973D" strokeWidth="1.2" />
        <path d="M27 63l-9-4" stroke="#C9973D" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M30 63h7" stroke="#F6E2B3" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      <ellipse cx="44.5" cy="68.5" rx="3.6" ry="2.8" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      <ellipse cx="47" cy="73" rx="3.6" ry="2.8" fill={BELLY} stroke={EDGE} strokeWidth="1.2" />
      {[0, 0.2, 0.4].map((delay) => (
        <ellipse
          key={delay}
          cx="18.5"
          cy="63"
          rx="1.3"
          ry="1.8"
          fill="#C9973D"
          className="motion-safe:animate-cat-drip"
          style={{ animationDelay: `${-delay}s` }}
        />
      ))}
    </g>
  );
}

// Reading: sat up, head bent over what is below it, little round glasses on
// its nose, a paw raised as if to turn a page.
function Reading() {
  return (
    <g>
      <Sitting mood="content" stage={STAGES[2]} raised />
      <g transform="translate(0 4)">
        <circle cx="53" cy="46" r="4.6" fill="#FFFFFF" fillOpacity="0.35" stroke="#5B6474" strokeWidth="1.2" />
        <circle cx="67" cy="46" r="4.6" fill="#FFFFFF" fillOpacity="0.35" stroke="#5B6474" strokeWidth="1.2" />
        <path d="M57.6 46h4.8M48.4 45l-6-2M71.6 45l6-2" stroke="#5B6474" strokeWidth="1.1" strokeLinecap="round" />
      </g>
      <path d="M47 74Q42 68 44 62" fill="none" stroke={EDGE} strokeWidth="6.6" strokeLinecap="round" />
      <path d="M47 74Q42 68 44 62" fill="none" stroke={FUR} strokeWidth="4.2" strokeLinecap="round" />
      <ellipse
        cx="44.5"
        cy="60.5"
        rx="4"
        ry="3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(-20 44.5 60.5)"
      />
    </g>
  );
}

// Bird watching: sat up tall, head tipped up after it, eyes wide, jaw going
// ("ek ek"), the tip of its tail twitching.
function Chattering() {
  return (
    <g>
      <g className="motion-safe:animate-cat-wave" style={{ transformBox: 'fill-box', transformOrigin: 'left bottom' }}>
        <path
          d="M76 84c14 1 20-8 15-17-2-4-6-4-7 0"
          fill="none"
          stroke={EDGE}
          strokeWidth="7.4"
          strokeLinecap="round"
        />
        <path d="M76 84c14 1 20-8 15-17-2-4-6-4-7 0" fill="none" stroke={FUR} strokeWidth="5" strokeLinecap="round" />
      </g>
      <path
        d="M44 89c-6 0-9-6-7.5-14C38.5 62 45 55 60 55s21.5 7 23.5 20c1.5 8-1.5 14-7.5 14z"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M52 89c-3-4-3-14 8-17 11 3 11 13 8 17z" fill={BELLY} />
      <ellipse
        cx="52"
        cy="88.5"
        rx="5.6"
        ry="3.4"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 52 88.5)"
      />
      <ellipse
        cx="68"
        cy="88.5"
        rx="5.6"
        ry="3.4"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 68 88.5)"
      />
      <g transform="translate(57 44) rotate(-14) translate(-60 -46)">
        <Head mood="chatter" />
      </g>
    </g>
  );
}

// Scratching the edge: down on its forearms, rump up, front paws pulling back
// in turn, claws out.
function Scratching() {
  return (
    <g>
      <path d="M80 62c5-6 5-15 0-20-2-2-5-1-4 2" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M80 62c5-6 5-15 0-20-2-2-5-1-4 2" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M74 72v15" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M74 72v15" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M80 68v19" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M80 68v19" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <ellipse
        cx="74"
        cy="87.4"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 74 87.4)"
      />
      <ellipse
        cx="80"
        cy="87.4"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 80 87.4)"
      />
      <ellipse
        cx="64"
        cy="73"
        rx="19"
        ry="9.5"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        transform="rotate(-22 64 73)"
      />
      <path d="M64 63.5l2 3.6M71 60.5l2 3.4M77 58.5l1.4 3.6" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <g className="motion-safe:animate-cat-knead" style={{ animationDuration: '0.32s' }}>
        <path d="M50 82h-16" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M50 82h-16" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <ellipse
          cx="32.5"
          cy="85.6"
          rx="3.4"
          ry="2.3"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(0 32.5 85.6)"
        />
        <path
          d="M29.5 86.6l-1.4 1.6M31.8 87.2l-.8 1.8M34 87.4l-.2 1.8"
          stroke={EDGE}
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      </g>
      <g className="motion-safe:animate-cat-knead" style={{ animationDuration: '0.32s', animationDelay: '-0.16s' }}>
        <path d="M52 84.5h-11" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M52 84.5h-11" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <ellipse
          cx="39.5"
          cy="87.4"
          rx="3.4"
          ry="2.3"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(0 39.5 87.4)"
        />
      </g>
      <g transform="translate(46 74) scale(0.68) translate(-60 -46)">
        <Head mood="purring" />
      </g>
    </g>
  );
}

// Patting dough (in front of it, to its left): leaning over it, front paws
// pressing down on it in turn.
function Patting() {
  return (
    <g>
      <path d="M84 70c6-3 9-11 5-17-1-2-4-1-3 1" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M84 70c6-3 9-11 5-17-1-2-4-1-3 1" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M76 79v8" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M76 79v8" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M81 77v10" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M81 77v10" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <ellipse
        cx="76"
        cy="87.4"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 76 87.4)"
      />
      <ellipse
        cx="81"
        cy="87.4"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 81 87.4)"
      />
      <ellipse
        cx="66"
        cy="74"
        rx="19"
        ry="10"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        transform="rotate(-8 66 74)"
      />
      <ellipse cx="65" cy="79" rx="10" ry="3.6" fill={BELLY} />
      <path d="M66 64l1 4M73 64l.4 4M79 66l-.8 3.6" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <g className="motion-safe:animate-cat-knead" style={{ animationDuration: '0.6s' }}>
        <path d="M52 77l-10 6" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M52 77l-10 6" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <ellipse
          cx="40.6"
          cy="84"
          rx="3.4"
          ry="2.3"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(-20 40.6 84)"
        />
      </g>
      <g className="motion-safe:animate-cat-knead" style={{ animationDuration: '0.6s', animationDelay: '-0.3s' }}>
        <path d="M55 79l-9 6" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M55 79l-9 6" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <ellipse
          cx="44.6"
          cy="86"
          rx="3.4"
          ry="2.3"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(-20 44.6 86)"
        />
      </g>
      <g transform="translate(47 62) scale(0.72) translate(-60 -46)">
        <Head mood="purring" />
      </g>
    </g>
  );
}

// Belly-up and squirming for a rub: paws curled up and pedalling, head tipped
// back, blissful, tail swishing.
function Squirming() {
  return (
    <g>
      <g className="motion-safe:animate-cat-wave" style={{ transformBox: 'fill-box', transformOrigin: 'left center' }}>
        <path d="M81 83c6 1 10-1 12-5" fill="none" stroke={EDGE} strokeWidth="5.4" strokeLinecap="round" />
        <path d="M81 83c6 1 10-1 12-5" fill="none" stroke={FUR} strokeWidth="3.4" strokeLinecap="round" />
      </g>
      <g className="motion-safe:animate-cat-step" style={{ animationDuration: '0.5s' }}>
        <path d="M50 75q-1-6 3-9" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M50 75q-1-6 3-9" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <path d="M73 76l5-8" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M73 76l5-8" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <ellipse
          cx="54"
          cy="65.5"
          rx="3.4"
          ry="2.3"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(-20 54 65.5)"
        />
        <ellipse
          cx="79"
          cy="66.5"
          rx="3.4"
          ry="2.3"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(30 79 66.5)"
        />
      </g>
      <g className="motion-safe:animate-cat-step" style={{ animationDuration: '0.5s', animationDelay: '-0.25s' }}>
        <path d="M56 74q1-6 5-8" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M56 74q1-6 5-8" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <path d="M78 78l8-5" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
        <path d="M78 78l8-5" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
        <ellipse
          cx="61.5"
          cy="65"
          rx="3.4"
          ry="2.3"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(-10 61.5 65)"
        />
        <ellipse
          cx="87.5"
          cy="72"
          rx="3.4"
          ry="2.3"
          fill={BELLY}
          stroke={EDGE}
          strokeWidth="1.2"
          transform="rotate(55 87.5 72)"
        />
      </g>
      <ellipse cx="61" cy="80" rx="21" ry="8.4" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <ellipse cx="62" cy="77" rx="14" ry="5" fill={BELLY} />
      <g transform="translate(40 77) rotate(-30) scale(0.64) translate(-60 -46)">
        <Head mood="purring" />
      </g>
    </g>
  );
}

// Leaning into a brush: sat up, swaying over to one side, head tipped against
// it, eyes shut, blissful.
function Leaning() {
  return (
    <g transform="rotate(10 60 88)">
      <Sitting mood="purring" stage={STAGES[2]} />
    </g>
  );
}

// Lounging like a film star: lying on its side along the edge, head propped up
// on a paw, the other paw out in front, tail curled over, a wink.
function Lounging() {
  return (
    <g>
      <path d="M88 84c6-2 8-8 4-12-2-2-5-1-4 1" fill="none" stroke={EDGE} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M88 84c6-2 8-8 4-12-2-2-5-1-4 1" fill="none" stroke={FUR} strokeWidth="3.4" strokeLinecap="round" />
      <path
        d="M36 88c-3 0-5-3-4-6 3-8 14-11 30-11s29 4 30 11c.6 3-1 6-4 6z"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M56 76l1 3M64 75.4l.4 3M72 76l-.6 3" stroke={STRIPE} strokeWidth="1.7" strokeLinecap="round" />
      <ellipse cx="62" cy="84" rx="16" ry="3.4" fill={BELLY} />
      <path d="M44 84 39 72" fill="none" stroke={EDGE} strokeWidth="6.4" strokeLinecap="round" />
      <path d="M44 84 39 72" fill="none" stroke={FUR} strokeWidth="4.1" strokeLinecap="round" />
      <g transform="translate(41 63) rotate(-16) scale(0.72) translate(-60 -46)">
        <Head mood="wink" />
      </g>
      <ellipse
        cx="39"
        cy="71.5"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(-10 39 71.5)"
      />
      <path d="M48 86h-10" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M48 86h-10" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <ellipse
        cx="36.5"
        cy="86.4"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 36.5 86.4)"
      />
    </g>
  );
}

// Flying in like a superhero: stretched out level, front paws together out
// ahead, hind legs out behind, a little red cape streaming back.
function Flying() {
  return (
    <g>
      <path
        d="M54 62c10-4 22-6 34-2 6 2 10 0 12-4-1 8-5 12-12 12-8 0-14 4-22 6z"
        fill="#E98A8A"
        stroke="#C96363"
        strokeWidth="1.1"
        strokeLinejoin="round"
        className="motion-safe:animate-cat-wave"
        style={{ transformBox: 'fill-box', transformOrigin: 'left center', animationDuration: '0.5s' }}
      />
      <path d="M83 72c7 0 12-3 15-8" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M83 72c7 0 12-3 15-8" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M77 75l16 4" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M77 75l16 4" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M75 77l15 7" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M75 77l15 7" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <ellipse
        cx="94.5"
        cy="79.4"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(15 94.5 79.4)"
      />
      <ellipse
        cx="91.5"
        cy="84.6"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(25 91.5 84.6)"
      />
      <ellipse cx="62" cy="72" rx="22" ry="8.5" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <ellipse cx="61" cy="77" rx="13" ry="3" fill={BELLY} />
      <path d="M48 72 31 69" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M48 72 31 69" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M50 75 32 74" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M50 75 32 74" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <ellipse
        cx="29.5"
        cy="68.6"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(-10 29.5 68.6)"
      />
      <ellipse
        cx="30.5"
        cy="74"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(-5 30.5 74)"
      />
      <g transform="translate(43 63) scale(0.72) translate(-60 -46)">
        <Head mood="content" />
      </g>
    </g>
  );
}

// On a pogo stick: stood on its footpegs (at y = 88), paws on the handles, the
// spring and tip below.
function Pogo() {
  return (
    <g>
      <path d="M60 50v52" stroke="#8E98A8" strokeWidth="3" strokeLinecap="round" />
      <path d="M53 88h14" stroke="#5B6474" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M57 94l6 2-6 2 6 2-6 2" fill="none" stroke="#A3ADBB" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M58 104h4" stroke="#5B6474" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M48 86c-4 0-6-5-5-11 1.4-10 6-17 17-17s15.6 7 17 17c1 6-1 11-5 11z"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M54 85c-3-5-3-14 6-17 9 3 9 12 6 17z" fill={BELLY} />
      <path d="M50 68 43 65" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M50 68 43 65" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M70 68 77 65" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M70 68 77 65" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M38 64.5h44" stroke="#5B6474" strokeWidth="2.6" strokeLinecap="round" />
      <g transform="translate(60 45) scale(0.82) translate(-60 -46)">
        <Head mood="purring" />
      </g>
      <ellipse
        cx="41.5"
        cy="64.4"
        rx="3.8"
        ry="2.8"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 41.5 64.4)"
      />
      <ellipse
        cx="78.5"
        cy="64.4"
        rx="3.8"
        ry="2.8"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 78.5 64.4)"
      />
      <ellipse
        cx="53.5"
        cy="86.8"
        rx="4.4"
        ry="2.6"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 53.5 86.8)"
      />
      <ellipse
        cx="66.5"
        cy="86.8"
        rx="4.4"
        ry="2.6"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 66.5 86.8)"
      />
    </g>
  );
}

// Floating in a bubble: sat round and content, paws up against its wall, tail
// curled round, eyes shut.
function Floating() {
  return (
    <g>
      <path d="M72 84c10 2 14-5 10-11-2-3-5-2-5 1" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M72 84c10 2 14-5 10-11-2-3-5-2-5 1" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <ellipse cx="60" cy="76" rx="15" ry="13" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <ellipse cx="60" cy="80" rx="8" ry="7" fill={BELLY} />
      <path d="M49 72 42 64" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M49 72 42 64" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M71 72 78 64" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M71 72 78 64" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <g transform="translate(60 58) scale(0.74) translate(-60 -46)">
        <Head mood="purring" />
      </g>
      <ellipse
        cx="41"
        cy="62.6"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(-40 41 62.6)"
      />
      <ellipse
        cx="79"
        cy="62.6"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(40 79 62.6)"
      />
      <ellipse
        cx="54"
        cy="88"
        rx="4"
        ry="2.4"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 54 88)"
      />
      <ellipse
        cx="66"
        cy="88"
        rx="4"
        ry="2.4"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 66 88)"
      />
    </g>
  );
}

// Drifting down under a little umbrella held up in one paw, the other paw out
// for balance, legs dangling.
function Brolly() {
  return (
    <g>
      <path d="M80 22v20q0 4-3 4" fill="none" stroke="#5B6474" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M56 26c0-12 11-20 24-20s24 8 24 20c-4-3-8-3-12 0-4-3-8-3-12 0-4-3-8-3-12 0-4-3-8-3-12 0z"
        fill="#B6C6EE"
        stroke="#7E95CF"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M68 26c0-10 5-17 12-19M92 26c0-10-5-17-12-19" fill="none" stroke="#9FB4E8" strokeWidth="0.9" />
      <path d="M66 84c6 4 6 10 2 13" fill="none" stroke={EDGE} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M66 84c6 4 6 10 2 13" fill="none" stroke={FUR} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M55 83l-2 8" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M55 83l-2 8" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M65 83l2 8" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M65 83l2 8" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <ellipse
        cx="52.6"
        cy="92"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 52.6 92)"
      />
      <ellipse
        cx="67.4"
        cy="92"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 67.4 92)"
      />
      <ellipse cx="60" cy="72" rx="11" ry="14" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <ellipse cx="60" cy="75" rx="6" ry="9" fill={BELLY} />
      <path d="M68 64 78 46" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M68 64 78 46" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M52 64 42 66" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M52 64 42 66" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <g transform="translate(60 52) scale(0.72) translate(-60 -46)">
        <Head mood="content" />
      </g>
      <ellipse
        cx="78.5"
        cy="44"
        rx="3.6"
        ry="2.8"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 78.5 44)"
      />
      <ellipse
        cx="40.5"
        cy="66.4"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(-20 40.5 66.4)"
      />
    </g>
  );
}

// Tripping: a front paw slipping off the edge, the other flung up, a hind leg
// kicked up behind, tail flying, eyes wide.
function Stumbling() {
  return (
    <g>
      <path d="M83 66c4-4 6-12 4-20-1-3 2-4 3-2" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M83 66c4-4 6-12 4-20-1-3 2-4 3-2" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M50 75 38 86" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M50 75 38 86" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M52 70 40 57" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M52 70 40 57" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M77 77l1 10" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M77 77l1 10" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M80 70l11-7" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M80 70l11-7" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <ellipse
        cx="37"
        cy="87.5"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(-30 37 87.5)"
      />
      <ellipse
        cx="39"
        cy="55"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(-40 39 55)"
      />
      <ellipse
        cx="78.5"
        cy="88"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 78.5 88)"
      />
      <ellipse
        cx="92.5"
        cy="62"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(30 92.5 62)"
      />
      <ellipse
        cx="64"
        cy="71"
        rx="20"
        ry="10"
        fill={FUR}
        stroke={EDGE}
        strokeWidth="1.6"
        transform="rotate(16 64 71)"
      />
      <path d="M64 61.5l1.6 3.8M71 64l1 4M77 67.5l-.4 3.8" stroke={STRIPE} strokeWidth="1.8" strokeLinecap="round" />
      <g transform="translate(42 66) rotate(14) scale(0.72) translate(-60 -46)">
        <Head mood="hungry" />
      </g>
    </g>
  );
}

// Tumbling through the air, curled in a ball, legs splayed, eyes screwed shut
// (spun round as it falls).
function Tumbling() {
  return (
    <g>
      <path d="M73 78c6 4 12 3 15-1" fill="none" stroke={EDGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M73 78c6 4 12 3 15-1" fill="none" stroke={FUR} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M52 61 43 53" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M52 61 43 53" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M68 61l9-8" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M68 61l9-8" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M51 80l-8 7" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M51 80l-8 7" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M69 80l8 7" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M69 80l8 7" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <ellipse
        cx="42"
        cy="52"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(-45 42 52)"
      />
      <ellipse
        cx="78"
        cy="52"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(45 78 52)"
      />
      <ellipse
        cx="42"
        cy="88"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(45 42 88)"
      />
      <ellipse
        cx="78"
        cy="88"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(-45 78 88)"
      />
      <circle cx="60" cy="70" r="15" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <ellipse cx="60" cy="74" rx="8.5" ry="7.5" fill={BELLY} />
      <g transform="translate(60 59) scale(0.62) translate(-60 -46)">
        <Head mood="sneeze" />
      </g>
    </g>
  );
}

// Landed in a heap: flat on its tummy, legs sprawled, chin down, eyes screwed
// shut, stars going round its head.
function Splat() {
  return (
    <g>
      <path d="M82 84c6 0 11 1 15 4" fill="none" stroke={EDGE} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M82 84c6 0 11 1 15 4" fill="none" stroke={FUR} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M44 82 30 86" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M44 82 30 86" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M76 82l13 4" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M76 82l13 4" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M48 86l-11 3" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M48 86l-11 3" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <path d="M72 86l11 3" fill="none" stroke={EDGE} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M72 86l11 3" fill="none" stroke={FUR} strokeWidth="3.9" strokeLinecap="round" />
      <ellipse
        cx="28.5"
        cy="86.4"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 28.5 86.4)"
      />
      <ellipse
        cx="90.5"
        cy="86.4"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 90.5 86.4)"
      />
      <ellipse
        cx="35.5"
        cy="89.4"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 35.5 89.4)"
      />
      <ellipse
        cx="84.5"
        cy="89.4"
        rx="3.4"
        ry="2.3"
        fill={BELLY}
        stroke={EDGE}
        strokeWidth="1.2"
        transform="rotate(0 84.5 89.4)"
      />
      <ellipse cx="60" cy="83" rx="24" ry="7" fill={FUR} stroke={EDGE} strokeWidth="1.6" />
      <path d="M66 77l1 3M73 77.6l.4 3M80 79l-.6 2.6" stroke={STRIPE} strokeWidth="1.7" strokeLinecap="round" />
      <g transform="translate(50 73) scale(0.66) translate(-60 -46)">
        <Head mood="sneeze" />
      </g>
      <g transform="translate(50 54)">
        <g className="motion-safe:animate-cat-dizzy" style={{ transformBox: 'view-box', transformOrigin: '0 0' }}>
          <path d="M-11 -4.8l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="#E3B655" />
          <path d="M10 -7.8l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="#E3B655" />
          <path d="M0 1.2000000000000002l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="#E3B655" />
        </g>
      </g>
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
function BellyUp({ asleep = false }) {
  return (
    <g>
      <path d="M83 85c6 1 10-1 12-4" fill="none" stroke={EDGE} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M83 85c6 1 10-1 12-4" fill="none" stroke={FUR} strokeWidth="3.4" strokeLinecap="round" />
      <g className="motion-safe:animate-cat-step" style={{ animationDuration: asleep ? '3.4s' : '1.6s' }}>
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
        <Head mood={asleep ? 'asleep' : 'purring'} />
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
SHAPES.lurk = SHAPES.emerge;
const TAILS = {
  sit: ['M76 84c14 1 20-8 15-17-2-4-6-4-7 0', 7.4, 5],
  rest: ['M86 84c-2 3.5-9 4.5-14 3.6', 5, 3],
  sleep: ['M88 83c-3 5-24 6-36 4', 5.4, 3.2],
};
export const MORPH_MS = 520;

// In-between drawings for its commonest moves, so that it goes from one pose
// to the next through them instead of fading: lying down from sitting up,
// through "lowering" (head and chest going down first, paws coming forward,
// tail coming round), or from a walk, through "settling" (legs folding, body
// sinking, head turning to the front, tail down); and the same back again,
// sitting up or getting up to walk off. Each pose here is the same handful of
// parts, in step with its own drawing (its body as five curves, from its lower
// left round to its lower right and back along the bottom; its tail as two;
// its head; its front paws; its legs and hind paws; and the touches that come
// and go, as how much of each shows), so every drawing in between can be
// worked out part by part, and the first and last are the poses' own.
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smooth = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
function ellipseOutline(cx, cy, rx, ry) {
  const at = (deg) => [cx + rx * Math.cos((deg * Math.PI) / 180), cy + ry * Math.sin((deg * Math.PI) / 180)];
  const along = (deg) => [-rx * Math.sin((deg * Math.PI) / 180), ry * Math.cos((deg * Math.PI) / 180)];
  const arc = (from, to) => {
    const reach = (4 / 3) * Math.tan(((to - from) * Math.PI) / 720);
    const [start, end, out, back] = [at(from), at(to), along(from), along(to)];
    return [
      start[0] + reach * out[0],
      start[1] + reach * out[1],
      end[0] - reach * back[0],
      end[1] - reach * back[1],
      ...end,
    ];
  };
  return [...at(135), ...arc(135, 180), ...arc(180, 270), ...arc(270, 360), ...arc(0, 45), ...arc(45, 135)];
}
const OUTLINES = {
  sit: {
    body: [
      44, 89, 38, 89, 35, 83, 36.5, 75, 38.5, 62, 45, 55, 60, 55, 75, 55, 81.5, 62, 83.5, 75, 85, 83, 82, 89, 76, 89,
      65.33, 89, 54.67, 89, 44, 89,
    ],
    tail: [76, 84, 90, 85, 96, 76, 91, 67, 89, 63, 85, 63, 84, 67],
    widths: [7.4, 5],
    front: false,
    head: [60, 46, 1, 0],
    paws: [52, 88.5, 5.6, 3.4, 68, 88.5, 5.6, 3.4, 1.4],
    legs: [0, 68, 76],
    shows: { chest: 1 },
  },
  lowering: {
    body: [
      41, 88.6, 36, 88.6, 33.5, 84, 34.2, 77.5, 35.6, 66, 44, 60, 60, 60, 76, 60, 84.4, 66, 85.8, 77.5, 86.5, 84, 84,
      88.6, 79, 88.6, 66.3, 88.6, 53.7, 88.6, 41, 88.6,
    ],
    tail: [81, 84.5, 91.5, 87, 96, 82, 94, 76, 92.5, 72.5, 89, 72.5, 88, 75.5],
    widths: [6.2, 4],
    front: false,
    head: [60, 59.5, 0.84, 0],
    paws: [52.5, 88.8, 5, 2.9, 67.5, 88.8, 5, 2.9, 1.3],
    legs: [0, 68, 76],
    shows: { chest: 0.4, stripes: 0.15 },
  },
  rest: {
    body: [
      38, 88, 34, 88, 32, 85.5, 32, 81.5, 32, 71.5, 43, 64.5, 60, 64.5, 77, 64.5, 88, 71.5, 88, 81.5, 88, 85.5, 86, 88,
      82, 88, 67.33, 88, 52.67, 88, 38, 88,
    ],
    tail: [86, 84, 85, 85.75, 82.75, 86.875, 80.125, 87.45, 77.5, 88.025, 74.5, 88.05, 72, 87.6],
    widths: [5, 3],
    front: true,
    head: [60, 69, 0.7, 0],
    paws: [54.5, 87, 3.8, 2.1, 65.5, 87, 3.8, 2.1, 1.2],
    legs: [0, 68, 76],
    shows: { stripes: 1 },
  },
  // Curled up asleep (its own drawing, Curled): head tucked down and tipped,
  // tail along the front, paws hidden.
  sleep: {
    body: [
      34, 88, 30, 88, 28, 86, 28, 82.5, 28, 73.5, 40, 67.5, 59, 67.5, 78, 67.5, 90, 73.5, 90, 82.5, 90, 86, 88, 88, 84,
      88, 67.33, 88, 50.67, 88, 34, 88,
    ],
    tail: [88, 83, 86.5, 85.5, 80.5, 87, 73.375, 87.625, 66.25, 88.25, 58, 88, 52, 87],
    widths: [5.4, 3.2],
    front: true,
    head: [45, 75, 0.66, -10],
    paws: [56, 87.4, 0, 0, 62, 87.4, 0, 0, 1.2],
    legs: [0, 68, 76],
    shows: { curl: 1 },
  },
  settling: {
    body: ellipseOutline(61.5, 77, 23.5, 10),
    tail: [85, 80, 90, 79.5, 95.5, 80.5, 97, 84, 98.5, 87.5, 93, 89.2, 88, 88.6],
    widths: [5.5, 3.4],
    front: false,
    head: [52, 66, 0.72, 0],
    paws: [49.5, 87, 3.7, 2.15, 58.5, 87, 3.7, 2.15, 1.2],
    legs: [5, 70, 77],
    shows: { walkBelly: 0.35, walkStripes: 0.35, stripes: 0.2 },
  },
  // Nodding off where it sits: head drooped low, shoulders slumped a little.
  nod: {
    body: [
      44, 89, 38, 89, 35, 83, 36.5, 75.5, 38.5, 63, 45, 56.5, 60, 56.5, 75, 56.5, 81.5, 63, 83.5, 75.5, 85, 83, 82, 89,
      76, 89, 65.33, 89, 54.67, 89, 44, 89,
    ],
    tail: [76, 84, 90, 85, 96, 76, 91, 67, 89, 63, 85, 63, 84, 67],
    widths: [7.4, 5],
    front: false,
    head: [60, 52.5, 0.97, 0],
    paws: [52, 88.5, 5.6, 3.4, 68, 88.5, 5.6, 3.4, 1.4],
    legs: [0, 68, 76],
    shows: { chest: 1 },
  },
  walk: {
    body: ellipseOutline(63, 72, 21, 11.5),
    tail: [81, 70, 89, 69, 92, 61, 89, 53, 88, 50, 84, 50, 84, 53],
    widths: [6, 3.8],
    front: false,
    head: [45, 59, 0.74, 0],
    paws: [46, 86.4, 3.6, 2.2, 54, 86.4, 3.6, 2.2, 1.2],
    legs: [10, 68, 76],
    shows: { walkBelly: 1, walkStripes: 1 },
  },
};
// The moves drawn through in-betweens: the poses they pass through, how long
// they take, and when (as parts of the whole, from-to) each part makes its
// move: the head, the top of the body and its base (the top leading, down or
// up), the paws, the tail and the legs; and a little dip (or lift) of the head
// and shoulders as it settles at the end.
export const SETTLES = {
  'sit>rest': {
    keys: ['sit', 'lowering', 'rest'],
    ms: 820,
    head: [0, 0.8],
    top: [0, 0.75],
    base: [0.15, 1],
    paws: [0.1, 1],
    tail: [0.2, 1],
    legs: [0, 1],
    dip: 2,
  },
  'rest>sit': {
    keys: ['rest', 'lowering', 'sit'],
    ms: 680,
    head: [0, 0.85],
    top: [0, 0.8],
    base: [0.1, 1],
    paws: [0, 0.8],
    tail: [0, 0.85],
    legs: [0, 1],
    dip: -1.6,
  },
  'walk>rest': {
    keys: ['walk', 'settling', 'rest'],
    ms: 760,
    head: [0.05, 0.9],
    top: [0, 0.9],
    base: [0, 0.9],
    paws: [0.1, 0.95],
    tail: [0.15, 1],
    legs: [0, 0.8],
    dip: 1.6,
  },
  // Nodding off (slowly), jerking awake (quickly), and giving in, lying down.
  'sit>nod': {
    keys: ['sit', 'nod'],
    ms: 900,
    head: [0, 1],
    top: [0.1, 1],
    base: [0.1, 1],
    paws: [0, 1],
    tail: [0, 1],
    legs: [0, 1],
    dip: 1,
  },
  'nod>sit': {
    keys: ['nod', 'sit'],
    ms: 240,
    head: [0, 1],
    top: [0, 1],
    base: [0, 1],
    paws: [0, 1],
    tail: [0, 1],
    legs: [0, 1],
    dip: -1.4,
  },
  'nod>rest': {
    keys: ['nod', 'lowering', 'rest'],
    ms: 900,
    head: [0, 0.85],
    top: [0, 0.8],
    base: [0.15, 1],
    paws: [0.1, 1],
    tail: [0.2, 1],
    legs: [0, 1],
    dip: 1.6,
  },
  // Curling up to sleep from a loaf: paws tucked away first, the body
  // stretching long and low, the tail along the front, the head last, tucked
  // down and tipped.
  'rest>sleep': {
    keys: ['rest', 'sleep'],
    ms: 900,
    head: [0.2, 1],
    top: [0, 0.85],
    base: [0, 0.85],
    paws: [0, 0.45],
    tail: [0.1, 0.9],
    legs: [0, 1],
    dip: 1,
  },
  'rest>walk': {
    keys: ['rest', 'settling', 'walk'],
    ms: 440,
    head: [0, 0.9],
    top: [0.05, 1],
    base: [0.05, 1],
    paws: [0, 0.9],
    tail: [0, 0.9],
    legs: [0.1, 1],
    dip: 0,
  },
};
// Where a part is along a run of poses, u going from 0 to 1 through them.
function through(values, u) {
  const last = values.length - 1;
  const at = Math.min(last - 1, Math.floor(u * last));
  const t = u * last - at;
  const [a, b] = [values[at], values[at + 1]];
  return { value: Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * t) : a + (b - a) * t, t, at };
}
// The parts k of the way through one of those moves.
function settleParts(plan, k) {
  const keys = plan.keys.map((name) => OUTLINES[name]);
  const when = ([from, to]) => smooth(clamp01((k - from) / (to - from)));
  // Points high on the body move with its top, low ones with its base, as
  // high and low go in the tallest of its poses.
  const tall = [keys[0], keys[keys.length - 1]].sort((a, b) => a.body[13] - b.body[13])[0].body;
  const [top, base] = [when(plan.top), when(plan.base)];
  const settle = Math.sin(Math.PI * clamp01((k - 0.55) / 0.45));
  const body = keys[0].body.map((_, index) => {
    const point = index - (index % 2);
    const low = clamp01((tall[point + 1] - tall[13]) / (tall[1] - tall[13]));
    const u = top + (base - top) * low;
    const value = through(
      keys.map((key) => key.body[index]),
      u,
    ).value;
    return index % 2 ? value + plan.dip * 0.6 * (1 - low) * settle : value;
  });
  const tailAt = through(
    keys.map((key) => key.tail),
    when(plan.tail),
  );
  const tailWidths = through(
    keys.map((key) => key.widths),
    when(plan.tail),
  ).value;
  const front = tailAt.t > 0.5 ? keys[tailAt.at + 1].front : keys[tailAt.at].front;
  const [hx, hy, , hr] = through(
    keys.map((key) => key.head),
    when(plan.head),
  ).value;
  const hs = through(
    keys.map((key) => key.head),
    when([Math.min(0.9, plan.head[0] + 0.12), Math.min(1, plan.head[1] + 0.1)]),
  ).value[2];
  const overall = smooth(k);
  const shows = {};
  for (const name of ['chest', 'stripes', 'walkBelly', 'walkStripes', 'curl']) {
    shows[name] = through(
      keys.map((key) => key.shows[name] ?? 0),
      overall,
    ).value;
  }
  return {
    body,
    tail: tailAt.value,
    widths: tailWidths,
    front,
    head: [hx, hy + plan.dip * settle, hs, hr],
    paws: through(
      keys.map((key) => key.paws),
      when(plan.paws),
    ).value,
    legs: through(
      keys.map((key) => key.legs),
      when(plan.legs),
    ).value,
    shows,
  };
}
// A pose drawn from its parts.
function OutlineCat({ parts, mood }) {
  const { body, tail, widths, front, head, paws, legs, shows } = parts;
  const curve = (points) => {
    let d = `M${points[0].toFixed(2)} ${points[1].toFixed(2)}`;
    for (let index = 2; index < points.length; index += 6) {
      d += `C${points
        .slice(index, index + 6)
        .map((value) => value.toFixed(2))
        .join(' ')}`;
    }
    return d;
  };
  const tailPath = curve(tail);
  const tailDrawn = (
    <>
      <path d={tailPath} fill="none" stroke={EDGE} strokeWidth={widths[0]} strokeLinecap="round" />
      <path d={tailPath} fill="none" stroke={FUR} strokeWidth={widths[1]} strokeLinecap="round" />
    </>
  );
  const [length, hindA, hindB] = legs;
  const leg = (x) =>
    length > 0.3 && (
      <g key={x}>
        <path
          d={`M${x.toFixed(2)} ${(85 - length).toFixed(2)}V85`}
          stroke={EDGE}
          strokeWidth="6.6"
          strokeLinecap="round"
        />
        <path
          d={`M${x.toFixed(2)} ${(85 - length).toFixed(2)}V85`}
          stroke={FUR}
          strokeWidth="4.2"
          strokeLinecap="round"
        />
      </g>
    );
  // Its hind paws, tucked away as its legs fold.
  const tucked = clamp01(length / 10);
  const paw = (x, y, rx, ry, width, key) => (
    <ellipse key={key} cx={x} cy={y} rx={rx} ry={ry} fill={BELLY} stroke={EDGE} strokeWidth={width} />
  );
  const [hx, hy, hs, hr = 0] = head;
  // The walk's stripes and belly ride along on its back and underside as the
  // body sinks and rounds.
  const back = `translate(${(body[12] - 63).toFixed(2)} ${(body[13] - 60.5).toFixed(2)})`;
  const under = `translate(${(body[12] - 63).toFixed(2)} ${(body[1] - 80.13).toFixed(2)})`;
  return (
    <g>
      {!front && tailDrawn}
      {leg(paws[0])}
      {leg(paws[4])}
      {leg(hindA)}
      {leg(hindB)}
      {tucked > 0.02 && (
        <g opacity={tucked}>
          {paw(hindA, 86.4, 3.6 * (0.5 + 0.5 * tucked), 2.2 * (0.5 + 0.5 * tucked), 1.2, 'a')}
          {paw(hindB, 86.4, 3.6 * (0.5 + 0.5 * tucked), 2.2 * (0.5 + 0.5 * tucked), 1.2, 'b')}
        </g>
      )}
      <path d={`${curve(body)}z`} fill={FUR} stroke={EDGE} strokeWidth="1.6" strokeLinejoin="round" />
      {shows.walkBelly > 0.01 && (
        <ellipse cx="61" cy="77.5" rx="12" ry="4" fill={BELLY} opacity={shows.walkBelly} transform={under} />
      )}
      {shows.walkStripes > 0.01 && (
        <path
          d="M63 61.5l1 4M70 62l.5 4M77 64l-1 3.5"
          stroke={STRIPE}
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity={shows.walkStripes}
          transform={back}
        />
      )}
      {shows.chest > 0.01 && (
        <path
          d="M52 89c-3-4-3-14 8-17 11 3 11 13 8 17z"
          fill={BELLY}
          opacity={shows.chest}
          transform={`translate(60 89) scale(1 ${0.4 + 0.6 * shows.chest}) translate(-60 -89)`}
        />
      )}
      {shows.curl > 0.01 && (
        <path
          d="M64 70l1.5 3.5M72 70.5l.5 3.5M80 72.5l-1 3"
          stroke={STRIPE}
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity={shows.curl}
        />
      )}
      {shows.stripes > 0.01 && (
        <path
          d="M37 75l4 2M36 81l4 1M83 75l-4 2M84 81l-4 1"
          stroke={STRIPE}
          strokeWidth="1.7"
          strokeLinecap="round"
          opacity={shows.stripes}
        />
      )}
      {front && tailDrawn}
      {paws[2] > 0.6 && paw(paws[0], paws[1], paws[2], paws[3], paws[8], 'left')}
      {paws[6] > 0.6 && paw(paws[4], paws[5], paws[6], paws[7], paws[8], 'right')}
      <g
        transform={`translate(${hx.toFixed(2)} ${hy.toFixed(2)}) rotate(${hr.toFixed(2)}) scale(${hs.toFixed(3)}) translate(-60 -46)`}
      >
        <Head mood={mood} />
      </g>
    </g>
  );
}
// One drawing k of the way through one of those moves (for looking them over).
export function SettleFrame({ move, k, mood = 'content' }) {
  return <OutlineCat parts={settleParts(SETTLES[move], k)} mood={mood} />;
}
// Drawn through its in-betweens, its face changing halfway.
function Settling({ from, to, fromMood = 'content', toMood = 'content', settled = false }) {
  const plan = SETTLES[`${from}>${to}`];
  const [k, setK] = useState(settled ? 1 : 0);
  useEffect(() => {
    if (settled) return undefined;
    const started = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const next = Math.min(1, (now - started) / plan.ms);
      setK(next);
      if (next < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [settled, plan]);
  return <OutlineCat parts={settleParts(plan, k)} mood={k < 0.5 ? fromMood : toMood} />;
}
// The in-betweens on their own.
Object.assign(ROAM_POSES, {
  lowering: () => <OutlineCat parts={OUTLINES.lowering} mood="content" />,
  settling: () => <OutlineCat parts={OUTLINES.settling} mood="content" />,
  // Nodding off, eyes shut.
  nod: ({ mood }) => <OutlineCat parts={OUTLINES.nod} mood={mood} />,
});

// On the move from one everyday pose to another: through its in-betweens
// where it has them (see SETTLES), else gliding.
function Morph(props) {
  return SETTLES[`${props.from}>${props.to}`] ? <Settling {...props} /> : <Gliding {...props} />;
}

// Gliding from one everyday pose to another (sitting, lying down as a loaf,
// curled asleep, peeking over an edge): its head, body, paws and tail glide
// from where they were to where they will be, the head sinking or rising, the
// body settling or straightening, its face changing halfway.
function Gliding({ from, to, fromMood = 'content', toMood = 'content', settled = false }) {
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

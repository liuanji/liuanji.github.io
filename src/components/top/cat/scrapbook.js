import { useEffect, useState } from 'react';

// Mochi's scrapbook: the first time she did each of the things below, kept in
// this browser (like her spirits, joy.js). What she does of her own accord
// counts, and how she takes what you give her or do with her; what you ask
// for from the list on her card does not (RoamingCat.jsx, saw).
//
// Each moment is drawn as a little scene: a pose (and face) at her feet's
// spot, turned to face right (facing 1) or not, lifted off the ground (lift,
// px), tilted (tilt, degrees); on a stage (a panel's edge by default; a GPU's
// tile or ring, a pop-up card, the notes pill or its croissant, inside a
// panel, or nothing, in the air); with things about her (as for CatThing, at
// dx, dy px from her feet, front ones over her), a pointer (cursor, at dx, dy)
// and something said (say: words, or 'heart').
const KEY = 'gpu-status-cat-scrapbook';
const VIEWED_KEY = 'gpu-status-cat-scrapbook-viewed';
const EVENT = 'bakery-cat-scrapbook';

const bed = (variant, lift) => ({
  pose: 'sleep',
  lift,
  things: [
    { kind: 'bed', variant, layer: 'back', dx: 0, dy: 0 },
    { kind: 'bed', variant, layer: 'front', front: true, dx: 0, dy: 0 },
  ],
});

export const SCRAPBOOK = [
  {
    key: 'self',
    title: 'By herself',
    moments: [
      {
        id: 'doing:butterfly',
        label: 'A butterfly',
        pose: 'sit',
        things: [{ kind: 'butterfly', dx: -34, dy: -58 }],
      },
      { id: 'doing:box', label: 'In a box', pose: 'peek', lift: 22, things: [{ kind: 'box', dx: 0, dy: 0 }] },
      {
        id: 'doing:croissant',
        label: 'Knocking off a croissant',
        pose: 'reach',
        things: [{ kind: 'croissant', dx: -32, dy: 0 }],
      },
      { id: 'doing:tail', label: 'Chasing her tail', pose: 'walk', say: '~' },
      { id: 'doing:sneeze', label: 'A sneeze', pose: 'sit', mood: 'sneeze' },
      { id: 'doing:crumb', label: 'A crumb', pose: 'crouch', things: [{ kind: 'crumb', dx: -28, dy: 0 }] },
      {
        id: 'doing:birdwatch',
        label: 'Bird watching',
        pose: 'chatter',
        things: [{ kind: 'bird', dx: -54, dy: -46, flip: 1 }],
        say: 'ek ek',
      },
      { id: 'doing:scratch', label: 'A good scratch', pose: 'scratch', things: [{ kind: 'claws', dx: -28, dy: 0 }] },
      {
        id: 'doing:dough',
        label: 'Patting dough',
        pose: 'pat',
        things: [{ kind: 'dough', dx: -30, dy: 0, bake: 0.6 }],
      },
      { id: 'doing:backflip', label: 'A backflip', pose: 'tuck', lift: 26 },
      { id: 'act:groom', label: 'Grooming', pose: 'groom' },
      { id: 'act:knead', label: 'Kneading', pose: 'knead', mood: 'purring', say: 'prr' },
      { id: 'act:belly', label: 'Belly-up', pose: 'belly', mood: 'purring', say: 'heart' },
      { id: 'act:beg', label: 'Begging', pose: 'beg', mood: 'hungry' },
      { id: 'act:zoom', label: 'The zoomies', pose: 'run' },
    ],
  },
  {
    key: 'nap',
    title: 'Naps',
    moments: [
      { id: 'bed:basket', label: 'In a bread basket', ...bed('basket', 2) },
      { id: 'bed:banneton', label: 'In a proofing basket', ...bed('banneton', 2) },
      { id: 'bed:donut', label: 'On a doughnut bed', ...bed('donut', 8) },
      { id: 'bed:sack', label: 'On a flour sack', ...bed('sack', 17) },
      { id: 'bed:croissant', label: 'On a croissant cushion', ...bed('croissant', 21) },
      {
        id: 'bed:towel',
        label: 'Under a tea towel',
        pose: 'sleep',
        things: [{ kind: 'bed', variant: 'towel', layer: 'front', front: true, dx: 0, dy: 0, flip: 1 }],
      },
      { id: 'doing:sunbeam', label: 'In a sunbeam', pose: 'sleep', things: [{ kind: 'sunbeam', dx: 0, dy: 0 }] },
      { id: 'doing:doze', label: 'Nodding off', pose: 'sit', mood: 'drowsy' },
      { id: 'doing:flop', label: 'Flopped over', pose: 'snooze' },
      {
        id: 'doing:dream',
        label: 'Dreaming of cookies',
        pose: 'sleep',
        things: [{ kind: 'dream', dx: -7, dy: -22, flip: 1 }],
      },
      { id: 'act:sleep', label: 'Curled up', pose: 'sleep', say: 'z' },
      { id: 'doing:yawn', label: 'A big yawn', pose: 'sit', mood: 'yawn' },
    ],
  },
  {
    key: 'dance',
    title: 'Dances',
    moments: [
      { id: 'dance:paws', label: 'Happy paws', pose: 'wave', mood: 'purring', say: '♪' },
      { id: 'dance:shuffle', label: 'The shuffle', pose: 'walk', mood: 'purring', lift: 4, say: '♫' },
      { id: 'dance:twirl', label: 'A twirl', pose: 'cheer', mood: 'purring', lift: 10, say: '✦' },
      { id: 'dance:moonwalk', label: 'The moonwalk', pose: 'walk', mood: 'purring', facing: 1, say: '♪' },
    ],
  },
  {
    key: 'you',
    title: 'With you',
    moments: [
      { id: 'pointer:chase', label: 'Batting at the pointer', pose: 'reach', cursor: { dx: -30, dy: -40 } },
      { id: 'pointer:tease', label: 'Keep-away', pose: 'leap', lift: 16, facing: 1, cursor: { dx: -40, dy: -30 } },
      { id: 'pointer:caught', label: 'Caught!', pose: 'belly', mood: 'purring', say: 'heart' },
      { id: 'pointer:pet', label: 'Petting', pose: 'sit', mood: 'purring', say: 'heart', cursor: { dx: 2, dy: -52 } },
      { id: 'doing:bunt', label: 'A rub against your hand', pose: 'walk', mood: 'purring', cursor: { dx: 4, dy: -40 } },
      { id: 'doing:pounce', label: 'Pouncing on the pointer', pose: 'reach', lift: 14, cursor: { dx: -34, dy: -22 } },
      { id: 'wish:rub', label: 'A belly rub', pose: 'squirm', say: 'heart', cursor: { dx: 8, dy: -30 } },
      {
        id: 'wish:brush',
        label: 'A brushing',
        pose: 'lean',
        mood: 'purring',
        things: [{ kind: 'comb', dx: 24, dy: -40 }],
      },
      { id: 'wish:photo', label: 'A photo shoot', pose: 'glam', say: 'click!' },
      { id: 'game:yarn', label: 'A ball of yarn', pose: 'walk', things: [{ kind: 'yarn', dx: -36, dy: 0 }] },
      {
        id: 'game:feather',
        label: 'A feather wand',
        pose: 'reach',
        lift: 10,
        things: [{ kind: 'feather', dx: -24, dy: -26 }],
      },
      { id: 'game:laser', label: 'A laser dot', pose: 'crouch', things: [{ kind: 'laser', dx: -42, dy: -1 }] },
      {
        id: 'game:mouse',
        label: 'A wind-up mouse',
        pose: 'crouch',
        things: [{ kind: 'mouse', dx: -44, dy: 0, flip: 1 }],
      },
      {
        id: 'game:bubbles',
        label: 'Bubbles',
        pose: 'reach',
        lift: 14,
        things: [
          { kind: 'bubble', dx: -24, dy: -52 },
          { kind: 'bubble', dx: 10, dy: -76 },
        ],
      },
    ],
  },
  {
    key: 'treat',
    title: 'Treats',
    moments: [
      {
        id: 'treat:toss',
        label: 'Caught in the air',
        pose: 'reach',
        lift: 16,
        things: [{ kind: 'treat', dx: -22, dy: -50, front: true }],
      },
      {
        id: 'treat:beg',
        label: 'Hand-fed',
        pose: 'beg',
        mood: 'hungry',
        things: [{ kind: 'treat', dx: -8, dy: -62 }],
        cursor: { dx: -2, dy: -68 },
      },
      { id: 'treat:hunt', label: 'A treat hunt', pose: 'sniff', things: [{ kind: 'treat', dx: -40, dy: -3 }] },
      {
        id: 'treat:bowl',
        label: 'A little bowl',
        pose: 'crouch',
        things: [{ kind: 'bowl', dx: -30, dy: 0, count: 3 }],
      },
      {
        id: 'treat:taiyaki',
        label: 'A warm taiyaki',
        pose: 'sniff',
        things: [{ kind: 'taiyaki', dx: -40, dy: 0, flip: 1, bake: 1 }],
      },
      {
        id: 'treat:cupcake',
        label: 'A birthday cupcake',
        pose: 'sit',
        mood: 'purring',
        things: [{ kind: 'cupcake', dx: -36, dy: 0, count: 1, bake: 1 }],
      },
      {
        id: 'treat:sushi',
        label: 'Sushi on a belt',
        pose: 'reach',
        things: [
          { kind: 'conveyor', dx: -96, dy: 0, rope: 80, count: 0 },
          { kind: 'sushi', variant: 'salmon', dx: -34, dy: -7 },
          { kind: 'sushi', variant: 'tamago', dx: -66, dy: -7 },
        ],
      },
      {
        id: 'treat:descent',
        label: 'Gradient descent',
        pose: 'sit',
        things: [
          { kind: 'loss', dx: -16, dy: 0, flip: -1, scale: 0.5 },
          { kind: 'treat', dx: -16, dy: -5 },
        ],
      },
      {
        id: 'treat:fishing',
        label: 'Fishing',
        pose: 'sit',
        mood: 'hungry',
        things: [{ kind: 'rod', front: true, dx: -8, dy: -6, flip: -1, rope: 30, count: 0 }],
      },
    ],
  },
  {
    key: 'toy',
    title: 'Toys',
    moments: [
      { id: 'toss:ball', label: 'A bouncy ball', pose: 'reach', things: [{ kind: 'ball', dx: -28, dy: -5 }] },
      {
        id: 'toss:feather',
        label: 'A drifting feather',
        pose: 'sit',
        things: [{ kind: 'feather', string: false, dx: -26, dy: -40, rotate: 25 }],
      },
      { id: 'toss:mouse', label: 'A toy mouse', pose: 'crouch', things: [{ kind: 'mouse', dx: -38, dy: 0, flip: 1 }] },
      {
        id: 'toss:roomba',
        label: 'A robot vacuum ride',
        pose: 'sit',
        mood: 'purring',
        lift: 9,
        things: [{ kind: 'roomba', dx: 0, dy: 0, flip: -1 }],
      },
      {
        id: 'toss:plane',
        label: 'A paper aeroplane',
        pose: 'reach',
        lift: 18,
        things: [{ kind: 'plane', dx: -26, dy: -64 }],
      },
      { id: 'toss:bag', label: 'A paper bag', pose: 'peek', lift: 24, things: [{ kind: 'paperbag', dx: 0, dy: 0 }] },
      {
        id: 'toss:wrap',
        label: 'Bubble wrap',
        pose: 'walk',
        things: [{ kind: 'wrap', dx: -34, dy: 0, flip: -1, count: 2 }],
        say: 'pop!',
      },
      {
        id: 'toss:kite',
        label: 'A kite',
        pose: 'sit',
        mood: 'purring',
        things: [{ kind: 'kite', dx: 40, dy: -64, tx: -48, ty: 50 }],
      },
    ],
  },
  {
    key: 'gpu',
    title: 'GPU cards',
    moments: [
      { id: 'gpu:warm', label: 'A warm nap', pose: 'melt', stage: 'tile' },
      { id: 'gpu:spin', label: 'Spinning a ring', pose: 'dangle', stage: 'tile' },
      { id: 'gpu:peekaboo', label: 'Peekaboo', pose: 'peek', stage: 'tile' },
      { id: 'gpu:oil', label: 'Add oil!', pose: 'pour', stage: 'tile', say: '加油!' },
      { id: 'gpu:wobble', label: 'Wobbling one', pose: 'balance', stage: 'tile', tilt: -8 },
      { id: 'gpu:wheel', label: 'A hamster wheel', pose: 'run2', stage: 'ring' },
      { id: 'gpu:swing', label: 'A ring swing', pose: 'ringhang', mood: 'purring', stage: 'ring', tilt: 14 },
      { id: 'gpu:steal', label: 'Stealing one', pose: 'push', stage: 'beside' },
      { id: 'gpu:kick', label: 'Kicking one off', pose: 'kick', stage: 'tile' },
    ],
  },
  {
    key: 'notes',
    title: 'Your notes',
    moments: [
      { id: 'notes:wave', label: 'Waving you over', pose: 'hello', mood: 'purring', stage: 'pill', say: 'hi!' },
      { id: 'notes:knock', label: 'Knock knock', pose: 'pat', stage: 'pill', say: 'tap' },
      {
        id: 'notes:sign',
        label: 'A little sign',
        pose: 'reach',
        mood: 'purring',
        stage: 'pill',
        things: [{ kind: 'sign', dx: -34, dy: 0, text: 'look ↓' }],
      },
      {
        id: 'notes:bell',
        label: 'A hand bell',
        pose: 'reach',
        mood: 'purring',
        stage: 'pill',
        things: [{ kind: 'bell', dx: -20.6, dy: -28, rotate: 18 }],
        say: 'ding!',
      },
      { id: 'notes:peekaboo', label: 'Peekaboo', pose: 'emerge', stage: 'pill', say: 'psst!' },
      {
        id: 'notes:noticed',
        label: 'You noticed!',
        pose: 'cheer',
        mood: 'purring',
        stage: 'pill',
        lift: 8,
        say: 'yay!',
      },
      {
        id: 'cheer:applause',
        label: 'Applause',
        pose: 'clap2',
        mood: 'purring',
        stage: 'croissant',
        things: [{ kind: 'confetti', dx: 0, dy: -50, t: 0.7 }],
      },
      { id: 'cheer:thumbs', label: 'A thumbs up', pose: 'thumbs', mood: 'wink', stage: 'croissant', say: 'nice!' },
    ],
  },
  {
    key: 'popup',
    title: 'Pop-up cards',
    moments: [
      { id: 'popup:read', label: 'Reading one', pose: 'read', stage: 'card', say: 'hmm' },
      { id: 'popup:peek', label: 'Peeking over one', pose: 'peek', stage: 'card' },
      { id: 'popup:swat', label: 'Swatting one', pose: 'reach', mood: 'hungry', stage: 'card' },
      { id: 'popup:nap', label: 'Napping on one', pose: 'sleep', stage: 'card' },
      { id: 'popup:knead', label: 'Kneading one', pose: 'knead', mood: 'purring', stage: 'card' },
      { id: 'popup:sniff', label: 'Sniffing one', pose: 'sniff', stage: 'card' },
      { id: 'popup:startle', label: 'Startled by one', pose: 'startle', lift: 14, say: '!' },
      { id: 'popup:scared', label: 'Scared off by one', pose: 'hiss', mood: 'hiss', say: 'hsss!' },
      { id: 'over:flip', label: 'A somersault onto one', pose: 'tuck', lift: 30, stage: 'card' },
      { id: 'over:pounce', label: 'Pouncing onto one', pose: 'stalk' },
      { id: 'over:sneak', label: 'Sneaking up on one', pose: 'creep' },
      { id: 'over:dash', label: 'A flying leap onto one', pose: 'run' },
      { id: 'over:climb', label: 'Climbing up one', pose: 'climb', stage: 'side' },
      {
        id: 'over:balloon',
        label: 'Over one by balloon',
        pose: 'hang',
        mood: 'purring',
        stage: 'none',
        things: [{ kind: 'balloon', dx: 0, dy: 0 }],
      },
      { id: 'over:umbrella', label: 'Down onto one by umbrella', pose: 'brolly', stage: 'none' },
    ],
  },
  {
    key: 'in',
    title: 'Back into view',
    moments: [
      {
        id: 'in:ladder',
        label: 'Up a ladder',
        pose: 'climb',
        stage: 'none',
        things: [{ kind: 'ladder', dx: 0, dy: -40, rope: 100 }],
      },
      {
        id: 'in:balloon',
        label: 'Holding a balloon',
        pose: 'hang',
        mood: 'purring',
        stage: 'none',
        things: [{ kind: 'balloon', dx: 0, dy: 0 }],
      },
      {
        id: 'in:trampoline',
        label: 'Off a trampoline',
        pose: 'tuck',
        stage: 'none',
        lift: 30,
        things: [{ kind: 'trampoline', dx: 0, dy: 10 }],
      },
      {
        id: 'in:heli',
        label: 'By helicopter',
        pose: 'hang',
        mood: 'purring',
        stage: 'none',
        things: [{ kind: 'heli', dx: 0, dy: -44, rope: 40 }],
      },
      {
        id: 'in:ufo',
        label: 'Beamed down by a UFO',
        pose: 'float',
        stage: 'none',
        at: 100,
        things: [{ kind: 'ufo', dx: 0, dy: -82, rope: 76 }],
      },
      { id: 'in:superhero', label: 'Like a superhero', pose: 'fly', stage: 'none' },
      { id: 'in:pogo', label: 'On a pogo stick', pose: 'pogo', stage: 'none' },
      {
        id: 'in:bubble',
        label: 'In a big bubble',
        pose: 'float',
        stage: 'none',
        things: [{ kind: 'bigbubble', dx: 0, dy: -22, scale: 0.86, front: true }],
      },
      {
        id: 'in:parachute',
        label: 'By parachute',
        pose: 'hang',
        mood: 'purring',
        stage: 'none',
        things: [{ kind: 'parachute', dx: 0, dy: -2 }],
      },
      {
        id: 'in:abseil',
        label: 'Abseiling down',
        pose: 'hang',
        stage: 'none',
        things: [{ kind: 'rope', dx: 0, dy: -80, rope: 80 }],
      },
      { id: 'in:umbrella', label: 'Under an umbrella', pose: 'brolly', stage: 'none' },
    ],
  },
  {
    key: 'mishap',
    title: 'Mishaps',
    moments: [
      { id: 'mishap:trip', label: 'A trip and a splat', pose: 'splat', say: '✦' },
      { id: 'mishap:slip', label: 'Off the end', pose: 'hang', stage: 'end' },
      { id: 'mishap:spook', label: 'Spooked by nothing', pose: 'startle', lift: 14, say: '!' },
      { id: 'mishap:sniff', label: 'Stopping to sniff', pose: 'sniff', say: 'sniff' },
      { id: 'mishap:pounce', label: 'Pouncing on a speck', pose: 'reach' },
      { id: 'mishap:fall', label: 'Off the page', pose: 'tumble', stage: 'none' },
      { id: 'mishap:drop', label: 'Dropped from up high', pose: 'balance', tilt: 10 },
    ],
  },
  {
    key: 'trap',
    title: 'Trapped',
    moments: [
      { id: 'escape:over', label: 'Out over the top', pose: 'leap', stage: 'panel', lift: 40, tilt: -14 },
      {
        id: 'escape:glass',
        label: 'Breaking the glass',
        pose: 'press',
        stage: 'panel',
        things: [{ kind: 'cracks', front: true, dx: 0, dy: -28, count: 3 }],
      },
      { id: 'escape:squeeze', label: 'Squeezing out', pose: 'sniff', stage: 'panel' },
      { id: 'escape:climb', label: 'Up the wall', pose: 'climb', stage: 'panel' },
      {
        id: 'escape:balloon',
        label: 'Floating out',
        pose: 'hang',
        mood: 'purring',
        stage: 'panel',
        lift: 20,
        things: [{ kind: 'balloon', dx: 0, dy: -20 }],
      },
      {
        id: 'escape:dig',
        label: 'Digging out',
        pose: 'crouch',
        stage: 'panel',
        things: [
          { kind: 'dirt', dx: 22, dy: -10 },
          { kind: 'dirt', dx: 30, dy: -22 },
        ],
      },
      {
        id: 'escape:poof',
        label: 'Gone in a puff',
        pose: 'sit',
        stage: 'panel',
        things: [{ kind: 'puff', front: true, dx: 0, dy: -20, scale: 1.2, opacity: 0.9 }],
      },
    ],
  },
  {
    key: 'sad',
    title: 'Low days',
    moments: [
      {
        id: 'doing:cry',
        label: 'A cry',
        pose: 'sit',
        mood: 'cry',
        things: [
          { kind: 'tear', dx: -7, dy: -28 },
          { kind: 'tear', dx: 8, dy: -22 },
        ],
      },
      {
        id: 'doing:rain',
        label: 'Her own rain cloud',
        pose: 'sit',
        mood: 'sad',
        things: [{ kind: 'raincloud', dx: 0, dy: -76, count: 12 }],
      },
      { id: 'doing:sulk', label: 'A sulk', pose: 'rest', mood: 'sulk', things: [{ kind: 'grumble', dx: 12, dy: -44 }] },
      { id: 'doing:mope', label: 'Moping', pose: 'walk', mood: 'sad' },
    ],
  },
];

const KNOWN = new Set(SCRAPBOOK.flatMap((group) => group.moments.map((moment) => moment.id)));
export const SCRAPBOOK_SIZE = KNOWN.size;

// This page's copy, for when storage is blocked.
let kept = null;
export function readScrapbook() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) ?? 'null');
    if (saved && typeof saved === 'object') return (kept = saved);
  } catch {
    // Blocked or garbled: this page's copy.
  }
  return kept ?? (kept = {});
}

// Kept the first time (a moment of hers it knows); true if it was new.
export function keepMoment(id) {
  if (!KNOWN.has(id)) return false;
  const book = readScrapbook();
  if (book[id]) return false;
  const next = { ...book, [id]: Date.now() };
  kept = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: it lasts as long as the page.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  return true;
}

// When the scrapbook was last looked through: anything kept since is new.
export function readViewed() {
  try {
    return Number(window.localStorage.getItem(VIEWED_KEY)) || 0;
  } catch {
    return 0;
  }
}
export function markViewed() {
  try {
    window.localStorage.setItem(VIEWED_KEY, String(Date.now()));
  } catch {
    // Storage blocked.
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useScrapbook() {
  const [book, setBook] = useState(() => ({ kept: readScrapbook(), viewed: readViewed() }));
  useEffect(() => {
    const update = () => setBook({ kept: { ...readScrapbook() }, viewed: readViewed() });
    window.addEventListener(EVENT, update);
    // Kept in another tab.
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);
  return book;
}

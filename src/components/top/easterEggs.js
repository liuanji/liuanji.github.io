// Easter eggs. The availability bars draw from one pool per bar state, an
// idle GPU's details box from IDLE_GPU, and the CPU and RAM boxes from a pool
// per pressure band.
//
// The servers are named after bakes, so most lines are baking puns; {host}
// becomes the server's name. Keep bar lines short and free of time words ("all
// day"), since a bar can be a minute or a week long. "none" means the monitor
// itself was not running, so its lines must not suggest the server was down.
const PHRASES = {
  up: [
    '{host} worked really hard',
    '{host} didn’t take a single nap',
    '{host} was fresh out of the oven',
    '{host} stayed warm and crispy',
    '{host} rose to the occasion',
    '{host} was on a roll',
    '{host} never missed a beat',
    '{host} answered every knock',
    '{host} showed up for every check',
    '{host} was the toast of the lab',
    '{host} kneaded no rest',
    '{host} kept baking non-stop',
    'Not a single crumb of downtime',
    '{host} stayed golden brown',
    '{host} was steady as a rolling pin',
    '{host} gave it 100%',
    '{host} was there for you',
    'Smooth as butter on {host}',
    '{host} was up and proofing',
    '{host} hummed along happily',
    'All green, all good',
    '{host} served fresh batches',
    '{host} earned a gold star',
    '{host} was reliably delicious',
    '{host} kept the GPUs warm',
    'Uptime: chef’s kiss',
    '{host} was in the zone',
    'Zero hiccups from {host}',
    '{host} rolled with it',
    '{host} was butter-smooth',
    '{host} kept the lights on',
    '{host} was a good loaf',
    '{host} stayed perfectly baked',
    'Freshly baked uptime',
    '{host} was flour power',
    '{host} kept the dough rising',
    '{host} was a smart cookie',
    'Best thing since sliced bread',
    '{host} was well-bread',
    '{host} kept its crust together',
    '{host} was proof of reliability',
    '{host} was a piece of cake',
    '{host} took the cake',
    '{host} was batter than ever',
    '{host} rose and shone',
    '{host} stayed toasty',
    'Sweet, sweet uptime',
    '{host} was the yeast of our worries',
    '{host} was oven-ready',
    '{host} did the heavy lifting',
  ],
  partial: [
    '{host} took a quick nap',
    '{host} blinked for a moment',
    '{host} stepped out for a coffee',
    '{host} had a little hiccup',
    '{host} got a bit crumbly',
    '{host} needed a breather',
    'A small dent in the dough',
    '{host} slipped on some flour',
    '{host} had a tiny wobble',
    '{host} paused to proof',
    '{host} was mostly golden',
    '{host} had a sticky moment',
    '{host} dozed off briefly',
    'Just a crumb of downtime',
    '{host} sneezed in the flour',
    '{host} lost a few crumbs',
    '{host} briefly ran out of flour',
    '{host} had a half-baked moment',
    '{host} needed a quick stretch',
    '{host} took a tea break',
    '{host} had a soggy bottom',
    '{host} was a little underbaked',
    'A tiny crack in the crust',
    '{host} paused to catch its breath',
    '{host} went out for fresh air',
  ],
  down: [
    '{host} was out of the oven',
    '{host} went stale',
    '{host} fell flat',
    '{host} took a long nap',
    '{host} didn’t rise this time',
    '{host} was off the menu',
    'The oven went cold on {host}',
    '{host} was sold out',
    '{host} crumbled',
    '{host} took some time off',
    '{host} was cooling on the rack',
    '{host} needed a reboot hug',
    '{host} got stuck in the dough',
    'Someone unplugged the oven',
    '{host} was left in the oven too long',
    '{host} was half-baked',
    '{host} got burnt',
    '{host} needed a long rest',
    '{host} was out of yeast',
    '{host} went back in the oven',
    '{host} took an extended break',
    'The bakery was closed',
    '{host} called in sick',
    '{host} lost its crunch',
  ],
  none: [
    'Nobody was watching {host}',
    'The monitor was out for lunch',
    '{host} was off the record',
    'The bakery cam was off',
    'No one checked on {host}',
    'The monitor was snoozing',
    '{host}’s diary is blank here',
    'Lost in a cloud of flour',
    'The monitor was off duty',
    'Unwatched dough',
    'The monitor took a coffee break',
    'The baker was away',
    'Nobody was minding the oven',
    'The monitor was baking elsewhere',
    '{host} went unobserved',
    'No notes from the monitor',
    'The kitchen log is empty here',
    'Records got lost in the flour',
  ],
};

// Lines for a GPU nobody is using, in place of "Nobody is using this GPU".
const IDLE_GPU = [
  'Free to bake: grab it!',
  'This oven is free',
  'Nobody’s kneading this one',
  'Fresh and ready for your job',
  'Preheated, just add jobs',
  'Up for grabs',
  'Napping until someone needs it',
  'An empty tray, waiting for dough',
  'Idle and dreaming of tensors',
  'Quiet as a bakery at dawn',
  'Waiting patiently for a job',
  'All yours, if you want it',
  'Resting between batches',
  'No dough in this oven',
  'On a little coffee break',
  'Twiddling its transistors',
  'Ready, set, bake!',
  'Cooling on the rack, ready to go',
  'Looking for a baker',
  'Warm, empty and waiting',
];

// CPU and RAM lines by how hard the part is working: each band starts at its
// share (0-1) and runs up to the next one.
const PRESSURE = {
  cpu: [
    {
      from: 0,
      lines: [
        'Most cores are napping',
        'The ovens are barely warm',
        'Plenty of room to bake',
        '{host} is taking it easy',
        'Cores sipping tea',
        'A quiet kitchen',
        'The kitchen is half asleep',
        'Ovens on low',
        'Cores daydreaming about bread',
        '{host} is in no rush',
        'Slow and steady proofing',
        'Just a gentle simmer',
        'Room for a few more bakers',
        'The rolling pins are resting',
      ],
    },
    {
      from: 0.3,
      lines: [
        'Cores humming along',
        'A steady bake',
        'Busy but comfy',
        'The kitchen is bustling',
        'The dough is rising nicely',
        'Bread in, bread out',
        'A good rhythm going',
        'Kneading at a steady pace',
        '{host} found its groove',
        'Pleasantly busy',
        'The mixers are whirring',
        'Warm ovens, happy cores',
      ],
    },
    {
      from: 0.7,
      lines: [
        'The ovens are roaring',
        '{host} is breaking a sweat',
        'Every baker has their hands full',
        'Things are heating up',
        'Cores working overtime',
        'The ovens are working hard',
        'Cores at a brisk trot',
        '{host} is in the zone',
        'Flour flying everywhere',
        'Batch after batch',
        'Hot out of every oven',
        'The kitchen is buzzing',
      ],
    },
    {
      from: 0.9,
      lines: [
        'Every core is kneading!',
        'Full steam ahead',
        'Ovens at full blast',
        '{host} is giving it everything',
        'No free hands in the kitchen',
        'Running at full rise',
        '{host} is maxed out',
        'Every oven is glowing',
        'All hands on dough!',
        'Cores flat out',
        'Hot enough to bake on',
        'Not a single idle core',
      ],
    },
  ],
  ram: [
    {
      from: 0,
      lines: [
        'Plenty of room in the pantry',
        'Shelves to spare',
        'Loads of room for loaves',
        'The pantry is roomy',
        'Room for another batch',
        'An almost empty pantry',
        'Lots of shelf space',
        'Room to stretch the dough',
        'Memory to spare',
        'The bread bin is roomy',
        '{host} has plenty of room',
        'Wide open shelves',
      ],
    },
    {
      from: 0.5,
      lines: [
        'A well-stocked pantry',
        'The shelves are filling up',
        'Comfortably full of dough',
        'Stocked but not stuffed',
        'Neatly stacked shelves',
        'A healthy stash of dough',
        'The pantry is in good shape',
        'Nicely stocked loaves',
        'Room left for dessert',
        '{host} is well fed',
      ],
    },
    {
      from: 0.8,
      lines: [
        'The pantry is getting crowded',
        'Shelves are nearly full',
        'Squeezing in a few more loaves',
        'Running low on shelf space',
        'Shelves are getting snug',
        'Squeeze the croissants in',
        'The bread bin is nearly full',
        'Getting cozy in the pantry',
        'Mind the shelf space',
        '{host} could use more shelves',
      ],
    },
    {
      from: 0.9,
      lines: [
        'Not a crumb of room left',
        'The pantry is bursting',
        '{host} is out of shelf space',
        'Time to clear some shelves',
        'Packed like a bread bin',
        'Shelves overflowing',
        'Stuffed like a croissant',
        'The pantry door won’t close',
        'Memory bursting at the seams',
        '{host} needs a bigger pantry',
        'Every shelf is taken',
      ],
    },
  ],
};

// Lines for the availability legend: how much of the range was in a state,
// from none of it, to a few bars, to many.
const LEGEND = {
  up: {
    none: ['Not a single bake came out', 'The ovens stayed cold'],
    few: ['Only a few good batches', 'Barely kept the lights on'],
    many: ['Mostly fresh out of the oven', 'Kept the bread coming', 'Reliable as morning toast'],
    all: ['Every single batch came out perfect', 'Not a crumb out of place', 'Flawless baking all along'],
  },
  partial: {
    none: ['No hiccups at all', 'Smooth as butter', 'Not a single wobble'],
    few: ['Just a few wobbles', 'A hiccup here and there', 'A couple of sticky moments'],
    many: ['Quite a few wobbles', 'The dough kept slipping', 'Hiccups all over the place'],
  },
  down: {
    none: ['Nothing got burnt', 'No outages, no crumbs', 'Not one oven went cold'],
    few: ['A couple of burnt batches', 'The odd oven went cold', 'A few loaves fell flat'],
    many: ['Rough times in the kitchen', 'Too many burnt batches', 'The ovens kept going cold'],
  },
  none: {
    none: ['The monitor never blinked', 'Watched every single moment', 'Not a moment unrecorded'],
    few: ['The monitor napped a little', 'A few blank pages in the diary', 'Briefly off duty'],
    many: ['History starts here: the monitor is new', 'Lots of unrecorded baking', 'The diary is mostly blank'],
  },
};

// What GPU time would cost in the cloud, framed as value the lab keeps. {amount}
// is in S$, {croissants} the same in croissants, {user} a person and {who} the
// lab or a server.
const CLOUD = {
  user: [
    '{user}’s GPU time is worth ≈ {amount} in the cloud',
    '{user} saved the lab ≈ {amount} in cloud bills',
    'In the cloud, {user}’s runs would cost ≈ {amount}',
    '≈ {amount} of cloud GPUs, home-baked by {user}',
    '{user} baked ≈ {amount} of cloud time in-house',
    '{user}: ≈ {amount} of cloud time, or about {croissants} croissants',
  ],
  total: [
    '{who} baked ≈ {amount} of cloud GPU time in-house',
    'All this would cost ≈ {amount} in the cloud',
    '≈ {amount} in cloud bills avoided; treat yourselves',
    'Home-baked compute worth ≈ {amount}',
    'That’s ≈ {amount}, or about {croissants} croissants',
  ],
};

// Fresh on every page load, so each visit deals out different lines, while a bar
// keeps its line as long as the page stays open.
const SEED = Math.floor(Math.random() * 2 ** 32);

function hash(text) {
  let value = SEED ^ 0x811c9dc5;
  for (const character of text) {
    value = Math.imul(value ^ character.codePointAt(0), 0x01000193);
  }
  return value >>> 0;
}

// state is one of uptimeState's: 'up', 'partial', 'down' or 'none'.
export function barPhrase(state, host, barStart) {
  const pool = PHRASES[state];
  return pool[hash(`${state}|${host}|${barStart}`) % pool.length].replace('{host}', host);
}

// part is 'cpu' or 'ram'; share is how much of it is in use, from 0 to 1.
export function pressurePhrase(part, share, host) {
  const bands = PRESSURE[part];
  const band = bands.filter((candidate) => share >= candidate.from).pop() ?? bands[0];
  return band.lines[hash(`${part}|${band.from}|${host}`) % band.lines.length].replace('{host}', host);
}

// state is one of uptimeState's; count of total bars were in it. "A few" is up
// to a tenth of them, or for up, anything short of most. key (such as a server's
// name) deals different lines to different rows with the same counts.
export function legendPhrase(state, count, total, key = '') {
  const pools = LEGEND[state];
  const share = total ? count / total : 0;
  let band;
  if (count === 0) band = 'none';
  else if (state === 'up') band = count === total ? 'all' : share >= 0.5 ? 'many' : 'few';
  else band = share <= 0.1 ? 'few' : 'many';
  const pool = pools[band];
  return pool[hash(`legend|${state}|${band}|${key}`) % pool.length];
}

// amount and croissants are already formatted; croissant lines are left out
// when there are fewer than two. With a user it is that person's line,
// otherwise the total for who.
export function cloudPhrase({ amount, croissants, user = null, who = 'The lab' }) {
  const pool = CLOUD[user ? 'user' : 'total'].filter((line) => croissants >= 2 || !line.includes('{croissants}'));
  return pool[hash(`cloud|${user ?? who}`) % pool.length]
    .replace('{amount}', amount)
    .replace('{croissants}', croissants.toLocaleString('en-US'))
    .replace('{user}', user)
    .replace('{who}', who);
}

export function idleGpuPhrase(host, index) {
  return IDLE_GPU[hash(`idle|${host}|${index}`) % IDLE_GPU.length];
}

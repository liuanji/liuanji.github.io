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
    '{host} was the cream of the crop',
    '{host} brought home the bread',
    '{host} kept the oven humming',
    '{host} was a well-oiled whisk',
    '{host} was on the rise',
    '{host} was crusty in the best way',
    '{host} kept everything in good knead',
    '{host} was the bee’s knees',
    'Not a soggy moment on {host}',
    '{host} was the icing on the cake',
    '{host} had its baking mitts on',
    '{host} kept calm and baked on',
    '{host} was a tough cookie',
    '{host} was anything but flaky',
    'Every check came out golden',
    '{host} was a reliable sourdough starter',
    '{host} had the oven on standby',
    '{host} was the whole loaf',
    '{host} kept a stiff upper crust',
    '{host} was raring to dough',
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
    '{host} dropped a spoon',
    '{host} burnt one tray',
    '{host} rebooted its whisk',
    '{host} had a flour cloud moment',
    '{host} rubbed its eyes',
    '{host} wobbled like a soufflé',
    '{host} skipped a beat',
    '{host} misplaced its rolling pin',
    '{host} got flour in its fan',
    'A bubble in the batter',
    '{host} was slightly crumbly',
    '{host} took a pastry break',
    '{host} lost its place in the recipe',
    '{host} had a cracked macaron',
    '{host} went to check the proofing',
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
    '{host} was in the cooling rack',
    '{host} hung up its apron',
    '{host} forgot to preheat',
    '{host} went off to the farmers’ market',
    'The {host} oven needed a reset',
    '{host} was taking the cake elsewhere',
    '{host} rested like a dough ball',
    '{host} dropped its baking tray',
    '{host} turned into toast',
    '{host} was closed for renovations',
    '{host} had a soufflé collapse',
    '{host} ran out of butter',
    'The oven light was off on {host}',
    '{host} was out of the kitchen',
    '{host} needed a little love',
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
    'The notebook was in the other apron',
    'The monitor forgot to take notes',
    'The clipboard was missing',
    'The monitor was proofing elsewhere',
    'Nobody wrote this one down',
    'The recipe card is blank here',
    'The monitor was on a croissant run',
    'An unlabelled tray',
    'This page of the cookbook is missing',
    'The monitor had its oven mitts on',
    'A mystery bake',
    'The monitor was washing dishes',
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

// Lines across a server's dimmed GPUs while it is not reporting, in the present
// tense since they describe right now; {host} is the server's name.
const HOST_DOWN = [
  '{host} is out of the oven for now',
  '{host} is taking a little nap',
  '{host} is cooling on the rack',
  '{host} stepped out for more flour',
  '{host} is waiting for the dough to rise',
  '{host} has gone quiet in the kitchen',
  '{host} is off the menu for a moment',
  'The ovens at {host} are cold right now',
  '{host} is having a long coffee break',
  '{host} wandered off to the market',
  '{host} is resting between batches',
  'Nobody is answering the door at {host}',
];

// Lines for a reserved GPU nobody is running on yet, in place of the idle
// ones: the viewer's own, or someone else's, where {user} is who holds it.
const RESERVED_IDLE = {
  mine: [
    'All yours: happy debugging!',
    'Your oven is preheated',
    'Reserved and ready for your bugs',
    'Your tray is waiting',
    'Saved a warm spot for you',
    'Your own little test kitchen',
    'Go squash those bugs',
    'Your bench is clear and ready',
    'Ready when your debugger is',
    'Keeping it warm for you',
  ],
  others: [
    'Saved for {user}’s debugging',
    '{user} is testing a recipe here',
    '{user}’s test kitchen for now',
    'Please let {user} debug in peace',
    'Held for {user}: try another oven',
    '{user} called dibs on this one',
    'This tray is set aside for {user}',
    '{user} is proofing some code here',
    'Shh, {user} is debugging',
    'Kept warm for {user}',
  ],
};

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
  // A scratch disk is the bakery's flour store; bands follow DISK_LEVELS.
  disk: [
    {
      from: 0,
      lines: [
        'Plenty of room in the flour store',
        'The storeroom is wide open',
        'Room for many more batches',
        'Empty shelves, ready for dough',
        'A roomy pantry',
        'Space to spare on {host}',
      ],
    },
    {
      from: 0.5,
      lines: [
        'The storeroom is filling up nicely',
        'Half the shelves are stocked',
        'A well-stocked pantry',
        'Still room for a few sacks of flour',
        'Busy shelves, but no squeeze yet',
      ],
    },
    {
      from: 0.85,
      lines: [
        'The flour sacks are piling up',
        'Getting snug in the storeroom',
        'Time to tidy the pantry',
        'Old batches could make room',
        'Shelves nearly full on {host}',
      ],
    },
    {
      from: 0.95,
      lines: [
        'The storeroom door won’t close',
        'Not a crumb of space left',
        'Please clear out some old checkpoints',
        'The pantry is bursting',
        '{host} needs a bigger storeroom',
      ],
    },
  ],
};

// Lines for the availability legend: how much of the range was in a state,
// from none of it, to a few bars, to many.
const LEGEND = {
  up: {
    none: [
      'Not a single bake came out',
      'The ovens stayed cold',
      'The bakery never opened',
      'No fresh bread this time',
      'The display case stayed empty',
      'Not one loaf rose',
      'The rolling pins gathered dust',
      'Closed for the season, it seems',
      'No smell of bread in the air',
      'The oven timer never rang',
      'Empty baskets all round',
      'The baker never showed up',
    ],
    few: [
      'Only a few good batches',
      'Barely kept the lights on',
      'A handful of warm loaves',
      'Slim pickings at the counter',
      'The oven sputtered along',
      'A few golden moments',
      'More crumbs than loaves',
      'A thin slice of uptime',
      'The dough was reluctant',
      'A few brave loaves made it',
      'The oven had good moments',
      'Some bread, a lot of waiting',
      'A modest little bake',
    ],
    many: [
      'Mostly fresh out of the oven',
      'Kept the bread coming',
      'Reliable as morning toast',
      'The shelves stayed well stocked',
      'Plenty of golden batches',
      'Warm and crispy, mostly',
      'A good, solid bake',
      'The dough mostly behaved',
      'The ovens mostly stayed toasty',
      'A happy, busy bakery',
      'Mostly golden, a few crumbs',
      'Good bread on most days',
      'The kitchen kept humming',
      'Rising nicely overall',
    ],
    all: [
      'Every single batch came out perfect',
      'Not a crumb out of place',
      'Flawless baking all along',
      'A perfect bake, start to finish',
      'Golden brown, every one',
      'The ovens never skipped a beat',
      'Chef’s kiss, every batch',
      'Nothing but fresh bread',
      'Not a single crumb of downtime',
      'A bakery that never sleeps',
      'Gold stars all round',
      'The best thing since sliced bread',
      'Perfectly proofed, every time',
      'Butter-smooth from end to end',
    ],
  },
  partial: {
    none: [
      'No hiccups at all',
      'Smooth as butter',
      'Not a single wobble',
      'Not a crumb dropped',
      'Steady hands in the kitchen',
      'No soggy bottoms here',
      'Calm and steady baking',
      'Every tray came out whole',
      'No wobbly soufflés',
      'Not a single sticky moment',
      'The whisks never slipped',
      'Clean counters all round',
    ],
    few: [
      'Just a few wobbles',
      'A hiccup here and there',
      'A couple of sticky moments',
      'A sprinkle of hiccups',
      'Only a dusting of trouble',
      'A few cracks in the crust',
      'A dropped spoon or two',
      'The odd lopsided loaf',
      'A few bubbles in the batter',
      'Mostly smooth, a bit lumpy',
      'A pinch of trouble',
      'A few sneezes in the flour',
    ],
    many: [
      'Quite a few wobbles',
      'The dough kept slipping',
      'Hiccups all over the place',
      'Flour everywhere',
      'A bumpy batch of bakes',
      'Lots of half-baked moments',
      'The soufflés kept wobbling',
      'A lot of lopsided loaves',
      'The kitchen was a bit chaotic',
      'Too many dropped spoons',
      'The batter was lumpy',
      'Plenty of sticky fingers',
    ],
  },
  down: {
    none: [
      'Nothing got burnt',
      'No outages, no crumbs',
      'Not one oven went cold',
      'The ovens stayed warm',
      'Nothing fell flat',
      'Zero burnt trays',
      'The bakery never closed',
      'Not a single cold oven',
      'No loaves were harmed',
      'The fire alarm stayed quiet',
      'No smoke, no fuss',
      'Every oven kept its glow',
    ],
    few: [
      'A couple of burnt batches',
      'The odd oven went cold',
      'A few loaves fell flat',
      'A few trays to scrape clean',
      'One or two kitchen mishaps',
      'A little smoke from the oven',
      'A loaf or two got burnt',
      'A few trips to the repair shop',
      'The occasional cold oven',
      'A few closed-for-lunch signs',
      'Some dough fell on the floor',
      'A brief brownout in the bakery',
    ],
    many: [
      'Rough times in the kitchen',
      'Too many burnt batches',
      'The ovens kept going cold',
      'The bakery needs a hug',
      'Lots of flat loaves',
      'The fire alarm got a workout',
      'The ovens need some TLC',
      'Many trays in the bin',
      'The bakery kept closing early',
      'Time to call the oven repairer',
      'Too many cold kitchens',
      'The bread basket stayed empty',
    ],
  },
  none: {
    none: [
      'The monitor never blinked',
      'Watched every single moment',
      'Not a moment unrecorded',
      'Every bake written down',
      'The diary is full',
      'Nothing escaped the notebook',
      'The monitor saw it all',
      'Every crumb accounted for',
      'A complete recipe book',
      'Not a page missing',
      'The camera never looked away',
      'Perfect attendance from the monitor',
    ],
    few: [
      'The monitor napped a little',
      'A few blank pages in the diary',
      'Briefly off duty',
      'A few smudges in the notebook',
      'The monitor stepped out once or twice',
      'A few unlabelled trays',
      'A couple of missing recipe cards',
      'The monitor blinked a few times',
      'A few coffee breaks for the monitor',
      'Some pages stuck together',
      'A few gaps in the logbook',
      'The monitor wandered off briefly',
    ],
    many: [
      'History starts here: the monitor is new',
      'Lots of unrecorded baking',
      'The diary is mostly blank',
      'The notebook has many empty pages',
      'Mostly a mystery bake',
      'The monitor missed a lot of baking',
      'The logbook has big holes',
      'The monitor was mostly elsewhere',
      'Lots of unlabelled trays',
      'Most of the recipe cards are missing',
      'The monitor slept through a lot',
      'A lot of baking went unrecorded',
    ],
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
    '{user} kept ≈ {amount} out of the cloud’s pockets',
    'Renting {user}’s GPU time would cost ≈ {amount}',
    '{user}’s runs: ≈ {amount} of cloud time, baked at home',
    '{user} skipped ≈ {amount} in cloud fees. Nice!',
    '{user}’s experiments are worth ≈ {amount} of cloud time',
    'Thanks to the lab’s ovens, {user} saved ≈ {amount}',
    '{user}’s cloud savings ≈ {croissants} croissants',
    '{user}’s GPU time ≈ {croissants} croissants (≈ {amount})',
    'That’s about {croissants} croissants of compute for {user}',
  ],
  total: [
    '{who} baked ≈ {amount} of cloud GPU time in-house',
    'All this would cost ≈ {amount} in the cloud',
    '≈ {amount} in cloud bills avoided; treat yourselves',
    'Home-baked compute worth ≈ {amount}',
    'That’s ≈ {amount}, or about {croissants} croissants',
    '{who} saved ≈ {amount} in cloud rental',
    'Cloud providers missed out on ≈ {amount}',
    '≈ {amount} of compute, fresh from our own ovens',
    'Renting this in the cloud: ≈ {amount}',
    '≈ {amount} that stayed in the lab’s pockets',
    '{who} kept ≈ {amount} out of the cloud',
    'Enough cloud savings for about {croissants} croissants',
    'About {croissants} croissants’ worth of GPU time',
    '≈ {amount} saved; croissants on the lab?',
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
// key (such as a disk's mount) deals different lines to parts of one host.
export function pressurePhrase(part, share, host, key = '') {
  const bands = PRESSURE[part];
  const band = bands.filter((candidate) => share >= candidate.from).pop() ?? bands[0];
  return band.lines[hash(`${part}|${band.from}|${host}|${key}`) % band.lines.length].replace('{host}', host);
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

// The closing line of someone else's reservation box, asking others to leave
// the GPU alone; {user} is who holds it.
const RESERVED_PLEASE = [
  'Please let {user} debug in peace.',
  '{user} is debugging here; try another oven.',
  'Shh, {user} is chasing a bug.',
  'This oven is warming {user}’s test batch.',
  'Hands off the dough: {user} is kneading it.',
  '{user} is proofing some code; please bake elsewhere.',
  'Saved for {user}; plenty of other ovens are free.',
  'Let {user} squash those bugs undisturbed.',
  '{user} has this tray for now; thanks for sharing.',
  'Quiet please, {user} is taste-testing.',
];

export function reservedPleasePhrase(host, index, holder) {
  return RESERVED_PLEASE[hash(`please|${host}|${index}|${holder}`) % RESERVED_PLEASE.length].replace('{user}', holder);
}

// holder reserved the GPU; mine says whether that is the viewer.
export function reservedIdlePhrase(host, index, holder, mine) {
  const pool = RESERVED_IDLE[mine ? 'mine' : 'others'];
  return pool[hash(`reserved|${host}|${index}|${holder}`) % pool.length].replace('{user}', holder);
}

export function idleGpuPhrase(host, index) {
  return IDLE_GPU[hash(`idle|${host}|${index}`) % IDLE_GPU.length];
}

// Chosen once per page load, so the line stays put while the server is down.
export function hostDownPhrase(host) {
  return HOST_DOWN[hash(`down|${host}`) % HOST_DOWN.length].replaceAll('{host}', host);
}

// Lines for the baked croissants in the milestone box's pastry pile, one per
// croissant on hover: baking crossed with machine learning.
const PASTRY_PILE = [
  'Proofed overnight, like a long training run',
  'Smells like a converged loss',
  'Made from 100% organic gradients',
  'Baked with love and tensors',
  'More layers than a transformer',
  'Rose nicely, unlike the validation loss',
  'Warmed up slowly, like a good learning rate',
  'Fresh out of the oven after 100 epochs',
  'Kneaded in mini-batches',
  'Just enough butter, no overfitting',
  'Pulled out at the best checkpoint',
  'Flaky, but never like a flaky test',
  'Batch-normalised for an even bake',
  'Crunchy outside, fluffy latent space inside',
  'No dropout: every flake made it',
  'Sampled at a temperature of 180 °C',
  'Seed fixed, so every bite is reproducible',
  'Out of the oven before the deadline',
  'Pairs well with a kopi and a paper deadline',
  'Attention is all this croissant needs',
];

// Lines are dealt in a fresh order each page load, so no two croissants in the
// pile share one.
export function pastryPilePhrase(index) {
  return PASTRY_PILE[(hash('pile') + index) % PASTRY_PILE.length];
}

// Baker card titles, earned from how someone bakes (see bakerTraits), each with
// lines crossing baking with machine learning. {host} is their favourite server
// and {peak} their most GPUs at once.
const BAKER_TITLES = {
  holiday: {
    title: 'On a long holiday',
    lines: [
      'The sourdough starter is in the fridge until they return',
      'Off gathering fresh datasets somewhere sunny',
      'Their oven mitts are hanging by the door',
    ],
  },
  fresh: {
    title: 'Fresh face',
    lines: [
      'Just joined the kitchen; first batch in the oven',
      'Still learning where the flour is kept',
      'Warming up, like a good learning rate schedule',
    ],
  },
  batch: {
    title: 'Batch baker',
    lines: [
      'Bakes by the trayful: up to {peak} GPUs at once',
      'Why bake one croissant when you can bake {peak}?',
      'Data parallel, dough parallel',
    ],
  },
  weekend: {
    title: 'Weekend baker',
    lines: [
      'Saves the best bakes for Saturday',
      'Weekend proofing, Monday results',
      'The ovens are quiet, so the weekend is theirs',
    ],
  },
  night: {
    title: 'Night owl',
    lines: [
      'Most of their dough rises after dark',
      'Bakes while the city sleeps',
      'Night shift: shorter queues, warmer ovens',
    ],
  },
  loyal: {
    title: 'Loyal regular',
    lines: [
      '{host} is their favourite oven',
      'Knows every quirk of {host}’s oven',
      'Would not trust their dough to any oven but {host}',
    ],
  },
  globetrotter: {
    title: 'Globetrotter',
    lines: [
      'Has a tray in every oven in the lab',
      'Load-balancing their dough across all three ovens',
      'Bakes wherever the oven is warm',
    ],
  },
  daily: {
    title: 'Daily baker',
    lines: ['A daily loaf, like a nightly build', 'In the kitchen almost every day', 'Never misses a morning bake'],
  },
  steady: {
    title: 'Steady baker',
    lines: [
      'Steady hands, steady loss curve',
      'Keeps a calm, even bake',
      'Bakes when inspiration (and a free GPU) strikes',
    ],
  },
};

export function bakerTitle(key) {
  return BAKER_TITLES[key].title;
}

// The same line for a person all visit long.
export function bakerLine(key, user, { host = '', peak = '' } = {}) {
  const lines = BAKER_TITLES[key].lines;
  return lines[hash(`baker|${key}|${user}`) % lines.length].replaceAll('{host}', host).replaceAll('{peak}', peak);
}

// Short status lines for a GPU someone is using, in place of "In use": one set
// while it computes hard, one while it holds memory but barely computes. At most
// 16 characters, so they fit on one line under the GPU box's picture.
const BUSY_GPU = {
  hard: [
    'In the oven',
    'Baking away',
    'Kneading tensors',
    'Whisking batches',
    'Full heat ahead',
    'Rising nicely',
    'Crunching crumbs',
    'Busy as a bakery',
    'Folding layers',
    'Proofing a model',
  ],
  gentle: [
    'Gently proofing',
    'Dough resting',
    'Slow-rising',
    'On a low simmer',
    'Warming the oven',
    'Letting it rise',
    'Cooling off',
    'Dough on hold',
  ],
};

// Short status lines for a GPU nobody is using, in place of "Idle"; also at
// most 16 characters.
const FREE_GPU = [
  'Oven is free',
  'Ready to bake',
  'Cool and ready',
  'Free to bake',
  'Awaiting dough',
  'Empty oven',
  'Open for orders',
  'Fresh and free',
  'Zero epochs yet',
  'No dough inside',
  'Loss undefined',
  'Rack is empty',
];

export function freeGpuPhrase(host, index) {
  return FREE_GPU[hash(`free|${host}|${index}`) % FREE_GPU.length];
}

// utilization is the GPU's compute load in percent.
export function busyGpuPhrase(host, index, utilization) {
  const pool = BUSY_GPU[utilization >= 30 ? 'hard' : 'gentle'];
  return pool[hash(`busy|${host}|${index}`) % pool.length];
}

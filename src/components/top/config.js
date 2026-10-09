// The exporter refreshes the live overview every collection cycle and the
// longer summaries less often; polling pauses while the tab is hidden.
export const LIVE_REFRESH_MS = 60_000;
export const HISTORY_REFRESH_MS = 5 * 60_000;

export const RANGES = [
  { value: '1h', label: 'Hour', title: 'Last hour', hours: 1, ago: '1 hour ago' },
  { value: '24h', label: 'Day', title: 'Last 24 hours', hours: 24, ago: '24 hours ago' },
  { value: '7d', label: 'Week', title: 'Last 7 days', hours: 7 * 24, ago: '7 days ago' },
  { value: '30d', label: 'Month', title: 'Last 30 days', hours: 30 * 24, ago: '30 days ago' },
  { value: '90d', label: '3 months', title: 'Last 90 days', hours: 90 * 24, ago: '90 days ago' },
  { value: '365d', label: 'Year', title: 'Last 365 days', hours: 365 * 24, ago: '1 year ago' },
];
export const DEFAULT_RANGE = RANGES[1];

// Categorical slots validated for colour-vision deficiency on the white cards
// (all pairs). Aqua is below 3:1 on white, so every use carries a visible value.
export const SERIES = {
  compute: { label: 'Compute load', color: '#2563EB', track: '#2563EB1F' },
  memory: { label: 'Memory', color: '#1BAF7A', track: '#1BAF7A29' },
  busy: { label: 'GPUs in use', color: '#EB6834', track: '#EB683424' },
  // Muted so that disks nearing full, in the warm and hot hues, stand out.
  disk: { label: 'Disk', color: '#5B6CC9', track: '#5B6CC924' },
};

// Soft, distinct hues that tell users apart in the compact view; a name always
// maps to the same one. They sit beside the name, never alone, and avoid the
// compute blue and memory green.
export const USER_COLORS = [
  '#E07A5F',
  '#3D9A8B',
  '#8E7CC3',
  '#D9A23B',
  '#5E8FD0',
  '#C9668F',
  '#7BA05B',
  '#A47551',
  '#4FA3B8',
  '#B07AA1',
];

// Status colours always appear next to their label, never alone.
export const HOST_STATUS = {
  online: { label: 'Online', color: '#0CA30C' },
  stale: { label: 'Delayed', color: '#FAB219' },
  error: { label: 'Unreachable', color: '#D03B3B' },
  unseen: { label: 'Waiting for data', color: '#94A3B8' },
  // The monitor itself has gone quiet for a while (the jump machine down or
  // rebooting), so nothing is known about the server: closed, rather than down.
  closed: { label: 'Closed for now', color: '#C58A3A' },
};

// GPU readings worth a glance: warm, then hot. Temperature in °C, power as a
// share of the GPU's enforced power limit. Same hues as the Delayed and
// Unreachable statuses, darkened so the text keeps 4.5:1 on white and on the tint.
export const TEMPERATURE_LEVELS_C = { warm: 65, hot: 75 };
export const POWER_LEVELS = { warm: 0.7, hot: 0.9 };
// The compact view's thermometer and lightning icons appear at `from` and warm
// steadily, from a dim amber to the hot red, until `to`. Temperature in °C,
// power as a share of the GPU's enforced power limit. Temperature tops out at
// the overheat warning (OVERHEAT_C), where the tile itself turns red.
export const TEMPERATURE_ICON_RANGE = { from: 60, to: 75 };
export const POWER_ICON_RANGE = { from: 0.7, to: 1 };
// From this share of its power limit a GPU's bolt fills in and sparkles, the
// power key's end state: a quiet sign it is working flat out, not a warning.
export const POWER_SPARKLE_SHARE = 0.85;

// A server's RAM as a share of its total; jobs get killed when it runs out.
export const RAM_LEVELS = { warm: 0.8, hot: 0.9 };
// A disk's used share, as df counts it: used / (used + available).
export const DISK_LEVELS = { warm: 0.85, hot: 0.95 };
// Users holding less than this on a disk are summed as "others".
export const SMALL_USER_BYTES = 100 * 1024 ** 3;
// Cleanup reminders. Below CLEANUP.from full, nobody is asked; from there,
// anyone holding more than an allowance of the disk is, and the allowance
// shrinks steadily as the disk fills, from CLEANUP.share of the disk at
// CLEANUP.from down to CLEANUP.floor when full (e.g. 20% at 85% full, 13% at 95%).
export const CLEANUP = { from: 0.7, share: 0.3, floor: 0.1 };
export const READING_STYLES = {
  warm: { color: '#A15C07' },
  hot: { color: '#B33A3A', backgroundColor: '#B33A3A1A' },
};
// Meter bars in the same hues, for readings shown as a bar.
export const LEVEL_SERIES = {
  warm: { color: '#A15C07', track: '#A15C0724' },
  hot: { color: '#B33A3A', track: '#B33A3A24' },
};

// Rough cloud price of one RTX PRO 6000 Blackwell GPU-hour, for the GPU time
// card's easter egg: the median of ~54 on-demand offers was US$1.81 in October
// 2026 (thundercompute.com, gpus.io), at about S$1.27 per US$. And a plain
// butter croissant, typically S$2-4 at Singapore bakeries in 2026 (eatbook.sg,
// citynomads.com).
export const CLOUD_SGD_PER_GPU_HOUR = 2.3;
export const CROISSANT_SGD = 3;

// The milestone box's bakery basket, one treat per server: rough Singapore
// prices in 2026 for a butter croissant, a German-style brezel (S$3-5 at
// bakeries) and a kaya toast (about S$2 at kopitiam chains).
export const PASTRIES = [
  { name: 'croissants', sgd: CROISSANT_SGD },
  { name: 'brezels', sgd: 4 },
  { name: 'kaya toasts', sgd: 2 },
];

// Availability bars: soft fills, since every bar also has a text description.
// A bar is partly down when some of its checked time failed but at least
// UPTIME_PARTIAL_AT of it was up.
export const UPTIME_STATES = {
  up: { label: 'Up', color: '#5BBF95' },
  partial: { label: 'Partly down', color: '#E8B14F' },
  down: { label: 'Down', color: '#DD7365' },
  none: { label: 'No data', color: '#E2E8F0' },
};
export const UPTIME_PARTIAL_AT = 0.95;

// Age of the newest published overview before the page calls it delayed / offline.
export const DELAYED_AFTER_SECONDS = 3 * 60;
export const OFFLINE_AFTER_SECONDS = 15 * 60;

// GPU reservations for debugging; the Worker enforces the same limits.
export const RESERVATION_STEP_MINUTES = 30;
export const MAX_RESERVATION_MINUTES = 240;
export const DEFAULT_RESERVATION_MINUTES = 60;
export const MAX_RESERVATIONS_PER_USER = 2;
// A reserved GPU someone else is running on: its mark and the runners' names
// turn amber, and the tile is outlined in amber when the runner is the viewer.
export const RESERVATION_CLASH = { color: '#A15C07', mark: '#D08C1F', edge: '#E8B14F' };
// The viewer's own reservations: a bookmark in a soft lavender no reading uses,
// with a faint tint of it on the tile. Everyone else's: a lock in a quiet grey.
export const RESERVATION_MARKS = { mine: '#8478D6', others: '#8593AA' };

// A GPU busy with memory held but almost no compute (see the backend's
// IDLE_UTILIZATION_PERCENT) for this long is flagged, and its owner nudged.
export const HELD_IDLE_FLAG_SECONDS = 3600;
// Its owner gets a kind note at the top of their own page sooner, after this long.
export const HELD_IDLE_REMIND_SECONDS = 30 * 60;

// What the servers cost, which the lab's GPU time pays back at the cloud rate
// above, for the milestone box (shown only as a share, never as prices).
export const SERVER_PRICES_SGD = { brezel: 115000, croissant: 130000, toast: 130000 };
export const BAKERY_SGD = Object.values(SERVER_PRICES_SGD).reduce((total, price) => total + price, 0);

// The lab's lifetime GPU-time milestones: bakery ranks reached at each total
// of GPU hours, each with a few lines for its badge's box (one a visit). One
// croissant in the box's pile of 15 per rank, so keep exactly 15.
export const MILESTONES = [
  {
    hours: 0,
    rank: 'Rising dough',
    lines: [
      'Every great bakery starts with a pinch of yeast.',
      'The first epoch is always the slowest to rise.',
      'A warm kitchen and an empty loss curve.',
    ],
  },
  {
    hours: 250,
    rank: 'Flour dusted',
    lines: [
      'A light dusting of flour on every bench.',
      'The first gradients are kneaded in.',
      'Flour on the keyboards, logs in the terminal.',
    ],
  },
  {
    hours: 1000,
    rank: 'Apprentice baker',
    lines: [
      'The first trays are out of the oven.',
      'Learning to read the dough, and the loss curve.',
      'A few checkpoints cooling on the rack.',
    ],
  },
  {
    hours: 2500,
    rank: 'Dough whisperer',
    lines: ['The dough listens now.', 'The models rise right on schedule.', 'Hyperparameters, proofed to perfection.'],
  },
  {
    hours: 5000,
    rank: 'Journeyman baker',
    lines: [
      'The kitchen smells wonderful these days.',
      'Batch after batch, epoch after epoch.',
      'The ovens hum through the night.',
    ],
  },
  {
    hours: 10000,
    rank: 'Head baker',
    lines: [
      'The ovens have never been warmer.',
      'Every GPU knows the recipe by heart.',
      'The loss is low and the croissants are flaky.',
    ],
  },
  {
    hours: 25000,
    rank: 'Grand pâtissier',
    lines: [
      'People queue around the block for these bakes.',
      'Even the baselines are jealous.',
      'A paper’s worth of pastries in every oven.',
    ],
  },
  {
    hours: 50000,
    rank: 'Bakery legend',
    lines: ['Songs are sung about this bakery.', 'Reviewers ask for the recipe.', 'The leaderboard smells of butter.'],
  },
  {
    hours: 100000,
    rank: 'Pastry empire',
    lines: [
      'Croissants as far as the eye can see.',
      'More layers than any transformer.',
      'Every benchmark has a bakery outpost.',
    ],
  },
  {
    hours: 250000,
    rank: 'Flour-powered planet',
    lines: [
      'The whole world runs on our bread.',
      'The planet’s loss has converged.',
      'Every continent gets a fresh batch.',
    ],
  },
  {
    hours: 500000,
    rank: 'Galactic patisserie',
    lines: [
      'Deliveries now reach other star systems.',
      'Light-years of tokens, baked fresh.',
      'The Milky Way, now with extra butter.',
    ],
  },
  {
    hours: 1000000,
    rank: 'Croissant cosmos',
    lines: [
      'A universe of perfectly laminated dough.',
      'The cosmic background radiates warmth.',
      'Galaxies arranged in neat crescents.',
    ],
  },
  {
    hours: 2000000,
    rank: 'Pastry multiverse',
    lines: [
      'Every universe has a branch of this bakery.',
      'All timelines agree: the croissants are great.',
      'An ensemble of universes, all well baked.',
    ],
  },
  {
    hours: 5000000,
    rank: 'Eternal oven',
    lines: [
      'The ovens have been warm since the dawn of time.',
      'Training since the Big Bang, still converging.',
      'Time itself is proofing.',
    ],
  },
  {
    hours: 10000000,
    rank: 'The Great Croissant',
    lines: [
      'Ten million hours of baking. Well done, everyone.',
      'The final checkpoint, golden and flaky.',
      'Thank you, bakers. Take a well-earned break.',
    ],
  },
];

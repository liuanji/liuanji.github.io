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
  disk: { label: 'Disk', color: '#6C7BB8', track: '#6C7BB824' },
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
};

// GPU readings worth a glance: warm, then hot. Temperature in °C, power as a
// share of the GPU's enforced power limit. Same hues as the Delayed and
// Unreachable statuses, darkened so the text keeps 4.5:1 on white and on the tint.
export const TEMPERATURE_LEVELS_C = { warm: 75, hot: 85 };
export const POWER_LEVELS = { warm: 0.7, hot: 0.9 };
// The compact view's thermometer and lightning icons appear at `from` and warm
// steadily, from a dim amber to the hot red, until `to`. Temperature in °C,
// power as a share of the GPU's enforced power limit.
export const TEMPERATURE_ICON_RANGE = { from: 70, to: 90 };
export const POWER_ICON_RANGE = { from: 0.7, to: 1 };

// A server's RAM as a share of its total; jobs get killed when it runs out.
export const RAM_LEVELS = { warm: 0.8, hot: 0.9 };
// A disk's used share, as df counts it: used / (used + available).
export const DISK_LEVELS = { warm: 0.85, hot: 0.95 };
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
export const RESERVATION_MINUTES = [30, 60, 120, 240];
export const DEFAULT_RESERVATION_MINUTES = 60;
export const MAX_RESERVATIONS_PER_USER = 2;
// A reserved GPU someone else is running on: a soft amber, stronger when that
// someone is the viewer.
export const RESERVATION_CLASH = { color: '#A15C07', tint: '#E8B14F' };
// The viewer's own reservations: a bookmark in a soft lavender no reading uses,
// with a faint tint of it on the tile. Everyone else's: a lock in a quiet grey.
export const RESERVATION_MARKS = { mine: '#8478D6', others: '#A3B1C6' };

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
};

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
// A server's RAM as a share of its total; jobs get killed when it runs out.
export const RAM_LEVELS = { warm: 0.8, hot: 0.9 };
export const READING_STYLES = {
  warm: { color: '#A15C07' },
  hot: { color: '#B33A3A', backgroundColor: '#B33A3A1A' },
};
// Meter bars in the same hues, for readings shown as a bar.
export const LEVEL_SERIES = {
  warm: { color: '#A15C07', track: '#A15C0724' },
  hot: { color: '#B33A3A', track: '#B33A3A24' },
};

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

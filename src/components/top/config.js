// The exporter refreshes the live overview every collection cycle and the
// longer summaries less often; polling pauses while the tab is hidden.
export const LIVE_REFRESH_MS = 60_000;
export const HISTORY_REFRESH_MS = 5 * 60_000;

export const RANGES = [
  { value: '1h', label: 'Hour', title: 'Last hour', hours: 1 },
  { value: '24h', label: 'Day', title: 'Last 24 hours', hours: 24 },
  { value: '7d', label: 'Week', title: 'Last 7 days', hours: 7 * 24 },
  { value: '30d', label: 'Month', title: 'Last 30 days', hours: 30 * 24 },
  { value: '90d', label: '3 months', title: 'Last 90 days', hours: 90 * 24 },
  { value: '365d', label: 'Year', title: 'Last 365 days', hours: 365 * 24 },
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

// Age of the newest published overview before the page calls it delayed / offline.
export const DELAYED_AFTER_SECONDS = 3 * 60;
export const OFFLINE_AFTER_SECONDS = 15 * 60;

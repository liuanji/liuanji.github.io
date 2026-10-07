import { DELAYED_AFTER_SECONDS, POWER_LEVELS, RAM_LEVELS, TEMPERATURE_LEVELS_C } from './config';

const decimal = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const dayAndClock = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatPercent(value) {
  return `${Math.round(Number(value) || 0)}%`;
}

export function formatPower(watts) {
  const value = Number(watts) || 0;
  return value >= 1000 ? `${(value / 1000).toFixed(1)} kW` : `${Math.round(value)} W`;
}

// 'hot', 'warm' or null; power without a known limit is never flagged.
function level(value, levels) {
  if (value == null) return null;
  if (value >= levels.hot) return 'hot';
  return value >= levels.warm ? 'warm' : null;
}

export function temperatureLevel(celsius) {
  return level(celsius, TEMPERATURE_LEVELS_C);
}

export function powerLevel(watts, limitWatts) {
  return level(watts != null && limitWatts ? watts / limitWatts : null, POWER_LEVELS);
}

export function ramLevel(usedMb, totalMb) {
  return level(usedMb != null && totalMb ? usedMb / totalMb : null, RAM_LEVELS);
}

export function formatMemory(mb) {
  const gb = (Number(mb) || 0) / 1024;
  return gb >= 1000 ? `${(gb / 1024).toFixed(1)} TB` : `${Math.round(gb)} GB`;
}

// "70 / 96 GB": the unit is written once when both sides share it.
export function formatMemoryOf(usedMb, totalMb) {
  const [used, usedUnit] = formatMemory(usedMb).split(' ');
  const total = formatMemory(totalMb);
  return total.endsWith(` ${usedUnit}`) ? `${used} / ${total}` : `${used} ${usedUnit} / ${total}`;
}

export function formatHours(hours) {
  const value = Number(hours) || 0;
  if (value > 0 && value < 0.1) return '< 0.1';
  return decimal.format(value >= 10 ? Math.round(value) : value);
}

export function formatAgo(seconds) {
  const value = Math.max(0, Math.round(seconds));
  if (value < 10) return 'just now';
  if (value < 60) return `${value} s ago`;
  if (value < 3600) return `${Math.round(value / 60)} min ago`;
  if (value < 86400) return `${Math.round(value / 3600)} h ago`;
  return `${Math.round(value / 86400)} d ago`;
}

export function formatObserved(hours) {
  const value = Number(hours) || 0;
  if (value < 1) return `${Math.max(1, Math.round(value * 60))} minutes`;
  if (value < 48) return `${decimal.format(value)} hours`;
  return `${decimal.format(value / 24)} days`;
}

export function formatAxisTime(timestamp, range) {
  const date = new Date(timestamp * 1000);
  return range === '1h' || range === '24h' ? clock.format(date) : day.format(date);
}

export function formatFullTime(timestamp) {
  return dayAndClock.format(new Date(timestamp * 1000));
}

// A host's status is only as fresh as the overview it came in, so age it here:
// "online" data that has not been refreshed for a while is shown as delayed.
export function currentStatus(host, now) {
  const age = host.data_sampled_at ? now - host.data_sampled_at : 0;
  return host.status === 'online' && age > DELAYED_AFTER_SECONDS ? 'stale' : host.status;
}

export function gpuModels(gpus) {
  return [...new Set(gpus.map((gpu) => gpu.name.replace(/^NVIDIA\s+/, '')))].join(', ');
}

// Current totals for any set of hosts, so "All" and a single host read the same way.
export function summarize(hosts) {
  const gpus = hosts.flatMap((host) => host.gpus);
  const sum = (key) => gpus.reduce((total, gpu) => total + (Number(gpu[key]) || 0), 0);
  const busy = gpus.filter((gpu) => gpu.busy).length;
  return {
    hostsOnline: hosts.filter((host) => host.status === 'online').length,
    hostsTotal: hosts.length,
    gpusTotal: gpus.length,
    gpusBusy: busy,
    computeLoad: gpus.length ? sum('utilization') / gpus.length : 0,
    memoryUsedMb: sum('memory_used_mb'),
    memoryTotalMb: sum('memory_total_mb'),
    powerW: sum('power_w'),
  };
}

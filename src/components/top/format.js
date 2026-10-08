import {
  CLEANUP,
  DELAYED_AFTER_SECONDS,
  DISK_LEVELS,
  POWER_LEVELS,
  RAM_LEVELS,
  TEMPERATURE_LEVELS_C,
  UPTIME_PARTIAL_AT,
  USER_COLORS,
} from './config';

const decimal = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const fullDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const dayAndClock = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// The same colour for a username on every page load (a 32-bit FNV-1a hash).
export function userColor(username) {
  let hash = 0x811c9dc5;
  for (const character of username) {
    hash = Math.imul(hash ^ character.codePointAt(0), 0x01000193);
  }
  return USER_COLORS[(hash >>> 0) % USER_COLORS.length];
}

// "128 cores · 256 threads", or "128 cores" without hyper-threading. Older data
// only knows the thread count (nproc), so says just that.
export function formatCpuCount(system) {
  const { cpu_cores: cores, cpu_count: threads } = system;
  if (cores && threads && cores !== threads) return `${cores} cores · ${threads} threads`;
  if (cores) return `${cores} cores`;
  return threads ? `${threads} threads` : null;
}

// "2 × AMD EPYC 9555 64-Core Processor" on a two-socket server.
export function formatCpuModel(system) {
  if (!system.cpu_model) return null;
  return system.cpu_sockets > 1 ? `${system.cpu_sockets} × ${system.cpu_model}` : system.cpu_model;
}

// "S$1,240", or "S$8.40" under a hundred.
// "14 Sep 2026".
export function formatDate(timestamp) {
  return fullDate.format(new Date(timestamp * 1000));
}

export function formatSgd(amount) {
  return amount >= 100 ? `S$${Math.round(amount).toLocaleString('en-US')}` : `S$${amount.toFixed(2)}`;
}

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

// The share of a disk in use, as df reports it.
export function diskShare(disk) {
  const usable = disk.used_bytes + disk.available_bytes;
  return usable ? disk.used_bytes / usable : 0;
}

export function diskLevel(disk) {
  return level(diskShare(disk), DISK_LEVELS);
}

// How much one user may hold on a disk before being asked to clean up, in
// bytes, or null while the disk has room to spare (see CLEANUP).
export function cleanupAllowance(disk) {
  const full = diskShare(disk);
  if (full < CLEANUP.from) return null;
  const progress = Math.min(1, (full - CLEANUP.from) / (1 - CLEANUP.from));
  const share = CLEANUP.share - (CLEANUP.share - CLEANUP.floor) * progress;
  return share * (disk.used_bytes + disk.available_bytes);
}

// The disks, across every server, where user holds more than the allowance.
export function cleanupReminders(hosts, user) {
  return hosts.flatMap((host) =>
    host.disks.flatMap((disk) => {
      const allowance = cleanupAllowance(disk);
      const mine = disk.users?.find((item) => item.user === user);
      return allowance != null && mine && mine.bytes > allowance
        ? [{ host: host.name, disk, bytes: mine.bytes, allowance }]
        : [];
    }),
  );
}

// Binary units, as df -h counts them: "9.4 TB", "604 GB".
export function formatBytes(bytes) {
  const gb = (Number(bytes) || 0) / 1024 ** 3;
  return gb >= 1024 ? `${decimal.format(gb / 1024)} TB` : `${Math.round(gb)} GB`;
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

// "45 s", "12 min", "2 h 5 min", "3 d 4 h".
export function formatDuration(seconds) {
  const value = Math.max(0, Math.round(seconds));
  if (value < 60) return `${value} s`;
  const minutes = Math.round(value / 60);
  if (minutes < 60) return `${minutes} min`;
  const [hours, days] = [Math.floor(minutes / 60), Math.floor(minutes / 1440)];
  if (days < 1) return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`;
  return hours % 24 ? `${days} d ${hours % 24} h` : `${days} d`;
}

export function uptimeState(checkedSeconds, downSeconds) {
  if (!checkedSeconds) return 'none';
  if (!downSeconds) return 'up';
  return 1 - downSeconds / checkedSeconds >= UPTIME_PARTIAL_AT ? 'partial' : 'down';
}

// Never rounds a little downtime up to 100%.
export function formatUptime(checkedSeconds, downSeconds) {
  if (!downSeconds) return '100%';
  const percent = Math.min(99.99, Math.floor((1 - downSeconds / checkedSeconds) * 10000) / 100);
  return `${percent.toFixed(2)}%`;
}

// Whether midnight on the server's clock (utcOffset seconds east of UTC) is
// midnight for this viewer too at that moment.
export function sharesServerDays(timestamp, utcOffset) {
  return utcOffset == null || -new Date(timestamp * 1000).getTimezoneOffset() * 60 === utcOffset;
}

// "UTC+8", "UTC-3:30".
export function formatUtcOffset(seconds) {
  const sign = seconds < 0 ? '-' : '+';
  const minutes = Math.abs(seconds) / 60;
  const rest = minutes % 60;
  return `UTC${sign}${Math.floor(minutes / 60)}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`;
}

// The span one availability bar covers, in the viewer's time zone: "21:34",
// "Tue 7 Oct", "1 Oct – 7 Oct", or, for day and week bars cut on another time
// zone's midnight, "6 Oct, 17:00 – 7 Oct, 17:00".
export function formatBar(start, barSeconds, utcOffset) {
  const from = new Date(start * 1000);
  const to = new Date((start + barSeconds) * 1000);
  if (barSeconds <= 60) return clock.format(from);
  if (barSeconds < 86400) {
    const span = `${clock.format(from)}–${clock.format(to)}`;
    return barSeconds < 3600 ? span : `${day.format(from)}, ${span}`;
  }
  if (!sharesServerDays(start, utcOffset)) return `${dayAndClock.format(from)} – ${dayAndClock.format(to)}`;
  if (barSeconds === 86400) return weekday.format(from);
  return `${day.format(from)} – ${day.format(new Date((start + barSeconds - 1) * 1000))}`;
}

// "3 days", "1 half-hour", "108 monitored days": a count of availability bars.
export function formatBarCount(count, barSeconds, adjective = '') {
  const [one, many] = {
    60: ['minute', 'minutes'],
    1800: ['half-hour', 'half-hours'],
    7200: ['two-hour block', 'two-hour blocks'],
    86400: ['day', 'days'],
    604800: ['week', 'weeks'],
  }[barSeconds] ?? ['bar', 'bars'];
  return `${count} ${adjective ? `${adjective} ` : ''}${count === 1 ? one : many}`;
}

export function formatBarLength(barSeconds) {
  if (barSeconds < 3600) return barSeconds === 60 ? '1 minute' : `${barSeconds / 60} minutes`;
  if (barSeconds < 86400) return barSeconds === 3600 ? '1 hour' : `${barSeconds / 3600} hours`;
  return barSeconds === 86400 ? '1 day' : `${barSeconds / 86400 / 7} week${barSeconds === 7 * 86400 ? '' : 's'}`;
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
// Readings older than this are left out of totals and dimmed on the server's card.
export function hasCurrentData(host, now) {
  return host.data_sampled_at != null && now - host.data_sampled_at <= DELAYED_AFTER_SECONDS;
}

export function currentStatus(host, now) {
  const age = host.data_sampled_at ? now - host.data_sampled_at : 0;
  return host.status === 'online' && age > DELAYED_AFTER_SECONDS ? 'stale' : host.status;
}

export function gpuModels(gpus) {
  return [...new Set(gpus.map((gpu) => gpu.name.replace(/^NVIDIA\s+/, '')))].join(', ');
}

// Current totals for any set of hosts, so "All" and a single host read the same way.
// GPUs of a server that has stopped reporting are not counted.
export function summarize(hosts, now) {
  const gpus = hosts.filter((host) => hasCurrentData(host, now)).flatMap((host) => host.gpus);
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

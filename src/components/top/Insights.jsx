import { useState } from 'react';
import { Hourglass } from 'lucide-react';
import { HELD_IDLE_FLAG_SECONDS, READING_STYLES, SERIES } from './config';

// The compact view rings' soft compute blue.
const SPARKLINE_COLOR = '#6F90EA';
import { Banner, BannerLink, ScrollList } from './controls';
import { formatMemory, userColor } from './format';

// "35 min", "14 h", "3 d": how long a job has been running or a GPU idle.
export function formatDuration(seconds) {
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} min`;
  if (seconds < 48 * 3600) return `${Math.round(seconds / 3600)} h`;
  return `${Math.round(seconds / 86400)} d`;
}

export function isHeldIdle(gpu) {
  return (gpu.held_idle_seconds ?? 0) >= HELD_IDLE_FLAG_SECONDS;
}

// A GPU's last day as a small, light line of compute (0-100%) over a hint of
// fill; gaps where nothing was sampled stay empty.
export function Sparkline({ values, color = SPARKLINE_COLOR, width = 104, height = 22, label }) {
  if (!values?.some((value) => value != null)) {
    return <span className="font-mono text-[11px] text-data-grey/50">No history yet</span>;
  }
  const step = width / Math.max(1, values.length - 1);
  const y = (value) => height - 1 - (Math.min(100, Math.max(0, value)) / 100) * (height - 2);
  // Runs of consecutive samples, each drawn as its own line and fill.
  const runs = [];
  values.forEach((value, index) => {
    if (value == null) return;
    const point = [index * step, y(value)];
    if (index > 0 && values[index - 1] != null) runs.at(-1).push(point);
    else runs.push([point]);
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {runs.map((run, index) => {
        const line = run.map(([x, yValue]) => `${x.toFixed(1)},${yValue.toFixed(1)}`).join(' ');
        const area = `${run[0][0].toFixed(1)},${height} ${line} ${run.at(-1)[0].toFixed(1)},${height}`;
        return (
          <g key={index}>
            <polygon points={area} fill={color} opacity="0.07" />
            <polyline
              points={line}
              fill="none"
              stroke={color}
              strokeWidth="1.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function heatColor(value) {
  // From a faint wash when quiet to a soft, never full, orange when busy.
  return value == null
    ? '#F1F3F6'
    : `${SERIES.busy.color}${Math.round(10 + value * 120)
        .toString(16)
        .padStart(2, '0')}`;
}

// How busy the server usually is by weekday and hour: each cell the average
// share of its GPUs in use over the last weeks, stronger when busier. The
// title row carries a quiet-to-busy scale, replaced by a cell's reading while
// one is hovered or tapped.
export function WeekHeatmap({ week, days, title }) {
  const [picked, setPicked] = useState(null);
  const value = picked ? week[picked.day][picked.hour] : undefined;
  const time = picked ? `${DAYS[picked.day]} ${String(picked.hour).padStart(2, '0')}:00` : '';
  return (
    <div onPointerLeave={() => setPicked(null)}>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        {title}
        <span className="font-mono text-[11px] text-data-grey" aria-live="polite">
          {picked ? (
            value == null ? (
              `${time} · no data yet`
            ) : (
              <>
                {time} · usually <span className="text-inkwell">{Math.round(value * 100)}%</span> in use
              </>
            )
          ) : (
            <span
              className="inline-flex items-center gap-1.5"
              title={`Average share of GPUs in use, last ${days / 7} weeks`}
            >
              quiet
              {[0, 0.25, 0.5, 0.75, 1].map((step) => (
                <span
                  key={step}
                  className="h-2.5 w-2.5 rounded-[2px]"
                  style={{ backgroundColor: heatColor(step) }}
                  aria-hidden="true"
                />
              ))}
              busy
            </span>
          )}
        </span>
      </div>
      <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2">
        <div className="grid grid-rows-7 gap-[3px] font-mono text-[10px] leading-3 text-data-grey/80">
          {DAYS.map((day) => (
            <span key={day} className="flex items-center">
              {day}
            </span>
          ))}
        </div>
        <div className="grid grid-rows-7 gap-[3px]" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
          {week.map((hours, day) =>
            hours.map((cell, hour) => (
              <span
                key={`${day}-${hour}`}
                onPointerEnter={() => setPicked({ day, hour })}
                onPointerDown={() => setPicked({ day, hour })}
                className="h-3 rounded-[2px]"
                style={{
                  backgroundColor: heatColor(cell),
                  outline: picked?.day === day && picked?.hour === hour ? '1.5px solid #0F172A' : 'none',
                }}
                aria-hidden="true"
              />
            )),
          )}
        </div>
      </div>
      <div
        className="mt-1.5 grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2 font-mono text-[10px] text-data-grey/80"
        aria-hidden="true"
      >
        <span />
        <div className="flex justify-between">
          {['00', '06', '12', '18', '24'].map((hour) => (
            <span key={hour}>{hour}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Who is using the server's CPUs and memory right now, biggest memory first
// (anyone using a little of either), each with how many cores' worth of CPU
// they use and a bar of their share of the server's RAM; the list scrolls
// past about five people.
export function PeoplePanel({ system }) {
  const users = (system?.users ?? []).filter((user) => user.memory_mb >= 1024 || user.cpu_percent >= 10);
  if (!system?.users) {
    return <p className="font-mono text-[11px] text-data-grey">Not measured on this server yet.</p>;
  }
  if (!users.length) return <p className="font-mono text-[11px] text-data-grey">Nobody is using it right now.</p>;
  const total = system.memory_total_mb || users[0].memory_mb;
  return (
    <ScrollList count={users.length} rowRem={1.5} className="space-y-2">
      {users.map((user) => (
        <li
          key={user.user}
          className="grid grid-cols-[minmax(0,6.5rem)_4.5rem_minmax(0,1fr)_4rem] items-center gap-3 font-mono text-xs"
        >
          <span className="flex min-w-0 items-center gap-1.5 text-inkwell">
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: userColor(user.user) }}
              aria-hidden="true"
            />
            <span className="truncate">{user.user}</span>
          </span>
          <span className="tabular-nums text-data-grey" title={`${user.cpu_percent}% of one core`}>
            {(user.cpu_percent / 100).toFixed(user.cpu_percent >= 10000 ? 0 : 1)} cores
          </span>
          <span className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: SERIES.memory.track }}>
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.min(100, (user.memory_mb / total) * 100)}%`,
                backgroundColor: SERIES.memory.color,
              }}
            />
          </span>
          <span className="text-right tabular-nums text-inkwell">{formatMemory(user.memory_mb)}</span>
        </li>
      ))}
    </ScrollList>
  );
}

// The viewer's GPUs that have held memory with next to no compute for a while.
export function myHeldIdle(hosts, me) {
  return hosts.flatMap((host) =>
    host.gpus
      .filter((gpu) => isHeldIdle(gpu) && gpu.users.some((user) => user.username === me))
      .map((gpu) => ({ host: host.name, gpu, memory: gpu.users.find((user) => user.username === me).used_memory_mb })),
  );
}

// A gentle note to whoever holds idle GPUs, in the same quiet card as the
// other notices. Each GPU's name opens its server.
export function IdleBanner({ items, onOpen }) {
  if (!items.length) return null;
  const color = SERIES.compute.color;
  const gpuName = ({ host, gpu }) => (
    <BannerLink color={color} onClick={onOpen && (() => onOpen(host))}>
      {host} · GPU {gpu.index}
    </BannerLink>
  );
  const [first] = items;
  return (
    <Banner icon={Hourglass} color={color}>
      <p className="text-inkwell">
        {items.length === 1 ? (
          <>
            Your job on {gpuName(first)} has held {formatMemory(first.memory)} with almost no compute for{' '}
            {formatDuration(first.gpu.held_idle_seconds)}.
          </>
        ) : (
          <>
            {items.length} of your GPUs have held memory with almost no compute for a while:{' '}
            {items.map((item, index) => (
              <span key={`${item.host}/${item.gpu.index}`}>
                {index > 0 && ', '}
                {gpuName(item)}{' '}
                <span className="whitespace-nowrap text-data-grey">({formatDuration(item.gpu.held_idle_seconds)})</span>
              </span>
            ))}
            .
          </>
        )}
      </p>
      <p className="text-data-grey">
        If you are done with {items.length === 1 ? 'it, please free the GPU' : 'them, please free the GPUs'} for others.
      </p>
    </Banner>
  );
}

// The note in a GPU row or box: how long it has been held but idle.
export function HeldIdleNote({ gpu, className = '' }) {
  if (!isHeldIdle(gpu)) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap font-mono text-[11px] ${className}`}
      style={{ color: READING_STYLES.warm.color }}
      title={`Memory held with almost no compute for ${formatDuration(gpu.held_idle_seconds)}`}
    >
      <Hourglass className="h-3 w-3" strokeWidth={2.25} aria-hidden="true" />
      idle {formatDuration(gpu.held_idle_seconds)}
    </span>
  );
}

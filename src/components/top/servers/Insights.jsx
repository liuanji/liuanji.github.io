import { useState } from 'react';
import { Hourglass } from 'lucide-react';
import { HELD_IDLE_FLAG_SECONDS, HELD_IDLE_REMIND_SECONDS, READING_STYLES, SERIES } from '../shared/config';

// The compact view rings' soft compute blue.
const SPARKLINE_COLOR = '#6F90EA';
import { Banner, BannerLink, ScrollList } from '../shared/controls';
import { formatMemory, userColor } from '../shared/format';

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

// The punch card's dots: each dot's diameter follows how busy that block of
// hours usually is, from 0% to 100% of GPUs in use, and its indigo deepens
// from the week's quietest block to its busiest, so size and colour both
// tell the rhythm.
const DOT_LOW = [196, 203, 234];
const DOT_HIGH = [78, 94, 168];

function dotColor(shade) {
  const t = Math.min(1, Math.max(0, shade));
  const [r, g, b] = DOT_LOW.map((channel, index) => Math.round(channel + (DOT_HIGH[index] - channel) * t));
  return `rgb(${r} ${g} ${b})`;
}
const DOT_MIN_PX = 4;
const DOT_MAX_PX = 13;
// Hours are grouped in blocks this long, which keeps the card calm.
const BLOCK_HOURS = 3;
const BLOCKS = 24 / BLOCK_HOURS;
const COLUMN_REM = 1.75;

// Eased, since most blocks sit between about 40% and 100%: the curve spreads
// that range out, so a half-busy block looks clearly smaller than a busy one.
function dotSize(place) {
  return DOT_MIN_PX + (DOT_MAX_PX - DOT_MIN_PX) * Math.min(1, Math.max(0, place)) ** 1.8;
}

function hourLabel(hour) {
  return String(hour % 24).padStart(2, '0');
}

// Each day's hours averaged in blocks of BLOCK_HOURS (null if none observed).
function toBlocks(week) {
  return week.map((hours) =>
    Array.from({ length: BLOCKS }, (_, block) => {
      const known = hours.slice(block * BLOCK_HOURS, (block + 1) * BLOCK_HOURS).filter((cell) => cell != null);
      return known.length ? known.reduce((total, cell) => total + cell, 0) / known.length : null;
    }),
  );
}

// How busy the server usually is through the week, as a punch card: a row per
// weekday and a dot per three hours, its size following the average share of
// GPUs in use over the last weeks, from 0% to 100%. The columns keep a fixed
// width, so the card stays compact. A hovered or tapped dot shows its own
// reading in place of the legend.
export function WeekHeatmap({ week, days, title }) {
  const [picked, setPicked] = useState(null);
  const blocks = toBlocks(week);
  // Size is absolute: the smallest dot is 0% of GPUs in use, the largest 100%.
  const [from, to] = [0, 1];
  const place = (cell) => cell;
  // Colour spans the week's own range, quietest to busiest block.
  const known = blocks.flat().filter((cell) => cell != null);
  const low = known.length ? Math.min(...known) : 0;
  const high = known.length ? Math.max(...known) : 1;
  const shade = (cell) => (high - low < 0.02 ? 0.5 : (cell - low) / (high - low));
  const span = (day, block) => `${DAYS[day]} ${hourLabel(block * BLOCK_HOURS)}–${hourLabel((block + 1) * BLOCK_HOURS)}`;
  const value = picked ? blocks[picked.day][picked.block] : undefined;
  return (
    // As wide as the grid, so the legend and readings sit right above it.
    <div className="w-fit max-w-full" onPointerLeave={() => setPicked(null)}>
      {/* w-0 min-w-full: the grid alone sets the width, so the legend ends where
          the dots do; a hovered block's short reading takes its place. */}
      <div
        className="mb-3 flex w-0 min-w-full items-baseline justify-between gap-4 whitespace-nowrap"
        // In by half the space around a full-size dot in its column, so the legend
        // ends where the largest dots do.
        style={{ paddingRight: (COLUMN_REM * 16 - DOT_MAX_PX) / 2 }}
      >
        {title}
        <span className="font-mono text-[11px] text-data-grey" aria-live="polite">
          {picked ? (
            value == null ? (
              `${span(picked.day, picked.block)} · no data yet`
            ) : (
              <>
                {span(picked.day, picked.block)} · <span className="text-inkwell">{Math.round(value * 100)}%</span>
              </>
            )
          ) : (
            <span
              className="inline-flex items-center gap-2"
              title={`Size: average share of GPUs in use, last ${days / 7} weeks. Colour: from the quietest (${Math.round(low * 100)}%) to the busiest (${Math.round(high * 100)}%) block.`}
            >
              {Math.round(from * 100)}%
              <span className="flex items-center gap-1.5" aria-hidden="true">
                {[0, 0.5, 1].map((step) => (
                  <span
                    key={step}
                    className="rounded-full"
                    style={{ width: dotSize(step), height: dotSize(step), backgroundColor: dotColor(step) }}
                  />
                ))}
              </span>
              {Math.round(to * 100)}%
            </span>
          )}
        </span>
      </div>
      <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2">
        <div className="font-mono text-[10px] text-data-grey/80">
          {DAYS.map((day) => (
            <span key={day} className="flex h-4 items-center">
              {day}
            </span>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${BLOCKS}, ${COLUMN_REM}rem)` }}>
          {blocks.map((row, day) =>
            row.map((cell, block) => {
              const chosen = picked?.day === day && picked?.block === block;
              return (
                <span
                  key={`${day}-${block}`}
                  onPointerEnter={() => setPicked({ day, block })}
                  onPointerDown={() => setPicked({ day, block })}
                  className="flex h-4 items-center justify-center"
                  aria-hidden="true"
                >
                  {cell == null ? (
                    <span className="h-1 w-1 rounded-full bg-[#E2E8F0]" />
                  ) : (
                    // While one dot is read, the others fade back, as the
                    // page's other legends and bars do.
                    <span
                      className="rounded-full transition-opacity duration-150"
                      style={{
                        width: dotSize(place(cell)),
                        height: dotSize(place(cell)),
                        backgroundColor: dotColor(shade(cell)),
                        opacity: picked && !chosen ? 0.3 : 1,
                      }}
                    />
                  )}
                </span>
              );
            }),
          )}
        </div>
      </div>
      <div
        className="mt-1 grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2 font-mono text-[10px] text-data-grey/80"
        aria-hidden="true"
      >
        <span />
        <div className="grid" style={{ gridTemplateColumns: `repeat(${BLOCKS}, ${COLUMN_REM}rem)` }}>
          {Array.from({ length: BLOCKS }, (_, block) => (
            <span key={block} className="text-center">
              {hourLabel(block * BLOCK_HOURS)}
            </span>
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

// Who has used this server's GPUs most over the last seven days: GPU-hours
// per person, with a bar against the biggest user in the soft compute blue
// (as the page's GPU time card), scrolling past about five.
export function WeekUsers({ stats }) {
  const users = (stats?.users?.['7d'] ?? []).filter((user) => user.gpu_hours >= 0.5);
  if (!stats) return <p className="font-mono text-[11px] text-data-grey">Loading…</p>;
  if (!users.length) return <p className="font-mono text-[11px] text-data-grey">Nobody this week yet.</p>;
  const most = users[0].gpu_hours;
  return (
    <ScrollList count={users.length} rowRem={1.5} className="space-y-2">
      {users.map((user) => (
        <li
          key={user.username}
          className="grid grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)_4.5rem] items-center gap-3 font-mono text-xs"
        >
          <span className="flex min-w-0 items-center gap-1.5 text-inkwell">
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: userColor(user.username) }}
              aria-hidden="true"
            />
            <span className="truncate">{user.username}</span>
          </span>
          <span className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: `${SPARKLINE_COLOR}24` }}>
            <span
              className="block h-full rounded-full"
              style={{ width: `${(user.gpu_hours / most) * 100}%`, backgroundColor: SPARKLINE_COLOR }}
            />
          </span>
          <span className="whitespace-nowrap text-right tabular-nums text-inkwell">
            {Math.round(user.gpu_hours).toLocaleString('en-US')} h
          </span>
        </li>
      ))}
    </ScrollList>
  );
}

// The viewer's GPUs that have held memory with next to no compute for a while.
export function myHeldIdle(hosts, me) {
  return hosts.flatMap((host) =>
    host.gpus
      .filter(
        (gpu) =>
          (gpu.held_idle_seconds ?? 0) >= HELD_IDLE_REMIND_SECONDS && gpu.users.some((user) => user.username === me),
      )
      .map((gpu) => ({ host: host.name, gpu, memory: gpu.users.find((user) => user.username === me).used_memory_mb })),
  );
}

// A kind note to whoever holds idle GPUs, only on their own page, in the same
// quiet card as the other notices. Each GPU's name opens its server.
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
            Your dough on {gpuName(first)} has been resting for {formatDuration(first.gpu.held_idle_seconds)}, holding{' '}
            {formatMemory(first.memory)} with almost no compute.
          </>
        ) : (
          <>
            {items.length} of your GPUs have been resting for a while, holding memory with almost no compute:{' '}
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
        Just a friendly nudge: if you have finished with {items.length === 1 ? 'it' : 'them'}, freeing{' '}
        {items.length === 1 ? 'the GPU' : 'the GPUs'} would make room for others’ bakes. No worries if it is still
        needed.
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

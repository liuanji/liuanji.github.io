import { useState } from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { RESERVATION_CLASH, SERIES } from './config';
import {
  BoxFooter,
  ChipGlyph,
  GpuGlyph,
  Metric,
  RING_SERIES,
  POWER_COLOR,
  TEMPERATURE_COLOR,
  powerBar,
  temperatureBar,
} from './DetailBoxes';
import { busyGpuPhrase, freeGpuPhrase, idleGpuPhrase, pressurePhrase, reservedIdlePhrase } from './easterEggs';
import {
  formatAxisTime,
  formatCpuModel,
  formatFullTime,
  formatMemory,
  formatMemoryOf,
  gpuModels,
  userColor,
} from './format';
import { ScrollList } from './controls';
import { formatDuration, isHeldIdle } from './Insights';
import { ReservationMark, clashingUsers, formatLeft } from './Reservations';

const TICK = {
  fill: '#94A3B8',
  fontSize: 10,
  fontFamily: 'JetBrains Mono, monospace',
};

const THREADS_SERIES = { color: '#A9BCF2', track: '#6F90EA1C' };

function chartPoints(timeline, gpu) {
  const limit = gpu.power_limit_w;
  return timeline.utilization.map((utilization, index) => ({
    timestamp: timeline.start + (index + 0.5) * timeline.bucket_seconds,
    compute: utilization,
    memory: timeline.memory_percent[index],
    temperature: timeline.temperature_c?.[index] ?? null,
    power: limit && timeline.power_w?.[index] != null ? (timeline.power_w[index] / limit) * 100 : null,
    watts: timeline.power_w?.[index] ?? null,
  }));
}

function ChartTooltip({ active = false, payload = [], label = 0, lines }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border-light bg-white/95 px-2.5 py-1.5 shadow-md">
      <div className="mb-0.5 font-mono text-[10px] text-data-grey">{formatFullTime(label)}</div>
      {lines.map((line) =>
        point[line.key] == null ? null : (
          <div key={line.key} className="flex items-center gap-1.5 font-mono text-[11px] leading-5">
            <span className="h-0.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} aria-hidden="true" />
            <span className="tabular-nums text-inkwell">{line.format(point)}</span>
            <span className="text-data-grey">{line.label}</span>
          </div>
        ),
      )}
    </div>
  );
}

// A small chart of the last day: a title with its lines' keys, then the lines
// with faint gridlines at half and full scale and a few times along the
// bottom. Each line belongs to the left or right axis, and each axis used is
// labelled at its bottom, middle and top with its own range and unit (say °C on the
// left and % of the power limit on the right). Drawn at a fixed width, as a
// responsive chart would measure the box mid-animation.
const CHART_WIDTH = 556;
// The CPU and RAM boxes' full text width: 440 px less padding and border.
const CHART_WIDTH_SMALL = 396;
const PERCENT_AXIS = { max: 100, format: (value) => `${value}%` };

// aside, if given, takes the place of the key (a one-line chart needs none).
function MiniChart({
  title,
  points,
  lines,
  start,
  end,
  width = CHART_WIDTH,
  axes = { left: PERCENT_AXIS },
  aside = null,
}) {
  // Times at the inner quarters only, so none is cut off at an edge.
  const ticks = [1, 2, 3].map((step) => start + ((end - start) * step) / 4);
  // Hovering a key entry brings its line forward and fades the others.
  const [focus, setFocus] = useState(null);
  const drawn = focus
    ? [...lines.filter((line) => line.key !== focus), lines.find((line) => line.key === focus)]
    : lines;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 font-mono text-[11px] text-data-grey">
        <span>{title}</span>
        {/* A key only when there is more than one line to tell apart. */}
        <span className="flex items-center gap-3">
          {aside}
          {!aside &&
            lines.length > 1 &&
            lines.map((line) => (
              <span
                key={line.key}
                onMouseEnter={() => setFocus(line.key)}
                onMouseLeave={() => setFocus(null)}
                className={`flex cursor-default items-center gap-1.5 transition-opacity ${
                  focus && focus !== line.key ? 'opacity-40' : ''
                } ${focus === line.key ? 'text-inkwell' : ''}`}
              >
                <span className="h-0.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} aria-hidden="true" />
                {line.label}
              </span>
            ))}
        </span>
      </div>
      <LineChart width={width} height={100} data={points} margin={{ top: 6, right: 2, bottom: 0, left: 2 }}>
        <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" yAxisId="left" />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={[start, end]}
          ticks={ticks}
          tickFormatter={(value) => formatAxisTime(value, '24h')}
          axisLine={{ stroke: '#E2E8F0' }}
          tickLine={false}
          tick={TICK}
          tickMargin={6}
          height={20}
        />
        {['left', 'right'].map((side) => {
          const axis = axes[side];
          return (
            <YAxis
              key={side}
              yAxisId={side}
              orientation={side}
              domain={[axis?.min ?? 0, axis?.max ?? 100]}
              ticks={axis ? [axis.min ?? 0, ((axis.min ?? 0) + axis.max) / 2, axis.max] : [0, 50, 100]}
              tickFormatter={axis ? axis.format : () => ''}
              hide={!axis}
              axisLine={false}
              tickLine={false}
              tick={TICK}
              width={axis ? (axis.width ?? 40) : 0}
            />
          );
        })}
        <Tooltip
          content={<ChartTooltip lines={lines} />}
          cursor={{ stroke: '#CBD5E1', strokeWidth: 1 }}
          isAnimationActive={false}
        />
        {drawn.map((line) => (
          <Line
            key={line.key}
            yAxisId={line.axis ?? 'left'}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={focus === line.key ? 2.25 : 1.5}
            strokeOpacity={focus && focus !== line.key ? 0.2 : 1}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </div>
  );
}

// The expanded view's GPU box: what the GPU is doing now, its last day, who is
// on it and for how long, and anything worth knowing (held idle, reserved,
// health problems).
export function GpuDeepDetails({ gpu, host, timeline, reservation = null, me = null, now = 0 }) {
  const power = gpu.power_limit_w && gpu.power_w != null ? gpu.power_w / gpu.power_limit_w : null;
  const points = timeline ? chartPoints(timeline, gpu) : [];
  const mine = reservation?.user === me;
  const clash = clashingUsers(gpu, reservation);
  const status = isHeldIdle(gpu)
    ? `Idle for ${formatDuration(gpu.held_idle_seconds)}`
    : gpu.busy
      ? busyGpuPhrase(host, gpu.index, gpu.utilization)
      : freeGpuPhrase(host, gpu.index);
  const memoryShare = gpu.memory_total_mb ? gpu.memory_used_mb / gpu.memory_total_mb : 0;
  return (
    <div>
      {/* The card's small picture before its name, the status on the right. */}
      <div className="flex items-center gap-3">
        <GpuGlyph compute={gpu.utilization / 100} memory={memoryShare} width={64} />
        <div className="min-w-0 flex-1">
          <h4 className="font-tight text-base font-semibold leading-tight text-inkwell">
            {host} <span className="text-data-grey/60">·</span> GPU {gpu.index}
          </h4>
          <p className="mt-0.5 truncate font-mono text-[11px] text-data-grey">{gpuModels([gpu])}</p>
        </div>
        <span
          className="flex flex-shrink-0 items-center gap-1.5 self-start pt-0.5 font-mono text-[11px]"
          style={isHeldIdle(gpu) ? { color: RESERVATION_CLASH.color } : undefined}
        >
          <span
            className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${gpu.busy ? 'bg-synapse' : 'ring-1 ring-inset ring-data-grey/50'}`}
            aria-hidden="true"
          />
          <span className={isHeldIdle(gpu) ? '' : 'text-data-grey'}>{status}</span>
        </span>
      </div>
      <div>
        <div className="mt-4 grid grid-cols-4 gap-x-5">
          <Metric
            label="Compute"
            value={`${Math.round(gpu.utilization)}%`}
            share={gpu.utilization / 100}
            series={RING_SERIES.compute}
          />
          <Metric
            label="Memory"
            value={formatMemory(gpu.memory_used_mb)}
            share={memoryShare}
            series={RING_SERIES.memory}
          />
          <Metric
            label="Temp"
            value={gpu.temperature_c == null ? '—' : `${Math.round(gpu.temperature_c)}°C`}
            share={(gpu.temperature_c ?? 0) / 100}
            series={temperatureBar(gpu.temperature_c)}
          />
          <Metric
            label="Power"
            value={gpu.power_w == null ? '—' : `${Math.round(gpu.power_w)} W`}
            share={power ?? 0}
            series={powerBar(power)}
          />
        </div>

        {timeline ? (
          <div className="mt-5 space-y-3">
            <MiniChart
              title="Last 24 hours"
              points={points}
              start={timeline.start}
              end={timeline.end}
              lines={[
                {
                  key: 'compute',
                  label: 'Compute',
                  color: SERIES.compute.color,
                  format: (point) => `${Math.round(point.compute)}%`,
                },
                {
                  key: 'memory',
                  label: 'Memory',
                  color: SERIES.memory.color,
                  format: (point) => `${Math.round(point.memory)}%`,
                },
              ]}
            />
            <MiniChart
              title=" "
              points={points}
              start={timeline.start}
              end={timeline.end}
              axes={{
                // 20-90 °C: idle GPUs sit near 30 °C and these throttle near 90 °C.
                // Its marks (20, 55, 90) sit level with power's 0, 50 and 100%,
                // so both share the gridlines.
                left: { min: 20, max: 90, format: (value) => `${value}°C`, width: 44 },
                right: { max: 100, format: (value) => `${value}%`, width: 40 },
              }}
              lines={[
                {
                  key: 'temperature',
                  label: 'Temp (°C)',
                  color: TEMPERATURE_COLOR,
                  format: (point) => `${Math.round(point.temperature)}°C`,
                },
                {
                  key: 'power',
                  label: 'Power (% of limit)',
                  axis: 'right',
                  color: POWER_COLOR,
                  format: (point) => `${Math.round(point.watts)} W`,
                },
              ]}
            />
          </div>
        ) : (
          <p className="mt-5 font-mono text-[11px] text-data-grey">Loading the last day…</p>
        )}

        <div className="mt-4 border-t border-border-light pt-3">
          {gpu.users.length ? (
            <ScrollList count={gpu.users.length} visible={4} rowRem={1.25} className="space-y-1">
              {gpu.users.map((user) => (
                <li key={user.username} className="flex items-center gap-2 font-mono text-xs">
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: userColor(user.username) }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-inkwell"
                    style={clash.includes(user.username) ? { color: RESERVATION_CLASH.color } : undefined}
                  >
                    {user.username}
                  </span>
                  <span className="text-data-grey">
                    {formatMemoryOf(user.used_memory_mb, gpu.memory_total_mb)}
                    {user.jobs > 1 && ` · ${user.jobs} jobs`}
                    {user.running_seconds != null && ` · running ${formatDuration(user.running_seconds)}`}
                  </span>
                </li>
              ))}
            </ScrollList>
          ) : (
            <p className="font-mono text-xs text-data-grey">
              {gpu.busy
                ? 'In use; its owner was not reported'
                : reservation
                  ? reservedIdlePhrase(host, gpu.index, reservation.user, mine)
                  : idleGpuPhrase(host, gpu.index)}
            </p>
          )}
          {reservation && (
            <p className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-data-grey">
              <ReservationMark mine={mine} clash={clash.length > 0} className="h-3 w-3" />
              Reserved by {mine ? 'you' : reservation.user} · {formatLeft(reservation.ends_at - now)} left
            </p>
          )}
          {gpu.problems?.length > 0 && (
            <p className="mt-2 font-mono text-[11px]" style={{ color: '#B33A3A' }}>
              Health: {gpu.problems.join('; ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// In the expanded view's CPU or RAM box: the server's last day of CPU load (in
// percent) or RAM in use (as an amount, up to the server's total), from the
// per-server timeline, drawn at the box's text width.
export function SystemHistory({ timeline, part, system, width = CHART_WIDTH_SMALL }) {
  if (!timeline?.system) return null;
  const key = part === 'cpu' ? 'cpu_percent' : 'memory_percent';
  const values = timeline.system[key];
  const total = system?.memory_total_mb;
  const amounts = part === 'ram' && total;
  const points = values.map((value, index) => ({
    timestamp: timeline.start + (index + 0.5) * timeline.bucket_seconds,
    value: value == null || !amounts ? value : (value / 100) * total,
  }));
  const color = part === 'cpu' ? SERIES.compute.color : SERIES.memory.color;
  // The day's peak (and when) and average, beside the chart's title.
  const known = points.filter((point) => point.value != null);
  const peak = known.reduce((best, point) => (!best || point.value > best.value ? point : best), null);
  const average = known.length ? known.reduce((total, point) => total + point.value, 0) / known.length : null;
  const show = (amount) => (amounts ? formatMemory(amount) : `${Math.round(amount)}%`);
  return (
    <div className="mt-4">
      {values.some((value) => value != null) ? (
        <MiniChart
          title="Last 24 hours"
          points={points}
          start={timeline.start}
          end={timeline.end}
          width={width}
          axes={{ left: amounts ? { max: total, format: (value) => formatMemory(value), width: 52 } : PERCENT_AXIS }}
          aside={
            peak && (
              <span>
                peak <span className="text-inkwell">{show(peak.value)}</span> at {formatAxisTime(peak.timestamp, '24h')}
                <span className="text-data-grey/60"> · </span>avg <span className="text-inkwell">{show(average)}</span>
              </span>
            )
          }
          lines={[
            {
              key: 'value',
              label: part === 'cpu' ? 'CPU' : 'RAM in use',
              color,
              format: (point) => (amounts ? formatMemory(point.value) : `${Math.round(point.value)}%`),
            },
          ]}
        />
      ) : (
        <p className="font-mono text-[11px] text-data-grey">Last 24 hours: collecting from now on.</p>
      )}
    </div>
  );
}

// Under the expanded view's CPU or RAM box: each user's share of the server's
// CPU or memory right now, largest first; past about five it scrolls.
export function UsersBreakdown({ system, part }) {
  const users = [...(system.users ?? [])]
    .sort((a, b) => (part === 'cpu' ? b.cpu_percent - a.cpu_percent : b.memory_mb - a.memory_mb))
    .filter((user) => (part === 'cpu' ? user.cpu_percent >= 1 : user.memory_mb >= 1024));
  if (!system.users) return null;
  const total = part === 'cpu' ? (system.cpu_count ?? 1) * 100 : system.memory_total_mb;
  const series = part === 'cpu' ? RING_SERIES.compute : RING_SERIES.memory;
  return (
    <div className="mt-4">
      <div className="mb-1.5 font-mono text-[11px] text-data-grey">By user</div>
      {users.length ? (
        <ScrollList count={users.length} rowRem={1.375} className="space-y-1.5">
          {users.map((user) => {
            const amount = part === 'cpu' ? user.cpu_percent : user.memory_mb;
            return (
              <li
                key={user.user}
                className="grid grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)_5.5rem] items-center gap-3 font-mono text-xs"
              >
                <span className="flex min-w-0 items-center gap-1.5 text-inkwell">
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: userColor(user.user) }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{user.user}</span>
                </span>
                <span className="h-1 overflow-hidden rounded-full" style={{ backgroundColor: series.track }}>
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (amount / total) * 100)}%`,
                      backgroundColor: series.color,
                    }}
                  />
                </span>
                <span className="whitespace-nowrap text-right tabular-nums text-inkwell">
                  {part === 'cpu' ? `${(amount / 100).toFixed(1)} cores` : formatMemory(amount)}
                </span>
              </li>
            );
          })}
        </ScrollList>
      ) : (
        <p className="font-mono text-[11px] text-data-grey">Nobody is using much right now.</p>
      )}
    </div>
  );
}

// The expanded view's CPU box: the chip before its name, then three readings
// in a row (load now, time waiting on disks, roughly how many threads are
// busy, from the 1-minute load average), the last day's load with its peak and
// average, who is using it, and how long the server has been up.
export function CpuDeepDetails({ host, system, timeline }) {
  const percent = Math.round(system.cpu_percent ?? 0);
  const iowait = system.iowait_percent;
  const load = system.load_averages;
  const threads = system.cpu_count;
  return (
    <div>
      <div className="flex items-center gap-3">
        <ChipGlyph share={percent / 100} color={RING_SERIES.compute.color} size={44} animated grow />
        <div className="min-w-0 flex-1">
          <h4 className="font-tight text-base font-semibold leading-tight text-inkwell">
            {host} <span className="text-data-grey/60">·</span> CPU
          </h4>
          <p className="mt-0.5 truncate font-mono text-[11px] text-data-grey">
            {formatCpuModel(system) ?? 'Processor'}
          </p>
        </div>
      </div>
      {/* Load in the CPU blue, threads in a paler shade of it, and I/O wait, time
          spent waiting on the disks, in the disk hue. */}
      <div className="mt-4 grid grid-cols-3 gap-x-5">
        <Metric label="Load" value={`${percent}%`} share={percent / 100} series={RING_SERIES.compute} />
        <div title="Share of CPU time spent waiting on the disks; high when jobs are stuck loading data">
          <Metric
            label="I/O wait"
            value={iowait == null ? '—' : `${iowait}%`}
            share={iowait == null ? 0 : iowait / 100}
            series={SERIES.disk}
          />
        </div>
        <div
          title={
            load
              ? `About this many threads busy, from the load average ${load.map((value) => value.toFixed(1)).join(' · ')} (1, 5, 15 min)`
              : undefined
          }
        >
          <Metric
            label="Threads"
            value={load && threads ? `${Math.round(load[0])} / ${threads}` : '—'}
            share={load && threads ? load[0] / threads : 0}
            series={THREADS_SERIES}
          />
        </div>
      </div>
      <SystemHistory timeline={timeline} part="cpu" system={system} width={CHART_WIDTH_SMALL} />
      <UsersBreakdown system={system} part="cpu" />
      <BoxFooter phrase={pressurePhrase('cpu', percent / 100, host)}>
        {system.uptime_seconds != null && `up ${formatDuration(system.uptime_seconds)}`}
      </BoxFooter>
    </div>
  );
}

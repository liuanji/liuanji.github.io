import { TriangleAlert } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { HostStatus } from './BakeryStatus';
import { HISTORY_REFRESH_MS, LEVEL_SERIES, READING_STYLES, RESERVATION_CLASH, SERIES } from './config';
import { DownNotice } from './controls';
import { OverheatBadge, isOverheated } from './Overheat';
import { DetailsPopover, RamDetails } from './DetailBoxes';
import { CpuDeepDetails, GpuDeepDetails, SystemHistory, UsersBreakdown } from './ExpandedBoxes';
import { PeoplePanel, Sparkline, WeekHeatmap, WeekUsers, formatDuration, isHeldIdle } from './Insights';
import { useStatusFile } from './useStatusFile';
import { ReserveControl, clashingUsers, findReservation, formatLeft } from './Reservations';
import {
  formatAgo,
  formatCpuCount,
  formatMemory,
  formatMemoryOf,
  gpuModels,
  hasCurrentData,
  powerLevel,
  ramLevel,
  temperatureLevel,
  userColor,
} from './format';

// GPU, its last day, compute, memory, temperature and power, users.
const ROW_GRID =
  'grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-[5.25rem_7rem_minmax(0,1fr)_minmax(0,1fr)_7.5rem_minmax(0,1.2fr)] md:items-center md:gap-x-6';
// The reservation column sits beside each row's button, as a button cannot hold
// another; on phones it shrinks to its icon, beside the temperature line.
const RESERVE_COLUMN = 'w-9 flex-shrink-0 md:w-36';

// In GPU rows the column headers name each meter on wide screens, so the label
// only shows on narrow ones unless alwaysLabel is set. A warm or hot level
// recolours the value and the bar.
function Meter({ label, value, max, display, series, level = null, alwaysLabel = false }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const bar = LEVEL_SERIES[level] ?? series;
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className={`text-xs text-data-grey ${alwaysLabel ? '' : 'md:hidden'}`}>{label}</span>
        {level ? (
          <span
            className="-my-0.5 -mr-1 ml-auto whitespace-nowrap rounded px-1 py-0.5 font-mono text-xs font-medium tabular-nums"
            style={READING_STYLES[level]}
          >
            {display}
          </span>
        ) : (
          <span className="ml-auto whitespace-nowrap font-mono text-xs tabular-nums text-inkwell">{display}</span>
        )}
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full"
        style={{ backgroundColor: bar.track }}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: bar.color }} />
      </div>
    </div>
  );
}

// A part of the card that opens a detail box on wider screens: a button with
// the box when there is one, otherwise a plain block.
function Opens({ details, width, label, className, children }) {
  if (!details) return <div className={className}>{children}</div>;
  return (
    <DetailsPopover content={details} width={width}>
      <button
        type="button"
        aria-label={`${label}. Show details.`}
        className={`${className} w-full cursor-pointer text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-inkwell/20`}
      >
        {children}
      </button>
    </DetailsPopover>
  );
}

// The server as a whole: CPU load across all cores and RAM in use. On wider
// screens each opens its box, as in the compact view.
function SystemStrip({ system, host, interactive, timeline }) {
  const cpu = system.cpu_percent;
  const ramKnown = system.memory_used_mb != null && system.memory_total_mb;
  const ram = ramKnown ? ramLevel(system.memory_used_mb, system.memory_total_mb) : null;
  const meterBox = '-mx-2 -my-1.5 rounded-lg px-2 py-1.5 hover:bg-white data-[state=open]:bg-white';
  return (
    <div className="grid gap-x-6 gap-y-3 border-b border-border-light bg-paper/60 px-6 py-3.5 sm:grid-cols-2">
      <Opens
        details={interactive && cpu != null ? <CpuDeepDetails host={host} system={system} timeline={timeline} /> : null}
        width="w-[440px]"
        label={`${host} CPU ${cpu == null ? '' : `${Math.round(cpu)}%`}`}
        className={meterBox}
      >
        <Meter
          label={formatCpuCount(system) ? `CPU · ${formatCpuCount(system)}` : 'CPU'}
          value={cpu ?? 0}
          max={100}
          display={cpu == null ? '—' : `${Math.round(cpu)}%`}
          series={SERIES.compute}
          alwaysLabel
        />
      </Opens>
      <Opens
        details={
          interactive && ramKnown ? (
            <RamDetails host={host} system={system} level={ram} compact>
              <SystemHistory timeline={timeline} part="ram" system={system} />
              <UsersBreakdown system={system} part="ram" />
            </RamDetails>
          ) : null
        }
        width="w-[440px]"
        label={`${host} RAM ${ramKnown ? formatMemoryOf(system.memory_used_mb, system.memory_total_mb) : ''}`}
        className={meterBox}
      >
        <Meter
          label="RAM"
          value={system.memory_used_mb ?? 0}
          max={system.memory_total_mb ?? 0}
          display={ramKnown ? formatMemoryOf(system.memory_used_mb, system.memory_total_mb) : '—'}
          series={SERIES.memory}
          level={ram}
          alwaysLabel
        />
      </Opens>
    </div>
  );
}

// A GPU row's meter: on wide screens the value starts under its column's
// heading in a box just as wide as its longest value (in monospace characters),
// so the bar follows it closely and every row's bar starts at the same place;
// on phones it is labelled above.
function RowMeter({ label, value, max, display, series, valueWidth, title }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-baseline justify-between gap-2 md:hidden">
        <span className="text-xs text-data-grey">{label}</span>
        <span className="whitespace-nowrap font-mono text-xs tabular-nums text-inkwell">{display}</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`hidden flex-shrink-0 whitespace-nowrap font-mono text-xs tabular-nums text-inkwell md:block ${valueWidth}`}
          title={title}
        >
          {display}
        </span>
        <div
          className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full"
          style={{ backgroundColor: series.track }}
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
        >
          <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: series.color }} />
        </div>
      </div>
    </div>
  );
}

// Who holds a GPU and for how long, after its mark; a free GPU shows only the
// faint mark that reserves it.
function ReserveCell({ gpu, host, reservation, reserving, now }) {
  return (
    <div className={`${RESERVE_COLUMN} flex items-center gap-1.5 pr-3 pt-2.5 md:pr-3 md:pt-0`}>
      <ReserveControl
        host={host}
        gpu={gpu}
        reservation={reservation}
        me={reserving.me}
        held={reserving.held}
        now={now}
        onReserve={reserving.reserve}
        onRelease={reserving.release}
        className="-ml-1 flex-shrink-0"
      />
      {reservation && (
        <span
          className="hidden min-w-0 truncate font-mono text-xs text-data-grey md:inline"
          style={clashingUsers(gpu, reservation).length ? { color: RESERVATION_CLASH.color } : undefined}
        >
          {reservation.user === reserving.me ? 'you' : reservation.user}
          <span className="text-data-grey/60"> · {formatLeft(reservation.ends_at - now)}</span>
        </span>
      )}
    </div>
  );
}

// Every reading gets the same padding so tinted and plain values line up.
function Reading({ text, level, title }) {
  return (
    <span title={title} className={`rounded px-1 py-0.5 ${level ? 'font-medium' : ''}`} style={READING_STYLES[level]}>
      {text}
    </span>
  );
}

// A reserved row follows the tiles: lavender with a lavender edge when it is
// the viewer's; while someone else runs on it, its mark and holder turn amber,
// with an amber edge when that someone is the viewer. Above OVERHEAT_C the row
// turns red with a red edge, its temperature a pulsing red badge.
function GpuRow({ gpu, host, interactive, now, reserving, timeline }) {
  const reservation = reserving ? findReservation(reserving.reservations, host, gpu.index, now) : null;
  const clash = clashingUsers(gpu, reservation);
  const meClashing = Boolean(reserving) && clash.includes(reserving.me);
  const mine = Boolean(reservation) && reservation.user === reserving.me;
  const thermal = gpu.temperature_c == null ? '—' : `${Math.round(gpu.temperature_c)}°C`;
  const overheated = isOverheated(gpu);
  const power = gpu.power_w == null ? '—' : `${Math.round(gpu.power_w)} W`;
  const powerTitle =
    gpu.power_w != null && gpu.power_limit_w
      ? `${Math.round(gpu.power_w)} W of ${Math.round(gpu.power_limit_w)} W limit (${Math.round((gpu.power_w / gpu.power_limit_w) * 100)}%)`
      : undefined;
  const row = (
    <Opens
      details={
        interactive ? (
          <GpuDeepDetails
            gpu={gpu}
            host={host}
            timeline={timeline}
            reservation={reservation}
            me={reserving?.me}
            now={now}
          />
        ) : null
      }
      width="w-[600px]"
      label={`${host} GPU ${gpu.index}, ${Math.round(gpu.utilization)}% compute`}
      className={`${ROW_GRID} py-3 pl-6 ${reserving ? 'pr-2' : 'pr-6'} ${interactive ? 'hover:bg-black/[0.02] data-[state=open]:bg-black/[0.04]' : ''} ${
        overheated ? 'bg-[#B33A3A]/[0.08] shadow-[inset_3px_0_0_#B33A3A]' : ''
      }`}
    >
      <div className="order-1 flex items-center gap-2 md:order-none">
        <span
          className={`h-2 w-2 rounded-full ${gpu.busy ? 'bg-synapse' : 'ring-1 ring-inset ring-data-grey/50'}`}
          aria-hidden="true"
        />
        <span className="whitespace-nowrap font-mono text-sm text-inkwell">GPU {gpu.index}</span>
        {gpu.problems?.length > 0 && (
          <span title={gpu.problems.join('; ')} className="flex-shrink-0">
            <TriangleAlert
              className="h-3.5 w-3.5"
              style={{ color: READING_STYLES.hot.color }}
              strokeWidth={2.25}
              aria-hidden="true"
            />
            <span className="sr-only">Health: {gpu.problems.join('; ')}</span>
          </span>
        )}
      </div>
      {/* The last day of compute, on wide screens only. */}
      <div className="hidden md:block">
        <Sparkline values={timeline?.utilization} label={`GPU ${gpu.index} compute over the last 24 hours`} />
      </div>
      <div className="order-3 md:order-none">
        <RowMeter
          label="Compute"
          value={gpu.utilization}
          max={100}
          display={`${Math.round(gpu.utilization)}%`}
          series={SERIES.compute}
          valueWidth="w-[4ch]"
        />
      </div>
      <div className="order-4 md:order-none">
        <RowMeter
          label="Memory"
          value={gpu.memory_used_mb}
          max={gpu.memory_total_mb}
          display={formatMemory(gpu.memory_used_mb)}
          title={formatMemoryOf(gpu.memory_used_mb, gpu.memory_total_mb)}
          series={SERIES.memory}
          valueWidth="w-[5ch]"
        />
      </div>
      {/* The negative margins cancel the readings' padding, so plain values line up as before. */}
      <div className="order-2 -mr-1 whitespace-nowrap text-right font-mono text-xs tabular-nums text-data-grey md:order-none md:-ml-1 md:mr-0 md:text-left">
        {/* A fixed slot, as wide as the hot badge, so the power lines up in every row. */}
        <span className="inline-block w-[3.4rem] md:text-left">
          {overheated ? (
            <OverheatBadge gpu={gpu} className="motion-safe:animate-pulse" />
          ) : (
            <Reading text={thermal} level={temperatureLevel(gpu.temperature_c)} />
          )}
        </span>
        {'· '}
        <Reading text={power} level={powerLevel(gpu.power_w, gpu.power_limit_w)} title={powerTitle} />
      </div>
      {/* Each user as plain text with how long their job has run; on a GPU held
          but idle, the last user's time becomes how long it has sat idle. */}
      <div className="order-5 col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 md:order-none md:col-span-1">
        {gpu.users.length ? (
          gpu.users.map((user, index) => (
            <span key={user.username} className="inline-flex items-center gap-1.5 font-mono text-xs text-inkwell">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: userColor(user.username) }}
                aria-hidden="true"
              />
              <span style={clash.includes(user.username) ? { color: RESERVATION_CLASH.color } : undefined}>
                {user.username}
              </span>
              <span className="text-data-grey">{formatMemory(user.used_memory_mb)}</span>
              {isHeldIdle(gpu) && index === gpu.users.length - 1 ? (
                <span
                  style={{ color: READING_STYLES.warm.color }}
                  title={`Memory held with almost no compute for ${formatDuration(gpu.held_idle_seconds)}`}
                >
                  · idle {formatDuration(gpu.held_idle_seconds)}
                </span>
              ) : (
                user.running_seconds != null && (
                  <span className="text-data-grey/70" title={`Running for ${formatDuration(user.running_seconds)}`}>
                    · {formatDuration(user.running_seconds)}
                  </span>
                )
              )}
            </span>
          ))
        ) : (
          <span className="font-mono text-xs text-data-grey/60">{gpu.busy ? 'In use' : 'Idle'}</span>
        )}
      </div>
    </Opens>
  );
  if (!reserving) return row;
  return (
    <div
      className={`flex items-start md:items-center ${
        mine ? 'bg-[#8478D6]/[0.06]' : ''
      } ${meClashing ? 'shadow-[inset_3px_0_0_#E8B14F]' : mine ? 'shadow-[inset_3px_0_0_#8478D6]' : ''}`}
    >
      <div className="min-w-0 flex-1">{row}</div>
      <ReserveCell gpu={gpu} host={host} reservation={reservation} reserving={reserving} now={now} />
    </div>
  );
}

// Below the GPUs: who uses the server's CPU and RAM now, who has used its GPUs
// this week, and its typical week. The first keeps a compact width, the week
// only what its grid needs, and this week's GPU time takes the rest.
function ServerInsights({ host, timeline, stats }) {
  return (
    <div className="grid gap-x-10 gap-y-6 border-t border-border-light px-6 py-5 lg:grid-cols-[22rem_minmax(0,1fr)_auto]">
      <section aria-label="CPU and RAM by user">
        <h4 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-data-grey/70">CPU &amp; RAM by user</h4>
        <PeoplePanel system={host.system} />
      </section>
      <section aria-label="GPU time over the last 7 days">
        <h4 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-data-grey/70">GPU time · 7 days</h4>
        <WeekUsers stats={stats} />
      </section>
      <section aria-label="Typical week">
        {timeline ? (
          <WeekHeatmap
            week={timeline.week}
            days={timeline.week_days}
            title={<h4 className="font-mono text-[11px] uppercase tracking-wider text-data-grey/70">Typical week</h4>}
          />
        ) : (
          <h4 className="font-mono text-[11px] uppercase tracking-wider text-data-grey/70">Typical week</h4>
        )}
      </section>
    </div>
  );
}

export default function HostCard({ host, now, reserving = null, token }) {
  // Each GPU's last day and the server's typical week, refreshed with the trends.
  const timeline = useStatusFile(`gpus-${host.name}`, HISTORY_REFRESH_MS, token).data;
  // This server's own stats, shared with the page when it is the one selected.
  const stats = useStatusFile(`stats-${host.name}`, HISTORY_REFRESH_MS, token).data;
  // Each GPU's series with the span they cover, which the file gives once.
  const timelines = Object.fromEntries(
    (timeline?.gpus ?? []).map((gpu) => [
      gpu.index,
      { ...gpu, start: timeline.start, end: timeline.end, bucket_seconds: timeline.bucket_seconds },
    ]),
  );
  const busy = host.gpus.filter((gpu) => gpu.busy).length;
  // Detail boxes need room beside the card, so phones go without them.
  const interactive = !useIsMobile();
  // A server that stopped reporting keeps its last readings, dimmed and labelled.
  const outdated = host.data_sampled_at != null && !hasCurrentData(host, now);
  // Not reporting: the GPUs fade back behind a note saying so.
  const down = outdated || host.status === 'error';
  const dim = outdated ? 'opacity-50' : undefined;
  return (
    <article className="bg-white rounded-2xl border border-border-light overflow-hidden">
      <header className="flex flex-col gap-3 border-b border-border-light px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-tight font-semibold text-lg text-inkwell leading-tight">{host.name}</h3>
          {host.gpus.length > 0 && (
            <div className="mt-0.5 truncate font-mono text-xs text-data-grey">
              {host.gpus.length} × {gpuModels(host.gpus)} · {busy} in use
            </div>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-3 font-mono text-xs text-data-grey">
          {host.data_sampled_at && <span>{formatAgo(now - host.data_sampled_at)}</span>}
          <HostStatus host={host} now={now} />
        </div>
      </header>
      <div>
        {host.system && (
          <div className={dim}>
            <SystemStrip system={host.system} host={host.name} interactive={interactive} timeline={timeline} />
          </div>
        )}
        {host.gpus.length ? (
          <div className="relative">
            <div className={down ? 'opacity-25 grayscale' : undefined}>
              <div className="hidden border-b border-border-light font-mono text-[11px] uppercase tracking-wider text-data-grey/70 md:flex">
                <div className={`${ROW_GRID} min-w-0 flex-1 py-2 pl-6 ${reserving ? 'pr-2' : 'pr-6'}`}>
                  <span>GPU</span>
                  <span>Last 24 h</span>
                  <span>Compute</span>
                  <span>Memory</span>
                  <span>Temp · Power</span>
                  <span>Users</span>
                </div>
                {reserving && <span className={`${RESERVE_COLUMN} py-2`}>Reserved</span>}
              </div>
              <div className="divide-y divide-border-light">
                {host.gpus.map((gpu) => (
                  <GpuRow
                    key={gpu.index}
                    gpu={gpu}
                    host={host.name}
                    interactive={interactive}
                    now={now}
                    reserving={reserving}
                    timeline={timelines[gpu.index]}
                  />
                ))}
              </div>
            </div>
            {down && <DownNotice host={host} now={now} />}
          </div>
        ) : (
          <p className="px-6 py-8 text-sm text-data-grey">No data from this server right now.</p>
        )}
        <div className={dim}>
          <ServerInsights host={host} timeline={timeline} stats={stats} />
        </div>
      </div>
    </article>
  );
}

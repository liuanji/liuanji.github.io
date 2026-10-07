import { Thermometer, Zap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { LEVEL_SERIES, POWER_ICON_RANGE, READING_STYLES, TEMPERATURE_ICON_RANGE } from './config';
import { StatusPill } from './controls';
import {
  ChipGlyph,
  CpuDetails,
  DetailsPopover,
  GpuDetails,
  RING_SERIES,
  RamDetails,
  StickGlyph,
  heat,
  heatColor,
} from './DetailBoxes';
import { formatAgo, formatMemory, formatMemoryOf, hasCurrentData, ramLevel, temperatureLevel, userColor } from './format';

function describe(gpu, host) {
  const parts = [
    `${host} GPU ${gpu.index}`,
    `${Math.round(gpu.utilization)}% compute`,
    `${formatMemory(gpu.memory_used_mb)} of ${formatMemory(gpu.memory_total_mb)} memory`,
  ];
  if (gpu.temperature_c != null) parts.push(`${Math.round(gpu.temperature_c)}°C`);
  if (gpu.power_w != null) {
    parts.push(
      gpu.power_limit_w ? `${Math.round(gpu.power_w)} of ${Math.round(gpu.power_limit_w)} W` : `${Math.round(gpu.power_w)} W`,
    );
  }
  parts.push(gpu.users.length ? gpu.users.map((user) => user.username).join(', ') : gpu.busy ? 'in use' : 'idle');
  return parts.join(' · ');
}

// Two concentric arcs from twelve o'clock: compute outside, memory inside.
const RING = { size: 64, outer: 28, inner: 21, outerWidth: 4, innerWidth: 3 };
function Arc({ radius, width, share, series }) {
  const circumference = 2 * Math.PI * radius;
  const length = Math.min(1, Math.max(0, share)) * circumference;
  const center = RING.size / 2;
  return (
    <>
      <circle cx={center} cy={center} r={radius} fill="none" stroke={series.track} strokeWidth={width} />
      {length > 0.5 && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={series.color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeDasharray={`${length} ${circumference}`}
          transform={`rotate(-90 ${center} ${center})`}
        />
      )}
    </>
  );
}

function UsageRing({ gpu }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: RING.size, height: RING.size }}>
      <svg width={RING.size} height={RING.size} viewBox={`0 0 ${RING.size} ${RING.size}`} aria-hidden="true">
        <Arc radius={RING.outer} width={RING.outerWidth} share={gpu.utilization / 100} series={RING_SERIES.compute} />
        <Arc
          radius={RING.inner}
          width={RING.innerWidth}
          share={gpu.memory_total_mb ? gpu.memory_used_mb / gpu.memory_total_mb : 0}
          series={RING_SERIES.memory}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-tight text-[13px] font-semibold tabular-nums text-inkwell">
        {Math.round(gpu.utilization)}%
      </span>
    </div>
  );
}

function UserLabel({ gpu }) {
  const [first, ...others] = gpu.users;
  if (!first) return <span className="text-data-grey/60">{gpu.busy ? 'in use' : 'idle'}</span>;
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-inkwell">
      <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: userColor(first.username) }} aria-hidden="true" />
      <span className="truncate">{first.username}</span>
      {others.length > 0 && <span className="flex-shrink-0 text-data-grey">+{others.length}</span>}
    </span>
  );
}

function HeatIcons({ temperature, power, className }) {
  if (temperature == null && power == null) return null;
  return (
    <span className={`items-center gap-0.5 ${className}`} aria-hidden="true">
      {temperature != null && <Thermometer className="h-3.5 w-3.5" style={{ color: heatColor(temperature) }} strokeWidth={2.25} />}
      {power != null && <Zap className="h-3.5 w-3.5" style={{ color: heatColor(power) }} strokeWidth={2.25} />}
    </span>
  );
}

// Each GPU sits on a faint grey panel, or a soft red one when hot: temperature
// is worth a closer look, while high power is normal under load and only shows
// its icon. On phones the icons sit beside the GPU's name, as its ring leaves
// no room in the corner. On wider screens the tile is a button that opens the
// GPU's details.
function GpuRing({ gpu, host, interactive }) {
  const hot = temperatureLevel(gpu.temperature_c) === 'hot';
  const temperature = heat(gpu.temperature_c, TEMPERATURE_ICON_RANGE);
  const power = heat(gpu.power_limit_w ? gpu.power_w / gpu.power_limit_w : null, POWER_ICON_RANGE);
  const label = describe(gpu, host);
  const Tile = interactive ? 'button' : 'div';
  const tile = (
    <Tile
      {...(interactive
        ? { type: 'button', 'aria-label': `${label}. Show details.` }
        : { role: 'img', 'aria-label': label, title: label })}
      className={`relative flex w-full min-w-0 flex-col items-center rounded-2xl px-1.5 pb-2.5 pt-3 transition-colors ${
        hot ? 'bg-[#B33A3A]/[0.07]' : 'bg-[#F6F7F9] hover:bg-[#F1F3F6] data-[state=open]:bg-[#ECEFF3]'
      } ${gpu.busy ? '' : 'opacity-55'} ${
        interactive ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20' : ''
      }`}
    >
      <HeatIcons temperature={temperature} power={power} className="absolute right-1.5 top-1.5 hidden flex-col sm:flex" />
      <UsageRing gpu={gpu} />
      <div className="mt-2 flex items-center gap-1 whitespace-nowrap font-mono text-[11px] text-data-grey">
        GPU {gpu.index}
        <span className="hidden text-data-grey/60 sm:inline">· {formatMemory(gpu.memory_used_mb)}</span>
        <HeatIcons temperature={temperature} power={power} className="flex sm:hidden" />
      </div>
      <div className="mt-1 flex w-full justify-center font-mono text-[11px]">
        <UserLabel gpu={gpu} />
      </div>
    </Tile>
  );
  if (!interactive) return tile;
  return (
    <DetailsPopover content={<GpuDetails gpu={gpu} host={host} />} width="w-[460px]">
      {tile}
    </DetailsPopover>
  );
}

// A CPU or RAM reading for a server's header: a small picture of the part, lit
// in the rings' soft colours, and its percentage. A warm or hot level takes
// over the picture and the value, as in the full view. On wider screens it is
// a button that opens the part's box, like a GPU tile.
function HeaderMeter({ label, Glyph, share, title, series, level = null, details = null }) {
  const clamped = Math.min(1, Math.max(0, share));
  const percent = Math.round(clamped * 100);
  const inner = (
    <>
      <span aria-hidden="true">{label}</span>
      <Glyph share={clamped} color={(LEVEL_SERIES[level] ?? series).color} />
      <span
        className={`w-8 text-left tabular-nums ${level ? 'font-medium' : 'text-inkwell'}`}
        style={level ? { color: READING_STYLES[level].color } : undefined}
        aria-hidden="true"
      >
        {percent}%
      </span>
    </>
  );
  if (!details) {
    return (
      <span className="flex items-center gap-1.5 font-mono text-xs text-data-grey" title={title}>
        <span className="sr-only">{title}</span>
        {inner}
      </span>
    );
  }
  return (
    <DetailsPopover content={details} width="w-[440px]">
      <button
        type="button"
        aria-label={`${title}. Show details.`}
        className="-mx-1.5 -my-1 flex items-center gap-1.5 rounded-lg px-1.5 py-1 font-mono text-xs text-data-grey transition-colors hover:bg-[#F1F3F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20 data-[state=open]:bg-[#ECEFF3]"
      >
        {inner}
      </button>
    </DetailsPopover>
  );
}

function SystemMeters({ system, host, interactive }) {
  const ramKnown = system.memory_used_mb != null && system.memory_total_mb;
  const ram = ramKnown ? ramLevel(system.memory_used_mb, system.memory_total_mb) : null;
  // Nudged down a pixel to centre on the status pill beside it, which sits a
  // little below its own text.
  return (
    <span className="flex translate-y-px items-center gap-4">
      {system.cpu_percent != null && (
        <HeaderMeter
          label="CPU"
          Glyph={ChipGlyph}
          share={system.cpu_percent / 100}
          title={`CPU ${Math.round(system.cpu_percent)}%${system.cpu_count ? ` of ${system.cpu_count} threads` : ''}`}
          series={RING_SERIES.compute}
          details={interactive ? <CpuDetails host={host} system={system} /> : null}
        />
      )}
      {ramKnown && (
        <HeaderMeter
          label="RAM"
          Glyph={StickGlyph}
          share={system.memory_used_mb / system.memory_total_mb}
          title={`RAM ${formatMemoryOf(system.memory_used_mb, system.memory_total_mb)}`}
          series={RING_SERIES.memory}
          level={ram}
          details={interactive ? <RamDetails host={host} system={system} level={ram} /> : null}
        />
      )}
    </span>
  );
}

function CompactHost({ host, now, interactive }) {
  const busy = host.gpus.filter((gpu) => gpu.busy).length;
  const compute = host.gpus.length
    ? host.gpus.reduce((total, gpu) => total + gpu.utilization, 0) / host.gpus.length
    : 0;
  const outdated = host.data_sampled_at != null && !hasCurrentData(host, now);
  return (
    <article className="bg-white rounded-2xl border border-border-light px-4 pb-3 pt-4 sm:px-5">
      {/* One line on wider screens; on phones the status moves up beside the
          name, and the summary and CPU/RAM take a line each. */}
      <header className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-2 px-1">
        <h3 className="order-1 font-tight font-semibold text-lg text-inkwell leading-tight">{host.name}</h3>
        {host.gpus.length > 0 && (
          <span className="order-3 w-full font-mono text-xs text-data-grey sm:order-2 sm:w-auto">
            {busy}/{host.gpus.length} in use · {Math.round(compute)}% compute
          </span>
        )}
        <span className="order-4 flex w-full flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-data-grey sm:order-3 sm:ml-auto sm:w-auto">
          {outdated && <span>last reported {formatAgo(now - host.data_sampled_at)}</span>}
          {host.system && (
            <span className={outdated ? 'opacity-50' : undefined}>
              <SystemMeters system={host.system} host={host.name} interactive={interactive} />
            </span>
          )}
        </span>
        <span className="order-2 ml-auto sm:order-4 sm:ml-0">
          <StatusPill status={host.status} />
        </span>
      </header>
      {host.gpus.length ? (
        <div className={`grid grid-cols-4 gap-1 sm:gap-2 lg:grid-cols-8 ${outdated ? 'opacity-50' : ''}`}>
          {host.gpus.map((gpu) => (
            <GpuRing key={gpu.index} gpu={gpu} host={host.name} interactive={interactive} />
          ))}
        </div>
      ) : (
        <p className="px-1 py-4 text-sm text-data-grey">No data from this server right now.</p>
      )}
    </article>
  );
}

// The icon at the start, middle and top of its range.
function HeatScale({ Icon }) {
  return (
    <span className="inline-flex items-center" aria-hidden="true">
      {[0, 0.5, 1].map((amount) => (
        <Icon key={amount} className="h-3.5 w-3.5" style={{ color: heatColor(amount) }} strokeWidth={2.25} />
      ))}
    </span>
  );
}

function RingKey({ series, outer }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" fill="none" stroke={outer ? series.color : RING_SERIES.compute.track} strokeWidth="2" />
      <circle cx="7" cy="7" r="2.5" fill="none" stroke={outer ? RING_SERIES.memory.track : series.color} strokeWidth="2" />
    </svg>
  );
}

function LegendItem({ children }) {
  return <span className="inline-flex items-center gap-1.5">{children}</span>;
}

export default function CompactHosts({ hosts, now }) {
  // The details box needs room beside the tiles, so phones keep plain tiles.
  const interactive = !useIsMobile();
  return (
    <div>
      <div className="space-y-4">
        {hosts.map((host) => (
          <CompactHost key={host.name} host={host} now={now} interactive={interactive} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[11px] text-data-grey">
        <LegendItem>
          <RingKey series={RING_SERIES.compute} outer />
          Outer ring: compute
        </LegendItem>
        <LegendItem>
          <RingKey series={RING_SERIES.memory} />
          Inner ring: memory
        </LegendItem>
        <LegendItem>
          <HeatScale Icon={Thermometer} />
          70–90°C
        </LegendItem>
        <LegendItem>
          <HeatScale Icon={Zap} />
          70–100% of power limit
        </LegendItem>
      </div>
    </div>
  );
}

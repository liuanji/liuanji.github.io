import { Thermometer, Zap } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { POWER_ICON_RANGE, TEMPERATURE_ICON_RANGE } from './config';
import { StatusPill } from './controls';
import {
  formatAgo,
  formatMemory,
  formatMemoryOf,
  gpuModels,
  hasCurrentData,
  temperatureLevel,
  userColor,
} from './format';

// How far a reading is into its icon range: null below it, 0 at the start, 1 at
// the top and above.
function heat(value, range) {
  if (value == null || value < range.from) return null;
  return Math.min(1, (value - range.from) / (range.to - range.from));
}

// Dim amber at 0, through orange, to the hot red (#B33A3A) at 1.
function heatColor(amount) {
  const mix = (start, end) => start + (end - start) * amount;
  return `hsl(${mix(40, 0)}, ${mix(30, 51)}%, ${mix(72, 46)}%)`;
}

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

// Two concentric arcs from twelve o'clock: compute outside, memory inside. The
// geometry is for a 64 px ring and scales with the size asked for.
const RING = { size: 64, outer: 28, inner: 21, outerWidth: 4, innerWidth: 3 };
// Softer shades of the compute blue and memory green: two dozen rings at full
// strength would sit too heavily on the white cards.
const RING_SERIES = {
  compute: { color: '#6F90EA', track: '#6F90EA1C' },
  memory: { color: '#5BBE98', track: '#5BBE9824' },
};

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

function UsageRing({ gpu, size = RING.size, children = null }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${RING.size} ${RING.size}`} aria-hidden="true">
        <Arc radius={RING.outer} width={RING.outerWidth} share={gpu.utilization / 100} series={RING_SERIES.compute} />
        <Arc
          radius={RING.inner}
          width={RING.innerWidth}
          share={gpu.memory_total_mb ? gpu.memory_used_mb / gpu.memory_total_mb : 0}
          series={RING_SERIES.memory}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        {children ?? (
          <span className="font-tight text-[13px] font-semibold tabular-nums text-inkwell">
            {Math.round(gpu.utilization)}%
          </span>
        )}
      </span>
    </div>
  );
}

const QUIET = { color: '#A3B1C6', track: '#A3B1C624' };

function Metric({ label, value, share, series }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[11px] text-data-grey">{label}</span>
        <span className="whitespace-nowrap font-mono text-xs tabular-nums text-inkwell">{value}</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full" style={{ backgroundColor: series.track }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, share * 100))}%`, backgroundColor: series.color }}
        />
      </div>
    </div>
  );
}

// Temperature and power bars stay quiet until their icon would appear, then
// warm with it.
function heatSeries(amount) {
  return amount == null ? QUIET : { color: heatColor(amount), track: QUIET.track };
}

// The box a GPU tile opens on wider screens: a large ring on the left, the
// readings and its users on the right.
function GpuDetails({ gpu, host }) {
  const power = gpu.power_limit_w && gpu.power_w != null ? gpu.power_w / gpu.power_limit_w : null;
  return (
    <div className="flex gap-6">
      <div className="flex flex-col items-center pt-1">
        <UsageRing gpu={gpu} size={104}>
          <span className="font-tight text-2xl font-semibold leading-none tabular-nums text-inkwell">
            {Math.round(gpu.utilization)}%
          </span>
          <span className="mt-1 font-mono text-[10px] text-data-grey">compute</span>
        </UsageRing>
        <span className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-data-grey">
          <span
            className={`h-1.5 w-1.5 rounded-full ${gpu.busy ? 'bg-synapse' : 'ring-1 ring-inset ring-data-grey/50'}`}
            aria-hidden="true"
          />
          {gpu.busy ? 'In use' : 'Idle'}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-tight text-base font-semibold leading-tight text-inkwell">
          {host} <span className="text-data-grey/60">·</span> GPU {gpu.index}
        </h4>
        <p className="mt-0.5 truncate font-mono text-[11px] text-data-grey">{gpuModels([gpu])}</p>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3.5">
          <Metric
            label="Compute"
            value={`${Math.round(gpu.utilization)}%`}
            share={gpu.utilization / 100}
            series={RING_SERIES.compute}
          />
          <Metric
            label="Memory"
            value={formatMemoryOf(gpu.memory_used_mb, gpu.memory_total_mb)}
            share={gpu.memory_total_mb ? gpu.memory_used_mb / gpu.memory_total_mb : 0}
            series={RING_SERIES.memory}
          />
          <Metric
            label="Temperature"
            value={gpu.temperature_c == null ? '—' : `${Math.round(gpu.temperature_c)}°C`}
            share={(gpu.temperature_c ?? 0) / 100}
            series={heatSeries(heat(gpu.temperature_c, TEMPERATURE_ICON_RANGE))}
          />
          <Metric
            label="Power"
            value={
              gpu.power_w == null
                ? '—'
                : gpu.power_limit_w
                  ? `${Math.round(gpu.power_w)} / ${Math.round(gpu.power_limit_w)} W`
                  : `${Math.round(gpu.power_w)} W`
            }
            share={power ?? 0}
            series={heatSeries(heat(power, POWER_ICON_RANGE))}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border-light pt-3">
          {gpu.users.length ? (
            gpu.users.map((user) => (
              <span
                key={user.username}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#F6F7F9] px-2 py-0.5 font-mono text-xs text-inkwell"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: userColor(user.username) }}
                  aria-hidden="true"
                />
                {user.username}
                <span className="text-data-grey">{formatMemory(user.used_memory_mb)}</span>
              </span>
            ))
          ) : (
            <span className="font-mono text-xs text-data-grey">
              {gpu.busy ? 'In use; its owner was not reported' : 'Nobody is using this GPU'}
            </span>
          )}
        </div>
      </div>
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
    <Popover>
      <PopoverTrigger asChild>{tile}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        sideOffset={8}
        collisionPadding={16}
        className="w-[460px] rounded-2xl border-border-light bg-white p-5 shadow-xl"
      >
        <GpuDetails gpu={gpu} host={host} />
      </PopoverContent>
    </Popover>
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
      <header className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
        <h3 className="font-tight font-semibold text-lg text-inkwell leading-tight">{host.name}</h3>
        {host.gpus.length > 0 && (
          <span className="font-mono text-xs text-data-grey">
            {busy}/{host.gpus.length} in use · {Math.round(compute)}% compute
          </span>
        )}
        <span className="ml-auto flex items-center gap-3 font-mono text-xs text-data-grey">
          {outdated && <span>last reported {formatAgo(now - host.data_sampled_at)}</span>}
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

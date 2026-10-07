import { useEffect, useRef, useState } from 'react';
import { Thermometer, Zap } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { LEVEL_SERIES, POWER_ICON_RANGE, READING_STYLES, TEMPERATURE_ICON_RANGE } from './config';
import { StatusPill } from './controls';
import {
  formatAgo,
  formatMemory,
  formatMemoryOf,
  gpuModels,
  hasCurrentData,
  ramLevel,
  temperatureLevel,
  userColor,
} from './format';
import { idleGpuPhrase, pressurePhrase } from './easterEggs';

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

// Two concentric arcs from twelve o'clock: compute outside, memory inside.
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

const QUIET = { color: '#A3B1C6', track: '#A3B1C624' };

// share null leaves out the bar.
function Metric({ label, value, share = null, series = null }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[11px] text-data-grey">{label}</span>
        <span className="whitespace-nowrap font-mono text-xs tabular-nums text-inkwell">{value}</span>
      </div>
      {share != null && (
        <div className="mt-1.5 h-1 overflow-hidden rounded-full" style={{ backgroundColor: series.track }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, share * 100))}%`, backgroundColor: series.color }}
          />
        </div>
      )}
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
      <div className="flex flex-col items-center justify-center">
        <GpuGlyph
          compute={gpu.utilization / 100}
          memory={gpu.memory_total_mb ? gpu.memory_used_mb / gpu.memory_total_mb : 0}
        />
        {/* The fan is compute and the chips are memory, so both get a figure in their colour. */}
        <span className="mt-2.5 flex items-center gap-3 font-tight text-base font-semibold leading-none tabular-nums text-inkwell">
          {[
            ['compute', RING_SERIES.compute.color, gpu.utilization / 100],
            ['memory', RING_SERIES.memory.color, gpu.memory_total_mb ? gpu.memory_used_mb / gpu.memory_total_mb : 0],
          ].map(([name, color, share]) => (
            <span key={name} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
              {Math.round(share * 100)}%<span className="sr-only"> {name}</span>
            </span>
          ))}
        </span>
        <span className="mt-2.5 flex items-center gap-1.5 font-mono text-[11px] text-data-grey">
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
              {gpu.busy ? 'In use; its owner was not reported' : idleGpuPhrase(host, gpu.index)}
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
    <DetailsPopover content={<GpuDetails gpu={gpu} host={host} />} width="w-[460px]">
      {tile}
    </DetailsPopover>
  );
}

// Resting the mouse on a GPU this long opens its details too.
const HOVER_OPEN_MS = 3000;
// How long a hover-opened box waits for the mouse to reach it before closing.
const HOVER_CLOSE_MS = 200;

// A click opens a box that stays until Escape or a click elsewhere. A long
// hover opens one that closes again when the mouse leaves both the tile and
// the box; clicking the tile while it is open keeps it open instead.
function DetailsPopover({ content, width, children }) {
  const [open, setOpen] = useState(false);
  const pinned = useRef(false);
  const openTimer = useRef(undefined);
  const closeTimer = useRef(undefined);

  const clearTimers = () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  };
  useEffect(() => clearTimers, []);

  const hoverIn = (event) => {
    if (event.pointerType !== 'mouse') return;
    clearTimeout(closeTimer.current);
    if (!open) {
      openTimer.current = setTimeout(() => {
        pinned.current = false;
        setOpen(true);
      }, HOVER_OPEN_MS);
    }
  };
  const hoverOut = (event) => {
    if (event.pointerType !== 'mouse') return;
    clearTimeout(openTimer.current);
    if (open && !pinned.current) closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_MS);
  };
  const click = (event) => {
    // Handled here instead of by the trigger's own toggle.
    event.preventDefault();
    clearTimers();
    if (open && !pinned.current) {
      pinned.current = true;
      return;
    }
    pinned.current = !open;
    setOpen(!open);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        clearTimers();
        if (!next) pinned.current = false;
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild onPointerEnter={hoverIn} onPointerLeave={hoverOut} onClick={click}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        sideOffset={8}
        collisionPadding={16}
        onPointerEnter={hoverIn}
        onPointerLeave={hoverOut}
        className={`${width} rounded-2xl border-border-light bg-white p-5 shadow-xl`}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}

// Outline, unlit and contact colours shared by the CPU and RAM glyphs.
const GLYPH = { outline: '#CBD5E1', unlit: '#E9EEF4', contacts: '#E2C26F' };

// A tiny CPU chip: a 4 x 4 grid of cores that light up from the bottom row
// with the load, the last one partly.
function ChipGlyph({ share, color, size = 26 }) {
  const cells = 4;
  const lit = share * cells * cells;
  const pins = [7.5, 11, 14.5];
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      {pins.map((at) => (
        <g key={at} stroke={GLYPH.outline} strokeWidth="1.3" strokeLinecap="round">
          <line x1={at} y1="0.9" x2={at} y2="3" />
          <line x1={at} y1="19" x2={at} y2="21.1" />
          <line x1="0.9" y1={at} x2="3" y2={at} />
          <line x1="19" y1={at} x2="21.1" y2={at} />
        </g>
      ))}
      <rect x="3.5" y="3.5" width="15" height="15" rx="3" fill="white" stroke={GLYPH.outline} strokeWidth="1.3" />
      {Array.from({ length: cells * cells }, (_, index) => {
        const row = cells - 1 - Math.floor(index / cells);
        const column = index % cells;
        const amount = Math.min(1, Math.max(0, lit - index));
        const x = 6 + column * 2.75;
        const y = 6 + row * 2.75;
        return (
          <g key={index}>
            <rect x={x} y={y} width="2.25" height="2.25" rx="0.5" fill={GLYPH.unlit} />
            {amount > 0 && (
              <rect x={x} y={y} width="2.25" height="2.25" rx="0.5" fill={color} opacity={0.3 + 0.7 * amount} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// A small graphics card, drawn like the CPU and RAM glyphs: its fan's rim fills
// with compute load and its blades spin faster the busier it is (still when
// idle or when the viewer prefers reduced motion), its eight memory chips fill
// with memory in use, and gold contacts run along the bottom.
function GpuGlyph({ compute, memory, width = 116 }) {
  const fan = { x: 13.5, y: 13, radius: 8.4 };
  const circumference = 2 * Math.PI * fan.radius;
  const load = Math.min(1, Math.max(0, compute));
  const arc = load * circumference;
  // Seconds per turn: 3.2 at the lightest load down to 0.6 at full load.
  const spin = load >= 0.02 ? 3.2 - 2.6 * load : null;
  const chips = 8;
  const filled = Math.min(1, Math.max(0, memory)) * chips;
  return (
    <svg width={width} height={(width * 30.5) / 60} viewBox="0 0 60 30.5" aria-hidden="true">
      <rect x="0.65" y="0.65" width="58.7" height="24.7" rx="3" fill="white" stroke={GLYPH.outline} strokeWidth="1.3" />
      <circle cx={fan.x} cy={fan.y} r={fan.radius} fill="none" stroke={RING_SERIES.compute.track} strokeWidth="2.2" />
      {arc > 0.3 && (
        <circle
          cx={fan.x}
          cy={fan.y}
          r={fan.radius}
          fill="none"
          stroke={RING_SERIES.compute.color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circumference}`}
          transform={`rotate(-90 ${fan.x} ${fan.y})`}
        />
      )}
      <g
        className={spin ? 'motion-safe:animate-spin' : undefined}
        style={spin ? { animationDuration: `${spin}s`, transformOrigin: `${fan.x}px ${fan.y}px` } : undefined}
      >
        {[0, 72, 144, 216, 288].map((angle) => (
          <path
            key={angle}
            d={`M ${fan.x} ${fan.y} q 2.4 -0.9 3.4 -5`}
            fill="none"
            stroke={GLYPH.outline}
            strokeWidth="1.2"
            strokeLinecap="round"
            transform={`rotate(${angle} ${fan.x} ${fan.y})`}
          />
        ))}
      </g>
      <circle cx={fan.x} cy={fan.y} r="1.9" fill="white" stroke={GLYPH.outline} strokeWidth="1.2" />
      {Array.from({ length: chips }, (_, index) => {
        const amount = Math.min(1, Math.max(0, filled - index));
        // The chips keep the same margin from the card's right edge as the fan
        // does from its left.
        const x = 28.75 + (index % 4) * 7.2;
        const y = 5 + Math.floor(index / 4) * 8.6;
        return (
          <g key={index}>
            <rect x={x} y={y} width="5.6" height="6.4" rx="0.8" fill={GLYPH.unlit} />
            {amount > 0 && (
              <rect x={x} y={y} width={5.6 * amount} height="6.4" rx="0.8" fill={RING_SERIES.memory.color} />
            )}
          </g>
        );
      })}
      {Array.from({ length: 15 }, (_, index) => index)
        .filter((index) => index !== 4)
        .map((index) => (
          <line
            key={index}
            x1={8 + index * 2.6}
            y1="27.2"
            x2={8 + index * 2.6}
            y2="29.4"
            stroke={GLYPH.contacts}
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        ))}
    </svg>
  );
}

// A tiny memory stick whose six chips fill from the left with the RAM in use,
// above a row of gold contacts with the key notch.
function StickGlyph({ share, color, width = 44 }) {
  const chips = 6;
  const filled = share * chips;
  return (
    // The viewBox centres the stick's body; the contacts hang below it, so the
    // body lines up with the text beside it.
    <svg width={width} height={(width * 18.9) / 36} viewBox="0 -2.2 36 18.9" aria-hidden="true">
      <rect x="0.65" y="1.65" width="34.7" height="11.2" rx="2" fill="white" stroke={GLYPH.outline} strokeWidth="1.3" />
      {Array.from({ length: chips }, (_, index) => {
        const amount = Math.min(1, Math.max(0, filled - index));
        const x = 3.2 + index * 5.05;
        return (
          <g key={index}>
            <rect x={x} y="4.2" width="3.9" height="6.1" rx="0.7" fill={GLYPH.unlit} />
            {amount > 0 && <rect x={x} y="4.2" width={3.9 * amount} height="6.1" rx="0.7" fill={color} />}
          </g>
        );
      })}
      {Array.from({ length: 11 }, (_, index) => index)
        .filter((index) => index !== 4)
        .map((index) => (
          <line
            key={index}
            x1={3 + index * 3}
            y1="14.4"
            x2={3 + index * 3}
            y2="16.6"
            stroke={GLYPH.contacts}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        ))}
    </svg>
  );
}

// A box's closing line: any facts on the left and an easter egg at the bottom
// right, wrapping below them when there is no room beside; with no facts the
// easter egg has the line to itself.
function BoxFooter({ phrase, children = null }) {
  return (
    <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-border-light pt-3 font-mono text-[11px] text-data-grey">
      {children && <span>{children}</span>}
      <span className={`italic text-data-grey/80 ${children ? 'ml-auto' : ''}`}>{phrase}</span>
    </div>
  );
}

function loadText(value) {
  return value >= 100 ? value.toFixed(0) : value.toFixed(1);
}

// The CPU's box: a large chip, its load now and its load averages.
function CpuDetails({ host, system }) {
  const percent = Math.round(system.cpu_percent ?? 0);
  const load = system.load_averages;
  return (
    <div className="flex gap-6">
      <div className="flex w-[104px] flex-shrink-0 flex-col items-center justify-center">
        <ChipGlyph share={percent / 100} color={RING_SERIES.compute.color} size={92} />
        <span className="mt-1 font-tight text-lg font-semibold leading-none tabular-nums text-inkwell">{percent}%</span>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-tight text-base font-semibold leading-tight text-inkwell">
          {host} <span className="text-data-grey/60">·</span> CPU
        </h4>
        <p className="mt-0.5 truncate font-mono text-[11px] text-data-grey">{system.cpu_model ?? 'Processor'}</p>
        <div className="mt-4">
          <Metric label="Load now" value={`${percent}%`} share={percent / 100} series={RING_SERIES.compute} />
        </div>
        {load && (
          <div className="mt-3.5">
            {/* Load averages count runnable threads, so the thread count gives them scale. */}
            <span className="font-mono text-[11px] text-data-grey">
              Load average{system.cpu_count ? <span className="text-data-grey/60"> · {system.cpu_count} threads</span> : null}
            </span>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {['1 min', '5 min', '15 min'].map((window, index) => (
                <div key={window} className="rounded-lg bg-[#F6F7F9] px-2.5 py-1.5">
                  <div className="font-mono text-[10px] text-data-grey">{window}</div>
                  <div className="font-mono text-xs tabular-nums text-inkwell">{loadText(load[index])}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <BoxFooter phrase={pressurePhrase('cpu', percent / 100, host)} />
      </div>
    </div>
  );
}

// The RAM's box: a large memory stick, memory in use, cache, what is still
// available, and swap.
function RamDetails({ host, system, level }) {
  const total = system.memory_total_mb;
  const used = system.memory_used_mb;
  const percent = Math.round((used / total) * 100);
  const inUse = LEVEL_SERIES[level] ?? RING_SERIES.memory;
  const swapKnown = system.swap_total_mb != null && system.swap_used_mb != null;
  return (
    <div className="flex gap-6">
      <div className="flex w-[112px] flex-shrink-0 flex-col items-center justify-center">
        <StickGlyph share={used / total} color={inUse.color} width={112} />
        <span
          className="mt-3 font-tight text-lg font-semibold leading-none tabular-nums text-inkwell"
          style={level ? { color: READING_STYLES[level].color } : undefined}
        >
          {percent}%
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-tight text-base font-semibold leading-tight text-inkwell">
          {host} <span className="text-data-grey/60">·</span> RAM
        </h4>
        <p className="mt-0.5 truncate font-mono text-[11px] text-data-grey">{formatMemory(total)} total</p>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3.5">
          <Metric label="In use" value={formatMemory(used)} share={used / total} series={inUse} />
          <Metric label="Available" value={formatMemory(total - used)} share={(total - used) / total} series={QUIET} />
          <Metric
            label="Cache"
            value={system.memory_cache_mb == null ? '—' : formatMemory(system.memory_cache_mb)}
            share={system.memory_cache_mb == null ? null : system.memory_cache_mb / total}
            series={QUIET}
          />
          <Metric
            label="Swap"
            value={swapKnown ? formatMemoryOf(system.swap_used_mb, system.swap_total_mb) : '—'}
            share={swapKnown && system.swap_total_mb ? system.swap_used_mb / system.swap_total_mb : null}
            series={QUIET}
          />
        </div>
        <BoxFooter phrase={pressurePhrase('ram', used / total, host)} />
      </div>
    </div>
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

import { useEffect, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { StatTile } from './controls';
import { useGrowingShare } from '../hooks/useGrowingShare';
import { LEVEL_SERIES, POWER_ICON_RANGE, READING_STYLES, SERIES, TEMPERATURE_ICON_RANGE } from './config';
import { formatCpuCount, formatCpuModel, formatMemory, formatMemoryOf, gpuModels, userColor } from './format';
import { busyGpuPhrase, freeGpuPhrase, idleGpuPhrase, pressurePhrase, reservedIdlePhrase } from './easterEggs';
import { HeldIdleNote, formatDuration } from '../servers/Insights';
import { ReservationMark, clashingUsers, formatLeft } from '../alerts/Reservations';

// The detail boxes a GPU, CPU or RAM reading opens on wider screens, in both the
// compact and the full view, and the small hardware glyphs they and the compact
// view draw.

// How far a reading is into its icon range: null below it, 0 at the start, 1 at
// the top and above.
export function heat(value, range) {
  if (value == null || value < range.from) return null;
  return Math.min(1, (value - range.from) / (range.to - range.from));
}

// Dim amber at 0, through orange, to the hot red (#B33A3A) at 1.
export function heatColor(amount) {
  const mix = (start, end) => start + (end - start) * amount;
  return `hsl(${mix(40, 0)}, ${mix(30, 51)}%, ${mix(72, 46)}%)`;
}

// Softer shades of the compute blue and memory green: two dozen rings at full
// strength would sit too heavily on the white cards.
export const RING_SERIES = {
  compute: { color: '#6F90EA', track: '#6F90EA1C' },
  memory: { color: '#5BBE98', track: '#5BBE9824' },
};

const CACHE_SERIES = { color: '#A6D9C3', track: '#5BBE981A' };
export const QUIET = { color: '#A3B1C6', track: '#A3B1C624' };

// share null leaves out the bar. The bar grows from 0 when it appears (a box
// opening) and glides to each new reading on a refresh.
export function Metric({ label, value, share = null, series = null }) {
  const shown = useGrowingShare(share ?? 0);
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[11px] text-data-grey">{label}</span>
        <span className="whitespace-nowrap font-mono text-xs tabular-nums text-inkwell">{value}</span>
      </div>
      {share != null && (
        <div className="mt-1.5 h-1 overflow-hidden rounded-full" style={{ backgroundColor: series.track }}>
          <div
            className="h-full rounded-full transition-colors duration-700"
            style={{ width: `${shown * 100}%`, backgroundColor: series.color }}
          />
        </div>
      )}
    </div>
  );
}

// Temperature and power bars stay quiet until their icon would appear, then
// warm with it.
// Temperature and power in the GPU boxes, matching their lines in the expanded
// view's chart: coral for temperature, mauve for power. A bar turns the hot red
// once its reading is well into its icon range.
export const TEMPERATURE_COLOR = '#E07A5F';
export const POWER_COLOR = '#B07AA1';
// The GPU glyph's contacts (all but the key notch's place), lit and unlit.
const CONTACTS = Array.from({ length: 15 }, (_, index) => index).filter((index) => index !== 4);
const CONTACTS_ON = '#DDA62A';
const CONTACTS_OFF = '#DCE2EA';

function readingBar(color, amount) {
  return amount != null && amount >= 0.5 ? LEVEL_SERIES.hot : { color, track: `${color}24` };
}

export function temperatureBar(celsius) {
  return readingBar(TEMPERATURE_COLOR, heat(celsius, TEMPERATURE_ICON_RANGE));
}

export function powerBar(share) {
  return readingBar(POWER_COLOR, heat(share, POWER_ICON_RANGE));
}

// The box a GPU tile opens on wider screens: a large ring on the left, the
// readings and its users on the right. A reserved GPU says who holds it and for
// how long under its status, and while nobody runs on it, the line at the
// bottom talks about the reservation instead of inviting jobs.
export function GpuDetails({ gpu, host, reservation = null, me = null, now = 0 }) {
  const mine = reservation?.user === me;
  const power = gpu.power_limit_w && gpu.power_w != null ? gpu.power_w / gpu.power_limit_w : null;
  return (
    <div className="flex gap-6">
      {/* A fixed width, wide enough for the status phrase on one line, so a long holder's
          name truncates instead of pushing the readings. */}
      <div className="flex w-[9.5rem] flex-shrink-0 flex-col items-center justify-center">
        <GpuGlyph
          compute={gpu.utilization / 100}
          memory={gpu.memory_total_mb ? gpu.memory_used_mb / gpu.memory_total_mb : 0}
          power={power}
        />
        {/* The fan is compute and the chips are memory, so both get a figure in their colour. */}
        <span className="mt-2.5 flex items-center gap-3 font-tight text-base font-semibold leading-none tabular-nums text-inkwell">
          {[
            ['compute', RING_SERIES.compute.color, gpu.utilization / 100],
            ['memory', RING_SERIES.memory.color, gpu.memory_total_mb ? gpu.memory_used_mb / gpu.memory_total_mb : 0],
          ].map(([name, color, share]) => (
            <span key={name} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
              <GrowingPercent share={share} />
              <span className="sr-only"> {name}</span>
            </span>
          ))}
        </span>
        {/* The dot leads the phrase; were one ever too long, it would wrap centred under the picture. */}
        <span className="mt-2.5 max-w-full text-center font-mono text-[11px] leading-snug text-data-grey">
          <span
            className={`mr-1.5 inline-block h-1.5 w-1.5 -translate-y-px rounded-full align-middle ${
              gpu.busy ? 'bg-synapse' : 'ring-1 ring-inset ring-data-grey/50'
            }`}
            aria-hidden="true"
          />
          {gpu.busy ? busyGpuPhrase(host, gpu.index, gpu.utilization) : freeGpuPhrase(host, gpu.index)}
        </span>
        {reservation && (
          <span
            className="mt-1.5 flex max-w-full flex-col items-center font-mono text-[11px] text-data-grey"
            title={`Reserved by ${mine ? 'you' : reservation.user}`}
          >
            <span className="flex max-w-full items-center gap-1.5">
              <ReservationMark
                mine={mine}
                clash={clashingUsers(gpu, reservation).length > 0}
                className="h-3 w-3 flex-shrink-0"
              />
              <span className="truncate">{mine ? 'you' : reservation.user}</span>
            </span>
            <span className="whitespace-nowrap text-data-grey/70">{formatLeft(reservation.ends_at - now)} left</span>
          </span>
        )}
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
            series={temperatureBar(gpu.temperature_c)}
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
            series={powerBar(power)}
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
                {user.running_seconds != null && (
                  <span className="text-data-grey/70">· {formatDuration(user.running_seconds)}</span>
                )}
              </span>
            ))
          ) : (
            <span className="font-mono text-xs text-data-grey">
              {gpu.busy
                ? 'In use; its owner was not reported'
                : reservation
                  ? reservedIdlePhrase(host, gpu.index, reservation.user, mine)
                  : idleGpuPhrase(host, gpu.index)}
            </span>
          )}
          <HeldIdleNote gpu={gpu} />
        </div>
        {gpu.problems?.length > 0 && (
          <p className="mt-2 font-mono text-[11px]" style={{ color: READING_STYLES.hot.color }}>
            Health: {gpu.problems.join('; ')}
          </p>
        )}
      </div>
    </div>
  );
}

// A box's large figure, counting up from 0 as the box opens and on to each new
// reading, in step with its picture.
function GrowingPercent({ share }) {
  return <>{Math.round(useGrowingShare(share) * 100)}%</>;
}

// Resting the mouse on a tile, GPU or reading this long opens its details too.
const HOVER_OPEN_MS = 2000;
// How long a hover-opened box waits for the mouse to reach it before closing.
const HOVER_CLOSE_MS = 200;

// A click opens a box that stays until Escape or a click elsewhere. A long
// hover opens one that closes again when the mouse leaves both the tile and
// the box; clicking the tile while it is open keeps it open instead.
export function DetailsPopover({ content, width, children }) {
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
export const GLYPH = { outline: '#CBD5E1', unlit: '#E9EEF4', contacts: '#E2C26F' };

// A tiny CPU chip: a 4 x 4 grid of cores that light up from the bottom row
// with the load, the last one partly.
// With animated set, the lit cores pulse out of step with each other, faster
// the higher the load; idle chips and viewers who prefer reduced motion get a
// still chip.
// pace, when given, is the reading the pulse keeps time to while share eases
// towards it, so the pulse runs steady through the change. With grow set the
// glyph eases there itself: up from 0 as it appears, then to each new reading.
export function ChipGlyph({ share, color, size = 26, animated = false, pace = share, grow = false }) {
  const growing = useGrowingShare(share, grow);
  const cells = 4;
  const lit = (grow ? growing : share) * cells * cells;
  const pins = [7.5, 11, 14.5];
  // Seconds per pulse: 2.8 at the lightest load down to 1 at full load.
  const pulse = animated && pace >= 0.02 ? 2.8 - 1.8 * pace : null;
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
        // The 10.5-wide grid of cores is centred in the body, which centres on 11.
        const x = 5.75 + column * 2.75;
        const y = 5.75 + row * 2.75;
        return (
          <g key={index}>
            <rect x={x} y={y} width="2.25" height="2.25" rx="0.5" fill={GLYPH.unlit} />
            {amount > 0 && (
              // The group pulses, so a partly lit core keeps its own dimmer opacity.
              <g
                className={pulse ? 'motion-safe:animate-pulse' : undefined}
                style={
                  pulse
                    ? { animationDuration: `${pulse}s`, animationDelay: `-${(((index * 7) % 16) / 16) * pulse}s` }
                    : undefined
                }
              >
                <rect x={x} y={y} width="2.25" height="2.25" rx="0.5" fill={color} opacity={0.3 + 0.7 * amount} />
              </g>
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
// power, when known, is the share of the power limit drawn: the gold contacts
// along the bottom light up with it from the left.
export function GpuGlyph({ compute, memory, power = null, width = 116 }) {
  const drawn = useGrowingShare(power ?? 0);
  const fan = { x: 14.5, y: 13, radius: 8.4 };
  const circumference = 2 * Math.PI * fan.radius;
  const load = Math.min(1, Math.max(0, compute));
  // The compute ring sweeps up from 0 when the box appears, and on to each new reading.
  const arc = useGrowingShare(load) * circumference;
  // Seconds per turn: 3.2 at the lightest load down to 0.6 at full load.
  const spin = load >= 0.02 ? 3.2 - 2.6 * load : null;
  const chips = 8;
  const used = Math.min(1, Math.max(0, memory));
  // The chips fill up from empty with it, and both glide to each new reading.
  const filled = useGrowingShare(used) * chips;
  // The memory chips pulse in a wave in reading order, like the RAM stick's:
  // seconds per wave, 3.2 when nearly empty down to 1.4 when full.
  const wave = used >= 0.02 ? 3.2 - 1.8 * used : null;
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
        const y = 6 + Math.floor(index / 4) * 8.6;
        return (
          <g key={index}>
            <rect x={x} y={y} width="5.6" height="6.4" rx="0.8" fill={GLYPH.unlit} />
            {amount > 0 && (
              <rect
                x={x}
                y={y}
                width={5.6 * amount}
                height="6.4"
                rx="0.8"
                fill={RING_SERIES.memory.color}
                className={wave ? 'motion-safe:animate-pulse' : undefined}
                style={
                  wave
                    ? { animationDuration: `${wave}s`, animationDelay: `-${((chips - index) / chips) * wave}s` }
                    : undefined
                }
              />
            )}
          </g>
        );
      })}
      {/* The gold contacts along the bottom; with power known, they light up
          from the left with the share of the power limit drawn, the rest
          grey, as if switched off. */}
      {CONTACTS.map((index, order) => {
        const x = 8 + index * 2.6;
        const amount = power == null ? 1 : Math.min(1, Math.max(0, drawn * CONTACTS.length - order));
        return (
          <g key={index}>
            {power != null && (
              <line x1={x} y1="27.2" x2={x} y2="29.4" stroke={CONTACTS_OFF} strokeWidth="1.3" strokeLinecap="round" />
            )}
            {amount > 0 && (
              <line
                x1={x}
                y1="27.2"
                x2={x}
                y2="29.4"
                stroke={power == null ? GLYPH.contacts : CONTACTS_ON}
                strokeWidth="1.3"
                strokeLinecap="round"
                opacity={amount}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// A tiny memory stick whose six chips fill from the left with the RAM in use,
// above a row of gold contacts with the key notch.
// With animated set, the lit memory chips pulse in a wave from left to right,
// like data written along the stick, quicker the fuller it is; an empty stick
// and viewers who prefer reduced motion get a still one.
// pace and grow as for ChipGlyph.
export function StickGlyph({ share, color, width = 44, animated = false, pace = share, grow = false }) {
  const growing = useGrowingShare(share, grow);
  const chips = 6;
  const filled = (grow ? growing : share) * chips;
  // Seconds per wave: 3.2 when nearly empty down to 1.4 when full.
  const wave = animated && pace >= 0.02 ? 3.2 - 1.8 * pace : null;
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
            {amount > 0 && (
              <rect
                x={x}
                y="4.2"
                width={3.9 * amount}
                height="6.1"
                rx="0.7"
                fill={color}
                className={wave ? 'motion-safe:animate-pulse' : undefined}
                style={
                  wave
                    ? { animationDuration: `${wave}s`, animationDelay: `-${((chips - index) / chips) * wave}s` }
                    : undefined
                }
              />
            )}
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
export function BoxFooter({ phrase, children = null }) {
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
// A part's box: by default its large picture (and figure) in a column on the
// left; with compact set, as in the expanded view, a small picture just before
// the title and everything else at full width.
function PartBox({ compact, large, small, title, subtitle, children }) {
  const heading = (
    <>
      <h4 className="font-tight text-base font-semibold leading-tight text-inkwell">{title}</h4>
      <p className="mt-0.5 truncate font-mono text-[11px] text-data-grey">{subtitle}</p>
    </>
  );
  if (compact) {
    return (
      <div>
        <div className="flex items-center gap-3">
          {small}
          <div className="min-w-0 flex-1">{heading}</div>
        </div>
        {children}
      </div>
    );
  }
  return (
    <div className="flex gap-6">
      {large}
      <div className="min-w-0 flex-1">
        {heading}
        {children}
      </div>
    </div>
  );
}

// children, if any, go just above the footer (the expanded view adds who uses
// it); compact puts a small chip before the title instead of the large one.
export function CpuDetails({ host, system, children = null, compact = false }) {
  const percent = Math.round(system.cpu_percent ?? 0);
  const load = system.load_averages;
  const shown = useGrowingShare(percent / 100);
  return (
    <PartBox
      compact={compact}
      large={
        <div className="flex w-[104px] flex-shrink-0 flex-col items-center justify-center">
          <ChipGlyph share={shown} pace={percent / 100} color={RING_SERIES.compute.color} size={92} animated />
          <span className="mt-1 font-tight text-lg font-semibold leading-none tabular-nums text-inkwell">
            {Math.round(shown * 100)}%
          </span>
        </div>
      }
      small={<ChipGlyph share={shown} pace={percent / 100} color={RING_SERIES.compute.color} size={44} animated />}
      title={
        <>
          {host} <span className="text-data-grey/60">·</span> CPU
        </>
      }
      subtitle={formatCpuModel(system) ?? 'Processor'}
    >
      <div className="mt-4">
        <Metric label="Load now" value={`${percent}%`} share={percent / 100} series={RING_SERIES.compute} />
      </div>
      {load && (
        <div className="mt-3.5">
          {/* Load averages count runnable threads, so the core and thread counts give them scale. */}
          <span className="font-mono text-[11px] text-data-grey">
            Load average
            {formatCpuCount(system) && <span className="text-data-grey/60"> · {formatCpuCount(system)}</span>}
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
      {children}
      <BoxFooter phrase={pressurePhrase('cpu', percent / 100, host)} />
    </PartBox>
  );
}

// The RAM's box: a large memory stick, memory in use, cache, what is still
// available, and swap.
export function RamDetails({ host, system, level, children = null, compact = false }) {
  const total = system.memory_total_mb;
  const used = system.memory_used_mb;
  const shown = useGrowingShare(used / total);
  const inUse = LEVEL_SERIES[level] ?? RING_SERIES.memory;
  const swapKnown = system.swap_total_mb != null && system.swap_used_mb != null;
  return (
    <PartBox
      compact={compact}
      large={
        <div className="flex w-[112px] flex-shrink-0 flex-col items-center justify-center">
          <StickGlyph share={shown} pace={used / total} color={inUse.color} width={112} animated />
          <span
            className="mt-3 font-tight text-lg font-semibold leading-none tabular-nums text-inkwell"
            style={level ? { color: READING_STYLES[level].color } : undefined}
          >
            {Math.round(shown * 100)}%
          </span>
        </div>
      }
      small={<StickGlyph share={shown} pace={used / total} color={inUse.color} width={60} animated />}
      title={
        <>
          {host} <span className="text-data-grey/60">·</span> RAM
        </>
      }
      subtitle={`${formatMemory(total)} total`}
    >
      {/* In use across the top; below it the file cache (files the system keeps
          in spare RAM and hands back the moment programs need it), in a paler
          shade of the RAM green, and swap, which lives on disk, in the disk hue. */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3.5">
        <div className="col-span-2">
          <Metric label="In use" value={formatMemory(used)} share={used / total} series={inUse} />
        </div>
        <Metric
          label="File cache"
          value={system.memory_cache_mb == null ? '—' : formatMemory(system.memory_cache_mb)}
          share={system.memory_cache_mb == null ? null : system.memory_cache_mb / total}
          series={CACHE_SERIES}
        />
        <Metric
          label="Swap"
          value={swapKnown ? formatMemoryOf(system.swap_used_mb, system.swap_total_mb) : '—'}
          share={swapKnown && system.swap_total_mb ? system.swap_used_mb / system.swap_total_mb : null}
          series={SERIES.disk}
        />
      </div>
      {children}
      <BoxFooter phrase={pressurePhrase('ram', used / total, host)} />
    </PartBox>
  );
}

// A StatTile that, on wider screens, opens details on a click or a long hover;
// phones get the plain tile. action finishes the button's label, such as
// "Show its trend".
export function BoxTile({ details, width = 'w-[460px]', action, ...tile }) {
  const interactive = !useIsMobile();
  if (!interactive || !details) return <StatTile {...tile} className="h-full" />;
  return (
    <DetailsPopover content={details} width={width}>
      <button
        type="button"
        aria-label={`${tile.label}: ${tile.value}. ${action}.`}
        className="group block h-full w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20"
      >
        <StatTile
          {...tile}
          className="h-full transition-colors group-hover:bg-paper group-data-[state=open]:bg-paper"
        />
      </button>
    </DetailsPopover>
  );
}

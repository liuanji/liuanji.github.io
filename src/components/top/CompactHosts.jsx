import { useEffect, useId, useState } from 'react';
import { ThermometerSun } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { GpuOverview, RackGlyph } from './GpuOverview';
import { HostStatus } from './HostPacking';
import {
  LEVEL_SERIES,
  POWER_ICON_RANGE,
  POWER_SPARKLE_SHARE,
  READING_STYLES,
  RESERVATION_CLASH,
  TEMPERATURE_ICON_RANGE,
} from './config';
import { DownNotice, ServerLink } from './controls';
import { OVERHEAT_DEEPEST_C, isOverheated, overheatColor } from './Overheat';
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
import { formatMemory, formatMemoryOf, hasCurrentData, ramLevel, temperatureLevel, userColor } from './format';
import { ReservationMark, ReserveControl, clashingUsers, findReservation } from './Reservations';
import { useGrowingShare } from './useGrowingShare';

function describe(gpu, host, reservation) {
  const parts = [
    `${host} GPU ${gpu.index}`,
    `${Math.round(gpu.utilization)}% compute`,
    `${formatMemory(gpu.memory_used_mb)} of ${formatMemory(gpu.memory_total_mb)} memory`,
  ];
  if (gpu.temperature_c != null) parts.push(`${Math.round(gpu.temperature_c)}°C`);
  if (gpu.power_w != null) {
    parts.push(
      gpu.power_limit_w
        ? `${Math.round(gpu.power_w)} of ${Math.round(gpu.power_limit_w)} W`
        : `${Math.round(gpu.power_w)} W`,
    );
  }
  parts.push(gpu.users.length ? gpu.users.map((user) => user.username).join(', ') : gpu.busy ? 'in use' : 'idle');
  if (reservation) parts.push(`reserved by ${reservation.user}`);
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

// The rings sweep, and the number counts, up from 0 when the page loads and to
// each new reading on a refresh.
function UsageRing({ gpu }) {
  const compute = useGrowingShare(gpu.utilization / 100);
  const memory = useGrowingShare(gpu.memory_total_mb ? gpu.memory_used_mb / gpu.memory_total_mb : 0);
  return (
    <div className="relative flex-shrink-0" style={{ width: RING.size, height: RING.size }}>
      <svg width={RING.size} height={RING.size} viewBox={`0 0 ${RING.size} ${RING.size}`} aria-hidden="true">
        <Arc radius={RING.outer} width={RING.outerWidth} share={compute} series={RING_SERIES.compute} />
        <Arc radius={RING.inner} width={RING.innerWidth} share={memory} series={RING_SERIES.memory} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-tight text-[13px] font-semibold tabular-nums text-inkwell">
        {Math.round(compute * 100)}%
      </span>
    </div>
  );
}

// The GPU's users, or with nobody on it, who reserved it, else "idle". Users
// running on someone else's reservation are named in amber.
function UserLabel({ gpu, reservation, me, clash }) {
  const [first, ...others] = gpu.users;
  if (!first && reservation) {
    return (
      // A size smaller than the users' names, so "Reserved by" fits with most names.
      <span className="truncate text-[10px] text-data-grey">
        Reserved by {reservation.user === me ? 'you' : reservation.user}
      </span>
    );
  }
  if (!first) return <span className="text-data-grey/60">{gpu.busy ? 'in use' : 'idle'}</span>;
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-inkwell">
      <span
        className="h-2 w-2 flex-shrink-0 rounded-full"
        style={{ backgroundColor: userColor(first.username) }}
        aria-hidden="true"
      />
      <span className="truncate" style={clash ? { color: RESERVATION_CLASH.color } : undefined}>
        {first.username}
      </span>
      {others.length > 0 && <span className="flex-shrink-0 text-data-grey">+{others.length}</span>}
    </span>
  );
}

// A tile's thermometer and bolt, each showing its reading: temperature is how
// high the mercury stands, power how full the bolt is, full at
// POWER_SPARKLE_SHARE of the power limit, when it sparkles too. Like the rings,
// both rise from empty when the page loads and glide to each new reading.
function HeatIcons({ temperature, power, charge, className }) {
  if (temperature == null && power == null) return null;
  return (
    <span className={`items-center gap-0.5 ${className}`} aria-hidden="true">
      {temperature != null && <TileThermometer amount={temperature} />}
      {power != null && <TileBolt amount={power} charge={charge} />}
    </span>
  );
}

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  className: 'h-3.5 w-3.5 overflow-visible',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '2.25',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
};
const heatStyle = (amount) => ({ color: heatColor(amount), transition: 'color 900ms ease-in-out' });

// The thermometer's mercury: a lighter fill inside its outline, up from the
// bottom of the bulb to y = top (22 empty, 6 full).
const THERMOMETER = 'M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z';

function Mercury({ top, className }) {
  const clip = `mercury${useId().replace(/:/g, '')}`;
  return (
    <>
      <clipPath id={clip}>
        <path d={THERMOMETER} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect
          x="0"
          y={top}
          width="24"
          height={24 - top}
          fill="currentColor"
          fillOpacity="0.45"
          stroke="none"
          className={className}
        />
      </g>
    </>
  );
}

// Even at the bottom of its range the bulb is full and the mercury shows a
// little up the tube, so it reads as a reading.
function TileThermometer({ amount }) {
  const level = useGrowingShare(0.4 + 0.6 * amount);
  return (
    <svg {...ICON_PROPS} style={heatStyle(amount)}>
      {level > 0 && <Mercury top={22 - 16 * level} />}
      <path d={THERMOMETER} />
    </svg>
  );
}

// Moving as the power key does: the bolt fills in as its colour deepens, and
// once full its sparkles twinkle in one by one, the biggest first. After that
// each blinks at random, keeping the bolt's colour.
function TileBolt({ amount, charge }) {
  const fill = useGrowingShare(charge);
  return (
    <svg {...ICON_PROPS} style={heatStyle(amount)}>
      {charge >= 1 && KEY_SPARKLES.map((sparkle, index) => <TileSparkle key={index} sparkle={sparkle} index={index} />)}
      <path d={BOLT} fill="currentColor" fillOpacity={fill} />
    </svg>
  );
}

// Each sparkle waits a random while, BLINK_WAIT_MS, before every blink, so no
// two keep step. A new key restarts the blink's animation.
const BLINK_WAIT_MS = [1500, 6000];

function TileSparkle({ sparkle: [x, y, r], index }) {
  const [blinks, setBlinks] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let timer;
    const wait = () => {
      timer = setTimeout(
        () => {
          setBlinks((count) => count + 1);
          wait();
        },
        BLINK_WAIT_MS[0] + Math.random() * (BLINK_WAIT_MS[1] - BLINK_WAIT_MS[0]),
      );
    };
    wait();
    return () => clearTimeout(timer);
  }, []);
  const box = { transformBox: 'fill-box', transformOrigin: 'center' };
  return (
    <g className="motion-safe:animate-sparkle-in" style={{ ...box, animationDelay: `${0.9 + index * 0.14}s` }}>
      <path
        key={blinks}
        d={sparklePath(x, y, r)}
        fill="currentColor"
        stroke="none"
        className={blinks ? 'motion-safe:animate-sparkle-blink' : undefined}
        style={box}
      />
    </g>
  );
}

// Each GPU sits on a faint grey panel, or a soft red one when hot: temperature
// is worth a closer look, while high power is normal under load and only shows
// its icon. On phones the icons sit beside the GPU's name, as its ring leaves
// no room in the corner. On wider screens the tile is a button that opens the
// GPU's details. With reservations on, the top-left corner reserves the GPU or
// shows its holder's mark, which tells who and for how long. The viewer's own
// reservations get a lavender bookmark and tint; others' a grey lock and a
// dashed grey edge. On a reserved GPU someone else runs on, the mark and the
// runner's name turn amber, and the tile is outlined in amber when the runner
// is the viewer. Above OVERHEAT_C the tile turns red with a pulsing halo, a red
// thermometer in its corner and its temperature in red, whatever else is going on.
function GpuRing({ gpu, host, interactive, now, reserving }) {
  const overheated = isOverheated(gpu);
  const hot = overheated || temperatureLevel(gpu.temperature_c) === 'hot';
  const temperature = heat(gpu.temperature_c, TEMPERATURE_ICON_RANGE);
  const powerShare = gpu.power_limit_w && gpu.power_w != null ? gpu.power_w / gpu.power_limit_w : null;
  const power = heat(powerShare, POWER_ICON_RANGE);
  // How full the bolt is: empty where its range starts, full at POWER_SPARKLE_SHARE.
  const charge =
    powerShare == null
      ? null
      : Math.min(1, Math.max(0, (powerShare - POWER_ICON_RANGE.from) / (POWER_SPARKLE_SHARE - POWER_ICON_RANGE.from)));
  const reservation = reserving ? findReservation(reserving.reservations, host, gpu.index, now) : null;
  const clash = clashingUsers(gpu, reservation);
  const meClashing = Boolean(reserving) && clash.includes(reserving.me);
  const mine = Boolean(reservation) && reservation.user === reserving.me;
  const label = describe(gpu, host, reservation);
  const Tile = interactive ? 'button' : 'div';
  const tile = (
    <Tile
      {...(interactive
        ? { type: 'button', 'aria-label': `${label}. Show details.` }
        : { role: 'img', 'aria-label': label, title: label })}
      className={`relative flex h-full w-full min-w-0 flex-col items-center rounded-2xl px-1.5 pb-2.5 pt-3 transition-colors ${
        hot
          ? 'bg-[#B33A3A]/[0.07]'
          : mine
            ? 'bg-[#8478D6]/[0.11] hover:bg-[#8478D6]/[0.14] data-[state=open]:bg-[#8478D6]/[0.17]'
            : 'bg-[#F6F7F9] hover:bg-[#F1F3F6] data-[state=open]:bg-[#ECEFF3]'
      } ${
        meClashing
          ? 'ring-2 ring-inset ring-[#E8B14F]'
          : reservation && !mine
            ? 'outline-dashed outline-[1.5px] outline-offset-[-1.5px] outline-[#94A3B8]'
            : ''
      } ${overheated ? 'bg-[#B33A3A]/[0.12] motion-safe:animate-alarm ring-2 ring-inset ring-[#B33A3A]' : ''} ${
        gpu.busy || reservation ? '' : 'opacity-55'
      } ${
        interactive
          ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20'
          : ''
      }`}
    >
      {overheated ? (
        // Too hot: a red thermometer where the heat icons sit, and the
        // temperature in red where the memory usually is.
        <ThermometerSun
          className="absolute right-1.5 top-1.5 h-4 w-4 motion-safe:animate-pulse"
          style={{ color: overheatColor(gpu.temperature_c) }}
          strokeWidth={2.25}
          aria-hidden="true"
        />
      ) : (
        <HeatIcons
          temperature={temperature}
          power={power}
          charge={charge}
          className="absolute right-1.5 top-1.5 hidden flex-col sm:flex"
        />
      )}
      <UsageRing gpu={gpu} />
      <div className="mt-2 flex items-center gap-1 whitespace-nowrap font-mono text-[11px] text-data-grey">
        GPU {gpu.index}
        {overheated ? (
          <span className="font-medium" style={{ color: overheatColor(gpu.temperature_c) }}>
            · {Math.round(gpu.temperature_c)}°C
          </span>
        ) : (
          <span className="hidden text-data-grey/60 sm:inline">· {formatMemory(gpu.memory_used_mb)}</span>
        )}
        <HeatIcons temperature={temperature} power={power} charge={charge} className="flex sm:hidden" />
      </div>
      <div className="mt-1 flex w-full justify-center font-mono text-[11px]">
        <UserLabel gpu={gpu} reservation={reservation} me={reserving?.me} clash={clash.length > 0} />
      </div>
    </Tile>
  );
  const withDetails = interactive ? (
    <DetailsPopover
      content={<GpuDetails gpu={gpu} host={host} reservation={reservation} me={reserving?.me} now={now} />}
      width="w-[500px]"
    >
      {tile}
    </DetailsPopover>
  ) : (
    tile
  );
  if (!reserving) return withDetails;
  // A sibling over the tile's corner, since a button cannot hold another.
  return (
    <div className="relative min-w-0">
      {withDetails}
      <ReserveControl
        host={host}
        gpu={gpu}
        reservation={reservation}
        me={reserving.me}
        held={reserving.held}
        now={now}
        onReserve={reserving.reserve}
        onRelease={reserving.release}
        className="absolute left-0.5 top-0.5 sm:left-1 sm:top-1"
      />
    </div>
  );
}

// A CPU or RAM reading for a server's header: a small picture of the part, lit
// in the rings' soft colours, and its percentage. A warm or hot level takes
// over the picture and the value, as in the full view. On wider screens it is
// a button that opens the part's box, like a GPU tile.
// count, when given, shows the reading as how many of count (as the GPUs in
// use) instead of a percentage. Every meter is as tall as the others and has
// the same room round its label, picture and reading, so the gaps between the
// meters match.
function HeaderMeter({ label, Glyph, share, title, series, level = null, details = null, count = null }) {
  const clamped = Math.min(1, Math.max(0, share));
  // Like the rings, the meter and its number rise from 0 when the page loads
  // and glide to each new reading on a refresh.
  const shown = useGrowingShare(clamped);
  const percent = Math.round(shown * 100);
  const inner = (
    <>
      <span aria-hidden="true">{label}</span>
      {/* Alive like the boxes' own: the CPU's cores and the RAM's chips pulse with the load. */}
      <Glyph
        share={shown}
        pace={clamped}
        color={(LEVEL_SERIES[level] ?? series).color}
        count={count ?? undefined}
        animated
      />
      <span
        // A fixed width, the same on every server so the meters line up in
        // columns: three characters for a percentage (wider only at 100%), or
        // as many as the longest count needs.
        className={`text-left tabular-nums ${level ? 'font-medium' : 'text-inkwell'}`}
        style={{
          minWidth: count == null ? '3ch' : `${String(count).length * 2 + 1}ch`,
          ...(level ? { color: READING_STYLES[level].color } : {}),
        }}
        aria-hidden="true"
      >
        {count == null ? `${percent}%` : `${Math.round(shown * count)}/${count}`}
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
        className="-mx-2 -my-1 flex h-[34px] items-center gap-1.5 rounded-lg px-2 font-mono text-xs text-data-grey transition-colors hover:bg-[#F1F3F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20 data-[state=open]:bg-[#ECEFF3]"
      >
        {inner}
      </button>
    </DetailsPopover>
  );
}

function SystemMeters({ system, host, gpus, interactive, token }) {
  const busy = gpus.filter((gpu) => gpu.busy).length;
  const ramKnown = system.memory_used_mb != null && system.memory_total_mb;
  const ram = ramKnown ? ramLevel(system.memory_used_mb, system.memory_total_mb) : null;
  return (
    <span className="flex items-center gap-6">
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
      {gpus.length > 0 && (
        <HeaderMeter
          label="GPU"
          Glyph={RackGlyph}
          share={busy / gpus.length}
          count={gpus.length}
          title={`GPUs ${busy} of ${gpus.length} in use`}
          series={RING_SERIES.compute}
          details={interactive ? <GpuOverview host={{ name: host, gpus }} token={token} /> : null}
        />
      )}
    </span>
  );
}

function CompactHost({ host, now, interactive, onOpen, reserving, token }) {
  const busy = host.gpus.filter((gpu) => gpu.busy).length;
  const compute = host.gpus.length
    ? host.gpus.reduce((total, gpu) => total + gpu.utilization, 0) / host.gpus.length
    : 0;
  const outdated = host.data_sampled_at != null && !hasCurrentData(host, now);
  // Not reporting: the GPUs fade back behind a note saying so.
  const down = outdated || host.status === 'error';
  return (
    <article data-cat-perch className="bg-white rounded-2xl border border-border-light px-4 pb-3 pt-4 sm:px-5">
      {/* One line on wider screens; on phones the status moves up beside the
          name, and the summary and CPU/RAM take a line each. */}
      <header className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-2 px-1">
        <h3 className="order-1 font-tight font-semibold text-lg text-inkwell leading-tight">
          <ServerLink name={host.name} onOpen={onOpen} />
        </h3>
        {host.gpus.length > 0 && (
          <span className="order-3 w-full font-mono text-xs text-data-grey sm:order-2 sm:w-auto">
            {busy}/{host.gpus.length} in use · {Math.round(compute)}% compute
          </span>
        )}
        <span className="order-4 flex w-full flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-data-grey sm:order-3 sm:ml-auto sm:w-auto">
          {host.system && (
            <span className={outdated ? 'opacity-50' : undefined}>
              <SystemMeters
                system={host.system}
                host={host.name}
                gpus={host.gpus}
                interactive={interactive}
                token={token}
              />
            </span>
          )}
        </span>
        {/* A pill's box sits a little below its text, so it rises a pixel to
            centre on the text and glyphs beside it. */}
        <span className="order-2 ml-auto -translate-y-px sm:order-4 sm:ml-0">
          <HostStatus host={host} now={now} />
        </span>
      </header>
      {host.gpus.length ? (
        <div className="relative">
          <div
            className={`grid grid-cols-4 gap-1 transition-opacity sm:gap-2 lg:grid-cols-8 ${down ? 'opacity-25 grayscale' : ''}`}
          >
            {host.gpus.map((gpu) => (
              <GpuRing
                key={gpu.index}
                gpu={gpu}
                host={host.name}
                interactive={interactive}
                now={now}
                reserving={reserving}
              />
            ))}
          </div>
          {down && <DownNotice host={host} now={now} />}
        </div>
      ) : (
        <p className="px-1 py-4 text-sm text-data-grey">No data from this server right now.</p>
      )}
    </article>
  );
}

// One icon that breathes through its heat colours, dim to hot and back; with
// reduced motion it holds the middle colour.
// The temperature key, drawn in steps rather than swapped: as it warms through
// its heat colours the mercury rises, the thermometer slides aside and the
// overheat warning's sun rays appear one by one, then it all cools back. With
// reduced motion it holds a plain thermometer at the middle colour.
const KEY_RAYS = ['M12 9a4 4 0 0 0-2 7.5', 'M12 3v2', 'M6.34 7.34 4.93 5.93', 'M4 13H2', 'm6.6 18.4-1.4 1.4'];

function TemperatureScale() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 motion-safe:animate-key-heat"
      style={{ color: heatColor(0.5) }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {KEY_RAYS.map((d, index) => (
        <path
          key={d}
          d={d}
          className="opacity-0 motion-safe:animate-key-ray"
          style={{ transformOrigin: '12px 12px', animationDelay: `${(index - 2) * 0.12}s` }}
        />
      ))}
      <g className="motion-safe:animate-key-slide">
        <Mercury top={6} className="translate-y-[16px] motion-safe:animate-key-mercury" />
        <path d={THERMOMETER} />
      </g>
    </svg>
  );
}

// The power key, drawn in steps like the temperature one: as it warms through
// the heat colours the bolt fills in and three sparkles twinkle in round it one
// by one, the biggest first, then it all fades back to an empty bolt. With
// reduced motion it holds the empty bolt at the middle colour.
const BOLT = 'M13 2 3 14h9l-1 8 10-12h-9l1-8z';
const KEY_SPARKLES = [
  [20.8, 3.2, 3.6],
  [3.4, 20.6, 2.6],
  [21.2, 19.6, 1.9],
];

// A four-point sparkle centred on (x, y), drawn like the croissant's.
function sparklePath(x, y, r) {
  const k = r * 0.12;
  return `M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z`;
}

function PowerScale() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 overflow-visible motion-safe:animate-heat"
      style={{ color: heatColor(0.5) }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {KEY_SPARKLES.map(([x, y, r], index) => (
        <path
          key={index}
          d={sparklePath(x, y, r)}
          fill="currentColor"
          stroke="none"
          className="opacity-0 motion-safe:animate-key-sparkle"
          style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDelay: `${(index - 1) * 0.14}s` }}
        />
      ))}
      <path d={BOLT} fill="currentColor" fillOpacity="0" className="motion-safe:animate-key-fill" />
    </svg>
  );
}

// The ring keys, drawn like a tile's rings: the ring a key names sweeps
// clockwise from the top over its faint track, swinging to a new random
// reading every so often the way a busy GPU's does: compute in quicker, wider
// swings, memory slower and steadier. With reduced motion each holds its first
// reading. Shares are of the full ring; waits are between swings, in ms.
const KEY_RINGS = {
  outer: { radius: 5.5, rest: 0.4, low: 0.25, high: 1, step: 0.15, swingMs: 1100, waitMs: [600, 1600] },
  inner: { radius: 2.5, rest: 0.55, low: 0.45, high: 0.85, step: 0.08, swingMs: 1800, waitMs: [1200, 2800] },
};

function useSwingingShare({ rest, low, high, step, swingMs, waitMs }, swinging) {
  const [share, setShare] = useState(rest);
  useEffect(() => {
    if (!swinging || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const between = (from, to) => from + Math.random() * (to - from);
    let timer;
    const swing = () => {
      // A new reading at least a step away from the last, so every swing shows.
      setShare((last) => {
        let next = last;
        while (Math.abs(next - last) < step) next = between(low, high);
        return next;
      });
      timer = setTimeout(swing, swingMs + between(...waitMs));
    };
    timer = setTimeout(swing, between(...waitMs));
    return () => clearTimeout(timer);
  }, [rest, low, high, step, swingMs, waitMs, swinging]);
  return share;
}

function KeyRing({ ring, series, lit }) {
  const settings = KEY_RINGS[ring];
  const share = useSwingingShare(settings, lit);
  const circumference = 2 * Math.PI * settings.radius;
  return (
    <>
      <circle cx="7" cy="7" r={settings.radius} fill="none" stroke={series.track} strokeWidth="2" />
      {lit && (
        <circle
          cx="7"
          cy="7"
          r={settings.radius}
          fill="none"
          stroke={series.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - share)}
          transform="rotate(-90 7 7)"
          style={{ transition: `stroke-dashoffset ${settings.swingMs}ms ease-in-out` }}
        />
      )}
    </>
  );
}

function RingKey({ outer }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <KeyRing ring="outer" series={RING_SERIES.compute} lit={outer} />
      <KeyRing ring="inner" series={RING_SERIES.memory} lit={!outer} />
    </svg>
  );
}

function LegendItem({ children }) {
  return <span className="inline-flex items-center gap-1.5">{children}</span>;
}

// onOpen(name) switches the page to that server's own panel. reserving, when
// the Worker supports reservations, is { reservations, me, held, reserve, release }.
export default function CompactHosts({ hosts, now, onOpen, reserving = null, token = null }) {
  // The details box needs room beside the tiles, so phones keep plain tiles.
  const interactive = !useIsMobile();
  return (
    <div>
      <div className="space-y-4">
        {hosts.map((host) => (
          <CompactHost
            key={host.name}
            host={host}
            now={now}
            interactive={interactive}
            onOpen={onOpen}
            reserving={reserving}
            token={token}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[11px] text-data-grey">
        <LegendItem>
          <RingKey outer />
          Outer ring: compute
        </LegendItem>
        <LegendItem>
          <RingKey />
          Inner ring: memory
        </LegendItem>
        <LegendItem>
          <TemperatureScale />
          {TEMPERATURE_ICON_RANGE.from}–{OVERHEAT_DEEPEST_C}°C
        </LegendItem>
        <LegendItem>
          <PowerScale />
          70–100% of power limit
        </LegendItem>
        {reserving && (
          <>
            <LegendItem>
              <ReservationMark mine />
              Reserved by you
            </LegendItem>
            <LegendItem>
              <ReservationMark mine={false} />
              Reserved by others
            </LegendItem>
          </>
        )}
      </div>
    </div>
  );
}

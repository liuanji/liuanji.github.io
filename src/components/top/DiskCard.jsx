import { useId, useState } from 'react';
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { HardDrive } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { LEVEL_SERIES, READING_STYLES, SERIES, SMALL_USER_BYTES } from './config';
import { Banner, BannerLink, ScrollList } from './controls';
import { BoxFooter, DetailsPopover, GLYPH, Metric, QUIET } from './DetailBoxes';
import { pressurePhrase } from './easterEggs';
import {
  cleanupAllowance,
  diskLevel,
  diskShare,
  formatAgo,
  formatAxisTime,
  formatBytes,
  formatFullTime,
} from './format';
import { useGrowingShare } from './useGrowingShare';

// Users holding at least this share of what the disk's users use, and at least
// SMALL_USER_BYTES, get their own segment, at most MAX_SEGMENTS of them;
// everyone else shares "Others".
const OWN_SEGMENT_SHARE = 0.05;
const MAX_SEGMENTS = 5;
// One hue per bar, the disk's usual one (or its warning hue when nearly full),
// lighter for each smaller user and lightest for "Other"; hex alpha suffixes.
const SHADES = ['FF', 'E0', 'C2', 'A3', '85'];
const OTHER_SHADE = '5C';

// A user's share of the counted space: whole percents, but a small share keeps
// a decimal ("0.4%") and a sliver says so ("< 0.1%") rather than "0%".
function formatShare(share) {
  if (share <= 0) return '0%';
  if (share < 0.001) return '< 0.1%';
  return share < 0.01 ? `${(share * 100).toFixed(1)}%` : `${Math.round(share * 100)}%`;
}

// A disk's per-user segments. The users were counted up to 2 hours before the
// disk's used space was checked, so their sizes are rescaled to fill exactly
// the used part of the bar; each keeps its counted size for the details.
function segmentsFor(disk, color) {
  const users = disk.users ?? [];
  const counted = users.reduce((total, user) => total + user.bytes, 0);
  if (!counted) return [];
  const own = users.filter(
    (user, index) =>
      index < MAX_SEGMENTS && user.bytes >= SMALL_USER_BYTES && user.bytes / counted >= OWN_SEGMENT_SHARE,
  );
  const rest = users.slice(own.length);
  // A lone leftover user who is not small keeps their name.
  const shown = rest.length === 1 && rest[0].bytes >= SMALL_USER_BYTES ? [...own, rest[0]] : own;
  const segments = shown.map((user, index) => ({
    key: user.user,
    label: user.user,
    bytes: user.bytes,
    color: `${color}${SHADES[Math.min(index, SHADES.length - 1)]}`,
  }));
  if (shown.length < users.length) {
    segments.push({
      key: 'other',
      label: othersLabel(users.length - shown.length),
      bytes: rest.reduce((total, user) => total + user.bytes, 0),
      color: `${color}${OTHER_SHADE}`,
    });
  }
  const share = diskShare(disk);
  return segments.map((segment) => ({ ...segment, share: (share * segment.bytes) / counted }));
}

function othersLabel(count) {
  return count === 1 ? '1 other user' : `${count} others`;
}

// The used part's colour by how full the disk is: the disks' blue, amber from
// 80% (where its cleanup note joins the top of the page) and red from 95%.
export function fullnessColor(share) {
  if (share >= 0.95) return LEVEL_SERIES.hot.color;
  if (share >= 0.8) return '#D08C1F';
  return SERIES.disk.color;
}

// The drive's strip as cells, lit up to shown (0-1), the last partly. Once
// settled at the reading, the lit cells pulse out of step, as the CPU chip's
// cores do: 2.8 s a pulse when nearly empty down to 1.2 s when full.
const DRIVE_CELLS = 10;

function DriveCells({ strip, shown, settled, share, color }) {
  const lit = shown * DRIVE_CELLS;
  const gap = 0.6;
  const width = (strip.width - gap * (DRIVE_CELLS - 1)) / DRIVE_CELLS;
  const pulse = settled && share >= 0.02 ? 2.8 - 1.6 * share : null;
  return Array.from({ length: DRIVE_CELLS }, (_, index) => {
    const x = strip.x + index * (width + gap);
    const amount = Math.min(1, Math.max(0, lit - index));
    return (
      <g key={index}>
        <rect x={x} y={strip.y} width={width} height={strip.height} rx="0.8" fill={GLYPH.unlit} />
        {amount > 0 && (
          // The group pulses, so a partly lit cell keeps its own dimmer opacity.
          <g
            className={pulse ? 'motion-safe:animate-pulse' : undefined}
            style={
              pulse
                ? {
                    animationDuration: `${pulse}s`,
                    animationDelay: `-${(((index * 7) % DRIVE_CELLS) / DRIVE_CELLS) * pulse}s`,
                  }
                : undefined
            }
          >
            <rect
              x={x}
              y={strip.y}
              width={width}
              height={strip.height}
              rx="0.8"
              fill={color}
              opacity={0.3 + 0.7 * amount}
            />
          </g>
        )}
      </g>
    );
  });
}

// An M.2 drive: gold contacts on the left, a screw notch on the right, and a
// storage strip filled with the disk's segments (or one fill without users).
// With grow set the strip is a row of cells like the CPU chip's cores: they
// fill from empty when it appears, then the lit ones pulse out of step with
// each other, faster the fuller the disk, while a small activity light blinks.
// Viewers who prefer reduced motion get a still drive.
function DriveGlyph({ segments, share, color, width = 112, grow = false }) {
  const strip = { x: 9, y: 7, width: 43, height: 8 };
  const shown = useGrowingShare(share, grow);
  const scale = share > 0 ? shown / share : 0;
  const pieces = (segments.length ? segments : [{ key: 'used', share, color }]).map((piece) => ({
    ...piece,
    share: piece.share * scale,
  }));
  // useId's colons do not belong in url(#…), so they are dropped.
  const clip = `drive${useId().replace(/:/g, '')}`;
  let x = strip.x;
  return (
    <svg width={width} height={(width * 22) / 60} viewBox="0 0 60 22" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <line
          key={index}
          x1="1"
          y1={4.5 + index * 2.6}
          x2="4"
          y2={4.5 + index * 2.6}
          stroke={GLYPH.contacts}
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      ))}
      <rect
        x="4.15"
        y="1.65"
        width="54.2"
        height="18.7"
        rx="2.5"
        fill="white"
        stroke={GLYPH.outline}
        strokeWidth="1.3"
      />
      <circle cx="55" cy="11" r="1.5" fill="none" stroke={GLYPH.outline} strokeWidth="1.1" />
      {grow && <circle cx="55" cy="5" r="0.9" fill={color} className="opacity-25 motion-safe:animate-blink" />}
      {!grow && <rect {...strip} rx="1.6" fill={GLYPH.unlit} />}
      <clipPath id={clip}>
        <rect {...strip} rx="1.6" />
      </clipPath>
      {grow ? (
        <DriveCells strip={strip} shown={shown} settled={Math.abs(shown - share) < 0.002} share={share} color={color} />
      ) : (
        <g clipPath={`url(#${clip})`}>
          {pieces.map((piece) => {
            const pieceWidth = Math.max(0, Math.min(1, piece.share)) * strip.width;
            const rect = (
              <rect
                key={piece.key}
                x={x}
                y={strip.y}
                width={Math.max(0, pieceWidth - 0.5)}
                height={strip.height}
                fill={piece.color}
              />
            );
            x += pieceWidth;
            return rect;
          })}
        </g>
      )}
    </svg>
  );
}

// How full the disk has been over the range being viewed: a small area chart
// of its share in use, with the 80% mark where cleanup notes move to the top
// of the page, and a line saying how it changed.
function DiskOverTime({ series, range, color }) {
  const gradient = `disk${useId().replace(/:/g, '')}`;
  const points = (series?.values ?? []).map((value, index) => ({
    timestamp: series.start + index * series.step,
    share: value == null ? null : value * 100,
  }));
  const readings = points.filter((point) => point.share != null);
  if (readings.length < 2) {
    return (
      <p className="py-6 text-center font-mono text-[11px] text-data-grey">
        Not enough checks in this period yet; disks are checked every half hour.
      </p>
    );
  }
  const first = readings[0];
  const last = readings.at(-1);
  const change = last.share - first.share;
  const ticks = [points[0].timestamp, points.at(-1).timestamp];
  return (
    <div>
      <p className="mb-1 text-xs text-data-grey">
        {Math.abs(change) < 0.5 ? (
          <>
            Steady at <span className="text-inkwell">{Math.round(last.share)}%</span>
          </>
        ) : (
          <>
            From <span className="text-inkwell">{Math.round(first.share)}%</span> to{' '}
            <span className="text-inkwell">{Math.round(last.share)}%</span>
            {change > 0 ? ', filling up' : ', freeing up'}
          </>
        )}
      </p>
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 6, right: 18, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={color} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={ticks}
              ticks={ticks}
              tickFormatter={(time) => formatAxisTime(time, range)}
              axisLine={{ stroke: '#EEF2F6' }}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              tickMargin={6}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 80, 100]}
              interval={0}
              tickFormatter={(tick) => `${tick}%`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              width={34}
            />
            <ReferenceLine y={80} stroke="#E2E8F0" strokeDasharray="3 4" />
            <Tooltip
              cursor={{ stroke: '#E2E8F0' }}
              isAnimationActive={false}
              content={({ active, payload, label }) =>
                active && payload?.[0]?.value != null ? (
                  <div className="rounded-lg border border-border-light bg-white/95 px-2.5 py-1.5 text-xs shadow-sm">
                    <div className="font-mono text-[11px] text-data-grey">{formatFullTime(label)}</div>
                    <div className="text-inkwell">{Math.round(payload[0].value)}% full</div>
                  </div>
                ) : null
              }
            />
            <Area
              type="monotone"
              dataKey="share"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${gradient})`}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 1.5, stroke: '#FFFFFF', fill: color }}
              connectNulls
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// The box a disk opens on wider screens: the drive and how full it is on the
// left; on the right its size, used space, and its users with what
// they hold, in the bar's shades, those under SMALL_USER_BYTES summed as
// others. Once the disk is full enough for cleanup reminders, it states the
// allowance and marks who is over it.
function DiskDetails({ host, disk, segments, color, level, checkedAgo, countedAgo, range }) {
  const share = diskShare(disk);
  const users = disk.users ?? [];
  const counted = users.reduce((total, user) => total + user.bytes, 0);
  const othersColor = segments.find((segment) => segment.key === 'other')?.color;
  const swatch = (user) => segments.find((segment) => segment.key === user)?.color ?? othersColor;
  const listed = users.filter((user) => user.bytes >= SMALL_USER_BYTES);
  const small = users.filter((user) => user.bytes < SMALL_USER_BYTES);
  const allowance = cleanupAllowance(disk);
  // Who holds the disk, or how full it has been over the range being viewed.
  const [view, setView] = useState('users');
  const series = disk.history?.[range?.value] ?? null;
  const showing = counted > 0 ? view : 'time';
  return (
    <div>
      {/* The drive beside the disk's name, its fill coloured by how full it is. */}
      <div className="flex items-center gap-3">
        <DriveGlyph segments={[]} share={share} color={fullnessColor(share)} width={52} grow />
        <div className="min-w-0 flex-1">
          <h4 className="font-tight text-base font-semibold leading-tight text-inkwell">
            {host} <span className="text-data-grey/60">·</span> {disk.mount}
          </h4>
          <p className="mt-0.5 truncate font-mono text-[11px] text-data-grey">
            {formatBytes(disk.total_bytes)} disk{checkedAgo && ` · checked ${checkedAgo}`}
          </p>
        </div>
        <span
          className="font-tight text-lg font-semibold leading-none tabular-nums text-inkwell"
          style={level ? { color: READING_STYLES[level].color } : undefined}
        >
          {Math.round(share * 100)}%
        </span>
      </div>
      <div>
        <div className="mt-4">
          <Metric
            label="Used"
            value={formatBytes(disk.used_bytes)}
            share={share}
            series={{ color, track: QUIET.track }}
          />
        </div>
        <div className="mb-2 mt-4 flex items-center justify-between gap-3 font-mono text-[11px] text-data-grey">
          <span
            className="inline-flex rounded-full border border-border-light p-0.5"
            role="radiogroup"
            aria-label="Shown"
          >
            {[
              ['users', 'By user'],
              ['time', 'Over time'],
            ]
              .filter(([key]) => key === 'time' || counted > 0)
              .map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={showing === key}
                  onClick={() => setView(key)}
                  className={`rounded-full px-2.5 py-0.5 transition-colors ${
                    showing === key ? 'bg-[#F1F5F9] text-inkwell' : 'text-data-grey/70 hover:text-inkwell'
                  }`}
                >
                  {label}
                </button>
              ))}
          </span>
          <span className="text-data-grey/70">
            {showing === 'users' ? countedAgo && `counted ${countedAgo}` : range?.title}
          </span>
        </div>
        {showing === 'time' && <DiskOverTime series={series} range={range?.value} color={fullnessColor(share)} />}
        {showing === 'users' && (
          <div>
            <ScrollList count={listed.length + (small.length ? 1 : 0)} rowRem={1.25} className="space-y-1">
              {listed.map((user) => {
                const over = allowance != null && user.bytes > allowance;
                return (
                  <li
                    key={user.user}
                    className="grid grid-cols-[0.5rem_minmax(0,1fr)_auto_2.25rem] items-center gap-2.5 font-mono text-xs"
                  >
                    <span
                      className="h-2 w-2 rounded-[2px]"
                      style={{ backgroundColor: swatch(user.user) }}
                      aria-hidden="true"
                    />
                    <span className="truncate text-inkwell">{user.user}</span>
                    <span
                      className={`tabular-nums ${over ? 'font-medium' : 'text-inkwell'}`}
                      style={over ? { color: READING_STYLES.warm.color } : undefined}
                      title={over ? `Over the ${formatBytes(allowance)} allowance` : undefined}
                    >
                      {formatBytes(user.bytes)}
                      {over && <span className="sr-only"> (over the allowance)</span>}
                    </span>
                    <span className="text-right tabular-nums text-data-grey">{formatShare(user.bytes / counted)}</span>
                  </li>
                );
              })}
              {small.length > 0 && (
                <li className="grid grid-cols-[0.5rem_minmax(0,1fr)_auto_2.25rem] items-center gap-2.5 font-mono text-xs text-data-grey">
                  <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: othersColor }} aria-hidden="true" />
                  <span className="truncate">{othersLabel(small.length)}</span>
                  <span className="tabular-nums">
                    {formatBytes(small.reduce((total, user) => total + user.bytes, 0))}
                  </span>
                  <span className="text-right tabular-nums">
                    {formatShare(small.reduce((total, user) => total + user.bytes, 0) / counted)}
                  </span>
                </li>
              )}
            </ScrollList>
            {allowance != null && (
              <p className="mt-2 font-mono text-[11px] text-data-grey">
                Allowance: <span style={{ color: READING_STYLES.warm.color }}>{formatBytes(allowance)}</span> each
              </p>
            )}
          </div>
        )}
        <BoxFooter phrase={pressurePhrase('disk', share, host, disk.mount)} />
      </div>
    </div>
  );
}

// One disk. Hovering or tapping the bar picks a segment, whose user and counted
// size replace the line below it; the others fade. On wider screens the row is
// a button that opens the disk's box, like a GPU tile.
function DiskRow({ host, disk, interactive, checkedAgo, countedAgo, range }) {
  const [active, setActive] = useState(null);
  const percent = Math.round(diskShare(disk) * 100);
  const level = diskLevel(disk);
  const bar = LEVEL_SERIES[level] ?? SERIES.disk;
  const segments = segmentsFor(disk, bar.color);
  const picked = active == null ? null : segments[active];

  const pick = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    const at = (event.clientX - box.left) / box.width;
    let edge = 0;
    const index = segments.findIndex((segment) => (edge += segment.share) >= at);
    setActive(index === -1 ? null : index);
  };

  const content = (
    <>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="truncate font-mono text-sm text-inkwell">{disk.mount}</span>
        <span
          className={`-my-0.5 -mr-1 whitespace-nowrap rounded px-1 py-0.5 font-mono text-xs tabular-nums ${
            level ? 'font-medium' : 'text-inkwell'
          }`}
          style={READING_STYLES[level]}
        >
          {percent}%
        </span>
      </div>
      {segments.length ? (
        // The padding widens the strip that answers the pointer around the thin bar.
        <div
          onPointerMove={pick}
          onPointerDown={pick}
          onPointerLeave={(event) => event.pointerType === 'mouse' && setActive(null)}
          className="-my-1.5 touch-pan-y select-none py-1.5"
          aria-hidden="true"
        >
          {/* The free part is its own piece, so the gaps between users show the card's white. */}
          <div className="flex h-2 gap-[1.5px] overflow-hidden rounded-full">
            {segments.map((segment, index) => (
              <span
                key={segment.key}
                className="h-full flex-shrink-0 transition-opacity duration-150"
                style={{
                  width: `${Math.min(100, segment.share * 100)}%`,
                  backgroundColor: segment.color,
                  opacity: active != null && active !== index ? 0.35 : 1,
                }}
              />
            ))}
            <span className="h-full min-w-0 flex-1" style={{ backgroundColor: bar.track }} />
          </div>
        </div>
      ) : (
        <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: bar.track }} aria-hidden="true">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, percent)}%`, backgroundColor: bar.color }}
          />
        </div>
      )}
      <div className="mt-1.5 truncate whitespace-nowrap font-mono text-[11px] text-data-grey" aria-hidden="true">
        {picked ? (
          <>
            <span className="text-inkwell">{picked.label}</span> · {formatBytes(picked.bytes)}
            {countedAgo && <span className="text-data-grey/70"> · counted {countedAgo}</span>}
          </>
        ) : (
          <>
            {formatBytes(disk.used_bytes)} used · {formatBytes(disk.available_bytes)} free
          </>
        )}
      </div>
    </>
  );
  const label = `${disk.mount}: ${percent}% in use, ${formatBytes(disk.used_bytes)} used, ${formatBytes(disk.available_bytes)} free`;

  if (!interactive) {
    return (
      <li className="min-w-0" aria-label={label}>
        {content}
      </li>
    );
  }
  return (
    <li className="min-w-0">
      <DetailsPopover
        content={
          <DiskDetails
            host={host}
            disk={disk}
            segments={segments}
            color={bar.color}
            level={level}
            checkedAgo={checkedAgo}
            countedAgo={countedAgo}
            range={range}
          />
        }
        width="w-[370px]"
      >
        <button
          type="button"
          aria-label={`${label}. Show details.`}
          className="-m-2 block w-[calc(100%+1rem)] rounded-xl p-2 text-left transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20 data-[state=open]:bg-paper"
        >
          {content}
        </button>
      </DetailsPopover>
    </li>
  );
}

// One server's disks. With several servers the cards sit side by side on wide
// screens and their disks stack; otherwise the disks share a row.
export default function DiskCard({ host, now, stacked, range }) {
  // The details box needs room beside the card, so phones keep the plain rows.
  const interactive = !useIsMobile();
  const checkedAgo = host.checked_at ? formatAgo(now - host.checked_at) : null;
  const countedAgo = host.usage_checked_at ? formatAgo(now - host.usage_checked_at) : null;
  return (
    <article className="bg-white rounded-2xl border border-border-light p-6">
      <header className="mb-5 flex items-baseline justify-between gap-3">
        <h3 className="font-tight font-semibold text-lg text-inkwell leading-tight">{host.name}</h3>
        {checkedAgo && <span className="whitespace-nowrap font-mono text-xs text-data-grey">checked {checkedAgo}</span>}
      </header>
      {host.disks.length ? (
        <ul className={`grid gap-5 sm:grid-cols-2 sm:gap-6 ${stacked ? 'lg:grid-cols-1 lg:gap-5' : ''}`}>
          {host.disks.map((disk) => (
            <DiskRow
              key={disk.mount}
              host={host.name}
              disk={disk}
              interactive={interactive}
              checkedAgo={checkedAgo}
              countedAgo={countedAgo}
              range={range}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-data-grey">No disk data from this server yet.</p>
      )}
    </article>
  );
}

// The notice at the top of the page while the viewer holds more than the
// cleanup allowance on some disk (see CLEANUP): which disks, how much they
// hold there and the allowance. It grows more urgent with the fullest disk's
// level: the disks' quiet hue and a gentle ask below 85% full, amber and
// "soon" from there, red and "now" from 95%. Each disk's name opens its
// server's storage.
const URGENCY = {
  calm: { color: SERIES.disk.color, role: 'status' },
  warm: { color: LEVEL_SERIES.warm.color, role: 'status' },
  hot: { color: LEVEL_SERIES.hot.color, role: 'alert' },
};
function cleanupUrgency(reminders) {
  const levels = reminders.map(({ disk }) => diskLevel(disk));
  return levels.includes('hot') ? 'hot' : levels.includes('warm') ? 'warm' : 'calm';
}

// Whether a disk the viewer is asked to tidy is more than URGENT_SHARE full,
// the one notice urgent enough to stay at the top of the page as well.
const URGENT_SHARE = 0.8;
export function cleanupIsUrgent(reminders) {
  return reminders.some(({ disk }) => diskShare(disk) > URGENT_SHARE);
}

// The cleanup notice's colour, for the reminder pill that stands in for it.
export function cleanupColor(reminders) {
  return URGENCY[cleanupUrgency(reminders)].color;
}

export function CleanupBanner({ reminders, onOpen }) {
  if (!reminders.length) return null;
  const urgency = cleanupUrgency(reminders);
  const { color, role } = URGENCY[urgency];
  const diskName = ({ host, disk }) => (
    <BannerLink color={color} onClick={onOpen && (() => onOpen(host))}>
      {host} · {disk.mount}
    </BannerLink>
  );
  const percent = ({ disk }) => `${Math.round(diskShare(disk) * 100)}%`;
  const [first] = reminders;
  const single = reminders.length === 1;
  const under = single ? ` to get under ${formatBytes(first.allowance)}` : '';
  return (
    <Banner icon={HardDrive} color={color} role={role} tinted={urgency === 'hot'}>
      <p className={`text-inkwell ${urgency === 'hot' ? 'font-medium' : ''}`}>
        {single ? (
          urgency === 'calm' ? (
            <>
              Your files take {formatBytes(first.bytes)} on {diskName(first)}, which is {percent(first)} full.
            </>
          ) : (
            <>
              {diskName(first)} is {urgency === 'hot' ? 'almost full' : 'getting full'} ({percent(first)}), and your
              files there take {formatBytes(first.bytes)}.
            </>
          )
        ) : (
          <>
            {urgency === 'hot'
              ? 'Disks you use are almost full'
              : urgency === 'warm'
                ? 'Disks you use are getting full'
                : 'Your files are over the cleanup allowance on ' + reminders.length + ' disks'}
            :{' '}
            {reminders.map((reminder, index) => (
              <span key={`${reminder.host}${reminder.disk.mount}`}>
                {index > 0 && ', '}
                {diskName(reminder)}{' '}
                <span className="whitespace-nowrap font-normal text-data-grey">
                  ({formatBytes(reminder.bytes)} yours, {percent(reminder)} full)
                </span>
              </span>
            ))}
            .
          </>
        )}
      </p>
      <p className={urgency === 'hot' ? 'text-inkwell/75' : 'text-data-grey'}>
        {urgency === 'hot'
          ? `Please clean up now: jobs writing to ${single ? 'this disk' : 'these disks'} may soon fail. Delete old checkpoints and data you no longer need${under}.`
          : urgency === 'warm'
            ? `Please clean up soon, deleting old checkpoints and data you no longer need${under}.`
            : `Please clear out what you no longer need, such as old checkpoints${single ? `; at this fullness each person is asked to stay under ${formatBytes(first.allowance)}` : ''}.`}
      </p>
    </Banner>
  );
}

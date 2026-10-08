import { useId, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { LEVEL_SERIES, READING_STYLES, SERIES } from './config';
import { BoxFooter, DetailsPopover, GLYPH, Metric, QUIET } from './DetailBoxes';
import { pressurePhrase } from './easterEggs';
import { diskLevel, diskShare, formatAgo, formatBytes } from './format';

// Users holding at least this share of what the disk's users use get their
// own segment, at most MAX_SEGMENTS of them; everyone else shares "Other".
const OWN_SEGMENT_SHARE = 0.05;
const MAX_SEGMENTS = 5;
// One hue per bar, the disk's usual one (or its warning hue when nearly full),
// lighter for each smaller user and lightest for "Other"; hex alpha suffixes.
const SHADES = ['FF', 'D9', 'B8', '99', '80'];
const OTHER_SHADE = '4D';

// A disk's per-user segments. The users were counted up to 2 hours before the
// disk's used space was checked, so their sizes are rescaled to fill exactly
// the used part of the bar; each keeps its counted size for the details.
function segmentsFor(disk, color) {
  const users = disk.users ?? [];
  const counted = users.reduce((total, user) => total + user.bytes, 0);
  if (!counted) return [];
  const own = users.filter((user, index) => index < MAX_SEGMENTS && user.bytes / counted >= OWN_SEGMENT_SHARE);
  const rest = users.slice(own.length);
  // A lone small user keeps their name rather than becoming "Other".
  const shown = rest.length === 1 ? [...own, rest[0]] : own;
  const segments = shown.map((user, index) => ({
    key: user.user,
    label: user.user,
    bytes: user.bytes,
    color: `${color}${SHADES[Math.min(index, SHADES.length - 1)]}`,
  }));
  if (rest.length > 1) {
    segments.push({
      key: 'other',
      label: `Other · ${rest.length} users`,
      bytes: rest.reduce((total, user) => total + user.bytes, 0),
      color: `${color}${OTHER_SHADE}`,
    });
  }
  const share = diskShare(disk);
  return segments.map((segment) => ({ ...segment, share: (share * segment.bytes) / counted }));
}

// An M.2 drive: gold contacts on the left, a screw notch on the right, and a
// storage strip filled with the disk's segments (or one fill without users).
function DriveGlyph({ segments, share, color, width = 112 }) {
  const strip = { x: 9, y: 7, width: 43, height: 8 };
  const pieces = segments.length ? segments : [{ key: 'used', share, color }];
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
      <rect x="4.15" y="1.65" width="54.2" height="18.7" rx="2.5" fill="white" stroke={GLYPH.outline} strokeWidth="1.3" />
      <circle cx="55" cy="11" r="1.5" fill="none" stroke={GLYPH.outline} strokeWidth="1.1" />
      <rect {...strip} rx="1.6" fill={GLYPH.unlit} />
      <clipPath id={clip}>
        <rect {...strip} rx="1.6" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        {pieces.map((piece) => {
          const pieceWidth = Math.max(0, Math.min(1, piece.share)) * strip.width;
          const rect = <rect key={piece.key} x={x} y={strip.y} width={Math.max(0, pieceWidth - 0.5)} height={strip.height} fill={piece.color} />;
          x += pieceWidth;
          return rect;
        })}
      </g>
    </svg>
  );
}

// The box a disk opens on wider screens: the drive and how full it is on the
// left; on the right its size, used and free space, and every user with what
// they hold, in the bar's shades.
function DiskDetails({ host, disk, segments, color, level, checkedAgo, countedAgo }) {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const usable = disk.used_bytes + disk.available_bytes;
  const share = diskShare(disk);
  const users = disk.users ?? [];
  const counted = users.reduce((total, user) => total + user.bytes, 0);
  const swatch = (user) =>
    segments.find((segment) => segment.key === user)?.color ?? segments.find((segment) => segment.key === 'other')?.color;
  return (
    <div className="flex gap-6">
      <div className="flex w-[112px] flex-shrink-0 flex-col items-center justify-center">
        <DriveGlyph segments={segments} share={share} color={color} />
        <span
          className="mt-3 font-tight text-lg font-semibold leading-none tabular-nums text-inkwell"
          style={level ? { color: READING_STYLES[level].color } : undefined}
        >
          {Math.round(share * 100)}%
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-tight text-base font-semibold leading-tight text-inkwell">
          {host} <span className="text-data-grey/60">·</span> {disk.mount}
        </h4>
        <p className="mt-0.5 truncate font-mono text-[11px] text-data-grey">
          {formatBytes(disk.total_bytes)} disk{checkedAgo && ` · checked ${checkedAgo}`}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3.5">
          <Metric label="Used" value={formatBytes(disk.used_bytes)} share={share} series={{ color, track: QUIET.track }} />
          <Metric label="Free" value={formatBytes(disk.available_bytes)} share={disk.available_bytes / usable} series={QUIET} />
        </div>
        {counted > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-baseline justify-between gap-3 font-mono text-[11px] text-data-grey">
              <span>By user</span>
              {countedAgo && <span className="text-data-grey/70">counted {countedAgo}</span>}
            </div>
            {/* About five rows show; the rest scroll, keeping the box short, and the
                last visible row fades to say there is more until the end is reached. */}
            <ul
              onScroll={(event) => {
                const list = event.currentTarget;
                setScrolledToEnd(list.scrollTop + list.clientHeight >= list.scrollHeight - 2);
              }}
              className={`-mr-2 max-h-[6.6rem] space-y-1 overflow-y-auto overscroll-contain pr-2 pb-1 [scrollbar-width:thin] ${
                users.length > 5 && !scrolledToEnd ? '[mask-image:linear-gradient(to_bottom,black_75%,transparent)]' : ''
              }`}
            >
              {users.map((user) => (
                <li
                  key={user.user}
                  className="grid grid-cols-[0.5rem_minmax(0,1fr)_auto_2.25rem] items-center gap-2.5 font-mono text-xs"
                >
                  <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: swatch(user.user) }} aria-hidden="true" />
                  <span className="truncate text-inkwell">{user.user}</span>
                  <span className="tabular-nums text-inkwell">{formatBytes(user.bytes)}</span>
                  <span className="text-right tabular-nums text-data-grey">{Math.round((user.bytes / counted) * 100)}%</span>
                </li>
              ))}
            </ul>
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
function DiskRow({ host, disk, interactive, checkedAgo, countedAgo }) {
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
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, percent)}%`, backgroundColor: bar.color }} />
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
          />
        }
        width="w-[480px]"
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
export default function DiskCard({ host, now, stacked }) {
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
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-data-grey">No disk data from this server yet.</p>
      )}
    </article>
  );
}

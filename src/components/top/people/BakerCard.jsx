import { Component, useState } from 'react';
import { CalendarCheck, Crown, Globe, Heart, Layers, Leaf, Moon, Sprout, Sun, TreePalm } from 'lucide-react';
import { DetailsPopover } from '../shared/DetailBoxes';
import { bakerLine, bakerTitle } from '../shared/easterEggs';
import { formatDate, formatHours, userColor } from '../shared/format';

// Warm bakery tones, as in the milestone box.
const CRUST = '#B7792B';
const BUTTER = '#F6DFAE';
const DAY = 86400;

const TRAIT_ICONS = {
  holiday: TreePalm,
  fresh: Sprout,
  batch: Layers,
  weekend: Sun,
  night: Moon,
  loyal: Heart,
  globetrotter: Globe,
  daily: CalendarCheck,
  steady: Leaf,
};

// The titles someone has earned, the most telling first, from their recent
// habits: when they bake (against the 25% of hours that fall at night and the
// 29% at weekends anyway), how many GPUs at once, which servers and how often.
// Everyone gets at least one.
export function bakerTraits(profile, now) {
  const recent = profile?.recent;
  if (!recent) return ['holiday'];
  const traits = [];
  const [favourite] = recent.hosts;
  if (profile.since && now - profile.since < 14 * DAY) traits.push('fresh');
  if (recent.peak_gpus >= 16) traits.push('batch');
  if (recent.weekend_share >= 0.38) traits.push('weekend');
  if (recent.night_share >= 0.33) traits.push('night');
  if (favourite?.share >= 0.9) traits.push('loyal');
  else if (recent.hosts.filter((host) => host.share >= 0.1).length >= 3) traits.push('globetrotter');
  // Days with GPU time, out of the days they could have had any.
  const span = Math.min(recent.days, Math.max(1, Math.ceil((now - (profile.since ?? now)) / DAY)));
  if (span >= 7 && recent.active_days / span >= 0.75) traits.push('daily');
  return traits.length ? traits : ['steady'];
}

// The period's top three bake in the lab's own pastries and wear a crown in
// their metal; everyone else has a number.
const PODIUM = [
  { name: 'Golden croissant', color: '#B08A2E', fill: '#F3DC8E', background: '#FBF5E4', border: '#EBDDB0' },
  { name: 'Silver brezel', color: '#7D8794', fill: '#DDE2E8', background: '#F4F6F8', border: '#DCE1E7' },
  { name: 'Bronze toast', color: '#A26A3F', fill: '#EBC6A6', background: '#FAF1EA', border: '#EBD3C1' },
];

// A crown for the top three, or nothing below them.
function PodiumCrown({ rank, className = 'h-3.5 w-3.5' }) {
  const place = PODIUM[rank - 1];
  if (!place) return null;
  return (
    <Crown
      className={className}
      strokeWidth={2}
      style={{ color: place.color, fill: place.fill }}
      aria-label={`#${rank} ${place.name}`}
    >
      <title>{`#${rank} ${place.name}`}</title>
    </Crown>
  );
}

function RankMark({ rank }) {
  const place = PODIUM[rank - 1];
  if (!place) return <span className="whitespace-nowrap font-mono text-[11px] text-data-grey/80">#{rank}</span>;
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium"
      style={{ color: place.color, backgroundColor: place.background, borderColor: place.border }}
      title={`#${rank} in this period`}
    >
      {/* Raised a pixel to centre on the capitals, not the line box. */}
      <PodiumCrown rank={rank} className="h-3 w-3 -translate-y-px" />#{rank} {place.name}
    </span>
  );
}

function formatShare(share) {
  return share > 0 && share < 0.01 ? '< 1%' : `${Math.round(share * 100)}%`;
}

function formatGpus(value) {
  const text = formatHours(value);
  return `${text} ${text === '1' ? 'GPU' : 'GPUs'}`;
}

const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
const weekdayClock = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short' });
const dayDate = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const month = new Intl.DateTimeFormat('en-GB', { month: 'short' });
const at = (format, time) => format.format(time * 1000);

// How each period's chart names a step on hover, and its axis times.
const PERIOD_LABELS = {
  '1h': { step: (time, step) => `${at(clock, time)}–${at(clock, time + step)}`, tick: (time) => at(clock, time) },
  '24h': { step: (time, step) => `${at(clock, time)}–${at(clock, time + step)}`, tick: (time) => at(clock, time) },
  '7d': {
    step: (time, step) => `${at(weekdayClock, time)}–${at(clock, time + step)}`,
    tick: (time) => at(weekday, time),
  },
  '30d': { step: (time) => at(dayDate, time), tick: (time) => at(date, time) },
  '90d': { step: (time) => at(dayDate, time), tick: (time) => at(date, time) },
  '365d': { step: (time) => `Week of ${at(date, time)}`, tick: (time) => at(month, time) },
};

// Their GPUs in use over the period being viewed, on an axis up to their
// busiest step (rounded up to whole GPUs) so a light period still shows its
// shape, with times along the bottom. Moving over it marks a step and shows
// its time and GPUs in use in a little label above.
function PeriodChart({ series, range, title, user }) {
  const [active, setActive] = useState(null);
  const values = series.values;
  const peak = Math.max(...values);
  const labels = PERIOD_LABELS[range] ?? PERIOD_LABELS['24h'];
  const width = 280;
  const axis = 24;
  const top = 4;
  const bottom = 46;
  const height = 60;
  const max = peak <= 1 ? 1 : Math.ceil(peak);
  const step = (width - axis) / Math.max(1, values.length - 1);
  const x = (index) => axis + index * step;
  const y = (value) => bottom - (value / max) * (bottom - top);
  const line = values.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
  const timeAt = (index) => series.start + index * series.step;
  // Times at the inner quarters only, so none is cut off at an edge.
  const ticks = [1, 2, 3].map((quarter) => Math.round(((values.length - 1) * quarter) / 4));
  // The hover label sits above the point, or below it near the top so it never covers the title.
  const below = active != null && y(values[active]) < 24;
  return (
    <div className="mt-4 border-t border-border-light pt-3">
      <div className="mb-1 flex items-baseline justify-between gap-3 font-mono text-[11px] text-data-grey">
        <span>{title}</span>
        <span className="text-data-grey/70">GPUs in use</span>
      </div>
      {peak > 0 ? (
        <div className="relative">
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`${user}'s GPUs in use, ${title.toLowerCase()}: up to ${formatGpus(peak)}`}
            className="block"
            onPointerMove={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              const index = Math.round((event.clientX - box.left - axis) / step);
              setActive(Math.min(values.length - 1, Math.max(0, index)));
            }}
            onPointerLeave={() => setActive(null)}
          >
            {[0, max / 2, max].map((tick) => (
              <g key={tick}>
                <line
                  x1={axis}
                  x2={width}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="#E2E8F0"
                  strokeDasharray={tick ? '3 3' : undefined}
                />
                <text
                  x={axis - 5}
                  y={y(tick)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-data-grey/70 font-mono text-[9px]"
                >
                  {formatHours(tick)}
                </text>
              </g>
            ))}
            {ticks.map((index) => (
              <text
                key={index}
                x={x(index)}
                y={height - 2}
                textAnchor="middle"
                className="fill-data-grey/70 font-mono text-[9px]"
              >
                {labels.tick(timeAt(index))}
              </text>
            ))}
            <polygon points={`${axis},${bottom} ${line} ${width},${bottom}`} fill={CRUST} opacity="0.07" />
            <polyline points={line} fill="none" stroke={CRUST} strokeWidth="1.2" strokeLinejoin="round" />
            {active != null && (
              <g>
                <line x1={x(active)} x2={x(active)} y1={top} y2={bottom} stroke="#CBD5E1" strokeWidth="1" />
                <circle cx={x(active)} cy={y(values[active])} r="2.5" fill={CRUST} />
              </g>
            )}
          </svg>
          {active != null && (
            <span
              className={`pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-border-light bg-white px-1.5 py-0.5 font-mono text-[10px] text-inkwell shadow-sm ${
                below ? '' : '-translate-y-full'
              }`}
              style={{
                left: Math.min(width - 74, Math.max(74, x(active))),
                top: below ? y(values[active]) + 6 : y(values[active]) - 6,
              }}
            >
              <span className="text-data-grey">{labels.step(timeAt(active), series.step)} · </span>
              {formatGpus(values[active])}
            </span>
          )}
        </div>
      ) : (
        <p className="py-2 font-mono text-[11px] text-data-grey/70">Nothing in the oven in this period.</p>
      )}
    </div>
  );
}

function Fact({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 font-mono text-[11px]">
      <span className="text-data-grey">{label}</span>
      <span className="truncate text-right tabular-nums text-inkwell">{children}</span>
    </div>
  );
}

// A person's baker card: their earned titles with a line for the first, their
// last week, and a few facts about how they bake.
function BakerCardContent({ user, profile, rank, range, rangeTitle, share, who }) {
  const now = Date.now() / 1000;
  const traits = bakerTraits(profile, now);
  const [main, ...more] = traits;
  const MainIcon = TRAIT_ICONS[main];
  const recent = profile?.recent;
  const favourite = recent?.hosts[0];
  const peak = recent ? Math.round(recent.peak_gpus) : 0;
  const series = profile?.series?.[range];
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 font-mono text-sm text-inkwell">
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: userColor(user.username) }}
            aria-hidden="true"
          />
          <span className="truncate">{user.username}</span>
        </span>
        <RankMark rank={rank} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: '#FDF8EF', border: '1px solid #F1DFBD' }}
          aria-hidden="true"
        >
          <MainIcon className="h-3.5 w-3.5" strokeWidth={2.2} style={{ color: CRUST, fill: BUTTER }} />
        </span>
        <h4 className="font-tight text-lg font-semibold leading-tight" style={{ color: CRUST }}>
          {bakerTitle(main)}
        </h4>
      </div>
      <p className="mt-1.5 text-xs italic leading-relaxed text-data-grey">
        {bakerLine(main, user.username, { host: favourite?.name, peak })}
      </p>
      {more.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {more.slice(0, 3).map((trait) => {
            const Icon = TRAIT_ICONS[trait];
            return (
              <span
                key={trait}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]"
                style={{ color: CRUST, backgroundColor: '#FDF8EF', borderColor: '#F1DFBD' }}
              >
                <Icon className="h-3 w-3 -translate-y-px" strokeWidth={2.2} aria-hidden="true" />
                {bakerTitle(trait)}
              </span>
            );
          })}
        </div>
      )}

      {series && <PeriodChart series={series} range={range} title={rangeTitle} user={user.username} />}

      <div className="mt-3 space-y-1.5 border-t border-border-light pt-3">
        {favourite && (
          <Fact label="Favourite oven">
            {favourite.name} · {Math.round(favourite.share * 100)}%
          </Fact>
        )}
        {recent && <Fact label="Biggest batch">{peak <= 1 ? '1 GPU' : `${peak} GPUs at once`}</Fact>}
        {share != null && (
          <Fact label={rangeTitle}>
            {formatHours(user.gpu_hours)} h · {formatShare(share)} of {who === 'The lab' ? 'the lab' : who}
          </Fact>
        )}
        {profile?.lifetime_gpu_hours != null && (
          <Fact label="All time">
            {Math.round(profile.lifetime_gpu_hours).toLocaleString('en-US')} h since {formatDate(profile.since)}
          </Fact>
        )}
      </div>
    </div>
  );
}

// Keeps a card that cannot be drawn, say from data the page does not expect
// yet, from taking the whole page down with it.
class CardGuard extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <p className="text-xs text-data-grey">This baker card could not be shown. Please reload the page.</p>;
    }
    return this.props.children;
  }
}

// The user's name in the ranking, which opens their baker card on a click or a
// long hover; on hover a soft underline draws in, like the server names.
export default function BakerName({ user, profile, rank, range, rangeTitle, share, who }) {
  return (
    <DetailsPopover
      width="w-80"
      content={
        <CardGuard>
          <BakerCardContent
            user={user}
            profile={profile}
            rank={rank}
            range={range}
            rangeTitle={rangeTitle}
            share={share}
            who={who}
          />
        </CardGuard>
      }
    >
      <button
        type="button"
        aria-label={`${user.username}'s baker card`}
        className="max-w-full truncate rounded-sm bg-[linear-gradient(#CBD5E1,#CBD5E1)] bg-[length:0%_2px] bg-[position:0_100%] bg-no-repeat pb-0.5 text-left transition-[background-size] duration-300 ease-out hover:bg-[length:100%_2px] focus-visible:bg-[length:100%_2px] focus-visible:outline-none data-[state=open]:bg-[length:100%_2px]"
      >
        {user.username}
      </button>
    </DetailsPopover>
  );
}

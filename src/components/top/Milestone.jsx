import { Cake, Croissant, Crown, Orbit, Wheat } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CLOUD_SGD_PER_GPU_HOUR, MILESTONES, PASTRIES } from './config';
import { ScrollList } from './controls';
import { pastryPilePhrase } from './easterEggs';
import { formatDate, formatSgd } from './format';

// Warm bakery tones for the badge and its box.
const CRUST = '#B7792B';
const BUTTER = '#F6DFAE';
const FLOUR = '#E7EAF0';
const PILE_ROWS = 5;
const PILE_SIZE = (PILE_ROWS * (PILE_ROWS + 1)) / 2;

// The badge's total, short and without trailing zeros: 1,234, 10.3k, 250k, 1.25M.
function compact(hours) {
  if (hours >= 1000000) return `${Number((hours / 1000000).toFixed(2))}M`;
  if (hours >= 100000) return `${Math.round(hours / 1000)}k`;
  return hours >= 10000 ? `${Number((hours / 1000).toFixed(1))}k` : Math.round(hours).toLocaleString('en-US');
}

// A milestone's round number of hours: 2.5k, 10k, 1M.
function short(hours) {
  if (hours >= 1000000) return `${hours / 1000000}M`;
  return hours >= 1000 ? `${hours / 1000}k` : String(hours);
}

// A GPU model's name on one line: "NVIDIA RTX PRO 6000 Blackwell Server
// Edition" becomes "RTX PRO 6000 Blackwell Server".
function shortModel(name) {
  return name.replace(/^NVIDIA\s+/, '').replace(/\s+Edition$/, '');
}

// A croissant's rank in the pile, with the hours it took: "Head baker · 10k hours".
function rankLabel({ rank, hours }) {
  return `${rank} · ${hours ? `${short(hours)} hours` : 'from the start'}`;
}

// The emblem grows grander every three ranks: wheat, a croissant, a cake, a
// planet in orbit and, at the top, a crown.
const EMBLEMS = [Wheat, Croissant, Cake, Orbit, Crown];

function emblemFor(milestone) {
  return EMBLEMS[Math.min(EMBLEMS.length - 1, Math.floor(MILESTONES.indexOf(milestone) / 3))];
}

// The badge's emblem: a croissant in a ring that fills toward the next milestone.
function Emblem({ progress, icon: Icon }) {
  const radius = 9.5;
  const circumference = 2 * Math.PI * radius;
  return (
    <span className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center" aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24" className="absolute inset-0">
        <circle cx="12" cy="12" r="11.5" fill="#FFF9EE" />
        <circle cx="12" cy="12" r={radius} fill="none" stroke="#F1DFBD" strokeWidth="2" />
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke={CRUST}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${Math.max(0.02, progress) * circumference} ${circumference}`}
          transform="rotate(-90 12 12)"
        />
      </svg>
      <Icon className="relative h-3 w-3" strokeWidth={2.2} style={{ color: CRUST, fill: BUTTER }} />
    </span>
  );
}

function milestoneFor(hours) {
  const index = MILESTONES.findLastIndex((milestone) => hours >= milestone.hours);
  const current = MILESTONES[Math.max(0, index)];
  const next = MILESTONES[index + 1] ?? null;
  // The share of the way from nothing to the next milestone, for the bar and ring.
  const progress = next ? hours / next.hours : 1;
  // Ranks reached so far, counting the first.
  const reached = Math.max(0, index) + 1;
  return { current, next, progress, reached };
}

// A bubble's first line: the rank's emblem, then the rank and its hours.
function RankLine({ milestone }) {
  const Icon = emblemFor(milestone);
  return (
    <span className="flex items-center justify-center gap-1 font-medium" style={{ color: CRUST }}>
      <Icon className="h-3 w-3 flex-shrink-0" strokeWidth={2.2} style={{ fill: BUTTER }} />
      {rankLabel(milestone)}
    </span>
  );
}

// A mountain of pastries: a pyramid of croissants, one per rank, baked from
// the bottom row up as the lab reaches each rank. On hover a baked croissant
// names its rank, with a little line.
function PastryMountain({ reached }) {
  let filled = Math.min(reached, PILE_SIZE);
  // Bottom row first: the pile grows from its base.
  const rows = Array.from({ length: PILE_ROWS }, (_, row) => PILE_ROWS - row).map((count) => {
    const baked = Math.min(count, filled);
    filled -= baked;
    return { count, baked };
  });
  // Each row's first croissant's place in baking order, bottom row first.
  const starts = rows.map((_, row) => rows.slice(0, row).reduce((total, { count }) => total + count, 0));
  return (
    <div className="flex flex-col-reverse items-center gap-0.5" aria-hidden="true">
      {rows.map(({ count, baked }, row) => (
        <div key={row} className="flex gap-0.5">
          {Array.from({ length: count }, (_, index) =>
            index < baked ? (
              // A baked croissant lifts and glows on hover, with its rank and a line above it.
              <span key={index} className="group/pastry relative">
                <Croissant
                  className="h-6 w-6 transition-transform duration-200 group-hover/pastry:-translate-y-0.5 group-hover/pastry:scale-125 group-hover/pastry:drop-shadow-[0_1px_3px_rgba(183,121,43,0.45)]"
                  strokeWidth={1.6}
                  style={{ color: CRUST, fill: BUTTER }}
                />
                <span
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-center font-tight text-[11px] text-inkwell opacity-0 shadow-sm transition-opacity duration-200 group-hover/pastry:opacity-100"
                  style={{ backgroundColor: '#FFFBF4', borderColor: '#F1DFBD' }}
                >
                  <RankLine milestone={MILESTONES[starts[row] + index]} />
                  {pastryPilePhrase(starts[row] + index)}
                </span>
              </span>
            ) : (
              <Croissant key={index} className="h-6 w-6" strokeWidth={1.6} style={{ color: FLOUR }} />
            ),
          )}
        </div>
      ))}
    </div>
  );
}

// The badge on the "GPU time by user" title row: a slim pill of the lab's
// GPU hours ever, its croissant ringed by progress to the next milestone, with
// the rank reached and the total beside it. Its box shows the bakery rank reached, the total since the
// first record and per GPU model, what it would have cost in the cloud, and
// the pastry pile, one croissant per rank reached.
export default function MilestoneBadge({ lifetime }) {
  if (!lifetime?.gpu_hours) return null;
  const hours = lifetime.gpu_hours;
  const { current, next, progress, reached } = milestoneFor(hours);
  const value = hours * CLOUD_SGD_PER_GPU_HOUR;
  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border py-0.5 pl-0.5 pr-2.5 text-xs transition-colors hover:bg-[#FBF1DE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20 data-[state=open]:bg-[#FBF1DE]"
        style={{ backgroundColor: '#FDF8EF', borderColor: '#F1DFBD' }}
        aria-label={`Lab milestone: ${current.rank}, ${compact(hours)} GPU hours in all. Show details.`}
      >
        <Emblem progress={next ? progress : 1} icon={emblemFor(current)} />
        <span className="font-medium" style={{ color: CRUST }}>
          {current.rank}
        </span>
        <span className="tabular-nums text-data-grey">· {compact(hours)} GPU hours</span>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        className="flex max-h-[var(--radix-popover-content-available-height)] w-96 flex-col rounded-2xl border-border-light bg-white p-5 shadow-xl"
      >
        <div className="flex-shrink-0 text-center">
          <PastryMountain reached={reached} />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-data-grey/70">Lab milestone</p>
          <h4 className="mt-0.5 font-tight text-lg font-semibold leading-tight" style={{ color: CRUST }}>
            {current.rank}
          </h4>
          <p className="mt-1 font-tight text-2xl font-semibold tabular-nums text-inkwell">
            {Math.round(hours).toLocaleString('en-US')}{' '}
            <span className="text-base font-medium text-data-grey">GPU hours</span>
          </p>
          {lifetime.since && <p className="font-mono text-[11px] text-data-grey">since {formatDate(lifetime.since)}</p>}
        </div>

        {/* On a short screen the rest scrolls under the pile, which stays put so its
            hover lines are never clipped. */}
        <div className="-mr-2 min-h-0 overflow-y-auto overscroll-contain pr-2 [scrollbar-width:thin]">
          {lifetime.models.length > 0 && (
            <ul className="mt-4 space-y-1 border-t border-border-light pt-3">
              {lifetime.models.map((model) => (
                <li key={model.model} className="flex items-baseline justify-between gap-3 font-mono text-[11px]">
                  <span className="min-w-0 truncate text-data-grey" title={model.model}>
                    {shortModel(model.model)}
                  </span>
                  <span className="whitespace-nowrap tabular-nums text-inkwell">
                    {Math.round(model.gpu_hours).toLocaleString('en-US')} h
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-xs leading-relaxed text-data-grey">
            In the cloud, that would be <span className="font-medium text-inkwell">≈ {formatSgd(value)}</span>. That is
            about{' '}
            {PASTRIES.map((pastry, index) => (
              <span key={pastry.name}>
                {index === PASTRIES.length - 1 ? 'or ' : ''}
                <span className="font-medium text-inkwell">
                  {Math.round(value / pastry.sgd).toLocaleString('en-US')}
                </span>{' '}
                {pastry.name}
                {index < PASTRIES.length - 1 ? ', ' : '.'}
              </span>
            ))}
          </p>

          {next && (
            <div className="mt-3">
              {/* From nothing to the next milestone, with a sliver showing even at the very start. */}
              <div className="flex items-center gap-2 font-mono text-[10px] tabular-nums text-data-grey/70">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: '#F6EEDD' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `max(${progress * 100}%, 0.5rem)`, backgroundColor: CRUST }}
                  />
                </div>
                <span>{short(next.hours)}</span>
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-data-grey">
                {Math.ceil(next.hours - hours).toLocaleString('en-US')} h to{' '}
                <span style={{ color: CRUST }}>{next.rank}</span>
              </p>
            </div>
          )}
          <div className="mt-3 border-t border-border-light pt-3">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-data-grey/70">
              Milestones reached
            </p>
            {/* Newest first, the current rank in crust; about three show and the rest scroll. */}
            <ScrollList count={reached} visible={3} rowRem={1.5}>
              {MILESTONES.slice(0, reached)
                .reverse()
                .map((milestone, index) => {
                  const MilestoneIcon = emblemFor(milestone);
                  return (
                    <li key={milestone.rank} className="flex h-6 items-center gap-2 text-xs">
                      <MilestoneIcon
                        className="h-3.5 w-3.5 flex-shrink-0"
                        strokeWidth={1.8}
                        style={{ color: CRUST, fill: BUTTER }}
                        aria-hidden="true"
                      />
                      <span
                        className={`min-w-0 flex-1 truncate font-tight ${index === 0 ? 'font-medium' : 'text-data-grey'}`}
                        style={index === 0 ? { color: CRUST } : undefined}
                      >
                        {milestone.rank}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-data-grey/80">
                        {milestone.hours ? `${short(milestone.hours)} hours` : 'the start'}
                      </span>
                    </li>
                  );
                })}
            </ScrollList>
          </div>
          <p className="mt-3 border-t border-border-light pt-3 font-mono text-[11px] italic text-data-grey/80">
            {current.line}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

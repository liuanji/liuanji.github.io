import { Croissant } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CLOUD_SGD_PER_GPU_HOUR, CROISSANT_SGD, MILESTONES } from './config';
import { formatDate, formatSgd } from './format';

// Warm bakery tones for the badge and its box.
const CRUST = '#B7792B';
const BUTTER = '#F6DFAE';
const FLOUR = '#E7EAF0';
const PILE_ROWS = 5;
const PILE_SIZE = (PILE_ROWS * (PILE_ROWS + 1)) / 2;

function compact(hours) {
  if (hours >= 1000000) return `${(hours / 1000000).toFixed(2)}M`;
  return hours >= 10000 ? `${(hours / 1000).toFixed(1)}k` : Math.round(hours).toLocaleString('en-US');
}

// The badge's emblem: a croissant in a ring that fills toward the next milestone.
function Emblem({ progress }) {
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
      <Croissant className="relative h-3 w-3" strokeWidth={2.2} style={{ color: CRUST, fill: BUTTER }} />
    </span>
  );
}

function milestoneFor(hours) {
  const index = MILESTONES.findLastIndex((milestone) => hours >= milestone.hours);
  const current = MILESTONES[Math.max(0, index)];
  const next = MILESTONES[index + 1] ?? null;
  const progress = next ? (hours - current.hours) / (next.hours - current.hours) : 1;
  return { current, next, progress };
}

// A mountain of pastries: a pyramid of croissants, filled from the bottom row
// up as the lab bakes its way to the next milestone, and full once it is there.
function PastryMountain({ progress }) {
  let filled = Math.floor(progress * PILE_SIZE);
  // Bottom row first: the pile grows from its base.
  const rows = Array.from({ length: PILE_ROWS }, (_, row) => PILE_ROWS - row).map((count) => {
    const baked = Math.min(count, filled);
    filled -= baked;
    return { count, baked };
  });
  return (
    <div className="flex flex-col-reverse items-center gap-0.5" aria-hidden="true">
      {rows.map(({ count, baked }, row) => (
        <div key={row} className="flex gap-0.5">
          {Array.from({ length: count }, (_, index) => (
            <Croissant
              key={index}
              className="h-6 w-6"
              strokeWidth={1.6}
              style={index < baked ? { color: CRUST, fill: BUTTER } : { color: FLOUR }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// The badge on the "GPU time by user" title row: a slim pill of the lab's
// GPU-hours ever, its croissant ringed by progress to the next milestone, with
// the rank reached and the total beside it. Its box shows the bakery rank reached, the total since the
// first record and per GPU model, what it would have cost in the cloud, and
// the pastry pile growing toward the next milestone.
export default function MilestoneBadge({ lifetime }) {
  if (!lifetime?.gpu_hours) return null;
  const hours = lifetime.gpu_hours;
  const { current, next, progress } = milestoneFor(hours);
  const value = hours * CLOUD_SGD_PER_GPU_HOUR;
  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border py-0.5 pl-0.5 pr-2.5 text-xs transition-colors hover:bg-[#FBF1DE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20 data-[state=open]:bg-[#FBF1DE]"
        style={{ backgroundColor: '#FDF8EF', borderColor: '#F1DFBD' }}
        aria-label={`Lab milestone: ${current.rank}, ${compact(hours)} GPU-hours in all. Show details.`}
      >
        <Emblem progress={next ? progress : 1} />
        <span className="font-medium" style={{ color: CRUST }}>
          {current.rank}
        </span>
        <span className="tabular-nums text-data-grey">· {compact(hours)} GPU hours</span>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        className="w-80 rounded-2xl border-border-light bg-white p-5 shadow-xl"
      >
        <div className="text-center">
          <PastryMountain progress={next ? progress : 1} />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-data-grey/70">Lab milestone</p>
          <h4 className="mt-0.5 font-tight text-lg font-semibold leading-tight" style={{ color: CRUST }}>
            {current.rank}
          </h4>
          <p className="mt-1 font-tight text-2xl font-semibold tabular-nums text-inkwell">
            {Math.round(hours).toLocaleString('en-US')}{' '}
            <span className="text-base font-medium text-data-grey">GPU-hours</span>
          </p>
          {lifetime.since && <p className="font-mono text-[11px] text-data-grey">since {formatDate(lifetime.since)}</p>}
        </div>

        {lifetime.models.length > 0 && (
          <ul className="mt-4 space-y-1 border-t border-border-light pt-3">
            {lifetime.models.map((model) => (
              <li key={model.model} className="flex items-baseline justify-between gap-3 font-mono text-[11px]">
                <span className="min-w-0 text-data-grey">{model.model.replace(/^NVIDIA\s+/, '')}</span>
                <span className="whitespace-nowrap tabular-nums text-inkwell">
                  {Math.round(model.gpu_hours).toLocaleString('en-US')} h
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-xs leading-relaxed text-data-grey">
          In the cloud, that would be <span className="font-medium text-inkwell">≈ {formatSgd(value)}</span>, or about{' '}
          <span className="font-medium text-inkwell">{Math.round(value / CROISSANT_SGD).toLocaleString('en-US')}</span>{' '}
          croissants.
        </p>

        {next && (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: '#F6EEDD' }}>
              <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: CRUST }} />
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-data-grey">
              {Math.ceil(next.hours - hours).toLocaleString('en-US')} h to{' '}
              <span style={{ color: CRUST }}>{next.rank}</span>
            </p>
          </div>
        )}
        <p className="mt-3 border-t border-border-light pt-3 font-mono text-[11px] italic text-data-grey/80">
          {current.line}
        </p>
      </PopoverContent>
    </Popover>
  );
}

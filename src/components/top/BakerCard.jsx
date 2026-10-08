import { CalendarCheck, Globe, Heart, Layers, Leaf, Moon, Sprout, Sun, TreePalm } from 'lucide-react';
import { DetailsPopover } from './DetailBoxes';
import { bakerLine, bakerTitle } from './easterEggs';
import { formatDate, formatHours, userColor } from './format';
import { Sparkline } from './Insights';

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
function BakerCardContent({ user, profile, rank, rangeTitle, share, who }) {
  const now = Date.now() / 1000;
  const traits = bakerTraits(profile, now);
  const [main, ...more] = traits;
  const MainIcon = TRAIT_ICONS[main];
  const recent = profile?.recent;
  const favourite = recent?.hosts[0];
  const peak = recent ? Math.round(recent.peak_gpus) : 0;
  const weekPeak = recent ? Math.max(...recent.week) : 0;
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
        <span className="whitespace-nowrap font-mono text-[11px] text-data-grey/80">#{rank}</span>
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
                <Icon className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
                {bakerTitle(trait)}
              </span>
            );
          })}
        </div>
      )}

      {recent && weekPeak > 0 && (
        <div className="mt-4 border-t border-border-light pt-3">
          <div className="mb-1.5 flex items-baseline justify-between gap-3 font-mono text-[11px] text-data-grey">
            <span>Last 7 days</span>
            <span className="text-data-grey/70">up to {formatHours(weekPeak)} GPUs</span>
          </div>
          {/* Scaled to their own busiest three hours, so a light week still shows its shape. */}
          <Sparkline
            values={recent.week.map((value) => (value / weekPeak) * 100)}
            color={CRUST}
            width={280}
            height={36}
            label={`${user.username}'s GPUs in use over the last 7 days`}
          />
        </div>
      )}

      <div className="mt-3 space-y-1.5 border-t border-border-light pt-3">
        {favourite && (
          <Fact label="Favourite oven">
            {favourite.name} · {Math.round(favourite.share * 100)}%
          </Fact>
        )}
        {recent && <Fact label="Biggest batch">{peak <= 1 ? '1 GPU' : `${peak} GPUs at once`}</Fact>}
        {share != null && (
          <Fact label={rangeTitle}>
            {formatHours(user.gpu_hours)} h · {Math.round(share * 100)}% of {who === 'The lab' ? 'the lab' : who}
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

// The user's name in the ranking, which opens their baker card on a click or a
// long hover; on hover a soft underline draws in, like the server names.
export default function BakerName({ user, profile, rank, rangeTitle, share, who }) {
  return (
    <DetailsPopover
      width="w-80"
      content={
        <BakerCardContent user={user} profile={profile} rank={rank} rangeTitle={rangeTitle} share={share} who={who} />
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

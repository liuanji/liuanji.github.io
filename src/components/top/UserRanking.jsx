import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CLOUD_SGD_PER_GPU_HOUR, CROISSANT_SGD, SERIES } from './config';
import { cloudPhrase } from './easterEggs';
import { formatHours, formatSgd } from './format';
import BakerName from './BakerCard';
import MilestoneBadge from './Milestone';

function WeightedHelp() {
  return (
    <Popover>
      <PopoverTrigger className="uppercase tracking-wider underline decoration-dotted underline-offset-2 transition-colors hover:text-inkwell">
        Weighted
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 rounded-xl border-border-light bg-white p-4 text-left text-xs leading-relaxed text-data-grey shadow-lg"
      >
        <p className="font-semibold text-inkwell">Weighted GPU-hours</p>
        <p className="mt-1.5">
          GPU-hours scaled by how busy the GPU was: an hour at 50% compute load counts as 0.5 h. When several users
          share a GPU, its time is split by their share of its memory.
        </p>
      </PopoverContent>
    </Popover>
  );
}

const RANKING_ROWS = 8;

// An easter egg pricing GPU-hours as cloud time: one user's while their row is
// hovered (or tapped), otherwise everyone's shown here.
function cloudEstimate(hours, user, who) {
  const amount = hours * CLOUD_SGD_PER_GPU_HOUR;
  return cloudPhrase({ amount: formatSgd(amount), croissants: Math.round(amount / CROISSANT_SGD), user, who });
}

// lifetime is the lab's all-time GPU time, shown as a milestone badge, and pace
// its GPU hours a day over the range being viewed, for the badge's forecast; bakers
// holds each user's baker card, opened from their name.
export default function UserRanking({
  users,
  range,
  rangeTitle,
  showHosts,
  who = 'The lab',
  lifetime = null,
  pace = null,
  bakers = null,
}) {
  const maxHours = Math.max(0.001, ...users.map((user) => user.gpu_hours));
  const [focused, setFocused] = useState(null);
  // Long rankings show the first RANKING_ROWS until expanded.
  const [expanded, setExpanded] = useState(false);
  const hidden = expanded ? 0 : Math.max(0, users.length - RANKING_ROWS);
  const shown = hidden ? users.slice(0, RANKING_ROWS) : users;
  const focusedUser = users.find((user) => user.username === focused);
  const totalHours = users.reduce((total, user) => total + user.gpu_hours, 0);
  const estimate = focusedUser
    ? cloudEstimate(focusedUser.gpu_hours, focusedUser.username, who)
    : totalHours > 0
      ? cloudEstimate(totalHours, null, who)
      : null;
  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
      {/* The milestone badge sits at the right, centred on the title and subtitle. */}
      <div className="flex items-center justify-between gap-4 border-b border-border-light px-6 pb-4 pt-5">
        <div className="min-w-0">
          <h3 className="font-tight font-semibold text-lg text-inkwell">GPU time by user</h3>
          <p className="mt-0.5 text-xs text-data-grey" aria-live="polite">
            {rangeTitle}
            {estimate && <span className="italic text-data-grey/80"> · {estimate}</span>}
          </p>
        </div>
        <MilestoneBadge lifetime={lifetime} pace={pace} />
      </div>
      {users.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="whitespace-nowrap font-mono text-[11px] uppercase tracking-wider text-data-grey/70">
                {/* Fixed-width blocks keep # and User at their widths beside the spare column. */}
                <th scope="col" className="py-2.5 pl-6 text-left font-normal">
                  <div className="w-6">#</div>
                </th>
                <th scope="col" className="py-2.5 pr-4 text-left font-normal">
                  <div className="sm:w-40">User</div>
                </th>
                <th scope="col" className="py-2.5 pr-6 text-left font-normal">
                  GPU-hours
                </th>
                <th scope="col" className="hidden py-2.5 pr-8 text-left font-normal sm:table-cell">
                  <WeightedHelp />
                </th>
                {/* The last column takes the spare width, so the others sit close together. */}
                {showHosts && (
                  <th scope="col" className="hidden w-full py-2.5 pr-6 text-left font-normal md:table-cell">
                    Servers
                  </th>
                )}
                <th className={`w-full p-0 ${showHosts ? 'md:hidden' : ''}`} aria-hidden="true" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light border-t border-border-light">
              {shown.map((user, index) => (
                <tr
                  key={user.username}
                  className="cursor-default transition-colors hover:bg-paper"
                  onPointerEnter={(event) => event.pointerType === 'mouse' && setFocused(user.username)}
                  onPointerLeave={(event) => event.pointerType === 'mouse' && setFocused(null)}
                  onClick={() => setFocused((current) => (current === user.username ? null : user.username))}
                >
                  <td className="py-3 pl-6 font-mono text-xs text-data-grey">
                    <div className="w-6">{index + 1}</div>
                  </td>
                  <td className="py-3 pr-4 font-mono text-sm text-inkwell">
                    <div className="truncate sm:w-40">
                      <BakerName
                        user={user}
                        profile={bakers?.[user.username]}
                        rank={index + 1}
                        range={range}
                        rangeTitle={rangeTitle}
                        share={totalHours > 0 ? user.gpu_hours / totalHours : null}
                        who={who}
                      />
                    </div>
                  </td>
                  <td className="py-3 pr-6">
                    {/* Fixed widths keep every row's track the same length. */}
                    <div className="flex items-center gap-3">
                      <div className="hidden h-2 w-40 flex-shrink-0 sm:block" aria-hidden="true">
                        <div
                          className="h-full rounded-r-[4px]"
                          style={{
                            width: `${Math.max(1, (user.gpu_hours / maxHours) * 100)}%`,
                            backgroundColor: SERIES.compute.color,
                          }}
                        />
                      </div>
                      <span className="w-14 flex-shrink-0 whitespace-nowrap font-mono text-xs tabular-nums text-inkwell">
                        {formatHours(user.gpu_hours)} h
                      </span>
                    </div>
                  </td>
                  <td className="hidden whitespace-nowrap py-3 pr-8 font-mono text-xs tabular-nums text-data-grey sm:table-cell">
                    {formatHours(user.weighted_gpu_hours)} h
                  </td>
                  {showHosts && (
                    <td className="hidden py-3 pr-6 md:table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {user.hosts.map((host) => (
                          <span
                            key={host.name}
                            className="whitespace-nowrap rounded-md border border-border-light bg-paper px-2 py-0.5 font-mono text-xs text-data-grey"
                          >
                            {host.name} <span className="text-inkwell">{formatHours(host.gpu_hours)}h</span>
                          </span>
                        ))}
                      </div>
                    </td>
                  )}
                  <td className={`p-0 ${showHosts ? 'md:hidden' : ''}`} aria-hidden="true" />
                </tr>
              ))}
            </tbody>
          </table>
          {users.length > RANKING_ROWS && (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((current) => !current)}
              className="flex w-full items-center justify-center gap-1.5 border-t border-border-light py-2.5 font-mono text-xs text-data-grey transition-colors hover:bg-paper hover:text-inkwell"
            >
              {expanded ? 'Show fewer' : `Show ${hidden} more ${hidden === 1 ? 'baker' : 'bakers'}`}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      ) : (
        <p className="px-6 py-8 text-sm text-data-grey">No GPU usage recorded in this period.</p>
      )}
    </div>
  );
}

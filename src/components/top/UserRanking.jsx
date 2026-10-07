import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SERIES } from './config';
import { formatHours } from './format';

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

export default function UserRanking({ users, rangeTitle, showHosts }) {
  const maxHours = Math.max(0.001, ...users.map((user) => user.gpu_hours));
  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
      <div className="border-b border-border-light px-6 pb-4 pt-5">
        <h3 className="font-tight font-semibold text-lg text-inkwell">GPU time by user</h3>
        <p className="mt-0.5 text-xs text-data-grey">
          {rangeTitle} · GPU-hours count each GPU a user had a process on
        </p>
      </div>
      {users.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="font-mono text-[11px] uppercase tracking-wider text-data-grey/70">
                <th scope="col" className="w-12 py-2.5 pl-6 text-left font-normal">#</th>
                <th scope="col" className="py-2.5 pr-4 text-left font-normal sm:w-44">User</th>
                <th scope="col" className="py-2.5 pr-4 text-left font-normal">GPU-hours</th>
                <th scope="col" className="hidden py-2.5 pr-4 text-right font-normal sm:table-cell">
                  <WeightedHelp />
                </th>
                {showHosts && (
                  <th scope="col" className="hidden py-2.5 pr-6 text-left font-normal md:table-cell">Servers</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light border-t border-border-light">
              {users.map((user, index) => (
                <tr key={user.username} className="transition-colors hover:bg-paper">
                  <td className="py-3 pl-6 font-mono text-xs text-data-grey">{index + 1}</td>
                  <td className="py-3 pr-4 font-mono text-sm text-inkwell">{user.username}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="hidden h-2 w-full max-w-[14rem] sm:block" aria-hidden="true">
                        <div
                          className="h-full rounded-r-[4px]"
                          style={{
                            width: `${Math.max(1, (user.gpu_hours / maxHours) * 100)}%`,
                            backgroundColor: SERIES.compute.color,
                          }}
                        />
                      </div>
                      <span className="whitespace-nowrap font-mono text-xs tabular-nums text-inkwell">
                        {formatHours(user.gpu_hours)} h
                      </span>
                    </div>
                  </td>
                  <td className="hidden py-3 pr-4 text-right font-mono text-xs tabular-nums text-data-grey sm:table-cell">
                    {formatHours(user.weighted_gpu_hours)} h
                  </td>
                  {showHosts && (
                    <td className="hidden py-3 pr-6 md:table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {user.hosts.map((host) => (
                          <span
                            key={host.name}
                            className="rounded-md border border-border-light bg-paper px-2 py-0.5 font-mono text-xs text-data-grey"
                          >
                            {host.name} <span className="text-inkwell">{formatHours(host.gpu_hours)}h</span>
                          </span>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-6 py-8 text-sm text-data-grey">No GPU usage recorded in this period.</p>
      )}
    </div>
  );
}

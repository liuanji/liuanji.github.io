import { LEVEL_SERIES, READING_STYLES, SERIES } from './config';
import { diskLevel, diskShare, formatAgo, formatBytes } from './format';

function DiskRow({ disk }) {
  const percent = Math.round(diskShare(disk) * 100);
  const level = diskLevel(disk);
  const bar = LEVEL_SERIES[level] ?? SERIES.disk;
  return (
    <li className="min-w-0">
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
      <div
        className="h-2 overflow-hidden rounded-full"
        style={{ backgroundColor: bar.track }}
        role="meter"
        aria-label={`${disk.mount} in use`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, percent)}%`, backgroundColor: bar.color }} />
      </div>
      <div className="mt-1.5 whitespace-nowrap font-mono text-[11px] text-data-grey">
        {formatBytes(disk.used_bytes)} used · {formatBytes(disk.available_bytes)} free
      </div>
    </li>
  );
}

// One server's disks. With several servers the cards sit side by side on wide
// screens and their disks stack; otherwise the disks share a row.
export default function DiskCard({ host, now, stacked }) {
  return (
    <article className="bg-white rounded-2xl border border-border-light p-6">
      <header className="mb-5 flex items-baseline justify-between gap-3">
        <h3 className="font-tight font-semibold text-lg text-inkwell leading-tight">{host.name}</h3>
        {host.checked_at && (
          <span className="whitespace-nowrap font-mono text-xs text-data-grey">
            checked {formatAgo(now - host.checked_at)}
          </span>
        )}
      </header>
      {host.disks.length ? (
        <ul className={`grid gap-5 sm:grid-cols-2 sm:gap-6 ${stacked ? 'lg:grid-cols-1 lg:gap-5' : ''}`}>
          {host.disks.map((disk) => (
            <DiskRow key={disk.mount} disk={disk} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-data-grey">No disk data from this server yet.</p>
      )}
    </article>
  );
}

import { useState } from 'react';
import { HOST_STATUS, UPTIME_STATES } from './config';
import { formatBar, formatBarLength, formatDuration, formatUptime, uptimeState } from './format';

const LEGEND = ['up', 'partial', 'down', 'none'];

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function describeBar(start, barSeconds, checked, down) {
  const when = formatBar(start, barSeconds);
  if (!checked) return `${when} · no data`;
  if (!down) return `${when} · up the whole time`;
  return `${when} · ${formatUptime(checked, down)} up · down ${formatDuration(down)}`;
}

// One server: hover, tap or arrow keys pick a bar, whose details replace the axis
// labels below; a single focusable strip instead of a button per bar.
function UptimeRow({ series, status, uptime, rangeAgo }) {
  const [active, setActive] = useState(null);
  const bars = series.checked.length;
  const checked = sum(series.checked);
  const down = sum(series.down);
  const statusStyle = HOST_STATUS[status] ?? HOST_STATUS.unseen;

  const pick = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    const index = Math.floor(((event.clientX - box.left) / box.width) * bars);
    setActive(Math.min(bars - 1, Math.max(0, index)));
  };
  const onKeyDown = (event) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (event.key === 'Escape') setActive(null);
    if (!step) return;
    event.preventDefault();
    setActive((current) => Math.min(bars - 1, Math.max(0, (current ?? bars) + step)));
  };

  return (
    <div className="px-6 py-5">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2 w-2 flex-shrink-0 translate-y-[-1px] rounded-full"
            style={{ backgroundColor: statusStyle.color }}
            title={statusStyle.label}
            aria-hidden="true"
          />
          <span className="truncate font-tight font-semibold text-inkwell">{series.name}</span>
          <span className="sr-only">{statusStyle.label}</span>
        </div>
        <span className="whitespace-nowrap font-mono text-xs tabular-nums text-data-grey">
          {checked ? (
            <>
              <span className="text-inkwell">{formatUptime(checked, down)}</span> uptime
            </>
          ) : (
            'No data yet'
          )}
        </span>
      </div>
      <div
        role="group"
        tabIndex={0}
        aria-label={`${series.name} availability, ${rangeAgo} to now. Use the arrow keys to read each bar.`}
        onPointerMove={pick}
        onPointerDown={pick}
        onPointerLeave={(event) => event.pointerType === 'mouse' && setActive(null)}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        className={`flex h-8 cursor-crosshair touch-pan-y select-none rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-inkwell/30 focus-visible:ring-offset-2 ${
          bars > 60 ? 'gap-px sm:gap-[2px]' : 'gap-[2px] sm:gap-[3px]'
        }`}
      >
        {series.checked.map((value, index) => {
          const state = uptimeState(value, series.down[index]);
          return (
            <span
              key={index}
              className="flex-1 rounded-[2px] transition-[filter,transform] duration-150"
              style={{
                backgroundColor: UPTIME_STATES[state].color,
                filter: active === index ? 'brightness(0.88)' : undefined,
                transform: active === index ? 'scaleY(1.12)' : undefined,
              }}
            />
          );
        })}
      </div>
      <div className="mt-2 flex h-4 items-center justify-between gap-3 font-mono text-[11px] text-data-grey/70" aria-live="polite">
        {active == null ? (
          <>
            <span>{rangeAgo}</span>
            <span>Now</span>
          </>
        ) : (
          <span className="w-full truncate text-center text-data-grey">
            {describeBar(
              uptime.start + active * uptime.bar_seconds,
              uptime.bar_seconds,
              series.checked[active],
              series.down[active],
            )}
          </span>
        )}
      </div>
    </div>
  );
}

export default function UptimeCard({ uptime, hosts, range }) {
  const statuses = Object.fromEntries(hosts.map((host) => [host.name, host.status]));
  const rows = uptime.hosts.filter((series) => series.name in statuses);
  return (
    <div className="bg-white rounded-2xl border border-border-light">
      <div className="flex flex-col gap-3 border-b border-border-light px-6 pb-4 pt-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-tight font-semibold text-lg text-inkwell">Availability</h3>
          <p className="mt-0.5 text-xs text-data-grey">
            {range.title} · each bar is {formatBarLength(uptime.bar_seconds)}
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {LEGEND.map((key) => (
            <li key={key} className="flex items-center gap-1.5 text-xs text-data-grey">
              <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: UPTIME_STATES[key].color }} aria-hidden="true" />
              {UPTIME_STATES[key].label}
            </li>
          ))}
        </ul>
      </div>
      <div className="divide-y divide-border-light">
        {rows.map((series) => (
          <UptimeRow
            key={series.name}
            series={series}
            status={statuses[series.name]}
            uptime={uptime}
            rangeAgo={range.ago}
          />
        ))}
      </div>
    </div>
  );
}

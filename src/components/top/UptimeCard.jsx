import { useState } from 'react';
import { HOST_STATUS, UPTIME_STATES } from './config';
import { useStoredFlag } from '@/hooks/use-stored-flag';
import { ServerLink, Switch } from './controls';
import {
  formatBar,
  formatBarCount,
  formatBarLength,
  formatDuration,
  formatUptime,
  formatUtcOffset,
  sharesServerDays,
  uptimeState,
} from './format';
import { barPhrase, legendPhrase } from './easterEggs';
import { useLegendHighlight } from './useLegendHighlight';

const LEGEND = ['up', 'partial', 'down', 'none'];

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

// The time, any downtime (so a narrow screen only cuts off the joke), and a line
// from the bar's state's pool.
function describeBar(host, start, barSeconds, utcOffset, checked, down) {
  const when = formatBar(start, barSeconds, utcOffset);
  const state = uptimeState(checked, down);
  const phrase = barPhrase(state, host, start);
  if (state === 'up' || state === 'none') return `${when} · ${phrase}`;
  return `${when} · down ${formatDuration(down)} · ${phrase}`;
}

function countState(series, state) {
  return series.checked.filter((value, index) => uptimeState(value, series.down[index]) === state).length;
}

// Up, partly down and down are shares of the bars the monitor saw; no data is a
// share of every bar.
function legendCount(seriesList, state) {
  const count = seriesList.reduce((total, series) => total + countState(series, state), 0);
  const bars = seriesList.reduce((total, series) => total + series.checked.length, 0);
  const monitored = state !== 'none';
  const of = monitored ? bars - seriesList.reduce((total, series) => total + countState(series, 'none'), 0) : bars;
  return { count, of, adjective: monitored ? 'monitored' : '' };
}

// "brezel: 34 of 36 monitored days up", "brezel: no data for 54 of 90 days",
// then the server's own easter egg.
function RowSummary({ series, state, barSeconds }) {
  const { count, of, adjective } = legendCount([series], state);
  const span = `${count} of ${formatBarCount(of, barSeconds, adjective)}`;
  return (
    <>
      {state === 'none'
        ? `${series.name}: no data for ${span}`
        : `${series.name}: ${span} ${UPTIME_STATES[state].label.toLowerCase()}`}
      <span className="italic text-data-grey/80"> · {legendPhrase(state, count, of, series.name)}</span>
    </>
  );
}

// One server: hover, tap or arrow keys pick a bar, whose details replace the axis
// labels below; a single focusable strip instead of a button per bar. While a
// legend entry is highlighted, bars in other states fade and the row counts its
// bars in that state.
function UptimeRow({ series, status, uptime, rangeAgo, focus, onOpen }) {
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
          {/* Centred on the name's lowercase letters; an online server's dot
              breathes like the status pill's. */}
          <span
            className={`h-2 w-2 flex-shrink-0 translate-y-[0.5px] rounded-full ${
              status === 'online' ? 'motion-safe:animate-breathe' : ''
            }`}
            style={{ backgroundColor: statusStyle.color, color: statusStyle.color }}
            title={statusStyle.label}
            aria-hidden="true"
          />
          <ServerLink name={series.name} onOpen={onOpen} className="truncate font-tight font-semibold text-inkwell" />
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
        className={`flex h-8 cursor-default touch-pan-y select-none rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-inkwell/30 focus-visible:ring-offset-2 ${
          bars > 60 ? 'gap-px sm:gap-[2px]' : 'gap-[2px] sm:gap-[3px]'
        }`}
      >
        {series.checked.map((value, index) => {
          const state = uptimeState(value, series.down[index]);
          return (
            <span
              key={index}
              className="flex-1 rounded-[2px] transition-[filter,transform,opacity] duration-150"
              style={{
                backgroundColor: UPTIME_STATES[state].color,
                filter: active === index ? 'brightness(0.88)' : undefined,
                transform: active === index ? 'scaleY(1.12)' : undefined,
                opacity: focus && state !== focus ? 0.2 : 1,
              }}
            />
          );
        })}
      </div>
      <div
        className="mt-2 flex h-4 items-center justify-between gap-3 font-mono text-[11px] text-data-grey/70"
        aria-live="polite"
      >
        {active == null && focus ? (
          <span className="w-full truncate text-center text-data-grey">
            <RowSummary series={series} state={focus} barSeconds={uptime.bar_seconds} />
          </span>
        ) : active == null ? (
          <>
            <span>{rangeAgo}</span>
            <span>Now</span>
          </>
        ) : (
          <span className="w-full truncate text-center text-data-grey">
            {describeBar(
              series.name,
              uptime.start + active * uptime.bar_seconds,
              uptime.bar_seconds,
              uptime.utc_offset,
              series.checked[active],
              series.down[active],
            )}
          </span>
        )}
      </div>
    </div>
  );
}

// The lab's row when several servers are shown: one bar per period for all of
// them together (green only when every server was up, red only when all were
// down); the card's subtitle gives its uptime. A bar under the mouse or finger, or
// picked with the arrow keys, opens a small box above it with each server's
// own state then and a line about one of them.
const STATE_RANK = { down: 3, partial: 2, none: 1, up: 0 };

function LabRow({ rows, uptime, rangeAgo, focus }) {
  const [active, setActive] = useState(null);
  const bars = rows[0]?.checked.length ?? 0;
  // A bar is up only when every server reporting was up, down only when all of
  // them were down, partly down otherwise, and no data when none reported.
  const states = Array.from({ length: bars }, (_, index) => {
    const each = rows
      .map((series) => uptimeState(series.checked[index], series.down[index]))
      .filter((state) => state !== 'none');
    if (!each.length) return 'none';
    if (each.every((state) => state === 'up')) return 'up';
    return each.every((state) => state === 'down') ? 'down' : 'partial';
  });
  const counted = (state) => states.filter((value) => value === state).length;

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

  // Each server's state in the picked bar, and the one its line is about: the
  // worst off, or any of them when all were up.
  const start = active == null ? 0 : uptime.start + active * uptime.bar_seconds;
  const parts =
    active == null
      ? []
      : rows.map((series) => ({
          name: series.name,
          state: uptimeState(series.checked[active], series.down[active]),
          down: series.down[active],
        }));
  const subject =
    parts.length &&
    [...parts].sort((a, b) => STATE_RANK[b.state] - STATE_RANK[a.state] || a.name.localeCompare(b.name))[0];
  // Bars start on whole periods, so their times would always pick the same
  // server; their positions take turns instead.
  const featured = subject && subject.state === 'up' ? parts[active % parts.length] : subject;
  // The box follows the bar but stays inside the card.
  const left = active == null ? 0 : ((active + 0.5) / bars) * 100;

  return (
    // A little more room above the bars than below the faint axis labels, so
    // the bars look centred in the card.
    <div className="px-6 pb-4 pt-6">
      <div className="relative">
        <div
          role="group"
          tabIndex={0}
          aria-label={`Availability of all servers, ${rangeAgo} to now. Use the arrow keys to read each bar.`}
          onPointerMove={pick}
          onPointerDown={pick}
          onPointerLeave={(event) => event.pointerType === 'mouse' && setActive(null)}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
          className={`flex h-8 cursor-default touch-pan-y select-none rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-inkwell/30 focus-visible:ring-offset-2 ${
            bars > 60 ? 'gap-px sm:gap-[2px]' : 'gap-[2px] sm:gap-[3px]'
          }`}
        >
          {states.map((state, index) => {
            return (
              <span
                key={index}
                className="flex-1 rounded-[2px] transition-[filter,transform,opacity] duration-150"
                style={{
                  backgroundColor: UPTIME_STATES[state].color,
                  filter: active === index ? 'brightness(0.88)' : undefined,
                  transform: active === index ? 'scaleY(1.12)' : undefined,
                  opacity: focus && state !== focus ? 0.2 : 1,
                }}
              />
            );
          })}
        </div>
        {active != null && (
          <div
            className="pointer-events-none absolute bottom-full z-10 mb-2.5 w-60 -translate-x-1/2 rounded-xl border border-border-light bg-white px-3.5 py-3 shadow-lg"
            style={{ left: `clamp(7.5rem, ${left}%, calc(100% - 7.5rem))` }}
            aria-live="polite"
          >
            <p className="font-mono text-[11px] text-data-grey">
              {formatBar(start, uptime.bar_seconds, uptime.utc_offset)}
            </p>
            <ul className="mt-2 space-y-1">
              {parts.map((part) => (
                <li key={part.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-[2px]"
                    style={{ backgroundColor: UPTIME_STATES[part.state].color }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 font-mono text-inkwell">{part.name}</span>
                  <span className="font-mono text-[11px] text-data-grey">
                    {part.state === 'up' || part.state === 'none'
                      ? UPTIME_STATES[part.state].label.toLowerCase()
                      : `down ${formatDuration(part.down)}`}
                  </span>
                </li>
              ))}
            </ul>
            {featured && (
              <p className="mt-2 border-t border-border-light pt-2 text-[11px] italic leading-snug text-data-grey/80">
                {barPhrase(featured.state, featured.name, start)}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="mt-2 flex h-4 items-center justify-between gap-3 font-mono text-[11px] text-data-grey/70">
        {focus ? (
          <span className="w-full truncate text-center text-data-grey">
            {(() => {
              const count = counted(focus);
              const of = focus === 'none' ? bars : bars - counted('none');
              const span = `${count} of ${formatBarCount(of, uptime.bar_seconds, focus === 'none' ? '' : 'monitored')}`;
              return (
                <>
                  {focus === 'none'
                    ? `All servers: no data for ${span}`
                    : `All servers: ${span} ${UPTIME_STATES[focus].label.toLowerCase()}`}
                  <span className="italic text-data-grey/80"> · {legendPhrase(focus, count, of, 'lab')}</span>
                </>
              );
            })()}
          </span>
        ) : (
          <>
            <span>{rangeAgo}</span>
            <span>Now</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function UptimeCard({ uptime, hosts, range, onOpen }) {
  const statuses = Object.fromEntries(hosts.map((host) => [host.name, host.status]));
  const rows = uptime.hosts.filter((series) => series.name in statuses);
  // Day and week bars follow the servers' midnight; say so to viewers elsewhere.
  const foreignDays = uptime.bar_seconds >= 86400 && !sharesServerDays(uptime.end, uptime.utc_offset);
  // A highlighted legend entry also swaps the subtitle for its count across
  // every server shown, with an easter egg about it.
  const [focus, legendProps] = useLegendHighlight();
  const summary = focus ? legendCount(rows, focus) : null;
  // Several servers show as one row for the lab unless the viewer asks for a row each.
  const [separate, setSeparate] = useStoredFlag('gpu-status-uptime-separate', false);
  const together = rows.length > 1 && !separate;
  const labChecked = sum(rows.map((series) => sum(series.checked)));
  const labDown = sum(rows.map((series) => sum(series.down)));
  return (
    <div className="bg-white rounded-2xl border border-border-light">
      <div className="flex flex-col gap-3 border-b border-border-light px-6 pb-4 pt-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-tight font-semibold text-lg text-inkwell">Availability</h3>
          <p className="mt-0.5 text-xs text-data-grey" aria-live="polite">
            {focus ? (
              <>
                {UPTIME_STATES[focus].label}: {summary.count} of{' '}
                {formatBarCount(summary.of, uptime.bar_seconds, summary.adjective)}
                {rows.length > 1 && ` across ${rows.length} servers`}
                <span className="italic text-data-grey/80"> · {legendPhrase(focus, summary.count, summary.of)}</span>
              </>
            ) : (
              <>
                {range.title} · each bar is {formatBarLength(uptime.bar_seconds)}
                {foreignDays && `, midnight to midnight ${formatUtcOffset(uptime.utc_offset)}`}
                {together && labChecked > 0 && (
                  <>
                    {' · '}
                    <span className="font-mono tabular-nums text-inkwell">
                      {formatUptime(labChecked, labDown)}
                    </span>{' '}
                    uptime
                  </>
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <ul className="-mx-1.5 flex flex-wrap gap-x-1 gap-y-1">
            {LEGEND.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  {...legendProps(key)}
                  className={`flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs text-data-grey transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20 ${
                    focus && focus !== key ? 'opacity-40' : ''
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-[2px]"
                    style={{ backgroundColor: UPTIME_STATES[key].color }}
                    aria-hidden="true"
                  />
                  {UPTIME_STATES[key].label}
                </button>
              </li>
            ))}
          </ul>
          {rows.length > 1 && <Switch label="By server" checked={separate} onChange={setSeparate} />}
        </div>
      </div>
      {together ? (
        <LabRow rows={rows} uptime={uptime} rangeAgo={range.ago} focus={focus} />
      ) : (
        <div className="divide-y divide-border-light">
          {rows.map((series) => (
            <UptimeRow
              key={series.name}
              series={series}
              status={statuses[series.name]}
              uptime={uptime}
              rangeAgo={range.ago}
              focus={focus}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}

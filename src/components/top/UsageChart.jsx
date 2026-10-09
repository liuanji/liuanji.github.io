import { useId, useMemo, useState } from 'react';
import { Area, ComposedChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TextTabs } from './controls';
import { formatAxisTime, formatFullTime } from './format';

const TICK = { fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' };

// Compute (how many GPUs were in use, against all of them) or memory in use, in
// one colour family. Inside the fade under the GPUs in use, a softer line marks
// how many GPUs' worth were computing, with a denser fade below it: their
// utilization, named as a share where the line ends.
const VIEWS = {
  busy: { label: 'Compute' },
  memory: { label: 'Memory' },
};
const INK = '#475569';

function toChartPoints(points) {
  const rows = points.map((point) => ({
    timestamp: point.timestamp,
    busy: point.gpus_in_use,
    total: point.gpu_count,
    compute: point.utilization,
    memory: point.memory_percent,
    // Utilization: the GPUs' worth computing (the average load over every GPU)
    // as a share of the GPUs in use.
    utilized: point.gpus_in_use
      ? Math.min(1, (((point.utilization ?? 0) / 100) * (point.gpu_count ?? 0)) / point.gpus_in_use)
      : 0,
    // The same as GPUs' worth, for the line drawn inside the fade.
    computing: Math.min(point.gpus_in_use, ((point.utilization ?? 0) / 100) * (point.gpu_count ?? 0)),
  }));
  // The line is gently smoothed, an average over about a 48th of the range on
  // each side, so it shows the shape rather than every spike; the words and the
  // tooltip keep the exact readings.
  const reach = Math.max(1, Math.round(rows.length / 48));
  for (const key of [...Object.keys(VIEWS), 'utilized', 'computing']) {
    rows.forEach((row, index) => {
      const window = rows.slice(Math.max(0, index - reach), index + reach + 1);
      row[`${key}Drawn`] = window.reduce((sum, item) => sum + (item[key] ?? 0), 0) / window.length;
    });
  }
  // Break the line where collection stopped instead of drawing across the gap.
  const spacings = rows
    .slice(1)
    .map((row, index) => row.timestamp - rows[index].timestamp)
    .sort((a, b) => a - b);
  const typical = spacings[Math.floor(spacings.length / 2)];
  if (!typical) return rows;
  return rows.flatMap((row, index) =>
    index && row.timestamp - rows[index - 1].timestamp > typical * 2.5
      ? [
          { timestamp: rows[index - 1].timestamp + typical, busyDrawn: null, computeDrawn: null, memoryDrawn: null },
          row,
        ]
      : [row],
  );
}

function format(view, value, total) {
  return view === 'busy' ? `${Math.round(value)} of ${total}` : `${Math.round(value)}%`;
}

function ChartTooltip({ active = false, payload = [], label = 0, view }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  if (row.busy == null) return null;
  return (
    <div className="rounded-lg border border-border-light bg-white/95 px-2.5 py-1.5 text-xs shadow-sm backdrop-blur">
      <div className="font-mono text-[11px] text-data-grey">{formatFullTime(label)}</div>
      <div className="mt-0.5 text-inkwell">
        {view === 'busy' ? (
          <>
            <span className="font-medium tabular-nums">
              {Math.round(row.busy)} of {row.total}
            </span>{' '}
            GPUs in use
            <span className="text-data-grey"> · {Math.round(row.utilized * 100)}% utilized</span>
          </>
        ) : (
          <>
            <span className="font-medium tabular-nums">{Math.round(row[view])}%</span> of memory in use
          </>
        )}
      </div>
    </div>
  );
}

// A line's name in the right margin, beside where it ends at now, so it never
// sits on a line; nudged up or down to keep the two names apart.
function EndLabel({ viewBox, text, muted = false, nudge = 0 }) {
  if (!viewBox) return null;
  return (
    <text
      x={viewBox.x + 8}
      y={viewBox.y + nudge}
      dy="0.32em"
      textAnchor="start"
      fontSize="10.5"
      fontFamily="JetBrains Mono, monospace"
      fill={muted ? '#94A3B8' : '#475569'}
    >
      {text}
    </text>
  );
}

// servers, when given, is [{ value, label }] for a switch between all servers
// and each one; server is the one shown and onServer picks another. One quantity
// at a time as a quiet line, with what to take from it said in words above:
// the average (and, for GPUs, their utilization), and when it was busiest and
// quietest.
export default function UsageChart({ history, range, servers = null, server = 'all', onServer }) {
  const gradient = useId();
  const points = useMemo(() => toChartPoints(history.points), [history.points]);
  const [view, setView] = useState('busy');
  const color = INK;
  const readings = points.filter((point) => point.busy != null);
  const latest = readings.at(-1);
  const total = Math.max(1, ...readings.map((point) => point.total ?? 0));
  const top = view === 'busy' ? total : 100;
  const busiest = readings.reduce((best, point) => (!best || point[view] > best[view] ? point : best), null);
  const quietest = readings.reduce((best, point) => (!best || point[view] < best[view] ? point : best), null);
  const average = readings.length ? readings.reduce((sum, point) => sum + point[view], 0) / readings.length : 0;
  // The GPUs in use over the range, and how much of them computed.
  const heldHours = readings.reduce((sum, point) => sum + point.busy, 0);
  const utilization = heldHours ? readings.reduce((sum, point) => sum + point.utilized * point.busy, 0) / heldHours : 0;
  const span = history.end - history.start;
  const ticks = [0, 1, 2, 3, 4].map((step) => history.start + (span * step) / 4);
  const when = (timestamp) =>
    range === '1h' || range === '24h' ? formatAxisTime(timestamp, '24h') : formatFullTime(timestamp);
  // The two names at now need about 13px between them; the chart is 200px tall
  // less its axis, so spread them apart when the lines end closer than that.
  const plotHeight = 166;
  const endGap = latest ? ((latest.busyDrawn - latest.computingDrawn) / top) * plotHeight : 99;
  const labelGap = (13 - endGap) / 2;
  const noun = { busy: 'GPUs in use', memory: 'memory in use' }[view];

  const summary = readings.length ? (
    <>
      <span className="text-inkwell">{format(view, average, total)}</span> {noun} on average
      {view === 'busy' && heldHours > 0 && (
        <>
          , <span className="text-inkwell">{Math.round(utilization * 100)}%</span> utilized
        </>
      )}
      {busiest && busiest[view] !== quietest[view] && (
        <>
          {' · busiest '}
          {when(busiest.timestamp)} <span className="text-inkwell">({format(view, busiest[view], busiest.total)})</span>
          {' · quietest '}
          {when(quietest.timestamp)}{' '}
          <span className="text-inkwell">({format(view, quietest[view], quietest.total)})</span>
        </>
      )}
    </>
  ) : (
    'No readings in this period yet'
  );

  return (
    <div className="bg-white rounded-2xl border border-border-light p-6">
      <div className="mb-4 grid gap-y-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-x-6">
        <h3 className="font-tight font-semibold text-lg text-inkwell sm:col-start-1 sm:row-start-1">Usage trend</h3>
        <p className="text-xs leading-6 text-data-grey sm:col-start-1 sm:row-start-2" aria-live="polite">
          {summary}
        </p>
        {servers && (
          <div className="mt-2 sm:col-start-2 sm:row-start-1 sm:mt-0 sm:justify-self-end">
            <TextTabs label="Server shown" options={servers} value={server} onChange={onServer} />
          </div>
        )}
        {/* The quantity shown: a small segmented switch, apart from the server tabs above. */}
        <div
          role="radiogroup"
          aria-label="Shown"
          className={`inline-flex rounded-full border border-border-light p-0.5 sm:col-start-2 sm:row-start-2 sm:justify-self-end ${
            servers ? 'mt-1 justify-self-start sm:mt-0' : 'justify-self-start'
          }`}
        >
          {Object.entries(VIEWS).map(([key, { label }]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={view === key}
              onClick={() => setView(key)}
              className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] transition-colors ${
                view === key ? 'bg-[#F1F5F9] text-inkwell' : 'text-data-grey/70 hover:text-inkwell'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {points.length < 2 ? (
        <p className="py-16 text-center text-sm text-data-grey">Not enough data for this period yet.</p>
      ) : (
        <div className="h-[200px]" role="img" aria-label={`Line chart of ${noun} over time`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 14, right: 92, bottom: 0, left: 0 }}>
              <defs>
                {/* A light wash under the GPUs in use, and a deeper one under the
                    utilized share; both fade towards the bottom. */}
                <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id={`${gradient}-core`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={[history.start, history.end]}
                ticks={ticks}
                tickFormatter={(time) => formatAxisTime(time, range)}
                axisLine={{ stroke: '#EEF2F6' }}
                tickLine={false}
                tick={TICK}
                tickMargin={10}
              />
              <YAxis
                domain={[0, top]}
                ticks={[0, top]}
                tickFormatter={(tick) => (view === 'busy' ? tick : `${tick}%`)}
                axisLine={false}
                tickLine={false}
                tick={TICK}
                width={40}
              />
              {/* All the GPUs (or 100%), as a faint ceiling. */}
              <ReferenceLine y={top} stroke="#E2E8F0" strokeDasharray="3 4" />
              <Tooltip
                content={<ChartTooltip view={view} />}
                cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey={`${view}Drawn`}
                stroke={color}
                strokeWidth={1.5}
                strokeOpacity={0.85}
                fill={`url(#${gradient})`}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 1.5, stroke: '#FFFFFF', fill: color }}
                isAnimationActive={false}
              />
              {/* The utilized share, the GPUs' worth computing, as a softer line
                  inside the fade with a denser fade below it: the rim between it
                  and the line above is the GPUs held but idle. */}
              {view === 'busy' && (
                <Area
                  type="monotone"
                  dataKey="computingDrawn"
                  stroke={color}
                  strokeOpacity={0.5}
                  strokeWidth={1.1}
                  fill={`url(#${gradient}-core)`}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              )}
              {/* Each line named where it ends, at now, instead of a key to match. */}
              {latest && view === 'busy' && (
                <ReferenceDot
                  x={latest.timestamp}
                  y={latest.computingDrawn}
                  r={2.5}
                  fill="#FFFFFF"
                  stroke={color}
                  strokeOpacity={0.6}
                  strokeWidth={1.2}
                  ifOverflow="visible"
                  label={(props) => (
                    <EndLabel
                      {...props}
                      muted
                      nudge={labelGap > 0 ? labelGap : 0}
                      text={`${Math.round(latest.utilized * 100)}% utilized`}
                    />
                  )}
                />
              )}
              {latest && (
                <ReferenceDot
                  x={latest.timestamp}
                  y={latest[`${view}Drawn`]}
                  r={3}
                  fill={color}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                  ifOverflow="visible"
                  label={(props) => (
                    <EndLabel
                      {...props}
                      nudge={view === 'busy' && labelGap > 0 ? -labelGap : 0}
                      text={view === 'busy' ? `${Math.round(latest.busy)} in use` : `${Math.round(latest[view])}% now`}
                    />
                  )}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

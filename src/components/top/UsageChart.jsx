import { useId, useMemo, useState } from 'react';
import { Area, ComposedChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Segmented, TextTabs } from './controls';
import { formatAxisTime, formatFullTime, formatPower } from './format';
import { useMorphedSeries } from './useGrowingShare';

const TICK = { fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' };

// Compute (how many GPUs were in use, against all of them), memory in use or the
// GPUs' total power draw, in one ink blue. Inside the fade under the GPUs in
// use, a softer line in a lighter tone marks how many GPUs' worth were
// computing, with a denser fade below it: their utilization.
const VIEWS = {
  busy: { label: 'Compute' },
  memory: { label: 'Memory' },
  power: { label: 'Power' },
};
const INK = '#3E5BA9';
const INK_SOFT = '#8EA2D8';

function toChartPoints(points) {
  const rows = points.map((point) => ({
    timestamp: point.timestamp,
    busy: point.gpus_in_use,
    total: point.gpu_count,
    compute: point.utilization,
    power: point.power_w,
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
          {
            timestamp: rows[index - 1].timestamp + typical,
            busyDrawn: null,
            computeDrawn: null,
            memoryDrawn: null,
            powerDrawn: null,
          },
          row,
        ]
      : [row],
  );
}

function format(view, value, total) {
  if (view === 'power') return formatPower(value);
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
        ) : view === 'power' ? (
          <>
            <span className="font-medium tabular-nums">{formatPower(row.power)}</span> drawn by the GPUs
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
  const total = Math.max(1, ...readings.map((point) => point.total ?? 0));
  // Power's scale is the most drawn in the range, rounded up to a whole kW.
  const powerTop = Math.max(1000, Math.ceil(Math.max(0, ...readings.map((point) => point.power ?? 0)) / 1000) * 1000);
  const top = view === 'busy' ? total : view === 'power' ? powerTop : 100;
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
  const noun = { busy: 'GPUs in use', memory: 'memory in use', power: 'drawn by the GPUs' }[view];
  // The curves are drawn as shares of the axis's top, so switching views glides
  // each point from its old height to its new one; they rise from the baseline
  // when the chart opens, and the utilized line sinks away outside Compute.
  const mainShown = useMorphedSeries(
    points.map((point) => (point[`${view}Drawn`] == null ? null : point[`${view}Drawn`] / top)),
  );
  const coreShown = useMorphedSeries(
    points.map((point) => (point.computingDrawn == null ? null : view === 'busy' ? point.computingDrawn / top : 0)),
  );
  const drawn = points.map((point, index) => ({ ...point, mainShown: mainShown[index], coreShown: coreShown[index] }));
  const coreVisible = view === 'busy' || coreShown.some((value) => value > 0.002);

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
      {/* The title and its summary as one block on the left; the server tabs
          and the view switch stacked on the right, with room between them. */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h3 className="font-tight font-semibold text-lg text-inkwell">Usage trend</h3>
          <p className="mt-0.5 text-xs text-data-grey" aria-live="polite">
            {summary}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2.5 sm:items-end">
          {servers && <TextTabs label="Server shown" options={servers} value={server} onChange={onServer} />}
          <Segmented
            label="Shown"
            options={Object.entries(VIEWS).map(([key, { label }]) => [key, label])}
            value={view}
            onChange={setView}
          />
        </div>
      </div>

      {points.length < 2 ? (
        <p className="py-16 text-center text-sm text-data-grey">Not enough data for this period yet.</p>
      ) : (
        <div className="h-[200px]" role="img" aria-label={`Line chart of ${noun} over time`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={drawn} margin={{ top: 14, right: 28, bottom: 0, left: 0 }}>
              <defs>
                {/* A light wash under the GPUs in use, and a deeper one under the
                    utilized share; both fade towards the bottom. */}
                <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id={`${gradient}-core`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={INK_SOFT} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={INK_SOFT} stopOpacity={0.06} />
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
                domain={[0, 1]}
                ticks={[0, 1]}
                tickFormatter={(tick) =>
                  view === 'busy' ? tick * top : view === 'power' ? `${(tick * top) / 1000} kW` : `${tick * top}%`
                }
                axisLine={false}
                tickLine={false}
                tick={TICK}
                width={view === 'power' ? 50 : 40}
              />
              {/* All the GPUs (or 100%), as a faint ceiling. */}
              <ReferenceLine y={1} stroke="#E2E8F0" strokeDasharray="3 4" />
              <Tooltip
                content={<ChartTooltip view={view} />}
                cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="mainShown"
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
              {coreVisible && (
                <Area
                  type="monotone"
                  dataKey="coreShown"
                  stroke={INK_SOFT}
                  strokeWidth={1.1}
                  fill={`url(#${gradient}-core)`}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 1.5, stroke: '#FFFFFF', fill: INK_SOFT }}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

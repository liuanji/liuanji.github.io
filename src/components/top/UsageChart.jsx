import { useMemo, useRef, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SERIES } from './config';
import { formatAxisTime, formatFullTime } from './format';

// Drawn back to front, so compute load sits on top.
const SERIES_KEYS = ['busy', 'memory', 'compute'];
const LEGEND_KEYS = ['compute', 'memory', 'busy'];
const TICK = { fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' };
const Y_TICKS = [0, 25, 50, 75, 100];

// Every series is a percentage, so they share one 0-100% axis: GPUs in use is
// shown as the share of GPUs, not a count on a second scale.
function toChartPoints(points) {
  const rows = points.map((point) => ({
    timestamp: point.timestamp,
    compute: point.utilization,
    memory: point.memory_percent,
    busy: point.gpu_count ? (point.gpus_in_use / point.gpu_count) * 100 : 0,
  }));
  // Break the lines where collection stopped instead of drawing across the gap.
  const spacings = rows.slice(1).map((row, index) => row.timestamp - rows[index].timestamp).sort((a, b) => a - b);
  const typical = spacings[Math.floor(spacings.length / 2)];
  if (!typical) return rows;
  return rows.flatMap((row, index) =>
    index && row.timestamp - rows[index - 1].timestamp > typical * 2.5
      ? [{ timestamp: rows[index - 1].timestamp + typical, compute: null, memory: null, busy: null }, row]
      : [row],
  );
}

function SeriesKey({ color }) {
  return <span className="h-0.5 w-3.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />;
}

function ChartTooltip({ active = false, payload = [], label = 0 }) {
  if (!active || !payload?.length) return null;
  const values = Object.fromEntries(payload.map((item) => [item.dataKey, item.value]));
  return (
    <div className="rounded-xl border border-border-light bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
      <div className="mb-1.5 font-mono text-xs text-data-grey">{formatFullTime(label)}</div>
      {LEGEND_KEYS.filter((key) => values[key] != null).map((key) => (
        <div key={key} className="flex items-center gap-2 text-xs leading-6">
          <SeriesKey color={SERIES[key].color} />
          <span className="w-9 font-semibold tabular-nums text-inkwell">{Math.round(values[key])}%</span>
          <span className="text-data-grey">{SERIES[key].label}</span>
        </div>
      ))}
    </div>
  );
}

export default function UsageChart({ history, range }) {
  const points = useMemo(() => toChartPoints(history.points), [history.points]);
  // The series whose legend entry is hovered, focused or tapped: its curve is
  // drawn last (on top) and the others fade back.
  const [highlight, setHighlight] = useState(null);
  // A tap also hovers and focuses the button before its click, so the click
  // decides from what was highlighted when the press began.
  const highlightedAtPress = useRef(undefined);
  const toggle = (key) => {
    const wasOn = highlightedAtPress.current === undefined ? highlight === key : highlightedAtPress.current === key;
    highlightedAtPress.current = undefined;
    setHighlight(wasOn ? null : key);
  };
  const drawOrder = highlight ? [...SERIES_KEYS.filter((key) => key !== highlight), highlight] : SERIES_KEYS;
  const latest = [...points].reverse().find((point) => point.compute != null);
  const span = history.end - history.start;
  const ticks = [0, 1, 2, 3, 4].map((step) => history.start + (span * step) / 4);

  return (
    <div className="bg-white rounded-2xl border border-border-light p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-tight font-semibold text-lg text-inkwell">Usage trend</h3>
          <p className="mt-0.5 text-xs text-data-grey">Share of GPUs, compute and memory in use</p>
        </div>
        <ul className="-mx-1.5 flex flex-wrap gap-x-2 gap-y-1">
          {LEGEND_KEYS.map((key) => (
            <li key={key}>
              <button
                type="button"
                aria-pressed={highlight === key}
                onPointerEnter={(event) => event.pointerType === 'mouse' && setHighlight(key)}
                onPointerLeave={(event) => event.pointerType === 'mouse' && setHighlight(null)}
                onPointerDown={(event) => {
                  // A mouse already highlights on hover, so its click keeps the highlight.
                  highlightedAtPress.current = event.pointerType === 'mouse' ? null : highlight;
                }}
                onFocus={() => setHighlight(key)}
                onBlur={() => setHighlight(null)}
                onClick={() => toggle(key)}
                className={`flex items-center gap-2 rounded-md px-1.5 py-0.5 text-xs text-data-grey transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20 ${
                  highlight && highlight !== key ? 'opacity-40' : ''
                }`}
              >
                <SeriesKey color={SERIES[key].color} />
                {SERIES[key].label}
                {latest && <span className="font-medium tabular-nums text-inkwell">{Math.round(latest[key])}%</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {points.length < 2 ? (
        <p className="py-16 text-center text-sm text-data-grey">Not enough data for this period yet.</p>
      ) : (
        <div className="h-[300px]" role="img" aria-label="Line chart of GPUs in use, compute load and memory over time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 28, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={[history.start, history.end]}
                ticks={ticks}
                tickFormatter={(value) => formatAxisTime(value, range)}
                axisLine={false}
                tickLine={false}
                tick={TICK}
                tickMargin={10}
              />
              <YAxis
                domain={[0, 100]}
                ticks={Y_TICKS}
                tickFormatter={(value) => `${value}%`}
                axisLine={false}
                tickLine={false}
                tick={TICK}
                width={44}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#94A3B8', strokeWidth: 1 }} isAnimationActive={false} />
              {/* Monotone curves pass through every point without overshooting it. */}
              {drawOrder.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={SERIES[key].label}
                  stroke={SERIES[key].color}
                  strokeOpacity={highlight && highlight !== key ? 0.15 : 1}
                  strokeWidth={highlight === key ? 2.5 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#FFFFFF' }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

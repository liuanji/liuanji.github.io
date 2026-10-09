import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SERIES } from './config';
import { BoxTile } from './DetailBoxes';
import { formatAxisTime, formatFullTime, formatPercent, formatPower } from './format';
import { MetricIcon } from './MetricIcons';

// Power's axis tops out at the next whole kW above the highest reading.
function powerTop(rows) {
  return Math.max(1000, Math.ceil((Math.max(...rows.map((row) => row.value)) * 1.05) / 1000) * 1000);
}

// The four period tiles' metrics, read from the same history points as the
// usage trend chart. Power has its own muted hue, apart from the chart's three.
// top is the chart's upper bound; it is drawn with marks at 0, half and top.
export const TREND_METRICS = {
  busy: {
    key: 'busy',
    label: 'GPUs in use',
    color: SERIES.busy.color,
    read: (point) => point.gpus_in_use,
    format: (value) => value.toFixed(1),
    axis: (value) => String(Math.round(value)),
    top: (rows) => Math.max(1, ...rows.map((row) => row.point.gpu_count)),
  },
  compute: {
    key: 'compute',
    label: 'GPU compute',
    color: SERIES.compute.color,
    read: (point) => point.utilization,
    format: formatPercent,
    axis: formatPercent,
    top: () => 100,
  },
  memory: {
    key: 'memory',
    label: 'GPU memory',
    color: SERIES.memory.color,
    read: (point) => point.memory_percent,
    format: formatPercent,
    axis: formatPercent,
    top: () => 100,
  },
  power: {
    key: 'power',
    label: 'GPU power',
    color: '#8B80C9',
    read: (point) => point.power_w,
    format: formatPower,
    axis: (value) => (value ? `${value / 1000} kW` : '0'),
    top: powerTop,
  },
};

// The metric's readings in time order, with a gap wherever collection stopped
// for longer than two and a half of the usual steps, so lines break there.
function trendRows(history, metric) {
  const rows = history.points
    .map((point) => ({ time: point.timestamp, value: metric.read(point), point }))
    .filter((row) => row.value != null);
  const steps = rows
    .slice(1)
    .map((row, index) => row.time - rows[index].time)
    .sort((a, b) => a - b);
  const typical = steps[Math.floor(steps.length / 2)];
  if (!typical) return rows;
  return rows.flatMap((row, index) =>
    index && row.time - rows[index - 1].time > typical * 2.5
      ? [{ time: rows[index - 1].time + typical, value: null, point: null }, row]
      : [row],
  );
}

function TrendTooltip({ active = false, payload = [], metric }) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  const { time, value, point } = payload[0].payload;
  return (
    <div className="rounded-lg border border-border-light bg-white/95 px-2.5 py-1.5 font-mono text-[11px] shadow-md backdrop-blur">
      <div className="text-data-grey">{formatFullTime(time)}</div>
      <div className="text-inkwell">
        {metric.format(value)}
        {metric === TREND_METRICS.busy && point?.gpu_count ? ` of ${point.gpu_count} GPUs` : ''}
      </div>
    </div>
  );
}

function Extreme({ label, row, metric }) {
  return (
    <div className="rounded-lg bg-[#F6F7F9] px-2.5 py-1.5">
      <div className="font-mono text-[10px] text-data-grey">{label}</div>
      <div className="font-mono text-xs tabular-nums text-inkwell">{row ? metric.format(row.value) : '—'}</div>
      <div className="truncate font-mono text-[10px] text-data-grey/80">{row ? formatFullTime(row.time) : ' '}</div>
    </div>
  );
}

// The box a period tile opens: the metric across the period, readable on hover,
// with its average and its highest and lowest points.
function TrendDetails({ metric, rows, history, range, scope, average, share }) {
  const readings = rows.filter((row) => row.value != null);
  const highest = readings.reduce((best, row) => (!best || row.value > best.value ? row : best), null);
  const lowest = readings.reduce((best, row) => (!best || row.value < best.value ? row : best), null);
  const span = history.end - history.start;
  const top = readings.length ? metric.top(readings) : 1;
  return (
    <div>
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${metric.color}1A` }}
          aria-hidden="true"
        >
          <MetricIcon metricKey={metric.key} share={share} color={metric.color} className="h-[18px] w-[18px]" grow />
        </span>
        <div className="min-w-0">
          <h4 className="font-tight text-base font-semibold leading-tight text-inkwell">
            {metric.label} <span className="text-data-grey/60">·</span> {scope}
          </h4>
          <p className="mt-0.5 font-mono text-[11px] text-data-grey">{range.title}</p>
        </div>
      </div>
      <div className="mt-3 h-[150px]" role="img" aria-label={`${metric.label} over the ${range.title.toLowerCase()}`}>
        {readings.length < 2 ? (
          <p className="pt-14 text-center text-xs text-data-grey">Not enough data for this period yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#EEF2F6" />
              <XAxis
                dataKey="time"
                type="number"
                domain={[history.start, history.end]}
                ticks={[history.start, history.start + span / 2, history.end]}
                tickFormatter={(value) => formatAxisTime(value, range.value)}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                tickMargin={6}
              />
              <YAxis
                domain={[0, top]}
                ticks={[0, top / 2, top]}
                tickFormatter={metric.axis}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                width={52}
              />
              <Tooltip
                content={<TrendTooltip metric={metric} />}
                cursor={{ stroke: '#CBD5E1', strokeWidth: 1 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={metric.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3.5, strokeWidth: 2, stroke: '#FFFFFF' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-[#F6F7F9] px-2.5 py-1.5">
          <div className="font-mono text-[10px] text-data-grey">Average</div>
          <div className="font-mono text-xs tabular-nums text-inkwell">{average}</div>
          <div className="font-mono text-[10px] text-data-grey/80">across the period</div>
        </div>
        <Extreme label="Highest" row={highest} metric={metric} />
        <Extreme label="Lowest" row={lowest} metric={metric} />
      </div>
    </div>
  );
}

// A period tile; on wider screens it opens the metric's trend box on a click or
// a long hover, like the other readings.
// share (0-1) drives the tile's icon: how full, busy or hot the average is.
export function TrendTile({ metric: key, history, range, scope, label, value, share, total = null, caption = null }) {
  const metric = TREND_METRICS[key];
  const rows = useMemo(() => (history ? trendRows(history, metric) : []), [history, metric]);
  return (
    <BoxTile
      label={label}
      value={value}
      total={total}
      caption={caption}
      icon={{ color: metric.color, glyph: <MetricIcon metricKey={key} share={share} color={metric.color} /> }}
      action="Show its trend"
      details={
        history ? (
          <TrendDetails
            metric={metric}
            rows={rows}
            history={history}
            range={range}
            scope={scope}
            average={value}
            share={share}
          />
        ) : null
      }
    />
  );
}

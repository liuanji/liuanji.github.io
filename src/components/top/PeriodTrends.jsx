import { useMemo } from 'react';
import { Gauge, LayoutGrid, MemoryStick, Zap } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { SERIES } from './config';
import { StatTile } from './controls';
import { DetailsPopover } from './DetailBoxes';
import { formatAxisTime, formatFullTime, formatPercent, formatPower } from './format';

// Power's axis tops out at the next whole kW above the highest reading.
function powerTop(rows) {
  return Math.max(1000, Math.ceil((Math.max(...rows.map((row) => row.value)) * 1.05) / 1000) * 1000);
}

// The four period tiles' metrics, read from the same history points as the
// usage trend chart. Power has its own muted hue, apart from the chart's three.
// top is the chart's upper bound; it is drawn with marks at 0, half and top.
export const TREND_METRICS = {
  busy: {
    label: 'GPUs in use',
    Icon: LayoutGrid,
    color: SERIES.busy.color,
    read: (point) => point.gpus_in_use,
    format: (value) => value.toFixed(1),
    axis: (value) => String(Math.round(value)),
    top: (rows) => Math.max(1, ...rows.map((row) => row.point.gpu_count)),
  },
  compute: {
    label: 'GPU compute',
    Icon: Gauge,
    color: SERIES.compute.color,
    read: (point) => point.utilization,
    format: formatPercent,
    axis: formatPercent,
    top: () => 100,
  },
  memory: {
    label: 'GPU memory',
    Icon: MemoryStick,
    color: SERIES.memory.color,
    read: (point) => point.memory_percent,
    format: formatPercent,
    axis: formatPercent,
    top: () => 100,
  },
  power: {
    label: 'GPU power',
    Icon: Zap,
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
  const steps = rows.slice(1).map((row, index) => row.time - rows[index].time).sort((a, b) => a - b);
  const typical = steps[Math.floor(steps.length / 2)];
  if (!typical) return rows;
  return rows.flatMap((row, index) =>
    index && row.time - rows[index - 1].time > typical * 2.5
      ? [{ time: rows[index - 1].time + typical, value: null, point: null }, row]
      : [row],
  );
}

// A slim line of the metric across the period, scaled to its own low and high
// so the shape shows even when it barely moves.
function Sparkline({ rows, history, color }) {
  const values = rows.filter((row) => row.value != null).map((row) => row.value);
  if (values.length < 2) return <div className="mt-3 h-7" aria-hidden="true" />;
  const low = Math.min(...values);
  const span = Math.max(...values) - low;
  const width = history.end - history.start || 1;
  let path = '';
  let drawing = false;
  for (const row of rows) {
    if (row.value == null) {
      drawing = false;
      continue;
    }
    const x = ((row.time - history.start) / width) * 100;
    const y = span ? 22 - ((row.value - low) / span) * 20 : 12;
    path += `${drawing ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)} `;
    drawing = true;
  }
  return (
    <svg className="mt-3 h-7 w-full overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
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
function TrendDetails({ metric, rows, history, range, scope, average }) {
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
          <metric.Icon className="h-[18px] w-[18px]" style={{ color: metric.color }} strokeWidth={2} />
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

// A period tile with a sparkline of its metric; on wider screens it opens the
// metric's box on a click or a long hover, like the other readings.
export function TrendTile({ metric: key, history, range, scope, label, value, total = null, caption = null }) {
  const metric = TREND_METRICS[key];
  const interactive = !useIsMobile();
  const rows = useMemo(() => (history ? trendRows(history, metric) : []), [history, metric]);
  const tile = (
    <StatTile
      label={label}
      value={value}
      total={total}
      caption={caption}
      className={interactive ? 'h-full transition-colors group-hover:bg-paper group-data-[state=open]:bg-paper' : 'h-full'}
    >
      {history && <Sparkline rows={rows} history={history} color={metric.color} />}
    </StatTile>
  );
  if (!interactive || !history) return tile;
  return (
    <DetailsPopover
      content={
        <TrendDetails metric={metric} rows={rows} history={history} range={range} scope={scope} average={value} />
      }
      width="w-[460px]"
    >
      <button
        type="button"
        aria-label={`${label}: ${value}. Show its trend.`}
        className="group block w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20"
      >
        {tile}
      </button>
    </DetailsPopover>
  );
}

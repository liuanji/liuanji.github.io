import { useState } from 'react';
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BoxFooter, GLYPH, RING_SERIES } from '../shared/DetailBoxes';
import { HISTORY_REFRESH_MS, LIVE_REFRESH_MS } from '../shared/config';
import { Segmented } from '../shared/controls';
import { pressurePhrase } from '../shared/easterEggs';
import { formatAxisTime, gpuModels } from '../shared/format';
import { useGrowingShare, useMorphedSeries } from '../hooks/useGrowingShare';
import { useStatusFile } from '../hooks/useStatusFile';

const INK = '#3E5BA9';
// Pixels per unit of the header's GPU server, which keeps its body as tall as
// the RAM stick's beside it.
const ROW_SCALE = 46 / 43;
// And in its box, scaled up as the RAM box's stick is (112px against the
// header's 44px).
const BOX_SCALE = ROW_SCALE * (112 / 44);
const INK_SOFT = '#8EA2D8';

// A small GPU server, drawn like the CPU and RAM glyphs: a rack-mounted chassis
// with one card per GPU, each with its fan, as many lit as are in use (the
// last partly while it eases), pulsing out of step, quicker the busier they
// compute. With reduced motion, or with nothing in use, it holds still. In a
// row (as in the header, beside the RAM stick) or, with block set, in two rows
// (as in its box); scale is pixels per unit.
export function RackGlyph({
  share,
  color,
  count = 8,
  block = false,
  scale = ROW_SCALE,
  animated = false,
  pace = share,
  grow = false,
}) {
  const growing = useGrowingShare(share, grow);
  const lit = (grow ? growing : share) * count;
  const rows = block ? 2 : 1;
  const columns = Math.max(1, Math.ceil(count / rows));
  const pulse = animated && pace >= 0.02 ? 2.8 - 1.8 * pace : null;
  // Each card is as wide as one of the RAM stick's chips, with the same gaps
  // and margins, and a little taller; the chassis wraps them.
  const card = { width: 4.46, height: 8.2, gap: 1.31 };
  const pad = 2.91;
  const chassis = {
    x: 1.9,
    y: 1.65,
    width: pad * 2 + columns * card.width + (columns - 1) * card.gap,
    height: pad * 2 + rows * card.height + (rows - 1) * card.gap,
  };
  // The feet hang below the chassis, as low as the RAM stick's gold contacts
  // reach, and the drawing is padded as much above, so the chassis centres
  // where the stick's body does.
  const feet = { from: 1.18, to: 3.68, below: 5.2 };
  const top = chassis.y - feet.below;
  const box = { width: chassis.x * 2 + chassis.width, height: chassis.y + chassis.height + feet.below - top };
  // Drawn at a fixed scale, so more GPUs make it wider; its outline is as
  // thick on screen as the RAM stick's at the same size (1.3 of the stick's 36
  // units across 44px in the header).
  const pixels = box.width * scale;
  const outline = (1.3 * (44 / 36)) / ROW_SCALE;
  const ear = { y: chassis.y + chassis.height * 0.2, height: chassis.height * 0.6 };
  return (
    <svg
      width={pixels}
      height={(pixels * box.height) / box.width}
      viewBox={`0 ${top} ${box.width} ${box.height}`}
      aria-hidden="true"
    >
      {/* Rack ears on each side, with a screw hole. */}
      {[0.4, box.width - 2.4].map((x) => (
        <g key={x}>
          <rect
            x={x}
            y={ear.y}
            width="2"
            height={ear.height}
            rx="0.7"
            fill="white"
            stroke={GLYPH.outline}
            strokeWidth="1"
          />
          <circle cx={x + 1} cy={ear.y + ear.height / 2} r="0.45" fill={GLYPH.outline} />
        </g>
      ))}
      <rect
        x={chassis.x}
        y={chassis.y}
        width={chassis.width}
        height={chassis.height}
        rx="2.2"
        fill="white"
        stroke={GLYPH.outline}
        strokeWidth={outline}
      />
      {/* One card per GPU, each with its fan; lit while in use. */}
      {Array.from({ length: count }, (_, index) => {
        const amount = Math.min(1, Math.max(0, lit - index));
        const x = chassis.x + pad + (index % columns) * (card.width + card.gap);
        const y = chassis.y + pad + Math.floor(index / columns) * (card.height + card.gap);
        const fan = { cx: x + card.width / 2, cy: y + card.height / 2, r: Math.min(card.width, card.height) * 0.3 };
        return (
          <g key={index}>
            <rect x={x} y={y} width={card.width} height={card.height} rx="0.7" fill={GLYPH.unlit} />
            <circle {...fan} fill="none" stroke={GLYPH.outline} strokeWidth="0.6" />
            {amount > 0 && (
              <g
                className={pulse ? 'motion-safe:animate-pulse' : undefined}
                style={
                  pulse
                    ? { animationDuration: `${pulse}s`, animationDelay: `-${(((index * 5) % count) / count) * pulse}s` }
                    : undefined
                }
                opacity={0.3 + 0.7 * amount}
              >
                <rect x={x} y={y} width={card.width} height={card.height} rx="0.7" fill={color} />
                <circle {...fan} fill="none" stroke="white" strokeWidth="0.6" />
              </g>
            )}
          </g>
        );
      })}
      {[chassis.x + 3.6, chassis.x + chassis.width - 3.6].map((x) => (
        <line
          key={x}
          x1={x}
          y1={chassis.y + chassis.height + feet.from}
          x2={x}
          y2={chassis.y + chassis.height + feet.to}
          stroke={GLYPH.outline}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function Stat({ label, value, note }) {
  return (
    <div className="rounded-lg bg-[#F6F7F9] px-2.5 py-1.5">
      <div className="font-mono text-[10px] text-data-grey">{label}</div>
      <div className="font-mono text-xs tabular-nums text-inkwell">{value}</div>
      {note && <div className="truncate font-mono text-[10px] text-data-grey/80">{note}</div>}
    </div>
  );
}

// The box the GPU meter opens: the rack and how many are in use on the left;
// on the right the last hour or day of GPUs in use, with the share computing as a
// denser fade inside, and its average, utilization and busiest moment.
export function GpuOverview({ host, token }) {
  // The last hour (refreshed with the live readings) or the last day.
  const [range, setRange] = useState('24h');
  const [hovered, setHovered] = useState(null);
  const history = useStatusFile(
    `history-${host.name}-${range}`,
    range === '1h' ? LIVE_REFRESH_MS : HISTORY_REFRESH_MS,
    token,
  ).data;
  const total = host.gpus.length;
  const busy = host.gpus.filter((gpu) => gpu.busy).length;
  const shown = useGrowingShare(total ? busy / total : 0);
  const rows = (history?.points ?? [])
    .filter((point) => point.gpus_in_use != null)
    .map((point) => {
      const count = point.gpu_count ?? total;
      const computing = Math.min(point.gpus_in_use, ((point.utilization ?? 0) / 100) * count);
      return {
        timestamp: point.timestamp,
        busy: point.gpus_in_use,
        total: count,
        computing,
        utilized: point.gpus_in_use ? computing / point.gpus_in_use : 0,
      };
    });
  const top = Math.max(1, total, ...rows.map((row) => row.total));
  const busyShown = useMorphedSeries(rows.map((row) => row.busy / top));
  const computingShown = useMorphedSeries(rows.map((row) => row.computing / top));
  const drawn = rows.map((row, index) => ({
    ...row,
    busyShown: busyShown[index],
    computingShown: computingShown[index],
  }));
  const average = rows.length ? rows.reduce((sum, row) => sum + row.busy, 0) / rows.length : null;
  const held = rows.reduce((sum, row) => sum + row.busy, 0);
  const utilization = held ? rows.reduce((sum, row) => sum + row.computing, 0) / held : null;
  const busiest = rows.reduce((best, row) => (!best || row.busy > best.busy ? row : best), null);
  const start = history?.start ?? rows[0]?.timestamp;
  const end = history?.end ?? rows[rows.length - 1]?.timestamp;
  return (
    <div>
      <div className="flex gap-6">
        <div className="flex w-[104px] flex-shrink-0 flex-col items-center justify-center">
          <RackGlyph
            share={shown}
            pace={total ? busy / total : 0}
            count={total || 8}
            color={RING_SERIES.compute.color}
            block
            scale={BOX_SCALE}
            animated
          />
          <span className="mt-2 font-tight text-lg font-semibold leading-none tabular-nums text-inkwell">
            {Math.round(shown * total)}
            <span className="text-data-grey/70">/{total}</span>
          </span>
          <span className="mt-1 font-mono text-[10px] text-data-grey">in use now</span>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-tight text-base font-semibold leading-tight text-inkwell">
            {host.name} <span className="text-data-grey/60">·</span> GPUs
          </h4>
          <p className="mt-0.5 truncate font-mono text-[11px] text-data-grey">
            {total} × {gpuModels(host.gpus) || 'GPU'}
          </p>
          {/* Which period the chart shows, and what its line and fade show. */}
          <div className="mt-3 flex items-center justify-between gap-2 font-mono text-[11px] text-data-grey">
            <Segmented
              label="Period shown"
              options={[
                ['1h', '1 h'],
                ['24h', '24 h'],
              ]}
              value={range}
              onChange={setRange}
            />
            {/* While hovering the chart, the moment's reading takes the key's
                place, so nothing covers the chart. */}
            {hovered ? (
              <span className="truncate whitespace-nowrap text-[10px] text-inkwell">
                {formatAxisTime(hovered.timestamp, '24h')} · {Math.round(hovered.busy)}/{hovered.total}
                <span className="text-data-grey"> · {Math.round(hovered.utilized * 100)}% computing</span>
              </span>
            ) : (
              <span className="flex items-center gap-3 whitespace-nowrap text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: INK }} aria-hidden="true" />
                  In use
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="h-2 w-3 rounded-sm border-t"
                    style={{ backgroundColor: `${INK_SOFT}66`, borderColor: INK_SOFT }}
                    aria-hidden="true"
                  />
                  Computing
                </span>
              </span>
            )}
          </div>
          <div
            className="mt-2.5 h-[86px]"
            role="img"
            aria-label={`GPUs in use over the last ${range === '1h' ? 'hour' : '24 hours'}`}
          >
            {rows.length < 2 ? (
              <p className="pt-8 text-center text-xs text-data-grey">{history ? 'Not enough data yet.' : 'Loading…'}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={drawn}
                  margin={{ top: 6, right: 16, bottom: 0, left: 0 }}
                  onMouseMove={(state) => setHovered(state?.activePayload?.[0]?.payload ?? null)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={[start, end]}
                    ticks={[start, start + (end - start) / 2, end]}
                    tickFormatter={(time) => formatAxisTime(time, range)}
                    axisLine={{ stroke: '#EEF2F6' }}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                    tickMargin={6}
                    height={20}
                  />
                  <YAxis
                    domain={[0, 1]}
                    ticks={[0, 1]}
                    tickFormatter={(tick) => Math.round(tick * top)}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                    width={18}
                  />
                  <ReferenceLine y={1} stroke="#E2E8F0" strokeDasharray="3 4" />
                  <Tooltip content={() => null} cursor={{ stroke: '#CBD5E1' }} isAnimationActive={false} />
                  <Area
                    type="monotone"
                    dataKey="busyShown"
                    stroke={INK}
                    strokeWidth={1.4}
                    fill={INK}
                    fillOpacity={0.07}
                    dot={false}
                    activeDot={{ r: 2.5, strokeWidth: 1.5, stroke: '#FFFFFF', fill: INK }}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="computingShown"
                    stroke={INK_SOFT}
                    strokeWidth={1}
                    fill={INK_SOFT}
                    fillOpacity={0.22}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label="Average" value={average == null ? '—' : `${average.toFixed(1)} of ${total}`} note="in use" />
            <Stat
              label="Utilized"
              value={utilization == null ? '—' : `${Math.round(utilization * 100)}%`}
              note="computing"
            />
            <Stat
              label="Busiest"
              value={busiest ? `${Math.round(busiest.busy)} of ${busiest.total}` : '—'}
              note={busiest ? formatAxisTime(busiest.timestamp, '24h') : ' '}
            />
          </div>
        </div>
      </div>
      <BoxFooter phrase={pressurePhrase('gpu', total ? busy / total : 0, host.name)} />
    </div>
  );
}

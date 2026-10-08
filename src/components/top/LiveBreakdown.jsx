import { HOST_STATUS } from './config';
import { BoxTile } from './DetailBoxes';
import { formatMemory, formatMemoryOf, formatPercent, formatPower, hasCurrentData, summarize } from './format';
import { MetricIcon } from './MetricIcons';
import { TREND_METRICS } from './PeriodTrends';

function sumOf(gpus, key) {
  return gpus.reduce((total, gpu) => total + (Number(gpu[key]) || 0), 0);
}

// One server's or one GPU's share and reading for a metric.
const READINGS = {
  busy: {
    server: (gpus) => {
      const busy = gpus.filter((gpu) => gpu.busy).length;
      return { share: gpus.length ? busy / gpus.length : 0, value: `${busy} / ${gpus.length}` };
    },
    gpu: (gpu) => ({
      share: gpu.busy ? 1 : 0,
      value: gpu.users.length ? gpu.users.map((user) => user.username).join(', ') : gpu.busy ? 'In use' : 'Idle',
    }),
  },
  compute: {
    server: (gpus) => {
      const load = gpus.length ? sumOf(gpus, 'utilization') / gpus.length : 0;
      return { share: load / 100, value: formatPercent(load) };
    },
    gpu: (gpu) => ({ share: gpu.utilization / 100, value: formatPercent(gpu.utilization) }),
  },
  memory: {
    server: (gpus) => {
      const total = sumOf(gpus, 'memory_total_mb');
      const used = sumOf(gpus, 'memory_used_mb');
      return { share: total ? used / total : 0, value: formatMemoryOf(used, total) };
    },
    gpu: (gpu) => ({
      share: gpu.memory_total_mb ? gpu.memory_used_mb / gpu.memory_total_mb : 0,
      value: formatMemoryOf(gpu.memory_used_mb, gpu.memory_total_mb),
    }),
  },
  power: {
    server: (gpus) => {
      const power = sumOf(gpus, 'power_w');
      const limit = sumOf(gpus, 'power_limit_w');
      return { share: limit ? power / limit : 0, value: limit ? `${formatPower(power)} of ${formatPower(limit)}` : formatPower(power) };
    },
    gpu: (gpu) => ({
      share: gpu.power_limit_w ? (gpu.power_w ?? 0) / gpu.power_limit_w : 0,
      value:
        gpu.power_w == null
          ? '—'
          : gpu.power_limit_w
            ? `${Math.round(gpu.power_w)} / ${Math.round(gpu.power_limit_w)} W`
            : `${Math.round(gpu.power_w)} W`,
    }),
  },
};

// With every server shown, a row per server; with one, a row per GPU. A server
// that stopped reporting keeps a dimmed row instead of its stale readings.
function breakdownRows(key, hosts, now) {
  if (hosts.length === 1) {
    return hosts[0].gpus.map((gpu) => ({ name: `GPU ${gpu.index}`, dot: gpu.busy ? '#2563EB' : null, ...READINGS[key].gpu(gpu) }));
  }
  return hosts.map((host) => {
    const status = HOST_STATUS[host.status] ?? HOST_STATUS.unseen;
    if (!hasCurrentData(host, now) || !host.gpus.length) {
      return { name: host.name, dot: status.color, share: 0, value: 'no recent data', dim: true };
    }
    return { name: host.name, dot: status.color, ...READINGS[key].server(host.gpus) };
  });
}

function BreakdownDetails({ metricKey, hosts, now, summary, share }) {
  const metric = TREND_METRICS[metricKey];
  const rows = breakdownRows(metricKey, hosts, now);
  const single = hosts.length === 1;
  return (
    <div>
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${metric.color}1A` }}
          aria-hidden="true"
        >
          <MetricIcon metricKey={metricKey} share={share} color={metric.color} className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h4 className="font-tight text-base font-semibold leading-tight text-inkwell">
            {metric.label} <span className="text-data-grey/60">·</span> {single ? hosts[0].name : 'by server'}
          </h4>
          <p className="mt-0.5 truncate font-mono text-[11px] text-data-grey">Right now · {summary}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2.5">
        {rows.map((row) => (
          <li
            key={row.name}
            className={`grid grid-cols-[6rem_minmax(0,1fr)_8.5rem] items-center gap-3 ${row.dim ? 'opacity-50' : ''}`}
          >
            <span className="flex min-w-0 items-center gap-2 font-mono text-xs text-inkwell">
              <span
                className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${row.dot ? '' : 'ring-1 ring-inset ring-data-grey/50'}`}
                style={row.dot ? { backgroundColor: row.dot } : undefined}
                aria-hidden="true"
              />
              <span className="truncate">{row.name}</span>
            </span>
            <span className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: `${metric.color}1F` }}>
              <span
                className="block h-full rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, row.share * 100))}%`, backgroundColor: metric.color }}
              />
            </span>
            <span className="truncate text-right font-mono text-xs tabular-nums text-inkwell">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// The four "right now" tiles. On wider screens each opens its metric broken down
// by server, or by GPU when one server is shown.
export default function LiveTiles({ hosts, allHosts, now }) {
  const summary = summarize(hosts, now);
  const idle = summary.gpusTotal - summary.gpusBusy;
  const memoryShare = summary.memoryTotalMb ? (summary.memoryUsedMb / summary.memoryTotalMb) * 100 : 0;
  // Draw is measured against the power limits of the GPUs in the totals.
  const powerLimit = hosts
    .filter((host) => hasCurrentData(host, now))
    .reduce((total, host) => total + sumOf(host.gpus, 'power_limit_w'), 0);
  const tiles = [
    {
      key: 'busy',
      value: summary.gpusBusy,
      total: summary.gpusTotal,
      caption: allHosts ? `${idle} idle · ${summary.hostsOnline}/${summary.hostsTotal} servers online` : `${idle} idle`,
      summary: `${summary.gpusBusy} of ${summary.gpusTotal} GPUs in use`,
      share: summary.gpusTotal ? summary.gpusBusy / summary.gpusTotal : 0,
    },
    {
      key: 'compute',
      value: formatPercent(summary.computeLoad),
      caption: `Average across ${summary.gpusTotal} GPUs`,
      summary: `${formatPercent(summary.computeLoad)} average across ${summary.gpusTotal} GPUs`,
      share: summary.computeLoad / 100,
    },
    {
      key: 'memory',
      value: formatPercent(memoryShare),
      caption: `${formatMemory(summary.memoryUsedMb)} of ${formatMemory(summary.memoryTotalMb)}`,
      summary: `${formatMemory(summary.memoryUsedMb)} of ${formatMemory(summary.memoryTotalMb)} in use`,
      share: memoryShare / 100,
    },
    {
      key: 'power',
      value: formatPower(summary.powerW),
      caption: 'Current total draw',
      summary: `${formatPower(summary.powerW)} drawn in total`,
      share: powerLimit ? summary.powerW / powerLimit : 0,
    },
  ];
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((tile) => (
        <BoxTile
          key={tile.key}
          label={TREND_METRICS[tile.key].label}
          value={tile.value}
          total={tile.total ?? null}
          caption={tile.caption}
          icon={{
            color: TREND_METRICS[tile.key].color,
            glyph: <MetricIcon metricKey={tile.key} share={tile.share} color={TREND_METRICS[tile.key].color} />,
          }}
          width="w-[440px]"
          action={hosts.length === 1 ? 'Show each GPU' : 'Show each server'}
          details={
            hosts.length ? (
              <BreakdownDetails metricKey={tile.key} hosts={hosts} now={now} summary={tile.summary} share={tile.share} />
            ) : null
          }
        />
      ))}
    </div>
  );
}

import { Thermometer, Zap } from 'lucide-react';
import { READING_STYLES, SERIES } from './config';
import { StatusPill } from './controls';
import { formatAgo, formatMemory, hasCurrentData, powerLevel, temperatureLevel } from './format';

function MiniMeter({ value, max, display, series }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: series.track }}>
        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: series.color }} />
      </div>
      <span className="w-11 text-right font-mono text-[11px] tabular-nums text-inkwell">{display}</span>
    </div>
  );
}

function describe(gpu, host) {
  const parts = [
    `${host} GPU ${gpu.index}`,
    `${Math.round(gpu.utilization)}% compute`,
    `${formatMemory(gpu.memory_used_mb)} of ${formatMemory(gpu.memory_total_mb)} memory`,
  ];
  if (gpu.temperature_c != null) parts.push(`${Math.round(gpu.temperature_c)}°C`);
  if (gpu.power_w != null) {
    parts.push(
      gpu.power_limit_w ? `${Math.round(gpu.power_w)} of ${Math.round(gpu.power_limit_w)} W` : `${Math.round(gpu.power_w)} W`,
    );
  }
  parts.push(gpu.users.length ? gpu.users.map((user) => user.username).join(', ') : gpu.busy ? 'in use' : 'idle');
  return parts.join(' · ');
}

// A high temperature is worth a closer look, so a hot GPU outlines its whole
// tile; high power is normal under load and only shows its icon.
function GpuTile({ gpu, host }) {
  const temperature = temperatureLevel(gpu.temperature_c);
  const power = powerLevel(gpu.power_w, gpu.power_limit_w);
  const [firstUser, ...otherUsers] = gpu.users;
  return (
    <div
      title={describe(gpu, host)}
      className={`min-w-0 rounded-xl border px-3 py-2.5 ${
        temperature === 'hot' ? 'border-[#B33A3A]/50 bg-[#B33A3A]/[0.04]' : 'border-border-light bg-white'
      }`}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${gpu.busy ? 'bg-synapse' : 'ring-1 ring-inset ring-data-grey/50'}`}
          aria-hidden="true"
        />
        <span className="font-mono text-xs text-inkwell">GPU {gpu.index}</span>
        <span className="ml-auto flex items-center gap-0.5">
          {temperature && (
            <Thermometer
              className="h-3.5 w-3.5"
              style={{ color: READING_STYLES[temperature].color }}
              strokeWidth={2.25}
              aria-label={`${temperature === 'hot' ? 'Very hot' : 'Hot'}: ${Math.round(gpu.temperature_c)}°C`}
            />
          )}
          {power && (
            <Zap
              className="h-3.5 w-3.5"
              style={{ color: READING_STYLES[power].color }}
              strokeWidth={2.25}
              aria-label={`High power: ${Math.round(gpu.power_w)} W`}
            />
          )}
        </span>
      </div>
      <div className="space-y-1">
        <MiniMeter value={gpu.utilization} max={100} display={`${Math.round(gpu.utilization)}%`} series={SERIES.compute} />
        <MiniMeter
          value={gpu.memory_used_mb}
          max={gpu.memory_total_mb}
          display={formatMemory(gpu.memory_used_mb)}
          series={SERIES.memory}
        />
      </div>
      <div className="mt-2 truncate font-mono text-[11px]">
        {firstUser ? (
          <span className="text-inkwell">
            {firstUser.username}
            {otherUsers.length > 0 && <span className="text-data-grey"> +{otherUsers.length}</span>}
          </span>
        ) : (
          <span className="text-data-grey/60">{gpu.busy ? 'In use' : 'Idle'}</span>
        )}
      </div>
    </div>
  );
}

function CompactHost({ host, now }) {
  const busy = host.gpus.filter((gpu) => gpu.busy).length;
  const outdated = host.data_sampled_at != null && !hasCurrentData(host, now);
  return (
    <article className="bg-white rounded-2xl border border-border-light p-4 sm:p-5">
      <header className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="font-tight font-semibold text-lg text-inkwell leading-tight">{host.name}</h3>
        {host.gpus.length > 0 && (
          <span className="font-mono text-xs text-data-grey">
            {busy}/{host.gpus.length} in use
          </span>
        )}
        <span className="ml-auto flex items-center gap-3 font-mono text-xs text-data-grey">
          {outdated && <span>last reported {formatAgo(now - host.data_sampled_at)}</span>}
          <StatusPill status={host.status} />
        </span>
      </header>
      {host.gpus.length ? (
        <div className={`grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8 ${outdated ? 'opacity-50' : ''}`}>
          {host.gpus.map((gpu) => (
            <GpuTile key={gpu.index} gpu={gpu} host={host.name} />
          ))}
        </div>
      ) : (
        <p className="py-4 text-sm text-data-grey">No data from this server right now.</p>
      )}
    </article>
  );
}

function LegendItem({ children }) {
  return <span className="inline-flex items-center gap-1.5">{children}</span>;
}

export default function CompactHosts({ hosts, now }) {
  return (
    <div>
      <div className="space-y-4">
        {hosts.map((host) => (
          <CompactHost key={host.name} host={host} now={now} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[11px] text-data-grey">
        <LegendItem>
          <span className="h-1 w-3.5 rounded-full" style={{ backgroundColor: SERIES.compute.color }} aria-hidden="true" />
          Compute
        </LegendItem>
        <LegendItem>
          <span className="h-1 w-3.5 rounded-full" style={{ backgroundColor: SERIES.memory.color }} aria-hidden="true" />
          Memory
        </LegendItem>
        <LegendItem>
          <Thermometer className="h-3.5 w-3.5" style={READING_STYLES.warm} aria-hidden="true" />
          From 75°C; outlined from 85°C
        </LegendItem>
        <LegendItem>
          <Zap className="h-3.5 w-3.5" style={READING_STYLES.warm} aria-hidden="true" />
          From 70% of power limit
        </LegendItem>
      </div>
    </div>
  );
}

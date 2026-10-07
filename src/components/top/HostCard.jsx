import { SERIES } from './config';
import { StatusPill } from './controls';
import { formatAgo, formatMemory, formatMemoryOf, gpuModels } from './format';

const ROW_GRID =
  'grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)_7.5rem_minmax(0,1.3fr)] md:items-center md:gap-x-6';

// In GPU rows the column headers name each meter on wide screens, so the label
// only shows on narrow ones unless alwaysLabel is set.
function Meter({ label, value, max, display, series, alwaysLabel = false }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className={`text-xs text-data-grey ${alwaysLabel ? '' : 'md:hidden'}`}>{label}</span>
        <span className="ml-auto whitespace-nowrap font-mono text-xs tabular-nums text-inkwell">{display}</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full"
        style={{ backgroundColor: series.track }}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: series.color }} />
      </div>
    </div>
  );
}

// The server as a whole: CPU load across all cores and RAM in use.
function SystemStrip({ system }) {
  const cpu = system.cpu_percent;
  const ramKnown = system.memory_used_mb != null && system.memory_total_mb;
  return (
    <div className="grid gap-x-6 gap-y-3 border-b border-border-light bg-paper/60 px-6 py-3.5 sm:grid-cols-2">
      <Meter
        label={system.cpu_count ? `CPU · ${system.cpu_count} cores` : 'CPU'}
        value={cpu ?? 0}
        max={100}
        display={cpu == null ? '—' : `${Math.round(cpu)}%`}
        series={SERIES.compute}
        alwaysLabel
      />
      <Meter
        label="RAM"
        value={system.memory_used_mb ?? 0}
        max={system.memory_total_mb ?? 0}
        display={ramKnown ? formatMemoryOf(system.memory_used_mb, system.memory_total_mb) : '—'}
        series={SERIES.memory}
        alwaysLabel
      />
    </div>
  );
}

function GpuRow({ gpu }) {
  const thermal = gpu.temperature_c == null ? '—' : `${Math.round(gpu.temperature_c)}°C`;
  const power = gpu.power_w == null ? '—' : `${Math.round(gpu.power_w)} W`;
  return (
    <div className={`${ROW_GRID} px-6 py-3.5`}>
      <div className="order-1 flex items-center gap-2 md:order-none">
        <span
          className={`h-2 w-2 rounded-full ${gpu.busy ? 'bg-synapse' : 'ring-1 ring-inset ring-data-grey/50'}`}
          aria-hidden="true"
        />
        <span className="font-mono text-sm text-inkwell">GPU {gpu.index}</span>
      </div>
      <div className="order-3 md:order-none">
        <Meter
          label="Compute"
          value={gpu.utilization}
          max={100}
          display={`${Math.round(gpu.utilization)}%`}
          series={SERIES.compute}
        />
      </div>
      <div className="order-4 md:order-none">
        <Meter
          label="Memory"
          value={gpu.memory_used_mb}
          max={gpu.memory_total_mb}
          display={formatMemoryOf(gpu.memory_used_mb, gpu.memory_total_mb)}
          series={SERIES.memory}
        />
      </div>
      <div className="order-2 text-right font-mono text-xs tabular-nums text-data-grey md:order-none md:text-left">
        {thermal} · {power}
      </div>
      <div className="order-5 col-span-2 flex flex-wrap gap-1.5 md:order-none md:col-span-1">
        {gpu.users.length ? (
          gpu.users.map((user) => (
            <span
              key={user.username}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-light bg-paper px-2 py-0.5 font-mono text-xs text-inkwell"
            >
              {user.username}
              <span className="text-data-grey">{formatMemory(user.used_memory_mb)}</span>
            </span>
          ))
        ) : (
          <span className="font-mono text-xs text-data-grey/60">{gpu.busy ? 'In use' : 'Idle'}</span>
        )}
      </div>
    </div>
  );
}

export default function HostCard({ host, now }) {
  const busy = host.gpus.filter((gpu) => gpu.busy).length;
  return (
    <article className="bg-white rounded-2xl border border-border-light overflow-hidden">
      <header className="flex flex-col gap-3 border-b border-border-light px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-tight font-semibold text-lg text-inkwell leading-tight">{host.name}</h3>
          {host.gpus.length > 0 && (
            <div className="mt-0.5 truncate font-mono text-xs text-data-grey">
              {host.gpus.length} × {gpuModels(host.gpus)} · {busy} in use
            </div>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-3 font-mono text-xs text-data-grey">
          {host.data_sampled_at && <span>{formatAgo(now - host.data_sampled_at)}</span>}
          <StatusPill status={host.status} />
        </div>
      </header>
      {host.system && <SystemStrip system={host.system} />}
      {host.gpus.length ? (
        <>
          <div
            className={`${ROW_GRID} hidden border-b border-border-light px-6 py-2 font-mono text-[11px] uppercase tracking-wider text-data-grey/70 md:grid`}
          >
            <span>GPU</span>
            <span>Compute</span>
            <span>Memory</span>
            <span>Temp · Power</span>
            <span>Users</span>
          </div>
          <div className="divide-y divide-border-light">
            {host.gpus.map((gpu) => (
              <GpuRow key={gpu.index} gpu={gpu} />
            ))}
          </div>
        </>
      ) : (
        <p className="px-6 py-8 text-sm text-data-grey">No data from this server right now.</p>
      )}
    </article>
  );
}

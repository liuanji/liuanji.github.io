import { ThermometerSun } from 'lucide-react';
import { Banner, BannerLink } from './controls';
import { LEVEL_SERIES } from './config';

// A GPU at or above this is too hot to leave be: its tile gets a red halo and its
// users an urgent note at the top of their page.
export const OVERHEAT_C = 75;
const HOT = LEVEL_SERIES.hot.color;

export function isOverheated(gpu) {
  return gpu.temperature_c != null && gpu.temperature_c >= OVERHEAT_C;
}

// The viewer's GPUs at or over OVERHEAT_C: those where they have a job.
export function myOverheated(hosts, me) {
  return hosts.flatMap((host) =>
    host.gpus
      .filter((gpu) => isOverheated(gpu) && gpu.users.some((user) => user.username === me))
      .map((gpu) => ({ host: host.name, gpu })),
  );
}

// A small red pill with a thermometer and the temperature, for a hot GPU's tile or row.
export function OverheatBadge({ gpu, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-px font-mono text-[10px] font-medium text-white ${className}`}
      style={{ backgroundColor: HOT }}
      title={`${Math.round(gpu.temperature_c)}°C: ${OVERHEAT_C}°C or more`}
    >
      <ThermometerSun className="h-3 w-3" strokeWidth={2.25} aria-hidden="true" />
      {Math.round(gpu.temperature_c)}°C
    </span>
  );
}

// The urgent note to whoever runs on an overheating GPU: which ones and how hot,
// and what to do. Each GPU's name opens its server.
export function OverheatBanner({ items, onOpen }) {
  if (!items.length) return null;
  const name = ({ host, gpu }) => (
    <BannerLink color={HOT} onClick={onOpen && (() => onOpen(host))}>
      {host} · GPU {gpu.index}
    </BannerLink>
  );
  return (
    <Banner icon={ThermometerSun} color={HOT} role="alert" tinted>
      <p className="font-medium text-inkwell">
        {items.length === 1 ? (
          <>
            Your job on {name(items[0])} is running hot: {Math.round(items[0].gpu.temperature_c)}°C.
          </>
        ) : (
          <>
            GPUs you are using are running hot:{' '}
            {items.map((item, index) => (
              <span key={`${item.host}/${item.gpu.index}`}>
                {index > 0 && ', '}
                {name(item)} <span className="text-data-grey">({Math.round(item.gpu.temperature_c)}°C)</span>
              </span>
            ))}
            .
          </>
        )}
      </p>
      <p className="text-inkwell">
        Please check {items.length === 1 ? 'it' : 'them'} soon: running this hot wears the GPU and, if it keeps
        climbing, slows it down. Lighten the load (a smaller batch, fewer jobs) or pause it until it cools.
      </p>
    </Banner>
  );
}

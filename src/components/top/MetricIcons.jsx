import { useId } from 'react';
import { useGrowingShare } from './useGrowingShare';

// Small icons that show their tile's reading, drawn like stroke icons on a 24
// unit grid in the metric's colour. share runs from 0 to 1.

function clamp(share) {
  return Math.min(1, Math.max(0, Number(share) || 0));
}

// Four slots, each a quarter of the GPUs: soft tinted squares that turn solid
// in reading order, a partly used quarter filling from the bottom up.
function SlotsIcon({ share, color }) {
  const id = useId();
  const filled = clamp(share) * 4;
  const size = 8.5;
  return Array.from({ length: 4 }, (_, index) => {
    const x = 2.75 + (index % 2) * (size + 1.5);
    const y = 2.75 + Math.floor(index / 2) * (size + 1.5);
    const amount = Math.min(1, Math.max(0, filled - index));
    return (
      <g key={index}>
        <clipPath id={`${id}-${index}`}>
          <rect x={x} y={y} width={size} height={size} rx="2" />
        </clipPath>
        <rect x={x} y={y} width={size} height={size} rx="2" fill={color} opacity="0.22" />
        {amount > 0 && (
          <rect
            x={x}
            y={y + size * (1 - amount)}
            width={size}
            height={size * amount}
            fill={color}
            clipPath={`url(#${id}-${index})`}
          />
        )}
      </g>
    );
  });
}

// A gauge whose arc and needle sweep from the left (0) to the right (1).
function GaugeIcon({ share, color }) {
  const value = clamp(share);
  const center = { x: 12, y: 16 };
  const radius = 9;
  const half = Math.PI * radius;
  const angle = Math.PI * (1 - value);
  const needle = { x: center.x + Math.cos(angle) * 6, y: center.y - Math.sin(angle) * 6 };
  const arc = `M ${center.x - radius} ${center.y} A ${radius} ${radius} 0 0 1 ${center.x + radius} ${center.y}`;
  return (
    <>
      <path d={arc} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.25" />
      {value > 0.01 && (
        <path
          d={arc}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${value * half} ${half}`}
        />
      )}
      <line
        x1={center.x}
        y1={center.y}
        x2={needle.x}
        y2={needle.y}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx={center.x} cy={center.y} r="1.6" fill={color} />
    </>
  );
}

// A memory stick whose four chips fill from the left.
function StickIcon({ share, color }) {
  const filled = clamp(share) * 4;
  return (
    <>
      <rect x="2" y="5" width="20" height="11" rx="2" fill="none" stroke={color} strokeWidth="1.6" />
      {Array.from({ length: 4 }, (_, index) => {
        const amount = Math.min(1, Math.max(0, filled - index));
        const x = 4.4 + index * 4;
        return (
          <g key={index}>
            <rect x={x} y="7.6" width="3.2" height="5.8" rx="0.7" fill={color} opacity="0.2" />
            {amount > 0 && <rect x={x} y="7.6" width={3.2 * amount} height="5.8" rx="0.7" fill={color} />}
          </g>
        );
      })}
      {[5, 8, 11, 16, 19].map((x) => (
        <line key={x} x1={x} y1="18.5" x2={x} y2="20.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      ))}
    </>
  );
}

const BOLT =
  'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z';

// A lightning bolt that fills from the bottom up.
function BoltIcon({ share, color }) {
  const id = useId();
  const value = clamp(share);
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="0" y2="0">
          <stop offset={value} stopColor={color} stopOpacity="0.9" />
          <stop offset={value} stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={BOLT} fill={`url(#${id})`} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </>
  );
}

const ICONS = { busy: SlotsIcon, compute: GaugeIcon, memory: StickIcon, power: BoltIcon };
// grow animates the reading in from 0 each time the icon appears, as in the
// boxes the tiles open.
export function MetricIcon({ metricKey, share, color, className = 'h-5 w-5', grow = false }) {
  const Drawing = ICONS[metricKey];
  const shown = useGrowingShare(share, grow);
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <Drawing share={shown} color={color} />
    </svg>
  );
}

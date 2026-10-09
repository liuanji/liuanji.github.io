import { useState } from 'react';
import { GLYPH } from './DetailBoxes';
import { HOST_STATUS } from './config';
import { bakeryStateLine } from './easterEggs';
import { formatAgo, formatFullTime } from './format';

// The bakery behind the page's "Live" dot, in three states: live, with the
// oven's window glowing, a loaf rising inside and steam curling off the top;
// delayed, the glow dimmed and a kitchen timer ticking on top; and closed (the
// monitor gone quiet), the window cold, a sign swinging from the handle and the
// oven dozing off. Viewers who prefer reduced motion get the still scene.
const SCENE = {
  live: {
    title: 'Fresh out of the oven',
    glow: '#F4B860',
    light: HOST_STATUS.online.color,
    panel: '#FFF7EA',
  },
  delayed: {
    title: 'This batch is running a little late',
    glow: '#F2CF94',
    light: HOST_STATUS.stale.color,
    panel: '#FFF8EB',
  },
  closed: {
    title: 'The bakery is closed for now',
    glow: '#EEF1F5',
    light: GLYPH.outline,
    panel: '#F6F4F0',
  },
};
const LOAF = '#E3B655';
const CRUST = '#C9973D';
const STEAM = ['M68 24c-3-4 3-7 0-11s3-7 0-11', 'M80 22c-3-4 3-7 0-11s3-7 0-11', 'M92 24c-3-4 3-7 0-11s3-7 0-11'];

function OvenScene({ state }) {
  const { glow, light } = SCENE[state];
  const warm = state !== 'closed';
  return (
    <svg viewBox="0 0 160 112" className="h-auto w-[220px] overflow-visible" aria-hidden="true">
      {state === 'live' &&
        STEAM.map((d, index) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke={GLYPH.outline}
            strokeWidth="2.2"
            strokeLinecap="round"
            className="opacity-0 motion-safe:animate-steam"
            style={{ animationDelay: `${index * 0.7}s` }}
          />
        ))}
      {state === 'delayed' && (
        // A kitchen timer on top of the oven, its hand going round.
        <g>
          <circle cx="80" cy="16" r="10" fill="white" stroke={GLYPH.outline} strokeWidth="2" />
          <rect x="77" y="3" width="6" height="3" rx="1" fill={GLYPH.outline} />
          <path
            d="M80 16V9.5"
            stroke={HOST_STATUS.stale.color}
            strokeWidth="2"
            strokeLinecap="round"
            className="motion-safe:animate-spin"
            style={{ transformOrigin: '80px 16px', animationDuration: '3s' }}
          />
          <circle cx="80" cy="16" r="1.6" fill={HOST_STATUS.stale.color} />
        </g>
      )}
      {state === 'closed' &&
        ['z', 'z', 'Z'].map((letter, index) => (
          <text
            key={index}
            x={112 + index * 7}
            y={24 - index * 6}
            fontFamily="JetBrains Mono, monospace"
            fontSize={8 + index * 2}
            fontWeight="600"
            fill="#A3B1C6"
            className="opacity-0 motion-safe:animate-snooze"
            style={{ animationDelay: `${index * 0.9}s` }}
          >
            {letter}
          </text>
        ))}

      {/* The oven: a control strip with two knobs and a light, then the window. */}
      <rect x="36" y="30" width="88" height="70" rx="9" fill="white" stroke={GLYPH.outline} strokeWidth="2.2" />
      <line x1="36" y1="45" x2="124" y2="45" stroke={GLYPH.outline} strokeWidth="2" />
      <circle cx="49" cy="37.5" r="3.2" fill="white" stroke={GLYPH.outline} strokeWidth="1.8" />
      <circle cx="60" cy="37.5" r="3.2" fill="white" stroke={GLYPH.outline} strokeWidth="1.8" />
      <circle
        cx="112"
        cy="37.5"
        r="2.6"
        fill={light}
        className={state === 'live' ? 'motion-safe:animate-pulse' : undefined}
      />
      <rect x="46" y="53" width="68" height="38" rx="6" fill={GLYPH.unlit} />
      {warm && (
        <rect
          x="46"
          y="53"
          width="68"
          height="38"
          rx="6"
          fill={glow}
          className="motion-safe:animate-oven-glow"
          style={{ opacity: state === 'live' ? 0.6 : 0.4 }}
        />
      )}
      <rect x="46" y="53" width="68" height="38" rx="6" fill="none" stroke={GLYPH.outline} strokeWidth="2" />
      {/* The loaf on its tray, rising (and still rising when late). */}
      <line x1="54" y1="84" x2="106" y2="84" stroke={GLYPH.outline} strokeWidth="2" strokeLinecap="round" />
      {warm && (
        <g
          className="motion-safe:animate-dough-rise"
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'center bottom',
            animationDuration: state === 'live' ? '3.2s' : '6s',
          }}
        >
          <path d="M64 83c0-12 7-18 16-18s16 6 16 18z" fill={LOAF} stroke={CRUST} strokeWidth="1.8" />
          <path d="M72 71l4 5M79 69l4 5M86 71l4 5" stroke={CRUST} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}
      {/* The handle, and when closed a sign hanging from it. */}
      <line x1="58" y1="49" x2="102" y2="49" stroke={GLYPH.outline} strokeWidth="2.4" strokeLinecap="round" />
      {state === 'closed' && (
        <g
          className="motion-safe:animate-sign-swing"
          style={{ transformBox: 'view-box', transformOrigin: '80px 49px' }}
        >
          <path d="M72 64L80 49l8 15" fill="none" stroke="#A3B1C6" strokeWidth="1.4" strokeLinejoin="round" />
          <rect
            x="60"
            y="63"
            width="40"
            height="17"
            rx="3.5"
            fill="white"
            stroke={HOST_STATUS.closed.color}
            strokeWidth="1.8"
          />
          <text
            x="80"
            y="74.6"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="8"
            fontWeight="700"
            letterSpacing="1"
            fill={HOST_STATUS.closed.color}
          >
            CLOSED
          </text>
        </g>
      )}
      {/* Feet on the counter. */}
      <line x1="46" y1="100" x2="46" y2="105" stroke={GLYPH.outline} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="114" y1="100" x2="114" y2="105" stroke={GLYPH.outline} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="22" y1="106" x2="138" y2="106" stroke={GLYPH.unlit} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// The card itself: the scene, a line for the state (a new one each time the
// card opens) and when the last batch of readings came out.
export function BakeryCard({ state, generatedAt, now }) {
  const [line] = useState(() => bakeryStateLine(state));
  const { title, panel } = SCENE[state];
  const age = now - generatedAt;
  return (
    <div>
      <div className="flex justify-center rounded-xl px-4 pb-3 pt-5" style={{ backgroundColor: panel }}>
        <OvenScene state={state} />
      </div>
      <h4 className="mt-4 font-tight text-base font-semibold leading-tight text-inkwell">{title}</h4>
      <p className="mt-1 text-sm leading-relaxed text-data-grey">
        {line}
        {state === 'delayed' && ' Fresh readings should be along soon.'}
        {state === 'closed' && ' The servers themselves may be running just fine.'}
      </p>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-border-light pt-3 font-mono text-[11px]">
        <dt className="text-data-grey">Last batch</dt>
        <dd className="text-right tabular-nums text-inkwell">
          {formatFullTime(generatedAt)} <span className="text-data-grey">· {formatAgo(age)}</span>
        </dd>
        <dt className="text-data-grey">Next batch</dt>
        <dd className="text-right text-inkwell">
          {state === 'live' ? 'Every minute' : state === 'delayed' ? 'Running late' : 'When the chefs are back'}
        </dd>
      </dl>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { GLYPH } from './DetailBoxes';
import { HOST_STATUS } from './config';
import { bakeryStateLine, pastryLine } from './easterEggs';
import { formatAgo, formatFullTime } from './format';
import { PASTRIES, RAW_COLORS } from './pastries';

// The bakery behind the page's "Live" dot, in three states: live, with the
// oven's window glowing, a pastry rising inside and steam curling off the top;
// delayed, the glow dimmed and a kitchen timer ticking on top; and closed (the
// monitor gone quiet), the window cold, a sign swinging from the handle and the
// oven dozing off. Viewers who prefer reduced motion get the still scene.
const SCENE = {
  live: {
    title: 'Welcome to the Tractable Bakery',
    glow: '#F4B860',
    light: HOST_STATUS.online.color,
    panel: '#FFF7EA',
  },
  delayed: {
    title: 'The bakery is running a little late',
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
const POWER_OFF = '#EDA748';
const STEAM = ['M68 24c-3-4 3-7 0-11s3-7 0-11', 'M80 22c-3-4 3-7 0-11s3-7 0-11', 'M92 24c-3-4 3-7 0-11s3-7 0-11'];

// A pastry and its shadow on the tray.
// doneness runs from 0, raw dough, to 1, baked: the colours warm from their
// raw shades through every shade between, the pastry rises a little, and the
// toppings go on over the last fifth.
function Pastry({ pastry, doneness = 1 }) {
  const cook = (color) => (RAW_COLORS[color] ? mixColor(RAW_COLORS[color], color, doneness) : color);
  const topping = Math.max(0, (doneness - 0.8) / 0.2);
  const rise = `translate(80 83) scale(${0.9 + 0.1 * doneness} ${0.7 + 0.3 * doneness}) translate(-80 -83)`;
  return (
    <>
      <ellipse cx="80" cy="83.3" rx={pastry.shadow} ry="1.5" fill="#8A6A3A" opacity="0.22" />
      <g transform={rise}>
        <g transform={pastry.transform}>
          {pastry.shapes.map(({ tag: Shape, topping: isTopping, fill, stroke, ...shape }, index) =>
            isTopping && topping <= 0 ? null : (
              <Shape
                key={index}
                {...shape}
                fill={cook(fill)}
                stroke={cook(stroke)}
                opacity={isTopping ? topping : undefined}
              />
            ),
          )}
        </g>
      </g>
    </>
  );
}

function mixColor(from, to, amount) {
  const channels = (hex) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
  const [a, b] = [channels(from), channels(to)];
  return `rgb(${a.map((value, index) => Math.round(value + (b[index] - value) * amount)).join(',')})`;
}

function OvenScene({ state, pastry, leaving, bake, on, doneness, rattle }) {
  const { glow, light } = SCENE[state];
  const warm = state !== 'closed';
  // Baking: the oven open for business and switched on.
  const baking = warm && on;
  return (
    <svg viewBox="0 0 160 112" className="h-auto w-[250px] overflow-visible" aria-hidden="true">
      {state === 'live' &&
        baking &&
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
      {/* The power knob turns a quarter round when the oven is on. */}
      <line
        x1="49"
        y1="37.5"
        x2="49"
        y2="35.2"
        stroke={GLYPH.outline}
        strokeWidth="1.6"
        strokeLinecap="round"
        style={{
          transformOrigin: '49px 37.5px',
          transform: `rotate(${baking ? 90 : 0}deg)`,
          transition: 'transform 0.5s ease-in-out',
        }}
      />
      <circle cx="60" cy="37.5" r="3.2" fill="white" stroke={GLYPH.outline} strokeWidth="1.8" />
      {warm ? (
        // The power button: breathing amber while the oven is off, so it is
        // easy to find, and lit in the state's colour once it is on.
        <g>
          {!baking && (
            <circle
              cx="112"
              cy="37.5"
              r="4.2"
              fill={POWER_OFF}
              className="motion-safe:animate-power-breathe"
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />
          )}
          {rattle > 0 && (
            // Asking to be switched off when the door is tried with the oven on.
            <circle
              key={`nudge-${rattle}`}
              cx="112"
              cy="37.5"
              r="4.2"
              fill={light}
              className="opacity-0 motion-safe:animate-power-nudge"
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />
          )}
          {baking && doneness < 1 && (
            // How far the bake has got, filling round the button.
            <circle
              cx="112"
              cy="37.5"
              r="6.3"
              fill="none"
              stroke={light}
              strokeWidth="1.3"
              strokeLinecap="round"
              pathLength="1"
              strokeDasharray={`${doneness} 1`}
              transform="rotate(-90 112 37.5)"
            />
          )}
          <circle cx="112" cy="37.5" r="4.2" fill={baking ? light : POWER_OFF} style={{ transition: 'fill 0.5s' }} />
          <path
            d="M112 34.7v2.3M110.1 35.7a2.6 2.6 0 1 0 3.8 0"
            fill="none"
            stroke="white"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <circle cx="112" cy="37.5" r="2.6" fill={GLYPH.outline} />
      )}
      {/* Inside the oven: its glow, the baking tray seen from a little above,
          and this batch's pastry resting on it with its shadow, rising (still
          rising when late). */}
      <rect x="46" y="53" width="68" height="38" rx="6" fill={GLYPH.unlit} />
      {warm && (
        <rect
          x="46"
          y="53"
          width="68"
          height="38"
          rx="6"
          fill={glow}
          // Warming up when switched on; cold and dark when off.
          className={baking ? 'motion-safe:animate-oven-glow' : undefined}
          style={{ opacity: baking ? (state === 'live' ? 0.6 : 0.4) : 0, transition: 'opacity 0.9s ease-in-out' }}
        />
      )}
      <rect x="46" y="53" width="68" height="38" rx="6" fill="none" stroke={GLYPH.outline} strokeWidth="1.2" />
      {/* When another one goes in (only with the oven off), the door swings down,
          the tray comes out towards the viewer, the last pastry is taken off
          to the right, the new one is set on from the left, the tray goes back
          in and the door swings shut again. */}
      <g
        key={`tray-${bake}`}
        className={bake ? 'motion-safe:animate-tray-out' : undefined}
        style={{ transformBox: 'view-box', transformOrigin: '80px 84px' }}
      >
        <path d="M57.5 80.5h45l3 4h-51z" fill="#E6EBF1" />
        <rect x="54.5" y="84.5" width="51" height="2.2" rx="1" fill={GLYPH.outline} />
        {warm && leaving && (
          <g key={`out-${bake}`} className="motion-safe:animate-pastry-out">
            <Pastry pastry={leaving.pastry} doneness={leaving.doneness} />
          </g>
        )}
        {warm && (
          <g
            key={`in-${bake}`}
            className={bake ? 'motion-safe:animate-pastry-enter' : 'motion-safe:animate-pastry-in'}
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center bottom',
            }}
          >
            <Pastry pastry={pastry} doneness={doneness} />
          </g>
        )}
      </g>
      {/* The door: its glass with a glint, its frame and its handle, hinged
          at the bottom. */}
      <g key={`rattle-${rattle}`} className={rattle ? 'motion-safe:animate-door-rattle' : undefined}>
        <g
          key={`door-${bake}`}
          className={bake ? 'motion-safe:animate-door-swing' : undefined}
          style={{ transformBox: 'view-box', transformOrigin: '80px 92px' }}
        >
          <rect x="46" y="53" width="68" height="38" rx="6" fill="white" opacity="0.12" />
          <path d="M52 64l7-7M55 66l4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
          <rect x="46" y="53" width="68" height="38" rx="6" fill="none" stroke={GLYPH.outline} strokeWidth="2" />
          <line x1="58" y1="49" x2="102" y2="49" stroke={GLYPH.outline} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      </g>
      {/* When closed, a sign hangs from the handle. */}
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
// How long a pastry takes to bake.
const BAKE_MS = 5000;

// How baked this batch's pastry is, 0 (raw) to 1: the first pastry comes
// baked, each new one starts raw, and it bakes only while the oven is on,
// pausing where it is when switched off. current is the latest value, for
// handlers.
function useDoneness(on, bake) {
  const [value, setValue] = useState(1);
  const current = useRef(1);
  current.current = value;
  useEffect(() => {
    if (bake) setValue(0);
  }, [bake]);
  const done = value >= 1;
  useEffect(() => {
    if (!on || done) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setValue(1);
      return undefined;
    }
    let last = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      // The time since the last frame, taken now: the update itself may run later.
      const elapsed = Math.max(0, now - last);
      last = now;
      setValue((previous) => Math.min(1, previous + elapsed / BAKE_MS));
      frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [on, done]);
  return { value, current: current.current };
}

export function BakeryCard({ state, generatedAt, now }) {
  // A random pastry when the card opens, and a different one each time a
  // baked one is taken out through the door. bake counts the swaps, leaving is
  // the pastry on its way out, and rattle counts tries of the locked door.
  const [batch, setBatch] = useState(() => ({
    index: Math.floor(Math.random() * PASTRIES.length),
    bake: 0,
    leaving: null,
    rattle: 0,
    line: bakeryStateLine(state),
    on: true,
  }));
  const doneness = useDoneness(batch.on, batch.bake);
  const swap = (current) => ({
    ...current,
    index: (current.index + 1 + Math.floor(Math.random() * (PASTRIES.length - 1))) % PASTRIES.length,
    bake: current.bake + 1,
    leaving: { pastry: PASTRIES[current.index], doneness: doneness.current },
    line: bakeryStateLine(state, current.line),
    // A fresh pastry waits raw in a cold oven until someone switches it on.
    on: false,
  });
  // A pastry comes out only once baked, with the oven off, and only when
  // someone opens the door: new readings leave the oven as it is.
  const ready = (current) => !current.on && doneness.current >= 1;
  // Once out of the oven, the last pastry is cleared away.
  useEffect(() => {
    if (!batch.leaving) return undefined;
    const timer = setTimeout(() => setBatch((current) => ({ ...current, leaving: null })), 2600);
    return () => clearTimeout(timer);
  }, [batch.bake, batch.leaving]);
  const pastry = PASTRIES[batch.index];
  const warm = state !== 'closed';
  // While live, the line follows the pastry and how far it has got, a new
  // one whenever either changes; delayed and closed have their own.
  const stage =
    doneness.value >= 1
      ? batch.on
        ? 'bakedOn'
        : 'bakedOff'
      : batch.on
        ? 'baking'
        : doneness.value > 0
          ? 'paused'
          : 'raw';
  const lineKey = `${batch.bake}-${stage}`;
  const [stageLine, setStageLine] = useState(() => ({ key: lineKey, text: pastryLine(stage, pastry) }));
  if (state === 'live' && stageLine.key !== lineKey) {
    setStageLine({ key: lineKey, text: pastryLine(stage, pastry, stageLine.text) });
  }
  const { title, panel } = SCENE[state];
  const age = now - generatedAt;
  return (
    <div>
      <div className="rounded-xl px-4 pb-3 pt-5" style={{ backgroundColor: panel }}>
        <div className="flex justify-center">
          {/* The drawing, with the oven door and its power button as buttons
              laid over it (sized to the 250px scene's 160 x 112 box). */}
          <div className="relative w-[250px]">
            <OvenScene
              state={state}
              pastry={pastry}
              leaving={warm ? batch.leaving : null}
              doneness={doneness.value}
              rattle={batch.rattle}
              bake={batch.bake}
              on={warm && batch.on}
            />
            {warm && (
              <>
                <button
                  type="button"
                  // Until the pastry is baked and the oven is off, the door stays
                  // shut: it rattles and the power button pulses.
                  onClick={() =>
                    setBatch((current) => (ready(current) ? swap(current) : { ...current, rattle: current.rattle + 1 }))
                  }
                  aria-label={
                    doneness.value < 1
                      ? `Bake ${pastry.name} before taking it out`
                      : batch.on
                        ? 'Turn the oven off before taking the pastry out'
                        : `Take out ${pastry.name} and bake something else`
                  }
                  className="absolute left-[72px] top-[73px] h-[73px] w-[106px] cursor-pointer rounded-lg transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20"
                />
                <button
                  type="button"
                  onClick={() => setBatch((current) => ({ ...current, on: !current.on }))}
                  aria-label={batch.on ? 'Turn the oven off' : 'Turn the oven on'}
                  aria-pressed={batch.on}
                  className="absolute left-[163px] top-[47px] h-[24px] w-[24px] cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20"
                />
              </>
            )}
          </div>
        </div>
      </div>
      <h4 className="mt-4 font-tight text-base font-semibold leading-tight text-inkwell">{title}</h4>
      <p className="mt-1 text-sm leading-relaxed text-data-grey">
        {state === 'live' ? stageLine.text : batch.line}
        {state === 'delayed' && ' Fresh readings should be along soon.'}
        {state === 'closed' && ' The servers themselves may be running just fine.'}
      </p>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-border-light pt-3 font-mono text-[11px]">
        {state !== 'closed' && (
          <>
            <dt className="text-data-grey">In the oven</dt>
            <dd className="whitespace-nowrap text-right text-inkwell">
              {pastry.the.replace(/^the /, '')}{' '}
              <span className="text-data-grey">
                ·{' '}
                {doneness.value <= 0
                  ? 'raw'
                  : doneness.value < 1
                    ? `baking ${Math.round(doneness.value * 100)}%`
                    : 'baked'}
              </span>
            </dd>
          </>
        )}
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

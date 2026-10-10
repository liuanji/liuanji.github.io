import { useEffect, useRef, useState } from 'react';
import { Pastry } from '../bakery/BakeryStatus';
import { DetailsPopover, GLYPH } from '../shared/DetailBoxes';
import { HOST_STATUS } from '../shared/config';
import { StatusPill } from '../shared/controls';
import { hostDownPhrase } from '../shared/easterEggs';
import { formatAgo, formatFullTime } from '../shared/format';
import { PASTRIES } from '../bakery/pastries';

// A server's status pill opens a little packing counter for it: a pile of six
// of the pastry the server is named after and a bakery box. While the server
// reports, the six hop one by one from the pile into the box, quicker the more
// of its GPUs are in use (and slower when it is late), dots on the box's label counting them; once all six are in, the lid
// goes on, the box is taken away, an empty one comes and six new pastries pop
// onto the pile. When it is unreachable or the bakery is closed the packing
// stops, the box says so and the pile dozes (under a cloth when closed).
// Viewers who prefer reduced motion get the still counter.

// Where the pile's pastries sit (their bottom centre), in the order they are
// packed: the top one first, then the middle row, then the bottom.
const PILE = [
  [52, 71],
  [61, 79.5],
  [43, 79.5],
  [70, 88],
  [52, 88],
  [34, 88],
];
const SIZE = 0.5;
// Where a pastry lands, inside the box.
const INTO = [112, 81];
const BOX = { kraft: '#ECD7B2', lid: '#E2C99C', inside: '#D9BE92', edge: '#C9A877', ink: '#A17A3A', dot: '#E8DCC4' };
// Milliseconds between pastries: from a relaxed pace with none of the server's
// GPUs in use to a quick one with all of them, and twice as slow while its
// readings are late (no packing at all when it is unreachable or closed). Then
// for a pastry's hop into the box, and for the box to be closed and taken
// away, and for a new one and a new pile.
const PACK_MS = { idle: 3600, busy: 800 };
const SLOWER = { online: 1, stale: 2 };
const FLIGHT_MS = 900;
const SEND_OFF_MS = 1300;
const REFILL_MS = 900;

function packEvery(status, load) {
  if (!SLOWER[status]) return null;
  return (PACK_MS.idle + (PACK_MS.busy - PACK_MS.idle) * Math.min(1, Math.max(0, load))) * SLOWER[status];
}

function Small({ pastry, at: [x, y] }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${SIZE}) translate(-80 -83)`}>
      <Pastry pastry={pastry} />
    </g>
  );
}

// A pastry on its way from its place in the pile into the box, in an arc.
function Flying({ pastry, from, duration }) {
  const element = useRef(null);
  useEffect(() => {
    const [dx, dy] = [INTO[0] - from[0], INTO[1] - from[1]];
    const peak = Math.min(0, dy) - 18;
    element.current?.animate(
      [
        { transform: 'translate(0px, 0px)', opacity: 1 },
        { transform: `translate(${dx * 0.5}px, ${peak}px)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx}px, ${dy - 14}px)`, opacity: 1, offset: 0.75 },
        { transform: `translate(${dx}px, ${dy}px)`, opacity: 1, offset: 0.95 },
        { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 },
      ],
      { duration, easing: 'ease-in-out', fill: 'forwards' },
    );
  }, [from, duration]);
  return (
    <g ref={element}>
      <Small pastry={pastry} at={from} />
    </g>
  );
}

// The packing: how many of this round's six are in the box, and whether the
// box is being sent off or a new round set out.
function usePacking(every, flight) {
  const [packing, setPacking] = useState({ round: 0, packed: 0, phase: 'packing' });
  useEffect(() => {
    if (!every || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const { phase, packed } = packing;
    const [wait, next] =
      phase === 'refill'
        ? [REFILL_MS, (current) => ({ ...current, phase: 'packing' })]
        : phase === 'sending'
          ? [SEND_OFF_MS, (current) => ({ round: current.round + 1, packed: 0, phase: 'refill' })]
          : packed < PILE.length
            ? [every, (current) => ({ ...current, packed: current.packed + 1 })]
            : [flight + 150, (current) => ({ ...current, phase: 'sending' })];
    const timer = setTimeout(() => setPacking(next), wait);
    return () => clearTimeout(timer);
  }, [packing, every, flight]);
  return packing;
}

// load is the share of the server's GPUs in use, which sets the pace.
function PackingScene({ pastry, status, load }) {
  const every = packEvery(status, load);
  const asleep = !every;
  // A hop never outlasts the gap to the next pastry.
  const flight = every ? Math.min(FLIGHT_MS, every * 0.85) : FLIGHT_MS;
  const { round, packed, phase } = usePacking(every, flight);
  return (
    <svg viewBox="8 34 144 60" className="h-auto w-[260px] overflow-visible" aria-hidden="true">
      {asleep &&
        ['z', 'z', 'Z'].map((letter, index) => (
          <text
            key={index}
            x={64 + index * 7}
            y={56 - index * 6}
            fontFamily="JetBrains Mono, monospace"
            fontSize={7 + index * 2}
            fontWeight="600"
            fill="#A3B1C6"
            className="opacity-0 motion-safe:animate-snooze"
            style={{ animationDelay: `${index * 0.9}s` }}
          >
            {letter}
          </text>
        ))}
      <line x1="18" y1="88.6" x2="142" y2="88.6" stroke={GLYPH.unlit} strokeWidth="2" strokeLinecap="round" />
      {/* The pile: the pastries not packed yet, bottom row first so the upper
          ones sit on top; a new round's pop in one after another. */}
      {PILE.map((at, index) => ({ at, index }))
        .reverse()
        .filter(({ index }) => index >= packed)
        .map(({ at, index }) => (
          <g
            key={`${round}-${index}`}
            className={round > 0 ? 'motion-safe:animate-pile-pop' : undefined}
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center bottom',
              animationDelay: `${(PILE.length - 1 - index) * 0.1}s`,
            }}
          >
            <Small pastry={pastry} at={at} />
          </g>
        ))}
      {status === 'closed' && (
        // A cloth over the pile while the bakery is closed.
        <path
          d="M24 88.5c0-12 10-24 28-24s28 12 28 24z"
          fill="#F4EFE7"
          stroke="#E2D8C8"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      )}
      {/* The box: its inside, the pastry on its way in, then its front with
          the label; full, it gets its lid and is taken away, and an empty one
          comes in its place. */}
      <g
        key={`box-${round}`}
        className={
          phase === 'sending'
            ? 'motion-safe:animate-box-leave'
            : round > 0
              ? 'motion-safe:animate-box-enter'
              : undefined
        }
      >
        <rect x="97" y="66" width="30" height="8" rx="1.2" fill={BOX.inside} />
        {phase === 'packing' && packed > 0 && (
          <Flying key={`${round}-${packed}`} pastry={pastry} from={PILE[packed - 1]} duration={flight} />
        )}
        <rect x="95" y="72" width="34" height="16.5" rx="2" fill={BOX.kraft} stroke={BOX.edge} strokeWidth="1.2" />
        {phase === 'sending' && (
          <rect
            x="93.5"
            y="65"
            width="37"
            height="7.5"
            rx="2"
            fill={BOX.lid}
            stroke={BOX.edge}
            strokeWidth="1.2"
            className="motion-safe:animate-box-lid"
          />
        )}
        <rect x="102" y="76" width="20" height="8.5" rx="2" fill="white" stroke="#E2CFA9" strokeWidth="0.8" />
        {asleep ? (
          <text
            x="112"
            y="82"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="5"
            fontWeight="700"
            letterSpacing="0.6"
            fill={HOST_STATUS.closed.color}
          >
            CLOSED
          </text>
        ) : phase === 'sending' ? (
          <path
            d="M108.5 80.2l2.2 2.2 4.6-4.6"
            fill="none"
            stroke={BOX.ink}
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          PILE.map((_, index) => (
            <circle
              key={index}
              cx={105 + index * 2.8}
              cy="80.25"
              r="0.95"
              fill={index < packed ? BOX.ink : BOX.dot}
              style={{ transition: `fill 0.3s ease ${flight * 0.8}ms` }}
            />
          ))
        )}
      </g>
    </svg>
  );
}

// A server's pile is of the pastry it is named after, or for any other name a
// pastry of its own, the same each time.
function pastryOf(host) {
  const named = PASTRIES.find((pastry) => pastry.the === `the ${host}`);
  if (named) return named;
  let sum = 0;
  for (const character of host) sum = (sum * 31 + character.codePointAt(0)) % 9973;
  return PASTRIES[sum % PASTRIES.length];
}

// The pastry's name for many of them.
function many(pastry) {
  const noun = pastry.the.replace(/^the /, '');
  return { toast: 'slices of toast', loaf: 'loaves' }[noun] ?? (pastry.plural ? noun : `${noun}s`);
}

const TITLES = {
  online: (host) => `Packing at ${host}`,
  stale: (host) => `${host} is running a little late`,
  error: (host) => `${host} is not answering`,
  closed: (host) => `${host}'s counter is closed for now`,
  unseen: (host) => `Waiting for ${host}`,
};

// One short line, so it fits on a single line of the card.
// While online it follows the pace: easy when the server is quiet, quick
// when it is busy.
function packingLine(status, host, pastry, load) {
  const them = many(pastry);
  const Them = them[0].toUpperCase() + them.slice(1);
  if (status === 'online') {
    const lines =
      load < 0.25
        ? [`Packing ${them} at an easy pace.`, `A quiet day: ${them}, one by one.`]
        : load < 0.75
          ? [`Boxing up fresh ${them}.`, `${Them}, six to a box.`, `Fresh ${them}, still warm.`]
          : [`Packing ${them} as fast as the ovens allow.`, `${Them} flying into boxes.`];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  if (status === 'stale') return 'The packing has slowed down for now.';
  if (status === 'error') return `${hostDownPhrase(host)}.`;
  if (status === 'closed') return `The ${them} rest under a cloth.`;
  return `No readings from ${host} yet.`;
}

function PackingCard({ host, status, reportedAt, now, load }) {
  const pastry = pastryOf(host);
  const [line] = useState(() => packingLine(status, host, pastry, load));
  return (
    <div>
      <div className="flex justify-center rounded-xl px-3 pb-3 pt-4" style={{ backgroundColor: '#F7F5F2' }}>
        <PackingScene pastry={pastry} status={status} load={load} />
      </div>
      <h4 className="mt-4 font-tight text-base font-semibold leading-tight text-inkwell">
        {(TITLES[status] ?? TITLES.unseen)(host)}
      </h4>
      <p className="mt-1 truncate text-sm leading-relaxed text-data-grey">{line}</p>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-border-light pt-3 font-mono text-[11px]">
        <dt className="text-data-grey">Last report</dt>
        <dd className="text-right tabular-nums text-inkwell">
          {reportedAt ? (
            <>
              {formatFullTime(reportedAt)} <span className="text-data-grey">· {formatAgo(now - reportedAt)}</span>
            </>
          ) : (
            'Not yet'
          )}
        </dd>
      </dl>
    </div>
  );
}

// A server's status pill, which opens its packing counter.
export function HostStatus({ host, now }) {
  return (
    <DetailsPopover
      content={
        <PackingCard
          host={host.name}
          status={host.status}
          reportedAt={host.data_sampled_at}
          now={now}
          load={host.gpus?.length ? host.gpus.filter((gpu) => gpu.busy).length / host.gpus.length : 0}
        />
      }
      width="w-[340px]"
    >
      <button
        type="button"
        aria-label={`${host.name}: ${(HOST_STATUS[host.status] ?? HOST_STATUS.unseen).label}. Show its counter.`}
        className="group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20"
      >
        <StatusPill
          status={host.status}
          className="bg-white group-hover:bg-[#F1F3F6] group-data-[state=open]:bg-[#ECEFF3]"
        />
      </button>
    </DetailsPopover>
  );
}

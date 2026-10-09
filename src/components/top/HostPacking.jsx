import { useState } from 'react';
import { Pastry } from './BakeryStatus';
import { DetailsPopover, GLYPH } from './DetailBoxes';
import { HOST_STATUS } from './config';
import { StatusPill } from './controls';
import { hostDownPhrase } from './easterEggs';
import { formatAgo, formatFullTime } from './format';
import { PASTRIES } from './pastries';

// A server's status pill opens a little packing counter for it: a pile of the
// pastry the server is named after and a bakery box, with the pastries hopping
// one by one from the pile into the box while the server reports (slower when
// it is late) and a count on the box's label. When it is unreachable or the
// bakery is closed the packing stops, a sign hangs on the box and the pile
// dozes (under a cloth when closed). Viewers who prefer reduced motion get the
// still counter.

// Where the pile's pastries sit (their bottom centre) and how small they are.
const PILE = [
  [34, 88],
  [52, 88],
  [70, 88],
  [43, 79.5],
  [61, 79.5],
];
const TOP = [52, 71];
const SIZE = 0.5;
const BOX = { kraft: '#ECD7B2', inside: '#D9BE92', edge: '#C9A877', ink: '#A17A3A' };
const PACKING_S = { online: 3, stale: 6 };

function Small({ pastry, at: [x, y] }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${SIZE}) translate(-80 -83)`}>
      <Pastry pastry={pastry} />
    </g>
  );
}

function PackingScene({ pastry, status, onPacked }) {
  const seconds = PACKING_S[status];
  const asleep = !seconds;
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
      {/* The pile, and its top pastry: hidden while its twin is on its way to
          the box, then restocked with a little pop. */}
      {PILE.map((at) => (
        <Small key={at.join()} pastry={pastry} at={at} />
      ))}
      <g
        className={seconds ? 'motion-safe:animate-pile-restock' : undefined}
        style={{ transformBox: 'fill-box', transformOrigin: 'center bottom', animationDuration: `${seconds}s` }}
      >
        <Small pastry={pastry} at={TOP} />
      </g>
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
      {/* The box: its inside, the pastry on its way in, then its front. */}
      <rect x="97" y="66" width="30" height="8" rx="1.2" fill={BOX.inside} />
      {seconds && (
        <g
          className="opacity-0 motion-safe:animate-pack-fly"
          style={{ animationDuration: `${seconds}s` }}
          onAnimationIteration={onPacked}
        >
          <Small pastry={pastry} at={TOP} />
        </g>
      )}
      <rect x="95" y="72" width="34" height="16.5" rx="2" fill={BOX.kraft} stroke={BOX.edge} strokeWidth="1.2" />
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
      ) : (
        <path
          d="M108.5 80.2l2.2 2.2 4.6-4.6"
          fill="none"
          stroke={BOX.ink}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
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

function packingLine(status, host, pastry) {
  const them = many(pastry);
  if (status === 'online') {
    const lines = [
      `Packing fresh ${them}, still warm from ${host}.`,
      `Boxing up ${them} as ${host}'s readings roll in.`,
      `${host} keeps the ${them} coming, a fresh batch of readings every minute.`,
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  if (status === 'stale') return `The packing has slowed down: ${host}'s next readings are running late.`;
  if (status === 'error') return `${hostDownPhrase(host)}. The monitor could not reach it on its last check.`;
  if (status === 'closed') {
    return `The ${them} wait under a cloth until the bakery reopens. ${host} itself may be running just fine.`;
  }
  return `No readings from ${host} yet.`;
}

function PackingCard({ host, status, reportedAt, now }) {
  const pastry = pastryOf(host);
  const [line] = useState(() => packingLine(status, host, pastry));
  const [packed, setPacked] = useState(0);
  const working = Boolean(PACKING_S[status]);
  return (
    <div>
      <div className="flex justify-center rounded-xl px-3 pb-3 pt-4" style={{ backgroundColor: '#FFF7EA' }}>
        <PackingScene pastry={pastry} status={status} onPacked={() => setPacked((count) => count + 1)} />
      </div>
      <h4 className="mt-4 font-tight text-base font-semibold leading-tight text-inkwell">
        {(TITLES[status] ?? TITLES.unseen)(host)}
      </h4>
      <p className="mt-1 text-sm leading-relaxed text-data-grey">{line}</p>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-border-light pt-3 font-mono text-[11px]">
        {working && (
          <>
            <dt className="text-data-grey">Packed</dt>
            <dd className="text-right tabular-nums text-inkwell">
              {packed} {packed === 1 ? pastry.the.replace(/^the /, '') : many(pastry)}
            </dd>
          </>
        )}
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
      content={<PackingCard host={host.name} status={host.status} reportedAt={host.data_sampled_at} now={now} />}
      width="w-[340px]"
    >
      <button
        type="button"
        aria-label={`${host.name}: ${(HOST_STATUS[host.status] ?? HOST_STATUS.unseen).label}. Show its counter.`}
        className="rounded-full transition-shadow hover:shadow-[0_0_0_3px_#F1F3F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20 data-[state=open]:shadow-[0_0_0_3px_#ECEFF3]"
      >
        <StatusPill status={host.status} />
      </button>
    </DetailsPopover>
  );
}

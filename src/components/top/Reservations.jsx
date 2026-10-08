import { useState } from 'react';
import { Bookmark, BookmarkPlus, Lock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DEFAULT_RESERVATION_MINUTES,
  MAX_RESERVATIONS_PER_USER,
  RESERVATION_CLASH,
  RESERVATION_MARKS,
  RESERVATION_MINUTES,
} from './config';
import { userColor } from './format';

// The live reservation of one GPU, if any.
export function findReservation(reservations, host, index, now) {
  return reservations.find((item) => item.host === host && item.gpu === index && item.ends_at > now) ?? null;
}

// People running on a reserved GPU other than the one who reserved it.
export function clashingUsers(gpu, reservation) {
  if (!reservation) return [];
  return gpu.users.map((user) => user.username).filter((name) => name !== reservation.user);
}

export function formatLeft(seconds) {
  // Rounded, as the page's clock ticks every 10 s.
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes}m`;
  return minutes % 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes / 60}h`;
}

function formatLength(minutes) {
  return minutes < 60 ? `${minutes} min` : `${minutes / 60} h`;
}

function formatClock(seconds) {
  return new Date(seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function names(list) {
  return list.length > 2 ? `${list.slice(0, -1).join(', ')} and ${list.at(-1)}` : list.join(' and ');
}

function ActionButton({ children, quiet = false, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20 ${
        quiet ? 'border border-border-light text-inkwell hover:bg-[#F6F7F9]' : 'bg-inkwell text-white'
      }`}
    >
      {children}
    </button>
  );
}

function ReserveForm({ host, gpu, held, onReserve, close }) {
  const [minutes, setMinutes] = useState(DEFAULT_RESERVATION_MINUTES);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const full = held >= MAX_RESERVATIONS_PER_USER;
  const busyWith = gpu.users.map((user) => user.username);

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      await onReserve(host, gpu.index, minutes);
      close();
    } catch (failure) {
      setError(failure.message);
      setPending(false);
    }
  };

  return (
    <>
      <h4 className="font-tight text-base font-semibold leading-tight text-inkwell">
        Reserve GPU {gpu.index} on {host}
      </h4>
      <p className="mt-1.5 text-xs leading-relaxed text-data-grey">
        <span className="font-medium text-inkwell">Only for debugging:</span> hold a GPU while you test and fix code,
        not for training runs. Everyone sees it is yours until the time is up or you release it.
      </p>
      <div role="radiogroup" aria-label="How long" className="mt-4 grid grid-cols-4 gap-1 rounded-lg bg-[#F1F3F6] p-1">
        {RESERVATION_MINUTES.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={minutes === option}
            onClick={() => setMinutes(option)}
            className={`rounded-md py-1 font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20 ${
              minutes === option ? 'bg-white text-inkwell shadow-sm' : 'text-data-grey hover:text-inkwell'
            }`}
          >
            {formatLength(option)}
          </button>
        ))}
      </div>
      {busyWith.length > 0 && (
        <p className="mt-3 text-xs text-data-grey">{names(busyWith)} {busyWith.length > 1 ? 'are' : 'is'} running on it right now.</p>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] text-data-grey">
          {full ? 'Release one of yours first' : `You hold ${held} of ${MAX_RESERVATIONS_PER_USER}`}
        </span>
        <ActionButton onClick={submit} disabled={pending || full}>
          {pending ? 'Reserving…' : `Reserve for ${formatLength(minutes)}`}
        </ActionButton>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-xs" style={{ color: RESERVATION_CLASH.color }}>
          {error}
        </p>
      )}
    </>
  );
}

function ReservationInfo({ host, gpu, reservation, me, now, onRelease, close }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const mine = reservation.user === me;
  const others = clashingUsers(gpu, reservation);
  const meClashing = others.includes(me);

  const release = async () => {
    setPending(true);
    setError(null);
    try {
      await onRelease(host, gpu.index);
      close();
    } catch (failure) {
      setError(failure.message);
      setPending(false);
    }
  };

  return (
    <>
      <h4 className="flex items-center gap-2 font-tight text-base font-semibold leading-tight text-inkwell">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: userColor(reservation.user) }} aria-hidden="true" />
        Reserved by {mine ? 'you' : reservation.user}
      </h4>
      <p className="mt-1.5 font-mono text-xs text-data-grey">
        {formatLeft(reservation.ends_at - now)} left · until {formatClock(reservation.ends_at)}
      </p>
      {others.length > 0 && (
        <p className="mt-3 text-xs leading-relaxed" style={{ color: RESERVATION_CLASH.color }}>
          {meClashing
            ? `You have jobs on this GPU, which ${reservation.user} reserved for debugging. Please move them elsewhere.`
            : `${names(others)} ${others.length > 1 ? 'are' : 'is'} running on it.`}
        </p>
      )}
      {mine ? (
        <div className="mt-4 flex justify-end">
          <ActionButton quiet onClick={release} disabled={pending}>
            {pending ? 'Releasing…' : 'Release now'}
          </ActionButton>
        </div>
      ) : (
        !meClashing && <p className="mt-3 text-xs text-data-grey">Please let {reservation.user} debug in peace.</p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-xs" style={{ color: RESERVATION_CLASH.color }}>
          {error}
        </p>
      )}
    </>
  );
}

// The corner icon of a GPU tile: a faint "reserve" mark on a free GPU, the
// viewer's own bookmark in lavender, or a grey lock on someone else's. Each
// opens a small box to reserve, release, or see who holds it.
export function ReserveControl({ host, gpu, reservation, me, held, now, onReserve, onRelease, className = '' }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const mine = reservation?.user === me;
  const label = reservation
    ? `Reserved by ${reservation.user === me ? 'you' : reservation.user}, ${formatLeft(reservation.ends_at - now)} left`
    : `Reserve ${host} GPU ${gpu.index}`;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className={`rounded-md p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20 ${
            reservation ? 'hover:bg-white/70' : 'text-data-grey/35 hover:bg-white hover:text-inkwell data-[state=open]:text-inkwell'
          } ${className}`}
          style={reservation ? { color: RESERVATION_MARKS[mine ? 'mine' : 'others'] } : undefined}
        >
          {mine ? (
            <Bookmark className="h-3.5 w-3.5" fill="currentColor" strokeWidth={2} aria-hidden="true" />
          ) : reservation ? (
            <Lock className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
          ) : (
            <BookmarkPlus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={6}
        collisionPadding={16}
        className="w-80 rounded-2xl border-border-light bg-white p-5 shadow-xl"
      >
        {reservation ? (
          <ReservationInfo host={host} gpu={gpu} reservation={reservation} me={me} now={now} onRelease={onRelease} close={close} />
        ) : (
          <ReserveForm host={host} gpu={gpu} held={held} onReserve={onReserve} close={close} />
        )}
      </PopoverContent>
    </Popover>
  );
}

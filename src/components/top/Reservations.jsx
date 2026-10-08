import { useState } from 'react';
import { Bookmark, BookmarkPlus, Lock } from 'lucide-react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DEFAULT_RESERVATION_MINUTES,
  MAX_RESERVATION_MINUTES,
  MAX_RESERVATIONS_PER_USER,
  RESERVATION_CLASH,
  RESERVATION_MARKS,
  RESERVATION_STEP_MINUTES,
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
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`;
}

// How long to reserve for, in steps of RESERVATION_STEP_MINUTES up to the
// maximum: a lavender slider with a tick at every step and the length above it.
function LengthSlider({ minutes, onChange }) {
  const steps = MAX_RESERVATION_MINUTES / RESERVATION_STEP_MINUTES;
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs text-data-grey">How long</span>
        <span className="font-mono text-xs font-medium text-inkwell">{formatLength(minutes)}</span>
      </div>
      <SliderPrimitive.Root
        value={[minutes]}
        onValueChange={([value]) => onChange(value)}
        min={RESERVATION_STEP_MINUTES}
        max={MAX_RESERVATION_MINUTES}
        step={RESERVATION_STEP_MINUTES}
        aria-label="How long to reserve"
        className="relative flex h-5 w-full touch-none select-none items-center"
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[#8478D6]/15">
          <SliderPrimitive.Range className="absolute h-full rounded-full" style={{ backgroundColor: RESERVATION_MARKS.mine }} />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-valuetext={formatLength(minutes)}
          className="block h-4 w-4 cursor-grab rounded-full border-2 bg-white shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8478D6]/30 active:cursor-grabbing"
          style={{ borderColor: RESERVATION_MARKS.mine }}
        />
      </SliderPrimitive.Root>
      {/* A tick per step, inset by the thumb's radius so each sits under its stop. */}
      <div className="relative mx-2 mt-1 h-1.5" aria-hidden="true">
        {Array.from({ length: steps }, (_, index) => (
          <span
            key={index}
            className="absolute top-0 h-1.5 w-px -translate-x-1/2 bg-data-grey/30"
            style={{ left: `${(index / (steps - 1)) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-0.5 flex justify-between font-mono text-[10px] text-data-grey/70" aria-hidden="true">
        <span>{formatLength(RESERVATION_STEP_MINUTES)}</span>
        <span>{formatLength(MAX_RESERVATION_MINUTES)}</span>
      </div>
    </div>
  );
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
      className={`flex-shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20 ${
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
      {/* The no-break space keeps the last word from wrapping alone. */}
      <p className="mt-1.5 text-pretty text-xs leading-relaxed text-data-grey">
        <span className="font-medium text-inkwell">Only for debugging:</span> hold a GPU while you test and fix code,
        not for training runs. Everyone sees it is yours until the time is up or you release{'\u00a0'}it.
      </p>
      <LengthSlider minutes={minutes} onChange={setMinutes} />
      {busyWith.length > 0 && (
        <p className="mt-3 text-xs text-data-grey">{names(busyWith)} {busyWith.length > 1 ? 'are' : 'is'} running on it right now.</p>
      )}
      {/* At the limit there is nothing to press, so the note takes the whole line. */}
      {full ? (
        <p className="mt-4 rounded-lg bg-[#F6F7F9] px-3 py-2 text-pretty text-xs leading-relaxed text-data-grey">
          You already hold {MAX_RESERVATIONS_PER_USER} GPUs, the most allowed. Release one of them to reserve{'\u00a0'}this.
        </p>
      ) : (
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] text-data-grey">
            You hold {held} of {MAX_RESERVATIONS_PER_USER}
          </span>
          <ActionButton onClick={submit} disabled={pending}>
            {pending ? 'Reserving…' : `Reserve for ${formatLength(minutes)}`}
          </ActionButton>
        </div>
      )}
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
        <p className="mt-3 text-pretty text-xs leading-relaxed" style={{ color: RESERVATION_CLASH.color }}>
          {meClashing
            ? `You have jobs on this GPU, which ${reservation.user} reserved for debugging. Please move them\u00a0elsewhere.`
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

// A reservation's mark: the viewer's own bookmark in lavender, or a grey lock;
// amber while someone other than the holder runs on the GPU.
export function ReservationMark({ mine, clash = false, className = 'h-3.5 w-3.5' }) {
  const color = clash ? RESERVATION_CLASH.mark : RESERVATION_MARKS[mine ? 'mine' : 'others'];
  return mine ? (
    <Bookmark className={className} style={{ color }} fill="currentColor" strokeWidth={2} aria-hidden="true" />
  ) : (
    <Lock className={className} style={{ color }} strokeWidth={2.25} aria-hidden="true" />
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
        >
          {reservation ? (
            <ReservationMark mine={mine} clash={clashingUsers(gpu, reservation).length > 0} />
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

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// The time range switch again, as a slim column floating in the left margin
// while the reader is inside the "Over time" section but has scrolled its own
// switch out of view. It slides in and out, and only on screens wide enough to
// leave the margin free.
export default function RangeRail({ options, value, onChange, anchor, section }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const control = anchor.current?.getBoundingClientRect();
      const area = section.current?.getBoundingClientRect();
      if (!control || !area) return;
      // Past the switch, down to the end of the section's last card (the user ranking).
      setShown(control.bottom < 64 && area.bottom > 160);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [anchor, section]);

  // In the body, since the page's animated wrapper would pin a fixed element to itself.
  return createPortal(
    <nav
      aria-label="Time range"
      aria-hidden={!shown}
      // Just left of the page's 72rem column, out of the way of its content.
      style={{ left: 'max(1rem, calc((100vw - 72rem) / 2 - 2.5rem))' }}
      className={`fixed top-1/2 z-30 hidden -translate-y-1/2 transition-all duration-300 ease-out min-[1320px]:block ${
        shown ? 'translate-x-0 opacity-100' : 'pointer-events-none -translate-x-3 opacity-0'
      }`}
    >
      <div className="flex flex-col gap-0.5 rounded-xl border border-border-light bg-white/95 p-1 shadow-sm backdrop-blur-sm">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              tabIndex={shown ? 0 : -1}
              aria-pressed={active}
              title={option.title}
              onClick={() => onChange(option.value)}
              className={`rounded-lg px-2 py-1.5 font-mono text-[11px] transition-colors ${
                active ? 'bg-inkwell text-white' : 'text-data-grey hover:bg-paper hover:text-inkwell'
              }`}
            >
              {option.value === '365d' ? '1y' : option.value}
            </button>
          );
        })}
      </div>
    </nav>,
    document.body,
  );
}

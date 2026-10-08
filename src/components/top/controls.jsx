import { HOST_STATUS } from './config';

// aside sits at the right end of the label's row, e.g. a view switch.
export function SectionLabel({ children, aside = null }) {
  return (
    <div className="mb-5 flex min-h-6 items-center justify-between gap-4">
      <div className="font-mono text-xs text-data-grey/70 uppercase tracking-widest">{children}</div>
      {aside}
    </div>
  );
}

export function Switch({ label, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center gap-2.5 rounded-full py-0.5 font-mono text-xs text-data-grey transition-colors hover:text-inkwell focus-visible:outline-none"
    >
      {label}
      <span
        className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 group-focus-visible:ring-2 group-focus-visible:ring-inkwell/30 group-focus-visible:ring-offset-2 ${
          checked ? 'bg-inkwell' : 'bg-border-light group-hover:bg-data-grey/30'
        }`}
        aria-hidden="true"
      >
        <span
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
}

// children go below the caption, such as a period tile's sparkline.
export function StatTile({ label, value, total = null, caption = null, className = '', children = null }) {
  return (
    <div className={`bg-white rounded-2xl border border-border-light p-5 ${className}`}>
      <div className="font-mono text-xs text-data-grey">{label}</div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-tight font-semibold text-3xl text-inkwell leading-none">{value}</span>
        {total != null && <span className="font-tight text-base text-data-grey">/ {total}</span>}
      </div>
      {caption && <div className="text-xs text-data-grey mt-2 leading-snug">{caption}</div>}
      {children}
    </div>
  );
}

export function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-border-light bg-white p-1"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active ? 'bg-inkwell text-white' : 'text-data-grey hover:bg-paper hover:text-inkwell'
            }`}
          >
            {option.dot && (
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: option.dot }} aria-hidden="true" />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// An online server's dot breathes like a power LED; other states stay still.
export function StatusPill({ status }) {
  const { label, color } = HOST_STATUS[status] ?? HOST_STATUS.unseen;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-light bg-white px-2.5 py-0.5 font-mono text-xs text-inkwell">
      <span
        className={`h-1.5 w-1.5 rounded-full ${status === 'online' ? 'motion-safe:animate-breathe' : ''}`}
        style={{ backgroundColor: color, color }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export function LiveDot({ color, pulse = false }) {
  return (
    <span className="relative flex h-2 w-2" aria-hidden="true">
      {pulse && (
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

export function Notice({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-border-light px-7 py-10 text-center">
      <h3 className="font-tight font-semibold text-lg text-inkwell">{title}</h3>
      <p className="text-sm text-data-grey mt-2 max-w-md mx-auto leading-relaxed">{children}</p>
    </div>
  );
}

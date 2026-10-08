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

// icon is { glyph, color }: a small badge tinted with color, holding glyph, in
// the tile's top-right corner.
export function StatTile({ label, value, total = null, caption = null, icon = null, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-border-light p-5 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="font-mono text-xs text-data-grey">{label}</div>
        {icon && (
          <span
            className="-mr-1.5 -mt-1.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${icon.color}14` }}
            aria-hidden="true"
          >
            {icon.glyph}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-tight font-semibold text-3xl text-inkwell leading-none">{value}</span>
        {total != null && <span className="font-tight text-base text-data-grey">/ {total}</span>}
      </div>
      {caption && <div className="text-xs text-data-grey mt-2 leading-snug">{caption}</div>}
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

// A server name that opens the server's own panel; on hover a soft underline
// draws itself in from the left (a growing background line). Without onOpen it
// is plain text.
export function ServerLink({ name, onOpen, className = '' }) {
  // Padded like the button, so the name sits in the same place either way.
  if (!onOpen) return <span className={`pb-0.5 ${className}`}>{name}</span>;
  return (
    <button
      type="button"
      onClick={() => onOpen(name)}
      aria-label={`Open ${name}'s panel`}
      className={`rounded-sm bg-[linear-gradient(#CBD5E1,#CBD5E1)] bg-[length:0%_2px] bg-[position:0_100%] bg-no-repeat pb-0.5 text-left transition-[background-size] duration-300 ease-out hover:bg-[length:100%_2px] focus-visible:bg-[length:100%_2px] focus-visible:outline-none ${className}`}
    >
      {name}
    </button>
  );
}

// A notice at the top of the page: a quiet white card with a border and an
// icon in a soft circle, both in color (a hex hue), and the message beside them.
// tinted washes the card faintly in the colour too, for the most urgent notices.
export function Banner({ icon: Icon, color, iconColor = color, role = 'status', tinted = false, children }) {
  return (
    <div
      role={role}
      className="flex items-start gap-3.5 rounded-2xl border bg-white px-4 py-3.5"
      style={{ borderColor: `${color}73`, backgroundImage: tinted ? `linear-gradient(${color}0D, ${color}0D)` : undefined }}
    >
      <span
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}26` }}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" style={{ color: iconColor }} strokeWidth={2.25} />
      </span>
      <div className="min-w-0 pt-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

// A name in a banner that opens what it names, underlined faintly in color.
export function BannerLink({ color, onClick, children }) {
  if (!onClick) return <span className="font-medium text-inkwell">{children}</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-medium text-inkwell underline decoration-1 underline-offset-[3px] transition-colors"
      style={{ textDecorationColor: `${color}80` }}
      onMouseEnter={(event) => (event.currentTarget.style.textDecorationColor = color)}
      onMouseLeave={(event) => (event.currentTarget.style.textDecorationColor = `${color}80`)}
    >
      {children}
    </button>
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

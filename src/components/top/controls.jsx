import { createContext, useContext, useState } from 'react';
import { HOST_STATUS } from './config';
import { hostDownPhrase } from './easterEggs';
import { formatAgo } from './format';

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

// A small rounded switch between a few views, the chosen one on a pale fill:
// options are [value, label] pairs.
export function Segmented({ label, options, value, onChange, className = '' }) {
  return (
    <span
      role="radiogroup"
      aria-label={label}
      className={`inline-flex rounded-full border border-border-light p-0.5 font-mono text-[11px] ${className}`}
    >
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          onClick={() => onChange(key)}
          className={`whitespace-nowrap rounded-full px-2.5 py-0.5 transition-colors ${
            value === key ? 'bg-[#F1F5F9] text-inkwell' : 'text-data-grey/70 hover:text-inkwell'
          }`}
        >
          {text}
        </button>
      ))}
    </span>
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
        {total != null && <span className="font-tight text-base text-data-grey leading-none">/ {total}</span>}
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

// A quiet switch inside a card, such as which server a chart shows: plain
// words, the chosen one in ink on a soft underline; the others grey, drawing
// their underline in on hover like a server's name does.
export function TextTabs({ label, options, value, onChange }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`whitespace-nowrap rounded-sm bg-no-repeat pb-0.5 text-sm transition-[color,background-size] duration-300 ease-out [background-position:0_100%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20 ${
              active
                ? 'font-medium text-inkwell [background-size:100%_2px]'
                : 'text-data-grey [background-size:0%_2px] hover:text-inkwell hover:[background-size:100%_2px]'
            }`}
            style={{
              backgroundImage: `linear-gradient(${active ? '#334155' : '#CBD5E1'}, ${active ? '#334155' : '#CBD5E1'})`,
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// A list of people (or anything) that shows about `visible` rows and scrolls
// the rest, so a busy server never makes a card or box tall. rowRem is one row
// with its spacing; a little of the next row peeks out, and the last visible
// row fades until the end is reached. Scrolling it never scrolls the page.
export function ScrollList({ count, visible = 5, rowRem, className = '', children }) {
  const [atEnd, setAtEnd] = useState(false);
  const scrolls = count > visible;
  return (
    <ul
      onScroll={(event) => {
        const list = event.currentTarget;
        setAtEnd(list.scrollTop + list.clientHeight >= list.scrollHeight - 2);
      }}
      className={`-mr-2 overflow-y-auto overscroll-contain pb-1 pr-2 [scrollbar-width:thin] ${
        scrolls && !atEnd ? '[mask-image:linear-gradient(to_bottom,black_75%,transparent)]' : ''
      } ${className}`}
      style={scrolls ? { maxHeight: `${(visible + 0.3) * rowRem}rem` } : undefined}
    >
      {children}
    </ul>
  );
}

// A notice at the top of the page: a quiet white card with a border and an
// icon in a soft circle, both in color (a hex hue), and the message beside them.
// tinted washes the card faintly in the colour too, for the most urgent notices.
// Inside the notes card the notices drop their own frame, so they read as one card.
export const PlainBanners = createContext(false);

export function Banner({ icon: Icon, color, iconColor = color, role = 'status', tinted = false, children }) {
  const plain = useContext(PlainBanners);
  return (
    <div
      role={role}
      className={`flex items-start gap-3.5 ${plain ? 'py-3' : 'rounded-2xl border bg-white px-4 py-3.5'}`}
      style={
        plain
          ? undefined
          : {
              borderColor: `${color}73`,
              backgroundImage: tinted ? `linear-gradient(${color}0D, ${color}0D)` : undefined,
            }
      }
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
      data-banner-link
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

// Laid over a server's dimmed GPUs while it is not reporting: a bakery line in
// the middle and when it last reported. The parent is relative.
export function DownNotice({ host, now }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
      <div className="rounded-xl border border-border-light bg-white/90 px-5 py-3 text-center shadow-sm backdrop-blur-[1px]">
        {host.status === 'closed' || host.status === 'stale' ? (
          // Late or missing readings say nothing about the server itself, only
          // that the monitor has not sent fresh ones: a late batch, or the
          // whole bakery closed for now.
          <>
            <p className="font-tight text-sm font-medium text-inkwell">
              {host.status === 'closed'
                ? `${host.name}'s counter is closed for now`
                : `${host.name}'s next batch is running late`}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-data-grey">
              {host.data_sampled_at
                ? host.status === 'closed'
                  ? `Last fresh batch ${formatAgo(now - host.data_sampled_at)}`
                  : `Last reported ${formatAgo(now - host.data_sampled_at)}; fresh readings should be along soon`
                : 'No readings yet'}
            </p>
          </>
        ) : (
          <>
            <p className="font-tight text-sm font-medium text-inkwell">{hostDownPhrase(host.name)}</p>
            <p className="mt-0.5 font-mono text-[11px] text-data-grey">
              {host.data_sampled_at
                ? `Last reported ${formatAgo(now - host.data_sampled_at)}; these readings are out of date`
                : 'No readings yet'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

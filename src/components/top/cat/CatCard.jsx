import { useState } from 'react';
import { CatScene, MOODS, STAGES, APPETITE, moodOf, stageOf } from './BakeryCat';
import { DetailsPopover } from '../shared/DetailBoxes';
import { Switch } from '../shared/controls';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// The bakery cat's name until it can be changed.
const NAME = 'Mochi';

function cookies(count) {
  if (!count) return '0';
  return count < 1 ? '< 1' : Math.round(count).toLocaleString('en');
}

// A line for its mood, crediting the server most of this week's cookies came from.
function moodLine(mood, meal) {
  const from = meal?.hosts?.[0]?.name;
  const source = from ? `, mostly cookies from ${from}` : '';
  switch (mood) {
    case 'napping':
      return `${NAME} hasn't had a cookie for a few days. The next one will wake it up.`;
    case 'hungry':
      return `${NAME} could do with a few more cookies${source}.`;
    case 'content':
      return `${NAME} is eating steadily${source}.`;
    case 'purring':
      return `${NAME} has eaten well lately${source}.`;
    default:
      return `${NAME} is as full as a cat gets${source}.`;
  }
}

// Things it can be asked to do while it roams, as the roaming cat knows them.
// The GPU card visits need a running GPU's tile fully in view.
const ACTIONS = [
  [
    'Moves',
    [
      ['move:walk', 'Walk'],
      ['move:run', 'Run'],
      ['mishap:sniff', 'Stop to sniff'],
      ['mishap:spook', 'Get spooked'],
      ['mishap:pounce', 'Pounce on a speck'],
    ],
  ],
  [
    'By itself',
    [
      ['doing:butterfly', 'Watch a butterfly'],
      ['doing:box', 'Sit in a box'],
      ['doing:croissant', 'Knock off a croissant'],
      ['doing:sunbeam', 'Nap in a sunbeam'],
      ['doing:tail', 'Chase its tail'],
      ['doing:yawn', 'Yawn'],
      ['doing:sneeze', 'Sneeze'],
      ['doing:crumb', 'Find a crumb'],
      ['doing:dance', 'Dance'],
      ['doing:birdwatch', 'Watch a bird'],
      ['doing:scratch', 'Scratch'],
      ['doing:dough', 'Pat some dough'],
      ['doing:backflip', 'Backflip'],
      ['act:groom', 'Groom'],
      ['act:knead', 'Knead'],
      ['act:belly', 'Roll belly-up'],
      ['act:beg', 'Beg'],
      ['act:sleep', 'Nap'],
      ['act:zoom', 'Zoomies'],
    ],
  ],
  [
    'With you',
    [
      ['wish:rub', 'Belly rub'],
      ['wish:brush', 'Brushing'],
      ['wish:photo', 'Photo shoot'],
      ['game:yarn', 'Yarn'],
      ['game:feather', 'Feather wand'],
      ['game:laser', 'Laser pointer'],
      ['game:mouse', 'Wind-up mouse'],
      ['game:bubbles', 'Bubbles'],
    ],
  ],
  [
    'GPU cards',
    [
      ['gpu:warm', 'Warm nap on the hottest'],
      ['gpu:spin', 'Spin a ring'],
      ['gpu:peekaboo', 'Peekaboo'],
      ['gpu:wobble', 'Bounce on one till it tips'],
      ['gpu:wheel', 'Run on a ring'],
      ['gpu:swing', 'Swing from a ring'],
      ['gpu:steal', 'Steal one'],
      ['gpu:kick', 'Kick one off'],
      ['gpu:oil', 'Get an idle one running'],
    ],
  ],
  [
    'Treats',
    [
      ['treat:toss', 'Toss and catch'],
      ['treat:beg', 'Hand-feed'],
      ['treat:hunt', 'Treat hunt'],
      ['treat:bowl', 'A little bowl'],
    ],
  ],
  [
    'Toys',
    [
      ['toss:ball', 'Bouncy ball'],
      ['toss:feather', 'Drifting feather'],
      ['toss:mouse', 'Toy mouse'],
    ],
  ],
];

// A barely-there button beside the roam switch with everything it can be
// asked to do; picked, it does it.
// Which GPUs' tiles are fully in view, running and idle, for the cat to visit.
function gpusInView() {
  const inView = (selector) =>
    [...document.querySelectorAll(selector)].some((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 40 && rect.top > 120 && rect.bottom < window.innerHeight - 10;
    });
  return { running: inView('[data-cat-gpu][data-busy]'), idle: inView('[data-cat-gpu]:not([data-busy])') };
}

const isGpuGroup = (actions) => actions[0][0].startsWith('gpu:');

// The GPU visits that move or shake a card, not offered in quiet mode.
const MOVES_CARDS = new Set(['gpu:wobble', 'gpu:steal', 'gpu:kick', 'gpu:spin', 'gpu:wheel', 'gpu:swing']);

function ActionsMenu({ quiet = false }) {
  const [gpus, setGpus] = useState({ running: false, idle: false });
  return (
    <DropdownMenu onOpenChange={(open) => open && setGpus(gpusInView())}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Ask ${NAME} to do something`}
          className="flex h-5 items-center gap-[3px] rounded-full px-1.5 opacity-30 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20 data-[state=open]:opacity-100"
        >
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="h-[3px] w-[3px] rounded-full bg-data-grey" />
          ))}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-y-auto font-mono text-[11px]">
        {ACTIONS.map(([group, actions], index) => (
          <div key={group}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="py-1 text-[10px] font-normal uppercase tracking-wide text-data-grey">
              {group}
              {isGpuGroup(actions) && !gpus.running && !gpus.idle && (
                <span className="block whitespace-nowrap normal-case tracking-normal text-data-grey/70">
                  Scroll a GPU into view
                </span>
              )}
            </DropdownMenuLabel>
            {actions.map(([code, label]) => (
              <DropdownMenuItem
                key={code}
                disabled={
                  (quiet && MOVES_CARDS.has(code)) ||
                  (code.startsWith('gpu:') && !(code === 'gpu:oil' ? gpus.idle : gpus.running))
                }
                className="py-1 text-[11px]"
                onSelect={() => window.dispatchEvent(new CustomEvent('bakery-cat-do', { detail: code }))}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// The card the cat button opens: the cat in its mood and at its age, how much
// it ate this week and today, and how it grows.
function CatDetails({ meal, roaming, onRoam, quiet, onQuiet }) {
  const mood = moodOf(meal);
  const hours = meal?.lifetime_gpu_hours ?? 0;
  const stage = stageOf(hours);
  const next = STAGES.find((item) => item.from > hours);
  const today = meal?.today ?? 0;
  return (
    <div>
      <div className="flex justify-center rounded-xl px-4 pb-2 pt-3" style={{ backgroundColor: '#F7F5F2' }}>
        <CatScene mood={mood} stage={stage} today={today} away={roaming} className="h-auto w-[250px]" />
      </div>
      <h4 className="mt-4 font-tight text-base font-semibold leading-tight text-inkwell">
        {roaming ? `${NAME} is out roaming the page` : MOODS[mood].title(NAME)}
      </h4>
      <p className="mt-1 text-sm leading-relaxed text-data-grey">{moodLine(mood, meal)}</p>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-border-light pt-3 font-mono text-[11px]">
        <dt className="text-data-grey">Fed this week</dt>
        <dd className="text-right tabular-nums text-inkwell">{cookies(meal?.week)} cookies</dd>
        <dt className="text-data-grey">Eaten today</dt>
        <dd className="text-right tabular-nums text-inkwell">{cookies(today)} cookies</dd>
        {/* How full its tummy is today, against its appetite. */}
        <dt className="text-data-grey">Tummy</dt>
        <dd className="flex items-center justify-end gap-2 tabular-nums text-inkwell">
          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[#F3E6D6]">
            <span
              className="block h-full rounded-full bg-[#E39A55]"
              style={{ width: `${Math.min(100, (today / APPETITE) * 100)}%` }}
            />
          </span>
          <span className="w-[4ch] text-right">
            {today >= APPETITE ? 'full' : `${Math.round((today / APPETITE) * 100)}%`}
          </span>
        </dd>
        <dt className="text-data-grey">Age</dt>
        <dd className="text-right text-inkwell">{stage.label}</dd>
        {next && (
          <>
            <dt className="text-data-grey">Next</dt>
            <dd className="text-right text-inkwell">
              {next.label.replace(/ cat$/, '')}{' '}
              <span className="text-data-grey">· {next.from.toLocaleString('en')} h</span>
            </dd>
          </>
        )}
      </dl>
      {/* Letting it out to roam the page (treats and toys are in its menu, a click on it away). */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border-light pt-3">
        <Switch label={`Let ${NAME} roam the page`} checked={roaming} onChange={onRoam} />
        {roaming && <ActionsMenu quiet={quiet} />}
      </div>
      {/* Quiet mode: it plays without moving or shaking anything of the page's. */}
      <div className="mt-2 flex items-center gap-2">
        <Switch label="Quiet mode" checked={Boolean(quiet)} onChange={onQuiet} />
        <span className="font-mono text-[10px] text-data-grey/70">leaves the cards be</span>
      </div>
    </div>
  );
}

// Its owner's name, which opens the cat's card; on hover a soft underline draws
// itself in from the left, as on the server names. A roaming cat sets off from
// here (data-cat-home).
export function CatButton({ user, meal, roaming, onRoam, quiet, onQuiet }) {
  const mood = moodOf(meal);
  return (
    <DetailsPopover
      content={<CatDetails meal={meal} roaming={roaming} onRoam={onRoam} quiet={quiet} onQuiet={onQuiet} />}
      width="w-[320px]"
    >
      <button
        type="button"
        data-cat-home
        aria-label={`${user}. ${NAME}, your bakery cat, is ${MOODS[mood].label}. Show it.`}
        className="rounded-sm bg-[linear-gradient(#CBD5E1,#CBD5E1)] bg-[length:0%_1.5px] bg-[position:0_100%] bg-no-repeat pb-0.5 text-inkwell transition-[background-size] duration-300 ease-out hover:bg-[length:100%_1.5px] focus-visible:bg-[length:100%_1.5px] focus-visible:outline-none data-[state=open]:bg-[length:100%_1.5px]"
      >
        {user}
      </button>
    </DetailsPopover>
  );
}

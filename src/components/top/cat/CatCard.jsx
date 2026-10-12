import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CatScene, MOODS, STAGES, APPETITE, moodOf, stageOf } from './BakeryCat';
import { DetailsPopover } from '../shared/DetailBoxes';
import { joyLevel, useJoy } from './joy';
import { ScrapbookDialog } from './Scrapbook';
import { SCRAPBOOK_SIZE, useScrapbook } from './scrapbook';
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

// Her spirits today (kept in this browser), as a word and a colour, and a line
// for when they are low.
const JOY_COLORS = { sad: '#9FB4E8', glum: '#B7C3D6', fine: '#E8B4BE', happy: '#E39AAE' };
const JOY_LINES = {
  sad: ` She's feeling low today; some play would cheer her up.`,
  glum: ` A little attention would lift her spirits.`,
};

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
      ['doing:tail', 'Chase its tail'],
      ['doing:sneeze', 'Sneeze'],
      ['doing:crumb', 'Find a crumb'],
      ['doing:dance', 'Dance'],
      ['doing:birdwatch', 'Watch a bird'],
      ['doing:scratch', 'Scratch'],
      ['doing:dough', 'Pat some dough'],
      ['doing:backflip', 'Backflip'],
      ['doing:notes', 'Visit your notes'],
      ['doing:emptybowl', 'Show you an empty bowl'],
      ['doing:rumble', 'Tummy rumble'],
      ['doing:foodcoma', 'Food coma'],
      ['doing:pronk', 'Pronk for joy'],
      ['doing:pebble', 'Kick a pebble'],
      ['doing:fling', 'Bat something off the screen'],
      ['act:groom', 'Groom'],
      ['act:knead', 'Knead'],
      ['act:belly', 'Roll belly-up'],
      ['act:beg', 'Beg'],
      ['act:zoom', 'Zoomies'],
    ],
  ],
  [
    'Naps',
    [
      ['bed:basket', 'In a bread basket'],
      ['bed:banneton', 'In a proofing basket'],
      ['bed:donut', 'On a doughnut bed'],
      ['bed:sack', 'On a flour sack'],
      ['bed:croissant', 'On a croissant cushion'],
      ['bed:towel', 'Under a tea towel'],
      ['doing:sunbeam', 'In a sunbeam'],
      ['doing:doze', 'Nod off'],
      ['doing:flop', 'Flop over'],
      ['doing:dream', 'Dream of cookies'],
      ['act:sleep', 'Curl up'],
      ['doing:yawn', 'Yawn'],
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
      ['follow:glide', 'Follow me, gliding'],
      ['follow:jet', 'Follow me on a toaster jetpack'],
      ['follow:broom', 'Follow me on a broomstick'],
      ['follow:paddle', 'Follow me, paddling'],
      ['follow:croissant', 'Follow me on a flying croissant'],
      ['follow:balloon', 'Follow me with a balloon'],
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
      ['treat:taiyaki', 'A warm taiyaki'],
      ['treat:cupcake', 'A birthday cupcake'],
      ['treat:sushi', 'Sushi on a conveyor belt'],
      ['treat:descent', 'Gradient descent'],
      ['treat:fishing', 'Go fishing'],
    ],
  ],
  [
    'Toys',
    [
      ['toss:ball', 'Bouncy ball'],
      ['toss:feather', 'Drifting feather'],
      ['toss:mouse', 'Toy mouse'],
      ['toss:roomba', 'Ride a robot vacuum'],
      ['toss:plane', 'A paper aeroplane'],
      ['toss:bag', 'A paper bag'],
      ['toss:wrap', 'Bubble wrap'],
      ['toss:kite', 'Fly a kite'],
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
  // Two levels: the kinds of thing first; a click on one shows its things,
  // with a way back up. It opens on the kinds each time.
  const [kind, setKind] = useState(null);
  const content = useRef(null);
  // Into a kind and back, the menu keeps the focus (for the arrow keys).
  useEffect(() => content.current?.focus(), [kind]);
  const opened = ACTIONS.find(([group]) => group === kind);
  const stay = (next) => (event) => {
    event.preventDefault();
    setKind(next);
  };
  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) setGpus(gpusInView());
        else setKind(null);
      }}
    >
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
      <DropdownMenuContent ref={content} align="end" className="max-h-80 w-56 overflow-y-auto font-mono text-[11px]">
        {opened ? (
          <>
            <DropdownMenuItem
              className="gap-1 py-1 text-[10px] uppercase tracking-wide text-data-grey"
              onSelect={stay(null)}
            >
              <ChevronLeft className="h-3 w-3" aria-hidden="true" />
              {opened[0]}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isGpuGroup(opened[1]) && !gpus.running && !gpus.idle && (
              <DropdownMenuLabel className="py-1 text-[10px] font-normal text-data-grey/70">
                Scroll a GPU into view
              </DropdownMenuLabel>
            )}
            {opened[1].map(([code, label]) => (
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
          </>
        ) : (
          ACTIONS.map(([group, actions]) => (
            <DropdownMenuItem key={group} className="justify-between py-1 text-[11px]" onSelect={stay(group)}>
              {group}
              <span className="flex items-center gap-1 text-data-grey">
                {actions.length}
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// The card the cat button opens: the cat in its mood and at its age, how much
// it ate this week and today, and how it grows.
function CatDetails({ meal, roaming, onRoam, quiet, onQuiet, onScrapbook }) {
  const mood = moodOf(meal);
  const hours = meal?.lifetime_gpu_hours ?? 0;
  const stage = stageOf(hours);
  const next = STAGES.find((item) => item.from > hours);
  const today = meal?.today ?? 0;
  const joy = useJoy();
  const spirits = joyLevel(joy);
  const book = useScrapbook();
  const pages = Object.keys(book.kept).length;
  const fresh = Object.values(book.kept).filter((at) => at > book.viewed).length;
  return (
    // (data-cat-card: the roaming cat leaves its own card be.)
    <div data-cat-card>
      <div className="flex justify-center rounded-xl px-4 pb-2 pt-3" style={{ backgroundColor: '#F7F5F2' }}>
        <CatScene mood={mood} stage={stage} today={today} away={roaming} className="h-auto w-[250px]" />
      </div>
      <h4 className="mt-4 font-tight text-base font-semibold leading-tight text-inkwell">
        {roaming ? `${NAME} is out roaming the page` : MOODS[mood].title(NAME)}
      </h4>
      <p className="mt-1 text-sm leading-relaxed text-data-grey">
        {moodLine(mood, meal)}
        {JOY_LINES[spirits] ?? ''}
      </p>
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
          <span className="w-[5ch] text-right">
            {today >= APPETITE ? 'full' : `${Math.round((today / APPETITE) * 100)}%`}
          </span>
        </dd>
        {/* Her spirits today, kept in this browser and fresh each day: playing
            with her lifts them, being left alone lowers them. */}
        <dt className="text-data-grey">Mood</dt>
        <dd className="flex items-center justify-end gap-2 text-inkwell">
          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[#F1E8EC]">
            <span
              className="block h-full rounded-full transition-[width] duration-500"
              style={{ width: `${joy}%`, backgroundColor: JOY_COLORS[spirits] }}
            />
          </span>
          <span className="w-[5ch] text-right">{spirits}</span>
        </dd>
        {/* The first time she did each thing (scrapbook.js), opened over the page. */}
        <dt className="text-data-grey">Scrapbook</dt>
        <dd className="text-right">
          <button
            type="button"
            onClick={onScrapbook}
            className="inline-flex items-center gap-1 rounded-sm tabular-nums text-inkwell underline decoration-[#CBD5E1] decoration-1 underline-offset-2 transition-colors hover:decoration-inkwell focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkwell/20"
          >
            {pages} of {SCRAPBOOK_SIZE}
            {fresh > 0 && <span className="text-[#B0654F]">· {fresh} new</span>}
            <ChevronRight className="h-3 w-3 text-data-grey" aria-hidden="true" />
          </button>
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
      <div className="mt-2 flex items-center">
        <Switch label="Quiet mode: no moving cards" checked={Boolean(quiet)} onChange={onQuiet} />
      </div>
    </div>
  );
}

// Its owner's name, which opens the cat's card; on hover a soft underline draws
// itself in from the left, as on the server names. A roaming cat sets off from
// here (data-cat-home).
export function CatButton({ user, meal, roaming, onRoam, quiet, onQuiet }) {
  const mood = moodOf(meal);
  // (Kept here, not in the card, which may close while the scrapbook is open.)
  const [scrapbook, setScrapbook] = useState(false);
  return (
    <>
      <DetailsPopover
        content={
          <CatDetails
            meal={meal}
            roaming={roaming}
            onRoam={onRoam}
            quiet={quiet}
            onQuiet={onQuiet}
            onScrapbook={() => setScrapbook(true)}
          />
        }
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
      <ScrapbookDialog open={scrapbook} onOpenChange={setScrapbook} name={NAME} roaming={roaming} />
    </>
  );
}

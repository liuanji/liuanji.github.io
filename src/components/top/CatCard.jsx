import { CatScene, MOODS, STAGES, APPETITE, moodOf, stageOf } from './BakeryCat';
import { DetailsPopover } from './DetailBoxes';

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

// The card the cat button opens: the cat in its mood and at its age, how much
// it ate this week and today, and how it grows.
function CatDetails({ meal }) {
  const mood = moodOf(meal);
  const hours = meal?.lifetime_gpu_hours ?? 0;
  const stage = stageOf(hours);
  const next = STAGES.find((item) => item.from > hours);
  const today = meal?.today ?? 0;
  return (
    <div>
      <div className="flex justify-center rounded-xl px-4 pb-2 pt-3" style={{ backgroundColor: '#F7F5F2' }}>
        <CatScene mood={mood} stage={stage} today={today} className="h-auto w-[250px]" />
      </div>
      <h4 className="mt-4 font-tight text-base font-semibold leading-tight text-inkwell">{MOODS[mood].title(NAME)}</h4>
      <p className="mt-1 text-sm leading-relaxed text-data-grey">{moodLine(mood, meal)}</p>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-border-light pt-3 font-mono text-[11px]">
        <dt className="text-data-grey">Fed this week</dt>
        <dd className="text-right tabular-nums text-inkwell">{cookies(meal?.week)} cookies</dd>
        <dt className="text-data-grey">Today</dt>
        <dd className="text-right tabular-nums text-inkwell">
          {cookies(today)}
          <span className="text-data-grey">{today >= APPETITE ? ' · full' : ` of ${APPETITE}`}</span>
        </dd>
        <dd className="col-span-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-[#F3E6D6]">
            <div
              className="h-full rounded-full bg-[#E39A55]"
              style={{ width: `${Math.min(100, (today / APPETITE) * 100)}%` }}
            />
          </div>
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
      <p className="mt-3 font-mono text-[10px] leading-snug text-data-grey/80">
        One cookie for each GPU-hour your jobs spend computing.
      </p>
    </div>
  );
}

// Its owner's name, which opens the cat's card; on hover a soft underline draws
// itself in from the left, as on the server names.
export function CatButton({ user, meal }) {
  const mood = moodOf(meal);
  return (
    <DetailsPopover content={<CatDetails meal={meal} />} width="w-[320px]">
      <button
        type="button"
        aria-label={`${user}. ${NAME}, your bakery cat, is ${MOODS[mood].label}. Show it.`}
        className="rounded-sm bg-[linear-gradient(#CBD5E1,#CBD5E1)] bg-[length:0%_1.5px] bg-[position:0_100%] bg-no-repeat pb-0.5 text-inkwell transition-[background-size] duration-300 ease-out hover:bg-[length:100%_1.5px] focus-visible:bg-[length:100%_1.5px] focus-visible:outline-none data-[state=open]:bg-[length:100%_1.5px]"
      >
        {user}
      </button>
    </DetailsPopover>
  );
}

# Mochi's behaviour

What the roaming bakery cat does and how likely each thing is. The numbers
live in `RoamingCat.jsx` (`FEELS`, `IDLE`, `ACTS`, `MISHAPS` and the `decide`
function) and `CatThings.jsx` (`WISHES`); keep this file in step with them when
they change.

Mochi's **mood** comes from the cookies (one per GPU hour, as on the
leaderboard, not weighted by load) of the last three days, a day's worth at a
time (`moodOf` in `BakeryCat.jsx`):

| Mood | Cookies a day | Energy |
|---|---|---|
| Starving (`napping`) | under 0.2 | 0.15 |
| Hungry | 0.2 to 2 | 0.4 |
| Content | 2 to 8 | 0.65 |
| Well fed (`purring`) | 8 to 18 | 0.85 |
| Full (`loaf`) | 18 and up | 1 |

## When she stirs

Mochi rests on a panel's edge for a while (the rest), then stirs. Each time:

1. **Getting up at all.** She gets up with a chance of energy + 35% (starving
   50%, hungry 75%, otherwise always); else she rests again where she is.
2. **Bored** (nobody has played with her for 2 minutes): 30% she knocks on her
   panel, shaking it.
3. **On a panel's side:** 45% back up onto the top edge, 40% a climb along the
   side, 15% a leap to another panel.
4. **On a panel's top edge:** with notices waiting for you, first 20% she goes
   over to the notes pill to call you to them (see Your notes); otherwise one
   of four kinds of thing (below), then one thing within that kind.

| Rest between stirs | Starving | Hungry | Content | Well fed | Full |
|---|---|---|---|---|---|
| Seconds | 14–26 | 9–18 | 6–13 | 4–9 | 3–8 |

### The four kinds

| Kind | Starving | Hungry | Content | Well fed | Full |
|---|---|---|---|---|---|
| (i) Move: walk, run, leap, side | 35% | 35% | 30% | 30% | 30% |
| (ii) A GPU card visit | 12% | 16% | 20% | 22% | 24% |
| (iii) A thought bubble | 0% | 5% | 10% | 12% | 14% |
| (iv) Another interaction | 53% | 44% | 40% | 36% | 32% |

A card visit with no running GPU card fully in view becomes (iv) instead.

### (i) Moves

| Move | Starving | Hungry | Content | Well fed | Full |
|---|---|---|---|---|---|
| Walk | 85% | 60% | 45% | 35% | 30% |
| Run (a gallop, ending in a skid) | 0% | 10% | 20% | 30% | 35% |
| Leap to another panel | 15% | 20% | 20% | 20% | 20% |
| Hop round to the panel's side | 0% | 10% | 15% | 15% | 15% |

- A walk or run goes at least 60 px. After a walk she may set straight off on
  another (chance: half her energy).
- A side hop falls back to a walk when the panel is too short (under 120 px)
  or the side is too near the window's edge.

**Mishaps.** Each walk or run may have one, partway along (`MISHAPS`):

| Mishap | On a walk | On a run | What happens |
|---|---|---|---|
| Trip | 12% | 25% | Only with a panel below (within about 500 px, in view). She stumbles, tumbles down spinning, lands in a splat seeing stars, and wobbles back up. |
| Sniff | 12% | – | She stops, nose down ("sniff"), then carries on. |
| Spook | 6% | 5% | A fright at nothing: a jump with her back arched, a look round ("?"), then she carries on. |
| Pounce | 6% | – | She crouches and wiggles, pounces on a speck, pats it, and sits proudly. |
| Slip | – | 20% | She runs for the panel's end and cannot stop. She hangs by her front paws, kicking, scrambles back up, hops back on, and grooms, a little embarrassed. |

### (ii) GPU card visits

Only to a GPU's card in the compact view, fully on screen: a running one, or
for "add oil" an idle one (if only one kind is in view, she makes do with a
visit that suits it). She cannot be
dragged onto a card; she only jumps there herself. Each visit ends with a leap
back to a panel.

| Visit | Starving | Hungry | Content | Well fed | Full |
|---|---|---|---|---|---|
| Warm nap (on the hottest card: loaf, then melts flat asleep) | 100% | 55% | 16% | 5% | 5% |
| Ring spin (dangles a paw; the ring turns once) | – | 15% | 12% | 11% | 11% |
| Peekaboo (peeks over the card, ducks, pops up) | – | 15% | 8% | 6% | 6% |
| Add oil (on an idle card: pours from a little oil can, cheers two or three of "加油!" (Chinese), "頑張れ!" (Japanese), "Semangat!" (Malay), "화이팅!" (Korean) and "Cố lên!" (Vietnamese), and the card runs a while (its rings showing a pretend reading), bright, humming and glowing, then sputters out) | – | 15% | 8% | 8% | 8% |
| Wobble (hops on it till it tips, reserve button and all; arches in fright; leaps off) | – | – | 15% | 19% | 19% |
| Hamster wheel (runs on the ring for about 4 s, unhurried, the ring up to about two-thirds of a turn a second; flung off, lands dizzy) | – | – | 15% | 19% | 19% |
| Ring swing (hangs from the top of the ring by her front paws and swings; lets go) | – | – | 10% | 15% | 15% |
| Steal (pushes the card off the nearer edge of the screen and comes back pleased; 6–9 s later a helicopter or a UFO brings it back) | – | – | 8% | 9% | 9% |
| Kick (three mule kicks, the card leaning further each time, till it topples off the bottom of the screen; a helicopter or a UFO brings it back) | – | – | 8% | 8% | 8% |

Only one card is out at a time (another steal or kick becomes a wobble until it
is back). Picked up mid-push or mid-kick, the helicopter (or UFO) comes after
2.5 s instead. Whichever comes is an even chance: a helicopter carrying the card
on its rope, or a UFO holding it in its beam of light.

### (iii) Thought bubbles

A thought bubble with something she would love to do with you. An equal pick
from ten (never the same twice running): yarn, feather wand, laser pointer,
wind-up mouse, bubbles, a treat, a dance, a belly rub, a brushing, a photo
shoot. It wiggles after 4 s and waits 20 s
for a click; left alone, she looks let down ("…").

| Wish | When clicked |
|---|---|
| Yarn | Rolls along the edge; she runs after it and pounces |
| Feather wand | Dangles from the cursor; she follows, bats it, leaps for it |
| Laser pointer | A red dot follows the cursor along her edge; she chases and pounces |
| Wind-up mouse | Zips to and fro; she stalks and pounces; three catches and she is done |
| Bubbles | Eight drift up; she leaps to pop them |
| A treat | One of the treat moments (below) |
| A dance | One of the dances (below) |
| A belly rub | She rolls belly-up, squirming. Stroke the pointer over her for hearts and purrs; after a few rubs she may grab at your hand ("!"). Seven rubs and she is happy. |
| A brushing | A comb follows the pointer. Stroke her with it and she leans into it, purring, fur tufts flying; eight strokes and she shakes out her coat. |
| A photo shoot | Three poses, each with a flash and "click!": a wink, lounging like a film star, a hooray |

### (iv) Other interactions

An equal pick from her mood's list (never the same twice running). The share
of all stirs on a top edge is the kind's chance spread over the list.

| Mood | The list | Each (of stirs) |
|---|---|---|
| Starving | yawn, sunbeam nap, crumb, sneeze, a bed nap (twice over), nodding off, flopping over, dreaming, sleep, beg | ~4.8% (a bed nap ~9.6%) |
| Hungry | crumb, yawn, sneeze, butterfly, box, bird watching, a bed nap (twice over), nodding off, flopping over, dreaming, beg, groom, cheering the all-clear | ~3.1% (a bed nap ~6.3%) |
| Content | butterfly, box, croissant, sunbeam nap, tail chase, yawn, sneeze, crumb, dance, bird watching, scratching, dough, backflip, groom, knead, cheering the all-clear | 2.5% |
| Well fed | butterfly, box, croissant, tail chase, dance, sneeze, crumb, sunbeam nap, bird watching, scratching, dough, backflip, knead, zoomies, groom, cheering the all-clear | 2.25% |
| Full | sunbeam nap, box, yawn, croissant, dance, sneeze, scratching, dough, backflip, belly-up, groom, knead, cheering the all-clear | ~2.5% |

Cheering the all-clear (see Your notes) is on the list only while the notes
pill shows its all-clear croissant; otherwise the rest share its part: hungry
~3.4% each (a bed nap ~6.8%), content ~2.7%, well fed 2.4%, full ~2.7%.

Hungry or starving, she naps a lot (well over half of her other interactions
when starving):

- **A bed nap:** one of her beds turns up beside her, an equal pick (never the
  same bed twice running): a wicker bread basket lined with a gingham cloth, a
  round proofing basket (banneton), a plush doughnut bed (iced and sprinkled),
  a flour sack, or a croissant cushion. She goes over, sniffs it, hops in (or
  up), turns round twice, lies down, kneads it a little, and curls up asleep
  for 8–11 s, dreaming of a fish-shaped cookie 40% of the time ("mm…"); then a
  stretch with a big yawn, out she hops, and the bed goes. Or, sleepy where
  she is, she lies down and curls up, and a gingham tea towel drifts down over
  her; when she wakes it slips off.
- **Nodding off:** sitting, her eyelids droop and her head nods down, jerks up
  ("!"), nods again, and she gives in: lies down, curls up asleep, and wakes
  with a yawning stretch.
- **Flopping over:** a big yawn, she lies down and rolls onto her back, fast
  asleep with her paws in the air for 7–9 s; then she wakes ("?"), rolls back
  over and sits up.
- **Dreaming:** curled up asleep, she dreams of a fish-shaped cookie in a
  cloud over her head ("mm…"), wakes, looks round for it ("?") and mews.
- **Yawn:** a big yawn sitting up, or (an even chance) in a long stretch, front
  paws out.

Full, she hardly ever sleeps: her only nap is the sunbeam (under 3% of her
stirs), and she dozes off with the pointer still for 3 minutes only 3% of the
time.

- **Bird watching:** a bird flutters in and lands nearby; she chatters at it
  ("ek ek"), wiggles, pounces, and it flies off ("?").
- **Scratching:** a good scratch at the edge, leaving claw marks that fade.
- **Dough:** she pats a ball of dough into shape, paws in turn, and it bakes
  into a golden bun.
- **Backflip:** a crouch and a wiggle, a spring into a tucked backward
  somersault, and a landing stuck with both paws up.

So in every mood a GPU card visit (12–24%) is likelier than any single other
interaction (about 2–9%).

## With the pointer

When the pointer comes near (and moved in the last 1.5 s) while she is resting,
walking, or busy with grooming, kneading or lolling:

- **On a panel's side:** she hops up onto the top edge by the pointer.
- **Hungry or starving:** 60% she begs.
- **Keep-away:** starving 0%, hungry 8%, content 20%, well fed 40%, full 15%.
  The game's pace: 40% slow, 40% normal, 20% quick, tiring as it goes. A click
  on her catches her (she dodges 30% × pace). A click beside her makes her
  dodge. Cornered or pressed, she may bolt to another panel (50% or 35%, ×
  pace).
- **Pounce:** if the pointer is whipping past (over 700 px/s), 60%.
- Otherwise she plays: trots after it, bats at it, purrs when it is on her.

Then she ignores the pointer for 3 s. Other reactions:

- **Rubbing:** the pointer resting still just above her for 1.2–8 s: she
  comes to rub against it (at most every 15 s).
- **Dozing:** no pointer movement for 3 minutes (40 s when starving): she
  falls asleep (full, only 3% of the time, once each still spell); any
  movement wakes her.

## Clicks and drags

- **One click:** she purrs, and a small dot appears. The dot opens her menu
  (Give a treat, Toss a toy, Dance, Send home).
- **Two clicks:** a slow blink.
- **Three clicks:** she rolls over and leaps to another panel.
- **Press and hold:** petting.
- **Dragging:** carried by the scruff, she swings with the pointer like a
  pendulum, trailing behind and swinging back when it stops; shaken hard (over
  22° or swinging fast) she flails. Carried more than 140 px above what is
  below her, she takes fright. Let go high, she drops and steadies herself. Let
  go beside a card's side, she clings on. Let go on (or just above) the notes
  pill in the corner, she stays on it and does there what fits (see Your
  notes).

| Menu item | What happens |
|---|---|
| Give a treat | Equal pick (never the same twice running): toss and catch, hand-feed, treat hunt, little bowl, a warm taiyaki, a birthday cupcake, sushi on a conveyor belt, gradient descent, fishing |
| Toss a toy | Equal pick (never the same twice running): yarn, bouncy ball, drifting feather, toy mouse, a robot vacuum ride, a paper aeroplane, a paper bag, bubble wrap, a kite |
| Dance | Equal pick (never the same twice running): happy paws, shuffle, twirl, moonwalk |
| Send home | She leaps back into your name and roaming turns off |

### The newer treats and toys

- **A warm taiyaki:** a fish-shaped cake from the bakery drops in beside her,
  steaming. She sniffs it, blows on it ("fuu~") till the steam is gone, eats it
  from the tail up in three bites, and licks her lips.
- **A birthday cupcake:** its candle lit, she gazes at the flame, takes a breath
  and blows it out ("fuu!"), cheers, eats the frosting, and sits back with a
  frosting moustache, which she licks off.
- **Sushi on a conveyor belt:** plates come along a little belt by her edge (egg,
  salmon, salmon roe, salmon); she grabs the first salmon nigiri off its plate
  and eats it, and the rest roll by.
- **Gradient descent:** a little chart of a loss curve stands beside her and a
  cookie is let go at the top. It rolls down into a dip on the way (a local
  minimum) and stops; she goes round and nudges it ("∇"), and it rolls on over
  the hump into the lowest point, rocking to a stop, where she eats it
  ("converged!").
- **Fishing:** with a little rod she casts over her edge; the float bobs a
  while, a tug ("!"), and she reels in a fish-shaped cookie.
- **A robot vacuum ride:** a robot vacuum trundles up ("whirr"); she hops on and
  rides it, sitting proud, to the end of its run ("bonk") and back, loafing;
  then hops off and it trundles away.
- **A paper aeroplane:** it glides in, looping down; she leaps and catches it,
  lands with it crumpled into a ball, and bats the ball off her edge.
- **A paper bag:** a bakery bag; she dives in, the bag rustles and scoots along,
  her head pops up out of the top ("♪"), ducks, pops up again, and out she hops.
- **Bubble wrap:** her first step pops a bubble ("pop!") and she jumps; then she
  marches the length of it, popping as she goes.
- **A kite:** she runs along her edge with the string, the kite climbing behind;
  sits and watches it dance in the wind ("♪"); the wind drops, the kite drifts
  down, and she pounces on it.

## Her spirits (Mood)

A second bar on her card, below Tummy: how she is in herself today, 0 to 100.
It is kept in this browser only and starts afresh at 55 each day.

| Lifts her | Points | Knocks her | Points |
|---|---|---|---|
| A click on her | +3 | A fright at a pop-up card | −2 |
| Petting | +5 | Dropped from up high | −4 |
| A treat, or a toy tossed | +10 | Trapped in a card | −3 |
| A game (and +6 more played through) | +8 | Falling off the page | −6 |
| Answering a thought bubble | +12 | Left alone while out (no play for a minute) | −0.5 a minute |
| Catching her at keep-away | +6 | | |
| A dance | +5 | | |
| Opening your notes while she calls you to them | +5 | | |
| Anything else asked of her from her card | +3 | | |

| Spirits | What changes |
|---|---|
| Sad (under 20) | Energy × 0.6, slower, walks rather than runs, no keep-away, nothing lively (no dances, backflips, tail chases or zoomies), GPU visits only a warm nap (70%) or peekaboo (30%); 55% of her stirs become a sad doing instead; 60% of the time she ignores the pointer, turning away ("hmph"); a sad face |
| Glum (20 to 40) | Energy × 0.85, a little slower, runs a third as often, keep-away halved, nothing lively, no boisterous GPU visits; 15% of her stirs become a sad doing; she ignores the pointer 20% of the time; a sad face at rest |
| Fine (40 to 75) | As her mood says |
| Happy (75 and up) | Energy + 0.1, keep-away × 1.5 (+5%), and 12% of her stirs become a dance or the zoomies (an even chance) |

Her card adds a line when she is low ("She's feeling low today; some play would
cheer her up").

The sad doings, an equal pick (never the same twice running):

- **Crying:** sat with her eyes squeezed shut, tears running and dropping, sobs;
  then a sniffle and a wipe with a paw.
- **A rain cloud:** a little rain cloud of her own gathers over her head and
  rains on her while she sits there ("sigh…"); she lies down under it, and it
  drifts off.
- **Sulking:** down as a loaf, eyes shut and a pout, a grumble scribbled over
  her head ("hmph").
- **Moping:** she trails off slowly along her edge, head down, and sits there a
  while ("sigh…").

## Pop-up cards

A pop-up card is a GPU's details, a disk, a baker and the like. Her own card
doesn't count, and nor do menus and tooltips. She notices one when:

- **Clicked:** you click something on the panel she is on and it opens one, or
  keeps open one that hovering had opened.
- **Near:** one opens within 300 px of her (from her middle to the card's
  nearest edge), by a click or a hover, while it is in view.
- **Blocked:** one covers 35% or more of her, whether it opened over her or
  she wandered in under it. Pop-ups are drawn over her, so this hides her.
  She checks for this every 0.4 s.

She notices only while resting, sitting, walking, busy with a little doing,
asleep, or playing with the pointer, and only on a panel's top edge or side
(not while trapped). She reacts once each time a card opens. A card she is
blocked by she takes on again whenever she is under it 6 s or more after her
last pop-up reaction. A game with the pointer is dropped for it and not taken
up again for 8 s. In quiet mode she leaves them all be.

| What she does | Clicked | Near | Blocked |
|---|---|---|---|
| Nothing | 20% | 35% | – |
| Startle (jumps where she is, "!", and stares at it) | 10% | 10% | – |
| Scared (runs away; see below) | 10% | 15% | 40% |
| Goes over and onto it (see below) | 60% | 40% | 60% |

Asleep, "nothing" counts double (she sleeps through more of them). If there is
nowhere on the card to sit (it is too narrow, or its top is under the
navigation bar or at the bottom of the window), "goes over" becomes a startle,
or, when blocked, running away.

**Going over.** She picks a spot along the card's top at random, and one of
her ways there that fits, at random (never the same way twice running):

| Way | When it fits |
|---|---|
| Leap | Always (from a panel's side, the leap or a climb, balloon or umbrella) |
| Somersault (a crouch and a wiggle, a high flip head over heels, landing with both paws up, "✦") | From a panel's top |
| Pounce (stalks it, rump waggling, then a long, low pounce and a skid to a stop) | From a panel's top, not when blocked |
| Sneak (creeps along her panel, a paw at a time, up to 200 px, and hops on quietly) | From a panel's top, not when blocked, with 60 px or more to creep |
| Dash (runs along her panel, up to 420 px, takes a flying leap and skids to a stop) | As for the sneak |
| Climb (leaps to the card's nearer side, clings on, climbs up it, hops up over the top) | When that side has room (the card 120 px tall or more, clear of the window's edge) |
| Balloon (floats up, then across, holding a balloon; lets go over her spot; the balloon floats off) | When the card's top is 40 px or more above her |
| Umbrella (drifts down under an umbrella, swaying) | When the card's top is 60 px or more below her |

Her leaps arc high enough to stay above the card, so she never passes behind
it, and a sneak or a dash stops short of the card instead of running in under
it. Once on top she does one of these, at random (never the same twice
running):

| On the card | What happens |
|---|---|
| Read | Reads it through little round glasses ("hmm") |
| Peek | Peeks over its top edge, ducks, peeks again |
| Swat | Swats at it twice, and the card jiggles |
| Nap | Purrs and falls asleep on it |
| Knead | Kneads it ("makes biscuits"), then lies down |
| Sniff | Sniffs, walks along it, sniffs again, "?" |

If the card closes before she gets there, or while she is on it, she drops onto
the panel below.

**Scared.** Puffed up like a Halloween cat, she hisses at it ("hsss!", with a
jump). When blocked she bolts first and hisses once clear. Then she flees along
her panel, ears pinned back, until she is clear of the card and at least 160 px
from where she was. If her panel ends first, she runs to its end and leaps to
the nearest panel in view that is clear of the card and further from it. Then
she spends a while cowering, or hiding with just her eyes over her edge (an
even chance), and peeks out before settling.

## Your notes

The notes pill in the bottom-right corner says "N notes for you" while notices
wait for you, and shows a croissant when all is clear.

**Notices waiting.** Each time she stirs on a panel's top edge, 20% she goes
over to the pill instead, to catch your eye: not again for 2 minutes, nor for
10 minutes once you have opened your notes (with her there or not), nor while
they are hidden for an hour. She leaps onto the pill, turns to face into the
page, and tries one of five ways, an equal pick (never the same twice running):

| Way | What she does |
|---|---|
| Wave | Up on her haunches waving a paw, bobbing ("mew!"), and again ("hi!") |
| Knock knock | Three taps on the pill with her paws ("tap"; it jumps a little at each), "knock knock!", and two more taps. Left out in quiet mode. |
| A sign | Plants a little sign on the pill ("look ↓", "psst ↓" or "news ↓"), taps it so it wobbles ("look!"), and pulls it up again |
| A bell | Rings a little hand bell held high, swinging ("ding!"), rings it again, and sets it down beside her |
| Peekaboo | Ducks down behind the pill, comes up with just her eyes over it ("psst!"), ducks again, and pops up with a hop ("boo!") |

Then she sits looking out at you for about 2 s, gives a last "?", and leaps
back to a panel (6–9 s on the pill in all).

- **Opened while she is there** (clicked, or hovered over): she cheers as it
  opens ("yay!", hearts), her spirits rise (+5), and she hops back to a panel
  clear of it.
- **Cleared while she is there:** she cheers the all-clear instead (below).
- **Hidden for an hour, or gone:** she just goes.

**All clear.** One of her other interactions (iv), in every mood but starving,
and only while the croissant shows: she hops onto it and, taking turns (never
the same twice running),

- **applauds:** claps ("all clear!", "bravo!" or "yay!") as a little burst of
  confetti goes up and flutters down, then another round; or
- **gives it a thumbs up** with a wink ("nice!", "all good!" or "good job!").

Then a heart, and back to a panel.

**Put there.** Dropped on (or just above) the pill, she stays on it and does
what fits, picked as above: calls you over while notices wait, or cheers the
all-clear. Open, she has a look at your notes as at a pop-up card (reads them
through her glasses, peeks over, kneads them or sniffs along them); hidden for
now, she sniffs at the little circle, pats it, puzzled, or lies down on it
purring. Each an equal pick, never the same twice running. Carrying her over
the pill does not open it under her. "Visit your notes" in her card's list (by itself) sends her
over the same way.

## Trapped in a card

Held still (moving no more than 6 px) for at least 2 s over a card, well
inside it (40 px or more below its top, the card 120 px tall or more), then let
go: Mochi is trapped inside the card, shown only within its walls. She falls to
its floor, looks round ("?"), trots to the nearer wall and paws at it, bats
twice at something in the card (a picture or a block of text, which jiggles),
slumps ("…"), and escapes one of seven ways, an equal pick, never the same
twice running:

| Escape | What happens |
|---|---|
| Over the top | A crouch, a wiggle, and a big leap up out onto the card's top edge |
| Breaking the glass | Paws pressed on the glass, two taps cracking it, a crash, shards flying, and a jump out |
| Squeezing out | Flat against the nearer wall, she slides out through it, then hops up onto the top edge |
| Wall climb | Up the inside of the nearer wall, paw over paw, a scramble over the top, and a hop onto the edge |
| Balloon | A balloon drifts down; she takes its string and floats up and out, steps onto the edge and lets go |
| Digging out | She digs at the floor (dirt flying), sinks out of sight, and pops up peeking over the top edge |
| Vanishing | A wiggle, "poof!" in a puff of smoke, and she reappears in another puff on the top edge |

Clicks while she is trapped only get a puzzled "?"; picking her up takes her
out.

## Quiet mode

A switch on her card (remembered in this browser). While it is on she moves
and shakes nothing of the page's: no wobbling, stealing or kicking a GPU card,
no spinning, running on or swinging from its ring (a visit that would do one of
these becomes one of the calm ones: the warm nap, peekaboo or adding oil), no
reacting to pop-up cards, no shaking her panel when she knocks, no knocking
on the notes pill (one of the other ways to call you instead), no jiggling
things while trapped, no humming shake when an idle card runs. Everything else is as usual, and the card-moving visits are
greyed out in her card's list.

## Her card

Opened by clicking your name: how she has eaten (and today's Tummy), her
spirits (Mood), and the switch letting her roam. While she roams, a barely-there "•••" button beside the switch lists
everything she can be asked to do, in two levels: first its kinds (moves, by
itself, naps, with you, GPU cards, treats, toys, each with how many it holds),
and a click on one shows what is in it, with a way back up. In all: the moves (walk, run, sniff, spook,
pounce), her other interactions (with a visit to your notes), her naps (each of the six beds, the sunbeam,
nodding off, flopping over, dreaming, curling up, a yawn), the GPU card visits
(greyed out unless a running GPU's card, or for "add oil" an idle one, is fully
in view when the list opens), the things to do with you (belly rub, brushing,
photo shoot, the five toy games), the four treat moments and the three tossed
toys. Picked, she does it at once (hopping
up first off a side or a GPU card). Trips, slips and being trapped are not in
the list.

## Back into view

When the page has scrolled her panel away and the scrolling has settled for
1.2 s, she comes back onto the nearest panel in view, an equal pick of her ways
in (never the same twice running):

| Left off the… | Ways back in |
|---|---|
| Bottom of the screen | Leaping in; up a ladder that slides up to the edge; floating up holding a balloon; bounced off a trampoline in a somersault; lowered by the helicopter or a UFO; flying in like a superhero (cape streaming); bouncing up on a pogo stick; floating up inside a big bubble that pops |
| Top of the screen | Leaping in; down under a parachute, swaying; abseiling down a rope; lowered by the helicopter or a UFO; flying in like a superhero; drifting down under an umbrella |

The helicopter-or-UFO way in is an even chance between the two. The helicopter
flies in with her hanging from its rope and lowers her onto the edge. The UFO
glides in with her floating in its beam of light, beams her down, switches the
beam off and zips away.

Dropped over nothing (no panel anywhere below where she is let go), she falls
off the bottom of the screen, tumbling (flailing if she was scared), and comes
back up by one of the ways in from below.

These are not in the list on her card.

## Coming out

- **Dropped on your name:** she goes back to hiding behind it, peeking over,
  as when the page loads.

- **Already roaming when the page loads** (and your name is in view): she
  peeks over your name and waits. When the pointer comes near she looks up
  higher. A click sends her out.
- **Let out from her card:** she leaps straight out.

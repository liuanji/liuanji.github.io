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
| (i) Move: walk, run, leap, side | 35% | 30% | 30% | 30% | 30% |
| (ii) A GPU card visit | 8% | 10% | 12% | 13% | 14% |
| (iii) A thought bubble | 0% | 5% | 10% | 12% | 18% |
| (iv) Another interaction | 57% | 55% | 48% | 45% | 38% |

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
| Hamster wheel (runs on the ring for about 4 s, the ring speeding up to nearly a turn a second, her strides keeping pace with its rim; flung off, lands dizzy) | – | – | 15% | 19% | 19% |
| Ring swing (hangs from the top of the ring by her front paws, held together round it, and swings; lets go) | – | – | 10% | 15% | 15% |
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
| Laser pointer | A red dot sits on the top edge of whichever card the cursor is over (or just above); she chases and pounces, and when it moves onto another card she leaps over there and carries on (each leap adds 1.5 s to the game) |
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
| Starving | yawn, sunbeam nap, crumb, sneeze, a bed nap (twice over), nodding off, flopping over, dreaming, sleep, beg | ~5.2% (a bed nap ~10.4%) |
| Hungry | crumb, yawn, sneeze, butterfly, box, bird watching, a bed nap (twice over), nodding off, flopping over, dreaming, beg, groom, curling up, cheering the all-clear | ~3.7% (a bed nap ~7.3%) |
| Content | butterfly, box, croissant, sunbeam nap, a bed nap (twice over), nodding off, curling up (twice over), tail chase, yawn, sneeze, crumb, dance, bird watching, scratching, dough, backflip, groom, knead, batting something off the screen, throwing something at you, cheering the all-clear | ~2.1% (naps ~12.5% in all) |
| Well fed | butterfly, box, croissant, tail chase, dance, sneeze, crumb, sunbeam nap, a bed nap (twice over), nodding off, curling up (twice over), bird watching, scratching, dough, backflip, knead, zoomies, groom, batting something off the screen, throwing something at you, cheering the all-clear | ~2.0% (naps ~11.7% in all) |
| Full | sunbeam nap, box, yawn, croissant, dance, sneeze, scratching, dough, backflip, belly-up, groom, knead, batting something off the screen, throwing something at you, cheering the all-clear | ~2.5% |

Cheering the all-clear (see Your notes) is on the list only while the notes
pill shows its all-clear croissant; otherwise the rest share its part: hungry
~3.9% each (a bed nap ~7.9%), content ~2.2%, well fed ~2.0%, full ~2.7%.

**Batting something off the screen:** something turns up within reach (a
bouncy ball, a ball of yarn, a cookie, a croissant, a paper ball or her toy
mouse). She eyes it ("?"), looks at you, taps it once, and then swats it
("!") clean off the screen, spinning in an arc past the nearer side of the
window. She watches it go ("…"), there is a faint "…bonk" from out of sight,
and she sits there looking innocent, with a wink.

**Throwing something at you:** the other way round. Something turns up beside
her (an equal pick, never the same twice running: a rubber ball, a ball of
dough, a cream puff with a strawberry on top, or a ball of crumpled
notepaper). She looks at you ("?"), winds up with it held high, one eye shut
to aim ("…"), and lets fly. It comes at you face on, slow to grow at first
and then rushing up, and hits the glass somewhere about the middle of the
window (a little burst of lines, and the sound of it):

- **The ball** ("boing!") bounces back the way it came, and she catches it in
  both paws, pleased (a heart).
- **The dough** ("splot") sticks, squashed flat. She puts both paws over her
  mouth ("oops"), it sags and slides down a little, then drops away out of
  the window; a wink.
- **The cream puff** ("splat!") splats, cream dripping down round its
  strawberry. She claps, giggling ("hehe"), while the drips run, then winks as
  it fades.
- **The paper ball** ("tok!") bonks off and drops out of the window. She looks
  the other way, whistling ("♪"), then back at you with a wink.

Its size where it hits is 7–9.5% of the window's shorter side (as a radius).

Five more join her list only at certain levels (one more equal pick each,
so the others' shares shrink a little):

| Doing | When | What she does |
|---|---|---|
| An empty bowl | Starving | Her bowl turns up, empty. She noses it along her edge ("sniff"), looks up sadly ("…"), and paws it over upside down ("mew?"). |
| A rumbling tummy | Hungry or starving | Her tummy rumbles ("grrr…", wobbly lines either side of her); she jumps ("!"), looks down at it ("?"), and licks her lips. |
| A food coma | Full | She slumps back, tummy round and up, hind feet out; pats it in turn ("prr"), burps a little bubble ("burp"), and nods off sitting there. |
| Pronking | High spirits (75 or more), and not hungry or starving | Five springs straight up on stiff legs along her edge, tail high ("♪"), then a heart. |
| Kicking a pebble | Low spirits (under 40) | She kicks a pebble slowly along her edge, head down, trailing after it; the third kick sends it rolling away ("sigh…"). |

They are in her card's list too (by itself), where asking ignores the level.

Hungry or starving, she naps a lot (well over half of her other interactions
when starving):

- **A bed nap:** one of her beds turns up beside her, an equal pick (never the
  same bed twice running): a wicker bread basket lined with a gingham cloth, a
  round proofing basket (banneton), a plush doughnut bed (iced and sprinkled),
  a flour sack, or a croissant cushion. She goes over, sniffs it, hops in (or
  up), turns round twice, lies down, kneads it a little, and curls up asleep
  for 8–11 s (18–26 s well fed, 20–30 s content, 16–28 s hungry, 24–40 s
  starving; full, 8–11 s), dreaming of a fish-shaped cookie 40% of the time ("mm…"); then a
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
time. Content or well fed, she naps about one stir in eight or nine, which
with those longer naps keeps her asleep roughly 15–17% of the time.

- **Bird watching:** a bird flutters in and lands nearby; she chatters at it
  ("ek ek"), wiggles, pounces, and it flies off ("?").
- **Scratching:** a good scratch at the edge, leaving claw marks that fade.
- **Dough:** she pats a ball of dough into shape, paws in turn, and it bakes
  into a golden bun.
- **Backflip:** a crouch and a wiggle, a spring into a tucked backward
  somersault, and a landing stuck with both paws up.

A GPU card visit comes 8–14% of the time, any single other interaction about
2–5% (a bed nap up to ~10% when starving).

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
- **Dozing:** no pointer movement for 3 minutes (a minute when hungry, 25 s
  when starving): she curls up asleep (full, only 3% of the time, once each
  still spell).
- **Asleep** (dozing, or curled up of her own accord): she sleeps a nap's
  length (8–11 s; 16–28 s hungry, 24–40 s starving) and wakes with a
  stretch, unless the pointer comes near her first; the pointer moving
  elsewhere on the page leaves her be.

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
| Dance | Equal pick (never the same twice running): happy paws, shuffle, twirl, moonwalk, disco, the robot, the hula |
| Follow me | She leaves her panel and follows your pointer through the air for 10–15 s, to a spot just behind and below it, kept on screen, bobbing; one way, never the same twice running (below); then she leaps down onto the panel below her, or the nearest in view |
| Send home | She leaps back into your name and roaming turns off |

### Following you

| Way | How | Top speed |
|---|---|---|
| Gliding | Like a flying squirrel: stretched out flat, legs spread with the fur between them pulled out like a kite, tail streaming, a little scarf fluttering; nose up as she climbs, down as she dives | 360 px/s |
| A toaster jetpack | Up on her hind legs, arms out, a toaster on her back with two slices up, flames flickering under it | 440 px/s |
| A broomstick | Sat up with the broom across her lap and a little witch's hat on | 380 px/s |
| Doggy-paddling | Side on, head up, legs churning in turn ("~") | 220 px/s |
| A flying croissant | Loafing on top of a big croissant, speed lines behind | 300 px/s |
| A balloon | Hanging from a balloon, swaying | 190 px/s |

Each is also in her card's list (with you). Clicked mid-flight she just purrs;
picked up, she stops following.

### The newer dances

- **Disco:** a glitter ball comes down over her and, in shades under its
  turning coloured lights, she points up at it and down at the floor in
  turn, hips bouncing; a spin, the point held ("✦"), and up the ball goes.
- **The robot:** stiff square arms, one forearm up and one down, switched
  with a jolt on the beat ("beep", "boop"); a sharp about-turn; a very fast
  glitch ("01"); a slump as she powers down ("…"); and a hop as she boots up
  again ("beep boop!").
- **The hula:** in a grass skirt and a flower garland, she sways her hips
  from side to side, arms flowing out the way she sways; a slow turn; and a
  hop with "aloha!".

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
- **An ice cream cone:** it drops into her paws; she holds it up and licks it
  ("lick"), three times, till the cold gets her: a brain freeze, the cone set
  down, both paws to her head ("!!"), shivering, ice crystals about her. Then
  on with it, more slowly, scoop and cone and all ("crunch").
- **A bowl of noodles:** steaming, chopsticks across it; she sniffs, then
  slurps a long strand up into her mouth ("slurp~"), cheeks puffed full, and
  another.
- **A mochi for Mochi:** a soft round rice cake on a little dish. She bites and
  pulls, leaning back ("mmf", "mmmf!"), and it stretches and stretches till it
  lets go and springs into her mouth ("boing"); she chews, cheeks full.
- **A durian:** she sniffs it and recoils, eyes screwed shut, tongue out
  ("yuck!"), its smell rising; she pushes it away along her edge ("hmph") and
  off it rolls.
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
- **A fish kicker:** a long fish-shaped plush. She wiggles, pounces on it,
  rolls onto her back hugging it, and bunny-kicks it with her hind feet
  ("mrrp!"), over and over; then lies there with it, purring.
- **A crinkle tunnel:** it lies along her edge (shorter on a narrow panel). She
  sniffs the near end, wiggles, and dashes in; out of sight, the tunnel rustles
  and shivers as she runs through, and out she bursts at the far end, skidding
  to a stop.
- **A spinning top:** it lands whirring and wanders a little; she bats it and
  it skitters off; she chases round and round after it till it topples, and
  sits there dizzy, eyes spiralling, stars circling her head.

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

### The bakery's oven

The card behind the page's "Live" dot (the bakery: an oven, a pastry baking
in it, its power button, and a kitchen timer on top when the data is late) she
never lets be. Whenever it opens, wherever she is on the page, up onto its
oven she goes (unless in quiet mode); busy with something when it opens, she
goes as soon as she is free, once each time it opens. If there is nowhere on
it to land (its top under the navigation bar or at the bottom of the window),
she startles instead.

The card itself stays open, however it was opened (a click, or a long hover),
until Escape, a click outside it, or a scroll of the page. A click on her
while she is up there does not count as outside it.

Going over, she lands on the oven's top itself, and is drawn over the card
while she is up there (and on her way up and off). What she does there is an
equal pick (never the same twice running) of those that fit how the oven is;
she has her paws on it, and the oven answers:

| Oven | What she may do |
|---|---|
| On | Bake, Heat, Window, Warm |
| Off, its pastry baked | Pinch, Window |
| Off, its pastry not yet baked | Bake, Window |
| Late (any of the above) | also Timer |
| Closed | Doze, Knock, Window |

| Doing | What happens |
|---|---|
| Bake | A whole bake by herself. Off, she goes over to the power button and presses it with a dangling paw ("♪"; a ring bursts off the button, the window lights up); she lies over the front watching it bake ("mm…") till it is done, and cheers ("✦"); presses the button off ("!"); then paws the door, and it is a pinch (below). |
| Pinch | She paws at the door, it swings down and the tray slides out (the card's own take-out, a new raw pastry going in), and the pastry hops up beside her. She eats it ("nom", "crunch"), and licks her lips, a heart. |
| Heat | Over to the left-hand dial, a paw on it ("click"): it turns, the window's glow flares and the steam comes quick and thick for 3 s. Too hot ("hot!"): she jumps, sneezes ("achoo!") and licks a paw. |
| Window | She hops down onto the counter in front of the oven, up on her toes with her paws on the glass, peering in ("mm…" at a pastry baking, "…" in a cold oven); polishes it, paws going round ("squeak"), a sparkle ("✦"); and hops back up on top. |
| Warm | Into the steam over the middle: a loaf ("prr"), then fast asleep for 9–13 s; a stretch and a heart. |
| Timer | Beside the kitchen timer she bats it twice, and it rings, shaking: she leaps ("!"), puffs up ("hsss"), and glares ("…"). |
| Doze | Curled up beside the dozing oven, its z's and hers, for 10–14 s. |
| Knock | She knocks on it twice ("knock"; it rattles), nobody comes ("…", "mew?"), and she lies down by it a while. |

Watching it bake and pressing its power button count as scrapbook pages of
their own, and can be asked for from it (a watch, with a mew at you for the
pastry; a press, off or on). Half the time, done with one, she does another
there before she goes (never the same one twice running); then she leaps off
to the nearest panel in view that the card does not cover. Asked from her
card ("Visit the bakery's oven"), or from her scrapbook, the card opens (and
stays open) if it is not, and up she goes.

### A server's packing counter

A server's status pill opens its packing counter (a pile of six of its
pastry, hopping one by one into a bakery box). Like the bakery's card, it
stays open till a scroll or a click outside, and she goes to it whenever it
opens, landing on the counter between the pile and the box. What she does is
an equal pick (never the same twice running) of those that fit:

| Counter | What she may do |
|---|---|
| Packing, the box empty or one in | Box, Help, Snack |
| Packing, two or more left on the pile | Help, Snack |
| Packing, one left | Snack |
| The box going off, or a new one coming | Cheer |
| Asleep (the server not answering, or closed) | Nap, Nudge |

| Doing | What happens |
|---|---|
| Box | If it fits, she sits: she hops into the box, peeking over its front ("prr"), ducks, peeks again (a heart), and hops out. The packing waits while she is in it. |
| Help | She holds the packing up and packs two or three herself: the top one off the pile into her paw, then over and down into the box (its dots counting it). A cheer ("✦"), and the packing goes on. |
| Snack | A glance each way, the top one off the pile, and she eats it ("nom", "crunch"; that box goes out one short); a lick, and "shh" with a wink. |
| Cheer | She claps the full box off ("✦"), a heart. |
| Nap | Up onto the box, curled up asleep on it for 9–13 s. |
| Nudge | She taps the sleeping pile twice ("mew?"), nothing; she lies down by it a while. |

The counter carries on by itself if she is gone 20 s without letting it.
Half the time she does a second thing there; then she leaps off to the
nearest panel in view the card does not cover. Asked from her card ("Visit a
packing counter"), the first server's in view opens.

**A cookie, earned.** Each time your cookies today go up by a whole one (a
GPU-hour your jobs held; the counts refresh every 5 minutes), one is due to
her. At her next stir, a little countertop oven turns up beside her, "ding!",
its door drops open and the cookie hops out; she eats it ("nom", "crunch",
+6 to her spirits) and grooms, a heart. One at a time, and no sooner than 3
minutes after the last.

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
pounce), her other interactions (with a visit to your notes, and each of the
four things she can throw at you, a visit to the bakery's oven, an earned
cookie and a visit to a packing counter), her naps (each of the six beds, the sunbeam,
nodding off, flopping over, dreaming, curling up, a yawn), the GPU card visits
(greyed out unless a running GPU's card, or for "add oil" an idle one, is fully
in view when the list opens), the things to do with you (belly rub, brushing,
photo shoot, the five toy games), the thirteen ways of having a treat and
the eleven tossed toys. Picked, she does it at once (hopping
up first off a side or a GPU card). Trips, slips and being trapped are not in
the list.

Her card also shows how full her scrapbook is (below), with how many pages
are new since you last looked; a click opens it.

## Her scrapbook

The first time she does each of 166 things, she keeps a page for it, and a
little open book rises off her. It is kept in this browser (`scrapbook.js`),
and opens over the page from her card: each kind with how many of it she has
done, then a card for each, drawn in her pose there (with what she had with
her, and where she was), with the date. Pages kept since you last looked are
marked new; the ones still to come show only her outline, faintly, and "???"
for a name.

What counts is what she does by herself (her doings, naps, dances, GPU card
visits, calls at your notes, pop-up reactions, ways back into view, mishaps
and escapes) and how she takes what you give her or do with her (treats, toys
and dances from her menu, an answered wish, a game, petting, catching her,
putting her down on your notes). What you ask for from the list on her card
does not count: it only makes her do it, till she next settles.

Clicked while she roams, a page she has had closes the scrapbook and asks her
to do it again, where it can be asked for (her doings, naps, dances, treats,
toys, games, wishes, GPU card visits, throws at you, the oven and the cookie, calls at your notes and cheers, a few
mishaps, the ways of following you). The rest, which only come about of
themselves (ways back into view, pop-up cards, trips, escapes and the like),
are not buttons.

| Kind | Pages |
|---|---|
| By herself | 25: butterfly, box, croissant, tail chase, sneeze, crumb, bird watching, scratching, dough, backflip, grooming, kneading, belly-up, begging, zoomies, batting something off the screen, the four things thrown at you, and the five at certain levels |
| Naps | 12: the six beds, sunbeam, nodding off, flopping over, dreaming, curling up, a yawn |
| Dances | 7: happy paws, shuffle, twirl, moonwalk, disco, the robot, the hula |
| With you | 20: batting at the pointer, keep-away, caught, petting, a rub against your hand, a pounce on the pointer, belly rub, brushing, photo shoot, the five games, and the six ways of following you |
| Treats | 13: each treat moment |
| Toys | 11: each tossed toy |
| GPU cards | 9: each visit |
| Your notes | 8: the five ways of calling you, "you noticed!", applause, a thumbs up |
| Pop-up cards | 15: the six things on top, startled, scared off, and seven ways over |
| At the bakery | 11: a whole bake, nose to the glass, turning up the heat, warm on the oven, watching it bake, the power button, a pinched pastry, the timer, dozing with it, knocking, an earned cookie |
| At the packing counter | 6: in the box, helping pack, a sneaky snack, cheering a box off, napping on the box, nudging the pile |
| Back into view | 11: every way in but the plain leap, the helicopter and the UFO apart |
| Mishaps | 7: trip, slip, spook, sniff, a speck, off the page, dropped from up high |
| Trapped | 7: each escape |
| Low days | 4: crying, a rain cloud, sulking, moping |

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
  higher. A click and she pops up, then leaps out to a spot picked at random on
  any panel in view.
- **Let out from her card:** she leaps straight out.

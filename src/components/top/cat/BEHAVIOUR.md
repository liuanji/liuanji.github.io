# Mochi's behaviour

What the roaming bakery cat does and how likely each thing is. The numbers
live in `RoamingCat.jsx` (`FEELS`, `IDLE`, `ACTS`, `MISHAPS` and the `decide`
function) and `CatThings.jsx` (`WISHES`); keep this file in step with them when
they change.

Mochi's **mood** comes from the cookies (computing GPU-hours) of the last three
days, a day's worth at a time (`moodOf` in `BakeryCat.jsx`):

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
4. **On a panel's top edge:** one of four kinds of thing (below), then one
   thing within that kind.

| Rest between stirs | Starving | Hungry | Content | Well fed | Full |
|---|---|---|---|---|---|
| Seconds | 14–26 | 9–18 | 6–13 | 4–9 | 3–8 |

### The four kinds

| Kind | Starving | Hungry | Content | Well fed | Full |
|---|---|---|---|---|---|
| (i) Move: walk, run, leap, side | 35% | 35% | 30% | 30% | 30% |
| (ii) A GPU card visit | 15% | 20% | 25% | 28% | 30% |
| (iii) A thought bubble | 0% | 5% | 10% | 12% | 14% |
| (iv) Another interaction | 50% | 40% | 35% | 30% | 26% |

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
| Hamster wheel (runs on the ring, up to a turn a second; flung off, lands dizzy) | – | – | 15% | 19% | 19% |
| Ring swing (hangs from the top of the ring by her front paws and swings; lets go) | – | – | 10% | 15% | 15% |
| Steal (pushes the card off the nearer edge of the screen and comes back pleased; 6–9 s later a helicopter brings it back) | – | – | 8% | 9% | 9% |
| Kick (three mule kicks, the card leaning further each time, till it topples off the bottom of the screen; a helicopter brings it back) | – | – | 8% | 8% | 8% |

Only one card is out at a time (another steal or kick becomes a wobble until it
is back). Picked up mid-push or mid-kick, the helicopter comes after 2.5 s
instead.

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
| Starving | yawn, sunbeam nap, crumb, sneeze, sleep, beg | ~8% |
| Hungry | crumb, yawn, sneeze, butterfly, box, bird watching, beg, groom | 5% |
| Content | butterfly, box, croissant, sunbeam nap, tail chase, yawn, sneeze, crumb, dance, bird watching, scratching, dough, backflip, groom, knead | ~2.3% |
| Well fed | butterfly, box, croissant, tail chase, dance, sneeze, crumb, sunbeam nap, bird watching, scratching, dough, backflip, knead, zoomies, groom | 2% |
| Full | sunbeam nap, box, yawn, croissant, dance, sneeze, scratching, dough, backflip, belly-up, groom, knead | ~2.2% |

- **Bird watching:** a bird flutters in and lands nearby; she chatters at it
  ("ek ek"), wiggles, pounces, and it flies off ("?").
- **Scratching:** a good scratch at the edge, leaving claw marks that fade.
- **Dough:** she pats a ball of dough into shape, paws in turn, and it bakes
  into a golden bun.
- **Backflip:** a crouch and a wiggle, a spring into a tucked backward
  somersault, and a landing stuck with both paws up.

So in every mood a GPU card visit (15–30%) is likelier than any single other
interaction (2–8%).

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
  falls asleep; any movement wakes her.

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
  go beside a card's side, she clings on.

| Menu item | What happens |
|---|---|
| Give a treat | Equal pick (never the same twice running): toss and catch, hand-feed, treat hunt, little bowl |
| Toss a toy | Equal pick (never the same twice running): yarn, bouncy ball, drifting feather, toy mouse |
| Dance | Equal pick (never the same twice running): happy paws, shuffle, twirl, moonwalk |
| Send home | She leaps back into your name and roaming turns off |

## A pop-up from her panel

When you click something on the panel she is on (resting, sitting, walking,
busy with a little doing, asleep, or playing with the pointer) and it opens a
pop-up card (a GPU's details, a disk, a baker), or keeps one open that hovering
had opened, she reacts **65%** of the time, once each time it opens. A game
with the pointer is dropped for it and not taken up again for 8 s. A pop-up that opens
on hover alone, or from another panel, she ignores, and in quiet mode she
ignores them all.

| Reaction | Chance | What happens |
|---|---|---|
| Read | Equal pick (never the same twice running) | Hops on top and reads it through little round glasses ("hmm") |
| Peek | ″ | Hops on and peeks over its top edge, ducks, peeks again |
| Swat | ″ | Hops on and swats at it twice; the card jiggles |
| Nap | ″ | Hops on, purrs and falls asleep on it |
| Startle | ″ | Jumps where she is ("!") and stares at it |

If the pop-up is too narrow, or its top would put her under the navigation
bar, she stays put. When it closes under her, she drops onto the panel below.

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
no spinning, running on or swinging from its ring (a visit that would becomes
one of the calm ones: the warm nap, peekaboo or adding oil), no reacting to a
pop-up card opened from her panel, no shaking her
panel when she knocks, no jiggling things while trapped, no humming shake when
an idle card runs. Everything else is as usual, and the card-moving visits are
greyed out in her card's list.

## Her card

Opened by clicking your name: how she has eaten, and the switch letting her
roam. While she roams, a barely-there "•••" button beside the switch lists
everything she can be asked to do: the moves (walk, run, sniff, spook,
pounce), her other interactions, the GPU card visits (greyed out unless a running
GPU's card, or for "add oil" an idle one, is fully in view when the list
opens), the things
to do with you (belly rub, brushing, photo shoot, the five toy games), the four
treat moments and the three tossed toys. Picked, she does it at once (hopping
up first off a side or a GPU card). Trips, slips and being trapped are not in
the list.

## Back into view

When the page has scrolled her panel away and the scrolling has settled for
1.2 s, she comes back onto the nearest panel in view, an equal pick of her ways
in (never the same twice running):

| Left off the… | Ways back in |
|---|---|
| Bottom of the screen | Leaping in; up a ladder that slides up to the edge; floating up holding a balloon; bounced off a trampoline in a somersault; lowered by the helicopter; flying in like a superhero (cape streaming); bouncing up on a pogo stick; floating up inside a big bubble that pops |
| Top of the screen | Leaping in; down under a parachute, swaying; abseiling down a rope; lowered by the helicopter; flying in like a superhero; drifting down under an umbrella |

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

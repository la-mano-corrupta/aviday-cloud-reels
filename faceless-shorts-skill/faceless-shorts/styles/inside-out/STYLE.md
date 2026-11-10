# Inside Out: flat 2D "What happens if…?" shorts, 9:16

Curious, slightly shocking, satisfying. A simple flat hero, x-ray cutaways into the body, organs and props as clean
vector shapes, bold 1-3 word captions with one yellow word, and a cut every 1-3 seconds with the camera always moving.
Example to study and copy: `example/` = **WHAT IF YOU SWALLOW GUM?** (30 s, 11 shots). Style sheet: `style-sheet.png`.

## 1. The look (rules from the sheet: do not break them)
- **Flat shapes only.** No gradients, textures or realistic lighting. Depth comes from flat darker/lighter tones of the
  same colour (shirt shade, organ highlight), never from blur or glow.
- **Palette:** skin `#E8B89A` · organ pink `#E57A8A` · danger red `#D62839` · x-ray cyan `#4FD1E8` · highlight yellow
  `#FFD43B` · background `#F4F1EA`, plus ink `#1A1A1E` and the derived shades in `lib.js` `C`.
- **X-ray cyan is only for inside-the-body views** (skeleton, x-ray film background, gut glow). **Red marks danger or the
  problem** (X, warning, blockage ring, stopwatch hand). **Yellow is the one keyword per caption**, impact bursts and acid.
- **One visual mode per shot.** X-ray means the whole body is x-ray (arms, neck, legs), only the head stays normal.
- Characters are minimal and friendly: round head, dot eyes with a highlight, simple tee and pants, expressive brows and
  mouth. They react on the beat (gulp, shock, smirk, finger wag) and may look at the camera on the twist ending.
- Mood: curious, slightly shocking, satisfying. Accurate science, no gore, no injury on screen.

## 2. Format
- **1080x1920, 30 fps, 25-45 s.** Lead silence 0.45 s, outro 0.9 s (they're in `script.json`).
- **Story shape:** hook question (hero + the thing) → x-ray: where it goes → close-up of what happens → the key fact →
  myth busted (red X) → what really happens → time passes → **twist: "but if you…"** (danger, red) → the hero's punchy
  last line to camera (loops back to the hook).
- **One line = one shot = one cut**, and a sentence usually spans 2-3 lines (`"It slides down your throat and lands
  right in your stomach,"` / `"where strong acid gets to work on it."`). The voice speaks each sentence in one pass, so
  it sounds natural, and the cuts are found at the pauses inside it. Shots are 1.5-3.5 s; split a line that runs longer. Every cut gets a punch-in + a brief
  white flash + a whoosh (automatic in `main.js`; add the whoosh cue yourself).
- **Narration:** conversational, like explaining to a friend: flowing sentences with connecting words, never a list of
  caption-like fragments. Kokoro `am_michael` x1.0 (or `am_puck` for playful, `af_heart` for a warm female voice). Calm, curious,
  matter-of-fact. Numbers spelled as said.

## 3. Captions
`script.json` line: `{ "text": "Stuck for seven years? Total myth.", "caps": "STUCK 7 *YEARS? | TOTAL *MYTH" }`
- `|` splits the line into caption chunks; `*` marks the ONE yellow word of each chunk. 1-3 words per chunk.
- A chunk appears when its first word is spoken (matched by spelling, else by word count), pops in (0.2 s overshoot), and
  stays until the next chunk. Inter Black 150 px, white, ink outline 30 px + drop, centred at y 1400 (`CAP` in captions.js).
- Caps may differ from the spoken words ("7" for "seven") but should start with the same word as the spoken chunk.
- Without `caps`, lines are auto-chunked (2-3 words, longest word yellow): fine for drafts, write caps for the final.

## 4. Engine map (`example/`)
| file | gives you |
|---|---|
| `script.json` | title, voice, speed, lead, outro, gap, music (`bed`·`none`·`audio/x.mp3`), sources, lines `{text, caps, gap}` |
| `src/shots.js` | **the per-video file**: the shot list + sound cues |
| `src/core/kit.js` | the component zoo (below) |
| `src/core/lib.js` | `W H FPS`, palette `C`, `clamp lerp seg eo eio eob rnd`, `rr circle ell line fillAll bigText` |
| `src/core/timing.js` | `L(i)` line start, `Le(i)` line end, `Wd(word, line)` word start (prefix match, throws if missing), `T.dur` |
| `src/core/captions.js` | caption chunking + drawing (`CAP` = position/size) |
| `src/main.js` | boot, camera (punch-in + slow push), cut flash, fades, `window.OP` for capture |
| `tools/capture.mjs` | `check` · `cues` · `sheet` · `frames` · `video [start end] [--draft]` · `preview` |
| `tools/mix.py` | voice + music bed (ducked) + procedural effects → `data/mix.wav` |
| `data/` | `lines.json`, `words.json` (timing), `narration.wav`, `cues.json`, `mix.wav` |

## 5. The component zoo (`kit.js`, `import * as K`)
**Hero** `K.man({ x, y, s, arm, armL, finger, eyes, mouth, chew, brow, smirk, frown, look, xray, pulse, holding, inside })`
- origin = chest centre; at `s: 1` he is ~1100 px tall (head top ≈ -480, feet ≈ +620). Close-up: `s: 1.6-2.0`, y 1150-1300.
- `arm`: `K.ARM.down | mouth | point | wave | hip`, blend with `K.armPose(a, b, t)`. `finger`: angle (rad) shows a raised
  index finger (wag with `Math.sin(lt * 11) * 0.35`).
- `eyes`: `'n' | 'wide' | 'closed'` · `mouth`: `'smile' | 'smirk' | 'chew' | 'o' | 'flat' | 'grin'` · `brow` 0..1 raise.
- `xray: true` turns the whole body into x-ray (skeleton, stomach), head stays normal. `pulse` 0..1 swells the stomach.
- `holding: (x, y) => K.gum(x, y, 0.55)` draws a prop AT THE HAND (it follows the arm). `inside: [x, y, rot]` = a gum
  inside the body in local coords; `K.foodAt(u)` walks mouth → throat → stomach (u 0..1).
**Organs & props** `K.gum(x, y, s, rot, sx, sy)` · `K.stomach(x, y, s, pulse)` + `K.stomachTop(x, y, s)` · `K.heart(x, y, s, beat)`
· `K.stopwatch(x, y, s, angle)` · `K.calendar(x, y, s, '7', 'YEARS', rot)` · `K.makeGut()` → `{ draw(), at(u) }` serpentine
intestine · `K.gutTube(y, t)` straight gut close-up.
**Graphics** `K.pill(text, x, y, size, bg, fg, scale)` · `K.tag(text, x, y, targetX, targetY, size, scale)` · `K.redX(x, y, s, alpha)`
· `K.arrow(x, y, len, angle, alpha)` · `K.warning(x, y, s)` · `K.chomper(x, y, r, open, flip)` (enzymes) · `K.burst(x, y, s, a)`
· `K.speedLines(x, y, a)` · `K.shockLines(x, y, r, a)` · `bigText(text, x, y, size, fill, rot, scale)` (e.g. "GULP!").
**Backgrounds** `K.room()` (A, real world) · `K.xray(t)` (B, x-ray film + scan line) · `K.insideStomach(t, acid)` (C, macro).
New topic = new components: add them to kit.js in the same look (flat fills, one darker shade, one light highlight, ink
outlines only on graphics), document them here, and check them full size.

## 6. A shot
```js
const st = cut(5), slam = Wd('myth', 5) - st - 0.05;          // cut just before line 5; the X lands on "myth"
add({ id: 'S06', at: st, cam: [540, 800], zoom: 0.06, note: 'calendar drops, red X on "myth"',
  draw(lt, d, t) {                                              // pure function of time: no state between frames
    ctx.fillStyle = C.bg; ctx.fillRect(-300, -300, W + 600, H + 600);   // fill past the edges (the camera zooms)
    K.calendar(540, lerp(-400, 780, eob(seg(lt, 0, 0.45))), 1, '7', 'YEARS');
    if (lt > slam) K.redX(540, 780, lerp(1.9, 1, eo(seg(lt, slam, slam + 0.2))), 1);
  } });
cue(st, 'whoosh'); cue(st + 0.4, 'thud'); cue(st + slam + 0.1, 'slam');
```
`cam` = the point the camera pushes toward; `zoom` = how much it pushes over the shot (0.06 default, 0.3 = strong).
Keep the hero and key objects between y 250 and 1250 so the caption (y 1250-1550) never covers them.

**Sound cues** `cue(t, type, { gain, dur })`: `whoosh` (every cut) · `slide` (dur, something travelling) · `pop` (a label
appears) · `plop` (lands in liquid) · `gulp` · `boing` (bounce, comedic beat) · `bubbles` (dur) · `sizzle` (dur, acid) ·
`sparkle` (dur, dissolving / magic) · `thud` (something lands) · `slam` (the big X / impact) · `tock` (time passing,
soft) · `zip` (fast exit) · `alarm` (dur, low danger pulse). All soft and rounded by design.

## 7. QA pitfalls we've hit (check these first)
- An x-ray body with normal shirt sleeves or skin arms → `xray: true` handles the whole body; never x-ray only part.
- A prop floating where it will be, before the hand gets there → use `holding`, which follows the hand.
- A moving object crossing a label or counter (the gum zipping through "DAY 3") → give moving things their own lane.
- A caption landing a word early → put `caps` chunk boundaries on real spoken words; check `capture.mjs check` output.
- Things hidden under the caption → keep key action above y 1250.

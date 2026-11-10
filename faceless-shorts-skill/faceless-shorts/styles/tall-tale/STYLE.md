# Tall Tale 3D: funny true stories, 9:16

Playful, clever, a little cheeky. Flat 2D cartoon people (thick ink outlines, big round white heads, bean bodies, stick
limbs) acting inside a sunny, saturated 3D world: small-town streets, wallpapered shops, meadows, trains. The camera moves
in every shot, faces react on every beat, captions come one word at a time.
Example: `example/` = **THE GIRL WHO WAS MAILED TO GRANDMA** (1914; 52 s, 21 shots). Sheet: `style-sheet.png`.

## 1. Rules
- **People are 2D, the world is 3D.** Every person is a `Toon` cut-out that turns to face the camera and casts a real
  shadow. Never build people in 3D; never draw sets flat.
- **Faces do the acting.** Change the mood on the beat: `smug` when someone's clever, `shock` on the reveal, `laugh` /
  `happy` for the payoff, `worried` + `sweat` for trouble. Blink with `blink(t)`, talk with `talk(t)`.
- One hat + one neck thing per character; same look all video. Kids: `kid: true` (short legs) and `height: 1.4`.
- Camera always moving: push-ins, pans, crane-downs, a punch-in on the reveal word. New shot every 1.5-3 s.
- Bright midday sun outside, warm bulbs inside, pink sunset for endings or flashbacks.
- Captions: one word at a time (short words pair up: "a single"), white Inter Black with a black edge and soft shadow,
  centre screen (y 1340). No colour highlight. Words keep their punctuation.
- Story shape: open on the most surprising fact ("they mailed their daughter"), then "See, ..." rewind and explain the
  trick step by step, one picture per clause, short reaction beats, end on a punchline that flips the start.
- Narration: upbeat storyteller, `am_michael` x1.05. Music `"bounce"` (light comedy). Lots of small sounds: `pop`,
  `plop`, `boing`, `stamp`, `ding`, `chirp`, `chug`, `whoosh` on cuts.
- True stories only, checked against good sources (museums, encyclopaedias, major outlets) and listed in `script.json`
  "sources". If sources disagree on a number, use the one most of them give and keep the wording simple.

## 2. Engine map (`example/src/`)
| file | gives you |
|---|---|
| `core/engine.js` | `makeEngine` (neutral tone curve, soft shadows, bloom, depth of field, saturation grade), `camera(fov)` |
| `core/toon.js` | `drawToon(g, look, st)` (2D drawing), `new Toon(look, { height, res })` (3D cut-out: `.at(x,y,z)`, `.set(st)`, `.face(cam)`, `.tint(col)`, `.restyle(patch)`), `PROPS` held in hands |
| `core/world.js` | sets: `mainStreet(E, { shops, dusk })` (returns `buildings` with each shop's position), `interior(E, { wall, motif, floor, ceiling, view, signText, counterOn })`, `meadow(E, { sunset, fenceOn })`; pieces: `sky, clouds, sunlight, hills, tree, pole, wire, lamp, barrel, crate, car, fence, bunting, signBoard, facade, extras`; painted textures `T.planks/wallpaper/brick/siding/dirt/grass/felt`; `snapshot(E, scene, cam)` renders a set into a texture (window views) |
| `core/props.js` | `house()` (`.door` opens), `signpost`, `platformScale()` (`.set(lbs)`), `train()` (`.update(t)`), `rails`, `cubbies`, `mailSack`, `parcel`, `desk`, `poster(lines)`, `chickCrate()` |
| `core/captions.js` | one-word captions, `captionText(text, x, y)` |

**Toon look**: `{ body, pattern: plain│check│stripes│overalls│vest│apron│stamps, patCol, hat: none│cap│bowler│boater│beanie│visor│tophat│bun│flower│bow│mailcap, hatCol, band, neck: none│bowtie│tie│scarf│collar, neckCol, dots, extra: [mustache, glasses, freckles, blush, pencil, monocle], kid, stamps }`.
**Toon state**: `{ mood: neutral│smug│happy│laugh│shock│worried│angry│sad│sly│proud│tired│dizzy, look: [dx, dy], blink, talk,
sweat, tears, armL / armR: [shoulder°, elbow°] (0 = down, 150 = up), legs: stand│walk│run│sit│jump, phase, lean, bob,
holdL / holdR: PROPS.x, flip }`. A prop made with arguments (`PROPS.book('RULES', 1)`) needs a `v: 'something'` in the
state that changes when the prop changes, so the cut-out redraws.
Positions: people stand at y 0 (boardwalks y 0.18, on a counter y 1.26). Interior counter: x 2.2..3.2, clerk at x 3.55.

## 3. Shot anatomy (see `example/src/shots.js`)
Build every set once at the top, give each set its own cut-outs, then per shot: place people, `set()` their state from
`t`, `shoot(scene, people, camFrom, camTo, lookFrom, lookTo, k, LOOK)` (moves the camera, turns everyone to face it,
renders with depth of field), `blit()`, then any 2D overlay (a RETURN TO SENDER stamp). Cues go on the word
(`cue(Wd('banned', 17), 'stamp')`).

## 4. QA pitfalls
- A cut-out seen from the side becomes a sliver: keep the camera within ~60° of facing people (`.face(cam)` handles the rest).
- People inside furniture: check feet heights (boardwalk 0.18, counter top 1.18 + scale 0.08).
- Shadows only fall inside the sun's shadow box: move `sun.key.target` near the action when you build a new set.
- Rendering speed: same as Deep Dive (`SOFTWARE_GL=1 QS='&res=0.6&aa=0&shadow=1024' FPS=24` without a GPU, ≈2-3 s/frame).

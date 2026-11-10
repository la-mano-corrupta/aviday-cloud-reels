# Night File 3D: unsolved mysteries and true crime, 9:16

Quiet, uneasy, investigative. Dark 3D places with ONE light source, faceless people: witnesses are near-black with a
thin red rim light, the person the story is about glows solid red. Typewriter dates and captions, evidence inserts
(case files, tickets, polaroids, red circles), film grain, slow camera.
Example: `example/` = **THE MAN WHO JUMPED OUT OF A PLANE** (D.B. Cooper, 1971; 36 s, 11 shots). Sheet: `style-sheet.png`.

## 1. Rules
- One light per scene; everything else falls into darkness. Lamps come with a soft visible light cone.
- **Red means the subject.** Nothing else on screen is red except evidence marks (red circle, UNSOLVED stamp, string).
- No faces, no gore, no weapons shown (mention them in words only if the record needs it). Real cases: facts checked
  against primary sources (FBI, court records, major outlets) and listed in `script.json` "sources"; treat victims and
  families with respect; never accuse a real living person.
- Slow: 3-5 s shots, push-ins and drifts. Pauses between sentences are longer (`gap` 0.4).
- Captions: FreeMono typewriter, sentence case, 2-5 words, cream with one red word, typed on letter by letter (y 1560).
- Dates type on top-left: `K.dateStamp('NOV 24, 1971', 'FLIGHT 305 · PORTLAND', p, 80, 300)`.
- Narration: low and calm, `am_onyx` x0.95. Music `"tension"`.

## 2. Engine map (`example/src/`)
The 3D core (`engine.js`, `sdf.js`, `human.js`) is shared with Deep Dive 3D (see its STYLE.md). Night File adds:
| file | gives you |
|---|---|
| `core/sets3d.js` | `corridor()`, `houseNight()`, `caseWall(photoCanvases)`, `planeCabin()` (`.update(t, { door, rain, flash })`); `witnessMat()`, `subjectMat()`, `lightCone()` |
| `core/kit.js` | 2D evidence inserts: `caseFile(x, y, s, label, stamp)`, `polaroid(x, y, s, rot, 'glow'│'dark'│'house')`, `clock`, `cassette`, `marker`, `redacted`, `redCircle(x, y, rx, ry, p)`, `dateStamp`, `captionMono`, `filmLook` |
People: `new Human({ face: false })` then `.setAllMaterial(SETS.subjectMat())` or `witnessMat()`. Sitting: hips y 0.66,
`hipL/hipR [88, 0, 2]`, `knL/knR 88`.

## 3. Story shape
Date + place → the person (subject glowing) → the strange event, step by step, each step an evidence insert or a slow
3D shot → the moment it goes wrong (one hard sound) → what was found later (case wall, date) → the open question,
UNSOLVED stamp. End on silence and the drone.

## 4. QA pitfalls we've hit
- Camera inside a light cone = flat brown frame. Seats or walls between camera and subject = blocked view.
- Too-tight framing on a dark doorway reads as an empty frame: use a wider lens (`fov: 58`) for dark spaces.
- Rendering speed: see Deep Dive STYLE.md section 5.

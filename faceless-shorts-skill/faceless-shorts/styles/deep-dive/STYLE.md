# Deep Dive 3D: stylized 3D "What happens if…?" explainers, 9:16 (the flagship)

Real 3D, rendered in the browser with three.js: sculpted stylized people in warm sunlit sets, glowing x-ray cutaways,
camera journeys through blood vessels, shallow focus, a camera that never stops moving. Curious, shocking, satisfying.
Example: `example/` = **WHAT HAPPENS IF YOU HOLD YOUR BREATH?** (37 s, 11 shots). Style sheet: `style-sheet.png`
(regenerate it by opening `example/sheet.html` through `node tools/capture.mjs preview`).

## 1. The look (rules)
- **Three worlds, and every video moves between them:** (A) the real world: a person in a warm, sunlit set (kitchen),
  (B) the x-ray: the same body as cyan glass with a glowing skeleton and organs, (C) inside the body: macro shots
  (blood vessel, organs) in deep red with bloom. Real world → x-ray → inside → back out for the ending.
- **Warm low sun outside, cyan inside the body.** X-ray cyan `#4FD1E8` only for x-ray glass; red `#B8283A` for blood.
- **Shallow focus always:** focus on the subject, soft background (`aperture` 0.003-0.006 in the real world).
- **The camera always moves:** every shot pushes in, orbits or drifts (lerp the camera between two points over the shot).
- **No gore.** Injury or danger is shown as x-ray, glow, red alarm colour or a warning sign, never wounds.
- People: one sculpted body, many looks (`new Human({ skin, shirt, pants, shoes, hair, iris })`). Faces are calm and
  readable; avoid hand close-ups (hands are simple mittens).
- Captions: sentence case, 1-3 words, white with a dark outline, one yellow word (`src/core/captions.js`, y 1480).
  Labels: small dark pills with a leader line (`label()`), counters/facts as pills (`pill()`), `warning()` for danger.

## 2. Format
- 1080x1920, 24 fps (cinematic, and faster to render), 30-45 s. Narration `am_michael` x1.0, conversational.
- One line = one shot (cut just before the line: `cut(i)`), and a long line can hold a second shot starting on a word
  (`Wd('blood', 2)`), e.g. x-ray lungs → cut on "blood" → inside the vessel.
- Music: `"tension"` (low drone + slow pulse) for body/danger topics, `"bed"` for light ones.

## 3. Engine map (`example/src/`)
| file | gives you |
|---|---|
| `core/engine.js` | `makeEngine(canvas, { w, h, samples })` → `E.render(scene, cam, look)`: ACES tone, soft shadows, room environment light, depth of field, bloom, vignette + grain. `look = { focus, aperture, maxblur, bloom, bloomThreshold, exposure, vignette, grain, warm }`. `lightRig(scene, {...})`, `camera(fov)` |
| `core/sdf.js` | sculpting: `sphere, ellipsoid, capsule, rbox, torus, smin/smax/ssub, noise3`, `mesh(sdf, bounds, step, colorFn)` (surface nets → smooth BufferGeometry with vertex colours). Use it for any new organ, prop or set piece so everything shares the soft clay look |
| `core/human.js` | `new Human(look)`: `.group` (feet at y 0, faces +z), `.pose({ spine, head, shL, elL, shR, elR, hipL, knL, hipR, knR, lid, look })` (degrees; lid -0.4 wide … 1 closed), `.walk(phase, amt)`, `.setBodyMaterial(m)` (x-ray), `.parts[0]` = torso (scale it to breathe), `.spine` (attach insides), `.hips.position.y` (sit: 0.66 + hips 88°, knees 88°) |
| `core/sets.js` | `kitchen(E)`, `xrayStage(E)`, `vessel(E)` (`.update(t, camZ, co2, dark)`), `xrayMaterial(color)`, `insides()` → `{ group, stomach, heart, lungs }` |
| `core/look2d.js` | 2D layer over the 3D: `caption`, `label(text, x, y, tx, ty, scale)`, `pill(text, x, y, scale, colour)`, `warning(x, y, s)`, `blackout(k)` |
| `src/shots.js` | the per-video file. `screen(vec3, cam)` gives the 2D point of a 3D spot (aim labels at organs) |
| `src/main.js` | renders the 3D frame into the hidden `#gl` canvas, copies it to `#cv`, then 2D + captions |

## 4. A shot
```js
add({ id: 'S03', at: cut(2), note: 'x-ray chest, lungs full', draw(lt, d, t, blit) {
  reset(); lungs(1);                                                     // pose everything as a pure function of time
  cam.position.copy(lerpV(V3(0.55, 1.5, 1.6), V3(0.3, 1.42, 1.1), eio(lt / d))); cam.lookAt(0, 1.33, 0);
  E.render(X.scene, cam, { ...XLOOK, focus: cam.position.distanceTo(V3(0, 1.33, 0)) }); blit();
  label('LUNGS: FULL', 760, 520, ...screen(V3(0.1, 1.42, 0.05), cam), eob(seg(lt, 0.2, 0.45)));
} });
```
Keep 2D pills and labels off faces (y 1150-1250 over the torso, or top y 300 when the head is low in frame).

## 5. Rendering speed
3D frames are heavy without a graphics card. On a normal computer with a GPU it renders at full quality. On a machine
without one (or a cloud sandbox) render with `SOFTWARE_GL=1 QS='&res=0.6&aa=0&shadow=1024' FPS=24` (≈2 s per frame,
~30 min for a 37 s short) and check with `sheet ... 1` (one frame per second) before the full render.

## 6. QA pitfalls we've hit
- A camera inside a light's glow cone washes the frame flat (cones are volumetric meshes): keep cameras out of them.
- Seat backs / props between camera and subject: keep the camera in clear space (centre of an aisle).
- Overlays on faces: check every frame where a pill or warning appears.
- The x-ray body must be x-ray everywhere except the head (`setBodyMaterial`).

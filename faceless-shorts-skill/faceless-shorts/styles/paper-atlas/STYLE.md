# Paper Atlas: history told in cut paper, 9:16

Storybook, curious, grand. Every shape is cut paper on aged parchment (a light paper edge and a soft drop shadow),
maps with crimson routes, gold date ribbons, wax seals, simple period figures, captions on torn paper strips.
Example: `example/` = **HOW ONE BAKERY BURNED DOWN LONDON** (1666; 41 s, 10 shots). Sheet: `style-sheet.png`.

## 1. Rules
- Everything is cut paper: draw shapes with `K.cut(pathFn, colour)` so they get the edge + shadow.
- **Crimson** only for routes, targets, fire and the key word; **gold** only for dates, crowns and seals.
- Maps first: where, then who, then what. A gold ribbon (`K.ribbon('1666', x, y, s)`) opens every new era.
- Night = the same parchment under a navy wash (`nightPage` in the example); day = parchment + pale sky.
- No battles or violence shown: tell it with objects, places and consequences (fire, smoke, rebuilt houses).
- Captions: Caladea serif on a torn paper strip, 2-4 words, one crimson word, y 1640 (auto-fit).
- Narration: `bm_george` (UK documentary). Music `"tension"` for disasters, `"bed"` for lighter history.
- Facts and numbers checked against museums, encyclopaedias or primary records, listed in `script.json` "sources".
  Don't put invented quotes on signs: paraphrase what happened instead.

## 2. Kit (`example/src/core/kit.js`, `import * as K`)
- Paper: `cut(path, fill, { shadow, edge })`, path helpers `P_rr, P_circ, P_poly`, `parchment(seed)`.
- Maps: `map({ highlight, route, labels })` (invented coastlines), `landPts(cx, cy, rx, ry, seed)`, `dashedRoute(pts, p)`,
  `compass`, `label(text, x, y, size)`. For a real place, draw a simplified outline in `shots.js` (see `londonMap`).
- People: `figure({ x, y, h, dir, role: 'king'│'queen'│'sailor'│'scholar'│'guard'│'merchant'│'worker', walk, arm })`.
- Places: `hall()`, `harbor(t, shipX)`, `ship(x, y, s, rot)`.
- Graphics: `ribbon`, `seal(x, y, s, letter)`, `timeline(labels, x, y, w, p, active)`, `slip(text, x, y, s, rot, size)`,
  `captionStrip`.
- The example adds `house`, `flame`, `smoke`, `wind`, `stPauls`, `oven` in `shots.js`.

## 3. QA pitfalls we've hit
- Timeline or labels colliding with the caption strip → keep them above y 1450.
- Map labels unreadable under coloured marks → put them on a `slip`.

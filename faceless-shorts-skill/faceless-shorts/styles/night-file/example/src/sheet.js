// The Night File (3D) style sheet: 3D renders from the engine + the 2D evidence inserts and typewriter type.
import * as THREE from 'three';
import { ctx, setCtx } from './core/lib.js';
import { startBoard, panel, frame, cell, small, swatches, rules } from './core/board.js';
import { makeEngine, camera } from './core/engine.js';
import { Human } from './core/human.js';
import * as SETS from './core/sets3d.js';
import * as K from './core/kit.js';
const { P } = K;

await document.fonts.load('900 40px Inter'); await document.fonts.load('700 40px FreeMono');
const GL = document.getElementById('gl'), GL2 = document.getElementById('gl2');
const E = makeEngine(GL), E2 = makeEngine(GL2, { w: 1280, h: 860 });
const NIGHT = { exposure: 1.05, bloom: 0.85, bloomThreshold: 0.55, vignette: 0.65, grain: 0.05, warm: 0 };
const cam = camera(32);
// photos for the case wall, drawn with the 2D kit
const photo = (kind) => { const c = document.createElement('canvas'); c.width = 360; c.height = 420; const g = c.getContext('2d'); setCtx(g); g.fillStyle = '#D8CFBA'; g.fillRect(0, 0, 360, 420); g.save(); g.translate(180, 210); g.scale(1.5, 1.5); K.polaroid(0, 0, 1, 0, kind); g.restore(); return c; };
const photos = [photo('dark'), photo('house'), photo('glow'), photo('dark'), photo('house')];
const B = startBoard(document.getElementById('cv'), { title: 'NIGHT FILE 3D: VIDEO STYLE SHEET', bg: '#0D0F14', line: '#3A2A2C', head: P.cream, accent: P.red });
const shot = (x, y, w, renderFn, over) => frame(x, y, w, () => { renderFn(); ctx.drawImage(GL, 0, 0); if (over) over(); });
const wide = (box, renderFn, over) => { renderFn(); B.save(); B.beginPath(); B.roundRect(box.x, box.y, box.w, box.h, 12); B.clip(); B.drawImage(GL2, box.x, box.y, box.w, box.h); B.restore(); setCtx(B); if (over) over(); };
const person = (kind, look = {}) => { const h = new Human({ face: false, ...look }); h.setAllMaterial(kind === 'subject' ? SETS.subjectMat() : SETS.witnessMat()); return h; };

const C = SETS.corridor();
const subj = person('subject'), wit = person('witness'); C.scene.add(subj.group, wit.group);

// 1 · hero frame
let b = panel(20, 80, 560, 520, 1, 'HERO FRAME');
shot(b.x + 6, b.y, 240, () => {
  subj.group.position.set(0.1, 0, -6.2); subj.pose({ head: [6, 0, 0] });
  wit.group.position.set(0.75, 0, 0.4); wit.group.rotation.y = Math.PI + 0.25; wit.walk(0.4, 0.5);
  cam.position.set(0.25, 1.55, 2.6); cam.lookAt(0, 1.25, -6); C.update(0.1); E.render(C.scene, cam, { ...NIGHT, focus: 8.8, aperture: 0.0008 });
}, () => { K.dateStamp('OCT 19, 1994', '2:13 A.M. · 4TH FLOOR', 1, 80, 230); K.captionMono([{ txt: 'Nobody' }, { txt: 'opened', hi: 1 }], 540, K.CAPLOOK.y); K.captionMono([{ txt: 'the' }, { txt: 'door.' }], 540, K.CAPLOOK.y + 105); });
small('REAL 3D ROOMS,\nONE LIGHT SOURCE', b.x + 270, b.y + 40, 'left', 17);
small('FACELESS PEOPLE,\nRIM-LIT IN RED', b.x + 270, b.y + 130, 'left', 17);
small('THE SUBJECT\nGLOWS SOLID RED', b.x + 270, b.y + 220, 'left', 17);
small('TYPED DATES,\nFILM GRAIN', b.x + 270, b.y + 310, 'left', 17);

// 2 · palette + people
b = panel(590, 80, 660, 520, 2, 'PALETTE & PEOPLE');
const yy = swatches(b, [['VOID', P.void], ['ROOM', P.room], ['WALL', P.light], ['LAMP', P.beam], ['RED', P.red], ['EMBER', P.redDeep], ['TYPE', P.cream], ['TAPE', P.tape]]);
{
  const s = new THREE.Scene(); s.background = new THREE.Color('#06070A'); s.fog = new THREE.Fog('#06070A', 5, 12);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: '#1A1E28', roughness: 0.6 })); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; s.add(f);
  const sp = new THREE.SpotLight('#F6DDAE', 40, 10, 0.9, 0.6, 1.2); sp.position.set(0, 4, 2); sp.target.position.set(0, 0, 0); sp.castShadow = true; s.add(sp, sp.target);
  const ppl = [['witness', -1.35, (h) => h.pose({})], ['witness', -0.45, (h) => h.walk(1.1)], ['subject', 0.45, (h) => h.pose({ head: [8, 0, 0] })], ['memory', 1.35, (h) => h.pose({ shR: [20, 0, 10] })]];
  ppl.forEach(([k, x, pose]) => { const h = person(k === 'memory' ? 'subject' : k); if (k === 'memory') h.setAllMaterial(Object.assign(SETS.subjectMat(0.9), { transparent: true, opacity: 0.35 })); h.group.position.x = x; pose(h); s.add(h.group); });
  const c2 = new THREE.PerspectiveCamera(26, 1280 / 860, 0.05, 100); c2.position.set(0, 1.1, 5.4); c2.lookAt(0, 0.95, 0);
  wide({ x: b.x, y: yy + 6, w: b.w, h: 262 }, () => E2.render(s, c2, { ...NIGHT, aperture: 0 }), () => [['WITNESS', 0.13], ['WALKING', 0.38], ['THE SUBJECT', 0.62], ['MEMORY', 0.87]].forEach(([t, fx]) => small(t, b.x + b.w * fx, yy + 255, 'center', 14, '#E9DCCB')));
  small('RED = THE PERSON THE STORY IS ABOUT. NOTHING ELSE IS RED.', b.x + b.w / 2, yy + 300, 'center', 14, '#C9C2B2');
}

// 3 · evidence inserts (2D graphics laid over the 3D)
b = panel(1260, 80, 640, 520, 3, 'EVIDENCE INSERTS');
ctx.fillStyle = '#05060A'; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 14); ctx.fill();
const gx = (i) => b.x + 80 + i * 158, gy = (r) => b.y + 110 + r * 205, L = '#C9C2B2';
cell(gx(0) + 40, gy(0), 0.32, () => K.caseFile(0, 0, 1), 'CASE FILE', 100, L);
cell(gx(2), gy(0), 0.42, () => K.polaroid(0, 0, 1, -0.08, 'glow'), 'POLAROID', 100, L);
cell(gx(3) - 14, gy(0), 0.42, () => K.clock(0, 0, 1, 2, 13), 'CLOCK', 100, L);
cell(gx(0), gy(1), 0.35, () => K.cassette(0, 0, 1), 'TAPE', 90, L);
cell(gx(1), gy(1) + 40, 0.6, () => { K.marker(-50, 0, 0.9, 1); K.marker(60, 0, 0.9, 2); }, 'MARKERS', 50, L);
cell(gx(2), gy(1), 0.5, () => { ctx.fillStyle = P.paper; ctx.fillRect(-130, -70, 260, 160); K.redacted(-110, -50, [220, 160, 200]); }, 'REDACTED', 90, L);
cell(gx(3), gy(1), 0.5, () => { K.polaroid(0, 0, 0.8, 0.05, 'house'); K.redCircle(0, -10, 120, 90); }, 'RED CIRCLE', 90, L);

// 4 · scenes
b = panel(20, 610, 760, 456, 4, 'SCENES');
const sw = 200, sx = (i) => b.x + 20 + i * (sw + 45);
shot(sx(0), b.y, sw, () => { subj.group.position.set(0, 0, -30); wit.group.position.set(0, 0, -3.2); wit.group.rotation.y = Math.PI; wit.walk(1.4); cam.position.set(0.5, 1.3, 1.8); cam.lookAt(0, 1.1, -6); C.update(0.3); E.render(C.scene, cam, { ...NIGHT, exposure: 1.4, focus: 5, aperture: 0.001 }); });
const Hs = SETS.houseNight(), s2 = person('subject'); s2.group.position.set(1.4, 0, -1.2); s2.group.rotation.y = Math.PI * 0.85; s2.pose({}); Hs.scene.add(s2.group);
shot(sx(1), b.y, sw, () => { cam.position.set(-2.2, 1.9, 10.5); cam.lookAt(0.4, 2.3, -5); E.render(Hs.scene, cam, { ...NIGHT, exposure: 1.5, bloom: 0.45, bloomThreshold: 0.8, focus: 10.5, aperture: 0.0008 }); });
const CW = SETS.caseWall(photos);
shot(sx(2), b.y, sw, () => { cam.position.set(0.3, 0.1, 9.2); cam.lookAt(0, 0.1, 0); E.render(CW.scene, cam, { ...NIGHT, bloom: 0.4, focus: 9.2, aperture: 0.0008 }); });
['(A) THE CORRIDOR', '(B) THE HOUSE', '(C) THE CASE WALL'].forEach((t, i) => small(t, sx(i) + sw / 2, b.y + sw * 16 / 9 + 26, 'center', 15, '#C9C2B2'));

// 5 · captions
b = panel(790, 610, 520, 456, 5, 'CAPTIONS');
wide({ x: b.x, y: b.y, w: b.w, h: b.h - 10 }, () => { const c3 = new THREE.PerspectiveCamera(32, 1280 / 860, 0.05, 100); c3.position.set(0, 1.5, 1); c3.lookAt(0, 1.4, -8); E2.render(C.scene, c3, { ...NIGHT, focus: 0.5, aperture: 0.01, maxblur: 0.015 }); }, () => {
  [[[{ txt: 'She' }, { txt: 'never' }, { txt: 'came', hi: 1 }, { txt: 'home.' }], 70], [[{ txt: 'The' }, { txt: 'phone', hi: 1 }, { txt: 'rang' }, { txt: 'again.' }], 165], [[{ txt: 'At' }, { txt: '2:13', hi: 1 }, { txt: 'A.M.' }], 260]]
    .forEach(([w, y]) => cell(b.x + b.w / 2, b.y + y, 0.48, () => K.captionMono(w, 0, 0), null));
  cell(b.x + 30, b.y + 312, 0.34, () => K.dateStamp('JUNE 3, 1987', 'MILLBROOK, OHIO', 1, 0, 0), null);
});

// 6 · rules
b = panel(1320, 610, 580, 456, 6, 'RULES');
rules(b, ['SLOW: PUSH-INS AND DRIFTS, 3-5 S SHOTS.', 'ONE LIGHT PER SCENE. THE REST IS DARK.', 'NO FACES, NO GORE, NO WEAPONS SHOWN.', 'REAL CASES: CHECKED FACTS, RESPECTFUL.', 'TYPEWRITER CAPTIONS, ONE RED WORD.', 'SOUND: LOW DRONE, ROOM TONE, ONE HIT.', 'MOOD: QUIET, UNEASY, INVESTIGATIVE.'], b.y + 26, 17, 52);
window.SHEET_READY = true;

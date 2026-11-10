// The Deep Dive style sheet: every picture is a real render from the style's 3D engine.
import * as THREE from 'three';
import { ctx } from './core/lib.js';
import { startBoard, panel, frame, small, swatches, rules } from './core/board.js';
import { makeEngine, camera, lightRig } from './core/engine.js';
import { Human } from './core/human.js';
import * as SETS from './core/sets.js';
import { caption, label } from './core/look2d.js';

await document.fonts.load('900 40px Inter'); await document.fonts.load('800 40px Inter');
const E = makeEngine(document.getElementById('gl')), E2 = makeEngine(document.getElementById('gl2'), { w: 1280, h: 860 });
const GL = document.getElementById('gl'), GL2 = document.getElementById('gl2');
const cam = camera(30);
const B = startBoard(document.getElementById('cv'), { title: 'DEEP DIVE 3D: VIDEO STYLE SHEET', bg: '#14161B', line: '#3B4150', head: '#F4F1EA', accent: '#FFD43B' });
const shot = (x, y, w, renderFn, over) => frame(x, y, w, () => { renderFn(); ctx.drawImage(GL, 0, 0); if (over) over(); });
const wide = (box, renderFn, over) => { renderFn(); B.save(); B.beginPath(); B.roundRect(box.x, box.y, box.w, box.h, 12); B.clip(); B.drawImage(GL2, box.x, box.y, box.w, box.h); B.restore(); if (over) over(); };

// sets reused across panels
const K = SETS.kitchen(E), hero = new Human({}); K.scene.add(hero.group);

// 1 · hero frame
let b = panel(20, 80, 560, 520, 1, 'HERO FRAME');
shot(b.x + 6, b.y, 240, () => {
  hero.group.position.set(0.1, 0, -0.6); hero.pose({ head: [10, 14, -4], spine: [6, 8, 0], shR: [28, 0, -6], elR: 78, shL: [20, 0, -4], elL: 60, look: [-10, 8], lid: -0.4 });
  cam.position.set(0.95, 1.42, 1.9); cam.lookAt(0.1, 1.22, -0.6); E.render(K.scene, cam, { focus: 2.35, aperture: 0.004, maxblur: 0.01, bloom: 0.2 });
}, () => { caption([{ txt: 'What' }, { txt: 'if' }, { txt: 'you' }], 540, 1500); caption([{ txt: 'swallowed' }, { txt: 'gum?', hi: 1 }], 540, 1640); });
small('STYLIZED 3D PEOPLE\nIN SUNLIT SETS', b.x + 270, b.y + 40, 'left', 17);
small('X-RAY CUTAWAYS\nINTO THE BODY', b.x + 270, b.y + 130, 'left', 17);
small('MACRO JOURNEYS\nTHROUGH CELLS', b.x + 270, b.y + 220, 'left', 17);
small('SHALLOW FOCUS,\nWARM LOW SUN', b.x + 270, b.y + 310, 'left', 17);

// 2 · palette + cast
b = panel(590, 80, 660, 520, 2, 'PALETTE & CAST');
const yy = swatches(b, [['SUN', '#FFD9AE'], ['SKIN', '#E3A988'], ['SHIRT', '#3E7CC9'], ['CREAM', '#E8DCCB'], ['X-RAY', '#4FD1E8'], ['ORGAN', '#E87A8C'], ['BLOOD', '#B8283A'], ['NIGHT', '#0B1A30']]);
const castScene = new THREE.Scene(); castScene.background = new THREE.Color('#E8DCCB'); castScene.environment = E2.envMap; castScene.environmentIntensity = 0.3;
{ const f = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: '#DCCDB8', roughness: 0.9 })); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; castScene.add(f); lightRig(castScene, { keyPos: [2, 4, 4], shadowBox: 3 }); }
[[{}, -0.75, { head: [0, 15, 0], shR: [10, 0, 30], elR: 40 }], [{ skin: '#B97A56', shirt: '#E07A3F', pants: '#4A4F5C', hair: '#16100C', iris: '#2A1C12' }, 0, { head: [5, -5, 0], shL: [80, 0, 20], elL: 70 }], [{ skin: '#F0C3A2', shirt: '#6DAA6A', pants: '#3D3A5C', hair: '#C98C3E', iris: '#4E7A94' }, 0.75, { head: [-4, -18, 0], shR: [0, 0, 18] }]]
  .forEach(([look, x, pose]) => { const h = new Human(look); h.group.position.x = x; h.group.rotation.y = -x * 0.35; h.pose(pose); castScene.add(h.group); });
const c2 = new THREE.PerspectiveCamera(26, 1280 / 860, 0.05, 100); c2.position.set(0, 1.25, 4.6); c2.lookAt(0, 0.95, 0);
wide({ x: b.x, y: yy + 6, w: b.w, h: 262 }, () => E2.render(castScene, c2, { aperture: 0, bloom: 0.15 }));
small('ONE BODY, MANY LOOKS: SKIN, HAIR, CLOTHES SWAP PER VIDEO', b.x + b.w / 2, yy + 300, 'center', 14, '#C9CDD6');

// 3 · components
b = panel(1260, 80, 640, 520, 3, 'COMPONENTS');
{
  const s = new THREE.Scene(); s.background = new THREE.Color('#0B1A30'); s.add(new THREE.HemisphereLight('#CFEFFF', '#0A1020', 1.2)); const k = new THREE.DirectionalLight('#FFFFFF', 2.5); k.position.set(2, 3, 4); s.add(k); s.environment = E2.envMap; s.environmentIntensity = 0.5;
  const I = SETS.insides(); const st = I.stomach.clone(); st.position.set(-0.1, 0.02, 0); st.scale.setScalar(1.5); st.rotation.set(0.2, -0.4, 0); s.add(st);
  const ht = I.heart.clone(); ht.position.set(0.2, 0.02, 0); ht.scale.setScalar(1.9); s.add(ht);
  const V = SETS.vessel(E2); const cell = V.scene.children.find((o) => o.isInstancedMesh);
  const rb = new THREE.Mesh(cell.geometry, cell.material); rb.position.set(0.46, 0.02, 0); rb.rotation.set(1.1, 0.3, 0); rb.scale.setScalar(0.27); s.add(rb); const rb2 = rb.clone(); rb2.rotation.x += Math.PI; s.add(rb2);
  const xr = new Human({}); xr.setBodyMaterial(SETS.xrayMaterial()); const ins = SETS.insides(); xr.spine.add(ins.group); xr.group.scale.setScalar(0.48); xr.group.position.set(-0.42, -0.62, 0); xr.pose({}); s.add(xr.group);
  const cc = new THREE.PerspectiveCamera(30, 1280 / 860, 0.05, 50); cc.position.set(0, 0.0, 1.55); cc.lookAt(0, 0.0, 0);
  wide({ x: b.x, y: b.y, w: b.w, h: b.h - 8 }, () => E2.render(s, cc, { aperture: 0, bloom: 0.5, bloomThreshold: 0.4 }), () => {
    [['X-RAY BODY', 0.15], ['STOMACH', 0.41], ['HEART', 0.64], ['BLOOD CELL', 0.87]].forEach(([t, fx]) => small(t, b.x + b.w * fx, b.y + b.h - 30, 'center', 15, '#CFEFFF'));
  });
}

// 4 · scenes
b = panel(20, 610, 760, 456, 4, 'SCENES');
const sw = 200, sx = (i) => b.x + 20 + i * (sw + 45);
shot(sx(0), b.y, sw, () => { hero.group.position.set(0.1, 0, -0.4); hero.group.rotation.y = 0.5; hero.walk(0.9); cam.position.set(1.2, 1.35, 3.3); cam.lookAt(0.3, 1.0, -0.9); E.render(K.scene, cam, { focus: 3.6, aperture: 0.002, bloom: 0.2 }); });
const X = SETS.xrayStage(E), xh = new Human({}); X.scene.add(xh.group); xh.setBodyMaterial(SETS.xrayMaterial()); xh.spine.add(SETS.insides().group); xh.pose({ head: [4, -10, 0], look: [8, 0] });
shot(sx(1), b.y, sw, () => { cam.position.set(0.3, 1.25, 2.4); cam.lookAt(0, 1.15, 0); E.render(X.scene, cam, { focus: 2.4, aperture: 0.0015, bloom: 0.55, bloomThreshold: 0.4 }); }, () => label('STOMACH', 300, 880, 520, 1060));
const VS = SETS.vessel(E); shot(sx(2), b.y, sw, () => { VS.update(1.3, 0); cam.position.set(0, 0, 0); cam.lookAt(0.15, -0.1, -5); E.render(VS.scene, cam, { focus: 3.2, aperture: 0.005, maxblur: 0.012, bloom: 0.6, bloomThreshold: 0.5 }); });
['(A) THE REAL WORLD', '(B) THE X-RAY', '(C) INSIDE THE BODY'].forEach((t, i) => small(t, sx(i) + sw / 2, b.y + sw * 16 / 9 + 26, 'center', 15));

// 5 · captions
b = panel(790, 610, 520, 456, 5, 'CAPTIONS');
wide({ x: b.x, y: b.y, w: b.w, h: b.h - 10 }, () => { hero.group.position.set(0.1, 0, -0.6); hero.pose({ head: [0, 10, 0] }); const c3 = new THREE.PerspectiveCamera(30, 1280 / 860, 0.05, 100); c3.position.set(1.2, 1.4, 2.2); c3.lookAt(0.6, 1.1, -1.4); E2.render(K.scene, c3, { focus: 0.6, aperture: 0.02, maxblur: 0.02, bloom: 0.2 }); }, () => {
  const sc = 0.42, mid = b.x + b.w / 2;
  [[[{ txt: 'Your' }, { txt: 'stomach', hi: 1 }], 70], [[{ txt: 'can\'t' }, { txt: 'digest', hi: 1 }, { txt: 'it' }], 170], [[{ txt: 'In' }, { txt: '3', hi: 1 }, { txt: 'days...' }], 270]]
    .forEach(([w, y]) => { B.save(); B.translate(mid, b.y + y); B.scale(sc, sc); caption(w, 0, 0); B.restore(); });
  small('SENTENCE CASE · 1-3 WORDS · ONE YELLOW WORD', mid, b.y + b.h - 30, 'center', 14, '#FFFFFF');
});

// 6 · rules
b = panel(1320, 610, 580, 456, 6, 'RULES');
rules(b, ['OPEN ON THE MOST DRAMATIC MOMENT.', 'CAMERA ALWAYS MOVING; CUT EVERY 1-2 S.', 'REAL WORLD → X-RAY → INSIDE, AND BACK.', 'WARM SUN OUTSIDE, CYAN INSIDE THE BODY.', 'SHALLOW FOCUS: SOFT BACKGROUND ALWAYS.', 'NO GORE: INJURY SHOWN AS X-RAY OR GLOW.', 'MOOD: CURIOUS, SHOCKING, SATISFYING.'], b.y + 26, 17, 52);
window.SHEET_READY = true;

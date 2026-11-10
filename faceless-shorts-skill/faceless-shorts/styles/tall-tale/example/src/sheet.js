// The Tall Tale style sheet: every picture is drawn by the style's own engine (3D sets + 2D cut-out people).
import * as THREE from 'three';
import { ctx } from './core/lib.js';
import { startBoard, panel, frame, small, rules } from './core/board.js';
import { makeEngine, camera } from './core/engine.js';
import * as WD from './core/world.js';
import { Toon, drawToon, PROPS } from './core/toon.js';
import { captionText } from './core/captions.js';

await document.fonts.load('900 40px Inter'); await document.fonts.load('800 40px Inter'); await document.fonts.load('700 40px Caladea');
const GL = document.getElementById('gl'), GL2 = document.getElementById('gl2');
GL.width = 648; GL.height = 1152;
const E = makeEngine(GL, { w: 648, h: 1152, samples: 0 }), E2 = makeEngine(GL2, { w: 1280, h: 860, samples: 0 });
const cam = camera(36);
const B = startBoard(document.getElementById('cv'), { title: 'TALL TALE 3D: VIDEO STYLE SHEET', bg: '#1B1A22', line: '#43414F', head: '#FFF6E6', accent: '#F2C230' });
const shot = (x, y, w, renderFn, over) => frame(x, y, w, () => { renderFn(); ctx.drawImage(GL, 0, 0, 1080, 1920); if (over) over(); });
const wide = (box, renderFn, over) => { renderFn(); B.save(); B.beginPath(); B.roundRect(box.x, box.y, box.w, box.h, 12); B.clip(); B.drawImage(GL2, box.x, box.y, box.w, box.h); B.restore(); if (over) over(); };

export const CAST = {
  hero: { body: '#E8734A', hat: 'cap', hatCol: '#6E8A4F', neck: 'scarf', neckCol: '#F2C230' },
  skeptic: { body: '#8C6FC9', hat: 'bowler', hatCol: '#3B3346', neck: 'tie', neckCol: '#E2B33C', pattern: 'check', patCol: '#6A50A8', extra: ['mustache'] },
  clerk: { body: '#4FB3A9', hat: 'visor', hatCol: '#2F8F5B', neck: 'collar', pattern: 'vest', patCol: '#2B5E73', extra: ['pencil'] },
  neighbor: { body: '#F2B8C6', hat: 'flower', pattern: 'apron', extra: ['glasses'] },
  kid: { body: '#F2C230', hat: 'beanie', hatCol: '#D8343F', pattern: 'overalls', extra: ['freckles'] },
  boss: { body: '#5C8FD6', hat: 'tophat', hatCol: '#2A2638', neck: 'bowtie', neckCol: '#D8343F', dots: 1, extra: ['monocle'] },
};

// sets
const S = WD.mainStreet(E);
const hero = new Toon(CAST.hero); S.scene.add(hero.group);

// 1 · hero frame
let b = panel(20, 80, 540, 520, 1, 'HERO FRAME');
shot(b.x + 4, b.y, 246, () => {
  hero.at(-1.0, 0, -3); hero.set({ mood: 'smug', armR: [30, -84], holdR: PROPS.mirror });
  cam.position.set(-0.45, 1.5, 0.1); cam.lookAt(-0.95, 1.3, -3); hero.face(cam); S.faceAll(cam);
  E.render(S.scene, cam, { focus: 3.1, aperture: 0.0012, maxblur: 0.008, bloom: 0.15 });
}, () => captionText('smiling,'));
[['2D CARTOON PEOPLE', 'thick ink outlines'], ['INSIDE A 3D WORLD', 'sun, shadows, depth'], ['CAMERA ALWAYS MOVES', 'push-ins, pans, fly-overs'], ['A FUNNY TRUE STORY', 'told like a tale'], ['ONE WORD AT A TIME', 'white, centre screen']]
  .forEach(([a, c], i) => { small(a, b.x + 270, b.y + 34 + i * 86, 'left', 16, '#FFF6E6'); small(c.toUpperCase(), b.x + 270, b.y + 58 + i * 86, 'left', 12, '#A9A6B8'); });

// 2 · cast
b = panel(570, 80, 690, 520, 2, 'THE CAST');
{
  const g = B; g.save(); g.beginPath(); g.roundRect(b.x, b.y, b.w, b.h - 8, 12); g.clip();
  const gr = g.createLinearGradient(0, b.y, 0, b.y + b.h); gr.addColorStop(0, '#9FD3F0'); gr.addColorStop(0.72, '#CDEBF8'); gr.addColorStop(0.72, '#E3B07A'); gr.addColorStop(1, '#C98A52');
  g.fillStyle = gr; g.fillRect(b.x, b.y, b.w, b.h);
  const roles = [['hero', 'THE HERO', { mood: 'smug', armR: [30, -84], holdR: PROPS.mirror }], ['skeptic', 'THE SKEPTIC', { mood: 'laugh', armL: [150, 20] }], ['clerk', 'THE CLERK', { mood: 'shock', armL: [40, -40], armR: [40, -40] }],
    ['neighbor', 'NEIGHBOR', { mood: 'worried', armR: [20, -110] }], ['kid', 'THE KID', { mood: 'happy', legs: 'jump', armL: [140, 10], armR: [140, 10] }], ['boss', 'THE BOSS', { mood: 'proud', armL: [30, -70], holdL: PROPS.stack }]];
  roles.forEach(([k, name, st], i) => { g.save(); g.translate(b.x + 6 + i * 110, b.y + 40); g.scale(0.22, 0.22); drawToon(g, CAST[k], st); g.restore(); small(name, b.x + 62 + i * 110, b.y + b.h - 30, 'center', 13, '#2A2638'); });
  g.restore();
  small('RECIPE: ROUND WHITE HEAD · BEAN BODY · STICK LIMBS · ONE HAT + ONE NECK THING', b.x + b.w / 2, b.y + b.h + 6, 'center', 12, '#A9A6B8');
}

// 3 · faces
b = panel(1270, 80, 630, 520, 3, 'FACES DO THE ACTING');
{
  const moods = ['neutral', 'smug', 'happy', 'laugh', 'shock', 'worried', 'angry', 'sad', 'sly', 'proud', 'tired', 'dizzy'];
  moods.forEach((m, i) => {
    const cx = b.x + 52 + (i % 6) * 100, cy = b.y + 20 + Math.floor(i / 6) * 215;
    B.save(); B.beginPath(); B.roundRect(cx - 46, cy, 92, 150, 10); B.fillStyle = '#2A2833'; B.fill(); B.clip();
    B.translate(cx - 75, cy + 4); B.scale(0.29, 0.29); drawToon(B, CAST.hero, { mood: m, look: m === 'sly' ? [1, 0] : [0, 0] }); B.restore();
    small(m.toUpperCase(), cx, cy + 176, 'center', 13, '#FFF6E6');
  });
}

// 4 · worlds
b = panel(20, 610, 760, 456, 4, 'WORLDS');
const sw = 206, sx = (i) => b.x + 14 + i * (sw + 40);
const I = WD.interior(E, { view: WD.snapshot(E, S.scene, (() => { const c = new THREE.PerspectiveCamera(40, 4 / 3, 0.1, 800); c.position.set(0, 1.8, 9); c.lookAt(0, 2.4, -20); S.faceAll(c); return c; })()) });
shot(sx(0), b.y, sw, () => { hero.at(0.6, 0, -6); hero.set({ mood: 'happy', legs: 'walk', phase: 0.8 }); cam.position.set(-1.6, 2.6, 4); cam.lookAt(0.6, 1.6, -14); hero.face(cam); S.faceAll(cam); E.render(S.scene, cam, { focus: 10, aperture: 0.0004, bloom: 0.15 }); });
{
  const clerk = new Toon(CAST.clerk), h3 = new Toon(CAST.hero); I.scene.add(clerk.group, h3.group);
  clerk.at(2.75, 0, -3.4); clerk.set({ mood: 'shock', armL: [40, -40], armR: [40, -40] }); h3.at(1.25, 0, -2.6); h3.set({ mood: 'smug', armR: [26, -72], holdR: PROPS.stack });
  shot(sx(1), b.y, sw, () => { cam.position.set(0.1, 1.65, 2.2); cam.lookAt(1.9, 1.25, -3.2); clerk.face(cam); h3.face(cam); E.render(I.scene, cam, { focus: 4.6, aperture: 0.0008, bloom: 0.3 }); });
}
const M = WD.meadow(E, { sunset: true });
{
  const k = new Toon(CAST.kid); M.scene.add(k.group); k.at(0, 0, -2); k.set({ mood: 'happy', armL: [150, 10] }); k.tint('#FFE6DA');
  shot(sx(2), b.y, sw, () => { cam.position.set(0.9, 1.0, 2.6); cam.lookAt(0, 1.4, -2); k.face(cam); E.render(M.scene, cam, { focus: 4.8, aperture: 0.0012, bloom: 0.35 }); });
}
['(A) MAIN STREET', '(B) INSIDE THE SHOP', '(C) THE MEADOW, SUNSET'].forEach((t, i) => small(t, sx(i) + sw / 2, b.y + sw * 16 / 9 + 24, 'center', 14));

// 5 · captions
b = panel(790, 610, 520, 456, 5, 'CAPTIONS');
wide({ x: b.x, y: b.y, w: b.w, h: b.h - 10 }, () => {
  hero.at(-0.2, 0, -3); hero.set({ mood: 'shock', look: [0.6, 0] });
  const c3 = new THREE.PerspectiveCamera(32, 1280 / 860, 0.05, 800); c3.position.set(0.5, 1.5, 0.6); c3.lookAt(-0.2, 1.4, -3); hero.face(c3); S.faceAll(c3);
  E2.render(S.scene, c3, { focus: 3.4, aperture: 0.003, maxblur: 0.012, bloom: 0.15 });
}, () => {
  const mid = b.x + b.w / 2;
  [['He bet', 60], ['everything', 160], ['a single', 260]].forEach(([w, y]) => { B.save(); B.translate(mid, b.y + y); B.scale(0.5, 0.5); captionText(w, 0, 0); B.restore(); });
  small('ONE WORD AT A TIME · WHITE · BLACK EDGE · CENTRE', mid, b.y + b.h - 34, 'center', 13, '#FFFFFF');
});

// 6 · rules
b = panel(1320, 610, 580, 456, 6, 'RULES');
rules(b, ['OPEN ON THE ENDING: "HE BET IT ALL..."', 'THEN REWIND AND SHOW THE TRICK, STEP BY STEP.', 'NEW SHOT EVERY 1.5-3 S; THE CAMERA NEVER STOPS.', 'FACES REACT ON EVERY BEAT (SMUG, SHOCK, LAUGH).', 'SHORT LINES OF DIALOGUE FROM THE CROWD.', 'BRIGHT SUN BY DAY, PINK SUNSETS, WARM ROOMS.', 'END ON A PUNCHLINE THAT FLIPS THE START.'], b.y + 26, 16, 52);
window.SHEET_READY = true;

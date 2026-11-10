// WHAT HAPPENS IF YOU HOLD YOUR BREATH? : the shot list (Deep Dive 3D example).
// A shot: { id, at, note, draw(lt, d, t, blit) } : render the 3D frame with E.render(...), call blit() to put it on the
// 2D canvas, then draw 2D overlays (labels, pills). The camera moves in EVERY shot. Times come from the voice:
// cut(i) = just before line i, Wd('word', i) = when that word is said.
import * as THREE from 'three';
import { ctx, W, H, clamp, lerp, seg, eo, eio, eob } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';
import { camera } from './core/engine.js';
import { Human } from './core/human.js';
import * as SETS from './core/sets.js';
import { label, pill, warning, blackout } from './core/look2d.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lerpV = (a, b, k) => a.clone().lerp(b, k);
function screen(p, cam) { const v = p.clone().project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; }

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const cam = camera(30);
  const KLOOK = { aperture: 0.003, maxblur: 0.01, bloom: 0.2 }, XLOOK = { aperture: 0.0015, bloom: 0.55, bloomThreshold: 0.4, vignette: 0.45 }, VLOOK = { aperture: 0.005, maxblur: 0.012, bloom: 0.6, bloomThreshold: 0.5, focus: 3.2 };

  // ── the world ──────────────────────────────────────────────────────────
  const K = SETS.kitchen(E), hero = new Human({}); hero.group.position.set(0.1, 0, -0.6); K.scene.add(hero.group);
  const X = SETS.xrayStage(E), xh = new Human({}), xmat = SETS.xrayMaterial(); xh.setBodyMaterial(xmat); const I = SETS.insides(); xh.spine.add(I.group); X.scene.add(xh.group);
  const VS = SETS.vessel(E);
  const CYAN = new THREE.Color('#4FD1E8'), RED = new THREE.Color('#FF3B3B');
  const chest = (h, k) => h.parts[0].scale.set(1 + 0.03 * k, 1 + 0.012 * k, 1 + 0.08 * k);          // inhale 0..1
  const lungs = (k) => I.lungs.forEach((l) => l.scale.set(1 + 0.12 * k, 1 + 0.1 * k, 1 + 0.12 * k));
  const reset = () => { hero.pose({}); chest(hero, 0); xh.pose({}); chest(xh, 0); lungs(0); I.heart.scale.setScalar(1); xmat.uniforms.uCol.value.copy(CYAN); };
  const kitchenRender = (focus, extra = {}) => E.render(K.scene, cam, { ...KLOOK, focus, ...extra });
  const FACE = V3(0.1, 1.68, -0.6);

  // 1 · HOOK: deep breath in, then hold (face close-up, camera pushing in)
  { const st = cut(0);
    add({ id: 'S01', at: st, note: 'face close-up: big inhale, then hold, wide eyes', draw(lt, d, t, blit) {
      reset(); const k = eo(seg(lt, 0.1, 1.1));
      hero.pose({ head: [-8 * k + 6 * seg(lt, 1.1, 1.6), 4, 0], spine: [-3 * k, 0, 0], lid: lerp(0, -0.35, k), look: [0, -4 * k], shL: [5, 0, 6 + 4 * k], shR: [5, 0, 6 + 4 * k] }); chest(hero, k);
      cam.position.copy(lerpV(V3(0.42, 1.72, 0.45), V3(0.3, 1.7, 0.12), eio(lt / d))); cam.lookAt(FACE); kitchenRender(cam.position.distanceTo(FACE)); blit();
    } });
    cue(st + 0.12, 'inhale', { dur: 1.0 }); }

  // 2 · the first 30 seconds: nothing much (medium shot, orbit, a timer counts up)
  { const st = cut(1);
    add({ id: 'S02', at: st, note: 'medium shot orbit, timer 0:00 to 0:30', draw(lt, d, t, blit) {
      reset(); hero.pose({ head: [2, -6 + Math.sin(lt * 2) * 3, 0], lid: -0.15, look: [6, 0] }); chest(hero, 1); hero.group.position.y = Math.sin(lt * 3) * 0.003;
      const a = lerp(0.55, 0.2, eio(lt / d)); cam.position.set(0.1 + Math.sin(a) * 2.1, 1.45, -0.6 + Math.cos(a) * 2.1); cam.lookAt(0.1, 1.25, -0.6); kitchenRender(2.1); blit();
      const s = Math.round(30 * clamp(lt / (d * 0.85))); pill(`0:${String(s).padStart(2, '0')}`, 540, 1180, eob(seg(lt, 0, 0.25)), '#FFD43B', 'rgba(12,14,20,0.8)', 74);
    } });
    cue(st, 'whoosh'); cue(st + 0.05, 'pop', { gain: 0.6 }); }

  // 3 · lungs are full (x-ray) …
  const blood = Wd('blood', 2) - 0.08;
  { const st = cut(2);
    add({ id: 'S03', at: st, note: 'x-ray chest, lungs full', draw(lt, d, t, blit) {
      reset(); lungs(1 + Math.sin(lt * 3) * 0.05); chest(xh, 1); xh.pose({ head: [4, -6, 0] });
      cam.position.copy(lerpV(V3(0.55, 1.5, 1.6), V3(0.3, 1.42, 1.1), eio(lt / d))); cam.lookAt(0, 1.33, 0); E.render(X.scene, cam, { ...XLOOK, focus: cam.position.distanceTo(V3(0, 1.33, 0)) }); blit();
      const [lx, ly] = screen(V3(0.1, 1.42, 0.05), cam); label('LUNGS: FULL', 760, 520, lx, ly, eob(seg(lt, 0.2, 0.45)));
    } });
    cue(st, 'whoosh'); cue(st + 0.25, 'pop', { gain: 0.5 }); }
  // … and your blood is still full of oxygen (macro, bright red cells)
  add({ id: 'S04', at: blood, note: 'blood vessel, bright red cells, OXYGEN pill', draw(lt, d, t, blit) {
    VS.update(t, -lt * 1.6, 0, 0); cam.position.set(0, 0, -lt * 1.6); cam.lookAt(0.15, -0.08, -lt * 1.6 - 5); E.render(VS.scene, cam, VLOOK); blit();
    pill('OXYGEN ✓', 540, 330, eob(seg(lt, 0.15, 0.4)), '#7CF29A');
  } });
  cue(blood, 'whoosh'); cue(blood, 'slide', { dur: cut(3) - blood, gain: 0.5 });

  // 5 · carbon dioxide builds up (bubbles fill the vessel, cells darken)
  { const st = cut(3);
    add({ id: 'S05', at: st, note: 'CO2 bubbles fill the vessel, cells darken', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); VS.update(t, -lt * 1.2, 0.15 + 0.85 * k, 0.45 * k);
      cam.position.set(Math.sin(lt) * 0.1, 0, -lt * 1.2); cam.lookAt(0.1, -0.05, -lt * 1.2 - 5); E.render(VS.scene, cam, VLOOK); blit();
      pill('CO₂ ↑', 540, 330, eob(seg(lt, 0.1, 0.35)) * (1 + 0.06 * Math.sin(lt * 8)), '#C9D6DD');
    } });
    cue(st, 'whoosh'); cue(st + 0.1, 'bubbles', { dur: cut(4) - st }); }

  // 6 · that's what makes you desperate (x-ray turns red, alarm)
  { const st = cut(4);
    add({ id: 'S06', at: st, note: 'x-ray body pulses red: CO2 alarm', draw(lt, d, t, blit) {
      reset(); chest(xh, 1); lungs(1); const p = 0.5 + 0.5 * Math.sin(lt * 7); xmat.uniforms.uCol.value.copy(CYAN).lerp(RED, clamp(lt / 0.8) * (0.55 + 0.45 * p));
      xh.pose({ head: [-4, 10 * Math.sin(lt * 1.3), 0], spine: [0, 0, Math.sin(lt * 9) * 1.2], lid: -0.4 });
      cam.position.copy(lerpV(V3(-0.4, 1.6, 1.9), V3(-0.15, 1.6, 1.25), eio(lt / d))); cam.lookAt(0, 1.45, 0); E.render(X.scene, cam, { ...XLOOK, bloom: 0.75, focus: cam.position.distanceTo(V3(0, 1.45, 0)) }); blit();
      pill('CO₂ ALARM', 540, 1200, eob(seg(lt, 0.2, 0.45)), '#FF5A5A');
    } });
    cue(st, 'whoosh'); cue(st + 0.2, 'alarm', { dur: cut(5) - st - 0.2 }); }

  // 7 · diaphragm twitches (3/4 x-ray, lungs jerk)
  { const st = cut(5), P = 0.62, twitch = (lt) => { const c = (lt - 0.25) % P; return lt < 0.25 ? 0 : Math.exp(-c * 14) * (c >= 0 ? 1 : 0); };
    add({ id: 'S07', at: st, note: 'diaphragm spasms: lungs jerk, body jolts', draw(lt, d, t, blit) {
      reset(); const j = twitch(lt); chest(xh, 1 + j * 0.8); lungs(1 + j * 1.2); xmat.uniforms.uCol.value.copy(CYAN).lerp(RED, 0.25);
      xh.pose({ spine: [6 * j, 0, 0], head: [4 * j, -15, 0], lid: -0.3 });
      cam.position.copy(lerpV(V3(1.25, 1.35, 1.05), V3(0.95, 1.3, 0.8), eio(lt / d))); cam.lookAt(0, 1.25, 0); E.render(X.scene, cam, { ...XLOOK, focus: cam.position.distanceTo(V3(0, 1.25, 0)) }); blit();
      const [lx, ly] = screen(V3(0.02, 1.2, 0.08), cam); label('DIAPHRAGM', 330, 1150, lx, ly, eob(seg(lt, 0.3, 0.55)));
    } });
    cue(st, 'whoosh'); for (let k = 0; st + 0.25 + k * P < cut(6); k++) cue(st + 0.25 + k * P, 'thud', { gain: 0.45 }); }

  // 8 · the heart slows (heart close-up, beats spreading out)
  { const st = cut(6), end = cut(7), beats = []; let bt = 0.15, gap = 0.5; while (st + bt < end) { beats.push(bt); bt += gap; gap = Math.min(1.05, gap * 1.18); }
    const pulse = (lt) => beats.reduce((a, b) => Math.max(a, lt >= b ? Math.exp(-(lt - b) * 9) : 0), 0);
    add({ id: 'S08', at: st, note: 'heart close-up, beats slow down', draw(lt, d, t, blit) {
      reset(); chest(xh, 1); lungs(1); const p = pulse(lt); I.heart.scale.setScalar(1 + p * 0.16); I.heart.material.emissiveIntensity = 0.18 + p * 0.8;
      const H0 = V3(0.025, 1.41, 0.07); cam.position.copy(lerpV(V3(0.25, 1.48, 0.62), V3(0.12, 1.44, 0.42), eio(lt / d))); cam.lookAt(H0); E.render(X.scene, cam, { ...XLOOK, bloom: 0.6, focus: cam.position.distanceTo(H0), aperture: 0.004 }); blit();
      pill('HEART RATE ↓', 540, 330, eob(seg(lt, 0.2, 0.45)), '#FF8A8A');
    } });
    cue(st, 'whoosh'); beats.forEach((b) => cue(st + b, 'heartbeat')); }

  // 9 · the brain switches you off (face, eyes close, fade to black)
  { const st = cut(7), off = Wd('switches', 7) - st;
    add({ id: 'S09', at: st, note: 'face: eyes close, head drops, blackout', draw(lt, d, t, blit) {
      reset(); const k = eio(seg(lt, off - 0.4, d)); chest(hero, 1 - k * 0.5);
      hero.pose({ head: [12 * k, -4, 6 * k], spine: [5 * k, 0, 2 * k], lid: lerp(-0.1, 1.05, k), look: [0, 6 * k] });
      cam.position.copy(lerpV(V3(-0.25, 1.7, 0.2), V3(-0.18, 1.62, 0.0), eio(lt / d))); cam.up.set(Math.sin(k * 0.12), 1, 0); cam.lookAt(V3(0.1, 1.64 - 0.05 * k, -0.6)); kitchenRender(0.75, { aperture: 0.004 }); cam.up.set(0, 1, 0); blit();
      blackout(seg(lt, off, d));
    } });
    cue(st + off, 'slide', { dur: 1.2, gain: 0.5 }); }

  // 10 · you pass out, and breathing restarts on its own (dark → x-ray lungs inflate)
  { const st = cut(8), br = Wd('breathing', 8) - st;
    add({ id: 'S10', at: st, note: 'from black: lungs inflate by themselves', draw(lt, d, t, blit) {
      reset(); const on = seg(lt, 0.3, br), cyc = lt > br ? 0.5 - 0.5 * Math.cos((lt - br) * 3.2) : 0; lungs(0.2 + cyc * 1.1); chest(xh, cyc); xh.pose({ head: [10, 0, 4], lid: 1 });
      cam.position.copy(lerpV(V3(0, 1.4, 1.4), V3(0.05, 1.38, 1.05), eio(lt / d))); cam.lookAt(0, 1.33, 0); E.render(X.scene, cam, { ...XLOOK, exposure: 0.15 + 0.85 * on, focus: cam.position.distanceTo(V3(0, 1.33, 0)) }); blit();
      label('AUTOMATIC', 780, 560, ...screen(V3(0.1, 1.4, 0.05), cam), lt > br ? eob(seg(lt, br, br + 0.3)) : 0);
    } });
    cue(st + br, 'inhale', { dur: 1.0 }); cue(st + br + 1.6, 'inhale', { dur: 1.0, gain: 0.7 }); }

  // 11 · never underwater (back in the kitchen, he looks at us; warning)
  { const st = cut(9);
    add({ id: 'S11', at: st, note: 'hero looks at camera, warning sign', draw(lt, d, t, blit) {
      reset(); hero.pose({ head: [-2, 0, 0], lid: 0.05, look: [0, 0] }); chest(hero, 0.3);
      cam.position.copy(lerpV(V3(0.0, 1.62, 0.9), V3(0.05, 1.64, 0.55), eio(lt / d))); cam.lookAt(0.1, 1.6, -0.6); kitchenRender(cam.position.distanceTo(FACE)); blit();
      warning(540, 1150, eob(seg(lt, 0.25, 0.55)) * 0.95);
    } });
    cue(st, 'whoosh'); cue(st + 0.25, 'slam', { gain: 0.7 }); }

  return { shots: S, cues: CUES };
}

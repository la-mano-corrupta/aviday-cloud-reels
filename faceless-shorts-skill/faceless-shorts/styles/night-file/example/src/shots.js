// THE MAN WHO JUMPED OUT OF A PLANE (D.B. Cooper, 1971) : the shot list (Night File 3D example).
// Faceless people: witnesses are dark with a red rim, the subject glows solid red. Slow camera, one light per scene.
import * as THREE from 'three';
import { ctx, setCtx, W, H, clamp, lerp, seg, eo, eio, eob, rr } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';
import { camera } from './core/engine.js';
import { Human } from './core/human.js';
import * as SETS from './core/sets3d.js';
import * as K from './core/kit.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z), lerpV = (a, b, k) => a.clone().lerp(b, k);
const NIGHT = { exposure: 1.25, bloom: 0.85, bloomThreshold: 0.55, vignette: 0.6, grain: 0.05, warm: 0 };
/** paper insert (ticket / note) drawn in 2D */
function paper(x, y, w, h, rot, lines, sc = 1) {
  if (sc <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 40;
  rr(-w / 2, -h / 2, w, h, 6); ctx.fillStyle = K.P.paper; ctx.fill(); ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  lines.forEach(([txt, size, col, dy]) => { ctx.font = `700 ${size}px FreeMono`; ctx.fillStyle = col || K.P.ink; ctx.fillText(txt, -w / 2 + 40, -h / 2 + dy); });
  ctx.restore();
}

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.1);
  const cam = camera(34);
  const C = SETS.planeCabin(), CW = SETS.caseWall([0, 1, 2].map((k) => { const c = document.createElement('canvas'); c.width = 360; c.height = 420; const g = c.getContext('2d'), prev = ctx; setCtx(g); g.fillStyle = '#D8CFBA'; g.fillRect(0, 0, 360, 420); g.save(); g.translate(180, 210); g.scale(1.5, 1.5); K.polaroid(0, 0, 1, 0, ['glow', 'house', 'dark'][k]); g.restore(); setCtx(prev); return c; }));
  const person = (kind) => { const h = new Human({ face: false }); h.setAllMaterial(kind === 'subject' ? SETS.subjectMat() : SETS.witnessMat()); return h; };
  const cooper = person('subject'), crew = person('witness'); C.scene.add(cooper.group, crew.group);
  const seated = []; [[-1.07, -0.4], [1.07, -1.65], [-0.55, -2.9], [1.07, -4.15], [-1.07, -5.4], [0.55, -6.65]].forEach(([x, z]) => { const h = person('witness'); h.group.position.set(x, 0, z + 0.08); h.hips.position.y = 0.66; h.pose({ hipL: [88, 0, 2], hipR: [88, 0, 2], knL: 88, knR: 88, spine: [-6, 0, 0], shL: [30, 0, 4], shR: [30, 0, 4], elL: 50, elR: 50 }); C.scene.add(h.group); seated.push(h); });
  const sit = (h, x, z) => { h.group.position.set(x, 0, z); h.group.rotation.set(0, 0, 0); h.hips.position.y = 0.66; h.pose({ hipL: [88, 0, 2], hipR: [88, 0, 2], knL: 88, knR: 88, spine: [-4, 0, 0], shL: [30, 0, 4], shR: [30, 0, 4], elL: 55, elR: 55 }); };
  const render = (scene, focusP, extra = {}) => { if (cam.fov !== (extra.fov || 34)) { cam.fov = extra.fov || 34; cam.updateProjectionMatrix(); } E.render(scene, cam, { ...NIGHT, focus: cam.position.distanceTo(focusP), aperture: 0.0012, ...extra }); };
  const hideAll = () => { cooper.group.visible = crew.group.visible = false; seated.forEach((h) => (h.group.visible = true)); C.update(0, {}); };

  // 1 · the date types on over the dark cabin
  add({ id: 'S01', at: 0, note: 'cabin from the front, date types on', draw(lt, d, t, blit) {
    hideAll(); cam.position.copy(lerpV(V3(0.3, 1.55, 1.8), V3(0.15, 1.5, 0.6), eio(lt / d))); cam.lookAt(0, 1.1, -10); render(C.scene, V3(0, 1, -5)); blit();
    K.dateStamp('NOV 24, 1971', 'FLIGHT 305 · PORTLAND', clamp(lt / 1.6), 80, 300);
  } });
  cue(0.3, 'tock', { gain: 0.4 });

  // 2 · a quiet man boards (the subject walks up the aisle, glowing)
  { const st = cut(1);
    add({ id: 'S02', at: st, note: 'the subject walks up the aisle toward us', draw(lt, d, t, blit) {
      hideAll(); cooper.group.visible = true; cooper.group.rotation.y = 0; cooper.group.position.set(0, 0, lerp(-7, -3.2, lt / d)); cooper.walk(lt * 5.2, 0.8);
      cam.position.copy(lerpV(V3(0.25, 1.5, 0.4), V3(0.2, 1.45, -0.2), eio(lt / d))); cam.lookAt(0, 1.2, -6); render(C.scene, cooper.group.position.clone().add(V3(0, 1.2, 0))); blit();
    } });
    cue(st, 'whoosh', { gain: 0.5 }); }

  // 3 · the ticket: DAN COOPER (2D insert over the blurred cabin)
  { const st = cut(2), nm = Wd('cooper', 2) - st;
    add({ id: 'S03', at: st, note: 'paper ticket insert, name circled', draw(lt, d, t, blit) {
      hideAll(); cooper.group.visible = true; sit(cooper, 0.55, -10.1); cam.position.set(0.1, 1.4, -6.5); cam.lookAt(0.5, 0.9, -10); render(C.scene, V3(0, 1, -2), { aperture: 0.01, maxblur: 0.014 }); blit();
      const k = eo(clamp(lt / 0.5)); paper(540, lerp(1100, 860, k), 820, 460, -0.04, [['NORTHWEST ORIENT AIRLINES', 34, K.P.redDeep, 70], ['FLIGHT 305  PDX → SEA', 40, null, 140], ['PASSENGER:', 34, '#6A6458', 230], ['DAN COOPER', 74, null, 320], ['ONE WAY · CASH', 34, '#6A6458', 400]], k);
      if (lt > nm) K.redCircle(540 - 410 + 40 + 190, lerp(1100, 860, k) - 230 + 300, 230, 70, seg(lt, nm, nm + 0.5));
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + nm, 'slide', { dur: 0.5, gain: 0.4 }); }

  // 4 · he hands the flight attendant a note
  { const st = cut(3), nt = Wd('note', 3) - st;
    add({ id: 'S04', at: st, note: 'attendant stops at his row; the note appears', draw(lt, d, t, blit) {
      hideAll(); cooper.group.visible = crew.group.visible = true; sit(cooper, 0.55, -10.1);
      crew.group.position.set(-0.05, 0, lerp(-8.4, -9.4, eo(clamp(lt / 1.2)))); crew.group.rotation.y = Math.PI * 0.9; crew.pose({ shR: [40, 0, 10], elR: 40, head: [10, 30, 0] });
      cam.position.copy(lerpV(V3(-0.9, 1.6, -6.8), V3(-0.7, 1.55, -7.6), eio(lt / d))); cam.lookAt(0.3, 1.0, -10); render(C.scene, V3(0.3, 1, -9.8)); blit();
      if (lt > nt) paper(540, 520, 560, 300, 0.06, [['TO THE STEWARDESS:', 32, K.P.redDeep, 70], ['████████████████', 34, null, 140], ['████████  ███████', 34, null, 200], ['██████', 34, null, 260]], eob(seg(lt, nt, nt + 0.3)));
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + nt, 'pop', { gain: 0.4 }); }

  // 5 · $200,000 and four parachutes (case file insert)
  { const st = cut(4), pc = Wd('parachutes', 4) - st;
    add({ id: 'S05', at: st, note: 'case file: the demands type on', draw(lt, d, t, blit) {
      hideAll(); cam.position.set(0, 1.5, -2); cam.lookAt(0, 1.1, -12); render(C.scene, V3(0, 1, 0), { aperture: 0.012, maxblur: 0.016, exposure: 0.9 }); blit();
      K.caseFile(540, 820, 1.25, 'CASE NO. 71-305', 0, -0.03);
      K.dateStamp('$200,000', '4 PARACHUTES', lt > pc ? 1 : clamp(lt / 1.2) * 0.62, 250, 1000);
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + 0.2, 'tock', { gain: 0.4 }); cue(st + pc, 'tock', { gain: 0.4 }); }

  // 6 · in Seattle, every passenger goes (they fade, he stays)
  { const st = cut(5);
    add({ id: 'S06', at: st, note: 'passengers vanish one by one; the subject stays', draw(lt, d, t, blit) {
      hideAll(); cooper.group.visible = true; sit(cooper, 0.55, -10.1); seated.forEach((h, i) => (h.group.visible = lt < 0.4 + i * (d - 0.6) / 6));
      cam.position.copy(lerpV(V3(0.0, 1.7, 1.2), V3(0.0, 1.6, -1.5), eio(lt / d))); cam.lookAt(0.2, 1.0, -10); render(C.scene, V3(0.5, 1, -10)); blit();
      K.dateStamp('SEATTLE', '7:40 P.M.', clamp(lt / 1.2), 80, 300);
    } });
    cue(st, 'whoosh', { gain: 0.5 }); for (let i = 0; i < 6; i++) cue(st + 0.4 + i * (cut(6) - st - 0.6) / 6, 'tock', { gain: 0.25 }); }

  // 7 · somewhere over the forests, in the rain (the rear door, lightning)
  { const st = cut(6);
    add({ id: 'S07', at: st, note: 'the rear door: rain, lightning flashes', draw(lt, d, t, blit) {
      hideAll(); seated.forEach((h) => (h.group.visible = false)); const fl = (Math.sin(t * 13) > 0.94 ? 1 : 0) * (lt > 0.6 ? 1 : 0); C.update(t, { door: 0.15, rain: 1, flash: fl });
      cam.position.copy(lerpV(V3(0.0, 1.72, -9.6), V3(0.0, 1.66, -10.4), eio(lt / d))); cam.lookAt(0, 1.0, -14.2); render(C.scene, V3(0, 1, -14.2), { fov: 58, exposure: 1.3 + fl * 0.5 }); blit();
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + 0.6, 'slide', { dur: cut(7) - st - 0.6, gain: 0.6 }); }

  // 8 · he opens the rear stairs and jumps
  { const st = cut(7), op = Wd('opens', 7) - st, jp = Wd('jumps', 7) - st;
    add({ id: 'S08', at: st, note: 'door opens on "opens"; he is gone on "jumps"', draw(lt, d, t, blit) {
      hideAll(); seated.forEach((h) => (h.group.visible = false)); cooper.group.visible = true;
      const door = eio(seg(lt, op, op + 0.5)), out = eio(seg(lt, jp, jp + 0.35));
      cooper.group.rotation.set(0, Math.PI, 0); cooper.group.position.set(0, -out * 3, lerp(-11.0, -13.7, eio(clamp(lt / jp))) - out * 3); if (out < 0.05) cooper.walk(lt * 4, 0.5);
      C.update(t, { door: Math.max(0.15, door), rain: 1, flash: out > 0 && out < 1 ? 1 : 0 });
      cam.position.copy(lerpV(V3(0.0, 1.72, -9.3), V3(0.0, 1.68, -9.9), eio(lt / d))); cam.lookAt(0, 1.0, -14); render(C.scene, V3(0, 1, -13), { fov: 58 }); blit();
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + op, 'thud', { gain: 0.6 }); cue(st + jp, 'whoosh'); cue(st + jp + 0.05, 'slam', { gain: 0.7 }); }

  // 9 · never seen again (empty cabin, open door)
  { const st = cut(8);
    add({ id: 'S09', at: st, note: 'empty cabin, door open, rain', draw(lt, d, t, blit) {
      hideAll(); seated.forEach((h) => (h.group.visible = false)); C.update(t, { door: 1, rain: 1 });
      cam.position.copy(lerpV(V3(0, 1.72, -9.6), V3(0, 1.66, -10.6), eio(lt / d))); cam.lookAt(0, 1.0, -14); render(C.scene, V3(0, 1, -14), { fov: 58 }); blit();
    } });
    cue(st, 'slide', { dur: 2, gain: 0.4 }); }

  // 10 · nine years later: the cash by the river (case wall)
  { const st = cut(9), cs = Wd('cash', 9) - st;
    add({ id: 'S10', at: st, note: 'case wall, 1980 date, red circle', draw(lt, d, t, blit) {
      cam.position.copy(lerpV(V3(0.4, 0.3, 9.5), V3(0.2, 0.2, 7.2), eio(lt / d))); cam.lookAt(0, 0.2, 0); render(CW.scene, V3(0, 0.2, 0), { bloom: 0.4 }); blit();
      K.dateStamp('FEB 10, 1980', 'COLUMBIA RIVER · $5,800', clamp(lt / 1.6), 80, 300);
      if (lt > cs) K.redCircle(540, 1000, 300, 230, seg(lt, cs, cs + 0.6));
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + 0.2, 'tock', { gain: 0.35 }); }

  // 11 · still missing: UNSOLVED stamp
  { const st = cut(10), ms = Wd('missing', 10) - st;
    add({ id: 'S11', at: st, note: 'case file slams down, UNSOLVED stamp', draw(lt, d, t, blit) {
      cam.position.set(0.1, 0.1, 6.5); cam.lookAt(0, 0.1, 0); render(CW.scene, V3(0, 0, 0), { bloom: 0.4, aperture: 0.01, maxblur: 0.014, exposure: 0.9 }); blit();
      K.caseFile(540, lerp(1500, 860, eob(seg(lt, 0, 0.45))), 1.3, 'CASE NO. 71-305', lt > ms ? seg(lt, ms, ms + 0.25) : 0, -0.04);
    } });
    cue(st, 'whoosh', { gain: 0.6 }); cue(st + 0.4, 'thud', { gain: 0.5 }); cue(st + ms, 'slam'); }

  return { shots: S, cues: CUES };
}

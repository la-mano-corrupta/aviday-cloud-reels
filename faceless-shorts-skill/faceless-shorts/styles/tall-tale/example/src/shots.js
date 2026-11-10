// THE GIRL WHO WAS MAILED TO GRANDMA: the shot list (Tall Tale 3D example).
// A shot: { id, at, note, draw(lt, d, t, blit) }: pose the cut-out people, move the camera, E.render(...), blit(),
// then any 2D overlay. Every shot moves the camera. Times come from the voice: cut(i) = just before line i,
// Wd('word', i) = when that word is said.
import * as THREE from 'three';
import { ctx, clamp, lerp, seg, eo, eio, eob } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';
import { camera } from './core/engine.js';
import * as WD from './core/world.js';
import * as PR from './core/props.js';
import { Toon, PROPS } from './core/toon.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mix = (a, b, k) => a.clone().lerp(b, k);
const talk = (t, on = 1) => (on ? 0.25 + 0.75 * Math.abs(Math.sin(t * 13)) * (0.6 + 0.4 * Math.sin(t * 5.3)) : 0);
const blink = (t, off = 0) => (((t + off) % 3.3) < 0.12 ? 1 : 0);

// the cast (original characters, Tall Tale recipe)
const LOOK = {
  may: { body: '#7FC8E8', hat: 'bow', hatCol: '#D8343F', hairCol: '#7A4A2E', kid: true, neck: 'collar', pattern: 'stamps', stamps: 0 },
  dad: { body: '#6FA35A', pattern: 'overalls', patCol: '#3E5FA8', hat: 'boater', hatCol: '#E8C77A', band: '#B5372E', extra: ['mustache'] },
  mom: { body: '#B98ACF', hat: 'bun', hatCol: '#7A4A2E', pattern: 'apron' },
  clerk: { body: '#4FB3A9', hat: 'visor', hatCol: '#2F8F5B', neck: 'collar', pattern: 'vest', patCol: '#2B5E73', extra: ['pencil'] },
  grandma: { body: '#E58A6A', hat: 'bun', hatCol: '#D9D9E2', pattern: 'apron', patCol: '#FFF4E0', extra: ['glasses', 'blush'] },
  cousin: { body: '#3E5FA8', hat: 'mailcap', hatCol: '#2E4E8A', neck: 'tie', neckCol: '#E2B33C' },
  boss: { body: '#4A4560', hat: 'tophat', hatCol: '#2A2638', neck: 'bowtie', neckCol: '#D8343F', dots: 1, pattern: 'vest', patCol: '#2A2638', extra: ['monocle', 'mustache'] },
  sister: { body: '#F2C230', hat: 'bow', hatCol: '#3C6FB6', hairCol: '#3A2A22', kid: true, pattern: 'stamps', stamps: 4, extra: ['freckles'] },
};
const person = (k, opts) => new Toon({ ...LOOK[k], extra: [...(LOOK[k].extra || [])] }, opts);

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.06);
  const cam = camera(36);
  const LOOKS = { street: { bloom: 0.15, aperture: 0.0012, maxblur: 0.008 }, room: { bloom: 0.3, aperture: 0.001, maxblur: 0.008 }, field: { bloom: 0.25, aperture: 0.001, maxblur: 0.007 } };
  const shoot = (scene, people, from, to, at, at2, k, look, focus) => {
    if (cam.fov !== (look.fov || 36)) { cam.fov = look.fov || 36; cam.updateProjectionMatrix(); }
    cam.position.copy(mix(from, to, k)); cam.lookAt(at2 ? mix(at, at2, k) : at);
    people.forEach((p) => p.face(cam));
    E.render(scene, cam, { ...look, focus: focus ?? cam.position.distanceTo(at2 ? mix(at, at2, k) : at) });
  };

  // ── sets ─────────────────────────────────────────────────────────────
  const SHOP_ORDER = [['BAKERY', '#C9603F', 'brick', '#D8343F'], ['GENERAL STORE', '#6FA3B8', 'wood', null], ['BARBER', '#E3C16F', 'wood', '#3C6FB6'], ['GRAND HOTEL', '#9E4A3A', 'brick', null],
    ['TAILOR', '#B98ACF', 'wood', '#2E4E3F'], ['POST OFFICE', '#7FA36A', 'brick', '#2E4E8A'], ['HARDWARE', '#B5553C', 'brick', '#F2C230'], ['CAFE', '#E58A6A', 'wood', '#2E4E3F'],
    ['BANK', '#C7B79A', 'brick', null], ['PHARMACY', '#5FA39A', 'wood', '#D8343F'], ['SHOES', '#D9A34A', 'wood', null], ['THEATER', '#A3485A', 'brick', '#F2C230']];
  const ST = WD.mainStreet(E, { shops: SHOP_ORDER });
  ST.sun.key.target.position.set(-4, 0, 0); ST.sun.key.position.set(5, 13, 6);
  const PO = ST.buildings.find((b) => b.name === 'POST OFFICE');            // front at x -6.2, centred on PO.z
  const stDad = person('dad'), stMom = person('mom'), stMay = person('may', { height: 1.4 }), stMan = person('cousin');
  [stDad, stMom, stMay, stMan].forEach((p) => ST.scene.add(p.group));
  const piles = []; for (let i = 0; i < 6; i++) { const p = PR.parcel(0.5 + (i % 3) * 0.1, 0.32 + (i % 2) * 0.1, 0.42); p.position.set(-5.6 + (i % 2) * 0.55, 0.18 + Math.floor(i / 2) * 0.0, PO.z - 1.6 + i * 0.45); p.rotation.y = i * 0.4; ST.scene.add(p); piles.push(p); }
  const streetPeople = () => [...ST.people, stDad, stMom, stMay, stMan];

  const view = (scene, from, look, people = []) => { const c = new THREE.PerspectiveCamera(42, 4 / 3, 0.1, 800); c.position.copy(from); c.lookAt(look); people.forEach((p) => p.face(c)); const t = WD.snapshot(E, scene, c); t.wrapS = THREE.RepeatWrapping; return t; };

  // post office inside: counter on the right (x 2.2..3.2), clerk behind it, scale on the counter
  const IN = WD.interior(E, { wall: '#2F6B5A', motif: '#3B7D69', ceiling: '#5A3A2A', signText: 'PARCEL POST', view: view(ST.scene, V3(2, 1.8, -12), V3(-3, 2.2, 10), ST.people), picture: false });
  { const cb = PR.cubbies(2.6, 2.2); cb.position.set(-2.4, 0.95, -6.75); IN.scene.add(cb);
    const sb = WD.signBoard('U.S. POST OFFICE', { w: 3.0, h: 0.5, bg: '#2E4E8A', fg: '#F2E6CF' }); sb.position.set(0, 3.55, -6.86); IN.scene.add(sb);
    [[-3.3, -4.6], [-3.2, -3.9], [-3.4, -3.2]].forEach(([x, z], i) => { const s = PR.mailSack(0.9 + i * 0.1); s.position.set(x, 0, z); IN.scene.add(s); });
    [[-3.3, -1.8, 0], [-3.1, -1.3, 0.32]].forEach(([x, z, y], i) => { const p = PR.parcel(0.6, 0.4, 0.5); p.position.set(x, y, z); p.rotation.y = i; IN.scene.add(p); }); }
  const scale = PR.platformScale(); scale.position.set(2.7, 1.18, -2.0); IN.scene.add(scale);
  const chicks = PR.chickCrate(6); chicks.position.set(2.7, 1.18, -3.6); chicks.rotation.y = -0.5; chicks.visible = false; IN.scene.add(chicks);
  const box = PR.parcel(0.9, 0.55, 0.7, true); box.position.set(1.2, 0, -1.9); box.visible = false; IN.scene.add(box);
  const inClerk = person('clerk'), inMay = person('may', { height: 1.4 }), inDad = person('dad'), inMom = person('mom'), inSis = person('sister', { height: 1.4 });
  inClerk.at(3.55, 0, -2.5); inSis.at(1.2, 0, -1.95); inSis.group.visible = false;
  [inClerk, inMay, inDad, inMom, inSis].forEach((p) => IN.scene.add(p.group));
  const inPeople = [inClerk, inMay, inDad, inMom, inSis];

  // the countryside: home (left) and grandma's house (right), a signpost
  const MD = WD.meadow(E, { fenceOn: false }); MD.sun.key.position.set(9, 14, 8); MD.sun.key.target.position.set(5, 0, -6);
  Object.assign(MD.sun.key.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22 }); MD.sun.key.shadow.camera.updateProjectionMatrix();
  const home = PR.house({ wall: '#F2E6CF', roof: '#B5553C', door: '#3C6FB6' }); home.position.set(0, 0, -6); MD.scene.add(home);
  const gma = PR.house({ wall: '#F2C9D6', roof: '#3E5FA8', door: '#D8343F', trim: '#FFFFFF' }); gma.position.set(12, 0, -9); gma.rotation.y = -0.35; MD.scene.add(gma);
  const post = PR.signpost([['LEWISTON  73 MI', 'r'], ['GRANGEVILLE', 'l']]); post.position.set(5.5, 0, 2.5); MD.scene.add(post);
  { const f = WD.fence(10); f.position.set(-12, 0, -1); MD.scene.add(f); const f2 = WD.fence(8); f2.position.set(15, 0, -2); MD.scene.add(f2); }
  const mdDad = person('dad'), mdMom = person('mom'), mdMay = person('may', { height: 1.4 }), mdGma = person('grandma'), mdCousin = person('cousin');
  [mdDad, mdMom, mdMay, mdGma, mdCousin].forEach((p) => MD.scene.add(p.group));
  const gDoor = new THREE.Vector3(); const gmaFront = (dx, dz) => gma.localToWorld(V3(dx, 0, dz));
  const mdPeople = [mdDad, mdMom, mdMay, mdGma, mdCousin];

  // the railway: a second meadow with tracks and the mail train
  const TR = WD.meadow(E, { fenceOn: false, treesOn: false }); TR.sun.key.position.set(6, 12, 10); TR.sun.key.target.position.set(0, 0, -12);
  const rl = PR.rails(400); rl.position.set(0, 0, -12); TR.scene.add(rl); const tr = PR.train(); tr.position.set(0, 0, -12); TR.scene.add(tr);
  { const p = WD.pole(6); for (let x = -60; x < 80; x += 14) { const q = p.clone(); q.position.set(x, 0, -15); TR.scene.add(q); } }

  // the mail car (inside): sorting counter on the right, cubbies on the left, the meadow rolling past the window
  const MC = WD.interior(E, { w: 4.4, depth: 8, h: 3.4, wall: '#7A5236', motif: '#86603F', floor: '#8A5A36', ceiling: '#3A2A20', signText: null, picture: false, litter: false,
    view: (tr.position.x = 500, view(TR.scene, V3(0, 1.6, 8), V3(0, 2.2, -40))) });
  MC.window.material.map.repeat.set(0.5, 1);
  { const cb = PR.cubbies(3.4, 1.6); cb.position.set(-2.0, 1.0, -4.2); cb.rotation.y = Math.PI / 2; MC.scene.add(cb);
    [[-1.3, -5.6, 1], [-0.7, -6.2, 0.9], [-1.5, -6.4, 1.1], [0.2, -6.5, 0.95]].forEach(([x, z, s]) => { const m = PR.mailSack(s); m.position.set(x, 0, z); MC.scene.add(m); }); }
  const mcMay = person('may', { height: 1.4 }), mcCousin = person('cousin'); [mcMay, mcCousin].forEach((p) => MC.scene.add(p.group));
  mcMay.restyle({ stamps: 10 });
  const seat = PR.mailSack(1.15); seat.position.set(-0.75, 0, -3.95); MC.scene.add(seat);

  // the Postmaster General's office
  const OF = WD.interior(E, { w: 7, depth: 6, wall: '#2E4E8A', motif: '#3A5E9C', ceiling: '#2A2638', floor: '#7A3E24', signText: null, counterOn: false, litter: false,
    view: view(ST.scene, V3(0, 6, 6), V3(0, 3, -40)) });
  const dk = PR.desk(2.4); dk.position.set(0.4, 0, -3.2); OF.scene.add(dk);
  const notice = PR.poster(['NOTICE', '!NO PEOPLE', 'MAY BE SENT', 'BY MAIL', 'POSTMASTER GENERAL'], { w: 1.3, h: 1.7 }); notice.position.set(-2.4, 2.1, -5.87); OF.scene.add(notice);
  { const fl = WD.signBoard('POSTMASTER GENERAL', { w: 2.4, h: 0.4, bg: '#2A2638', fg: '#E2B33C' }); fl.position.set(0, 3.55, -5.88); OF.scene.add(fl);
    const p = PR.parcel(0.4, 0.15, 0.3); p.position.set(1.2, 0.88, -3.1); OF.scene.add(p); }
  const ofBoss = person('boss'); ofBoss.at(0.4, 0, -3.95); OF.scene.add(ofBoss.group);

  // ── 1 · HOOK, outside: "In 1914, a couple in Idaho" (crane down the street to the post office) ──
  const s1b = Wd('mailed', 0) - 0.12;
  { const st = cut(0);
    add({ id: 'S01', at: st, note: 'crane down main street to the post office; the family arrives', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); const z = PO.z;
      stDad.at(-5.0, 0.18, z - 3.2 + k * 1.6); stMom.at(-4.6, 0.18, z - 2.4 + k * 1.6); stMay.at(-4.8, 0.18, z - 2.8 + k * 1.6);
      [stDad, stMom].forEach((p, i) => p.set({ legs: 'walk', phase: t * 7 + i * 2, mood: 'happy', blink: blink(t, i) }));
      stMay.set({ legs: 'walk', phase: t * 9, mood: 'happy', armL: [40, 20], blink: blink(t, 1.3) });
      stMan.group.visible = false; piles.forEach((p) => (p.visible = false));
      shoot(ST.scene, streetPeople(), V3(0.5, 6.0, z - 22), V3(-2.3, 1.7, z - 6.4), V3(-2.5, 3.0, z), V3(-4.8, 1.25, z - 1.5), k, { ...LOOKS.street, fov: 44 });
      blit();
    } });
    cue(st + 0.05, 'whoosh', { gain: 0.6 }); cue(Wd('1914', 0), 'ding', { gain: 0.7 }); }

  // ── 2 · "mailed their five year old daughter" (inside: May on the scale, clerk shocked) ──
  const counterScene = (lt, t, o = {}) => {
    inMay.at(2.7, 1.26, -1.95); inDad.at(1.65, 0, -2.75); inMom.at(1.0, 0, -3.4);
    inDad.group.visible = o.dad ?? true; inMom.group.visible = o.mom ?? true; inMay.group.visible = o.may ?? true;
  };
  { const st = s1b;
    add({ id: 'S02', at: st, note: 'May stands on the post-office scale, clerk gasps, parents proud', draw(lt, d, t, blit) {
      const k = eo(clamp(lt / d)); counterScene(lt, t); scale.set(lerp(30, 48.5, eob(seg(lt, 0, 0.5))));
      if (inMay.look.stamps !== 4) inMay.restyle({ stamps: 4 });
      inMay.set({ mood: 'proud', armL: [20, 10], armR: [20, 10], blink: blink(t) });
      inClerk.set({ mood: lt > 0.35 ? 'shock' : 'neutral', armL: [30, -20], armR: [40, -30], sweat: 1 });
      inDad.set({ mood: 'proud', armR: [60, -60], blink: blink(t, 1) }); inMom.set({ mood: 'happy', armL: [40, -90] });
      shoot(IN.scene, inPeople, V3(-0.4, 1.9, 1.6), V3(0.1, 1.85, 0.9), V3(2.7, 1.9, -2.2), null, k, LOOKS.room);
      blit();
    } });
    cue(st, 'whoosh'); cue(st + 0.35, 'boing', { gain: 0.6 }); }

  // ── 3 · "to her grandma's house" (grandma waves from her porch) ──
  { const st = cut(1);
    add({ id: 'S03', at: st, note: "grandma's pink house, grandma waving on the porch", draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); mdDad.group.visible = mdMom.group.visible = mdMay.group.visible = mdCousin.group.visible = false; mdGma.group.visible = true;
      mdGma.group.position.copy(gmaFront(0.9, 3.3)); mdGma.set({ mood: 'happy', armR: [150 + Math.sin(t * 9) * 18, 10] });
      gma.door.rotation.y = 0;
      const a = gmaFront(0.8, 3.0); shoot(MD.scene, mdPeople, gmaFront(1.4, 9.5).setY(1.8), gmaFront(1.0, 7.0).setY(1.6), a.clone().setY(2.0), a.clone().setY(1.5), k, LOOKS.field);
      blit();
    } });
    cue(st, 'whoosh', { gain: 0.6 }); }

  // ── 4 · "With the stamps stuck right on her coat" (close-up, stamps pop on) ──
  { const st = cut(2), w0 = Wd('stamps', 2);
    add({ id: 'S04', at: st, note: 'close-up of May: stamps pop onto her coat on "stamps"', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); counterScene(lt, t, { dad: false, mom: false });
      const n = Math.min(6, 4 + Math.floor(clamp((t - w0) / 0.18) * 2 + (t > w0 ? 1 : 0))); if (inMay.look.stamps !== n) inMay.restyle({ stamps: n });
      inMay.set({ mood: t > w0 + 0.4 ? 'smug' : 'happy', armL: [30, -20], armR: [20, 10], look: [0.4, 0], blink: blink(t) });
      inClerk.set({ mood: 'shock', armL: [30, -20], armR: [40, -30] });
      shoot(IN.scene, inPeople, V3(1.75, 2.1, -0.15), V3(1.95, 2.05, -0.55), V3(2.7, 2.0, -1.95), null, k, LOOKS.room, 1.5);
      blit();
    } });
    cue(st, 'whoosh'); [0, 0.18, 0.36].forEach((o) => cue(w0 + o, 'pop', { gain: 0.8 })); }

  // ── 5 · "See, the post office had just started delivering packages," ──
  { const st = cut(3), w0 = Wd('packages', 3);
    add({ id: 'S05', at: st, note: 'post office front: the mailman carries parcels out, parcels pile up on "packages"', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); const z = PO.z;
      stDad.group.visible = stMom.group.visible = stMay.group.visible = false; stMan.group.visible = true;
      stMan.at(-5.2, 0.18, z - 0.6 - k * 2.4); stMan.set({ legs: 'walk', phase: t * 7, mood: 'happy', armL: [30, -100], armR: [30, -100], holdR: PROPS.parcels, v: 'parcels' });
      piles.forEach((p, i) => { const a = clamp((t - w0 + 0.3 - i * 0.08) / 0.25); p.visible = a > 0; p.scale.setScalar(eob(a) || 0.001); });
      shoot(ST.scene, streetPeople(), V3(-1.5, 2.6, z - 6.5), V3(-1.8, 1.8, z - 6.0), V3(-5.6, 3.4, z - 0.5), V3(-5.4, 1.2, z - 2.2), k, LOOKS.street);
      blit();
    } });
    cue(st, 'whoosh'); cue(w0 - 0.25, 'plop'); cue(w0 - 0.1, 'plop'); cue(w0 + 0.05, 'plop'); cue(w0 + 0.2, 'plop'); }

  // ── 6 · "and May's parents wanted her to visit grandma," (the family at home) ──
  const homeFront = (lt, t) => { mdDad.at(-0.8, 0, -1.0); mdMom.at(0.8, 0, -1.1); mdMay.at(0.05, 0, -0.7); mdGma.group.visible = mdCousin.group.visible = false; mdDad.group.visible = mdMom.group.visible = mdMay.group.visible = true; };
  { const st = cut(4);
    add({ id: 'S06', at: st, note: 'home: the family in the front yard, May hopeful, mom talking', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); homeFront(lt, t);
      mdDad.set({ mood: 'happy', armL: [20, 10], blink: blink(t) }); mdMom.set({ mood: 'happy', talk: talk(t), armR: [70, -60], look: [-0.6, 0.3] });
      mdMay.set({ mood: 'happy', armL: [140, 20], armR: [140, 20], legs: Math.sin(t * 8) > 0.3 ? 'jump' : 'stand', look: [0, -0.4] });
      shoot(MD.scene, mdPeople, V3(-1.0, 1.7, 4.6), V3(-0.3, 1.5, 3.6), V3(0, 1.3, -1), null, k, { ...LOOKS.field, fov: 52 });
      blit();
    } });
    cue(st, 'whoosh'); cue(st + 0.3, 'boing', { gain: 0.5 }); }

  // ── 7 · "seventy-three miles away." (the signpost, then fly toward the hills) ──
  { const st = cut(5);
    add({ id: 'S07', at: st, note: 'signpost LEWISTON 73 MI, camera rises past it toward the far hills', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); mdDad.group.visible = mdMom.group.visible = mdMay.group.visible = mdGma.group.visible = mdCousin.group.visible = false;
      shoot(MD.scene, mdPeople, V3(3.4, 2.3, 5.2), V3(4.2, 4.6, 3.0), V3(6.2, 2.4, 2.4), V3(40, 3, -60), eio(k), LOOKS.field, 4);
      blit();
    } });
    cue(st, 'whoosh'); cue(st + 0.1, 'slide', { dur: 1.4, gain: 0.5 }); }

  // ── 8 · "But a train ticket wasn't cheap." (dad sweats over the ticket price) ──
  { const st = cut(6);
    add({ id: 'S08', at: st, note: 'close-up dad: ticket "$$$", sweating; mom peeks with an empty purse', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); homeFront(lt, t); mdMay.group.visible = false; mdDad.at(-0.45, 0, -1.0); mdMom.at(0.6, 0, -1.4);
      mdDad.set({ mood: 'worried', armR: [30, -90], holdR: PROPS.ticket, sweat: 1, look: [0.5, 0.6], v: 'tk' }); mdMom.set({ mood: 'worried', armL: [30, -90], holdL: PROPS.purse, look: [-0.8, 0.4], v: 'pu' });
      shoot(MD.scene, mdPeople, V3(-0.2, 1.75, 2.6), V3(-0.1, 1.7, 1.8), V3(-0.05, 1.45, -1.1), null, k, LOOKS.field);
      blit();
    } });
    cue(st, 'whoosh'); cue(st + 0.4, 'zip', { gain: 0.5 }); }

  // ── 9 · "So her dad walked her into the post office" ──
  { const st = cut(7);
    add({ id: 'S09', at: st, note: 'dad and May walk along the boardwalk to the post office, camera tracks', draw(lt, d, t, blit) {
      const k = clamp(lt / d); const z = PO.z;
      stMan.group.visible = false; stMom.group.visible = false; stDad.group.visible = stMay.group.visible = true; piles.forEach((p) => (p.visible = true, p.scale.setScalar(1)));
      const zz = z - 7 + k * 4.2; stDad.at(-4.9, 0.18, zz); stMay.at(-4.3, 0.18, zz + 0.05);
      stDad.set({ legs: 'walk', phase: t * 7, mood: 'proud', armR: [30, 0] }); stMay.set({ legs: 'walk', phase: t * 9 + 1, mood: 'happy', armL: [50, 0] });
      shoot(ST.scene, streetPeople(), V3(-2.4, 1.6, zz - 3.8), V3(-2.6, 1.55, zz - 3.0), V3(-4.6, 1.25, zz), null, eio(k), LOOKS.street);
      blit();
    } });
    cue(st, 'whoosh'); cue(Wd('post', 7), 'ding', { gain: 0.6 }); }

  // ── 10 · "and asked how much it costs to mail a kid." ──
  { const st = cut(8), wk = Wd('kid', 8);
    add({ id: 'S10', at: st, note: 'dad asks at the counter; on "kid" the clerk freezes and we punch in', draw(lt, d, t, blit) {
      counterScene(lt, t, { mom: false }); inMay.at(1.05, 0, -1.6); scale.set(0);
      inDad.set({ mood: 'happy', talk: talk(t, t < wk + 0.25), armL: [60, -70], blink: blink(t) }); inMay.set({ mood: 'happy', look: [0.6, -0.5], blink: blink(t, 1) });
      inClerk.set({ mood: t > wk ? 'shock' : 'neutral', armL: [20, 10], armR: [20, 10], look: [-0.6, 0] });
      const punch = eo(clamp((t - wk) / 0.25));
      shoot(IN.scene, inPeople, mix(V3(-0.6, 1.7, 1.6), V3(-0.3, 1.7, 1.2), eio(clamp(lt / d))), mix(V3(-0.3, 1.7, 1.2), V3(2.3, 1.65, -0.9), punch), V3(2.3, 1.7, -2.3), V3(3.55, 1.5, -2.5), punch, LOOKS.room);
      blit();
    } });
    cue(st, 'whoosh'); cue(wk, 'boing'); }

  // ── 11 · "The clerk checked the rules," ──
  { const st = cut(9);
    add({ id: 'S11', at: st, note: 'clerk flips through the big RULES book, sweating', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); counterScene(lt, t, { dad: false, mom: false, may: false });
      inClerk.set({ mood: 'worried', armL: [60, -40], armR: [100, -30], holdR: PROPS.book('RULES', 1), look: [0, 0.8], v: 'open' + (Math.floor(t * 4) % 2), sweat: 1, lean: Math.sin(t * 4) * 2 });
      shoot(IN.scene, inPeople, V3(1.9, 1.75, -0.4), V3(2.2, 1.7, -0.9), V3(3.5, 1.4, -2.5), null, k, LOOKS.room);
      blit();
    } });
    cue(st, 'whoosh'); cue(st + 0.2, 'slide', { dur: 0.4, gain: 0.5 }); cue(st + 0.8, 'slide', { dur: 0.4, gain: 0.5 }); }

  // ── 12 · "and nothing said he couldn't." ──
  { const st = cut(10);
    add({ id: 'S12', at: st, note: 'clerk slams the book shut and shrugs; dad grins', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); counterScene(lt, t, { mom: false, may: false });
      const shrug = eob(seg(lt, 0.25, 0.6));
      inClerk.set({ mood: lt > 0.4 ? 'happy' : 'neutral', armL: [lerp(40, 75, shrug), lerp(-80, -60, shrug)], armR: [lerp(40, 75, shrug), lerp(-80, -60, shrug)], holdR: lt < 0.3 ? PROPS.book('RULES', 0) : null, armL0: 0, v: 'shut', bob: -shrug * 10 });
      inDad.set({ mood: 'proud', armR: [40, -40] });
      shoot(IN.scene, inPeople, V3(0.6, 1.8, 0.7), V3(1.0, 1.75, 0.2), V3(3.3, 1.55, -2.5), null, k, LOOKS.room);
      blit();
    } });
    cue(st + 0.2, 'thud'); cue(st + 0.5, 'boing', { gain: 0.5 }); }

  // ── 13 · "May weighed forty-eight and a half pounds," (needle swings) ──
  const W485 = Wd('pounds', 11);
  { const st = cut(11);
    add({ id: 'S13', at: st, note: 'May climbs on the scale, the needle swings up to 48.5', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); counterScene(lt, t, { dad: false, mom: false });
      const a = clamp((t - st - 0.2) / (W485 - st - 0.2)); scale.set(48.5 * eob(a) + Math.sin(t * 20) * (1 - a) * 2);
      inMay.set({ mood: a < 1 ? 'happy' : 'proud', armL: [30, 10], armR: [30, 10], legs: lt < 0.25 ? 'jump' : 'stand', blink: blink(t) });
      inClerk.set({ mood: 'neutral', armL: [20, 10], armR: [40, -60], look: [-0.6, 0.6] });
      shoot(IN.scene, inPeople, V3(1.3, 1.9, 0.6), V3(1.65, 1.85, 0.0), V3(2.7, 1.75, -2.1), null, k, LOOKS.room);
      blit();
    } });
    cue(st, 'whoosh'); cue(st + 0.2, 'slide', { dur: 0.9, gain: 0.6 }); cue(W485, 'tock'); }

  // ── 14 · "just under the fifty pound limit." (dial close-up) ──
  { const st = cut(12), wu = Wd('under', 12);
    add({ id: 'S14', at: st, note: 'dial close-up: needle trembles just under the red 50 LIMIT zone', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); counterScene(lt, t, { dad: false, mom: false });
      scale.set(48.5 + Math.sin(t * 30) * 0.35);
      inMay.set({ mood: 'smug' });
      const dial = V3(2.7, 2.8, -2.28);
      shoot(IN.scene, inPeople, V3(2.55, 2.9, -1.1), V3(2.68, 2.84, -1.55), dial, null, k, { ...LOOKS.room, aperture: 0.002 }, 0.85);
      blit();
    } });
    cue(st, 'whoosh'); cue(wu, 'ding', { gain: 0.8 }); }

  // ── 15 · "So on went fifty-three cents in stamps," ──
  { const st = cut(13);
    add({ id: 'S15', at: st, note: 'clerk slaps stamp after stamp on her coat (4 → 10)', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); counterScene(lt, t, { dad: false, mom: false });
      const n = Math.min(10, 4 + Math.floor(lt / 0.32)); if (inMay.look.stamps !== n) inMay.restyle({ stamps: n });
      const hit = (lt % 0.32) / 0.32;
      inClerk.set({ mood: 'happy', armR: [lerp(150, 95, eo(hit)), -20], holdR: PROPS.stamp, armL: [30, -30], v: 'st' });
      inMay.set({ mood: 'laugh', armL: [30, -10], armR: [30, -10], bob: (1 - hit) * 6 });
      shoot(IN.scene, inPeople, V3(0.9, 1.95, 0.7), V3(1.2, 1.95, 0.2), V3(3.0, 1.85, -2.2), null, k, LOOKS.room);
      blit();
    } });
    for (let i = 1; i <= 6; i++) cue(cut(13) + i * 0.32 - 0.02, 'stamp', { gain: 0.8 }); }

  // ── 16 · "and she rode the train in the mail car," ──
  { const st = cut(14);
    add({ id: 'S16', at: st, note: 'wide: steam train with the U.S. MAIL car rolls across the meadow', draw(lt, d, t, blit) {
      const k = clamp(lt / d); const x = -10 + lt * 5.5; tr.position.x = x; tr.update(t);
      shoot(TR.scene, [], V3(x + 8, 1.4, -3.5), V3(x + 5.5, 2.6, -4.5), V3(x + 0.5, 2.0, -12), V3(x - 1.5, 2.0, -12), k, { ...LOOKS.field, aperture: 0.0005, fov: 48 }, 11);
      blit();
    } });
    cue(st, 'whoosh'); cue(st + 0.05, 'chug', { dur: L(15) - st, gain: 0.9 }); }

  // ── 17 · "with her mom's cousin, who happened to be the mail clerk." ──
  { const st = cut(15), wc = Wd('cousin', 15);
    add({ id: 'S17', at: st, note: 'inside the mail car: May sits on a mail sack, the cousin sorts letters, tips his cap', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); MC.window.material.map.offset.x = (t * 0.25) % 1;
      mcMay.at(-0.55, 0, -3.15); mcCousin.at(0.12, 0, -3.95);
      mcMay.set({ mood: 'happy', legs: 'sit', armL: [40, -30], armR: [40, -30], look: [0.6, 0], blink: blink(t), bob: Math.abs(Math.sin(t * 9)) * 4 });
      const tip = clamp((t - wc) / 0.3) * (1 - clamp((t - wc - 1.4) / 0.3));
      mcCousin.set({ mood: tip > 0.2 ? 'proud' : 'neutral', armL: [lerp(30, 150, eo(tip)), lerp(-60, 10, tip)], armR: [40, -80], holdR: PROPS.letters, look: [-0.6, 0], v: 'l' });
      shoot(MC.scene, [mcMay, mcCousin], V3(-0.3, 1.35, -0.7), V3(-0.2, 1.25, -1.1), V3(-0.2, 1.0, -3.6), null, k, { ...LOOKS.room, fov: 54 });
      blit();
    } });
    cue(st, 'whoosh'); cue(st, 'chug', { dur: L(16) - st, gain: 0.5 }); cue(wc + 0.1, 'pop', { gain: 0.6 }); }

  // ── 18 · "He walked her right up to grandma's front door." ──
  { const st = cut(16), wd = Wd('door', 16);
    add({ id: 'S18', at: st, note: "cousin walks May up grandma's path; the door opens on 'door'; grandma beams", draw(lt, d, t, blit) {
      const k = clamp(lt / d); mdDad.group.visible = mdMom.group.visible = false; [mdMay, mdCousin, mdGma].forEach((p) => (p.group.visible = true));
      const walk = eio(clamp(lt / (wd - st)));
      mdCousin.group.position.copy(gmaFront(1.25, lerp(7.5, 3.6, walk))).setY(walk > 0.85 ? 0.25 : 0); mdMay.group.position.copy(gmaFront(0.5, lerp(7.2, 3.3, walk))).setY(walk > 0.85 ? 0.25 : 0);
      mdCousin.set({ legs: walk < 1 ? 'walk' : 'stand', phase: t * 7, mood: 'happy', armL: [40, 0] });
      if (mdMay.look.stamps !== 10) mdMay.restyle({ stamps: 10 });
      mdMay.set({ legs: walk < 1 ? 'walk' : 'stand', phase: t * 9, mood: 'happy', armR: [lerp(40, 150, clamp((t - wd) / 0.3)), 10] });
      const open = eo(clamp((t - wd + 0.15) / 0.35)); gma.door.rotation.y = -open * 1.6;
      mdGma.group.visible = open > 0.15; mdGma.group.position.copy(gmaFront(-0.05, 2.3)); mdGma.set({ mood: open > 0.6 ? 'laugh' : 'shock', armL: [lerp(10, 120, open), 0], armR: [lerp(10, 120, open), 0] });
      const a = gmaFront(0.2, 3.2);
      shoot(MD.scene, mdPeople, gmaFront(0.4, 10.5).setY(1.8), gmaFront(0.3, 8.2).setY(1.6), gmaFront(0.3, 3.2).setY(1.3), null, eio(k), LOOKS.field);
      blit();
    } });
    cue(st, 'whoosh'); cue(wd, 'ding'); cue(wd + 0.4, 'sparkle', { gain: 0.6 }); }

  // ── 19 · "Soon after, the post office banned mailing people." ──
  { const st = cut(17), wb = Wd('banned', 17);
    add({ id: 'S19', at: st, note: 'Postmaster General slams his stamp on "banned"; NOTICE: NO PEOPLE pops on the wall', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); const hit = clamp((t - wb + 0.2) / 0.2);
      ofBoss.set({ mood: t > wb ? 'angry' : 'neutral', armR: [lerp(40, 140, eo(seg(lt, 0, wb - st - 0.2))) - hit * 110, -20], holdR: PROPS.rubberStamp, armL: [20, 10], v: 'rs' });
            notice.visible = false;
      shoot(OF.scene, [ofBoss], V3(0.6, 1.7, 0.4), V3(0.5, 1.65, -0.5), V3(0.4, 1.45, -4), null, k, LOOKS.room);
      blit();
      const pop = clamp((t - wb) / 0.22);
      if (pop > 0) {      // the NOTICE slaps onto the screen
        ctx.save(); ctx.translate(540, 560); ctx.rotate(lerp(-0.4, -0.06, eo(pop))); const sc = lerp(1.8, 1, eo(pop)); ctx.scale(sc, sc);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-250, -290, 520, 600); ctx.fillStyle = '#F4EBD6'; ctx.fillRect(-270, -310, 520, 600); ctx.strokeStyle = '#1F1C33'; ctx.lineWidth = 8; ctx.strokeRect(-250, -290, 480, 560);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#1F1C33'; ctx.font = '900 92px Inter'; ctx.fillText('NOTICE', -10, -200); ctx.fillStyle = '#B5372E'; ctx.fillRect(-170, -135, 320, 10);
        ctx.font = '900 70px Inter'; ctx.fillText('NO PEOPLE', -10, -40); ctx.fillStyle = '#1F1C33'; ctx.font = '800 50px Inter'; ctx.fillText('MAY BE SENT', -10, 50); ctx.fillText('BY MAIL', -10, 115); ctx.font = '800 30px Inter'; ctx.fillText('POSTMASTER GENERAL', -10, 215);
        ctx.restore();
      }
    } });
    cue(st, 'whoosh'); cue(wb, 'stamp', { gain: 1 }); cue(wb + 0.05, 'slam', { gain: 0.6 }); }

  // ── 20 · "Which is why today, you can still mail baby chicks," ──
  { const st = cut(18), wc = Wd('chicks', 18);
    add({ id: 'S20', at: st, note: 'a crate of peeping chicks on the counter, the clerk happily stamps it', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); counterScene(lt, t, { dad: false, mom: false, may: false }); chicks.visible = true; chicks.update(t); scale.visible = false;
      chicks.chicks.forEach((c) => c.lookAt(mix(V3(0.9, 2.1, -0.2), V3(1.3, 1.95, -1.0), k)));
      inClerk.at(3.55, 0, -3.3); inClerk.set({ mood: 'happy', armR: [60, -60], armL: [30, -30], holdR: PROPS.stamp, v: 'c' });
      shoot(IN.scene, inPeople, V3(0.9, 2.1, -0.2), V3(1.3, 1.95, -1.0), V3(3.0, 1.6, -3.5), null, k, LOOKS.room);
      blit();
    } });
    cue(st, 'whoosh'); cue(st + 0.2, 'chirp', { dur: 2.6 }); cue(wc, 'stamp', { gain: 0.7 }); }

  // ── 21 · "but not your little sister." (sister in a parcel box, RETURN TO SENDER) ──
  { const st = cut(19), wsis = Wd('sister', 19);
    add({ id: 'S21', at: st, note: 'little sister stands in a stamped parcel box, smug; RETURN TO SENDER stamp slams down', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / Math.min(d, 2.2))); counterScene(lt, t, { dad: false, mom: false, may: false }); chicks.visible = false; scale.visible = true;
      inClerk.at(3.55, 0, -2.5); box.visible = true; inSis.group.visible = true; inSis.at(1.2, 0.02, -1.95);
      inSis.set({ mood: t > wsis + 0.3 ? 'sad' : 'smug', armL: [150, 20], armR: [20, 10], blink: blink(t) });
      inClerk.set({ mood: 'angry', armL: [70, -70], armR: [70, -70], look: [-0.8, 0.6] });
      shoot(IN.scene, inPeople, V3(0.0, 1.55, 1.3), V3(0.35, 1.45, 0.7), V3(1.5, 1.05, -2.0), null, k, LOOKS.room);
      blit();
      const sp = clamp((t - wsis - 0.15) / 0.18);
      if (sp > 0) {
        ctx.save(); ctx.translate(540, 640); ctx.rotate(-0.16); const s = lerp(2.6, 1.25, eo(sp)); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, sp * 1.5);
        ctx.strokeStyle = '#C8283A'; ctx.lineWidth = 14; ctx.beginPath(); ctx.roundRect(-330, -95, 660, 190, 22); ctx.stroke();
        ctx.fillStyle = '#C8283A'; ctx.font = '900 92px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('RETURN TO', 0, -36); ctx.fillText('SENDER', 0, 50);
        ctx.restore();
      }
    } });
    cue(st, 'whoosh'); cue(wsis + 0.15, 'stamp', { gain: 1 }); cue(wsis + 0.17, 'slam', { gain: 0.7 }); }

  return { shots: S, cues: CUES };
}

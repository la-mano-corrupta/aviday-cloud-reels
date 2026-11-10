// HOW ONE BAKERY BURNED DOWN LONDON : the shot list (Paper Atlas example). Everything is cut paper.
import { ctx, W, H, TAU, clamp, lerp, seg, eo, eio, eob, rnd, rr, circle, ell, line } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';
import * as K from './core/kit.js';
const { P, cut, P_rr, P_poly, P_circ } = K;

// ── set pieces for this story (cut paper) ──
const NIGHT = '#2F3550', NIGHT2 = '#262B42';
function nightPage(seed) { K.parchment(seed); ctx.save(); ctx.globalAlpha = 0.86; ctx.fillStyle = NIGHT; ctx.fillRect(-300, -300, W + 600, H + 600); ctx.restore(); for (let i = 0; i < 30; i++) circle(rnd(i + seed) * W, rnd(i + 40 + seed) * 900, 3 + rnd(i) * 3, '#E9DCBC'); }
/** a timber house: x = centre, y = ground, w, h; roof colour; burning 0..1 */
function house(x, y, w, h, wall = '#B68A5C', roof = '#7A4B33', win = 0) {
  cut(P_rr(x - w / 2, y - h, w, h, 4), wall, { shadow: 0.7, edge: 5 });
  cut(P_poly([[x - w / 2 - 18, y - h + 4], [x, y - h - w * 0.55], [x + w / 2 + 18, y - h + 4]]), roof, { shadow: 0.6, edge: 5 });
  ctx.strokeStyle = 'rgba(62,44,30,0.55)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - w / 2, y - h * 0.5); ctx.lineTo(x + w / 2, y - h * 0.5); ctx.moveTo(x, y - h); ctx.lineTo(x, y); ctx.stroke();
  for (const dx of [-0.25, 0.25]) { rr(x + dx * w - 22, y - h * 0.82, 44, 54, 4); ctx.fillStyle = win ? `rgba(242,190,90,${0.4 + 0.6 * win})` : '#3E2C1E'; ctx.fill(); }
}
/** paper flame: layered crimson / orange / gold, flickering */
function flame(x, y, s, t, seed = 0) {
  if (s <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s * (1 + 0.08 * Math.sin(t * 9 + seed)));
  const f = (w, h, c) => cut(() => { ctx.beginPath(); ctx.moveTo(-w, 0); ctx.quadraticCurveTo(-w * 1.1, -h * 0.5, -w * 0.2 + Math.sin(t * 6 + seed) * 8, -h); ctx.quadraticCurveTo(w * 0.2, -h * 0.55, w * 0.5, -h * 0.75 + Math.sin(t * 7 + seed) * 6); ctx.quadraticCurveTo(w * 1.1, -h * 0.4, w, 0); ctx.closePath(); }, c, { shadow: 0.4, edge: 3 });
  f(70, 190, P.crimson); f(50, 140, '#E0782E'); f(28, 90, '#F2C14E'); ctx.restore();
}
function smoke(x, y, s, a = 1) { ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s); cut(() => { ctx.beginPath(); for (const [dx, dy, r] of [[-60, 0, 60], [0, -30, 75], [60, 0, 58], [0, 25, 60]]) { ctx.moveTo(dx + r, dy); ctx.arc(dx, dy, r, 0, TAU); } }, '#8F8578', { shadow: 0.4, edge: 4 }); ctx.restore(); }
function wind(t, y, a = 1) { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = P.edge; ctx.lineWidth = 9; ctx.lineCap = 'round'; for (let i = 0; i < 4; i++) { const x = ((t * 420 + i * 300) % 1500) - 300, yy = y + i * 70; ctx.beginPath(); ctx.moveTo(x, yy); ctx.bezierCurveTo(x + 120, yy - 30, x + 200, yy + 30, x + 300, yy); ctx.arc(x + 300, yy - 26, 26, Math.PI / 2, -Math.PI * 0.9, true); ctx.stroke(); } ctx.restore(); }
function stPauls(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); cut(P_rr(-200, -260, 400, 260, 4), P.stone); cut(P_rr(-90, -380, 180, 130, 4), P.stone); cut(() => { ctx.beginPath(); ctx.arc(0, -380, 110, Math.PI, TAU); ctx.closePath(); }, P.stoneDark); cut(P_rr(-12, -560, 24, 90, 4), P.stoneDark); for (let i = 0; i < 4; i++) { rr(-150 + i * 90, -200, 40, 120, 18); ctx.fillStyle = P.ink; ctx.fill(); } ctx.restore(); }
function oven(x, y, s, t) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); cut(() => { ctx.beginPath(); ctx.moveTo(-230, 0); ctx.lineTo(-230, -200); ctx.arc(0, -200, 230, Math.PI, TAU); ctx.lineTo(230, 0); ctx.closePath(); }, '#9C6B48'); cut(() => { ctx.beginPath(); ctx.moveTo(-110, 0); ctx.lineTo(-110, -120); ctx.arc(0, -120, 110, Math.PI, TAU); ctx.lineTo(110, 0); ctx.closePath(); }, '#1F140C', { shadow: 0, edge: 3 }); for (let i = 0; i < 7; i++) circle(-60 + i * 20, -18 - (i % 2) * 10, 12 + Math.sin(t * 5 + i) * 3, i % 2 ? '#E0782E' : '#F2C14E'); ctx.restore(); }
/** a simplified old London: the Thames, the city wall area, fire spreading with p 0..1 from Pudding Lane */
function londonMap(p, t) {
  K.parchment(4);
  cut(() => { ctx.beginPath(); ctx.moveTo(-300, 1180); ctx.bezierCurveTo(200, 1080, 500, 1240, 800, 1150); ctx.bezierCurveTo(950, 1110, 1100, 1160, 1400, 1120); ctx.lineTo(1400, 1340); ctx.bezierCurveTo(1000, 1360, 800, 1350, 500, 1420); ctx.bezierCurveTo(200, 1460, 0, 1380, -300, 1400); ctx.closePath(); }, P.sea, { shadow: 0.5, edge: 5 });
  K.label('RIVER THAMES', 540, 1310, 40);
  const city = [[140, 1130], [180, 720], [420, 560], [760, 600], [930, 820], [900, 1090], [600, 1170], [300, 1150]];
  P_poly(city)(); ctx.setLineDash([16, 12]); ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.stroke(); ctx.setLineDash([]); K.label('THE CITY', 520, 640, 44);
  for (let i = 0; i < 120; i++) { const x = 190 + rnd(i) * 700, y = 640 + rnd(i + 50) * 480; const d = Math.hypot(x - 700, y - 1100) / 700; if (d > p * 1.15) continue; rr(x - 14, y - 14, 28, 28, 4); ctx.fillStyle = d > p * 0.8 ? '#E0782E' : P.crimson; ctx.fill(); }
  circle(700, 1100, 14, P.ink); K.slip('PUDDING LANE', 760, 1040, 1, 0.02, 30);
}

export function buildShots() {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut_ = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const ROW = [[90, 0], [300, 1], [510, 0], [720, 1], [930, 0]];

  // 1 · 1666: London at night, a gold ribbon, one glowing window
  add({ id: 'S01', at: 0, cam: [540, 900], zoom: 0.08, note: 'night skyline, 1666 ribbon, bakery window glows', draw(lt, d, t) {
    nightPage(1); ROW.forEach(([x, k], i) => house(x, 1400, 190, 300 + k * 60, k ? '#8C6B4E' : '#A37A55', k ? '#5E3B28' : '#6E4430', i === 2 ? 0.6 + 0.4 * Math.sin(t * 6) : 0));
    cut(P_rr(-300, 1400, W + 600, 800, 0), '#4A3A2E', { shadow: 0, edge: 0 });
    K.ribbon('1666', 540, 400, eob(seg(lt, 0.1, 0.5)));
    if (lt > d * 0.6) flame(510, 1300, eob(seg(lt, d * 0.6, d * 0.6 + 0.4)) * 0.8, t);
  } });
  cue(0.1, 'whoosh'); cue(0.15, 'pop', { gain: 0.6 });

  // 2 · just after midnight, Farriner's bakery on Pudding Lane
  { const st = cut_(1), lane = Wd('pudding', 1) - st;
    add({ id: 'S02', at: st, cam: [540, 1050], zoom: 0.12, note: 'the bakery: oven embers, baker asleep, PUDDING LANE slip', draw(lt, d, t) {
      nightPage(2); cut(P_rr(-300, 1500, W + 600, 700, 0), '#4A3A2E', { shadow: 0, edge: 0 }); house(540, 1500, 760, 760, '#A37A55', '#6E4430', 0.5);
      oven(380, 1450, 0.7, t); K.figure({ x: 760, y: 1500, h: 520, role: 'worker', dir: -1 });
      K.slip('12:30 A.M.', 540, 260, eob(seg(lt, 0.1, 0.35)));
      K.slip('PUDDING LANE', 540, 420, lt > lane ? eob(seg(lt, lane, lane + 0.3)) : 0, 0.03);
    } });
    cue(st, 'whoosh'); cue(st + 0.1, 'pop', { gain: 0.5 }); cue(st + lane, 'pop'); }

  // 3 · wooden houses, strong wind
  { const st = cut_(2), wd = Wd('wind', 2) - st;
    add({ id: 'S03', at: st, cam: [540, 1000], zoom: 0.08, note: 'a street of timber houses, wind gusts', draw(lt, d, t) {
      nightPage(3); const pan = lerp(0, -160, eio(lt / d)); ctx.save(); ctx.translate(pan, 0);
      for (let i = 0; i < 7; i++) house(80 + i * 200, 1450, 180, 330 + (i % 3) * 50, i % 2 ? '#8C6B4E' : '#A37A55', i % 2 ? '#5E3B28' : '#6E4430');
      flame(80, 1450 - 380, 0.7, t); ctx.restore(); cut(P_rr(-300, 1450, W + 600, 800, 0), '#4A3A2E', { shadow: 0, edge: 0 });
      if (lt > wd - 0.2) wind(t, 560, clamp((lt - wd + 0.2) * 3));
    } });
    cue(st, 'whoosh'); cue(st + wd - 0.2, 'slide', { dur: 1.6, gain: 0.7 }); }

  // 4 · flames jump roof to roof
  { const st = cut_(3);
    add({ id: 'S04', at: st, cam: [540, 1000], zoom: 0.1, note: 'fire leaps from house to house', draw(lt, d, t) {
      nightPage(4); ctx.save(); ctx.globalAlpha = 0.35 * clamp(lt); ctx.fillStyle = '#E0782E'; ctx.fillRect(-300, -300, W + 600, 1500); ctx.restore();
      for (let i = 0; i < 6; i++) { const x = 60 + i * 200, top = 1450 - (330 + (i % 3) * 50) - 100; house(x, 1450, 180, 330 + (i % 3) * 50, i % 2 ? '#8C6B4E' : '#A37A55', i % 2 ? '#5E3B28' : '#6E4430', 0.8); const p = seg(lt, i * (d / 7), i * (d / 7) + 0.3); flame(x, top + 60, eob(p) * 0.9, t, i); }
      cut(P_rr(-300, 1450, W + 600, 800, 0), '#4A3A2E', { shadow: 0, edge: 0 });
    } });
    cue(st, 'whoosh'); for (let i = 0; i < 6; i++) cue(st + i * 0.33, 'pop', { gain: 0.45 }); cue(st, 'sizzle', { dur: 2 }); }

  // 5 · the Lord Mayor shrugs it off
  { const st = cut_(4), off = Wd('shrugged', 4) - st;
    add({ id: 'S05', at: st, cam: [540, 1000], note: 'the Lord Mayor in his nightcap waves it away', draw(lt, d, t) {
      K.hall(); ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = NIGHT; ctx.fillRect(-300, -300, W + 600, H + 600); ctx.restore();
      K.figure({ x: 540, y: 1500, h: 760, role: 'merchant', arm: lt > off ? 70 + Math.sin(lt * 12) * 25 : 10 });
      K.slip('THE LORD MAYOR', 540, 330, eob(seg(lt, 0.1, 0.35)));
      if (lt > off) K.slip('BACK TO BED', 540, 520, eob(seg(lt, off, off + 0.3)), 0.04, 44);
    } });
    cue(st, 'whoosh'); cue(st + 0.1, 'pop', { gain: 0.5 }); cue(st + off, 'boing', { gain: 0.5 }); }

  // 6 · for four days, the city burned (map + timeline)
  { const st = cut_(5);
    add({ id: 'S06', at: st, cam: [540, 900], zoom: 0.06, note: 'map: fire spreads over the city, timeline Sept 2-5', draw(lt, d, t) {
      const p = eio(clamp(lt / (d * 0.9))); londonMap(p, t);
      K.timeline(['SEP 2', 'SEP 3', 'SEP 4', 'SEP 5'], 150, 300, 780, p, Math.min(3, Math.floor(p * 3.99)));
    } });
    cue(st, 'whoosh'); cue(st, 'sizzle', { dur: 2.4, gain: 0.7 }); }

  // 7 · 13,000 houses, 87 churches, St Paul's
  { const st = cut_(6), h1 = Wd('thirteen', 6) - st, c1 = Wd('eighty', 6) - st, sp = Wd('paul', 6) - st;
    add({ id: 'S07', at: st, cam: [540, 950], zoom: 0.08, note: 'tallies pop in, St Pauls burns', draw(lt, d, t) {
      nightPage(7); ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#E0782E'; ctx.fillRect(-300, -300, W + 600, 1500); ctx.restore();
      stPauls(540, 1450, 1.4); cut(P_rr(-300, 1450, W + 600, 800, 0), '#4A3A2E', { shadow: 0, edge: 0 });
      if (lt > sp) for (let i = 0; i < 5; i++) flame(300 + i * 120, 1450 - 320 - (i === 2 ? 200 : 0), eob(seg(lt, sp + i * 0.08, sp + i * 0.08 + 0.3)) * 0.9, t, i);
      K.slip('13,200 HOUSES', 540, 330, lt > h1 ? eob(seg(lt, h1, h1 + 0.3)) : 0, -0.03);
      K.slip('87 CHURCHES', 540, 500, lt > c1 ? eob(seg(lt, c1, c1 + 0.3)) : 0, 0.03);
    } });
    cue(st, 'whoosh'); cue(st + h1, 'pop'); cue(st + c1, 'pop'); cue(st + sp, 'thud'); }

  // 8 · they blew up whole streets (firebreak)
  { const st = cut_(7), bl = Wd('blew', 7) - st;
    add({ id: 'S08', at: st, cam: [540, 1000], zoom: 0.08, note: 'houses vanish into smoke: a gap stops the fire', draw(lt, d, t) {
      nightPage(8); const gone = lt > bl + 0.1;
      for (let i = 0; i < 6; i++) { const x = 60 + i * 200; if (gone && (i === 3 || i === 4)) continue; house(x, 1450, 180, 340, '#8C6B4E', '#5E3B28', i < 3 ? 0.8 : 0); if (i < 3) flame(x, 1450 - 440, 0.85, t, i); }
      if (lt > bl) for (let k = 0; k < 4; k++) smoke(660 + (k % 2) * 200, 1250 - k * 90 - (lt - bl) * 120, 0.9 + (lt - bl) * 0.6, clamp(1.6 - (lt - bl)));
      cut(P_rr(-300, 1450, W + 600, 800, 0), '#4A3A2E', { shadow: 0, edge: 0 });
    } });
    cue(st, 'whoosh'); cue(st + bl, 'slam'); cue(st + bl + 0.25, 'thud', { gain: 0.6 }); }

  // 9 · rebuilt in brick and stone (day, gold light)
  { const st = cut_(8), br = Wd('brick', 8) - st;
    add({ id: 'S09', at: st, cam: [540, 950], zoom: 0.08, note: 'daylight: new brick and stone city rises', draw(lt, d, t) {
      K.parchment(9); ctx.fillStyle = P.sky; ctx.fillRect(-300, -300, W + 600, 1450); cut(P_circ(820, 380, 90), '#EFC66A', { shadow: 0.4, edge: 5 });
      for (let i = 0; i < 5; i++) { const p = eob(seg(lt, 0.2 + i * 0.15, 0.55 + i * 0.15)); if (p <= 0) continue; ctx.save(); ctx.translate(0, (1 - p) * 500); house(110 + i * 215, 1450, 190, 380 + (i % 2) * 70, i % 2 ? '#B9A98C' : '#A8503E', i % 2 ? '#7E8B5A' : '#5E3B28'); ctx.restore(); }
      cut(P_rr(-300, 1450, W + 600, 800, 0), P.sepia, { shadow: 0, edge: 0 });
      K.ribbon('REBUILT', 540, 360, lt > br ? eob(seg(lt, br, br + 0.4)) : 0, 90);
    } });
    cue(st, 'whoosh'); for (let i = 0; i < 5; i++) cue(st + 0.25 + i * 0.15, 'thud', { gain: 0.35 }); cue(st + br, 'sparkle', { dur: 1 }); }

  // 10 · all because of one small bakery (oven close-up, seal)
  { const st = cut_(9);
    add({ id: 'S10', at: st, cam: [540, 1150], zoom: 0.16, note: 'oven embers close-up, wax seal stamps', draw(lt, d, t) {
      nightPage(10); cut(P_rr(-300, 1500, W + 600, 700, 0), '#4A3A2E', { shadow: 0, edge: 0 }); oven(540, 1500, 1.5, t);
      K.seal(540, 520, lt > d - 1.1 ? eob(seg(lt, d - 1.1, d - 0.8)) * 1.2 : 0, 'L');
    } });
    cue(st, 'whoosh'); }

  return { shots: S, cues: CUES };
}

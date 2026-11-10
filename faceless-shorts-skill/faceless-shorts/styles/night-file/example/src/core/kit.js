// Night File: the COMPONENT ZOO. Unsolved mysteries and creepy facts: dark rooms with ONE light source, faceless
// silhouettes rim-lit in red (the person the story is about glows solid red), case files, typewriter dates, film grain.
import { ctx, W, H, TAU, lerp, clamp, rnd, rr, circle, ell, line } from './lib.js';

export const P = {
  void: '#0A0C11', room: '#151A24', mid: '#1F2633', light: '#2B3343', beam: '#F1D9A6', red: '#E4322B', redDeep: '#8E1D1A',
  cream: '#EAE3D2', tape: '#E9C46A', steel: '#5B6577', paper: '#D8CFBA', manila: '#B8955A', cork: '#4A3426', ink: '#06070A',
};
const MONO = 'FreeMono';

// ═════════════════════════ PEOPLE: faceless silhouettes ═════════════════════════
const rad = (d) => d * Math.PI / 180;
function body(o, col, grow) {
  const h = o.h || 700, d = o.dir || 1, wk = o.walk, sw = wk != null ? Math.sin(wk) : 0, lw = h * 0.075 + grow;
  const hip = [o.x, o.y - h * 0.47], sh = [o.x, o.y - h * 0.8];
  const leg = (a, k) => { const kn = [hip[0] + Math.sin(rad(a)) * h * 0.24 * d, hip[1] + Math.cos(rad(a)) * h * 0.24]; line([hip, kn, [kn[0] + Math.sin(rad(a - k)) * h * 0.23 * d, kn[1] + Math.cos(rad(a - k)) * h * 0.23]], col, lw); };
  const arm = (a, e) => { const el = [sh[0] + Math.sin(rad(a)) * h * 0.18 * d, sh[1] + h * 0.03 + Math.cos(rad(a)) * h * 0.18]; line([[sh[0], sh[1] + h * 0.03], el, [el[0] + Math.sin(rad(a + e)) * h * 0.17 * d, el[1] + Math.cos(rad(a + e)) * h * 0.17]], col, lw * 0.85); };
  const A = o.arms || { L: [wk != null ? -sw * 18 : -6, 8], R: [wk != null ? sw * 18 : 6, 10] };
  const L = o.legs || { L: [wk != null ? sw * 22 : 4, wk != null ? Math.max(0, -sw) * 24 : 2], R: [wk != null ? -sw * 22 : -4, wk != null ? Math.max(0, sw) * 24 : 2] };
  leg(L.L[0], L.L[1]); arm(A.L[0], A.L[1]); leg(L.R[0], L.R[1]);
  ctx.beginPath(); ctx.moveTo(sh[0] - h * 0.11 - grow / 2, sh[1]); ctx.lineTo(sh[0] + h * 0.11 + grow / 2, sh[1]); ctx.lineTo(hip[0] + h * 0.08 + grow / 2, hip[1] + h * 0.02); ctx.lineTo(hip[0] - h * 0.08 - grow / 2, hip[1] + h * 0.02); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.lineJoin = 'round'; ctx.lineWidth = h * 0.05 + grow; ctx.strokeStyle = col; ctx.stroke();
  line([[sh[0], sh[1] - h * 0.02], [sh[0], sh[1] - h * 0.06]], col, h * 0.06 + grow);
  ell(sh[0] + d * h * 0.01, sh[1] - h * 0.12, h * 0.068 + grow / 2, h * 0.083 + grow / 2, col);
  arm(A.R[0], A.R[1]);
}
/**
 * A faceless figure standing on (x, y). o = { h (default 700), dir, walk (phase), arms, legs (like Stick Story),
 * glow: true = THE subject (solid glowing red), else a dark silhouette with a thin red rim light; dim 0..1 fades it }
 */
export function figure(o) {
  ctx.save(); ctx.globalAlpha = 1 - (o.dim || 0);
  if (o.glow) { ctx.shadowColor = P.red; ctx.shadowBlur = 50; body(o, P.red, 0); ctx.shadowBlur = 18; body(o, P.red, 0); ctx.shadowBlur = 0; body(o, '#F04A3E', -6); }
  else { ctx.shadowColor = P.red; ctx.shadowBlur = 22; body(o, P.redDeep, 5); ctx.shadowBlur = 0; body(o, P.ink, 0); }
  ctx.restore();
}

// ═════════════════════════ ROOMS & PLACES (full 1080x1920) ═════════════════════════
/** soft light cone from (x, y) down to the floor width at fy; a = strength */
export function beam(x, y, topW, botW, fy, a = 0.22) {
  const g = ctx.createLinearGradient(0, y, 0, fy); g.addColorStop(0, `rgba(241,217,166,${a})`); g.addColorStop(1, 'rgba(241,217,166,0)');
  ctx.beginPath(); ctx.moveTo(x - topW / 2, y); ctx.lineTo(x + topW / 2, y); ctx.lineTo(x + botW / 2, fy); ctx.lineTo(x - botW / 2, fy); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  ell(x, fy, botW * 0.45, 40, `rgba(241,217,166,${a * 0.6})`);
}
/** one-point-perspective corridor with doors and one ceiling light. o = { light: 0..1 flicker, doorOpen: 0..1 (last door) } */
export function corridor(o = {}) {
  const L = o.light ?? 1, vx = 540, vy = 760, bw = 300, bh = 420;
  ctx.fillStyle = P.void; ctx.fillRect(-300, -300, W + 600, H + 600);
  const poly = (pts, c) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); };
  poly([[-300, -300], [vx - bw / 2, vy - bh / 2], [vx - bw / 2, vy + bh / 2], [-300, H + 300]], P.room);
  poly([[W + 300, -300], [vx + bw / 2, vy - bh / 2], [vx + bw / 2, vy + bh / 2], [W + 300, H + 300]], P.room);
  poly([[-300, H + 300], [vx - bw / 2, vy + bh / 2], [vx + bw / 2, vy + bh / 2], [W + 300, H + 300]], P.mid);
  poly([[-300, -300], [vx - bw / 2, vy - bh / 2], [vx + bw / 2, vy - bh / 2], [W + 300, -300]], '#10141C');
  ctx.fillStyle = P.light; ctx.fillRect(vx - bw / 2, vy - bh / 2, bw, bh);
  rr(vx - 60, vy - 80, 120, 280, 6); ctx.fillStyle = o.doorOpen ? '#000' : '#232A38'; ctx.fill();
  if (o.doorOpen) { ctx.save(); ctx.globalAlpha = o.doorOpen; rr(vx - 60, vy - 80, 120, 280, 6); ctx.fillStyle = P.redDeep; ctx.fill(); ctx.restore(); }
  for (const [s, k] of [[-1, 0.25], [-1, 0.6], [1, 0.4]]) {                       // side doors
    const x1 = lerp(s < 0 ? -300 : W + 300, vx + s * bw / 2, k), x2 = lerp(s < 0 ? -300 : W + 300, vx + s * bw / 2, k + 0.12);
    const yT = (x) => lerp(-300, vy - bh / 2, Math.abs(x - (s < 0 ? -300 : W + 300)) / Math.abs(vx + s * bw / 2 - (s < 0 ? -300 : W + 300)));
    const yB = (x) => lerp(H + 300, vy + bh / 2, Math.abs(x - (s < 0 ? -300 : W + 300)) / Math.abs(vx + s * bw / 2 - (s < 0 ? -300 : W + 300)));
    const t1 = lerp(yT(x1), yB(x1), 0.25), b1 = yB(x1) - 4, t2 = lerp(yT(x2), yB(x2), 0.25), b2 = yB(x2) - 4;
    poly([[x1, t1], [x2, t2], [x2, b2], [x1, b1]], '#0E121A');
  }
  if (L > 0) { beam(vx, 260, 70, 760, 1500, 0.2 * L); rr(vx - 70, 250, 140, 18, 8); ctx.fillStyle = `rgba(241,217,166,${0.9 * L})`; ctx.fill(); }
}
/** a house at night with ONE lit window, a streetlight, trees. o = { lit: 0..1 window, moon } */
export function houseNight(o = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0B0F1A'); g.addColorStop(1, '#151B28'); ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
  circle(820, 330, 70, '#D9D4C4'); circle(845, 315, 64, '#0D111C');
  for (let i = 0; i < 6; i++) { const x = rnd(i) * W; ctx.beginPath(); ctx.moveTo(x - 90, 1250); ctx.lineTo(x, 900 - rnd(i + 3) * 200); ctx.lineTo(x + 90, 1250); ctx.fillStyle = '#0A0D14'; ctx.fill(); }
  ctx.fillStyle = '#0E121B'; ctx.fillRect(-300, 1250, W + 600, H); ctx.beginPath(); ctx.moveTo(180, 820); ctx.lineTo(540, 560); ctx.lineTo(900, 820); ctx.closePath(); ctx.fillStyle = '#1A2030'; ctx.fill();
  ctx.fillStyle = '#161B27'; ctx.fillRect(220, 820, 640, 440);
  for (const [x, y, lit] of [[300, 900, 0], [640, 900, o.lit ?? 1], [300, 1080, 0]]) { rr(x, y, 140, 120, 4); ctx.fillStyle = lit ? `rgba(241,200,120,${0.25 + 0.75 * lit})` : '#0C1018'; ctx.fill(); if (lit) { ctx.save(); ctx.shadowColor = '#F1C878'; ctx.shadowBlur = 60 * lit; ctx.fill(); ctx.restore(); ctx.fillStyle = '#161B27'; ctx.fillRect(x + 66, y, 8, 120); } }
  rr(500, 1100, 110, 160, 4); ctx.fillStyle = '#0C1018'; ctx.fill();
  line([[960, 1300], [960, 700], [880, 680]], '#2A3140', 14); beam(880, 690, 40, 420, 1300, 0.18);
}
/** corkboard case wall: pinned photos and red string. o = { strings: 0..1 drawn } */
export function caseWall(o = {}) {
  ctx.fillStyle = P.cork; ctx.fillRect(-300, -300, W + 600, H + 600);
  for (let i = 0; i < 400; i++) { ctx.fillStyle = `rgba(0,0,0,${0.12 + rnd(i) * 0.15})`; ctx.fillRect(rnd(i + 1) * W, rnd(i + 2) * H, 4, 4); }
  const pins = [[260, 420], [780, 360], [540, 820], [230, 1120], [830, 1080]];
  const k = o.strings ?? 1; ctx.strokeStyle = P.red; ctx.lineWidth = 6;
  [[0, 2], [1, 2], [2, 3], [2, 4], [0, 1]].forEach(([a, b], i) => { const p = clamp(k * 5 - i); if (p <= 0) return; ctx.beginPath(); ctx.moveTo(...pins[a]); ctx.lineTo(lerp(pins[a][0], pins[b][0], p), lerp(pins[a][1], pins[b][1], p)); ctx.stroke(); });
  pins.forEach(([x, y], i) => { polaroid(x, y + 120, 0.9, (rnd(i) - 0.5) * 0.2, i === 2 ? 'glow' : 'dark'); circle(x, y, 14, P.red); });
}

// ═════════════════════════ PROPS & GRAPHICS ═════════════════════════
/** polaroid photo with a tiny silhouette inside ('dark' | 'glow' | 'house' | 'empty') */
export function polaroid(x, y, s = 1, rot = 0, kind = 'dark') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rr(-120, -140, 240, 280, 4); ctx.fillStyle = P.paper; ctx.fill(); ctx.fillStyle = '#1B212D'; ctx.fillRect(-100, -120, 200, 190);
  if (kind === 'dark' || kind === 'glow') { ctx.save(); ctx.beginPath(); ctx.rect(-100, -120, 200, 190); ctx.clip(); figure({ x: 0, y: 140, h: 240, glow: kind === 'glow' }); ctx.restore(); }
  if (kind === 'house') { ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(0, -60); ctx.lineTo(60, 0); ctx.fillStyle = '#2B3343'; ctx.fill(); ctx.fillStyle = '#2B3343'; ctx.fillRect(-50, 0, 100, 60); ctx.fillStyle = '#F1C878'; ctx.fillRect(10, 15, 24, 20); }
  ctx.restore();
}
/** manila case folder with a typed label and an UNSOLVED stamp (stamp 0..1) */
export function caseFile(x, y, s = 1, label = 'CASE NO. 94-1187', stamp = 1, rot = -0.05) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rr(-300, -230, 220, 60, 10); ctx.fillStyle = '#A58548'; ctx.fill();
  rr(-320, -200, 640, 420, 12); ctx.fillStyle = P.manila; ctx.fill();
  rr(-260, -150, 360, 70, 4); ctx.fillStyle = P.paper; ctx.fill();
  ctx.font = `700 36px ${MONO}`; ctx.fillStyle = P.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(label, -245, -113);
  for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-260, -30 + i * 50, 420 - i * 90, 16); }
  if (stamp > 0) { ctx.save(); ctx.translate(110, 120); ctx.rotate(-0.2); ctx.scale(lerp(1.8, 1, clamp(stamp)), lerp(1.8, 1, clamp(stamp))); ctx.globalAlpha = clamp(stamp * 2) * 0.9; rr(-170, -48, 340, 96, 8); ctx.strokeStyle = P.red; ctx.lineWidth = 9; ctx.stroke(); ctx.font = `700 64px ${MONO}`; ctx.fillStyle = P.red; ctx.textAlign = 'center'; ctx.fillText('UNSOLVED', 0, 4); ctx.restore(); }
  ctx.restore();
}
/** wall clock showing h:m */
export function clock(x, y, s, hh, mm) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); circle(0, 0, 150, '#2A303D'); circle(0, 0, 130, P.paper);
  for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate(i * Math.PI / 6); ctx.fillStyle = P.ink; ctx.fillRect(-4, -122, 8, i % 3 ? 14 : 26); ctx.restore(); }
  ctx.save(); ctx.rotate((hh % 12 + mm / 60) * Math.PI / 6); ctx.fillStyle = P.ink; ctx.fillRect(-7, -70, 14, 80); ctx.restore();
  ctx.save(); ctx.rotate(mm * Math.PI / 30); ctx.fillStyle = P.ink; ctx.fillRect(-5, -108, 10, 118); ctx.restore(); circle(0, 0, 10, P.red); ctx.restore();
}
export function cassette(x, y, s = 1, spin = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); rr(-180, -110, 360, 220, 14); ctx.fillStyle = '#2A2F3A'; ctx.fill(); rr(-150, -85, 300, 80, 8); ctx.fillStyle = P.paper; ctx.fill();
  ctx.font = `700 30px ${MONO}`; ctx.fillStyle = P.red; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TAPE 3', 0, -45);
  for (const sx of [-70, 70]) { circle(sx, 40, 34, P.ink); ctx.save(); ctx.translate(sx, 40); ctx.rotate(spin); for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); ctx.fillStyle = P.paper; ctx.fillRect(-4, -24, 8, 14); } ctx.restore(); }
  ctx.restore();
}
/** yellow evidence marker tent with a number */
export function marker(x, y, s, n) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(-40, -110); ctx.lineTo(40, -110); ctx.lineTo(60, 0); ctx.closePath(); ctx.fillStyle = P.tape; ctx.fill(); ctx.font = '900 70px Inter'; ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), 0, -52); ctx.restore(); }
/** hand-drawn red circle around (x, y); p 0..1 draws it on */
export function redCircle(x, y, rx, ry, p = 1) { if (p <= 0) return; ctx.beginPath(); for (let i = 0; i <= 60 * p; i++) { const a = -1.9 + i / 60 * (TAU + 0.5), k = 1 + 0.05 * Math.sin(i * 0.7); const px = x + Math.cos(a) * rx * k, py = y + Math.sin(a) * ry * k; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.strokeStyle = P.red; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke(); }
/** typewriter date stamp, lower-left; p 0..1 types it on (with a cursor) */
export function dateStamp(line1, line2, p = 1, x = 90, y = 1240) {
  const n1 = Math.floor(line1.length * clamp(p * 1.6)), n2 = Math.floor(line2.length * clamp(p * 1.6 - 0.6));
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 12;
  ctx.font = `700 92px ${MONO}`; ctx.fillStyle = P.cream; ctx.fillText(line1.slice(0, n1), x, y);
  ctx.font = `700 56px ${MONO}`; ctx.fillStyle = P.red; ctx.fillText(line2.slice(0, n2), x, y + 76);
  ctx.shadowBlur = 0; if (p < 1 && Math.floor(p * 20) % 2 === 0) { ctx.fillStyle = P.cream; ctx.fillRect(x + (n2 ? ctx.measureText(line2.slice(0, n2)).width : (ctx.font = `700 92px ${MONO}`, ctx.measureText(line1.slice(0, n1)).width)) + 6, y + (n2 ? 18 : -56), 26, n2 ? 46 : 64); }
}
/** black redaction bars over text lines (for "the file says…") */
export function redacted(x, y, widths, p = 1) { widths.forEach((w, i) => { ctx.fillStyle = P.ink; ctx.fillRect(x, y + i * 60, w * clamp(p * 2 - i * 0.3), 36); }); }

// ═════════════════════════ FILM LOOK (call last, before captions) ═════════════════════════
export function filmLook(t, vign = 0.75) {
  const g = ctx.createRadialGradient(540, 900, 300, 540, 960, 1250); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${vign})`);
  ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
  const f = Math.floor(t * 24); for (let i = 0; i < 900; i++) { ctx.fillStyle = rnd(i + f * 13) > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)'; ctx.fillRect(rnd(i * 3 + f) * W, rnd(i * 7 + f * 2) * H, 3, 3); }
}

// ═════════════════════════ CAPTION LOOK ═════════════════════════
export const CAPLOOK = { font: `700 86px ${MONO}`, y: 1560, maxW: 940, fg: P.cream, hi: P.red };
export function captionMono(words, x, y, sc = 1, look = CAPLOOK) {
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.font = look.font; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const sp = 30, ws = words.map((w) => ctx.measureText(w.txt).width), tw = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  const fit = Math.min(1, (look.maxW || 960) / tw); ctx.scale(fit, fit);
  ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 18; let cx = -tw / 2;
  words.forEach((w, i) => { ctx.fillStyle = w.hi ? look.hi : look.fg; ctx.fillText(w.txt, cx, 0); cx += ws[i] + sp; });
  ctx.restore();
}

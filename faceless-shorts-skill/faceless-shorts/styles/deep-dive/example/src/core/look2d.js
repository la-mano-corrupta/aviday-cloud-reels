// Deep Dive 2D layer (drawn over the 3D frame): captions, labels.
import { ctx } from './lib.js';
export const CAPLOOK = { size: 112, y: 1560, maxW: 940, fg: '#FFFFFF', hi: '#FFD43B', stroke: '#111111' };
/** caption: sentence case, white, thick dark outline, one yellow word. words = [{ txt, hi }] */
export function caption(words, x, y, sc = 1, look = CAPLOOK) {
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.font = `900 ${look.size}px Inter`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
  const sp = look.size * 0.26, ws = words.map((w) => ctx.measureText(w.txt).width), tw = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  let cx = -tw / 2;
  words.forEach((w, i) => { ctx.lineWidth = look.size * 0.17; ctx.strokeStyle = look.stroke; ctx.strokeText(w.txt, cx, 0); ctx.fillStyle = w.hi ? look.hi : look.fg; ctx.fillText(w.txt, cx, 0); cx += ws[i] + sp; });
  ctx.restore();
}
/** small floating label with a leader line (used sparingly: names of organs, numbers) */
export function label(text, x, y, tx, ty, sc = 1) {
  if (sc <= 0) return; ctx.save(); ctx.globalAlpha = Math.min(1, sc);
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.beginPath(); ctx.arc(tx, ty, 9, 0, 7); ctx.fillStyle = '#FFFFFF'; ctx.fill();
  ctx.translate(x, y); ctx.scale(sc, sc); ctx.font = '800 54px Inter'; const w = ctx.measureText(text).width + 50;
  ctx.fillStyle = 'rgba(15,18,24,0.82)'; ctx.beginPath(); ctx.roundRect(-w / 2, -44, w, 88, 44); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 3);
  ctx.restore();
}
/** rounded info pill (counters, short facts). col = accent colour of the text */
export function pill(text, x, y, sc = 1, col = '#FFFFFF', bg = 'rgba(12,14,20,0.8)', size = 60) {
  if (sc <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.font = `900 ${size}px Inter`;
  const w = ctx.measureText(text).width + size * 1.2; ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(-w / 2, -size * 0.85, w, size * 1.7, size * 0.85); ctx.fill();
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, size * 0.06); ctx.restore();
}
/** red warning triangle with "!" */
export function warning(x, y, s) {
  if (s <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.moveTo(0, -130); ctx.lineTo(140, 110); ctx.lineTo(-140, 110); ctx.closePath(); ctx.lineJoin = 'round'; ctx.lineWidth = 40; ctx.strokeStyle = '#D62839'; ctx.stroke(); ctx.fillStyle = '#D62839'; ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(-14, -60, 28, 110, 14); ctx.fill(); ctx.beginPath(); ctx.arc(0, 82, 17, 0, 7); ctx.fill(); ctx.restore();
}
/** darken toward the edges (passing out); k 0..1 */
export function blackout(k) { if (k <= 0) return; const g = ctx.createRadialGradient(540, 860, 200 * (1 - k), 540, 960, 1300 * (1 - k * 0.6)); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${Math.min(1, k * 1.4)})`); ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1920); if (k > 0.75) { ctx.fillStyle = `rgba(0,0,0,${(k - 0.75) * 4})`; ctx.fillRect(0, 0, 1080, 1920); } }

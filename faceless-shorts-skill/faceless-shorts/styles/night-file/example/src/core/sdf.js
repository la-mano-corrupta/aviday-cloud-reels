// Signed-distance sculpting: build smooth, clay-like 3D shapes from simple primitives, then mesh them (surface nets).
// Everything stylized-3D in this style (people, organs, props) is sculpted here, so shapes blend smoothly with no seams.
import * as THREE from 'three';

// ---------- primitives (p = [x, y, z]) ----------
export const len = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
export const sphere = (p, c, r) => len(p[0] - c[0], p[1] - c[1], p[2] - c[2]) - r;
/** ellipsoid (approximate, good for sculpting) */
export function ellipsoid(p, c, r) {
  const x = (p[0] - c[0]) / r[0], y = (p[1] - c[1]) / r[1], z = (p[2] - c[2]) / r[2];
  const k0 = len(x, y, z), k1 = len(x / r[0], y / r[1], z / r[2]);
  return k0 * (k0 - 1) / (k1 || 1e-9);
}
/** capsule from a to b with radius ra at a and rb at b (a round cone) */
export function capsule(p, a, b, ra, rb = ra) {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2], pax = p[0] - a[0], pay = p[1] - a[1], paz = p[2] - a[2];
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  return len(pax - bax * h, pay - bay * h, paz - baz * h) - (ra + (rb - ra) * h);
}
/** rounded box centred at c with half-size s and corner radius r */
export function rbox(p, c, s, r) {
  const qx = Math.abs(p[0] - c[0]) - s[0] + r, qy = Math.abs(p[1] - c[1]) - s[1] + r, qz = Math.abs(p[2] - c[2]) - s[2] + r;
  return len(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
}
export function torus(p, c, R, r) { const x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2]; const q = Math.sqrt(x * x + z * z) - R; return Math.sqrt(q * q + y * y) - r; }
/** smooth union / subtraction / intersection (k = blend size in metres) */
export function smin(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }
export function smax(a, b, k) { return -smin(-a, -b, k); }
export const ssub = (a, b, k) => smax(a, -b, k);
/** cheap smooth 3D value noise in [-1, 1] (for hair clumps, organic surfaces) */
export function noise3(x, y, z) {
  const h = (i, j, k) => { const s = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; };
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf), L = (a, b, t) => a + (b - a) * t;
  return L(L(L(h(xi, yi, zi), h(xi + 1, yi, zi), u), L(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u), v), L(L(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u), L(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u), v), w);
}

/**
 * Mesh an SDF with naive surface nets. f(p) -> distance, bounds = [[x0,y0,z0],[x1,y1,z1]], step = cell size (m),
 * color(p) -> [r, g, b] 0..1 (optional, becomes vertex colours). Normals come from the SDF gradient, so it's smooth.
 */
export function mesh(f, bounds, step, color = null) {
  const [mn, mx] = bounds, nx = Math.ceil((mx[0] - mn[0]) / step) + 1, ny = Math.ceil((mx[1] - mn[1]) / step) + 1, nz = Math.ceil((mx[2] - mn[2]) / step) + 1;
  const V = new Float32Array(nx * ny * nz), id = (i, j, k) => i + nx * (j + ny * k), p = [0, 0, 0];
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { p[0] = mn[0] + i * step; p[1] = mn[1] + j * step; p[2] = mn[2] + k * step; V[id(i, j, k)] = f(p); }
  const cell = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1), cid = (i, j, k) => i + (nx - 1) * (j + (ny - 1) * k);
  const pos = [], EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cv = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let mask = 0; for (let c = 0; c < 8; c++) { cv[c] = V[id(i + (c & 1), j + ((c >> 1) & 1), k + ((c >> 2) & 1))]; if (cv[c] < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of EDGES) {
      if ((cv[a] < 0) === (cv[b] < 0)) continue;
      const t = cv[a] / (cv[a] - cv[b]);
      sx += (a & 1) + t * ((b & 1) - (a & 1)); sy += ((a >> 1) & 1) + t * (((b >> 1) & 1) - ((a >> 1) & 1)); sz += ((a >> 2) & 1) + t * (((b >> 2) & 1) - ((a >> 2) & 1)); n++;
    }
    cell[cid(i, j, k)] = pos.length / 3;
    pos.push(mn[0] + (i + sx / n) * step, mn[1] + (j + sy / n) * step, mn[2] + (k + sz / n) * step);
  }
  const idx = [];
  const quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; flip ? idx.push(a, c, b, a, d, c) : idx.push(a, b, c, a, c, d); };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) { const s0 = V[id(i, j, k)] < 0; if (s0 === (V[id(i + 1, j, k)] < 0)) continue; quad(cell[cid(i, j - 1, k - 1)], cell[cid(i, j, k - 1)], cell[cid(i, j, k)], cell[cid(i, j - 1, k)], !s0); }
  for (let k = 1; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) { const s0 = V[id(i, j, k)] < 0; if (s0 === (V[id(i, j + 1, k)] < 0)) continue; quad(cell[cid(i - 1, j, k - 1)], cell[cid(i - 1, j, k)], cell[cid(i, j, k)], cell[cid(i, j, k - 1)], !s0); }
  for (let k = 0; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) { const s0 = V[id(i, j, k)] < 0; if (s0 === (V[id(i, j, k + 1)] < 0)) continue; quad(cell[cid(i - 1, j - 1, k)], cell[cid(i, j - 1, k)], cell[cid(i, j, k)], cell[cid(i - 1, j, k)], !s0); }
  const nrm = new Float32Array(pos.length), col = color ? new Float32Array(pos.length) : null, e = step * 0.5, q = [0, 0, 0];
  for (let v = 0; v < pos.length; v += 3) {
    const x = pos[v], y = pos[v + 1], z = pos[v + 2], g = (dx, dy, dz) => { q[0] = x + dx; q[1] = y + dy; q[2] = z + dz; return f(q); };
    let gx = g(e, 0, 0) - g(-e, 0, 0), gy = g(0, e, 0) - g(0, -e, 0), gz = g(0, 0, e) - g(0, 0, -e); const l = Math.hypot(gx, gy, gz) || 1;
    nrm[v] = gx / l; nrm[v + 1] = gy / l; nrm[v + 2] = gz / l;
    if (col) { q[0] = x; q[1] = y; q[2] = z; const c = color(q); col[v] = c[0]; col[v + 1] = c[1]; col[v + 2] = c[2]; }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  if (col) geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx); return geo;
}
/** hex '#rrggbb' -> linear [r, g, b] for vertex colours */
export function rgb(hex) { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; }

// The Tall Tale world: a sunny, saturated, slightly old-timey cartoon world built in 3D with painted canvas textures.
//   sky(scene, { top, horizon, sunset }) · sunlight(scene, opts) · clouds(scene, list)
//   mainStreet(E, opts) -> { scene, sun, people: [...] }      a small-town street with shops, poles, wires, hills
//   interior(E, opts)  -> { scene, sun, counter, window }      a wallpapered shop/office room with a counter and a window
//   meadow(E, opts)    -> { scene, sun }                       grass, hills, fence, trees, flowers (day or sunset)
// Textures: planks, wallpaper, brick, dirt, grass, siding, facade(name, ...), sign(text) — all drawn in code.
import * as THREE from 'three';
import { lightRig } from './engine.js';
import { Toon } from './toon.js';

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const TEX = {};
export function canvasTex(key, w, h, draw, rep = [1, 1]) {
  let t = TEX[key];
  if (!t) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; TEX[key] = t;
  }
  const u = t.clone(); u.repeat.set(rep[0], rep[1]); u.needsUpdate = true; return u;
}
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
export const mat = (o = {}) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...o });
const box = (w, h, d, m, x = 0, y = 0, z = 0, parent) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; if (parent) parent.add(b); return b; };
const cyl = (r1, r2, h, m, x, y, z, parent, seg = 12) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; if (parent) parent.add(c); return c; };

// ---------- painted textures ----------
export const T = {
  planks: (col = '#A8693E', rep = [1, 1]) => canvasTex('planks' + col, 512, 512, (g, w, h) => {
    const n = 8, ph = h / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle = shade(col, 0.86 + rnd(i * 3) * 0.24); g.fillRect(0, i * ph, w, ph);
      g.strokeStyle = shade(col, 0.7); g.globalAlpha = 0.35; g.lineWidth = 2;
      for (let k = 0; k < 4; k++) { g.beginPath(); const y = i * ph + 8 + rnd(i * 7 + k) * (ph - 16); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w, y + 2); g.stroke(); }
      g.globalAlpha = 1; g.fillStyle = shade(col, 0.45); g.fillRect(0, i * ph, w, 4);
      const jx = rnd(i * 11) * w; g.fillRect(jx, i * ph, 4, ph);
      g.fillStyle = shade(col, 0.5); [jx - 14, jx + 18].forEach((x) => { g.beginPath(); g.arc(x, i * ph + ph / 2, 3, 0, 7); g.fill(); });
    }
  }, rep),
  wallpaper: (col = '#9E2E3A', motif = '#B8414C', rep = [1, 1]) => canvasTex('wp' + col + motif, 256, 256, (g, w, h) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = motif; g.strokeStyle = motif; g.lineWidth = 5;
    const fleur = (x, y, s) => { g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.moveTo(0, -40); g.bezierCurveTo(18, -20, 18, 0, 0, 14); g.bezierCurveTo(-18, 0, -18, -20, 0, -40); g.fill(); g.beginPath(); g.arc(-22, 4, 12, 0, 7); g.arc(22, 4, 12, 0, 7); g.fill(); g.fillRect(-3, 10, 6, 26); g.restore(); };
    [[64, 64], [192, 192], [192, 64 - 256], [64, 192]].forEach(([x, y], i) => i < 2 && fleur(x, y, 0.9));
    g.globalAlpha = 0.5; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(i % 2 ? 192 : 64, i < 2 ? 192 : 64, 6, 0, 7); g.fill(); } g.globalAlpha = 1;
  }, rep),
  brick: (col = '#B5553C', rep = [1, 1]) => canvasTex('brick' + col, 512, 512, (g, w, h) => {
    g.fillStyle = shade(col, 0.6); g.fillRect(0, 0, w, h); const bh = 32, bw = 85;
    for (let r = 0; r < h / bh; r++) for (let c = -1; c < w / bw + 1; c++) { const x = c * bw + (r % 2) * bw / 2; g.fillStyle = shade(col, 0.85 + rnd(r * 31 + c) * 0.3); g.fillRect(x + 3, r * bh + 3, bw - 6, bh - 6); }
  }, rep),
  siding: (col = '#6FA3B8', rep = [1, 1]) => canvasTex('siding' + col, 256, 256, (g, w, h) => {
    for (let i = 0; i < 8; i++) { const y = i * 32; const gr = g.createLinearGradient(0, y, 0, y + 32); gr.addColorStop(0, shade(col, 1.06)); gr.addColorStop(1, shade(col, 0.86)); g.fillStyle = gr; g.fillRect(0, y, w, 32); g.fillStyle = shade(col, 0.6); g.fillRect(0, y + 30, w, 2); }
  }, rep),
  dirt: (col = '#C8763F', rep = [1, 1], tracks = true) => canvasTex('dirt' + col + tracks, 512, 512, (g, w, h) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = shade(col, 0.75 + rnd(i) * 0.5); g.globalAlpha = 0.5; g.beginPath(); g.arc(rnd(i * 2.1) * w, rnd(i * 3.7) * h, 1 + rnd(i * 5.3) * 2.5, 0, 7); g.fill(); }
    g.globalAlpha = 0.18; g.fillStyle = shade(col, 0.6);
    if (tracks) [0.3, 0.38, 0.62, 0.7].forEach((x) => g.fillRect(x * w, 0, 14, h));
    g.globalAlpha = 1;
  }, rep),
  grass: (col = '#6DBB4A', rep = [1, 1]) => canvasTex('grass' + col, 512, 512, (g, w, h) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5000; i++) { const x = rnd(i * 1.3) * w, y = rnd(i * 2.9) * h; g.strokeStyle = shade(col, 0.7 + rnd(i * 7.7) * 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd(i) - 0.5) * 6, y - 6 - rnd(i * 9) * 8); g.stroke(); }
  }, rep),
  felt: (col = '#1F5A45') => canvasTex('felt' + col, 256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { g.fillStyle = shade(col, 0.85 + rnd(i) * 0.3); g.fillRect(rnd(i * 3) * w, rnd(i * 7) * h, 2, 2); } }),
};

/** a painted shopfront (front face of a building) */
export function facade(name, { wall = '#C9603F', kind = 'brick', trim = '#F2E6CF', sign = '#2E4E3F', signText = '#F2D37A', awning = null, w = 5, h = 7, seed = 1 } = {}) {
  const px = 110, cw = Math.round(w * px), ch = Math.round(h * px);
  return canvasTex('fac' + name + wall + w + h + seed, cw, ch, (g) => {
    if (kind === 'brick') { const b = T.brick(wall).image; for (let y = 0; y < ch; y += 512) for (let x = 0; x < cw; x += 512) g.drawImage(b, x, y); }
    else { const b = T.siding(wall).image; for (let y = 0; y < ch; y += 256) for (let x = 0; x < cw; x += 256) g.drawImage(b, x, y); }
    // cornice
    g.fillStyle = trim; g.fillRect(0, 0, cw, 40); g.fillStyle = shade(trim, 0.7); g.fillRect(0, 40, cw, 10);
    for (let x = 10; x < cw; x += 34) { g.fillStyle = trim; g.fillRect(x, 50, 16, 16); }
    // upper windows
    const nw = Math.max(2, Math.round(w / 1.6)), ww = cw / nw;
    for (let i = 0; i < nw; i++) {
      const x = i * ww + ww * 0.22, y = ch * 0.16, wd = ww * 0.56, ht = ch * 0.22;
      g.fillStyle = trim; g.fillRect(x - 10, y - 14, wd + 20, ht + 28);
      const gr = g.createLinearGradient(x, y, x + wd, y + ht); gr.addColorStop(0, '#7FB3D8'); gr.addColorStop(0.5, '#3F6E9A'); gr.addColorStop(1, '#2B4A70'); g.fillStyle = gr; g.fillRect(x, y, wd, ht);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(x + wd * 0.1, y + ht); g.lineTo(x + wd * 0.45, y); g.lineTo(x + wd * 0.6, y); g.lineTo(x + wd * 0.25, y + ht); g.fill();
      g.fillStyle = trim; g.fillRect(x + wd / 2 - 4, y, 8, ht); g.fillRect(x, y + ht / 2 - 4, wd, 8);
      if (rnd(seed * 13 + i) > 0.5) { g.fillStyle = shade(wall, 0.8); g.fillRect(x, y, wd, ht * 0.35); }
    }
    // sign board
    const sy = ch * 0.47, sh = ch * 0.1;
    g.fillStyle = sign; g.fillRect(cw * 0.06, sy, cw * 0.88, sh); g.strokeStyle = signText; g.lineWidth = 5; g.strokeRect(cw * 0.06 + 8, sy + 8, cw * 0.88 - 16, sh - 16);
    g.fillStyle = signText; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = sh * 0.56; g.font = `700 ${fs}px Caladea, Georgia, serif`;
    while (g.measureText(name).width > cw * 0.78 && fs > 10) { fs -= 2; g.font = `700 ${fs}px Caladea, Georgia, serif`; }
    g.fillText(name, cw / 2, sy + sh / 2 + 2);
    // shop window + door
    const by = sy + sh + 16, bh = ch - by;
    g.fillStyle = shade(trim, 0.9); g.fillRect(0, by, cw, bh);
    const dw = cw * 0.2, dx = rnd(seed) > 0.5 ? cw * 0.08 : cw * 0.72;
    g.fillStyle = '#5A3A26'; g.fillRect(dx, by + 14, dw, bh - 14); g.fillStyle = '#3F6E9A'; g.fillRect(dx + 12, by + 30, dw - 24, bh * 0.4);
    g.fillStyle = '#E8C060'; g.beginPath(); g.arc(dx + dw - 18, by + bh * 0.62, 6, 0, 7); g.fill();
    const wx = dx < cw / 2 ? dx + dw + 20 : cw * 0.06, wwid = cw * 0.66 - 20;
    const gr = g.createLinearGradient(wx, by, wx + wwid, by + bh); gr.addColorStop(0, '#9CC7E4'); gr.addColorStop(0.45, '#4C7FA8'); gr.addColorStop(1, '#2A4565');
    g.fillStyle = '#4A2E1E'; g.fillRect(wx - 8, by + 14, wwid + 16, bh * 0.7 + 16); g.fillStyle = gr; g.fillRect(wx, by + 22, wwid, bh * 0.7);
    for (let i = 0; i < 5; i++) { g.fillStyle = ['#E7B04A', '#D8584A', '#7DB36A', '#F2E6CF', '#8A6FC0'][(i + seed) % 5]; g.fillRect(wx + 16 + i * (wwid - 32) / 5, by + bh * 0.55, (wwid - 32) / 5 - 10, bh * 0.2); }
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.moveTo(wx + wwid * 0.15, by + 22 + bh * 0.7); g.lineTo(wx + wwid * 0.4, by + 22); g.lineTo(wx + wwid * 0.52, by + 22); g.lineTo(wx + wwid * 0.27, by + 22 + bh * 0.7); g.fill();
    if (awning) { const ay = by - 4; for (let x = 0, i = 0; x < cw; x += 40, i++) { g.fillStyle = i % 2 ? '#F4EFE4' : awning; g.fillRect(x, ay, 40, 46); g.beginPath(); g.arc(x + 20, ay + 46, 20, 0, Math.PI); g.fill(); } }
  });
}

/** a flat painted sign (plank board with text) as a plane mesh */
export function signBoard(text, { w = 2, h = 0.5, bg = '#2E4E3F', fg = '#F2D37A', font = 'Caladea' } = {}) {
  const t = canvasTex('sign' + text + bg + fg + w + h, Math.round(w * 200), Math.round(h * 200), (g, cw, ch) => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(10, 10, cw - 20, ch - 20);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = ch * 0.5; g.font = `700 ${fs}px ${font}, Georgia, serif`;
    while (g.measureText(text).width > cw * 0.86) { fs -= 2; g.font = `700 ${fs}px ${font}, Georgia, serif`; }
    g.fillText(text, cw / 2, ch / 2 + 3);
  });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), [mat({ color: shade(bg, 0.7) }), mat({ color: shade(bg, 0.7) }), mat({ color: shade(bg, 0.7) }), mat({ color: shade(bg, 0.7) }), mat({ map: t }), mat({ color: shade(bg, 0.7) })]);
  m.castShadow = true; return m;
}

// ---------- sky, sun, clouds ----------
export function sky(scene, { top = '#3D8EE0', horizon = '#BFE4F7', ground = '#BFE4F7', r = 380 } = {}) {
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: { top: { value: new THREE.Color(top) }, hor: { value: new THREE.Color(horizon) }, gnd: { value: new THREE.Color(ground) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 top, hor, gnd; varying vec3 vP; void main(){ float y = vP.y; vec3 c = y > 0.0 ? mix(hor, top, pow(clamp(y * 1.6, 0.0, 1.0), 0.7)) : gnd; gl_FragColor = vec4(c, 1.0); }' });
  const s = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), m); s.renderOrder = -10; scene.add(s); return s;
}
let cloudT = null;
function cloudTex() {
  if (cloudT) return cloudT;
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  const puffs = [[110, 175, 58], [185, 140, 80], [285, 118, 96], [380, 150, 70], [250, 178, 70], [440, 180, 44], [70, 190, 36]];
  g.filter = 'blur(3px)';
  g.fillStyle = '#B9CCE6'; puffs.forEach(([x, y, r]) => { g.beginPath(); g.arc(x + 4, y + 14, r, 0, 7); g.fill(); });
  g.fillStyle = '#FFFFFF'; puffs.forEach(([x, y, r]) => { g.beginPath(); g.arc(x - 2, y - 2, r * 0.92, 0, 7); g.fill(); });
  g.globalCompositeOperation = 'destination-out'; g.filter = 'blur(10px)'; g.fillRect(0, 214, 512, 60);
  cloudT = new THREE.CanvasTexture(c); cloudT.colorSpace = THREE.SRGBColorSpace; return cloudT;
}
export function clouds(scene, list, tint = '#FFFFFF') {
  const out = [];
  list.forEach(([x, y, z, s]) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex(), color: tint, fog: false, toneMapped: false, depthWrite: false })); sp.position.set(x, y, z); sp.scale.set(s * 2, s, 1); scene.add(sp); out.push(sp); });
  return out;
}
export function sunlight(scene, E, { col = '#FFF0D6', i = 2.6, pos = [6, 10, 6], target = [0, 0, 0], box = 12, sky = '#CFE6FF', ground = '#C48A5A', hemi = 1.25, env = 0.25 } = {}) {
  scene.environment = E.envMap; scene.environmentIntensity = env;
  const r = lightRig(scene, { key: col, keyI: i, keyPos: pos, target, shadowBox: box, rimCol: '#FFFFFF', rimI: 0.4, sky, ground, hemiI: hemi });
  r.key.shadow.camera.far = 80; r.key.shadow.bias = -0.0006; r.key.shadow.camera.updateProjectionMatrix();
  return r;
}

// ---------- reusable bits ----------
export function hills(scene, { col = '#79C25A', z = -90, list } = {}) {
  const g = new THREE.Group(); scene.add(g);
  (list || [[-40, z, 34, 12], [10, z - 10, 46, 16], [60, z + 4, 36, 11], [-90, z + 10, 40, 10]]).forEach(([x, zz, r, h], i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mat({ color: shade(col, 0.92 + rnd(i) * 0.16), map: T.grass(col, [6, 3]) }));
    m.scale.set(r, h, r * 0.6); m.position.set(x, -h * 0.25, zz); g.add(m);
    for (let k = 0; k < 6; k++) { const a = rnd(i * 9 + k) * 2 - 1; const t = tree(0.5 + rnd(k) * 0.4); t.position.set(x + a * r * 0.6, h * (0.75 - Math.abs(a) * 0.45) - 1, zz + r * 0.25); t.scale.multiplyScalar(2.2); g.add(t); }
  });
  return g;
}
export function tree(s = 1, col = '#4E9A3C', kind = 'round') {
  const g = new THREE.Group();
  cyl(0.12 * s, 0.18 * s, 1.6 * s, mat({ color: '#7A5234' }), 0, 0.8 * s, 0, g);
  const lm = mat({ color: col });
  if (kind === 'cypress') { const c = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), lm); c.scale.set(0.7 * s, 2.6 * s, 0.7 * s); c.position.y = 3.2 * s; c.castShadow = true; g.add(c); }
  else [[0, 2.3, 0, 1.0], [0.6, 2.0, 0.2, 0.75], [-0.6, 2.0, -0.1, 0.8], [0.1, 2.9, -0.2, 0.75], [0.2, 2.2, 0.6, 0.7]].forEach(([x, y, z, r], i) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 2), mat({ color: shade(col, 0.9 + rnd(i) * 0.2) })); m.position.set(x * s, y * s, z * s); m.castShadow = true; g.add(m);
  });
  return g;
}
export function pole(h = 7) {
  const g = new THREE.Group(), w = mat({ color: '#6E4E36' });
  cyl(0.09, 0.12, h, w, 0, h / 2, 0, g, 8); box(1.8, 0.1, 0.1, w, 0, h - 0.6, 0, g); box(1.2, 0.08, 0.08, w, 0, h - 1.1, 0, g);
  [-0.8, -0.3, 0.3, 0.8].forEach((x) => cyl(0.03, 0.03, 0.12, mat({ color: '#CFE3E8' }), x, h - 0.5, 0, g, 6));
  return g;
}
export function wire(a, b, sag = 0.6, col = '#2A2A33') {
  const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; const p = new THREE.Vector3().lerpVectors(a, b, t); p.y -= Math.sin(t * Math.PI) * sag; pts.push(p); }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.015, 4), new THREE.MeshBasicMaterial({ color: col })); return m;
}
export function lamp() {
  const g = new THREE.Group(), m = mat({ color: '#2E3A35', metalness: 0.3, roughness: 0.5 });
  cyl(0.05, 0.07, 3.2, m, 0, 1.6, 0, g, 8); cyl(0.18, 0.1, 0.3, m, 0, 3.3, 0, g, 8);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), new THREE.MeshStandardMaterial({ color: '#FFF3C8', emissive: '#FFE7A0', emissiveIntensity: 0.6 })); b.position.y = 3.15; g.add(b);
  return g;
}
export function barrel() { const g = new THREE.Group(); cyl(0.33, 0.33, 0.8, mat({ color: '#9A6337', map: T.planks('#9A6337') }), 0, 0.4, 0, g, 16); [0.12, 0.68].forEach((y) => cyl(0.345, 0.345, 0.05, mat({ color: '#3A3A3F', metalness: 0.4 }), 0, y, 0, g, 16)); return g; }
export function crate(s = 0.6) { const g = new THREE.Group(); box(s, s, s, mat({ map: T.planks('#B07A48', [0.5, 0.5]) }), 0, s / 2, 0, g); return g; }
export function car(col = '#2C3A4A') {
  const g = new THREE.Group(), m = mat({ color: col, roughness: 0.4, metalness: 0.2 }), dark = mat({ color: '#1E1E24', roughness: 0.6 });
  box(1.5, 0.5, 3.2, m, 0, 0.75, 0, g); box(1.3, 0.8, 1.4, m, 0, 1.4, -0.3, g);
  box(1.2, 0.5, 0.05, mat({ color: '#9CC7E4', roughness: 0.1 }), 0, 1.5, 0.41, g);
  [[-0.78, 1.1], [0.78, 1.1], [-0.78, -1.1], [0.78, -1.1]].forEach(([x, z]) => { const w = cyl(0.36, 0.36, 0.22, dark, x, 0.36, z, g, 16); w.rotation.z = Math.PI / 2; const hub = cyl(0.12, 0.12, 0.24, mat({ color: '#D9D2C2' }), x, 0.36, z, g, 10); hub.rotation.z = Math.PI / 2; });
  [-0.5, 0.5].forEach((x) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat({ color: '#FFF3C8', emissive: '#FFE7A0', emissiveIntensity: 0.3 })); l.position.set(x, 0.95, 1.62); g.add(l); });
  return g;
}
export function fence(len = 10, col = '#F4EFE4') {
  const g = new THREE.Group(), m = mat({ color: col });
  for (let x = 0; x <= len; x += 1.5) box(0.1, 1.0, 0.1, m, x, 0.5, 0, g);
  [0.45, 0.85].forEach((y) => box(len, 0.08, 0.06, m, len / 2, y, 0, g));
  return g;
}
export function bunting(a, b, cols = ['#D8343F', '#F4EFE4', '#3C6FB6', '#F2C230']) {
  const g = new THREE.Group(); g.add(wire(a, b, 0.5, '#3A2A2A'));
  const n = Math.round(a.distanceTo(b) / 0.5);
  for (let i = 1; i < n; i++) {
    const t = i / n, p = new THREE.Vector3().lerpVectors(a, b, t); p.y -= Math.sin(t * Math.PI) * 0.5;
    const tri = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.16, 0, 0), new THREE.Vector3(0.16, 0, 0), new THREE.Vector3(0, -0.32, 0)]), new THREE.MeshBasicMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide }));
    tri.position.copy(p); tri.lookAt(p.x + (b.z - a.z), p.y, p.z - (b.x - a.x)); g.add(tri);
  }
  return g;
}
const LOOKS = [
  { body: '#5C8FD6', hat: 'bowler', hatCol: '#3B3346' }, { body: '#E8734A', hat: 'cap', hatCol: '#6E8A4F' }, { body: '#F2B8C6', hat: 'flower', pattern: 'apron' },
  { body: '#9BC46A', hat: 'boater', hatCol: '#E8C77A' }, { body: '#8C6FC9', hat: 'tophat', hatCol: '#2A2638' }, { body: '#F2C230', hat: 'beanie', hatCol: '#D8343F', pattern: 'overalls' },
  { body: '#4FB3A9', hat: 'none', neck: 'tie' }, { body: '#D8584A', hat: 'cap', hatCol: '#3B3346', pattern: 'stripes' },
];
/** cheap background extras: small cut-outs at low resolution */
export function extras(scene, spots, moodFn) {
  return spots.map(([x, z, k, mood], i) => { const p = new Toon(LOOKS[(k ?? i) % LOOKS.length], { height: 1.7, res: 0.5 }); p.set({ mood: mood || 'neutral', armL: [8, 6], armR: [8, 6] }); p.at(x, 0, z); scene.add(p.group); return p; });
}

// ---------- SETS ----------
const SHOPS = [['BAKERY', '#C9603F', 'brick', '#D8343F'], ['GENERAL STORE', '#6FA3B8', 'wood', null], ['BARBER', '#E3C16F', 'wood', '#3C6FB6'], ['GRAND HOTEL', '#9E4A3A', 'brick', null],
  ['POST OFFICE', '#7FA36A', 'wood', null], ['TAILOR', '#B98ACF', 'wood', '#2E4E3F'], ['HARDWARE', '#B5553C', 'brick', '#F2C230'], ['CAFE', '#E58A6A', 'wood', '#2E4E3F'],
  ['BANK', '#C7B79A', 'brick', null], ['PHARMACY', '#5FA39A', 'wood', '#D8343F'], ['SHOES', '#D9A34A', 'wood', null], ['THEATER', '#A3485A', 'brick', '#F2C230']];

/** a small-town main street running along -z. The road is x -4..4; boardwalks x ±4..6; shop fronts at x ±6. */
export function mainStreet(E, { len = 70, people = true, cars = true, dusk = false, shops = SHOPS } = {}) {
  const buildings = [];
  const scene = new THREE.Scene();
  sky(scene, dusk ? { top: '#3B3F8F', horizon: '#F59C6B' } : {});
  const sun = sunlight(scene, E, dusk ? { col: '#FFB27A', i: 2.0, pos: [-8, 5, -14], sky: '#B9A2D8', ground: '#7A4A3A', hemi: 0.9 } : { pos: [9, 13, 5], box: 16 });
  clouds(scene, [[-30, 26, -100, 16], [20, 34, -110, 20], [55, 22, -90, 12], [-60, 30, -80, 14], [5, 20, -70, 9]], dusk ? '#FFC9B0' : '#FFFFFF');
  hills(scene, { z: -len - 30 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(8, len + 40), mat({ map: T.dirt('#C98A52', [2, (len + 40) / 8]) })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -len / 2 + 10); road.receiveShadow = true; scene.add(road);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), mat({ map: T.grass('#79C25A', [60, 60]) })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; scene.add(ground);
  [-1, 1].forEach((s) => {
    const walk = box(2.2, 0.18, len + 20, mat({ map: T.planks('#A8693E', [(len + 20) / 3, 1]) }), s * 5.1, 0.09, -len / 2 + 5, scene);
    walk.material.map.rotation = Math.PI / 2;
    let z = 8, k = s > 0 ? 0 : 5;
    while (z > -len) {
      const [name, wall, kind, aw] = shops[k % shops.length]; const w = 5 + rnd(k) * 2.5, h = 6 + rnd(k * 3) * 3.5; k++;
      const front = mat({ map: facade(name, { wall, kind, awning: aw, w, h, seed: k }) }), side = mat({ color: shade(wall, 0.85) });
      const b = new THREE.Mesh(new THREE.BoxGeometry(6, h, w), s < 0 ? [front, side, side, side, side, side] : [side, front, side, side, side, side]);
      b.position.set(s * 9.2, h / 2, z - w / 2); b.castShadow = b.receiveShadow = true; scene.add(b); buildings.push({ name, side: s, z: z - w / 2, w, h, x: s * 6.2 });
      if (aw) { const a = box(1.4, 0.06, w - 0.4, mat({ color: aw }), s * 5.6, 2.9, z - w / 2, scene); a.rotation.z = s * 0.35; }
      z -= w + 0.15;
    }
    for (let zz = 4; zz > -len; zz -= 12) { const p = pole(7.5); p.position.set(s * 4.4, 0, zz); scene.add(p); }
    for (let zz = -2; zz > -len; zz -= 16) { const l = lamp(); l.position.set(s * 4.3, 0.18, zz); scene.add(l); }
  });
  for (let zz = 4; zz > -len + 12; zz -= 12) [-1, 1].forEach((s) => [-0.8, -0.3, 0.3, 0.8].forEach((dx) => scene.add(wire(new THREE.Vector3(s * 4.4 + dx, 6.95, zz), new THREE.Vector3(s * 4.4 + dx, 6.95, zz - 12), 0.45))));
  for (let zz = -6; zz > -len; zz -= 22) scene.add(bunting(new THREE.Vector3(-4.4, 6.2, zz), new THREE.Vector3(4.4, 6.2, zz - 2)));
  [[-4.6, -3], [4.7, -9], [-4.8, -20], [4.6, -27]].forEach(([x, z], i) => { const o = i % 2 ? barrel() : crate(); o.position.set(x, 0.18, z); scene.add(o); });
  const carsList = [];
  if (cars) [[2, -14, '#2C3A4A'], [-2, -30, '#7A2E2E'], [2, -44, '#2E5A44']].forEach(([x, z, c]) => { const v = car(c); v.position.set(x, 0, z); if (x < 0) v.rotation.y = Math.PI; scene.add(v); carsList.push(v); });
  const crowd = people ? extras(scene, [[-5.3, -6], [5.0, -10, 2], [-5.0, -15], [5.4, -18, 4], [-5.4, -24, 3], [4.9, -31, 5], [-5.0, -36, 6], [5.3, -42, 7], [-5.2, -48, 1]]) : [];
  if (dusk) crowd.forEach((p) => p.tint('#D9B9C9'));
  return { scene, sun, people: crowd, cars: carsList, buildings, faceAll(cam) { crowd.forEach((p) => p.face(cam)); } };
}

/** a shop / office interior. Back wall z = -depth, window in it; counter along the right side. */
export function interior(E, { w = 8, depth = 7, h = 4.2, wall = '#9E2E3A', motif = '#B8414C', floor = '#A8693E', ceiling = '#24524A', view = null, bulbs = true, signText = 'NO CREDIT · CASH ONLY', picture = true, counterOn = true, litter = true } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#1A1418');
  scene.environment = E.envMap; scene.environmentIntensity = 0.35;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, depth + 2), mat({ map: T.planks(floor, [w / 2.5, (depth + 2) / 2.5]) })); fl.rotation.x = -Math.PI / 2; fl.position.z = -depth / 2 + 1; fl.receiveShadow = true; scene.add(fl);
  fl.material.map.rotation = Math.PI / 2;
  const wp = (len) => mat({ map: T.wallpaper(wall, motif, [len / 1.4, h / 1.4]) });
  const wain = (len) => mat({ map: T.planks('#6B3E26', [len / 2, 0.5]) });
  // back wall with a window hole: 4 boxes around the opening
  const ww = 3.2, wh = 1.9, wy = 1.1;
  const back = new THREE.Group(); back.position.z = -depth; scene.add(back);
  box((w - ww) / 2, h, 0.2, wp((w - ww) / 2), -(w + ww) / 4, h / 2, 0, back); box((w - ww) / 2, h, 0.2, wp((w - ww) / 2), (w + ww) / 4, h / 2, 0, back);
  box(ww, wy, 0.2, wain(ww), 0, wy / 2, 0, back); box(ww, h - wy - wh, 0.2, wp(ww), 0, h - (h - wy - wh) / 2, 0, back);
  const frameM = mat({ color: '#2F5C52' });
  box(ww + 0.2, 0.14, 0.3, frameM, 0, wy, 0.05, back); box(ww + 0.2, 0.14, 0.3, frameM, 0, wy + wh, 0.05, back); box(0.12, wh, 0.3, frameM, -ww / 2, wy + wh / 2, 0.05, back); box(0.12, wh, 0.3, frameM, ww / 2, wy + wh / 2, 0.05, back); box(0.06, wh, 0.1, frameM, 0, wy + wh / 2, 0.05, back);
  const viewPlane = new THREE.Mesh(new THREE.PlaneGeometry(ww * 2.6, wh * 2.6), new THREE.MeshBasicMaterial({ color: '#BFE4F7', toneMapped: false })); viewPlane.position.set(0, wy + wh / 2, -2.5); back.add(viewPlane);
  if (view) { viewPlane.material.map = view; viewPlane.material.color.set('#FFFFFF'); }
  [-1, 1].forEach((s) => { const sw = box(0.2, h, depth + 2, wp(depth + 2), s * w / 2, h / 2, -depth / 2 + 1, scene); sw.material.map.repeat.set((depth + 2) / 1.4, h / 1.4); });
  [-1, 1].forEach((s) => box(0.24, 1.0, depth + 2, wain(depth + 2), s * (w / 2 - 0.02), 0.5, -depth / 2 + 1, scene));
  box((w - ww) / 2, 1.0, 0.24, wain(2), -(w + ww) / 4, 0.5, -depth + 0.02, scene); box((w - ww) / 2, 1.0, 0.24, wain(2), (w + ww) / 4, 0.5, -depth + 0.02, scene);
  const ceil = box(w, 0.2, depth + 2, mat({ map: T.wallpaper(ceiling, shade(ceiling, 1.25), [w / 1.2, (depth + 2) / 1.2]) }), 0, h + 0.1, -depth / 2 + 1, scene);
  box(w, 0.16, 0.3, mat({ color: '#E8DCC0' }), 0, h - 0.08, -depth + 0.1, scene);
  // counter on the right
  const counter = new THREE.Group(); counter.position.set(w / 2 - 1.3, 0, -depth / 2 + 0.6); if (counterOn) scene.add(counter);
  box(1.0, 1.1, depth - 1.5, mat({ map: T.planks('#7A3E24', [1, 2]) }), 0, 0.55, 0, counter);
  box(1.2, 0.08, depth - 1.3, mat({ map: T.felt('#1F5A45') }), 0, 1.14, 0, counter);
  box(0.1, 0.06, depth - 1.3, mat({ color: '#C9A13B', metalness: 0.6, roughness: 0.3 }), -0.62, 1.12, 0, counter);
  // picture frame + sign
  const pic = canvasTex('pic', 256, 200, (g) => { g.fillStyle = '#E9DCC0'; g.fillRect(0, 0, 256, 200); g.strokeStyle = '#3A2A22'; g.lineWidth = 6; g.beginPath(); g.moveTo(40, 140); g.quadraticCurveTo(90, 60, 140, 120); g.quadraticCurveTo(170, 80, 220, 140); g.stroke(); g.fillStyle = '#C9603F'; g.beginPath(); g.arc(190, 60, 22, 0, 7); g.fill(); });
  if (picture) { const pf = box(0.9, 0.7, 0.05, [mat({ color: '#C9A13B' }), mat({ color: '#C9A13B' }), mat({ color: '#C9A13B' }), mat({ color: '#C9A13B' }), mat({ map: pic }), mat({ color: '#C9A13B' })], -w / 2 + 0.13, 2.4, -depth / 2, scene); pf.rotation.y = Math.PI / 2; }
  if (signText) { const sb = signBoard(signText, { w: 2.2, h: 0.4, bg: '#3A2A2A', fg: '#F2E6CF' }); sb.position.set(w / 2 - 0.13, 2.9, -depth / 2 + 0.6); sb.rotation.y = -Math.PI / 2; scene.add(sb); }
  // light: warm sun through the window + bulbs
  const sun = new THREE.DirectionalLight('#FFE4B8', 2.4); sun.position.set(-2, 6, -depth - 6); sun.target.position.set(0.5, 0, -1); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 30 }); sun.shadow.bias = -0.0006; sun.shadow.camera.updateProjectionMatrix(); sun.shadow.radius = 4;
  scene.add(sun, sun.target); scene.add(new THREE.HemisphereLight('#FFE9D2', '#5A3A2A', 1.1));
  const fill = new THREE.PointLight('#FFD9A8', 6, 12, 1.4); fill.position.set(0, 3.2, -1); scene.add(fill);
  if (bulbs) [[-1.5, -2.2], [1.6, -4.5]].forEach(([x, z]) => {
    const cord = cyl(0.008, 0.008, 1.0, new THREE.MeshBasicMaterial({ color: '#C9A13B' }), x, h - 0.5, z, scene, 4);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshStandardMaterial({ color: '#FFF6DA', emissive: '#FFE7A0', emissiveIntensity: 2.2 })); b.position.set(x, h - 1.05, z); scene.add(b);
    const pl = new THREE.PointLight('#FFD9A0', 3, 6, 1.6); pl.position.set(x, h - 1.15, z); scene.add(pl);
  });
  // floor litter (betting slips / paper) for life
  const slips = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.1), new THREE.MeshStandardMaterial({ color: '#F2E6CF', side: THREE.DoubleSide }), 140);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < 140; i++) { e.set(-Math.PI / 2, 0, rnd(i * 3) * 6.3); q.setFromEuler(e); m4.compose(new THREE.Vector3((rnd(i) - 0.5) * (w - 1), 0.005 + i * 0.00005, -rnd(i * 7) * depth + 0.8), q, new THREE.Vector3(1, 1, 1)); slips.setMatrixAt(i, m4); slips.setColorAt(i, new THREE.Color(['#F2E6CF', '#E9D7A5', '#F4C7B0', '#CFE3D0'][i % 4])); }
  slips.receiveShadow = true; if (litter) scene.add(slips);
  return { scene, sun: { key: sun }, counter, window: viewPlane, w, depth, h };
}

/** grass, hills, a fence, trees, flowers. sunset: true = pink/orange evening */
export function meadow(E, { sunset = false, flowers = true, fenceOn = true, treesOn = true } = {}) {
  const scene = new THREE.Scene();
  sky(scene, sunset ? { top: '#5B4FA8', horizon: '#FF9E6E' } : { top: '#3D8EE0', horizon: '#CBEAF8' });
  const sun = sunlight(scene, E, sunset ? { col: '#FFB27A', i: 2.4, pos: [-12, 4, -18], sky: '#C9A6E0', ground: '#6A4A3A', hemi: 1.0, box: 14 } : { pos: [8, 12, 6], box: 14 });
  clouds(scene, [[-30, 22, -90, 14], [25, 30, -100, 18], [60, 18, -80, 11], [-5, 16, -60, 8]], sunset ? '#FFB8A0' : '#FFFFFF');
  const geo = new THREE.PlaneGeometry(200, 200, 100, 100); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.sin(x * 0.08) * 0.6 + Math.cos(y * 0.06 + 1) * 0.8 + (Math.abs(x) < 6 && Math.abs(y) < 10 ? 0 : 0)); }
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, mat({ map: T.grass(sunset ? '#7DB55A' : '#6DBB4A', [50, 50]) })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.5; ground.receiveShadow = true; scene.add(ground);
  const flat = new THREE.Mesh(new THREE.CircleGeometry(12, 48), mat({ map: T.grass(sunset ? '#7DB55A' : '#6DBB4A', [6, 6]) })); flat.rotation.x = -Math.PI / 2; flat.receiveShadow = true; scene.add(flat);
  hills(scene, { z: -70, col: sunset ? '#86B860' : '#79C25A' });
  (treesOn ? [[-7, -9, 'round'], [8, -14, 'round'], [-14, -20, 'cypress'], [-11, -22, 'cypress'], [14, -26, 'cypress'], [17, -25, 'cypress']] : []).forEach(([x, z, k], i) => { const t = tree(1.1 + rnd(i) * 0.4, '#4E9A3C', k); t.position.set(x, 0, z); scene.add(t); });
  if (fenceOn) { const f = fence(16); f.position.set(-8, 0, -6); scene.add(f); }
  if (flowers) {
    const fl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.05, 0), new THREE.MeshStandardMaterial({ roughness: 0.6 }), 1600), m4 = new THREE.Matrix4();
    for (let i = 0; i < 1600; i++) { const a = rnd(i) * 6.28, r = 2 + rnd(i * 3.3) * 22; m4.makeTranslation(Math.cos(a) * r, 0.1, Math.sin(a) * r - 4); fl.setMatrixAt(i, m4); fl.setColorAt(i, new THREE.Color(['#F2D23A', '#F29BB5', '#FFFFFF', '#B98ACF', '#F28C4A'][i % 5])); }
    scene.add(fl);
    const tufts = new THREE.InstancedMesh(new THREE.ConeGeometry(0.025, 0.16, 3), mat({ color: sunset ? '#6FA650' : '#5DA83E' }), 4000);
    for (let i = 0; i < 4000; i++) { const a = rnd(i * 1.7) * 6.28, r = 1 + rnd(i * 5.1) * 14; m4.makeTranslation(Math.cos(a) * r, 0.07, Math.sin(a) * r - 3); tufts.setMatrixAt(i, m4); }
    scene.add(tufts);
  }
  return { scene, sun };
}

/** render a set into a texture once (for windows, picture-in-picture, spyglass views) */
export function snapshot(E, scene, cam, w = 1024, h = 768) {
  const rt = new THREE.WebGLRenderTarget(w, h, { samples: 4, type: THREE.HalfFloatType });
  const r = E.renderer; const prev = r.getRenderTarget(); r.setRenderTarget(rt); r.render(scene, cam); r.setRenderTarget(prev);
  return rt.texture;
}

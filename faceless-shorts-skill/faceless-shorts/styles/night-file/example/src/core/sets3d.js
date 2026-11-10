// Night File 3D sets: dark places with ONE light source. People are faceless Humans (human.js, face: false) in two looks:
// witness = near-black with a thin red rim light, subject = solid glowing red (blooms). Each set returns { scene, update(t) }.
import * as THREE from 'three';
import { rbox, mesh } from './sdf.js';

const std = (color, rough = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };

/** witness look: dark body, red fresnel rim */
export function witnessMat() {
  return new THREE.ShaderMaterial({
    uniforms: { uRim: { value: new THREE.Color('#E4322B') }, uBase: { value: new THREE.Color('#07080B') } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uRim, uBase; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 3.0); gl_FragColor = vec4(uBase + uRim * f * 2.2, 1.0); }',
  });
}
/** subject look: glowing ember red */
export function subjectMat(i = 2.2) { return new THREE.MeshStandardMaterial({ color: '#2A0503', emissive: '#E4322B', emissiveIntensity: i, roughness: 0.6 }); }
/** a soft visible light cone (fake volumetric) from (x, y, z) pointing down */
export function lightCone(h = 2.6, r = 1.1, color = '#F1D9A6', a = 0.12) {
  const g = new THREE.ConeGeometry(r, h, 48, 1, true); g.translate(0, -h / 2, 0);
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uC: { value: new THREE.Color(color) }, uA: { value: a }, uH: { value: h } },
    vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = position.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uC; uniform float uA, uH; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float e = abs(dot(normalize(vN), normalize(vV))); float fade = 1.0 + vY / uH; gl_FragColor = vec4(uC * uA * e * e * fade, 1.0); }' });
  return new THREE.Mesh(g, m);
}
function lamp(scene, x, y, z, I = 18) {
  const s = new THREE.SpotLight('#F6DDAE', I, 10, 0.85, 0.6, 1.3); s.position.set(x, y, z); s.target.position.set(x, 0, z); s.castShadow = true; s.shadow.mapSize.set(2048, 2048); s.shadow.bias = -0.0003; s.shadow.radius = 4;
  scene.add(s, s.target); const fix = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.05, 32), new THREE.MeshBasicMaterial({ color: '#FFF0CF' })); fix.position.set(x, y + 0.02, z); scene.add(fix);
  const c = lightCone(y, 1.35); c.position.set(x, y, z); scene.add(c); return s;
}

/** long apartment corridor, doors both sides, one working ceiling light. o.flicker(t) optional */
export function corridor() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#050608'); scene.fog = new THREE.Fog('#050608', 4, 16);
  const wall = std('#3A4258', 0.85), floorM = std('#262B36', 0.55), doorM = std('#3A3330', 0.6), frameM = std('#1B1E26', 0.7);
  const fl = box(3, 0.1, 22, floorM, 0, -0.05, -8); scene.add(fl);
  scene.add(box(0.1, 3, 22, wall, -1.5, 1.5, -8), box(0.1, 3, 22, wall, 1.5, 1.5, -8), box(3, 0.1, 22, std('#1A1E28'), 0, 3, -8), box(3, 3, 0.1, wall, 0, 1.5, -19));
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) { const z = -1 - i * 3.4 - (s > 0 ? 1.7 : 0); scene.add(box(0.06, 2.1, 0.95, doorM, s * 1.44, 1.05, z), box(0.08, 2.25, 1.1, frameM, s * 1.47, 1.1, z)); const k = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), std('#B89A5E', 0.3, { metalness: 0.8 })); k.position.set(s * 1.39, 1.0, z + 0.35); scene.add(k); }
  const end = box(0.95, 2.1, 0.06, doorM, 0, 1.05, -18.94); scene.add(end);
  const L1 = lamp(scene, 0, 2.95, -4.5, 22); const L2 = lamp(scene, 0, 2.95, -11.5, 9);
  scene.add(new THREE.HemisphereLight('#4A5A80', '#0A0C12', 0.7));
  return { scene, lights: [L1, L2], update(t) { L2.intensity = (Math.sin(t * 37) > 0.6 || Math.sin(t * 11.3) > 0.9) ? 1 : 9; } };
}
/** a house at night: one lit window, a streetlight, moonlight */
export function houseNight() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#070B14'); scene.fog = new THREE.Fog('#070B14', 8, 30);
  const g = box(40, 0.1, 40, std('#0F141C', 0.95), 0, -0.05, -5); scene.add(g);
  const houseM = std('#2E3850', 0.85); scene.add(box(5, 3, 4, houseM, 0, 1.5, -6));
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 3.4, 1.8, 4, 1), std('#151A25', 0.8)); roof.rotation.y = Math.PI / 4; roof.scale.set(1.05, 1, 0.85); roof.position.set(0, 3.9, -6); scene.add(roof);
  const lit = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#F4C67A').multiplyScalar(0.85) })); lit.position.set(1.3, 1.7, -3.98); scene.add(lit);
  const dark = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8), std('#0A0D14')); dark.position.set(-1.3, 1.7, -3.98); scene.add(dark);
  scene.add(box(0.9, 1.9, 0.05, std('#120F0E'), -0.1, 0.95, -3.98));
  const wl = new THREE.PointLight('#F4C67A', 6, 6, 1.6); wl.position.set(1.3, 1.7, -3.4); scene.add(wl);
  const pole = box(0.08, 4, 0.08, std('#1C2230'), 3.6, 2, -1.5); scene.add(pole); lamp(scene, 3.1, 3.9, -1.5, 14);
  const moon = new THREE.DirectionalLight('#8FA8E0', 1.4); moon.position.set(-5, 8, 3); scene.add(moon); scene.add(new THREE.HemisphereLight('#2A3A60', '#05070C', 0.7));
  for (let i = 0; i < 7; i++) { const tr = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3 + (i % 3), 8), std('#080B12', 0.9)); tr.position.set(-9 + i * 3 + (i > 2 ? 5 : 0), 1.6 + (i % 3) / 2, -9 - (i % 2) * 2); scene.add(tr); }
  return { scene, update() {} };
}
/** a cork case wall with pinned photos (canvas textures) and red string */
export function caseWall(photos) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0A0806');
  const cork = document.createElement('canvas'); cork.width = cork.height = 512; const c = cork.getContext('2d'); c.fillStyle = '#5A3F2A'; c.fillRect(0, 0, 512, 512); for (let i = 0; i < 5000; i++) { c.fillStyle = `rgba(${Math.random() > 0.5 ? '20,10,5' : '140,100,60'},${Math.random() * 0.25})`; c.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
  const ct = new THREE.CanvasTexture(cork); ct.colorSpace = THREE.SRGBColorSpace; ct.wrapS = ct.wrapT = THREE.RepeatWrapping; ct.repeat.set(3, 4);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(4, 5.2), std('#ffffff', 0.95, { map: ct })); board.receiveShadow = true; scene.add(board);
  const pins = [[-1.0, 1.4], [0.9, 1.6], [0.0, 0.2], [-1.1, -1.2], [1.0, -1.0]];
  pins.forEach(([x, y], i) => { const tex = new THREE.CanvasTexture(photos[i % photos.length]); tex.colorSpace = THREE.SRGBColorSpace; const ph = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.05), std('#ffffff', 0.6, { map: tex })); ph.position.set(x, y - 0.42, 0.02 + i * 0.002); ph.rotation.z = (i % 2 ? 1 : -1) * 0.06; ph.castShadow = true; scene.add(ph); const pin = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), std('#D62828', 0.3)); pin.position.set(x, y, 0.06); scene.add(pin); });
  const strM = new THREE.MeshStandardMaterial({ color: '#C21F1F', roughness: 0.6, emissive: '#5A0A0A', emissiveIntensity: 0.6 });
  [[0, 2], [1, 2], [2, 3], [2, 4], [0, 1]].forEach(([a, b]) => { const A = new THREE.Vector3(pins[a][0], pins[a][1], 0.07), Bv = new THREE.Vector3(pins[b][0], pins[b][1], 0.07), mid = A.clone().lerp(Bv, 0.5); mid.z = 0.1; mid.y -= 0.08; scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, mid, Bv), 20, 0.012, 6), strM)); });
  const s = new THREE.SpotLight('#F6DDAE', 30, 10, 0.45, 0.6, 1.3); s.position.set(0.6, 1.4, 4); s.target.position.set(0, 0.2, 0); s.castShadow = true; s.shadow.mapSize.set(2048, 2048); scene.add(s, s.target);
  scene.add(new THREE.HemisphereLight('#3A2A20', '#000000', 0.25));
  return { scene, update() {} };
}

/** 1970s airliner cabin at night: rows of seats, dim window glow, overhead reading lights, a rear door that can open
 * onto a storm. Aisle runs along -z (rear door at z = -14). update(t, { door: 0..1, rain: 0..1, flash }) */
export function planeCabin() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#05060A'); scene.fog = new THREE.Fog('#05060A', 5, 18);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 18, 48, 1, true, 0, Math.PI * 2), std('#2B3142', 0.85, { side: THREE.BackSide }));
  shell.rotation.x = Math.PI / 2; shell.position.set(0, 1.05, -6); shell.receiveShadow = true; scene.add(shell);
  scene.add(box(3.4, 0.1, 18, std('#3A2E34', 0.7), 0, -0.05, -6));
  const seatM = std('#3E4A6A', 0.75), headM = std('#D8D2C4', 0.8);
  for (let r = 0; r < 9; r++) for (const s of [-1, 1]) for (const c of [0, 1]) {
    const x = s * (0.55 + c * 0.52), z = -0.4 - r * 1.25; scene.add(box(0.48, 0.45, 0.5, seatM, x, 0.42, z), box(0.48, 0.75, 0.1, seatM, x, 0.95, z - 0.22), box(0.36, 0.14, 0.03, headM, x, 1.25, z - 0.17));
  }
  const winM = new THREE.MeshBasicMaterial({ color: '#1B2A44' });
  for (let r = 0; r < 9; r++) for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.32), winM); w.position.set(s * 1.62, 1.35, -0.4 - r * 1.25); w.rotation.y = -s * Math.PI / 2 + s * 0.35; scene.add(w); }
  scene.add(box(2.6, 0.12, 18, std('#20252F', 0.8), 0, 2.45, -6));
  const doorFrame = box(1.0, 2.0, 0.08, std('#4A4F5E', 0.6), 0, 1.0, -14.2); scene.add(doorFrame);
  const door = box(0.9, 1.9, 0.06, std('#3A3F4C', 0.6), 0, 0.95, -14.15); scene.add(door);
  const storm = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.86), new THREE.MeshBasicMaterial({ color: '#1A2440' })); storm.position.set(0, 0.95, -14.17); scene.add(storm);
  const rainG = new THREE.BufferGeometry(), RN = 220, rp = new Float32Array(RN * 6); rainG.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rainG, new THREE.LineBasicMaterial({ color: '#C9D8F2', transparent: true, opacity: 0.85 })); scene.add(rain);
  const L1 = lamp(scene, 0, 2.38, -2.0, 12), L2 = lamp(scene, 0, 2.38, -5.4, 8), L3 = lamp(scene, 0, 2.38, -8.9, 5);
  scene.add(new THREE.HemisphereLight('#4A5A80', '#0A0C12', 0.55));
  const flashL = new THREE.PointLight('#BFD3FF', 0, 12, 1.2); flashL.position.set(0, 1.2, -14.8); scene.add(flashL);
  const exitL = new THREE.SpotLight('#9FB4E0', 6, 8, 0.7, 0.6, 1.2); exitL.position.set(0, 2.3, -12.2); exitL.target.position.set(0, 0, -14); scene.add(exitL, exitL.target);   // dim cold light by the rear door
  return {
    scene, update(t, o = {}) {
      const dk = o.door || 0; door.position.x = dk * 0.95; door.position.z = -14.15 + dk * 0.3; storm.material.color.set(dk > 0.3 ? '#4A5C8E' : '#1A2440');
      const ra = o.rain || 0; rain.visible = ra > 0;
      for (let i = 0; i < RN; i++) { const x = (Math.sin(i * 12.9) * 0.5) * 0.8, y = ((i * 0.37 + t * 9) % 2.2) - 0.1, z = -14.3 - (i % 7) * 0.4; rp.set([x, 2 - y, z, x - 0.06, 2 - y - 0.25, z], i * 6); }
      rainG.attributes.position.needsUpdate = true; flashL.intensity = o.flash ? 40 * o.flash : 0;
    },
  };
}

// Deep Dive sets: each returns { scene, update(t) } built around the origin; people stand on y = 0, facing +z.
import * as THREE from 'three';
import { rbox, ellipsoid, capsule, smin, sphere, mesh, rgb, noise3 } from './sdf.js';
import { lightRig } from './engine.js';

const std = (color, rough = 0.7, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
function canvasTex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; }
const shadowed = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
function sdfMesh(f, b, step, mat) { return shadowed(new THREE.Mesh(mesh(f, b, step), mat)); }

// ═════════════════════════ KITCHEN (warm low sun through a window) ═════════════════════════
export function kitchen(E) {
  const scene = new THREE.Scene(); scene.environment = E.envMap; scene.environmentIntensity = 0.3;
  scene.background = new THREE.Color('#E8DCCB'); scene.fog = new THREE.Fog('#E8DCCB', 8, 20);
  const planks = canvasTex(1024, 1024, (g, w, h) => { for (let i = 0; i < 8; i++) { const l = 150 + (i * 37) % 30; g.fillStyle = `rgb(${l + 20},${l - 18},${l - 60})`; g.fillRect(0, i * h / 8, w, h / 8); g.fillStyle = 'rgba(60,35,15,0.35)'; g.fillRect(0, i * h / 8, w, 3); for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(80,50,25,0.08)'; g.fillRect(Math.random() * w, i * h / 8 + Math.random() * h / 8, 120 + Math.random() * 200, 2); } } }, [6, 6]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), std('#ffffff', 0.55, { map: planks })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wallM = std('#EFE3D0', 0.9), back = shadowed(new THREE.Mesh(new THREE.BoxGeometry(14, 4, 0.2), wallM)); back.position.set(0, 2, -2.2); scene.add(back);
  const side = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 8), wallM)); side.position.set(-3, 2, 1.5); scene.add(side);
  // window in the back wall: bright sky panel + frame
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.3), new THREE.MeshBasicMaterial({ color: new THREE.Color('#DDEEFF').multiplyScalar(1.6) })); sky.position.set(1.3, 2.05, -2.09); scene.add(sky);
  const frM = std('#FFFFFF', 0.4); for (const [w, h, x, y] of [[1.75, 0.08, 1.3, 2.74], [1.75, 0.08, 1.3, 1.36], [0.08, 1.4, 0.42, 2.05], [0.08, 1.4, 2.18, 2.05], [0.05, 1.3, 1.3, 2.05]]) { const b = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), frM)); b.position.set(x, y, -2.05); scene.add(b); }
  // counter run with rounded doors, worktop, sink, kettle, plant
  const cab = std('#5F8F7E', 0.55), top = new THREE.MeshPhysicalMaterial({ color: '#F2EEE6', roughness: 0.25, clearcoat: 0.6 });
  const run = sdfMesh((p) => rbox(p, [0, 0.45, 0], [1.6, 0.45, 0.32], 0.03), [[-1.7, -0.02, -0.4], [1.7, 0.94, 0.4]], 0.02, cab); run.position.set(0.2, 0, -1.75); scene.add(run);
  for (let i = 0; i < 5; i++) { const d = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.7, 0.02), std('#6FA08E', 0.5))); d.position.set(-1.05 + i * 0.63, 0.47, -1.42); scene.add(d); const k = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), std('#E2C27A', 0.3, { metalness: 0.8 })); k.position.set(-0.83 + i * 0.63, 0.72, -1.4); scene.add(k); }
  const wt = shadowed(new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.05, 0.72), top)); wt.position.set(0.2, 0.93, -1.75); scene.add(wt);
  const kettle = sdfMesh((p) => smin(ellipsoid(p, [0, 0.12, 0], [0.11, 0.12, 0.11]), capsule(p, [0.09, 0.12, 0], [0.17, 0.2, 0], 0.018), 0.03), [[-0.15, -0.02, -0.15], [0.22, 0.28, 0.15]], 0.008, new THREE.MeshPhysicalMaterial({ color: '#D9534F', roughness: 0.3, clearcoat: 1 })); kettle.position.set(-0.9, 0.95, -1.7); scene.add(kettle);
  const pot = sdfMesh((p) => capsule(p, [0, 0, 0], [0, 0.16, 0], 0.09, 0.11), [[-0.13, -0.1, -0.13], [0.13, 0.28, 0.13]], 0.01, std('#C8734A', 0.6)); pot.position.set(1.5, 1.04, -1.7); scene.add(pot);
  for (let i = 0; i < 9; i++) { const l = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), std('#5E9A50', 0.6))); l.scale.set(0.6, 1.6, 0.4); l.position.set(1.5 + Math.sin(i * 2.4) * 0.08, 1.33 + (i % 3) * 0.04, -1.7 + Math.cos(i * 2.4) * 0.08); l.rotation.z = Math.sin(i * 2.4) * 0.7; scene.add(l); }
  const L = lightRig(scene, { key: '#FFD9AE', keyI: 4.2, keyPos: [2.6, 3.2, -4], target: [0.3, 0.8, 0], rimCol: '#CFE0FF', rimI: 1.2, hemiI: 0.75, shadowBox: 3.2 });
  const fill = new THREE.DirectionalLight('#FFF1E2', 1.1); fill.position.set(-1, 2.5, 4); scene.add(fill);
  return { scene, lights: L, update() {} };
}

// ═════════════════════════ X-RAY STAGE ═════════════════════════
/** glass x-ray body material: cyan fresnel edges, transparent middle */
export function xrayMaterial(color = '#4FD1E8', strength = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Color(color) }, uS: { value: strength } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uCol; uniform float uS; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2); gl_FragColor = vec4(uCol * (0.06 + f * 1.6) * uS, 1.0); }',
  });
}
export function xrayStage(E) {
  const scene = new THREE.Scene();
  scene.background = canvasTex(64, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0B1A30'); gr.addColorStop(1, '#03070F'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  scene.add(new THREE.HemisphereLight('#9FD9FF', '#05080F', 0.6));
  const k = new THREE.DirectionalLight('#DDF4FF', 2.2); k.position.set(2, 3, 3); scene.add(k);
  const grid = new THREE.GridHelper(20, 40, '#1F6F88', '#123A4A'); grid.material.transparent = true; grid.material.opacity = 0.35; scene.add(grid);
  return { scene, update() {} };
}
/** bones + organs to put inside a Human's torso (add to human.spine). Returns { group, stomach, heart } */
export function insides() {
  const g = new THREE.Group();
  const bone = new THREE.MeshStandardMaterial({ color: '#E6F7FF', emissive: '#7FDDF2', emissiveIntensity: 0.28, roughness: 0.4 });
  const spineGeo = new THREE.CylinderGeometry(0.018, 0.02, 0.03, 16);
  for (let i = 0; i < 17; i++) { const v = new THREE.Mesh(spineGeo, bone); v.position.set(0, -0.05 + i * 0.034, -0.085 + Math.sin(i / 16 * Math.PI) * 0.015); g.add(v); }
  for (let i = 0; i < 9; i++) { const r = 0.12 + Math.sin(Math.min(1, i / 4) * 1.4) * 0.05 - (i > 5 ? (i - 5) * 0.012 : 0); const rib = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0085, 8, 48, Math.PI * 1.55), bone); rib.rotation.set(Math.PI / 2 + 0.3, 0, Math.PI * 0.725); rib.scale.set(1.2, 0.85, 1); rib.position.set(0, 0.47 - i * 0.04, -0.02); g.add(rib); }
  const sternum = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.18, 6, 12), bone); sternum.position.set(0, 0.33, 0.1); g.add(sternum);
  for (const s of [-1, 1]) { const cl = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.14, 6, 12), bone); cl.rotation.z = Math.PI / 2 + s * 0.15; cl.position.set(s * 0.09, 0.47, 0.06); g.add(cl); }
  const pelvis = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 10, 40, Math.PI), bone); pelvis.rotation.x = Math.PI / 2 + 0.6; pelvis.position.set(0, -0.06, 0); g.add(pelvis);
  const organ = (col) => new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.3, emissive: col, emissiveIntensity: 0.18 });
  const stomach = new THREE.Mesh(mesh((p) => { let d = capsule(p, [-0.02, 0.1, 0], [-0.07, 0.02, 0.01], 0.045, 0.06); d = smin(d, capsule(p, [-0.07, 0.02, 0.01], [0.03, -0.03, 0.02], 0.06, 0.045), 0.04); d = smin(d, capsule(p, [0.03, -0.03, 0.02], [0.07, 0.02, 0.02], 0.045, 0.028), 0.03); return smin(d, capsule(p, [-0.02, 0.1, 0], [-0.01, 0.2, -0.02], 0.016), 0.02); }, [[-0.15, -0.11, -0.09], [0.13, 0.24, 0.1]], 0.005), organ('#E87A8C'));
  stomach.position.set(0.03, 0.14, 0.02); g.add(stomach);
  const heart = new THREE.Mesh(mesh((p) => smin(smin(sphere(p, [-0.018, 0.02, 0], 0.035), sphere(p, [0.018, 0.02, 0], 0.035), 0.02), ellipsoid(p, [0, -0.02, 0], [0.04, 0.05, 0.035]), 0.03), [[-0.07, -0.08, -0.06], [0.07, 0.07, 0.06]], 0.004), organ('#D62839'));
  heart.position.set(0.025, 0.36, 0.03); heart.rotation.z = -0.4; g.add(heart);
  const lungs = [];
  for (const s of [-1, 1]) { const lung = new THREE.Mesh(mesh((p) => ellipsoid(p, [0, 0, 0], [0.06, 0.11, 0.07]), [[-0.08, -0.13, -0.09], [0.08, 0.13, 0.09]], 0.008), new THREE.MeshPhysicalMaterial({ color: '#F2A3AE', roughness: 0.6, transparent: true, opacity: 0.45, emissive: '#F2A3AE', emissiveIntensity: 0.1 })); lung.position.set(s * 0.085, 0.36, 0); g.add(lung); lungs.push(lung); }
  g.position.y = 0.04; return { group: g, stomach, heart, lungs };
}

// ═════════════════════════ BLOOD VESSEL (macro) ═════════════════════════
export function vessel(E) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#2A0508'); scene.fog = new THREE.FogExp2('#3A070C', 0.11);
  const tubeGeo = new THREE.CylinderGeometry(1.6, 1.6, 40, 96, 200, true); const pos = tubeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), a = Math.atan2(z, x), n = 1 + 0.08 * noise3(Math.cos(a) * 3, y * 0.6, Math.sin(a) * 3) + 0.03 * Math.sin(y * 3 + a * 5); pos.setXYZ(i, x * n, y, z * n); }
  tubeGeo.computeVertexNormals();
  const wall = new THREE.Mesh(tubeGeo, new THREE.MeshPhysicalMaterial({ color: '#B8283A', roughness: 0.35, clearcoat: 1, side: THREE.BackSide, emissive: '#5A0A14', emissiveIntensity: 0.5 }));
  wall.rotation.x = Math.PI / 2; scene.add(wall);
  const prof = []; for (let i = 0; i <= 24; i++) { const r = i / 24 * 0.32; const t = r / 0.32; prof.push(new THREE.Vector2(r, 0.05 * (0.35 + 0.65 * Math.sqrt(1 - t * t)) * (0.6 + 0.8 * t * t))); }
  const half = new THREE.LatheGeometry(prof, 48), cellGeo = half.clone(); { const p2 = half.clone(); p2.scale(1, -1, 1); }
  const rbc = new THREE.MeshPhysicalMaterial({ color: '#D8243A', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.2, emissive: '#5C0610', emissiveIntensity: 0.4, side: THREE.DoubleSide, sheen: 0.6, sheenColor: new THREE.Color('#ff8090') });
  const N = 46, inst = new THREE.InstancedMesh(cellGeo, rbc, N * 2), seeds = [];
  for (let i = 0; i < N; i++) seeds.push([Math.random() * Math.PI * 2, 0.55 + Math.random() * 0.75, Math.random() * 26, Math.random() * 6, Math.random() * 6]);
  scene.add(inst);
  const NB = 60, bub = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 20, 14), new THREE.MeshPhysicalMaterial({ color: '#CFE3EA', roughness: 0.1, transparent: true, opacity: 0.55, emissive: '#7FA6B4', emissiveIntensity: 0.35 }), NB); bub.count = 0; scene.add(bub);
  const bseeds = []; for (let i = 0; i < NB; i++) bseeds.push([Math.random() * Math.PI * 2, 0.3 + Math.random() * 1.0, Math.random() * 24, 0.4 + Math.random() * 1.2]);
  const RED = new THREE.Color('#D8243A'), DARK = new THREE.Color('#5E0E1C');
  const l1 = new THREE.PointLight('#FFB0A0', 60, 14, 1.4); scene.add(l1); scene.add(new THREE.HemisphereLight('#FF6B6B', '#300308', 0.9));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(0.5, 0.5, 0.5);
  return {
    scene, light: l1,
    /** co2 0..1 fills the vessel with grey CO2 bubbles; dark 0..1 turns the cells from bright to dark red (less oxygen) */
    update(t, camZ = 0, co2 = 0, dark = 0) {
      rbc.color.copy(RED).lerp(DARK, dark);
      bub.count = Math.floor(NB * co2);
      for (let i = 0; i < bub.count; i++) { const [a, r, z0, sz] = bseeds[i]; v.set(Math.cos(a + t * 0.2) * r, Math.sin(a + t * 0.2) * r + Math.sin(t * 2 + i) * 0.05, camZ - 1.5 - ((z0 + t * 1.8) % 24)); q.identity(); sc.setScalar(sz); m.compose(v, q, sc); bub.setMatrixAt(i, m); }
      bub.instanceMatrix.needsUpdate = true; sc.setScalar(0.5);
      l1.position.set(0.2, 0.3, camZ - 3.5);
      seeds.forEach(([a, r, z0, rx, ry], i) => {
        const z = camZ - 2.2 - ((z0 + t * 2.2) % 26); e.set(rx + t * 0.6, ry + t * 0.4, 0); q.setFromEuler(e); v.set(Math.cos(a + t * 0.1) * r, Math.sin(a + t * 0.1) * r, z);
        m.compose(v, q, sc); inst.setMatrixAt(i * 2, m); e.set(rx + t * 0.6 + Math.PI, ry + t * 0.4, 0); q.setFromEuler(e); m.compose(v, q, sc); inst.setMatrixAt(i * 2 + 1, m);
      });
      inst.instanceMatrix.needsUpdate = true;
    },
  };
}

// WHAT IF YOU SWALLOW GUM?: the shot list (the only file that changes per video, with script.json).
// A shot: { id, at, cam: [cx, cy], zoom, note, draw(lt, d, t) }  · lt = time in shot, d = shot length, t = film time.
// It runs until the next shot's `at`; the last one ends at T.dur. Cut = L(i) - 0.08 (picture changes just before the line).
// Sound: cue(t, type, { gain, dur }): types tools/mix.py knows are listed in STYLE.md.
import { ctx, C, W, H, clamp, lerp, seg, eo, eio, eob, rnd, bigText } from './core/lib.js';
import { L, Le, Wd, T } from './core/timing.js';
import * as K from './core/kit.js';

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);

  // ── 1 · HOOK: he pops the gum, chews, gulps ─────────────────────────────
  {
    const st = cut(0), gulp = Wd('swallow', 0) - st, shock = Wd('gum', 0) - st;
    add({ id: 'S01', at: st, cam: [540, 820], note: 'room, gum to mouth, gulp, shock',
      draw(lt) {
        K.room();
        const arm = K.armPose(K.armPose(K.armPose(K.ARM.down, K.ARM.mouth, 0.55), K.ARM.mouth, eio(seg(lt, 0, 0.3))), K.ARM.down, eio(seg(lt, 0.4, 0.8)));
        const shocked = lt > shock;
        const shake = shocked ? Math.sin(lt * 70) * 6 * Math.max(0, 1 - (lt - shock) * 2) : 0;
        K.man({ x: 540 + shake, y: 1180, s: 1.6, arm, holding: lt < 0.32 ? (x, y) => K.gum(x, y, 0.55, 0.3) : null,
          mouth: shocked ? 'o' : lt < 0.32 ? 'smile' : 'chew', chew: Math.abs(Math.sin(lt * 14)), eyes: shocked ? 'wide' : 'n', brow: shocked ? 1 : 0 });
        if (lt > gulp && lt < gulp + 0.75) bigText('GULP!', 830, 560, 92, C.white, -0.18, eob(seg(lt, gulp, gulp + 0.15)));
        K.shockLines(540, 625, 300, shocked ? clamp((lt - shock) * 5) : 0);
      } });
    cue(st + 0.3, 'pop', { gain: 0.6 }); cue(st + gulp, 'gulp'); cue(st + shock, 'boing', { gain: 0.5 });
  }

  // ── 2 · X-RAY: it slides down into the stomach ──────────────────────────
  {
    const st = cut(1), arrive = Wd('stomach', 1) - st + 0.15;
    add({ id: 'S02', at: st, cam: [540, 1050], zoom: 0.3, note: 'x-ray body, gum travels mouth to stomach',
      draw(lt, d, t) {
        K.xray(t);
        const [gx, gy] = K.foodAt(eio(seg(lt, 0.15, arrive)));
        const pulse = lt > arrive ? Math.max(0, Math.sin((lt - arrive) * 8)) * Math.exp(-(lt - arrive) * 1.5) : 0;
        K.man({ x: 540, y: 1120, s: 1.5, xray: true, mouth: 'o', eyes: 'wide', brow: 1, inside: [gx, gy, lt * 2], pulse });
      } });
    cue(st, 'whoosh'); cue(st + 0.2, 'slide', { dur: arrive - 0.2 }); cue(st + arrive, 'plop');
  }

  // ── 3 · STOMACH: acid gets to work ──────────────────────────────────────
  {
    const st = cut(2), work = Wd('work', 2) - st;
    add({ id: 'S03', at: st, cam: [540, 900], note: 'inside stomach, acid bubbles, sizzle on "work"',
      draw(lt, d, t) {
        K.insideStomach(t);
        const bob = Math.sin(lt * 2.4) * 18;
        K.gum(540, 820 + bob, 3.4, Math.sin(lt * 1.7) * 0.12);
        if (lt > work) { ctx.save(); ctx.globalAlpha = clamp((lt - work) * 4);
          for (let i = 0; i < 10; i++) { const an = i / 10 * Math.PI * 2 + lt, r1 = 190 + Math.sin(lt * 12 + i) * 12;
            ctx.strokeStyle = C.yellow; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath();
            ctx.moveTo(540 + Math.cos(an) * r1, 820 + bob + Math.sin(an) * r1 * 0.7); ctx.lineTo(540 + Math.cos(an) * (r1 + 50), 820 + bob + Math.sin(an) * (r1 + 50) * 0.7); ctx.stroke(); }
          ctx.restore(); }
      } });
    cue(st, 'whoosh'); cue(st, 'bubbles', { dur: L(3) - st }); cue(st + work, 'sizzle', { dur: 1.0 });
  }

  // ── 4 · sugar dissolves, the base stays ─────────────────────────────────
  {
    const st = cut(3), sugar = Wd('sugar', 3) - st, base = Wd('base', 3) - st;
    add({ id: 'S04', at: st, cam: [540, 820], note: 'sugar specks fly off, GUM BASE tag on "base"',
      draw(lt, d, t) {
        K.insideStomach(t + 3);
        const bob = Math.sin(lt * 2.4) * 14;
        for (let i = 0; i < 26; i++) {
          const s0 = sugar + rnd(i) * 1.0, p = seg(lt, s0, s0 + 1.1); if (p <= 0 || p >= 1) continue;
          const an = rnd(i + 40) * Math.PI * 2, dd = 120 + eo(p) * 380;
          ctx.save(); ctx.globalAlpha = 1 - p; ctx.translate(540 + Math.cos(an) * dd, 820 + Math.sin(an) * dd * 0.8); ctx.rotate(p * 4 + i);
          if (i % 2) { ctx.fillStyle = C.white; ctx.fillRect(-14, -14, 28, 28); } else { ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fillStyle = C.yellow; ctx.fill(); }
          ctx.restore();
        }
        K.gum(540, 820 + bob, 3.4, Math.sin(lt * 1.7) * 0.12);
        K.tag('GUM BASE', 540, 500, 540, 700 + bob, 66, lt > base ? eob(seg(lt, base, base + 0.3)) : 0);
      } });
    cue(st, 'whoosh'); cue(st + sugar, 'sparkle', { dur: 1.2 }); cue(st + base, 'pop');
  }

  // ── 5 · your body can't break it down (enzymes bounce off) ──────────────
  {
    const st = cut(4), end = cut(5), P = 1.05;
    add({ id: 'S05', at: st, cam: [540, 800], note: 'enzyme chompers bounce off stretchy gum',
      draw(lt) {
        ctx.fillStyle = C.bg; ctx.fillRect(-300, -300, W + 600, H + 600);
        const sx = Math.abs(Math.sin(lt * 3.2));
        K.gum(540, 780, 4.4, 0, 1 + 0.32 * sx, 1 - 0.16 * sx);
        K.pill('GUM BASE', 540, 430, 52, C.ink, C.white, eob(seg(lt, 0.1, 0.4)));
        for (const sd of [-1, 1]) {
          const cyc = lt % P, first = lt < P, contact = 540 + sd * (250 + sx * 70);
          const x = cyc < 0.45 ? lerp(first ? 540 + sd * 720 : 540 + sd * 430, contact + sd * 85, eio(cyc / 0.45)) : lerp(contact + sd * 85, 540 + sd * 430, eo((cyc - 0.45) / 0.6));
          K.chomper(x, 800, 92, 0.12 + 0.5 * Math.abs(Math.sin(lt * 16)), sd > 0);
          if (cyc > 0.43 && cyc < 0.65) K.burst(contact, 790, 1, 1 - (cyc - 0.43) / 0.22);
          if (lt > 0.5) K.redX(x, 640, 0.17, Math.min(1, clamp((cyc - 0.45) * 6) * clamp((1 - cyc) * 8)));
        }
      } });
    cue(st, 'whoosh'); for (let k = 0; st + k * P + 0.45 < end; k++) cue(st + k * P + 0.45, 'boing', { gain: 0.7 });
  }

  // ── 6 · seven years? total myth (X slams on "myth") ─────────────────────
  {
    const st = cut(5), slam = Wd('myth', 5) - st - 0.05;
    add({ id: 'S06', at: st, cam: [540, 800], note: 'calendar 7 YEARS drops, red X slams on "myth"',
      draw(lt) {
        ctx.fillStyle = C.bg; ctx.fillRect(-300, -300, W + 600, H + 600);
        const shake = lt > slam ? Math.sin(lt * 90) * 18 * Math.max(0, 1 - (lt - slam) * 4) : 0;
        ctx.save(); ctx.translate(shake, 0);
        const drop = eob(seg(lt, 0, 0.45));
        K.calendar(540, lerp(-400, 780, drop), 1, '7', 'YEARS', lerp(-0.25, -0.04, drop));
        if (lt > slam) { const p = seg(lt, slam, slam + 0.2); K.redX(540, 780, lerp(1.9, 1, eo(p)), clamp(p * 3)); }
        ctx.restore();
      } });
    cue(st, 'whoosh'); cue(st + 0.4, 'thud'); cue(st + slam + 0.1, 'slam');
  }

  // ── 7 · it moves through your gut ───────────────────────────────────────
  {
    const st = cut(6), gut = K.makeGut();
    add({ id: 'S07', at: st, cam: [540, 760], note: 'gum travels the whole x-ray intestine',
      draw(lt, d, t) {
        K.xray(t); gut.draw();
        const u = eio(seg(lt, 0.1, d - 0.1)), [x, y, a] = gut.at(u);
        ctx.save(); ctx.globalAlpha = 0.35; for (let i = 1; i < 6; i++) { const q = gut.at(Math.max(0, u - i * 0.012)); ctx.beginPath(); ctx.arc(q[0], q[1], 10 - i, 0, 7); ctx.fillStyle = C.cyan; ctx.fill(); } ctx.restore();
        K.gum(x, y, 1.25, a);
      } });
    cue(st, 'whoosh'); cue(st + 0.1, 'slide', { dur: L(7) - st - 0.2, gain: 0.6 });
  }

  // ── 8 · a few days, and it's out ────────────────────────────────────────
  {
    const st = cut(7), out = Wd('out', 7) - st - 0.1, shrink = Math.max(0.6, out - 0.45);
    add({ id: 'S08', at: st, cam: [540, 760], note: 'stopwatch spins DAY 1-3, gum zips out on "out"',
      draw(lt) {
        ctx.fillStyle = C.bg; ctx.fillRect(-300, -300, W + 600, H + 600);
        const k = eio(seg(lt, shrink, shrink + 0.35));
        K.stopwatch(lerp(540, 250, k), lerp(720, 560, k), lerp(1, 0.55, k), lt * 14);
        const day = Math.min(3, 1 + Math.floor(lt / (shrink / 3)));
        K.pill('DAY ' + day, lerp(540, 250, k), lerp(1130, 820, k), lerp(70, 48, k), C.ink, C.white, lt < 0.25 ? eob(seg(lt, 0, 0.25)) : 1);
        if (lt > out) { const p = seg(lt, out, out + 0.75), gx = lerp(380, 1300, eio(p)); K.gum(gx, 1010, 2.2, 0, 1.25, 0.85); K.speedLines(gx - 60, 1010, 1 - p * 0.6); }
      } });
    cue(st, 'whoosh'); for (let i = 1; i < 3; i++) cue(st + i * shrink / 3, 'tock'); cue(st + out, 'zip');
  }

  // ── 9 · swallow tons? (gums pile up) ────────────────────────────────────
  {
    const st = cut(8), d0 = cut(9) - st;
    add({ id: 'S09', at: st, cam: [540, 820], note: 'many gums rain into the x-ray stomach',
      draw(lt, d, t) {
        K.xray(t);
        const top = K.stomachTop(560, 780, 3.0);
        ctx.strokeStyle = C.pink; ctx.lineWidth = 70; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(top[0] + 10, -100); ctx.lineTo(top[0], top[1] + 30); ctx.stroke();
        K.stomach(560, 780, 3.0);
        const step = Math.min(0.08, (d0 - 0.6) / 14);
        for (let i = 0; i < 14; i++) {
          const p = seg(lt, i * step, i * step + 0.45); if (p <= 0) continue;
          const tx = 470 + (rnd(i) - 0.5) * 260 + (i > 7 ? 40 : 0), ty = 990 - Math.floor(i / 5) * 55 - rnd(i + 3) * 20;
          K.gum(lerp(470, tx, eo(p)), lerp(-80, ty, eob(p)), 1.1, rnd(i + 7) * 3 + p);
        }
      } });
    const step = Math.min(0.08, (d0 - 0.6) / 14);
    cue(st, 'whoosh'); for (let i = 0; i < 14; i += 2) cue(st + i * step + 0.4, 'plop', { gain: 0.5 });
  }

  // ── 10 · bigger problem: blockage ───────────────────────────────────────
  {
    const st = cut(9), warn = Wd('block', 9) - st - 0.1;
    add({ id: 'S10', at: st, cam: [540, 820], note: 'gum clump blocks the gut, warning pulses',
      draw(lt, d, t) {
        K.xray(t); K.gutTube(820, t);
        for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(120 + i * 24 + Math.sin(t * 3 + i) * 4, 760 + rnd(i) * 120, 16 + rnd(i + 2) * 10, 0, 7); ctx.fillStyle = C.yellow; ctx.fill(); }
        const pr = Math.sin(lt * 7) * 0.5 + 0.5;
        ctx.beginPath(); ctx.arc(560, 820, 190 + pr * 30, 0, 7); ctx.strokeStyle = C.red; ctx.globalAlpha = 0.35 + 0.5 * pr; ctx.lineWidth = 18; ctx.stroke(); ctx.globalAlpha = 1;
        for (let i = 0; i < 7; i++) { const an = i / 7 * Math.PI * 2; K.gum(560 + Math.cos(an) * 60 + Math.sin(t * 20 + i) * 3, 820 + Math.sin(an) * 50, 1.25, an); }
        K.gum(560, 820, 1.3, 0.4);
        K.warning(560, 450, lt > warn ? eob(seg(lt, warn, warn + 0.3)) * (1 + pr * 0.06) : 0);
      } });
    cue(st, 'whoosh'); cue(st + warn, 'alarm', { dur: cut(10) - st - warn });
  }

  // ── 11 · so maybe… spit it out ──────────────────────────────────────────
  {
    const st = cut(10), spit = Wd('spit', 10) - st;
    add({ id: 'S11', at: st, cam: [540, 760], note: 'hero wags his finger at camera',
      draw(lt) {
        K.room();
        const p = eio(seg(lt, 0, 0.5));
        K.man({ x: 540, y: 1290, s: 2.0, arm: K.armPose(K.ARM.down, K.ARM.point, p), finger: lt > 0.35 ? Math.sin(lt * 11) * 0.35 : 0, mouth: lt > spit ? 'grin' : 'smirk', brow: 0.3, smirk: true });
      } });
    cue(st, 'whoosh'); cue(st + spit, 'pop', { gain: 0.6 });
  }

  return { shots: S, cues: CUES };
}

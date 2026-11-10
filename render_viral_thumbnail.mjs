#!/usr/bin/env node
/**
 * Dedicated Viral Click-Hook Thumbnail Generator for Aviday (@aviday_666_)
 * Usage:
 *   node render_viral_thumbnail.mjs <project_dir> <out_jpg> <style> <badge_text> <hook_line1> <hook_line2> [hero_time_sec]
 *
 * Renders the 3D/2D hero frame at `hero_time_sec` (default 3.2s) WITHOUT mid-sentence subtitles,
 * then composites a high-CTR Reels/YouTube Shorts style viral hook cover inside the 1:1/4:5 center safe zone
 * so it looks incredible on both the Instagram Profile Grid and the Reels Feed.
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [projDirArg, outJpgArg, style = 'deep-dive', badgeText = 'WHAT HAPPENS IF...', hookLine1 = 'HOLD YOUR BREATH', hookLine2 = 'TOO LONG?!', heroTimeArg = '3.2'] = process.argv.slice(2);
if (!projDirArg || !outJpgArg) {
  console.error('Usage: node render_viral_thumbnail.mjs <proj_dir> <out_jpg> <style> <badge> <line1> <line2> [time_sec]');
  process.exit(1);
}

const ROOT = path.resolve(projDirArg);
const OUT_JPG = path.resolve(outJpgArg);
const HERO_TIME = parseFloat(heroTimeArg) || 3.2;

const CHROME = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].find((p) => p && fs.existsSync(p));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.otf': 'font/otf', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.wav': 'audio/wav', '.png': 'image/png', '.jpg': 'image/jpeg'
};

function serve(port = 0) {
  return new Promise((res) => {
    const srv = http.createServer((req, r) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      const f = path.join(ROOT, u === '/' ? 'index.html' : u);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
        r.writeHead(404);
        r.end();
        return;
      }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(r);
    });
    srv.listen(port, '127.0.0.1', () => res(srv));
  });
}

const srv = await serve(0);
const port = srv.address().port;
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-thumb-'));
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${prof}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--window-size=1080,1920',
    '--ignore-gpu-blocklist',
    '--enable-unsafe-swiftshader',
    ...(process.env.SOFTWARE_GL ? ['--use-angle=swiftshader'] : []),
    ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []),
    'about:blank'
  ],
  { stdio: 'ignore' }
);

try {
  let dbg;
  for (let i = 0; i < 200 && !dbg; i++) {
    try {
      dbg = fs.readFileSync(path.join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim();
    } catch {
      await sleep(100);
    }
  }
  const r = await fetch(`http://127.0.0.1:${dbg}/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/index.html?capture=1`)}`, { method: 'PUT' });
  const target = await r.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pend = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) {
      const p = pend.get(m.id);
      pend.delete(m.id);
      m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
    }
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id;
    pend.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (expr) => {
    const x = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (x.exceptionDetails) throw new Error(x.exceptionDetails.exception?.description || x.exceptionDetails.text);
    return x.result.value;
  };
  await send('Runtime.enable');
  for (let i = 0; i < 600; i++) {
    const st = await ev('window.OP ? OP.ready : false').catch(() => false);
    if (st === true) break;
    await sleep(100);
  }

  const expr = `(() => {
    const style = ${JSON.stringify(style)};
    const badge = ${JSON.stringify(badgeText.toUpperCase())};
    const line1 = ${JSON.stringify(hookLine1.toUpperCase())};
    const line2 = ${JSON.stringify(hookLine2.toUpperCase())};
    const t = ${HERO_TIME};

    // Draw hero frame at time t
    const cv = document.getElementById('cv');
    const gl = document.getElementById('gl');
    const ctx = cv.getContext('2d');

    if (gl && gl.width > 0) {
      OP.draw(t);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(gl, 0, 0, 1080, 1920);
    } else if (Array.isArray(OP._shots) && OP._shots.length > 0) {
      // 2D style (e.g. stick-story): render the shot directly without drawCaption(t)
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 1080, 1920);
      const S = OP._shots;
      let i = S.length - 1;
      while (i > 0 && S[i].at > t) i--;
      const sh = S[i];
      const dur = OP.duration ? OP.duration() : 35;
      const end = i < S.length - 1 ? S[i + 1].at : dur;
      const d = Math.max(0.01, end - sh.at);
      const lt = Math.max(0, t - sh.at);
      ctx.save();
      sh.draw(lt, d, t);
      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
    } else {
      OP.draw(t);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // 1. Cinematic dark gradient overlays (top, bottom, and subtle radial vignette for text legibility)
    const grad = ctx.createLinearGradient(0, 0, 0, 1920);
    grad.addColorStop(0.0, 'rgba(0,0,0,0.65)');
    grad.addColorStop(0.35, 'rgba(0,0,0,0.12)');
    grad.addColorStop(0.62, 'rgba(0,0,0,0.35)');
    grad.addColorStop(0.82, 'rgba(0,0,0,0.82)');
    grad.addColorStop(1.0, 'rgba(0,0,0,0.92)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Theme palette per category
    const palettes = {
      'deep-dive':   { accent: '#FFD43B', badgeBg: '#E03131', badgeFg: '#FFFFFF', boxText: '#0B0C10' },
      'night-file':  { accent: '#FF3B3B', badgeBg: '#1A1B1E', badgeFg: '#FF6B6B', boxText: '#FFFFFF' },
      'stick-story': { accent: '#FF922B', badgeBg: '#D9480F', badgeFg: '#FFFFFF', boxText: '#FFFFFF' },
      'tall-tale':   { accent: '#51CF66', badgeBg: '#2B8A3E', badgeFg: '#FFFFFF', boxText: '#0B0C10' }
    };
    const pal = palettes[style] || palettes['deep-dive'];

    // Helper for rounded rect
    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    // 2. Top Category Pill Badge (Placed at Y=500 so it stays inside the 1:1 & 4:5 Instagram Profile Grid crop!)
    ctx.font = '900 38px Inter, Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const bw = Math.min(920, ctx.measureText(badge).width + 88);
    const bh = 76;
    const bx = (1080 - bw) / 2;
    const by = 470;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    roundRect(bx, by, bw, bh, 38);
    ctx.fillStyle = pal.badgeBg;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = pal.accent;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = pal.badgeFg;
    ctx.fillText(badge, 540, by + bh / 2 + 2);

    // 3. Auto-fit Hook Line 1 (White Ultra-Bold with Heavy Black Stroke at Y=1180, inside Profile Grid Safe Zone!)
    function fitFontSize(text, maxW, startPx) {
      let sz = startPx;
      while (sz > 54) {
        ctx.font = '900 ' + sz + 'px Inter, Impact, sans-serif';
        if (ctx.measureText(text).width <= maxW) break;
        sz -= 4;
      }
      return sz;
    }

    const sz1 = fitFontSize(line1, 960, 108);
    ctx.font = '900 ' + sz1 + 'px Inter, Impact, sans-serif';
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 10;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 22;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(line1, 540, 1175);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(line1, 540, 1175);
    ctx.restore();

    // 4. Hook Line 2 inside High-Contrast Tilted Highlight Box (at Y=1315, inside Profile Grid Safe Zone!)
    const sz2 = fitFontSize(line2, 900, 112);
    ctx.font = '900 ' + sz2 + 'px Inter, Impact, sans-serif';
    const tw2 = ctx.measureText(line2).width;
    const padX = 48;
    const boxW = Math.min(980, tw2 + padX * 2);
    const boxH = sz2 + 44;
    const boxY = 1320;

    ctx.save();
    ctx.translate(540, boxY);
    ctx.rotate(-0.022);
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 12;
    roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 22);
    ctx.fillStyle = pal.accent;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    if (pal.boxText === '#FFFFFF') {
      ctx.lineJoin = 'round';
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(line2, 0, 4);
    }
    ctx.fillStyle = pal.boxText;
    ctx.fillText(line2, 0, 4);
    ctx.restore();

    return cv.toDataURL('image/jpeg', 0.95);
  })()`;

  const dataUrl = await ev(expr);
  const jpgBuf = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
  fs.mkdirSync(path.dirname(OUT_JPG), { recursive: true });
  fs.writeFileSync(OUT_JPG, jpgBuf);
  console.log(`✅ Viral thumbnail saved: ${OUT_JPG} (${(jpgBuf.length / 1024).toFixed(1)} KB)`);
  ws.close();
} finally {
  chrome.kill('SIGKILL');
  srv.close();
  setTimeout(() => {
    try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
  }, 300);
}

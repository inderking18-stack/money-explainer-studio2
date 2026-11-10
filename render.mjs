import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';

// usage: node render.mjs <scene.html> <seconds> <fps> [audio file]
const [scene, duration = '10', fps = '30', audio] = process.argv.slice(2);
const d = Number(duration);
const f = Number(fps);
const n = Math.round(d * f);

rmSync('frames', { recursive: true, force: true });
mkdirSync('frames');
mkdirSync('out', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('file://' + path.resolve(scene));

for (let i = 0; i < n; i++) {
  await page.evaluate((t) => window.renderAt(t), i / f);
  await page.screenshot({ path: `frames/f${String(i).padStart(5, '0')}.png` });
}
await browser.close();

const args = ['-y', '-framerate', String(f), '-i', 'frames/f%05d.png'];
if (audio) args.push('-i', audio, '-shortest');
args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p');
if (audio) args.push('-c:a', 'aac');
args.push('out/video.mp4');

const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
process.exit(r.status ?? 1);

// Renders the app icon and splash PNGs in assets/ from the SVG sources in scripts/art/ (extracted from the
// "LeadMate Design System" board 'Splash, icon, account, rusty'). Run: node scripts/render-icons.mjs
// Also checks that the adaptive foreground keeps every opaque pixel inside the central 66 percent (round-mask safe zone).
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const SIZE = 1024;
const SAFE_RADIUS = (SIZE * 0.66) / 2;
const read = (name) => readFileSync(`scripts/art/${name}.svg`, 'utf8');
/** Place an SVG at `scale` with the artwork's own centre `at` on the canvas centre. */
const placed = (svg, scale, at) => {
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const t = `translate(${SIZE / 2 - at[0] * scale} ${SIZE / 2 - at[1] * scale}) scale(${scale})`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}"><g transform="${t}">${inner}</g></svg>`;
};
// the dog's head, collar and leash span x 46..172, y 34..186 in the 200 unit art
const CENTRE = [109, 110];
const FOREGROUND_SCALE = 3.2;

const jobs = [
  { out: 'assets/icon.png', size: SIZE, svg: read('app-icon'), opaque: true },
  { out: 'assets/favicon.png', size: 48, svg: read('app-icon'), opaque: true },
  { out: 'assets/splash-icon.png', size: 512, svg: read('splash-icon') },
  { out: 'assets/android-icon-background.png', size: SIZE, svg: read('icon-background'), opaque: true },
  { out: 'assets/android-icon-foreground.png', size: SIZE, svg: placed(read('icon-foreground'), FOREGROUND_SCALE, CENTRE), safe: true },
  { out: 'assets/android-icon-monochrome.png', size: SIZE, svg: placed(read('icon-monochrome'), FOREGROUND_SCALE, CENTRE), safe: true },
];

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await browser.newPage();
let failed = false;
for (const job of jobs) {
  await page.setViewportSize({ width: job.size, height: job.size });
  const body = job.svg.replace(/<svg([^>]*)>/, (_m, attrs) => `<svg${attrs.replace(/\swidth="[^"]*"|\sheight="[^"]*"/g, '')} width="${job.size}" height="${job.size}">`);
  await page.setContent(`<html><body style="margin:0;background:transparent">${body}</body></html>`);
  const png = await page.screenshot({ omitBackground: !job.opaque, clip: { x: 0, y: 0, width: job.size, height: job.size } });
  writeFileSync(job.out, png);
  if (job.safe) {
    // count opaque pixels outside the safe circle, via a canvas read-back of the same PNG
    const outside = await page.evaluate(async ([b64, size, radius]) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, size, size).data;
      let n = 0;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (data[(y * size + x) * 4 + 3] > 8 && Math.hypot(x - size / 2, y - size / 2) > radius) n++;
      return n;
    }, [png.toString('base64'), job.size, SAFE_RADIUS]);
    console.log(`${job.out}: ${outside} opaque pixels outside the central 66 percent circle`);
    if (outside > 0) failed = true;
  } else console.log(`wrote ${job.out}`);
}
await browser.close();
if (failed) {
  console.error('foreground leaves the safe zone: lower FOREGROUND_SCALE');
  process.exit(1);
}

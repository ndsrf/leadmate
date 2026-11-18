// Contact sheet of the nine Read the Dog Body Signals on chosen breeds and coats, drawn by the real BreedArt at the 320-point
// scene width, for add-read-the-dog-game 3.4 (small breeds, a large breed, light and dark coats).
// Run: node scripts/shot-rtd-art.mjs <out.png> [breeds=chihuahua,yorkshire,labrador] [coats=golden,black]
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const [out, breeds = 'chihuahua,yorkshire,labrador', coats = 'golden,black'] = process.argv.slice(2);
if (!out) {
  console.error('usage: shot-rtd-art.mjs <out.png> [breeds] [coats]');
  process.exit(1);
}
const html = join(mkdtempSync(join(tmpdir(), 'rtd-sheet-')), 'sheet.html');
execFileSync('npx', ['jest', 'rtdArtSheet'], { stdio: 'inherit', env: { ...process.env, RTD_SHEET: html, RTD_BREEDS: breeds, RTD_COATS: coats } });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await browser.newPage({ viewport: { width: 1020, height: 600 } });
await page.goto(`file://${html}`);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`wrote ${out}`);

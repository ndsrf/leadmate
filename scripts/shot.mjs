// Usage: node scripts/shot.mjs <url> <out.png> [width] [height]
// Opens a page in headless Chrome, prints console errors and saves a screenshot.
import { chromium } from 'playwright-core';

const [url, out, w = '1000', h = '600'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && console.log('console.' + m.type(), m.text()));
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(url);
await page.waitForTimeout(1500);
const canvas = await page.evaluate(() => { const c = document.querySelector('canvas'); return c ? [c.width, c.height] : null; });
console.log('canvas', canvas);
await page.screenshot({ path: out });
await browser.close();

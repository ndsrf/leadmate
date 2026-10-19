// Usage: node scripts/shot-frame.mjs <url> <out.png>  — also reports whether the first iframe holds a canvas.
import { chromium } from 'playwright-core';

const [url, out] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(url);
await page.waitForTimeout(6000);
const frame = page.frames().find((f) => f !== page.mainFrame());
console.log('iframe url', frame?.url(), 'canvas', frame ? await frame.evaluate(() => !!document.querySelector('canvas')) : null);
await page.screenshot({ path: out });
await browser.close();

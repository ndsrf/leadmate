// A contact sheet of PNG illustrations (each at full size and at 320 points, the narrowest phone), for review in one pass.
// Run: node scripts/art-contact-sheet.mjs <out.png> <file.png> [file.png ...]
import { readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const [out, ...files] = process.argv.slice(2);
if (!out || files.length === 0) {
  console.error('usage: art-contact-sheet.mjs <out.png> <file.png> ...');
  process.exit(1);
}
const card = (f) => {
  const src = `data:image/png;base64,${readFileSync(f).toString('base64')}`;
  const label = `${basename(dirname(dirname(f)))}/${basename(f)}`;
  return `<div class="c"><div class="n">${label}</div><div class="r"><img width="480" src="${src}"><img width="320" src="${src}"></div></div>`;
};
const html = `<html><body style="margin:16px;background:#F6EFE0;font:13px monospace;color:#1E2A3A"><style>.c{margin:0 0 14px;padding:10px;background:#FFFBF1;border:2px solid #1E2A3A;border-radius:12px;width:850px}.r{display:flex;gap:14px;align-items:flex-start}img{border:1px solid #D8CFB8;border-radius:6px}.n{font-weight:600;margin-bottom:6px}</style>${files.map((f) => card(resolve(f))).join('')}</body></html>`;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
await page.setContent(html);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`wrote ${out}`);

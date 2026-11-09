import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { createTranslator, en, es, type TextKey } from './index';

const ROOT = join(__dirname, '..', '..');

function sources(dir: string, exts: string[]): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === 'node_modules' || name === 'dist' || name === 'assets') return [];
    if (statSync(path).isDirectory()) return sources(path, exts);
    return exts.some((e) => name.endsWith(e)) && !name.endsWith('.test.ts') && !name.endsWith('.test.tsx') && !name.endsWith('.d.ts') ? [path] : [];
  });
}

const UI_FILES = [...sources(join(ROOT, 'bundle'), ['.ts']), ...sources(join(ROOT, 'src', 'shell'), ['.tsx']), join(ROOT, 'App.tsx')];

describe('user-visible text comes from the catalog', () => {
  it('finds the UI source files', () => {
    expect(UI_FILES.length).toBeGreaterThan(3);
  });

  it.each(UI_FILES.map((f) => [f.slice(ROOT.length + 1), f]))('%s has no literal text', (_name, file) => {
    const code = readFileSync(file, 'utf8');
    const offenders: string[] = [];

    // Phaser text objects and setText with a string literal
    for (const m of code.matchAll(/\.text\(\s*[^,]+,\s*[^,]+,\s*(['"`])([^'"`]*)\1/g)) if (/[\p{L}]/u.test(m[2])) offenders.push(m[0]);
    for (const m of code.matchAll(/setText\(\s*(['"`])([^'"`]*)\1/g)) if (/[\p{L}]/u.test(m[2])) offenders.push(m[0]);
    // text between JSX tags that is not an expression
    for (const m of code.matchAll(/>\s*([^<>{}\n]*[\p{L}][^<>{}\n]*)\s*</gu)) {
      if (!/=>|=\s|\bas\b|[;(){}]/.test(m[1]) && file.endsWith('.tsx')) offenders.push(m[1].trim());
    }
    // text-bearing props with literal strings
    for (const m of code.matchAll(/(?:label|title|placeholder|accessibilityLabel)=(['"])([^'"]*)\1/g)) offenders.push(m[0]);
    // innerHTML-style strings in the overlay helper
    for (const m of code.matchAll(/textContent\s*=\s*(['"`])([^'"`$]*)\1/g)) if (/[\p{L}]{3,}/u.test(m[2]) && !m[2].includes('{')) offenders.push(m[0]);

    expect(offenders).toEqual([]);
  });

  it('catches a literal when one slips in', () => {
    const bad = `this.add.text(0, 0, 'Hello', {})`;
    expect(/\.text\(\s*[^,]+,\s*[^,]+,\s*(['"`])([^'"`]*)\1/.test(bad)).toBe(true);
  });
});

describe('English catalog completeness', () => {
  it('has every key in es.ts present in en.ts with non-empty text', () => {
    const esKeys = Object.keys(es) as TextKey[];
    const enKeys = new Set(Object.keys(en) as TextKey[]);
    for (const key of esKeys) {
      expect(enKeys.has(key)).toBe(true);
      expect(typeof en[key]).toBe('string');
      expect(en[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('translator with en never returns a raw key or empty string for valid keys', () => {
    const tEn = createTranslator(en);
    for (const key of Object.keys(es) as TextKey[]) {
      const result = tEn(key);
      expect(result).not.toBe(key);
      expect(result.trim().length).toBeGreaterThan(0);
    }
  });
});

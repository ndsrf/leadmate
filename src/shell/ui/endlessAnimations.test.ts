import * as fs from 'fs';
import * as path from 'path';
import { ENDLESS_ALLOWLIST } from './endlessAnimations.allowlist';
import { countEndless, type EndlessCounts, type EndlessKind } from './endlessAnimations';

const ROOT = path.resolve(__dirname, '../../..');
const KINDS: EndlessKind[] = ['withRepeat', 'Animated.loop', 'setInterval', 'css-infinite'];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') out.push(...sourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.(test|generated)\.|\.d\.ts$|allowlist|endlessAnimations\.ts$/.test(entry.name)) out.push(full);
  }
  return out;
}

function scan(): Map<string, EndlessCounts> {
  const found = new Map<string, EndlessCounts>();
  for (const file of [...sourceFiles(path.join(ROOT, 'src')), ...sourceFiles(path.join(ROOT, 'bundle'))]) {
    const counts = countEndless(fs.readFileSync(file, 'utf8'));
    if (KINDS.some((k) => counts[k] > 0)) found.set(path.relative(ROOT, file).split(path.sep).join('/'), counts);
  }
  return found;
}

describe('countEndless', () => {
  it('counts an endless repeat but not a bounded one', () => {
    expect(countEndless('x = withRepeat(withTiming(1), -1, false);').withRepeat).toBe(1);
    expect(countEndless('x = withRepeat(withSequence(withTiming(-5, {d:1}), withTiming(0)), -1, true);').withRepeat).toBe(1);
    expect(countEndless('x = withRepeat(withTiming(1), 3, false);').withRepeat).toBe(0);
    expect(countEndless('x = withRepeat(withTiming(1), Infinity);').withRepeat).toBe(1);
  });

  it('counts loops, timers and infinite CSS animations, not comments', () => {
    const c = countEndless('Animated.loop(a); setInterval(f, 1);\n// setInterval(g)\nconst s = `.x{animation:k 1s ease infinite}`;');
    expect(c).toEqual({ withRepeat: 0, 'Animated.loop': 1, setInterval: 1, 'css-infinite': 1 });
  });
});

describe('endless animation guardrail', () => {
  it('has a reason for every allow-list entry', () => {
    for (const e of ENDLESS_ALLOWLIST) expect(e.reason.trim().length).toBeGreaterThan(10);
  });

  it('allows exactly the listed endless animations and timers', () => {
    const allowed = new Map<string, number>();
    for (const e of ENDLESS_ALLOWLIST) allowed.set(`${e.file}|${e.kind}`, (allowed.get(`${e.file}|${e.kind}`) ?? 0) + e.count);
    const problems: string[] = [];
    for (const [file, counts] of scan()) {
      for (const k of KINDS) {
        const have = counts[k];
        const want = allowed.get(`${file}|${k}`) ?? 0;
        if (have > want) problems.push(`${file}: ${have} ${k}, ${want} allowed — gate it and add it to endlessAnimations.allowlist.ts with a reason`);
        allowed.delete(`${file}|${k}`);
      }
    }
    for (const [key, n] of allowed) problems.push(`${key}: allow-list says ${n} but none found — remove the stale entry`);
    expect(problems).toEqual([]);
  });
});

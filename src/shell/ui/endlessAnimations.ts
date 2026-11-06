/**
 * Finds endless animations and repeating timers in source text, for the guardrail test. An endless animation here is
 * a `withRepeat(..., -1)` (or `Infinity`), an `Animated.loop`, a `setInterval`, or an `infinite` CSS animation.
 */
export type EndlessKind = 'withRepeat' | 'Animated.loop' | 'setInterval' | 'css-infinite';

export interface EndlessCounts {
  withRepeat: number;
  'Animated.loop': number;
  setInterval: number;
  'css-infinite': number;
}

/** Text of the call starting at `open` (the index of its "("), up to the matching ")". */
function callText(source: string, open: number): string {
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '(') depth++;
    else if (source[i] === ')' && --depth === 0) return source.slice(open, i + 1);
  }
  return source.slice(open);
}

export function countEndless(source: string): EndlessCounts {
  const counts: EndlessCounts = { withRepeat: 0, 'Animated.loop': 0, setInterval: 0, 'css-infinite': 0 };
  // line comments do not count
  const code = source.replace(/^\s*(\/\/|\*|\/\*).*$/gm, '');
  for (const m of code.matchAll(/\bwithRepeat\(/g)) {
    if (/,\s*(-1|Infinity)\s*[,)]/.test(callText(code, m.index! + m[0].length - 1))) counts.withRepeat++;
  }
  counts['Animated.loop'] = (code.match(/\bAnimated\.loop\(/g) ?? []).length;
  counts.setInterval = (code.match(/\bsetInterval\(/g) ?? []).length;
  counts['css-infinite'] = (code.match(/animation:[^;}`]*\binfinite\b/g) ?? []).length;
  return counts;
}

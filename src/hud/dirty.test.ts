import { createChangeDetector, quantize } from './dirty';

describe('createChangeDetector', () => {
  it('reports the first key and any different key, not a repeat', () => {
    const d = createChangeDetector();
    expect(d.changed('a')).toBe(true);
    expect(d.changed('a')).toBe(false);
    expect(d.changed('b')).toBe(true);
    expect(d.changed('b')).toBe(false);
    expect(d.changed('a')).toBe(true);
  });

  it('reports a change again after a reset', () => {
    const d = createChangeDetector();
    d.changed('a');
    d.reset();
    expect(d.changed('a')).toBe(true);
  });

  it('tells apart number keys that differ in the last digit', () => {
    const d = createChangeDetector();
    expect(d.changed(`${0.1 + 0.2},1`)).toBe(true);
    expect(d.changed(`${0.3},1`)).toBe(true);
  });
});

describe('quantize', () => {
  it('keeps a countdown ring key unchanged between visible steps', () => {
    const d = createChangeDetector();
    // a 6 s Go Sniff offer drawn at 30 frames/s: 180 frames, the key changes once per 1/48 of the ring
    let redraws = 0;
    for (let frame = 0; frame <= 180; frame++) if (d.changed(String(quantize(1 - frame / 180)))) redraws++;
    expect(redraws).toBe(49);
  });

  it('maps the ends of the range to 0 and the step count', () => {
    expect(quantize(0)).toBe(0);
    expect(quantize(1)).toBe(48);
    expect(quantize(0.5, 10)).toBe(5);
  });
});

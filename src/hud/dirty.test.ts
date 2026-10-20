import { createChangeDetector } from './dirty';

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

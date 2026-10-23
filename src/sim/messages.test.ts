import { createSignalGate } from './messages';

describe('signal gate', () => {
  it('lets each signal through once per Stage', () => {
    const gate = createSignalGate();
    expect(gate('dog-approaching')).toBe(true);
    expect(gate('dog-approaching')).toBe(false);
    expect(gate('first-taut')).toBe(true);
  });

  it('lets control-used through once per control', () => {
    const gate = createSignalGate();
    expect(gate('control-used', 'move')).toBe(true);
    expect(gate('control-used', 'move')).toBe(false);
    expect(gate('control-used', 'mark')).toBe(true);
    expect(gate('control-used', 'mark')).toBe(false);
  });

  it('starts fresh for a new Stage', () => {
    expect(createSignalGate()('control-used', 'move')).toBe(true);
  });
});

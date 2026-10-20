import { createVocalizer, type DogSound } from './vocalize';

function setup() {
  let clock = 0;
  const played: DogSound[] = [];
  const vocalizer = createVocalizer((s) => played.push(s), () => clock);
  return { vocalizer, played, at: (ms: number) => (clock = ms) };
}

describe('dog vocalizations', () => {
  it('is silent when the Dog calms down', () => {
    const { vocalizer, played } = setup();
    expect(vocalizer.onTier('calm')).toBeNull();
    expect(played).toEqual([]);
  });

  it('whines or growls on Alert and barks on Reactive', () => {
    const { vocalizer, played, at } = setup();
    at(0);
    expect(['whine', 'growl']).toContain(vocalizer.onTier('alert'));
    at(100);
    expect(vocalizer.onTier('reactive')).toBe('bark');
    expect(played).toHaveLength(2);
    expect(played[1]).toBe('bark');
  });

  it('does not repeat the same tier within 2.0 s', () => {
    const { vocalizer, played, at } = setup();
    at(1000);
    vocalizer.onTier('reactive');
    at(2900);
    expect(vocalizer.onTier('reactive')).toBeNull();
    expect(played).toHaveLength(1);
  });

  it('repeats the same tier once 2.0 s have passed', () => {
    const { vocalizer, played, at } = setup();
    at(1000);
    vocalizer.onTier('reactive');
    at(3000);
    expect(vocalizer.onTier('reactive')).toBe('bark');
    expect(played).toHaveLength(2);
  });

  it('keeps a separate cooldown for each tier', () => {
    const { vocalizer, at } = setup();
    at(0);
    vocalizer.onTier('alert');
    at(500);
    expect(vocalizer.onTier('reactive')).toBe('bark'); // Reactive is not held back by the Alert sound
  });

  it('alternates the Alert whine and growl', () => {
    const { vocalizer, at } = setup();
    at(0);
    const first = vocalizer.onTier('alert');
    at(2500);
    const second = vocalizer.onTier('alert');
    expect(first).not.toBe(second);
  });

  it('survives a sound that cannot play', () => {
    const v = createVocalizer(() => {
      throw new Error('no audio device');
    });
    expect(() => v.onTier('reactive')).not.toThrow();
  });
});

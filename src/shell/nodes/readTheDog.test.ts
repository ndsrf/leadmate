import { SIGNALS, RtdClass, RtdSignal } from './readTheDog';

describe('readTheDog - 1.1 signal table', () => {
  it('defines exactly nine signals matching design Decision 2', () => {
    const keys = Object.keys(SIGNALS) as RtdSignal[];
    expect(keys).toHaveLength(9);
    expect(SIGNALS).toEqual({
      soft_loose: { cls: 'calm', subtle: false },
      play_bow: { cls: 'calm', subtle: false },
      loose_wag: { cls: 'calm', subtle: true },
      ears_up_still: { cls: 'alert', subtle: false },
      lip_lick: { cls: 'alert', subtle: true },
      whale_eye: { cls: 'alert', subtle: true },
      freeze_stare: { cls: 'about_to_react', subtle: false },
      hackles_up: { cls: 'about_to_react', subtle: false },
      stiff_closed_mouth: { cls: 'about_to_react', subtle: true },
    });
  });

  it('ensures every class has at least one obvious signal', () => {
    const classes: RtdClass[] = ['calm', 'alert', 'about_to_react'];
    for (const cls of classes) {
      const obvious = Object.values(SIGNALS).filter(
        (s) => s.cls === cls && !s.subtle,
      );
      expect(obvious.length).toBeGreaterThanOrEqual(1);
    }
  });
});

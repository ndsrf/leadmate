import { createSignalGate, DOG_SIGNS, type DogSign, type StageSignal } from '../sim/messages';
import { dogSignsShown, createDogSignTracker, type DogSignsShown } from './dogSigns';
import { defaultScenario } from '../sim/config';
import { createState } from '../sim/sim';

const shown = (...signs: DogSign[]): DogSignsShown => ({ fixation: false, signs: new Set(signs) });

/** A fake scene: the tracker's calls go through the same gate StageScene uses. */
function fakeScene() {
  const gate = createSignalGate();
  const sent: string[] = [];
  const track = createDogSignTracker((signal: StageSignal & ('dog-sign' | 'dog-sign-gone'), sign) => {
    if (gate(signal, sign)) sent.push(`${signal}:${sign}`);
  });
  return { sent, track };
}

describe('dog sign signals', () => {
  it('shows each signal once per Stage, however often the sign comes and goes', () => {
    const { sent, track } = fakeScene();
    track(shown());
    track(shown('eye'));
    track(shown('eye'));
    track(shown());
    track(shown('eye', 'alert'));
    track(shown('alert'));
    expect(sent).toEqual(['dog-sign:eye', 'dog-sign-gone:eye', 'dog-sign:alert']);
  });

  it('knows every Dog sign', () => {
    const { sent, track } = fakeScene();
    track(shown(...DOG_SIGNS));
    expect(sent).toHaveLength(DOG_SIGNS.length);
  });

  it('shows nothing for a calm Dog at the start', () => {
    const s = dogSignsShown(createState(1, defaultScenario));
    expect(s.fixation).toBe(false);
    expect([...s.signs]).toEqual([]);
  });
});

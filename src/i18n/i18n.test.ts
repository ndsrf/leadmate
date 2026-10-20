import { createTranslator, es, t, type TextKey } from './index';

describe('text catalog', () => {
  it('looks up Spanish text', () => {
    expect(t('results.playAgain')).toBe('Jugar de nuevo');
  });

  it('uses the selected language when it has the key', () => {
    const tr = createTranslator({ 'results.playAgain': 'Play again' });
    expect(tr('results.playAgain')).toBe('Play again');
  });

  it('falls back to Spanish when the language lacks a key', () => {
    const tr = createTranslator({ 'results.playAgain': 'Play again' });
    expect(tr('pause.resume')).toBe(es['pause.resume']);
  });

  it('never returns a raw key', () => {
    const tr = createTranslator({});
    for (const key of Object.keys(es) as TextKey[]) {
      const value = tr(key);
      expect(value).not.toBe(key);
      expect(value).not.toBe('');
    }
    expect(tr('not.a.key' as TextKey)).toBe('');
  });

  it('has the Debrief wording for harsh stops, the Equipment trade-off and the peak Arousal', () => {
    const t = createTranslator({});
    expect(t('results.harshStopNote')).toMatch(/brusca/);
    expect(t('results.equipmentNote')).toMatch(/compromiso/);
    expect(t('results.equipmentNote')).not.toMatch(/incorrect|mal\b/);
    expect(t('results.peakArousal')).toBe('Cuánto se alteró tu perro');
    for (const answer of ['correct', 'wrong', 'missed'] as const) expect(t(`results.checkpoint.${answer}`)).not.toBe('');
  });
});

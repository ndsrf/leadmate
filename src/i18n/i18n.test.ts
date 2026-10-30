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
    expect(t('results.checkpoint.score').replace('{n}', '2').replace('{total}', '3')).toBe('Preguntas: 2 de 3');
    for (const key of ['results.checkpoint.answer', 'results.checkpoint.missed', 'node.checkpoint.progress'] as const) expect(t(key)).not.toBe('');
  });
});

describe('Primer and media text', () => {
  it('has the section badges, guide button and in-app browser strings', () => {
    const t = createTranslator({});
    for (const key of ['primer.kind.real-world', 'primer.kind.virtual-dog', 'primer.openGuide', 'browser.title', 'browser.close', 'browser.retry', 'browser.offline', 'media.pending', 'media.unavailable'] as const) {
      expect(t(key)).not.toBe('');
    }
  });
});

describe('Barkdoku name', () => {
  it('is Guaudoku in Spanish and never Zona de Calma', () => {
    expect(es['minigame.barkdoku.title']).toBe('Guaudoku');
    expect(es['map.barkdoku.daily']).toBe('Guaudoku');
    expect(es['minigame.barkdoku.solvedTitle']).toBe('¡Guaudoku resuelto!');
    for (const value of Object.values(es)) expect(value).not.toMatch(/zona de calma/i);
  });
});

describe('texts that name the Dog', () => {
  // the user's Dog may be male or female and the app does not ask: a text that names it (`{name}`) uses no word that
  // agrees with the Dog's gender, and never quotes the name as something said (it reads «tu perro» for a Dog with no
  // name). Words agreeing with an object ("el arnés", "el pan") are fine, so only words that only fit a Dog are listed.
  const GENDERED = /(?<!\p{L})(él|sentado|tumbado|echado|pegado|parado|tranquilo|relajado|tenso|nervioso|contento|distraído|excitado|alterado|emocionado|lanzado|cansado|asustado|enganchado|calmado|disparado)s?(?!\p{L})/iu;
  const named = (Object.keys(es) as TextKey[]).filter((key) => es[key].includes('{name}'));

  it('covers the Lessons, which name the Dog instead of a mascot', () => {
    expect(named.some((key) => key.startsWith('lesson.'))).toBe(true);
    expect(named.some((key) => key.startsWith('trail.theory-'))).toBe(true);
    const mascot = (Object.keys(es) as TextKey[]).filter((key) => /^(lesson|trail|node|media)\./.test(key) && es[key].includes('Migas'));
    expect(mascot).toEqual([]);
  });

  it('uses no word that agrees with the Dog, and does not quote its name', () => {
    expect(named.filter((key) => GENDERED.test(es[key]) || es[key].includes('«{name}»')).map((key) => `${key}: ${es[key]}`)).toEqual([]);
  });
});

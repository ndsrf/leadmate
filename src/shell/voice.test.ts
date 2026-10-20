import { es } from '../i18n';
import { CUSTOM_CUE_MS, findPack, resolveCue, SUPPORTED_LANGUAGES, VOICE_PACKS } from './voice';

describe('Voice Packs', () => {
  it('hold a Cue for every supported language', () => {
    for (const pack of VOICE_PACKS) for (const lang of SUPPORTED_LANGUAGES) expect(pack.cues[lang]).toBeTruthy();
  });

  it('are named from the catalog', () => {
    for (const pack of VOICE_PACKS) expect(es[pack.name]).toBeTruthy();
  });

  it('play the selected pack Cue in the active language', () => {
    expect(resolveCue({ voicePack: 'aqui', customCues: {} }, 'es')).toEqual({ kind: 'pack', assetId: 'aqui.es' });
    expect(resolveCue({ voicePack: 'lets-go', customCues: {} }, 'es')).toEqual({ kind: 'pack', assetId: 'lets-go.es' });
  });

  it('fall back to the first pack when the stored one is unknown', () => {
    expect(findPack('gone')).toBe(VOICE_PACKS[0]);
  });
});

describe('custom Cues', () => {
  it('replace the pack Cue in the language they were recorded in', () => {
    expect(resolveCue({ voicePack: 'aqui', customCues: { es: 'file:///mine.m4a' } }, 'es')).toEqual({ kind: 'custom', uri: 'file:///mine.m4a' });
  });

  it('fall back to the pack in another language', () => {
    // a recording made in another language is not used for Spanish
    expect(resolveCue({ voicePack: 'aqui', customCues: { en: 'file:///mine.m4a' } }, 'es')).toEqual({ kind: 'pack', assetId: 'aqui.es' });
  });

  it('are limited to 2 seconds', () => {
    expect(CUSTOM_CUE_MS).toBe(2000);
  });
});

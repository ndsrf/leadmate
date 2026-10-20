/** Bundled Cue audio by asset id. Kept apart from `voice.ts` so its logic stays testable without assets. */
export const VOICE_ASSETS: Record<string, number> = {
  'lets-go.es': require('../../assets/voice/lets-go.es.wav'),
  'aqui.es': require('../../assets/voice/aqui.es.wav'),
};

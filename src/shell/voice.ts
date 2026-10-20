import type { TextKey } from '../i18n';

/** Languages the app ships; every Voice Pack must hold a Cue for each of them. */
export const SUPPORTED_LANGUAGES = ['es'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export interface VoicePack {
  id: string;
  name: TextKey;
  /** Asset id of the spoken Cue in each language (see `voiceAssets.ts`). */
  cues: Record<Language, string>;
}

export const VOICE_PACKS: readonly VoicePack[] = [
  { id: 'lets-go', name: 'voice.pack.letsGo', cues: { es: 'lets-go.es' } },
  { id: 'aqui', name: 'voice.pack.aqui', cues: { es: 'aqui.es' } },
];

export const DEFAULT_VOICE_PACK = VOICE_PACKS[0].id;

export type ResolvedCue = { kind: 'custom'; uri: string } | { kind: 'pack'; assetId: string };

/** The Voice Pack with this id, or the default one when it is unknown. */
export function findPack(id: string): VoicePack {
  return VOICE_PACKS.find((p) => p.id === id) ?? VOICE_PACKS[0];
}

/**
 * Which file a Cue press plays: the user's own recording for the active language, else the
 * selected pack's Cue in the active language.
 */
export function resolveCue(settings: { voicePack: string; customCues: Record<string, string> }, language: Language): ResolvedCue {
  const custom = settings.customCues[language];
  if (custom) return { kind: 'custom', uri: custom };
  return { kind: 'pack', assetId: findPack(settings.voicePack).cues[language] };
}

/** Longest custom Cue, in milliseconds. */
export const CUSTOM_CUE_MS = 2000;

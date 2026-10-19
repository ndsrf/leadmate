import type { TensionState } from '../sim/leash';
import type { TextKey } from '../i18n';

/** Seconds a hint stays on screen. */
export const HINT_SECONDS = 4;

const HINT_KEYS: Partial<Record<TensionState, TextKey>> = { taut: 'hint.taut', rigid: 'hint.rigid' };

/** Tracks which leash hints a Stage has shown; each appears once per Stage. */
export class HintTracker {
  private shown = new Set<TensionState>();

  /** Returns the catalog key to show when `tension` is a first for this Stage, else null. */
  observe(tension: TensionState): TextKey | null {
    const key = HINT_KEYS[tension];
    if (!key || this.shown.has(tension)) return null;
    this.shown.add(tension);
    return key;
  }
}

import type { TextKey } from '../../i18n';
import type { EncounterAim, PawReason } from './encounters';

/** The catalog key of the result-card line that says what the next Paw needs; null once nothing is missing. */
export function pawHintKey(aim: EncounterAim, reason: PawReason | null): TextKey | null {
  switch (reason) {
    case null:
      return null;
    case 'aim':
      return `encounter.next.aim.${aim}` as TextKey;
    case 'reactive':
      return 'encounter.next.reactive';
    case 'pull':
      return 'encounter.next.pull';
    case 'reactive-marker':
      return 'encounter.next.reactiveMarker';
    case 'late':
      return 'encounter.next.late';
    case 'perfect':
      return 'encounter.next.perfect';
  }
}

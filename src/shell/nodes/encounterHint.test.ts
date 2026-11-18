import { createTranslator } from '../../i18n';
import { pawHintKey } from './encounterHint';
import type { EncounterAim, PawReason } from './encounters';

describe('pawHintKey', () => {
  const aims: EncounterAim[] = ['keep-slack', 'stay-calm', 'mark-disengagement', 'check-in'];
  const reasons: PawReason[] = ['aim', 'reactive', 'pull', 'reactive-marker', 'late', 'perfect'];
  it('maps every aim and reason to a catalog line in both languages', () => {
    const t = createTranslator({});
    for (const aim of aims) for (const r of reasons) {
      const key = pawHintKey(aim, r);
      expect(key).not.toBeNull();
      expect(t(key!)).not.toBe('');
    }
  });
  it('has no line when nothing is missing', () => expect(pawHintKey('check-in', null)).toBeNull());
});

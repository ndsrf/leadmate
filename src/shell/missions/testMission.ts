import type { TextKey } from '../../i18n';
import type { Fix, MissionDef } from './mission';

const key = (k: string) => k as TextKey;
const fix = (id: string): Fix => ({
  id,
  blocks: [
    { type: 'text', text: key(`${id}.reassure`) },
    { type: 'text', text: key(`${id}.cause`) },
    { type: 'image', art: 'harness', alt: key(`${id}.alt`), caption: key(`${id}.caption`), placeholder: true },
  ],
  easierTarget: key(`${id}.easier`),
  practise: { kind: 'node', id: 'harness-ritual' },
});

/** A small Mission for tests, independent of the authored content. */
export const TEST_MISSION: MissionDef = {
  id: 'test-mission',
  title: key('test.title'),
  target: key('test.target'),
  reps: 3,
  successSign: key('test.success'),
  technique: 'harness',
  trains: [{ kind: 'node', id: 'harness-ritual' }],
  problems: [
    { id: 'excited', label: key('test.excited'), fix: fix('test-fix-excited') },
    { id: 'bites', label: key('test.bites'), fix: fix('test-fix-bites') },
  ],
  generalFix: fix('test-fix-general'),
};

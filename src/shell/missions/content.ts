import type { TextKey } from '../../i18n';
import type { Stop } from '../world';
import type { Fix, MissionDef } from './mission';

/**
 * A Fix from the catalog's `fix.<slug>.<problem>.*` keys, in the fixed order: reassurance, the likely cause, then
 * the corrections with one illustration. The easier target and the Stop to practise follow on the Fix page.
 */
function fix(slug: string, problem: string, practise: Stop): Fix {
  const k = (name: string) => `fix.${slug}.${problem}.${name}` as TextKey;
  return {
    id: `fix-${slug}-${problem}`,
    blocks: [
      { type: 'text', text: k('reassure') },
      { type: 'text', text: k('cause') },
      { type: 'text', text: k('c1') },
      { type: 'text', text: k('c2') },
      { type: 'image', art: `fix/${slug}/${problem}`, alt: k('alt'), caption: k('caption'), placeholder: true },
    ],
    easierTarget: k('easier'),
    practise,
    placeholder: true,
  };
}

/** A Mission from the catalog's `mission.<slug>.*` keys; every Fix practises `practise` unless a problem names its own Stop. */
function mission(id: string, slug: string, technique: string, reps: number, trains: Stop[], problems: (string | [string, Stop])[]): MissionDef {
  const k = (name: string) => `mission.${slug}.${name}` as TextKey;
  const practise = trains[trains.length - 1];
  return {
    id,
    title: k('title'),
    target: k('target'),
    reps,
    successSign: k('success'),
    technique,
    trains,
    problems: problems.map((p) => {
      const [problem, stop] = typeof p === 'string' ? [p, practise] : p;
      return { id: problem, label: k(`${problem}.label`), fix: fix(slug, problem, stop) };
    }),
    generalFix: fix(slug, 'general', practise),
    placeholder: true,
  };
}

const node = (id: string): Stop => ({ kind: 'node', id });
const lesson = (id: string): Stop => ({ kind: 'lesson', id });

/** The Missions that end each Stretch of Worlds 1 to 4 (design decision 10). */
export const MISSIONS: readonly MissionDef[] = [
  mission('mission-harness', 'harness', 'harness', 3, [node('harness-ritual')], ['excited', 'runs', 'bites']),
  mission('mission-doorbell', 'doorbell', 'doorbell', 3, [node('doorbell-mat')], ['barks', 'door', 'mat']),
  mission('mission-poste', 'poste', 'poste', 3, [node('poste-practice')], ['pulls', ['pulled', lesson('theory-poste')], 'long']),
  mission('mission-walk', 'walk', 'loose-leash', 1, [node('walk-distraction')], ['fixates', 'pulls', 'lunges']),
  mission('mission-corners', 'corners', 'blind-corner', 4, [node('blind-corner')], ['ahead', 'surprise', ['forget', lesson('theory-blind-corner')]]),
  mission('mission-u-leash', 'uleash', 'slack-u', 1, [node('slack-u')], ['lost', 'zigzag', 'treats']),
  mission('mission-leave-it', 'leaveit', 'leave-it', 3, [node('leave-it-intro')], ['grabs', 'ignores', 'repeat']),
  mission('mission-shields', 'shields', 'visual-shields', 2, [node('calm-zone-intro'), node('scooter-crossing')], ['late', 'sees', ['nocar', lesson('theory-visual-shields')]]),
  mission('mission-cue-choice', 'cuechoice', 'cue-choice', 2, [node('urban-mix')], [['mixup', lesson('theory-choosing-cue')], 'toomuch', 'nothing']),
  mission('mission-park-jogger', 'jogger', 'long-leash', 2, [node('park-jogger')], ['chases', ['tangle', lesson('howto-long-leash')], 'surprise']),
  mission('mission-park-mix', 'parkmix', 'park-mix', 1, [node('park-mix')], ['overwhelmed', 'food', 'me']),
];

export function findMission(id: string): MissionDef | undefined {
  return MISSIONS.find((m) => m.id === id);
}

/** Every Fix of every Mission, with the Mission and problem it belongs to; for the Library's "Tus ajustes". */
export function findFix(fixId: string): { mission: MissionDef; fix: Fix; problem: TextKey } | undefined {
  for (const m of MISSIONS) {
    const problem = m.problems.find((p) => p.fix.id === fixId);
    if (problem) return { mission: m, fix: problem.fix, problem: problem.label };
    if (m.generalFix.id === fixId) return { mission: m, fix: m.generalFix, problem: 'mission.problem.other' };
  }
  return undefined;
}

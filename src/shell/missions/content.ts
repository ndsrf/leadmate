import type { TextKey } from '../../i18n';
import type { Stop } from '../world';
import type { Fix, MissionDef } from './mission';

/**
 * A Fix from the catalog's `fix.<slug>.<problem>.*` keys, in the fixed order: reassurance, the likely cause, then
 * the corrections with one illustration. The easier target and the Stop to practise follow on the Fix page.
 */
function fix(slug: string, problem: string, practise: Stop, shared?: TextKey): Fix {
  const k = (name: string) => `fix.${slug}.${problem}.${name}` as TextKey;
  return {
    id: `fix-${slug}-${problem}`,
    blocks: [
      { type: 'text', text: k('reassure') },
      { type: 'text', text: k('cause') },
      { type: 'text', text: k('c1') },
      // a shared key (the professional-help or vet note) takes the place of the second correction in every Fix
      { type: 'text', text: shared ?? k('c2') },
      { type: 'image', art: `fix/${slug}/${problem}`, alt: k('alt'), caption: k('caption') },
    ],
    easierTarget: k('easier'),
    practise,
  };
}

/**
 * A Mission from the catalog's `mission.<slug>.*` keys; every Fix practises `practise` unless a problem names its own Stop.
 * `sharedNote` is one catalog key shown in every Fix of the Mission as its second correction (the professional-help note
 * of the biting Missions, the vet note of eating non-food things).
 */
function mission(id: string, slug: string, technique: string, reps: number, trains: Stop[], problems: (string | [string, Stop])[], place?: 'home', sharedNote?: TextKey): MissionDef {
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
      return { id: problem, label: k(`${problem}.label`), fix: fix(slug, problem, stop, sharedNote) };
    }),
    generalFix: fix(slug, 'general', practise, sharedNote),
    ...(place ? { place } : {}),
  };
}

const node = (id: string): Stop => ({ kind: 'node', id });
const lesson = (id: string): Stop => ({ kind: 'lesson', id });

/**
 * The Missions of the Home Behaviours (`add-home-behaviour-training`). They are not in `WORLDS`: they end no Stretch and
 * close no Stops. The biting ones train a Lesson Stop (their Home Behaviour has no exercise); the others train their Node.
 */
function homeMissions(): MissionDef[] {
  return [
    mission('mission-bite-owner', 'biteowner', 'bite-owner', 3, [lesson('theory-bite-owner')], ['growls', 'bit', 'cantavoid'], 'home', 'plan.note.professional'),
    mission('mission-bite-others', 'biteothers', 'bite-others', 3, [lesson('theory-bite-others')], ['approach', 'growl', 'cantmanage'], 'home', 'plan.note.professional'),
    mission('mission-bark-home', 'barkhome', 'bark-home', 5, [node('bark-home')], ['nonstop', 'shout', 'trigger'], 'home'),
    mission('mission-destroy', 'destroy', 'destroy', 3, [node('destroy')], ['ignores', 'again', 'alone'], 'home'),
    mission('mission-eat-objects', 'eatobjects', 'eat-objects', 3, [node('eat-objects')], ['swallowed', 'runs', 'again'], 'home', 'lesson.note.vet'),
  ];
}

/** The Missions that end each Stretch of the playable Worlds; the Basics World's are done at home. */
export const MISSIONS: readonly MissionDef[] = [
  mission('mission-dog-as-dog', 'dogasdog', 'dog-as-dog', 1, [node('dog-as-dog')], ['cries', 'family', 'bed'], 'home'),
  mission('mission-home-rest', 'homerest', 'home-rest', 3, [node('home-rest')], ['insists', 'barks', 'comesback'], 'home'),
  mission('mission-calm-first', 'calmfirst', 'calm-first', 2, [node('calm-first')], ['neverstops', 'escalates', 'givein'], 'home'),
  mission('mission-harness', 'harness', 'harness', 3, [node('harness-ritual')], ['excited', 'runs', 'bites']),
  mission('mission-doorbell', 'doorbell', 'doorbell', 3, [node('doorbell-mat')], ['barks', 'door', 'mat']),
  mission('mission-poste', 'poste', 'poste', 3, [node('poste-practice')], ['pulls', ['pulled', lesson('theory-poste')], 'long']),
  mission('mission-walk', 'walk', 'loose-leash', 1, [node('walk-distraction')], ['fixates', 'pulls', 'lunges']),
  mission('mission-corners', 'corners', 'blind-corner', 4, [node('blind-corner')], ['ahead', 'surprise', ['forget', lesson('theory-blind-corner')]]),
  mission('mission-u-leash', 'uleash', 'slack-u', 1, [node('slack-u')], ['lost', 'zigzag', 'treats']),
  mission('mission-leave-it', 'leaveit', 'leave-it', 3, [node('leave-it-intro')], ['grabs', 'ignores', 'repeat']),
  mission('mission-shields', 'shields', 'visual-shields', 2, [node('calm-zone-intro'), node('scooter-crossing')], ['late', 'sees', ['nocar', lesson('theory-visual-shields')]]),
  mission('mission-cue-choice', 'cuechoice', 'cue-choice', 2, [node('close-narrow-street-pass'), node('urban-mix')], [['mixup', lesson('theory-choosing-cue')], 'toomuch', 'nothing']),
  mission('mission-park-jogger', 'jogger', 'long-leash', 2, [node('park-jogger')], ['chases', ['tangle', lesson('howto-long-leash')], 'surprise']),
  mission('mission-park-mix', 'parkmix', 'park-mix', 1, [node('park-mix')], ['overwhelmed', 'food', 'me']),
  ...homeMissions(),
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

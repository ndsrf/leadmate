import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createTranslator, es, type TextKey, type Translate } from '../../i18n';
import { findMission } from '../missions/content';
import { findNode } from '../nodes/content';
import { primerCardOf } from '../nodes/node';
import { BASICS_SCENES, CORRECT_ACTION, hintKey, SCENE_ACTIONS, type DogState } from '../nodes/readDog';
import { findWorld, stopsOf } from '../world';
import { lineTextKey, parseAnimationTimeline, type AnimationTimeline } from './animationTimeline';
import { isAnimationKey } from '../ui/media';
import { findLesson, LESSONS, theoryLesson } from './content';
import { countWords, lessonArtNames, lessonTextKeys, type LessonDef } from './lesson';
import { LESSON_ART } from './lessonArtRegistry';

/** The teaching pattern as a sequence of block types (see docs/content/lesson-guide.md). */
const PATTERN = /^(notice )?heading text heading text image heading steps (video )?example (image )*heading compare (video )?tip takeaways$/;
const SECTIONS = ['lesson.section.why', 'lesson.section.how', 'lesson.section.mistakes'];

/** Why a theory Lesson does not meet the guide; empty when it does. */
function problems(lesson: LessonDef, t: Translate, art: Readonly<Record<string, unknown>>): string[] {
  const found: string[] = [];
  const types = lesson.blocks.map((b) => b.type).join(' ');
  if (!PATTERN.test(types)) found.push(`pattern: ${types}`);
  const headings = lesson.blocks.flatMap((b) => (b.type === 'heading' ? [b.text] : []));
  if (headings.slice(1).join() !== SECTIONS.join()) found.push(`section headings: ${headings.join()}`);
  const words = lessonTextKeys(lesson.blocks).reduce((sum, key) => sum + countWords(t(key)), 0);
  if (words < 350 || words > 700) found.push(`${words} words`);
  const images = lessonArtNames(lesson.blocks);
  if (images.length < 2) found.push(`${images.length} images`);
  const steps = lesson.blocks.find((b) => b.type === 'steps');
  if (!steps || steps.type !== 'steps' || steps.items.length < 3) found.push('fewer than 3 steps');
  const takeaways = lesson.blocks.find((b) => b.type === 'takeaways');
  if (!takeaways || takeaways.type !== 'takeaways' || takeaways.items.length < 2) found.push('fewer than 2 takeaways');
  for (const name of images) if (!(name in art)) found.push(`art not bundled: ${name}`);
  for (const b of lesson.blocks) if (b.type === 'video' && !(b.poster in art) && b.poster !== 'poster') found.push(`poster not bundled: ${b.poster}`);
  for (const key of lessonTextKeys(lesson.blocks)) if (t(key).trim() === '') found.push(`missing text: ${key}`);
  return found;
}

/** Every theory Lesson, resolved from active content. */
const THEORY = LESSONS.filter((l) => l.kind === 'theory');

describe('theory Lessons follow the guide', () => {
  it('every theory Lesson conforms', () => {
    const t = createTranslator();
    expect(THEORY.map((l) => ({ id: l.id, problems: problems(l, t, LESSON_ART) }))).toEqual(THEORY.map((l) => ({ id: l.id, problems: [] })));
  });
});

describe('Lesson Animations', () => {
  const keys = LESSONS.flatMap((l) => l.blocks.flatMap((b) => (b.type === 'video' && b.source.kind === 'animation' ? [{ id: l.id, key: b.source.key }] : [])));

  it('every animation key is well formed', () => {
    expect(keys.filter(({ key }) => !isAnimationKey(key))).toEqual([]);
  });

  const docs = join(__dirname, '../../../docs/content');
  const book = readFileSync(join(docs, 'lesson-animation-prompts.md'), 'utf8');
  /** The prompt-book entry of each key: the text from its `## <key>` heading to the next heading. */
  const entries = new Map([...book.matchAll(/^## (\S+)\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/gm)].map((m) => [m[1], m[2]]));
  /** The catalog key prefix of each Lesson's animation Lines, from its animation block's caption. */
  const captions = new Map(THEORY.flatMap((l) => l.blocks.flatMap((b) => (b.type === 'video' && b.source.kind === 'animation' ? [[l.id, b.caption as string]] : []))));
  /** Beat ids and Lines (id and voice), the part of a timeline the prompt book and the stored copy must share. */
  const shape = (tl: AnimationTimeline | null) => tl && { beats: tl.beats.map((b) => b.id), lines: tl.lines.map((l) => ({ id: l.id, voice: l.voice })) };
  const stored = (key: string) => {
    try {
      return readFileSync(join(docs, 'animations', `${key}.json`), 'utf8');
    } catch {
      return null;
    }
  };

  it('every animation key has an entry in the prompt book', () => {
    expect(keys.filter(({ key }) => !entries.has(key))).toEqual([]);
  });

  it('every animation key has a stored timeline that parses', () => {
    expect(keys.filter(({ key }) => { const json = stored(key); return json === null || parseAnimationTimeline(json) === null; })).toEqual([]);
  });

  it('every Line of a stored timeline has catalog text', () => {
    const missing = keys.flatMap(({ id, key }) => {
      const timeline = parseAnimationTimeline(stored(key) ?? '');
      const caption = captions.get(id);
      return (timeline?.lines ?? []).flatMap((l) => (caption && lineTextKey(caption, l.id) in es ? [] : [`${id}: ${l.id}`]));
    });
    expect(missing).toEqual([]);
  });

  it("each prompt-book entry's beats and Lines match its stored timeline", () => {
    for (const { key } of keys) {
      const target = /```json\n([\s\S]*?)```/.exec(entries.get(key) ?? '')?.[1] ?? '';
      expect({ key, shape: shape(parseAnimationTimeline(target)) }).toEqual({ key, shape: shape(parseAnimationTimeline(stored(key) ?? '')) });
      expect(shape(parseAnimationTimeline(target))).not.toBeNull();
    }
  });
});

describe('the conformance check', () => {
  const words = (n: number) => Array.from({ length: n }, () => 'palabra').join(' ');
  const art = { a: 1, b: 2 };

  it('accepts a Lesson in the pattern with enough words, images, steps and takeaways', () => {
    const lesson = theoryLesson('ok', { keys: 'x', images: ['a', 'b'], steps: 3, takeaways: 2 });
    const t = ((key: string) => (key.startsWith('lesson.section') ? 'Título' : words(30))) as Translate;
    expect(problems(lesson, t, art)).toEqual([]);
  });

  it('rejects a thin Lesson: too few words, one image, unbundled art, an unbundled poster and a broken order', () => {
    const thin: LessonDef = {
      id: 'thin',
      title: 'x.title' as never,
      kind: 'theory',
      blocks: [
        { type: 'heading', text: 'x.heading' as never },
        { type: 'text', text: 'x.p1' as never },
        { type: 'image', art: 'missing', alt: 'x.alt' as never, caption: 'x.caption' as never },
        { type: 'video', source: { kind: 'animation', key: 'x' }, poster: 'x-anim', alt: 'x.alt' as never, caption: 'x.caption' as never },
        { type: 'tip', text: 'x.tip' as never },
      ],
    };
    const found = problems(thin, (() => words(20)) as Translate, art);
    for (const expected of [/^pattern/, /^60 words$/, /^1 images$/, /steps/, /takeaways/, /art not bundled: missing/, /poster not bundled: x-anim/]) expect(found).toContainEqual(expect.stringMatching(expected));
  });

  it('rejects a Lesson over 700 words', () => {
    const lesson = theoryLesson('long', { keys: 'x', images: ['a', 'b'], steps: 3, takeaways: 2 });
    expect(problems(lesson, (() => words(60)) as Translate, art)).toContainEqual(expect.stringMatching(/words$/));
  });
});

describe('World 1 teaches no physical correction', () => {
  /** Words for hitting, kicking, shoving or scruffing a Dog; World 1 text must not contain them. */
  const BANNED = /(pegar|golpe|patada|empujar|zarandear|cachete)/i;
  const stops = stopsOf(findWorld('basics')!);
  const lessonKeys = stops.flatMap((s) => (s.kind === 'lesson' ? [findLesson(s.id)!.title, ...lessonTextKeys(findLesson(s.id)!.blocks)] : []));
  const missionKeys = stops.flatMap((s) => {
    if (s.kind !== 'mission') return [];
    const m = findMission(s.id)!;
    const fixes = [...m.problems.map((p) => p.fix), m.generalFix];
    return [m.title, m.target, m.successSign, ...m.problems.map((p) => p.label), ...fixes.flatMap((f) => [...lessonTextKeys(f.blocks), f.easierTarget])];
  });
  const nodeKeys = stops.flatMap((s) => {
    if (s.kind !== 'node') return [];
    const n = findNode(s.id)!;
    return [n.title, ...n.primerCards.map((c) => primerCardOf(c).text), ...n.checkpoint.flatMap((q) => [q.question, q.explanation, ...q.options.map((o) => o.text)]), ...n.exercises.map((e) => e.key)];
  });
  const hintKeys = BASICS_SCENES.flatMap((scene) =>
    (Object.keys(CORRECT_ACTION[scene]) as DogState[]).flatMap((state) => [null, ...SCENE_ACTIONS[scene]].map((action) => hintKey(scene, state, action))),
  );
  const actionKeys = BASICS_SCENES.flatMap((scene) => SCENE_ACTIONS[scene].flatMap((a) => [`minigame.action.${a}`, `minigame.actionHint.${a}`] as TextKey[]));

  it('covers every Lesson, Node, Minigame hint, Mission and Fix of World 1', () => {
    expect(lessonKeys.length).toBeGreaterThan(50);
    expect(missionKeys.length).toBeGreaterThan(60);
    expect(new Set(hintKeys).size).toBeGreaterThan(10);
  });

  it('never names hitting, kicking, shoving or scruffing', () => {
    const t = createTranslator();
    const found = [...new Set([...lessonKeys, ...missionKeys, ...nodeKeys, ...hintKeys, ...actionKeys])].filter((key) => BANNED.test(t(key))).map((key) => `${key}: ${t(key)}`);
    expect(found).toEqual([]);
  });

  it('catches a banned word when one slips in', () => {
    expect(BANNED.test('Dale un cachete si salta')).toBe(true);
    expect(BANNED.test('Camina con calma hacia su espacio, sin tocarlo')).toBe(false);
  });
});

describe('Home Behaviour content method rules', () => {
  const BANNED = /(pega\b|pegar|golpe|patada|empujar|zarandear|cachete|castigar con|collar de|bozal|descarga)/i;
  const t = createTranslator();
  const HOME_LESSON_IDS = ['theory-bite-owner', 'theory-bite-others', 'theory-bark-home', 'theory-destroy', 'theory-eat-objects'];
  const homeLessons = HOME_LESSON_IDS.map((id) => findLesson(id)!);
  const lessonKeys = homeLessons.flatMap((l) => [l.title, ...lessonTextKeys(l.blocks)]);
  const missionKeys = ['mission-bite-owner', 'mission-bite-others', 'mission-bark-home', 'mission-destroy', 'mission-eat-objects'].flatMap((id) => {
    const m = findMission(id)!;
    const fixes = [...m.problems.map((p) => p.fix), m.generalFix];
    return [m.title, m.target, m.successSign, ...m.problems.map((p) => p.label), ...fixes.flatMap((f) => [...lessonTextKeys(f.blocks), f.easierTarget])];
  });
  const nodeKeys = ['bark-home', 'destroy', 'eat-objects'].flatMap((id) => {
    const n = findNode(id)!;
    return [n.title, ...n.primerCards.map((c) => primerCardOf(c).text), ...n.checkpoint.flatMap((q) => [q.question, q.explanation, ...q.options.map((o) => o.text)]), ...n.exercises.map((e) => e.key)];
  });
  const sceneKeys = (['bark-home', 'destroy', 'eat-objects'] as const).flatMap((scene) =>
    (Object.keys(CORRECT_ACTION[scene]) as DogState[]).flatMap((state) => [null, ...SCENE_ACTIONS[scene]].map((action) => hintKey(scene, state, action))),
  );

  it('covers a lot of text', () => {
    expect(lessonKeys.length).toBeGreaterThan(80);
    expect(missionKeys.length).toBeGreaterThan(100);
  });

  it('never names hitting, kicking, shoving, shock or other aversive methods', () => {
    const found = [...new Set([...lessonKeys, ...missionKeys, ...nodeKeys, ...sceneKeys])].filter((key) => BANNED.test(t(key))).map((key) => `${key}: ${t(key)}`);
    expect(found).toEqual([]);
  });

  it('shows the same shared vet note, one catalog key, in the eating Lesson and in every Remediation of the eating Mission', () => {
    expect(findLesson('theory-eat-objects')!.blocks[0]).toEqual({ type: 'notice', text: 'lesson.note.vet' });
    const m = findMission('mission-eat-objects')!;
    for (const f of [...m.problems.map((p) => p.fix), m.generalFix]) expect(f.blocks.some((b) => b.type === 'text' && b.text === 'lesson.note.vet')).toBe(true);
  });
});

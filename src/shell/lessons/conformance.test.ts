import { createTranslator, type Translate } from '../../i18n';
import { LESSONS, theoryLesson } from './content';
import { countWords, lessonArtNames, lessonTextKeys, type LessonDef } from './lesson';
import { LESSON_ART } from './lessonArtRegistry';

/** The teaching pattern as a sequence of block types (see docs/content/lesson-guide.md). */
const PATTERN = /^heading text heading text image heading steps example (image )*heading compare (video )?tip takeaways$/;
const SECTIONS = ['lesson.section.why', 'lesson.section.how', 'lesson.section.mistakes'];

/** Why a final theory Lesson does not meet the guide; empty when it does. */
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
  for (const b of lesson.blocks) if (b.type === 'image' && b.placeholder) found.push(`placeholder image: ${b.art}`);
  for (const key of lessonTextKeys(lesson.blocks)) if (t(key).trim() === '') found.push(`missing text: ${key}`);
  return found;
}

const FINAL = LESSONS.filter((l) => l.kind === 'theory' && !l.placeholder);

describe('final theory Lessons follow the guide', () => {
  it('every theory Lesson without the placeholder flag conforms (passes on none)', () => {
    const t = createTranslator();
    expect(FINAL.map((l) => ({ id: l.id, problems: problems(l, t, LESSON_ART) }))).toEqual(FINAL.map((l) => ({ id: l.id, problems: [] })));
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

  it('rejects a thin Lesson: too few words, one image, unbundled art, a placeholder image and a broken order', () => {
    const thin: LessonDef = {
      id: 'thin',
      title: 'x.title' as never,
      kind: 'theory',
      blocks: [
        { type: 'heading', text: 'x.heading' as never },
        { type: 'text', text: 'x.p1' as never },
        { type: 'image', art: 'missing', alt: 'x.alt' as never, caption: 'x.caption' as never, placeholder: true },
        { type: 'tip', text: 'x.tip' as never },
      ],
    };
    const found = problems(thin, (() => words(20)) as Translate, art);
    for (const expected of [/^pattern/, /^60 words$/, /^1 images$/, /steps/, /takeaways/, /art not bundled: missing/, /placeholder image/]) expect(found).toContainEqual(expect.stringMatching(expected));
  });

  it('rejects a Lesson over 700 words', () => {
    const lesson = theoryLesson('long', { keys: 'x', images: ['a', 'b'], steps: 3, takeaways: 2 });
    expect(problems(lesson, (() => words(60)) as Translate, art)).toContainEqual(expect.stringMatching(/words$/));
  });
});

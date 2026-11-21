import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { en, es, type TextKey } from '../../i18n';
import { LESSON_ART } from './lessonArtRegistry';
import { getActiveContent } from '../content/runtime';

const LESSON = join(__dirname, '..', '..', '..', 'content', 'beta', 'lessons', 'howto-walking');

/** The body of "Control 5" of the lesson's Markdown file (everything between its heading line and its bullet metadata). */
function controlFive(lang: 'en' | 'es'): { heading: string; body: string } {
  const md = readFileSync(join(LESSON, `${lang}.md`), 'utf8');
  const section = md.split(/^## Control 5\s*$/m)[1]?.split(/^## /m)[0] ?? '';
  const [heading = '', ...rest] = section.trim().split('\n');
  return { heading: heading.replace(/^### /, ''), body: rest.filter((l) => !l.startsWith('- ')).join(' ') };
}

// the sentences of the Hints that explain the signs of the guided first Stage, which the lesson repeats word for word
const SIGN_HINTS: TextKey[] = ['onboarding.hint.fixationRing', 'onboarding.hint.sign.alert', 'onboarding.hint.sign.eye', 'onboarding.hint.sign.bark'];

describe('the "Las señales del perro" control of the walking How-to-play Lesson', () => {
  it.each([['en', en], ['es', es]] as const)('says what the Hints say (%s)', (lang, catalog) => {
    const { body } = controlFive(lang);
    for (const key of SIGN_HINTS) expect({ key, found: body.includes(catalog[key]) }).toEqual({ key, found: true });
  });

  it('is titled "Las señales del perro" in Spanish', () => {
    expect(controlFive('es').heading).toBe('Las señales del perro');
  });

  it('declares six controls, the last two sharing the bundled signs picture', () => {
    const yaml = readFileSync(join(LESSON, 'lesson.yaml'), 'utf8');
    expect(yaml).toMatch(/^controls: 6$/m);
    expect(yaml.match(/- howto-walking-signs/g)).toHaveLength(2);
    // the picture is bundled with the app (lessonArtRegistry), so it never has to be downloaded
    expect(existsSync(join(__dirname, '..', '..', '..', 'assets', 'lessons', 'howto-walking-signs.png'))).toBe(true);
    expect(LESSON_ART['howto-walking-signs']).toBeDefined();
  });
});

describe('How-to-play pictures of the bundled content', () => {
  const howTo = () => getActiveContent().resolved.lessons.filter((l) => l.kind === 'how-to-play');

  it('are all bundled with the app, so the first run never needs to download one', () => {
    const missing: string[] = [];
    for (const lesson of howTo())
      for (const block of lesson.blocks) if (block.type === 'image' && !(block.art in LESSON_ART)) missing.push(`${lesson.id}: ${block.art}`);
    expect(howTo().length).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });

  it('gives the signs and the Gaze Ring controls the shared signs picture', () => {
    const walking = howTo().find((l) => l.id === 'howto-walking');
    const arts = (walking?.blocks ?? []).flatMap((b) => (b.type === 'image' ? [b.art] : []));
    expect(arts).toEqual(['howto-walking-1', 'howto-walking-2', 'howto-walking-3', 'howto-walking-4', 'howto-walking-signs', 'howto-walking-signs']);
  });
});

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { buildPack } from './build';
import { loadPackFromDisk } from './loader';
import { resolvePack } from './resolver';
import { IMAGE_DUEL_MIN_APP_VERSION } from './schema';
import { validatePack, type ContentPack } from './validator';
import { isImageDuelQuestion, type ImageDuelQuestion } from '../nodes/content';

const FIXTURE = path.join(__dirname, '__fixtures__', 'duel-pack');
const NODE = 'duel-walk';

/** A fresh, mutable copy of the duel fixture pack. */
function fixture(): ContentPack {
  return JSON.parse(JSON.stringify(loadPackFromDisk(FIXTURE)));
}

function nodeOf(pack: ContentPack) {
  return pack.nodes[NODE];
}

/** Replaces the duel subsection (### tq2) of a language's Markdown. */
function setDuelMarkdown(pack: ContentPack, lang: string, section: string) {
  const text = nodeOf(pack).text![lang] as string;
  nodeOf(pack).text![lang] = text.replace(/### tq2[\s\S]*$/, `### tq2\n${section}\n`);
}

function errorsOf(pack: ContentPack) {
  return validatePack(pack).errors;
}

function expectNamesNode(pack: ContentPack, fragment: string) {
  const errors = errorsOf(pack);
  expect(errors.length).toBeGreaterThan(0);
  const match = errors.find((e) => e.message.includes(fragment));
  expect(match).toBeDefined();
  expect(match!.message).toContain(`Node "${NODE}"`);
}

describe('Image Duel validation', () => {
  it('a duel with two existing images and one correct answer validates', () => {
    const report = validatePack(fixture());
    expect(report.errors).toEqual([]);
    expect(report.valid).toBe(true);
  });

  it('rejects a duel with one image', () => {
    const pack = fixture();
    (nodeOf(pack).config.checkpoint![1] as any).images = ['autopilot.png'];
    expectNamesNode(pack, 'exactly two images, found 1');
  });

  it('rejects a duel whose image is missing on disk', () => {
    const pack = fixture();
    nodeOf(pack).files = ['media/autopilot.png'];
    expectNamesNode(pack, 'duel image "turn-and-look.png" does not exist');
  });

  it('rejects a duel with no correct image', () => {
    const pack = fixture();
    delete (nodeOf(pack).config.checkpoint![1] as any).correct;
    expectNamesNode(pack, 'exactly one correct image');
  });

  it('rejects an [x] mark that disagrees with correct, or two marks', () => {
    const pack = fixture();
    setDuelMarkdown(pack, 'es', '¿Cuál?\n- [x] Uno\n- [ ] Dos\n- why: Porque sí.');
    expectNamesNode(pack, 'disagrees with correct');

    const twoMarks = fixture();
    setDuelMarkdown(twoMarks, 'en', 'Which?\n- [x] One\n- [x] Two\n- why: Because.');
    expectNamesNode(twoMarks, 'disagrees with correct');

    const agreeing = fixture();
    setDuelMarkdown(agreeing, 'es', '¿Cuál?\n- [ ] Uno\n- [x] Dos\n- why: Porque sí.');
    expect(errorsOf(agreeing)).toEqual([]);
  });

  it('rejects a duel without one alt text per image, a prompt or a Spanish explanation', () => {
    const oneAlt = fixture();
    setDuelMarkdown(oneAlt, 'en', 'Which?\n- [ ] One\n- why: Because.');
    expectNamesNode(oneAlt, 'exactly two alt texts');

    const noPrompt = fixture();
    setDuelMarkdown(noPrompt, 'es', '- [ ] Uno\n- [ ] Dos\n- why: Porque sí.');
    expectNamesNode(noPrompt, 'missing its prompt');

    const noWhy = fixture();
    setDuelMarkdown(noWhy, 'es', '¿Cuál?\n- [ ] Uno\n- [ ] Dos');
    expectNamesNode(noWhy, 'missing its explanation');
  });

  it('rejects a node.yaml checkpoint list that does not match the Markdown questions', () => {
    const pack = fixture();
    nodeOf(pack).config.checkpoint!.push({});
    expectNamesNode(pack, 'lists 3 Checkpoint questions but es.md has 2');
  });

  it(`requires a pack using duels to declare minAppVersion ${IMAGE_DUEL_MIN_APP_VERSION} or later`, () => {
    const pack = fixture();
    pack.pack.minAppVersion = '1.0.1';
    const err = errorsOf(pack).find((e) => e.field === 'minAppVersion');
    expect(err?.message).toContain(`Node "${NODE}" uses an Image Duel`);

    // a pack without duels keeps any minAppVersion
    const noDuel = fixture();
    noDuel.pack.minAppVersion = '1.0.0';
    nodeOf(noDuel).config.checkpoint = [{}, {}];
    setDuelMarkdown(noDuel, 'es', '¿Cuál?\n- [x] Uno\n- [ ] Dos\n- why: Porque sí.');
    setDuelMarkdown(noDuel, 'en', 'Which?\n- [x] One\n- [ ] Two\n- why: Because.');
    expect(errorsOf(noDuel)).toEqual([]);
  });
});

describe('Image Duel content resolution and build', () => {
  const duelOf = (lang: string) => {
    const resolved = resolvePack(fixture(), lang);
    const node = resolved.nodes.find((n) => n.id === NODE)!;
    return { resolved, node, duel: node.checkpoint[1] as ImageDuelQuestion };
  };

  it('keeps text questions as they were, with no kind', () => {
    const { node } = duelOf('es');
    expect(isImageDuelQuestion(node.checkpoint[0])).toBe(false);
    expect(node.checkpoint[0]).toEqual({
      question: 'node.duelwalk.tq1.question',
      options: [
        { text: 'node.duelwalk.tq1.right', correct: true },
        { text: 'node.duelwalk.tq1.wrong1', correct: false },
        { text: 'node.duelwalk.tq1.wrong2', correct: false },
      ],
      explanation: 'node.duelwalk.tq1.why',
    });
  });

  it('exposes both resolved images and localized alt text, prompt and explanation', () => {
    for (const [lang, alt2, prompt] of [
      ['es', 'La guía gira y mira a {name}', '¿Qué guía mantiene a {name} atento?'],
      ['en', 'The handler turns and looks at {name}', 'Which handler keeps {name} paying attention?'],
    ]) {
      const { resolved, duel } = duelOf(lang);
      expect(isImageDuelQuestion(duel)).toBe(true);
      expect(duel.correct).toBe(1);
      expect(duel.images.map((i) => i.path)).toEqual([`nodes/${NODE}/media/autopilot.png`, `nodes/${NODE}/media/turn-and-look.png`]);
      expect(duel.images.map((i) => i.art)).toEqual(['autopilot.png', 'turn-and-look.png']);
      expect(duel.images.every((i) => i.itemPath === `nodes/${NODE}`)).toBe(true);
      // options mirror the images, so the reducer answers by authored index
      expect(duel.options).toEqual([
        { text: duel.images[0].alt, correct: false },
        { text: duel.images[1].alt, correct: true },
      ]);
      expect(resolved.catalog[duel.images[1].alt]).toBe(alt2);
      expect(resolved.catalog[duel.question]).toBe(prompt);
      expect(resolved.catalog[duel.explanation]).toBeTruthy();
    }
  });

  it('falls back to Spanish alt text when a language lacks it', () => {
    const pack = fixture();
    delete nodeOf(pack).text!.en;
    const resolved = resolvePack(pack, 'en');
    const duel = resolved.nodes[0].checkpoint[1] as ImageDuelQuestion;
    expect(resolved.catalog[duel.images[0].alt]).toBe('La guía camina mirando el móvil');
  });

  it('content build ships both duel images in the manifest', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'duel-build-'));
    try {
      const result = buildPack({ channel: 'beta', packDir: FIXTURE, outDir, contentVersion: 1 });
      expect(result.manifest.minAppVersion).toBe(IMAGE_DUEL_MIN_APP_VERSION);
      const files = result.manifest.files;
      for (const img of ['autopilot.png', 'turn-and-look.png']) {
        const entry = files[`nodes/${NODE}/media/${img}`];
        expect(entry).toBeDefined();
        expect(fs.existsSync(path.join(outDir, 'files', `${entry.sha256}.png`))).toBe(true);
      }
      expect(files[`nodes/${NODE}/en.md`]).toBeDefined();
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });
});

import { defaultScenario } from '../../sim/config';
import { validatePack, type ContentPack } from './validator';

function makeValidPack(): ContentPack {
  return {
    pack: {
      formatVersion: 1,
      minAppVersion: '1.0.0',
      languages: ['es', 'en'],
      retired: ['old-retired-node'],
    },
    worlds: {
      basics: {
        config: {
          id: 'basics',
          worldNumber: 1,
          tier: 'free',
          stretches: [
            [
              { kind: 'lesson', id: 'lesson-1' },
              { kind: 'node', id: 'node-1' },
              { kind: 'mission', id: 'mission-1' },
            ],
          ],
        },
        text: {
          es: { title: 'Mundo Básico', topics: 'conceptos básicos' },
          en: { title: 'Basics World', topics: 'basic concepts' },
        },
      },
    },
    lessons: {
      'lesson-1': {
        config: {
          id: 'lesson-1',
          kind: 'theory',
          images: ['diagram.png', 'scene.png'],
          animation: 'lesson-1-anim',
          youtube: { es: 'dQw4w9WgXcQ' },
        },
        text: {
          es: {
            title: 'Lección 1',
            heading: 'Los nombres importan',
            hook: 'Tu perro reconoce su nombre.',
            why: 'Por asociación positiva.',
            steps: ['Di el nombre', 'Espera mirada', 'Premia'],
            example: { title: 'En casa', text: 'Practica en el pasillo.' },
            compare: { do: 'Premia a tiempo', dont: 'No repitas el nombre' },
            tip: 'Prueba hoy en tres momentos.',
            takeaways: ['El nombre no es una orden.', 'Premia siempre.'],
          },
          en: {
            title: 'Lesson 1',
            heading: 'Names Matter',
            hook: 'Your dog knows their name.',
            why: 'Through positive association.',
            steps: ['Say the name', 'Wait for gaze', 'Reward'],
            example: { title: 'At home', text: 'Practice in the hallway.' },
            compare: { do: 'Reward on time', dont: 'Do not repeat the name' },
            tip: 'Try today three times.',
            takeaways: ['The name is not an order.', 'Always reward.'],
          },
        },
      },
    },
    nodes: {
      'node-1': {
        config: {
          id: 'node-1',
          mode: 'stage',
          prerequisites: [],
          simulation: { scenarioName: 'BLIND_CORNER' },
          exercises: [{ metric: 'tension' }],
        },
        text: {
          es: {
            title: 'Paseo con distracciones',
            primer: [{ text: 'Mantén la calma' }],
            checkpoint: [
              {
                question: '¿Qué haces si tira?',
                options: [
                  { text: 'Parar con calma', correct: true },
                  { text: 'Tirar fuerte', correct: false },
                ],
                explanation: 'Detenerte evita la frustración.',
              },
            ],
          },
        },
      },
    },
    missions: {
      'mission-1': {
        config: {
          id: 'mission-1',
          technique: 'loose-leash',
          reps: 3,
          trains: [{ kind: 'node', id: 'node-1' }],
          problems: [{ id: 'pulls', practise: { kind: 'node', id: 'node-1' } }],
        },
        text: {
          es: {
            title: 'Misión Paseo',
            target: 'Tres tramos con correa floja',
            success: 'El perro camina sin tensión',
            problems: [
              {
                id: 'pulls',
                label: 'Tira mucho',
                fix: {
                  reassure: 'Es normal al principio.',
                  cause: 'Expectativa alta.',
                  c1: 'Párate sin tirar.',
                  easier: 'Haz tramos de 5 pasos.',
                  alt: 'Pausa',
                  caption: 'Parada tranquila',
                },
              },
            ],
            general: {
              reassure: 'Todo bien.',
              cause: 'Paciencia.',
              c1: 'Vuelve al inicio.',
              easier: 'Reduce la distancia.',
              alt: 'Pausa',
              caption: 'Parada tranquila',
            },
          },
        },
      },
    },
  };
}

describe('validatePack scenarios', () => {
  it('Scenario: Valid pack passes validation', () => {
    const pack = makeValidPack();
    const report = validatePack(pack);
    expect(report.valid).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([]);
  });

  it('Scenario: Dangling reference in stretch reports missing id and available ids', () => {
    const pack = makeValidPack();
    pack.worlds.basics.config.stretches[0].push({ kind: 'lesson', id: 'non-existent-lesson' });

    const report = validatePack(pack);
    expect(report.valid).toBe(false);
    const err = report.errors.find((e) => e.field?.includes('stretches') && e.message.includes('non-existent-lesson'));
    expect(err).toBeDefined();
    expect(err?.hint).toContain('Available lessons: lesson-1');
  });

  it('Scenario: Spanish required - fails when an item has no Spanish text file', () => {
    const pack = makeValidPack();
    delete pack.lessons['lesson-1'].text!['es'];

    const report = validatePack(pack);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.message.includes('missing required Spanish text'))).toBe(true);
  });

  it('Scenario: Partial translation reports a warning naming the file and section', () => {
    const pack = makeValidPack();
    // English text is missing the 'hook' section
    const enText = pack.lessons['lesson-1'].text!['en'] as any;
    delete enText.hook;

    const report = validatePack(pack);
    expect(report.valid).toBe(true); // Still valid! Spanish fallback handles it
    expect(report.warnings.some((w) => w.field === 'hook' && w.message.includes('will fall back to Spanish'))).toBe(true);
  });

  it('Scenario: Missing required section in Spanish lesson fails validation', () => {
    const pack = makeValidPack();
    const esText = pack.lessons['lesson-1'].text!['es'] as any;
    delete esText.why;

    const report = validatePack(pack);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.field === 'why' && e.message.includes('missing why section'))).toBe(true);
  });

  it('Scenario: Unknown Minigame fails and lists supported values', () => {
    const pack = makeValidPack();
    pack.nodes['node-1'].config.simulation = { minigame: 'unknown-minigame' as any };

    const report = validatePack(pack);
    expect(report.valid).toBe(false);
    const err = report.errors.find((e) => e.field === 'simulation.minigame');
    expect(err?.message).toContain('Unknown minigame "unknown-minigame"');
    expect(err?.hint).toContain('Supported minigames are:');
  });

  it('Scenario: Unknown Stage scenario fails and lists supported values', () => {
    const pack = makeValidPack();
    pack.nodes['node-1'].config.simulation = { scenarioName: 'NON_EXISTENT_SCENARIO' };

    const report = validatePack(pack);
    expect(report.valid).toBe(false);
    const err = report.errors.find((e) => e.field === 'simulation.scenarioName');
    expect(err?.message).toContain('Unknown scenario "NON_EXISTENT_SCENARIO"');
    expect(err?.hint).toContain('Supported scenarios are:');
  });

  it('Scenario: New Stage without a release - valid embedded scenario passes', () => {
    const pack = makeValidPack();
    pack.nodes['node-1'].config.simulation = {
      scenario: defaultScenario,
    };

    const report = validatePack(pack);
    expect(report.valid).toBe(true);
    expect(report.errors).toEqual([]);
  });

  it('Scenario: Invalid embedded scenario fails with scenario validation error messages', () => {
    const pack = makeValidPack();
    pack.nodes['node-1'].config.simulation = {
      scenario: {
        ...defaultScenario,
        scenery: [], // Empty scenery violates density rule
      },
    };

    const report = validatePack(pack);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.field === 'simulation.scenario')).toBe(true);
  });

  it('Scenario: Image outside folder or absolute path fails validation', () => {
    const pack = makeValidPack();
    pack.lessons['lesson-1'].config.images = ['../escape.png'];

    const report = validatePack(pack);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.field === 'images' && e.message.includes('leaves item folder'))).toBe(true);
  });

  it('Scenario: Unreachable or duplicate content - duplicate ID reported', () => {
    const pack = makeValidPack();
    // Add a node with the same id as an existing lesson
    pack.nodes['lesson-1'] = {
      config: {
        id: 'lesson-1',
        mode: 'stage',
        prerequisites: [],
      },
      text: { es: { title: 'Duplicate' } },
    };

    const report = validatePack(pack);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.message.includes('Duplicate ID "lesson-1"'))).toBe(true);
  });

  it('Scenario: Unreachable or duplicate content - orphan lesson reported', () => {
    const pack = makeValidPack();
    pack.lessons['orphan-lesson'] = {
      config: {
        id: 'orphan-lesson',
        kind: 'theory',
      },
      text: {
        es: {
          title: 'Orphan',
          heading: 'H',
          hook: 'H',
          why: 'W',
          steps: ['S1'],
          example: { title: 'E', text: 'E' },
          compare: { do: 'D', dont: 'D' },
          tip: 'T',
          takeaways: ['T'],
        },
      },
    };

    const report = validatePack(pack);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.message.includes('Orphan Lesson: "orphan-lesson"'))).toBe(true);
  });

  it('Scenario: Stable identifiers - silent removal without retired declaration fails', () => {
    const pack = makeValidPack();
    const previousManifest = {
      contentVersion: 1,
      items: ['lesson-1', 'node-1', 'mission-1', 'old-node-removed'],
    };

    const report = validatePack(pack, { previousManifest });
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.message.includes('Silent removal: previously published ID "old-node-removed"'))).toBe(true);
  });

  it('Scenario: Stable identifiers - retired content passes validation', () => {
    const pack = makeValidPack();
    // 'old-retired-node' was declared in pack.pack.retired
    const previousManifest = {
      contentVersion: 1,
      items: ['lesson-1', 'node-1', 'mission-1', 'old-retired-node'],
    };

    const report = validatePack(pack, { previousManifest });
    expect(report.valid).toBe(true);
    expect(report.errors).toEqual([]);
  });
});

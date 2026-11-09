import { defaultScenario } from '../../sim/config';
import { validatePack, type ContentPack } from './validator';

function makeValidPack(): ContentPack {
  return {
    pack: {
      formatVersion: 1,
      contentVersion: 1,
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

  describe('Shop and Recommendation validation scenarios', () => {
    function makeValidPackWithShop(): ContentPack {
      const pack = makeValidPack();
      pack.shop = {
        config: {
          categories: ['collares'],
        },
        categories: {
          collares: {
            config: {
              id: 'collares',
              subcategories: ['arneses'],
            },
            text: {
              es: {
                title: 'Collares y arneses',
                description: 'Categoría de collares y arneses',
              },
            },
          },
        },
        subcategories: {
          arneses: {
            config: {
              id: 'arneses',
              products: ['arnes-front'],
            },
            text: {
              es: {
                title: 'Arneses',
                description: 'Subcategoría de arneses',
              },
            },
          },
        },
        products: {
          'arnes-front': {
            config: {
              id: 'arnes-front',
              source: 'manual',
              urls: {
                es: 'https://example.com/es/harness',
              },
              price: '24,99 €',
              priceCheckedAt: '2026-11',
              image: 'media/harness.png',
            },
            text: {
              es: {
                title: 'Arnés Frontal',
                description: 'Arnés anti-tirones',
              },
            },
          },
        },
      };

      pack.lessons['lesson-1'].config.recommendations = [
        { id: 'rec-collar', target: 'collares', when: 'view' },
        { id: 'rec-arnes', target: 'arnes-front', when: 'poste-trouble' },
      ];

      return pack;
    }

    it('Scenario: Valid pack with shop passes validation', () => {
      const pack = makeValidPackWithShop();
      const report = validatePack(pack, { now: new Date('2026-11-08T00:00:00Z') });
      expect(report.valid).toBe(true);
      expect(report.errors).toEqual([]);
      expect(report.warnings).toEqual([]);
    });

    it('Scenario: ID uniqueness across content and shop items', () => {
      const pack = makeValidPackWithShop();
      // Collide category id with existing lesson-1
      pack.shop!.categories!['lesson-1'] = {
        config: { id: 'lesson-1', subcategories: [] },
        text: { es: { title: 'Dup', description: 'Dup' } },
      };
      const report = validatePack(pack);
      expect(report.valid).toBe(false);
      expect(report.errors.some((e) => e.message.includes('Duplicate ID "lesson-1" already defined as a lesson'))).toBe(true);
    });

    it('Scenario: Missing folders - listed category in shop.yaml has no folder', () => {
      const pack = makeValidPackWithShop();
      pack.shop!.config!.categories.push('missing-cat');
      const report = validatePack(pack);
      expect(report.valid).toBe(false);
      expect(report.errors.some((e) => e.message.includes('Category "missing-cat" listed in shop.yaml has no folder'))).toBe(true);
    });

    it('Scenario: Missing folders - listed subcategory in category has no folder', () => {
      const pack = makeValidPackWithShop();
      pack.shop!.categories!['collares'].config.subcategories.push('missing-sub');
      const report = validatePack(pack);
      expect(report.valid).toBe(false);
      expect(report.errors.some((e) => e.message.includes('Subcategory "missing-sub" listed in category "collares" has no folder'))).toBe(true);
    });

    it('Scenario: Missing folders - listed product in subcategory has no folder', () => {
      const pack = makeValidPackWithShop();
      pack.shop!.subcategories!['arneses'].config.products.push('missing-prod');
      const report = validatePack(pack);
      expect(report.valid).toBe(false);
      expect(report.errors.some((e) => e.message.includes('Product "missing-prod" listed in subcategory "arneses" has no folder'))).toBe(true);
    });

    it('Scenario: Orphan Subcategory and Product', () => {
      const pack = makeValidPackWithShop();
      // Add subcategory that belongs to no category
      pack.shop!.subcategories!['orphan-sub'] = {
        config: { id: 'orphan-sub', products: [] },
        text: { es: { title: 'Orphan Sub', description: 'Desc' } },
      };
      // Add product that belongs to no subcategory
      pack.shop!.products!['orphan-prod'] = {
        config: { id: 'orphan-prod', urls: { es: 'https://example.com/p' } },
        text: { es: { title: 'Orphan Prod', description: 'Desc' } },
      };
      const report = validatePack(pack);
      expect(report.valid).toBe(false);
      expect(report.errors.some((e) => e.message.includes('Orphan Subcategory: "orphan-sub"'))).toBe(true);
      expect(report.errors.some((e) => e.message.includes('Orphan Product: "orphan-prod"'))).toBe(true);
    });

    it('Scenario: Non-https buy link fails naming file and field', () => {
      const pack = makeValidPackWithShop();
      pack.shop!.products!['arnes-front'].config.urls = {
        es: 'http://insecure.example.com/harness',
      };
      const report = validatePack(pack);
      expect(report.valid).toBe(false);
      const err = report.errors.find((e) => e.file === 'shop/products/arnes-front/product.yaml' && e.field === 'urls.es');
      expect(err).toBeDefined();
      expect(err?.message).toContain('https address');
    });

    it('Scenario: Missing Spanish buy link fails', () => {
      const pack = makeValidPackWithShop();
      pack.shop!.products!['arnes-front'].config.urls = {
        en: 'https://example.com/en',
      };
      const report = validatePack(pack);
      expect(report.valid).toBe(false);
      expect(report.errors.some((e) => e.field === 'urls.es' && e.message.includes('no buy link in Spanish'))).toBe(true);
    });

    it('Scenario: Warns when Amazon buy link is not on marketplace of its language', () => {
      const pack = makeValidPackWithShop();
      pack.shop!.products!['arnes-front'].config.urls = {
        es: 'https://www.amazon.de/dp/123',
        en: 'https://www.amazon.es/dp/123',
      };
      const report = validatePack(pack);
      const warnEs = report.warnings.find((w) => w.field === 'urls.es');
      const warnEn = report.warnings.find((w) => w.field === 'urls.en');
      expect(warnEs).toBeDefined();
      expect(warnEs?.message).toContain('expected marketplace "amazon.es"');
      expect(warnEn).toBeDefined();
      expect(warnEn?.message).toContain('expected marketplace');
    });

    it('Scenario: Picture path leaves item folder or is absolute', () => {
      const pack = makeValidPackWithShop();
      pack.shop!.products!['arnes-front'].config.image = '../other/photo.png';
      const report = validatePack(pack);
      expect(report.valid).toBe(false);
      expect(report.errors.some((e) => e.field === 'image' && e.message.includes('leaves item folder'))).toBe(true);
    });

    it('Scenario: Recommendation target unknown', () => {
      const pack = makeValidPackWithShop();
      pack.lessons['lesson-1'].config.recommendations = [
        { id: 'rec-unknown', target: 'does-not-exist', when: 'view' },
      ];
      const report = validatePack(pack);
      expect(report.valid).toBe(false);
      const err = report.errors.find((e) => e.field === 'recommendations[0].target');
      expect(err?.message).toContain('names unknown target "does-not-exist"');
    });

    it('Scenario: Recommendation names non-shop item target', () => {
      const pack = makeValidPackWithShop();
      pack.lessons['lesson-1'].config.recommendations = [
        { id: 'rec-node', target: 'node-1', when: 'view' },
      ];
      const report = validatePack(pack);
      expect(report.valid).toBe(false);
      const err = report.errors.find((e) => e.field === 'recommendations[0].target');
      expect(err?.message).toContain('names unknown target "node-1"');
    });

    it('Scenario: Recommendation unknown trigger fails', () => {
      const pack = makeValidPackWithShop();
      pack.lessons['lesson-1'].config.recommendations = [
        { id: 'rec-bad-when', target: 'collares', when: 'invalid-trigger' },
      ];
      const report = validatePack(pack);
      expect(report.valid).toBe(false);
      const err = report.errors.find((e) => e.field === 'recommendations[0].when');
      expect(err?.message).toContain('invalid-trigger');
      expect(err?.hint).toContain('Allowed triggers');
    });

    it('Scenario: Missing Spanish text on shop items fails', () => {
      const pack = makeValidPackWithShop();
      delete pack.shop!.products!['arnes-front'].text?.['es'];
      const report = validatePack(pack);
      expect(report.valid).toBe(false);
      expect(report.errors.some((e) => e.file === 'shop/products/arnes-front/es.md' && e.message.includes('missing required Spanish text'))).toBe(true);
    });

    it('Scenario: Warnings - Missing picture, empty category, old priceCheckedAt, Amazon marketplace', () => {
      const pack = makeValidPackWithShop();
      // Missing picture
      delete pack.shop!.products!['arnes-front'].config.image;
      // Empty category: add 'camas' with no subcategories
      pack.shop!.config!.categories.push('camas');
      pack.shop!.categories!['camas'] = {
        config: { id: 'camas', subcategories: [] },
        text: { es: { title: 'Camas', description: 'Camas para perros' } },
      };
      // Old price checked (> 90 days before 2026-11-08)
      pack.shop!.products!['arnes-front'].config.priceCheckedAt = '2026-05';
      // Amazon link for Spanish on .com
      pack.shop!.products!['arnes-front'].config.urls['es'] = 'https://www.amazon.com/dp/B001';

      const report = validatePack(pack, { now: new Date('2026-11-08T00:00:00Z') });
      expect(report.valid).toBe(true); // Warnings still pass validation!
      expect(report.warnings.some((w) => w.message.includes('has no picture'))).toBe(true);
      expect(report.warnings.some((w) => w.message.includes('has no subcategories'))).toBe(true);
      expect(report.warnings.some((w) => w.message.includes('checked more than 90 days ago'))).toBe(true);
      expect(report.warnings.some((w) => w.message.includes('instead of expected marketplace "amazon.es"'))).toBe(true);
    });
  });
});

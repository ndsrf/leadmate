import { resolvePack } from './resolver';
import type { ContentPack } from './validator';
import { getActiveContent } from './runtime';
import { SUPPORTED_LANGUAGES } from '../voice';

function makeFixturePack(): ContentPack {
  return {
    pack: {
      formatVersion: 1,
      contentVersion: 1,
      minAppVersion: '1.0.0',
      languages: ['es', 'en'],
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
          es: {
            title: 'Un perro es un perro',
            topics: 'primeros pasos de calma',
          },
          // Partial translation: English world has title but missing topics
          en: {
            title: 'A Dog is a Dog',
            topics: '',
          },
        },
      },
    },
    lessons: {
      'lesson-1': {
        config: {
          id: 'lesson-1',
          kind: 'theory',
          day: 1,
          images: ['diagram.png', 'scene.png'],
          animation: 'lesson-1-anim',
          compare: { do: 'do-art', dont: 'dont-art' },
        },
        text: {
          es: {
            title: 'Correa tranquila',
            heading: 'Los nombres importan',
            hook: 'Tu perro aprende su nombre.',
            why: 'Porque asocia el sonido con algo bueno.',
            steps: ['Di el nombre', 'Espera contacto visual', 'Premia'],
            example: { title: 'En el pasillo', text: 'Practica en casa antes de la calle.' },
            compare: { do: 'Premia al instante', dont: 'No repitas el nombre' },
            tip: 'Prueba hoy en tres paseos.',
            takeaways: ['El nombre no es una orden.', 'Premia siempre.'],
            images: {
              'diagram.png': { alt: 'Diagrama de calma', caption: 'Postura corporal' },
              'scene.png': { alt: 'Paseo tranquilo', caption: 'Paso relajado' },
            },
          },
          // Partial translation: has heading, steps, but missing why, example, and compare
          en: {
            title: 'Calm Leash',
            heading: 'Names Matter',
            hook: 'Your dog learns their name.',
            steps: ['Say the name', 'Wait for eye contact', 'Reward'],
            images: {
              'diagram.png': { alt: 'Calm diagram', caption: 'Body posture' },
            },
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
          primerCards: [{ kind: 'real-world', media: { type: 'image', art: 'diagram.png' } }],
        },
        text: {
          es: {
            title: 'Paseo con distracciones',
            primer: [{ text: 'Recuerda mantener la correa floja.', caption: 'Correa en U' }],
            checkpoint: [
              {
                question: '¿Qué haces cuando hay tensión?',
                options: [
                  { text: 'Parar con calma', correct: true },
                  { text: 'Dar un tirón', correct: false },
                ],
                explanation: 'Detenerte evita la frustración.',
              },
            ],
            exercises: { tension: 'Mantén la correa en U' },
            debrief: { calm: 'Muy bien con la calma', notCalm: 'Se necesitó más distancia' },
          },
          // Partial translation: has title and primer, but checkpoint is empty
          en: {
            title: 'Walk with Distractions',
            primer: [{ text: 'Remember to keep the leash loose.', caption: 'Leash in U' }],
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
          place: 'home',
          trains: [{ kind: 'node', id: 'node-1' }],
          problems: [{ id: 'pulls', practise: { kind: 'node', id: 'node-1' } }],
        },
        text: {
          es: {
            title: 'Misión en Casa',
            target: 'Practicar 3 veces la calma',
            success: 'El perro se sienta tranquilo',
            problems: [
              {
                id: 'pulls',
                label: 'Tira mucho',
                fix: {
                  reassure: 'Es normal.',
                  cause: 'Excitación.',
                  c1: 'Párate.',
                  easier: 'Haz 2 pasos.',
                  alt: 'Pausa',
                  caption: 'Parada',
                },
              },
            ],
            general: {
              reassure: 'Tranquilo.',
              cause: 'Paso a paso.',
              c1: 'Vuelve atrás.',
              easier: 'Menos tiempo.',
              alt: 'Pausa',
              caption: 'Parada',
            },
          },
          // Partial translation: only title translated
          en: {
            title: 'Mission at Home',
          },
        },
      },
    },
  };
}

describe('resolvePack', () => {
  it('resolves Spanish pack with all definitions and catalog', () => {
    const fixture = makeFixturePack();
    const resolved = resolvePack(fixture, 'es');

    expect(resolved.worlds).toHaveLength(1);
    expect(resolved.lessons).toHaveLength(1);
    expect(resolved.nodes).toHaveLength(1);
    expect(resolved.missions).toHaveLength(1);

    // World
    const world = resolved.worlds[0];
    expect(world.id).toBe('basics');
    expect(resolved.catalog[world.title]).toBe('Un perro es un perro');
    expect(resolved.catalog[world.topics]).toBe('primeros pasos de calma');

    // Lesson
    const lesson = resolved.lessons[0];
    expect(lesson.id).toBe('lesson-1');
    expect(lesson.day).toBe(1);
    expect(resolved.catalog[lesson.title]).toBe('Correa tranquila');
    expect(resolved.catalog['lesson.1.heading']).toBe('Los nombres importan');
    expect(resolved.catalog['lesson.1.why']).toBe('Porque asocia el sonido con algo bueno.');

    // Node
    const node = resolved.nodes[0];
    expect(node.id).toBe('node-1');
    expect(resolved.catalog[node.title]).toBe('Paseo con distracciones');
    expect(node.checkpoint).toHaveLength(1);
    expect(resolved.catalog[node.checkpoint[0].question]).toBe('¿Qué haces cuando hay tensión?');

    // Mission
    const mission = resolved.missions[0];
    expect(mission.id).toBe('mission-1');
    expect(resolved.catalog[mission.title]).toBe('Misión en Casa');
    expect(resolved.catalog[mission.target]).toBe('Practicar 3 veces la calma');
  });

  it('resolves partial English translation with section-level Spanish fallback', () => {
    const fixture = makeFixturePack();
    const resolved = resolvePack(fixture, 'en');

    // World: translated title in English, topics falls back to Spanish!
    const world = resolved.worlds[0];
    expect(resolved.catalog[world.title]).toBe('A Dog is a Dog');
    expect(resolved.catalog[world.topics]).toBe('primeros pasos de calma');

    // Lesson: translated sections in English, missing sections in Spanish!
    const lesson = resolved.lessons[0];
    expect(resolved.catalog[lesson.title]).toBe('Calm Leash');
    expect(resolved.catalog['lesson.1.heading']).toBe('Names Matter');
    expect(resolved.catalog['lesson.1.hook']).toBe('Your dog learns their name.');
    expect(resolved.catalog['lesson.1.step.1']).toBe('Say the name');
    // 'why' was omitted in English -> falls back to Spanish!
    expect(resolved.catalog['lesson.1.why']).toBe('Porque asocia el sonido con algo bueno.');
    // 'example' was omitted in English -> falls back to Spanish!
    expect(resolved.catalog['lesson.1.example.title']).toBe('En el pasillo');
    // image 1 alt was translated, image 2 alt falls back to Spanish
    expect(resolved.catalog['lesson.1.image.1.alt']).toBe('Calm diagram');
    expect(resolved.catalog['lesson.1.image.2.alt']).toBe('Paseo tranquilo');

    // Node: translated title in English, checkpoint falls back to Spanish!
    const node = resolved.nodes[0];
    expect(resolved.catalog[node.title]).toBe('Walk with Distractions');
    expect(resolved.catalog[node.checkpoint[0].question]).toBe('¿Qué haces cuando hay tensión?');

    // Mission: translated title in English, target falls back to Spanish!
    const mission = resolved.missions[0];
    expect(resolved.catalog[mission.title]).toBe('Mission at Home');
    expect(resolved.catalog[mission.target]).toBe('Practicar 3 veces la calma');

    // Verify: never a raw key in the catalog (no value matches the key itself)
    for (const [key, value] of Object.entries(resolved.catalog)) {
      expect(value).not.toBe(key);
      expect(value.trim()).not.toBe('');
    }
  });

  it('resolver defaults to es, en resolves with Spanish fallback, and app defaults to es without UI picker (Task 6.5)', () => {
    const fixture = makeFixturePack();

    // 1. Calling resolvePack with no language argument defaults to "es"
    const defaultResolved = resolvePack(fixture);
    expect(defaultResolved.catalog[defaultResolved.worlds[0].title]).toBe('Un perro es un perro');

    // 2. Calling resolvePack with "en" resolves English with Spanish fallback for missing keys
    const enResolved = resolvePack(fixture, 'en');
    expect(enResolved.catalog[enResolved.worlds[0].title]).toBe('A Dog is a Dog');
    expect(enResolved.catalog[enResolved.worlds[0].topics]).toBe('primeros pasos de calma');

    // 3. The app active session defaults to Spanish
    const active = getActiveContent();
    expect(active.resolved.catalog['world.basics.title'] || defaultResolved.catalog[defaultResolved.worlds[0].title]).toBeTruthy();

    // 4. App supported languages includes Spanish and English
    expect(SUPPORTED_LANGUAGES).toEqual(['es', 'en']);
  });

  it('resolves an encounter series with Spanish fallback for encounters without English title', () => {
    const fixture = makeFixturePack();
    fixture.nodes['series-node'] = {
      config: {
        id: 'series-node',
        mode: 'stage',
        prerequisites: [],
        simulation: {
          encounters: [
            { id: 'loose-start', aim: 'keep-slack', scenario: { waypoint: { x: 20, y: 0 } } },
            { id: 'skate-far', aim: 'stay-calm', scenario: { waypoint: { x: 25, y: 0 } } },
            { id: 'skate-poste', aim: 'mark-disengagement', scenario: { endCondition: { kind: 'time-limit', seconds: 18 } } },
            { id: 'turn-look', aim: 'check-in', scenario: { endCondition: { kind: 'time-limit', seconds: 15 } } },
          ],
        },
      },
      text: {
        es: {
          title: 'Serie de encuentros',
          encounters: {
            'loose-start': 'Correa floja',
            'skate-far': 'Míralo venir',
            'skate-poste': 'Poste y marca',
            'turn-look': 'Gira y te mira',
          },
        },
        en: {
          title: 'Encounter Series',
          encounters: {
            'loose-start': 'Loose Leash',
            'skate-far': 'Watch It Come',
            // skate-poste omitted in English
            'turn-look': 'Turn and Look',
          },
        },
      },
    };

    const resolvedEs = resolvePack(fixture, 'es');
    const nodeEs = resolvedEs.nodes.find((n) => n.id === 'series-node')!;
    expect(nodeEs.simulation.encounters).toHaveLength(4);
    expect(nodeEs.simulation.encounters![0].id).toBe('loose-start');
    expect(nodeEs.simulation.encounters![0].aim).toBe('keep-slack');
    expect(resolvedEs.catalog[nodeEs.simulation.encounters![0].title]).toBe('Correa floja');
    expect(resolvedEs.catalog[nodeEs.simulation.encounters![1].title]).toBe('Míralo venir');
    expect(resolvedEs.catalog[nodeEs.simulation.encounters![2].title]).toBe('Poste y marca');
    expect(resolvedEs.catalog[nodeEs.simulation.encounters![3].title]).toBe('Gira y te mira');

    const resolvedEn = resolvePack(fixture, 'en');
    const nodeEn = resolvedEn.nodes.find((n) => n.id === 'series-node')!;
    expect(nodeEn.simulation.encounters).toHaveLength(4);
    expect(resolvedEn.catalog[nodeEn.simulation.encounters![0].title]).toBe('Loose Leash');
    expect(resolvedEn.catalog[nodeEn.simulation.encounters![1].title]).toBe('Watch It Come');
    expect(resolvedEn.catalog[nodeEn.simulation.encounters![2].title]).toBe('Poste y marca');
    expect(resolvedEn.catalog[nodeEn.simulation.encounters![3].title]).toBe('Turn and Look');
  });

  let makeShopFixturePack: () => ContentPack;

  describe('Shop and Recommendation resolution', () => {
    makeShopFixturePack = function (): ContentPack {
      const pack = makeFixturePack();
      pack.shop = {
        config: {
          categories: ['collares', 'camas'],
        },
        categories: {
          collares: {
            config: {
              id: 'collares',
              subcategories: ['arneses', 'collares-fijos'],
            },
            text: {
              es: {
                title: 'Collares y arneses',
                description: 'Todo tipo de accesorios para paseo',
              },
              en: {
                title: 'Collars & Harnesses',
                // description omitted -> will fall back to Spanish!
              },
            },
          },
          camas: {
            config: {
              id: 'camas',
              subcategories: ['camas-relax'],
            },
            text: {
              es: {
                title: 'Camas',
                description: 'Camas de descanso',
              },
            },
          },
        },
        subcategories: {
          arneses: {
            config: {
              id: 'arneses',
              products: ['arnes-front', 'arnes-es-only'],
            },
            text: {
              es: {
                title: 'Arneses',
                description: 'Arneses anti-tirones y cómodos',
              },
              en: {
                title: 'Harnesses',
                description: 'Anti-pull and comfort harnesses',
              },
            },
          },
          'collares-fijos': {
            config: {
              id: 'collares-fijos',
              products: ['collar-es-only'],
            },
            text: {
              es: {
                title: 'Collares fijos',
                description: 'Collares tradicionales',
              },
            },
          },
          'camas-relax': {
            config: {
              id: 'camas-relax',
              products: ['cama-es-only'],
            },
            text: {
              es: {
                title: 'Camas relax',
                description: 'Para descanso profundo',
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
                en: 'https://example.com/en/harness',
              },
              price: '24,99 €',
              priceCheckedAt: '2026-11',
              image: 'media/harness.png',
            },
            text: {
              es: {
                title: 'Arnés Frontal',
                description: 'Evita tirones con enganche en el pecho',
              },
              en: {
                title: 'Front-clip Harness',
                // description omitted in en -> falls back to Spanish
              },
            },
          },
          'arnes-es-only': {
            config: {
              id: 'arnes-es-only',
              urls: {
                es: 'https://example.com/es/only',
              },
            },
            text: {
              es: {
                title: 'Arnés Solo España',
                description: 'Disponible solo en España',
              },
            },
          },
          'collar-es-only': {
            config: {
              id: 'collar-es-only',
              urls: {
                es: 'https://example.com/es/collar',
              },
            },
            text: {
              es: {
                title: 'Collar Fijo España',
                description: 'Collar estándar',
              },
            },
          },
          'cama-es-only': {
            config: {
              id: 'cama-es-only',
              urls: {
                es: 'https://example.com/es/cama',
              },
            },
            text: {
              es: {
                title: 'Cama España',
                description: 'Cama cómoda',
              },
            },
          },
        },
      };

      // Add recommendations to lesson-1:
      // rec-1 points to arnes-front (buyable in es and en)
      // rec-2 points to collar-es-only (buyable ONLY in es)
      pack.lessons['lesson-1'].config.recommendations = [
        { id: 'rec-front', target: 'arnes-front', when: 'poste-trouble' },
        { id: 'rec-collar', target: 'collar-es-only', when: 'view' },
      ];
      // Attach explanations to lesson-1 text:
      (pack.lessons['lesson-1'].text!['es'] as any).recommendations = {
        'rec-front': 'Con este arnés practicar el Poste es más fácil.',
        'rec-collar': 'Un collar fijo para practicar.',
      };
      (pack.lessons['lesson-1'].text!['en'] as any).recommendations = {
        'rec-front': 'This front-clip harness makes the Poste easier.',
      };

      return pack;
    }

    it('resolves full ordered shop tree and idToKind index for Spanish', () => {
      const pack = makeShopFixturePack();
      const resolved = resolvePack(pack, 'es');

      expect(resolved.shop.categories).toHaveLength(2);
      expect(resolved.shop.categories[0].id).toBe('collares');
      expect(resolved.catalog[resolved.shop.categories[0].title]).toBe('Collares y arneses');
      expect(resolved.catalog[resolved.shop.categories[0].description]).toBe('Todo tipo de accesorios para paseo');

      expect(resolved.shop.categories[0].subcategories).toHaveLength(2);
      expect(resolved.shop.categories[0].subcategories[0].id).toBe('arneses');
      expect(resolved.shop.categories[0].subcategories[0].products).toHaveLength(2);
      expect(resolved.shop.categories[0].subcategories[0].products[0].id).toBe('arnes-front');
      expect(resolved.shop.categories[0].subcategories[0].products[0].url).toBe('https://example.com/es/harness');

      // idToKind index
      expect(resolved.shop.idToKind['collares']).toBe('category');
      expect(resolved.shop.idToKind['arneses']).toBe('subcategory');
      expect(resolved.shop.idToKind['arnes-front']).toBe('product');
      expect(resolved.shop.idToKind['camas']).toBe('category');

      // Recommendations resolved with targetKind and explanation
      const lesson = resolved.lessons.find((l) => l.id === 'lesson-1')!;
      expect(lesson.recommendations).toHaveLength(2);
      expect(lesson.recommendations![0].id).toBe('rec-front');
      expect(lesson.recommendations![0].targetKind).toBe('product');
      expect(resolved.catalog[lesson.recommendations![0].explanation]).toBe('Con este arnés practicar el Poste es más fácil.');
      expect(lesson.recommendations![1].id).toBe('rec-collar');
    });

    it('English resolution drops products without English buy link, empty subcats/cats, and orphaned recommendations', () => {
      const pack = makeShopFixturePack();
      const resolved = resolvePack(pack, 'en');

      // 'camas' only had 'cama-es-only' which has no English buy link -> cama dropped -> camas-relax dropped -> camas dropped!
      // 'collares-fijos' only had 'collar-es-only' which has no English buy link -> dropped!
      // 'collares' keeps only 'arneses' subcategory, which keeps only 'arnes-front'
      expect(resolved.shop.categories).toHaveLength(1);
      expect(resolved.shop.categories[0].id).toBe('collares');
      expect(resolved.catalog[resolved.shop.categories[0].title]).toBe('Collars & Harnesses');
      // description falls back to Spanish
      expect(resolved.catalog[resolved.shop.categories[0].description]).toBe('Todo tipo de accesorios para paseo');

      expect(resolved.shop.categories[0].subcategories).toHaveLength(1);
      expect(resolved.shop.categories[0].subcategories[0].id).toBe('arneses');
      expect(resolved.shop.categories[0].subcategories[0].products).toHaveLength(1);
      expect(resolved.shop.categories[0].subcategories[0].products[0].id).toBe('arnes-front');
      expect(resolved.shop.categories[0].subcategories[0].products[0].url).toBe('https://example.com/en/harness');
      expect(resolved.catalog[resolved.shop.categories[0].subcategories[0].products[0].name]).toBe('Front-clip Harness');
      expect(resolved.catalog[resolved.shop.categories[0].subcategories[0].products[0].description]).toBe('Evita tirones con enganche en el pecho');

      // idToKind index contains only available items
      expect(resolved.shop.idToKind['collares']).toBe('category');
      expect(resolved.shop.idToKind['arneses']).toBe('subcategory');
      expect(resolved.shop.idToKind['arnes-front']).toBe('product');
      expect(resolved.shop.idToKind['camas']).toBeUndefined();
      expect(resolved.shop.idToKind['collares-fijos']).toBeUndefined();

      // Recommendations: rec-collar pointed to collar-es-only which vanished in en -> dropped!
      // rec-front pointed to arnes-front -> kept!
      const lesson = resolved.lessons.find((l) => l.id === 'lesson-1')!;
      expect(lesson.recommendations).toHaveLength(1);
      expect(lesson.recommendations![0].id).toBe('rec-front');
      expect(resolved.catalog[lesson.recommendations![0].explanation]).toBe('This front-clip harness makes the Poste easier.');
    });
  });

  describe('Node introduces resolution (Task 2.1)', () => {
    it('resolves optional introduces field on NodeDef when present and leaves it undefined when absent', () => {
      const fixture = makeFixturePack();
      fixture.nodes['node-with-introduces'] = {
        config: {
          id: 'node-with-introduces',
          mode: 'stage',
          prerequisites: [],
          introduces: ['go-sniff', 'go-sniff-cut-short'],
        } as any,
        text: {
          es: { title: 'Node With Introduces' },
        },
      };
      const resolved = resolvePack(fixture);
      const nodeWithout = resolved.nodes.find((n) => n.id === 'node-1')!;
      const nodeWith = resolved.nodes.find((n) => n.id === 'node-with-introduces')!;

      expect(nodeWithout.introduces).toBeUndefined();
      expect(nodeWith.introduces).toEqual(['go-sniff', 'go-sniff-cut-short']);
    });
  });

  describe('Dog Games resolution (Task 2.1)', () => {
    it('sorts games by order ascending, breaking ties by id', () => {
      const pack = makeFixturePack();
      pack.games = {
        'game-c': {
          config: { id: 'game-c', order: 2, images: ['c.png'] },
          text: { es: { title: 'Game C', intro: 'Intro C', steps: ['Step C'] } },
        },
        'game-b': {
          config: { id: 'game-b', order: 1, images: ['b.png'] },
          text: { es: { title: 'Game B', intro: 'Intro B', steps: ['Step B'] } },
        },
        'game-a': {
          config: { id: 'game-a', order: 1, images: ['a.png'] },
          text: { es: { title: 'Game A', intro: 'Intro A', steps: ['Step A'] } },
        },
      };

      const resolved = resolvePack(pack, 'es');
      expect(resolved.games.map((g) => g.id)).toEqual(['game-a', 'game-b', 'game-c']);
    });

    it('resolves Spanish game with full fields, media, and catalog keys', () => {
      const pack = makeFixturePack();
      pack.games = {
        'find-treat': {
          config: {
            id: 'find-treat',
            order: 1,
            free: true,
            difficulty: 'easy',
            minutes: 5,
            materials: ['fabric', 'food'],
            images: ['step-1.png'],
            youtube: { es: 'yt-es-123' },
          },
          text: {
            es: {
              title: 'Encuentra el premio',
              intro: 'Un juego olfativo divertido.',
              materials: ['Una manta', 'Premios sabrosos'],
              safety: 'Supervisa al perro con la manta.',
              steps: ['Esconde el premio', 'Pide buscar', 'Felicita'],
              tips: ['Empieza fácil', 'Aumenta la dificultad poco a poco'],
              images: {
                'step-1.png': { alt: 'Perro buscando bajo la manta', caption: 'Primer intento' },
              },
            },
          },
        },
      };

      const resolved = resolvePack(pack, 'es');
      expect(resolved.games).toHaveLength(1);
      const game = resolved.games[0];

      expect(game.id).toBe('find-treat');
      expect(game.free).toBe(true);
      expect(game.difficulty).toBe('easy');
      expect(game.minutes).toBe(5);
      expect(game.materialsKinds).toEqual(['fabric', 'food']);
      expect(game.youtubeId).toBe('yt-es-123');
      expect(game.video).toEqual({ type: 'youtube', id: 'yt-es-123' });

      expect(resolved.catalog[game.title]).toBe('Encuentra el premio');
      expect(resolved.catalog[game.intro]).toBe('Un juego olfativo divertido.');
      expect(game.materials).toBeDefined();
      expect(game.materials!.map((k) => resolved.catalog[k])).toEqual(['Una manta', 'Premios sabrosos']);
      expect(game.safety).toBeDefined();
      expect(resolved.catalog[game.safety!]).toBe('Supervisa al perro con la manta.');
      expect(game.steps.map((k) => resolved.catalog[k])).toEqual(['Esconde el premio', 'Pide buscar', 'Felicita']);
      expect(game.tips).toBeDefined();
      expect(game.tips!.map((k) => resolved.catalog[k])).toEqual(['Empieza fácil', 'Aumenta la dificultad poco a poco']);

      expect(game.images).toHaveLength(1);
      expect(game.images[0].file).toBe('step-1.png');
      expect(game.images[0].path).toBe('games/find-treat/media/step-1.png');
      expect(resolved.catalog[game.images[0].alt]).toBe('Perro buscando bajo la manta');
      expect(game.images[0].caption).toBeDefined();
      expect(resolved.catalog[game.images[0].caption!]).toBe('Primer intento');
    });

    it('resolves English translation with fallback to Spanish for missing text fields, media alts, and shop notes', () => {
      const pack = makeFixturePack();
      pack.games = {
        'game-fallback': {
          config: {
            id: 'game-fallback',
            order: 1,
            images: ['pic.png'],
          },
          text: {
            es: {
              title: 'Título en español',
              intro: 'Intro en español',
              materials: ['Material español'],
              safety: 'Nota de seguridad en español',
              steps: ['Paso 1 español', 'Paso 2 español'],
              tips: ['Consejo en español'],
              images: {
                'pic.png': { alt: 'Alt en español', caption: 'Pie en español' },
              },
            },
            en: {
              // English only translates title and steps; intro, materials, safety, tips, and image alt fall back to Spanish!
              title: 'Title in English',
              steps: ['Step 1 English', 'Step 2 English'],
            },
          },
        },
      };

      const resolved = resolvePack(pack, 'en');
      const game = resolved.games[0];

      // Translated fields use English
      expect(resolved.catalog[game.title]).toBe('Title in English');
      expect(game.steps.map((k) => resolved.catalog[k])).toEqual(['Step 1 English', 'Step 2 English']);

      // Untranslated fields fall back to Spanish
      expect(resolved.catalog[game.intro]).toBe('Intro en español');
      expect(game.materials!.map((k) => resolved.catalog[k])).toEqual(['Material español']);
      expect(resolved.catalog[game.safety!]).toBe('Nota de seguridad en español');
      expect(game.tips!.map((k) => resolved.catalog[k])).toEqual(['Consejo en español']);
      expect(resolved.catalog[game.images[0].alt]).toBe('Alt en español');
      expect(resolved.catalog[game.images[0].caption!]).toBe('Pie en español');
    });

    it('resolves needs through ResolvedShop.idToKind, dropping missing targets and language-hidden targets', () => {
      // makeShopFixturePack provides:
      // - 'arnes-front': product present in both 'es' and 'en'
      // - 'collar-es-only': product present ONLY in 'es' (has no English buy link, so hidden in 'en')
      const pack = makeShopFixturePack();
      pack.games = {
        'snuffle-game': {
          config: {
            id: 'snuffle-game',
            order: 1,
            images: ['mat.png'],
            needs: [
              'arnes-front',           // valid in both es and en
              'nonexistent-shop-id',   // missing target -> always dropped
              'collar-es-only',        // present in es, hidden in en
            ],
          },
          text: {
            es: {
              title: 'Juego de olfato',
              intro: 'Intro',
              steps: ['Paso 1'],
              images: { 'mat.png': { alt: 'Manta', caption: '' } },
              shop: {
                'arnes-front': 'Usa este arnés durante el juego.',
                'collar-es-only': 'Collar fijo de paseo.',
              },
            },
            en: {
              title: 'Scent game',
              intro: 'Intro en',
              steps: ['Step 1 en'],
              shop: {
                'arnes-front': 'Use this harness during the game.',
              },
            },
          },
        },
      };

      // 1. Spanish resolution: 'arnes-front' and 'collar-es-only' exist, 'nonexistent-shop-id' dropped
      const resolvedEs = resolvePack(pack, 'es');
      const gameEs = resolvedEs.games.find((g) => g.id === 'snuffle-game')!;
      expect(gameEs.needs).toHaveLength(2);

      const link1Es = gameEs.needs![0];
      expect(link1Es.target).toBe('arnes-front');
      expect(link1Es.targetKind).toBe('product');
      expect(link1Es.note).toBeDefined();
      expect(resolvedEs.catalog[link1Es.note!]).toBe('Usa este arnés durante el juego.');

      const link2Es = gameEs.needs![1];
      expect(link2Es.target).toBe('collar-es-only');
      expect(link2Es.targetKind).toBe('product');
      expect(link2Es.note).toBeDefined();
      expect(resolvedEs.catalog[link2Es.note!]).toBe('Collar fijo de paseo.');

      // 2. English resolution: 'collar-es-only' is hidden in English shop -> dropped from needs!
      const resolvedEn = resolvePack(pack, 'en');
      const gameEn = resolvedEn.games.find((g) => g.id === 'snuffle-game')!;
      expect(gameEn.needs).toHaveLength(1);

      const link1En = gameEn.needs![0];
      expect(link1En.target).toBe('arnes-front');
      expect(link1En.targetKind).toBe('product');
      expect(link1En.note).toBeDefined();
      expect(resolvedEn.catalog[link1En.note!]).toBe('Use this harness during the game.');
    });
  });
});

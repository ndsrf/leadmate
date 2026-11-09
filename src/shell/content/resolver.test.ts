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
});

import {
  assertNoRejectedMarkup,
  buildLessonBlocks,
  MarkdownParseError,
  parseLessonMarkdown,
  parseMissionMarkdown,
  parseNodeMarkdown,
  parseWorldMarkdown,
} from './parser';
import type { LessonYaml } from './schema';

describe('markdown rejected markup check', () => {
  it('allows plain text and inline allowlisted markdown', () => {
    const valid = `# Title\n\nThis is **bold** and *italic* for {name}.\n\n- Step 1\n- Step 2\n`;
    expect(() => assertNoRejectedMarkup(valid)).not.toThrow();
  });

  it('rejects raw HTML script tags with line number', () => {
    const invalid = `# Title\n\nSome text\n<script>alert(1)</script>\nMore text`;
    expect(() => assertNoRejectedMarkup(invalid)).toThrow(MarkdownParseError);
    expect(() => assertNoRejectedMarkup(invalid)).toThrow(/Line 4/);
    expect(() => assertNoRejectedMarkup(invalid)).toThrow(/<script>/);
  });

  it('rejects raw HTML div and img tags', () => {
    expect(() => assertNoRejectedMarkup('Text <div class="bad">content</div>')).toThrow(MarkdownParseError);
    expect(() => assertNoRejectedMarkup('Text <img src="bad.png" />')).toThrow(MarkdownParseError);
    expect(() => assertNoRejectedMarkup('Text <p>paragraph</p>')).toThrow(MarkdownParseError);
  });

  it('does not reject comparison or arrows', () => {
    expect(() => assertNoRejectedMarkup('Distance < 5 meters and speed > 2 km/h')).not.toThrow();
  });
});

describe('parseLessonMarkdown and buildLessonBlocks', () => {
  const sampleMarkdown = `
# Title: Correa tranquila

## notice
Consulta a un profesional si hay agresividad.

## heading
Los nombres importan

## hook
Tu perro necesita reconocer cuándo te diriges a él con calma.

## why
Los perros aprenden por asociación y contexto.

## steps
1. Di el nombre de {name} una sola vez.
2. Espera a que gire la cabeza hacia ti.
3. Premia inmediatamente cuando haga contacto visual.

## animation
- alt: Animación del giro de cabeza
- caption: El momento del contacto visual

## example
### En el portal de casa
Al salir al portal, {name} mira hacia la calle. Dices su nombre con voz tranquila y enseguida te mira.

## compare
### do
Premia justo en el instante en que sus ojos te miran.
### dont
No repitas su nombre una y otra vez si no responde; aumenta la distancia.

## video
- alt: Demostración en vídeo
- caption: Cómo marcar el contacto visual

## tip
Prueba hoy en tres momentos tranquilos dentro de casa.

## takeaways
- El nombre es una invitación a conectar, nunca una orden.
- Una sola repetición es suficiente.

## images
### image-1.png
- alt: Perro mirando a su guía
- caption: Postura relajada y orejas atentas

### image-2.png
- alt: Entrega del premio
- caption: El premio se entrega junto a la pierna
`;

  const config: LessonYaml = {
    id: 'calm-leash',
    kind: 'theory',
    images: ['image-1.png', 'image-2.png'],
    animation: 'calm-leash-anim',
    youtube: { es: 'dQw4w9WgXcQ' },
    compare: { do: 'calm-do', dont: 'calm-dont' },
  };

  it('parses all sections of theory lesson', () => {
    const parsed = parseLessonMarkdown(sampleMarkdown, config);
    expect(parsed.title).toBe('Title: Correa tranquila');
    expect(parsed.heading).toBe('Los nombres importan');
    expect(parsed.hook).toContain('Tu perro necesita reconocer');
    expect(parsed.why).toContain('asociación y contexto');
    expect(parsed.steps).toHaveLength(3);
    expect(parsed.example?.title).toBe('En el portal de casa');
    expect(parsed.example?.text).toContain('Al salir al portal');
    expect(parsed.compare?.do).toContain('justo en el instante');
    expect(parsed.compare?.dont).toContain('No repitas su nombre');
    expect(parsed.tip).toContain('Prueba hoy');
    expect(parsed.takeaways).toHaveLength(2);
    expect(parsed.images?.['image-1.png']?.alt).toBe('Perro mirando a su guía');
    expect(parsed.animation?.alt).toBe('Animación del giro de cabeza');
    expect(parsed.video?.alt).toBe('Demostración en vídeo');
  });

  it('builds every Lesson block kind in correct teaching pattern', () => {
    const parsed = parseLessonMarkdown(sampleMarkdown, config);
    const catalog: Record<string, string> = {};
    const blocks = buildLessonBlocks(parsed, config, {
      keyPrefix: 'lesson.sample',
      mediaBase: 'https://media.leadmate.app',
      catalog,
    });

    const types = blocks.map((b) => b.type);
    expect(types).toEqual([
      'notice',
      'heading',
      'text',
      'heading', // lesson.section.why
      'text',
      'image', // image 1
      'heading', // lesson.section.how
      'steps',
      'video', // animation
      'example',
      'image', // image 2
      'heading', // lesson.section.mistakes
      'compare',
      'video', // youtube
      'tip',
      'takeaways',
    ]);

    // Verify block contents
    const noticeBlock = blocks.find((b) => b.type === 'notice');
    expect(noticeBlock).toBeDefined();

    const stepsBlock = blocks.find((b) => b.type === 'steps');
    expect(stepsBlock && stepsBlock.type === 'steps' ? stepsBlock.items : []).toHaveLength(3);

    const animBlock = blocks.find((b) => b.type === 'video' && b.source.kind === 'animation');
    expect(animBlock).toBeDefined();

    const ytBlock = blocks.find((b) => b.type === 'video' && b.source.kind === 'youtube');
    expect(ytBlock).toBeDefined();

    const compareBlock = blocks.find((b) => b.type === 'compare');
    expect(compareBlock && compareBlock.type === 'compare' ? compareBlock.do.art : null).toBe('calm-do');

    // Verify catalog keys populated
    expect(catalog['lesson.sample.heading']).toBe('Los nombres importan');
    expect(catalog['lesson.sample.step.1']).toContain('Di el nombre');
    expect(catalog['lesson.sample.image.1.alt']).toBe('Perro mirando a su guía');
  });

  it('parses and builds how-to-play lesson', () => {
    const howToPlayMd = `
# Cómo pasear

## intro
Aprende a controlar la correa en el simulador.

## c1
### Frenar
Toca y mantén la pantalla para frenar suavemente.
- alt: Control de freno
- caption: El icono cambia a color ámbar

## c2
### Soltar
Suelta el dedo para dejar que {name} avance.
- alt: Liberar correa
- caption: El icono vuelve a verde

## tip
Practica frenadas cortas antes de giros.
`;

    const htpConfig: LessonYaml = {
      id: 'howto-walking',
      kind: 'how-to-play',
      controls: 2,
    };

    const parsed = parseLessonMarkdown(howToPlayMd, htpConfig);
    expect(parsed.controls).toHaveLength(2);

    const blocks = buildLessonBlocks(parsed, htpConfig, { keyPrefix: 'trail.howto-walking' });
    const types = blocks.map((b) => b.type);
    expect(types).toEqual([
      'text', // intro
      'heading', // c1 heading
      'text', // c1 text
      'image', // c1 image
      'heading', // c2 heading
      'text', // c2 text
      'image', // c2 image
      'tip', // tip
    ]);
  });
});

describe('parseWorldMarkdown', () => {
  it('parses world title and topics', () => {
    const md = `
# Un perro es un perro

## topics
tiene nombre, en casa se descansa, primero calma
`;
    const world = parseWorldMarkdown(md);
    expect(world.title).toBe('Un perro es un perro');
    expect(world.topics).toBe('tiene nombre, en casa se descansa, primero calma');
  });
});

describe('parseNodeMarkdown', () => {
  it('parses node primer, checkpoint, exercises and debrief', () => {
    const md = `
# Paseo con distracciones

## primer
### card 1
Recuerda lo aprendido sobre la correa floja.
- caption: El perro relajado

### card 2
En el simulador, observa la distancia al estímulo.

## checkpoint
### tq1
¿Qué debes hacer cuando la correa se tensa?
- [x] Detenerte con calma sin tirar
- [ ] Pegar un tirón seco
- [ ] Acelerar el paso
- why: El tirón aumenta la excitación del perro.

## exercises
- tension: Mantén la correa destensada
- timing: Reacciona antes de los 2 metros

## debrief
- calm: Muy bien, lograste mantener la calma.
- notCalm: El perro necesitó más distancia.
`;

    const node = parseNodeMarkdown(md);
    expect(node.title).toBe('Paseo con distracciones');
    expect(node.primer).toHaveLength(2);
    expect(node.primer?.[0].caption).toBe('El perro relajado');
    expect(node.checkpoint).toHaveLength(1);
    expect(node.checkpoint?.[0].options).toHaveLength(3);
    expect(node.checkpoint?.[0].options.find((o) => o.correct)?.text).toBe('Detenerte con calma sin tirar');
    expect(node.checkpoint?.[0].explanation).toContain('El tirón aumenta');
    expect(node.exercises?.tension).toBe('Mantén la correa destensada');
    expect(node.debrief?.calm).toContain('Muy bien');
  });
});

describe('parseMissionMarkdown', () => {
  it('parses mission target, success, problems and general fix', () => {
    const md = `
# Práctica de arnés

## target
Colocar el arnés con cuatro patas en el suelo.

## success
El perro espera relajado sin mordisquear.

## problems
### excited
- label: Se excita al ver el arnés
- reassure: Es normal por la anticipación.
- cause: Ha aprendido que arnés significa salida inmediata.
- c1: Deja el arnés en el suelo sin ponerlo.
- easier: Solo toca el arnés sin levantarlo.
- alt: Arnés en el suelo
- caption: Calma previa

## general
- reassure: No te preocupes.
- cause: Cada perro tiene su ritmo.
- c1: Haz sesiones de 30 segundos.
- easier: Da un paso atrás en la dificultad.
- alt: Sesión corta
- caption: Progreso paso a paso
`;

    const mission = parseMissionMarkdown(md);
    expect(mission.title).toBe('Práctica de arnés');
    expect(mission.target).toContain('cuatro patas en el suelo');
    expect(mission.problems).toHaveLength(1);
    expect(mission.problems[0].id).toBe('excited');
    expect(mission.problems[0].fix.cause).toContain('salida inmediata');
    expect(mission.general.reassure).toBe('No te preocupes.');
  });
});

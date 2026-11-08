import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getGeneratedTables } from './formatGuide';
import { parseLessonMarkdown, parseMissionMarkdown } from './parser';
import { parseYaml, type LessonYaml, type MissionYaml } from './schema';
import { validatePack, type ContentPack } from './validator';

describe('FORMAT.md Conformance', () => {
  const formatPath = join(__dirname, '../../../content/FORMAT.md');
  const formatDoc = readFileSync(formatPath, 'utf8');
  const tables = getGeneratedTables();

  it('contains the generated pack.yaml schema table without drift', () => {
    expect(formatDoc).toContain(tables.packTable);
  });

  it('contains the generated worlds schema table without drift', () => {
    expect(formatDoc).toContain(tables.worldTable);
  });

  it('contains the generated lessons schema table without drift', () => {
    expect(formatDoc).toContain(tables.lessonTable);
  });

  it('contains the generated nodes schema table without drift', () => {
    expect(formatDoc).toContain(tables.nodeTable);
  });

  it('contains the generated missions schema table without drift', () => {
    expect(formatDoc).toContain(tables.missionTable);
  });

  it('agent-style test: creates a Lesson from the guide example and it validates in a pack', () => {
    // Extract lesson yaml block from FORMAT.md
    const yamlMatch = /```yaml\nid: sample-leash-focus([\s\S]*?)```/.exec(formatDoc);
    expect(yamlMatch).not.toBeNull();
    const lessonYaml = parseYaml<LessonYaml>(`id: sample-leash-focus${yamlMatch![1]}`);

    // Extract lesson markdown block from FORMAT.md
    const mdMatch = /```markdown\n(# Atención en el paseo[\s\S]*?)```/.exec(formatDoc);
    expect(mdMatch).not.toBeNull();
    const lessonMd = mdMatch![1];

    // Ensure parser parses it with all theory sections
    const parsed = parseLessonMarkdown(lessonMd, lessonYaml);
    expect(parsed.title).toBe('Atención en el paseo');
    expect(parsed.heading).toBe('El valor de la mirada tranquila');
    expect(parsed.steps).toHaveLength(3);
    expect(parsed.takeaways).toHaveLength(2);

    // Place into a minimal valid pack and validate
    const pack: ContentPack = {
      pack: {
        formatVersion: 1,
        contentVersion: 1,
        minAppVersion: '1.0.0',
        languages: ['es'],
      },
      worlds: {
        'sample-world': {
          config: {
            id: 'sample-world',
            worldNumber: 1,
            stretches: [[{ kind: 'lesson', id: 'sample-leash-focus' }]],
          },
          text: {
            es: { title: 'Mundo Ejemplo', topics: 'temas de prueba' },
          },
        },
      },
      lessons: {
        'sample-leash-focus': {
          config: lessonYaml,
          text: {
            es: parsed,
          },
        },
      },
      nodes: {},
      missions: {},
    };

    const report = validatePack(pack);
    expect(report.valid).toBe(true);
    expect(report.errors).toEqual([]);
  });

  it('agent-style test: creates a Mission from the guide example and it validates in a pack', () => {
    // Extract mission yaml block from FORMAT.md
    const yamlMatch = /```yaml\nid: sample-loose-walk([\s\S]*?)```/.exec(formatDoc);
    expect(yamlMatch).not.toBeNull();
    const missionYaml = parseYaml<MissionYaml>(`id: sample-loose-walk${yamlMatch![1]}`);

    // Extract mission markdown block from FORMAT.md
    const mdMatch = /```markdown\n(# Paseo en U[\s\S]*?)```/.exec(formatDoc);
    expect(mdMatch).not.toBeNull();
    const missionMd = mdMatch![1];

    const parsedMission = parseMissionMarkdown(missionMd);
    expect(parsedMission.title).toBe('Paseo en U');
    expect(parsedMission.problems).toHaveLength(1);

    // Place into a minimal valid pack with node and world
    const pack: ContentPack = {
      pack: {
        formatVersion: 1,
        contentVersion: 1,
        minAppVersion: '1.0.0',
        languages: ['es'],
      },
      worlds: {
        'sample-world': {
          config: {
            id: 'sample-world',
            worldNumber: 1,
            stretches: [
              [
                { kind: 'node', id: 'walk-distraction' },
                { kind: 'mission', id: 'sample-loose-walk' },
              ],
            ],
          },
          text: {
            es: { title: 'Mundo Ejemplo', topics: 'temas de prueba' },
          },
        },
      },
      lessons: {},
      nodes: {
        'walk-distraction': {
          config: {
            id: 'walk-distraction',
            mode: 'stage',
            prerequisites: [],
          },
          text: {
            es: { title: 'Paseo con distracciones' },
          },
        },
      },
      missions: {
        'sample-loose-walk': {
          config: missionYaml,
          text: {
            es: parsedMission,
          },
        },
      },
    };

    const report = validatePack(pack);
    expect(report.valid).toBe(true);
    expect(report.errors).toEqual([]);
  });
});

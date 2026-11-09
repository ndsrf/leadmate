import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getGeneratedTables } from './formatGuide';
import { parseLessonMarkdown, parseMissionMarkdown, parseShopItemMarkdown } from './parser';
import {
  parseYaml,
  type CategoryYaml,
  type LessonYaml,
  type MissionYaml,
  type ProductYaml,
  type SubcategoryYaml,
} from './schema';
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

  it('contains the generated shop.yaml schema table without drift', () => {
    expect(formatDoc).toContain(tables.shopTable);
  });

  it('contains the generated categories schema table without drift', () => {
    expect(formatDoc).toContain(tables.categoryTable);
  });

  it('contains the generated subcategories schema table without drift', () => {
    expect(formatDoc).toContain(tables.subcategoryTable);
  });

  it('contains the generated products schema table without drift', () => {
    expect(formatDoc).toContain(tables.productTable);
  });

  it('contains the generated recommendations schema table without drift', () => {
    expect(formatDoc).toContain(tables.recommendationTable);
  });

  it('fails when a field is removed from the guide (drift detection)', () => {
    const tableWithoutPrice = tables.productTable
      .split('\n')
      .filter((line) => !line.includes('`price`'))
      .join('\n');
    expect(formatDoc).not.toContain(tableWithoutPrice);
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

  it('agent-style test: creates a Shop Category, Subcategory, and Product from the guide example and validates in a pack', () => {
    const catYamlMatch = /```yaml\nid: sample-collares([\s\S]*?)```/.exec(formatDoc);
    expect(catYamlMatch).not.toBeNull();
    const categoryYaml = parseYaml<CategoryYaml>(`id: sample-collares${catYamlMatch![1]}`);

    const catMdMatch = /```markdown\n(# Collares y arneses[\s\S]*?)```/.exec(formatDoc);
    expect(catMdMatch).not.toBeNull();
    const parsedCat = parseShopItemMarkdown(catMdMatch![1]);
    expect(parsedCat.title).toBe('Collares y arneses');

    const subYamlMatch = /```yaml\nid: sample-arneses([\s\S]*?)```/.exec(formatDoc);
    expect(subYamlMatch).not.toBeNull();
    const subcategoryYaml = parseYaml<SubcategoryYaml>(`id: sample-arneses${subYamlMatch![1]}`);

    const subMdMatch = /```markdown\n(# Arneses en Y[\s\S]*?)```/.exec(formatDoc);
    expect(subMdMatch).not.toBeNull();
    const parsedSub = parseShopItemMarkdown(subMdMatch![1]);
    expect(parsedSub.title).toBe('Arneses en Y');

    const prodYamlMatch = /```yaml\nid: sample-arnes-antitiro([\s\S]*?)```/.exec(formatDoc);
    expect(prodYamlMatch).not.toBeNull();
    const productYaml = parseYaml<ProductYaml>(`id: sample-arnes-antitiro${prodYamlMatch![1]}`);

    const prodMdMatch = /```markdown\n(# Arnés ergonómico en Y[\s\S]*?)```/.exec(formatDoc);
    expect(prodMdMatch).not.toBeNull();
    const parsedProd = parseShopItemMarkdown(prodMdMatch![1]);
    expect(parsedProd.title).toBe('Arnés ergonómico en Y');

    const pack: ContentPack = {
      pack: {
        formatVersion: 1,
        minAppVersion: '1.0.0',
        languages: ['es'],
      },
      worlds: {},
      lessons: {},
      nodes: {},
      missions: {},
      shop: {
        config: {
          categories: ['sample-collares'],
        },
        categories: {
          'sample-collares': {
            config: categoryYaml,
            text: { es: parsedCat },
          },
        },
        subcategories: {
          'sample-arneses': {
            config: subcategoryYaml,
            text: { es: parsedSub },
          },
        },
        products: {
          'sample-arnes-antitiro': {
            config: productYaml,
            text: { es: parsedProd },
          },
        },
      },
    };

    const report = validatePack(pack);
    expect(report.valid).toBe(true);
    expect(report.errors).toEqual([]);
  });
});

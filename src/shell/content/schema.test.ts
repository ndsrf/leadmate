import {
  CATEGORY_SCHEMA_FIELDS,
  isContentId,
  isHttpsUrl,
  isRecommendationTrigger,
  isRelativeMediaPath,
  isSemver,
  isYouTubeId,
  parseYaml,
  PRODUCT_SCHEMA_FIELDS,
  RECOMMENDATION_SCHEMA_FIELDS,
  SHOP_SCHEMA_FIELDS,
  SUBCATEGORY_SCHEMA_FIELDS,
  validateCategoryYaml,
  validateLessonYaml,
  validateMissionYaml,
  validateNodeYaml,
  validatePackYaml,
  validateProductYaml,
  validateRecommendationYaml,
  validateShopYaml,
  validateSubcategoryYaml,
  validateWorldYaml,
} from './schema';

describe('schema primitives', () => {
  it('validates content IDs (kebab-case)', () => {
    expect(isContentId('basics')).toBe(true);
    expect(isContentId('calm-hands-1')).toBe(true);
    expect(isContentId('doorbell-mat')).toBe(true);
    expect(isContentId('BadCase')).toBe(false);
    expect(isContentId('under_score')).toBe(false);
    expect(isContentId('has/slash')).toBe(false);
    expect(isContentId('')).toBe(false);
    expect(isContentId(123)).toBe(false);
  });

  it('validates semver strings', () => {
    expect(isSemver('1.0.0')).toBe(true);
    expect(isSemver('0.2.1-beta')).toBe(true);
    expect(isSemver('1.0')).toBe(false);
    expect(isSemver('v1.0.0')).toBe(false);
    expect(isSemver(null)).toBe(false);
  });

  it('validates YouTube 11-char IDs', () => {
    expect(isYouTubeId('dQw4w9WgXcQ')).toBe(true);
    expect(isYouTubeId('abc_123-XYZ')).toBe(true);
    expect(isYouTubeId('tooshort')).toBe(false);
    expect(isYouTubeId('toolongtoolong')).toBe(false);
    expect(isYouTubeId('with spaces')).toBe(false);
  });

  it('validates relative media paths (no escapes)', () => {
    expect(isRelativeMediaPath('image.png')).toBe(true);
    expect(isRelativeMediaPath('media/image.png')).toBe(true);
    expect(isRelativeMediaPath('/absolute/image.png')).toBe(false);
    expect(isRelativeMediaPath('../outside/image.png')).toBe(false);
    expect(isRelativeMediaPath('https://example.com/image.png')).toBe(false);
    expect(isRelativeMediaPath('nested/../bad.png')).toBe(false);
  });

  it('parses YAML content', () => {
    const parsed = parseYaml<{ foo: string }>('foo: bar\n');
    expect(parsed).toEqual({ foo: 'bar' });
  });
});

describe('pack.yaml validation', () => {
  it('accepts valid pack.yaml', () => {
    const valid = {
      formatVersion: 1,
      minAppVersion: '1.0.0',
      languages: ['es', 'en'],
      retired: ['old-node-1'],
    };
    const res = validatePackYaml(valid);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('rejects invalid pack.yaml', () => {
    expect(validatePackYaml(null).valid).toBe(false);
    expect(validatePackYaml({}).valid).toBe(false);
    expect(validatePackYaml({ formatVersion: 0, minAppVersion: '1.0.0', languages: ['es'] }).valid).toBe(false);
    expect(validatePackYaml({ formatVersion: 1, minAppVersion: 'bad', languages: ['es'] }).valid).toBe(false);
    expect(validatePackYaml({ formatVersion: 1, minAppVersion: '1.0.0', languages: ['en'] }).valid).toBe(false); // missing 'es'
    expect(validatePackYaml({ formatVersion: 1, minAppVersion: '1.0.0', languages: ['es'], retired: ['Invalid_ID'] }).valid).toBe(false);
  });
});

describe('world.yaml validation', () => {
  it('accepts valid world.yaml', () => {
    const valid = {
      id: 'basics',
      worldNumber: 1,
      tier: 'free',
      stretches: [
        [
          { kind: 'lesson', id: 'howto-choose-action' },
          { kind: 'node', id: 'calm-hands' },
          { kind: 'mission', id: 'mission-dog-as-dog' },
        ],
      ],
    };
    const res = validateWorldYaml(valid);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('accepts preview world with nodeCount', () => {
    const preview = {
      id: 'recall',
      worldNumber: 6,
      tier: 'plus',
      preview: true,
      nodeCount: 4,
      unlockedBy: 'park',
      stretches: [],
    };
    expect(validateWorldYaml(preview).valid).toBe(true);
  });

  it('rejects invalid world.yaml', () => {
    expect(validateWorldYaml({ id: 'bad ID', worldNumber: 1, stretches: [] }).valid).toBe(false);
    expect(validateWorldYaml({ id: 'world1', worldNumber: 0, stretches: [] }).valid).toBe(false);
    expect(validateWorldYaml({ id: 'world1', worldNumber: 1, tier: 'premium', stretches: [] }).valid).toBe(false);
    expect(
      validateWorldYaml({
        id: 'world1',
        worldNumber: 1,
        stretches: [[{ kind: 'unknown', id: 'bad' }]],
      }).valid,
    ).toBe(false);
  });
});

describe('lesson.yaml validation', () => {
  it('accepts valid lesson.yaml', () => {
    const valid = {
      id: 'calm-leash',
      kind: 'theory',
      day: 1,
      images: ['calm-leash-1.png', 'media/calm-leash-2.png'],
      animation: 'calm-leash-anim',
      youtube: { es: 'dQw4w9WgXcQ' },
      steps: 5,
      takeaways: 3,
    };
    const res = validateLessonYaml(valid);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('rejects invalid lesson.yaml', () => {
    expect(validateLessonYaml({ id: 'Calm', kind: 'theory' }).valid).toBe(false);
    expect(validateLessonYaml({ id: 'calm', kind: 'invalid-kind' }).valid).toBe(false);
    expect(validateLessonYaml({ id: 'calm', kind: 'theory', youtube: { es: 'short' } }).valid).toBe(false);
    expect(validateLessonYaml({ id: 'calm', kind: 'theory', images: ['../escape.png'] }).valid).toBe(false);
    expect(validateLessonYaml({ id: 'calm', kind: 'theory', animation: 'Bad_Anim!' }).valid).toBe(false);
  });
});

describe('node.yaml validation', () => {
  it('accepts valid node.yaml', () => {
    const valid = {
      id: 'walk-distraction',
      mode: 'stage',
      prerequisites: ['poste-practice'],
      simulation: { minigame: 'poste-hold' },
      exercises: [{ metric: 'tension' }, { metric: 'timing' }],
    };
    const res = validateNodeYaml(valid);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('rejects invalid node.yaml', () => {
    expect(validateNodeYaml({ id: 'walk', mode: 'invalid' }).valid).toBe(false);
    expect(validateNodeYaml({ id: 'walk', mode: 'stage', prerequisites: 'not-an-array' }).valid).toBe(false);
    expect(validateNodeYaml({ id: 'walk', mode: 'stage', prerequisites: [], simulation: { minigame: 'unknown-game' } }).valid).toBe(false);
    expect(validateNodeYaml({ id: 'walk', mode: 'stage', prerequisites: [], exercises: [{ metric: 'bad-metric' }] }).valid).toBe(false);
  });
});

describe('mission.yaml validation', () => {
  it('accepts valid mission.yaml', () => {
    const valid = {
      id: 'mission-dog-as-dog',
      technique: 'dog-as-dog',
      reps: 1,
      place: 'home',
      trains: [
        { kind: 'node', id: 'calm-hands' },
        { kind: 'node', id: 'dog-as-dog' },
      ],
      problems: [
        { id: 'cries' },
        { id: 'family' },
        { id: 'bed', practise: { kind: 'lesson', id: 'theory-dog-as-dog' } },
      ],
    };
    const res = validateMissionYaml(valid);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('rejects invalid mission.yaml', () => {
    expect(validateMissionYaml({ id: 'bad', technique: '', reps: 0 }).valid).toBe(false);
    expect(validateMissionYaml({ id: 'mission1', technique: 'tech', reps: 1, trains: [], problems: [] }).valid).toBe(false);
    expect(validateMissionYaml({ id: 'mission1', technique: 'tech', reps: 1, place: 'park', trains: [{ kind: 'node', id: 'n1' }], problems: [{ id: 'p1' }] }).valid).toBe(false);
  });
});

describe('shop schema field documentation', () => {
  it('includes shop kinds and recommendations in schema field tables', () => {
    expect(SHOP_SCHEMA_FIELDS.map((f) => f.name)).toEqual(['categories']);
    expect(CATEGORY_SCHEMA_FIELDS.map((f) => f.name)).toEqual(['id', 'subcategories']);
    expect(SUBCATEGORY_SCHEMA_FIELDS.map((f) => f.name)).toEqual(['id', 'products']);
    expect(PRODUCT_SCHEMA_FIELDS.map((f) => f.name)).toEqual(['id', 'source', 'urls', 'price', 'priceCheckedAt', 'image']);
    expect(RECOMMENDATION_SCHEMA_FIELDS.map((f) => f.name)).toEqual(['id', 'target', 'when']);
  });
});

describe('shop.yaml validation', () => {
  it('accepts valid shop.yaml', () => {
    const res = validateShopYaml({ categories: ['collares', 'camas'] });
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('rejects invalid shop.yaml', () => {
    expect(validateShopYaml(null).valid).toBe(false);
    expect(validateShopYaml({ categories: 'not-an-array' }).valid).toBe(false);
    expect(validateShopYaml({ categories: ['Invalid_ID'] }).valid).toBe(false);
  });
});

describe('category.yaml validation', () => {
  it('accepts valid category.yaml', () => {
    const res = validateCategoryYaml({ id: 'collares', subcategories: ['arneses', 'collares-fijos'] });
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('rejects invalid category.yaml', () => {
    expect(validateCategoryYaml(null).valid).toBe(false);
    expect(validateCategoryYaml({ id: 'Collares', subcategories: [] }).valid).toBe(false);
    expect(validateCategoryYaml({ id: 'collares', subcategories: ['bad ID'] }).valid).toBe(false);
  });
});

describe('subcategory.yaml validation', () => {
  it('accepts valid subcategory.yaml', () => {
    const res = validateSubcategoryYaml({ id: 'arneses', products: ['arnes-anti-tirones'] });
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('rejects invalid subcategory.yaml', () => {
    expect(validateSubcategoryYaml(null).valid).toBe(false);
    expect(validateSubcategoryYaml({ id: 'Arneses', products: [] }).valid).toBe(false);
    expect(validateSubcategoryYaml({ id: 'arneses', products: ['bad ID'] }).valid).toBe(false);
  });
});

describe('product.yaml validation', () => {
  it('accepts valid product.yaml', () => {
    const valid = {
      id: 'arnes-anti-tirones',
      source: 'manual',
      urls: { es: 'https://example.com/es/harness', en: 'https://example.com/en/harness' },
      price: '24,99 €',
      priceCheckedAt: '2026-11',
      image: 'media/harness.png',
    };
    const res = validateProductYaml(valid);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('rejects invalid product.yaml', () => {
    expect(validateProductYaml(null).valid).toBe(false);
    expect(validateProductYaml({ id: 'Bad', urls: { es: 'https://example.com' } }).valid).toBe(false);
    expect(validateProductYaml({ id: 'arnes', source: 'unknown', urls: { es: 'https://example.com' } }).valid).toBe(false);
    expect(validateProductYaml({ id: 'arnes', urls: { en: 'https://example.com' } }).valid).toBe(false);
    expect(validateProductYaml({ id: 'arnes', urls: { es: 'http://insecure.com' } }).valid).toBe(false);
    expect(validateProductYaml({ id: 'arnes', urls: { es: 'https://example.com' }, priceCheckedAt: '2026-99' }).valid).toBe(false);
    expect(validateProductYaml({ id: 'arnes', urls: { es: 'https://example.com' }, image: '../outside.png' }).valid).toBe(false);
  });
});

describe('recommendation validation', () => {
  it('accepts valid triggers and targets', () => {
    expect(isRecommendationTrigger('view')).toBe(true);
    expect(isRecommendationTrigger('poste-trouble')).toBe(true);
    expect(isRecommendationTrigger('poor-score')).toBe(true);
    expect(isRecommendationTrigger('problem:pulls-ahead')).toBe(true);
    expect(isRecommendationTrigger('invalid-trigger')).toBe(false);
    expect(isRecommendationTrigger('problem:')).toBe(false);
    expect(isRecommendationTrigger('problem:Bad_Id')).toBe(false);

    const recs = [
      { id: 'rec-collar', target: 'collares', when: 'view' },
      { id: 'rec-harness', target: 'arneses', when: 'poste-trouble' },
      { id: 'rec-bed', target: 'cama-relax', when: 'poor-score' },
      { id: 'rec-toy', target: 'juguete', when: 'problem:pulls-ahead' },
    ];
    for (const [idx, rec] of recs.entries()) {
      expect(validateRecommendationYaml(rec, `recommendations[${idx}]`)).toEqual([]);
    }
  });

  it('validates recommendations on lessons, nodes, and missions', () => {
    const lesson = {
      id: 'calm-leash',
      kind: 'theory',
      recommendations: [{ id: 'rec-1', target: 'collares', when: 'view' }],
    };
    expect(validateLessonYaml(lesson).valid).toBe(true);

    const badLesson = {
      id: 'calm-leash',
      kind: 'theory',
      recommendations: [{ id: 'rec-1', target: 'collares', when: 'bad-when' }],
    };
    expect(validateLessonYaml(badLesson).valid).toBe(false);
  });
});

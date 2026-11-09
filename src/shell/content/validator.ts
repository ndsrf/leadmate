import { defaultScenario } from '../../sim/config';
import { validateScenario } from '../../sim/scenery';
import {
  parseLessonMarkdown,
  parseMissionMarkdown,
  parseNodeMarkdown,
  parseShopItemMarkdown,
  parseWorldMarkdown,
  type ParsedLessonContent,
  type ParsedMissionContent,
  type ParsedNodeContent,
  type ParsedShopText,
  type ParsedWorldContent,
} from './parser';
import {
  isContentId,
  isHttpsUrl,
  isRecommendationTrigger,
  isRelativeMediaPath,
  isYouTubeId,
  SUPPORTED_METRICS,
  SUPPORTED_MINIGAMES,
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
  type CategoryYaml,
  type LessonYaml,
  type MissionYaml,
  type NodeYaml,
  type PackYaml,
  type ProductYaml,
  type RecommendationYaml,
  type ShopYaml,
  type StopYaml,
  type SubcategoryYaml,
  type ValidationError,
  type WorldYaml,
} from './schema';

export const SUPPORTED_SCENARIO_NAMES = [
  'default',
  'HALLWAY',
  'ELEVATOR_LOBBY',
  'BLIND_CORNER',
  'SLACK_U',
  'LEAVE_IT_INTRO',
  'SCOOTER_CROSSING',
  'URBAN_MIX',
  'PARK_JOGGER',
  'PARK_MIX',
  'NARROW_STREET_PASS',
  'hand-drill',
] as const;

export interface PreviousManifest {
  contentVersion?: number;
  items?: string[]; // IDs of items previously published
  retired?: string[];
}

export interface PackValidationWarning {
  file?: string;
  field?: string;
  message: string;
}

export interface PackValidationReport {
  valid: boolean;
  errors: ValidationError[];
  warnings: PackValidationWarning[];
}

export interface ContentPackShop {
  config?: ShopYaml;
  categories?: Record<
    string,
    {
      config: CategoryYaml;
      text?: Record<string, Partial<ParsedShopText> | string>;
      files?: string[];
    }
  >;
  subcategories?: Record<
    string,
    {
      config: SubcategoryYaml;
      text?: Record<string, Partial<ParsedShopText> | string>;
      files?: string[];
    }
  >;
  products?: Record<
    string,
    {
      config: ProductYaml;
      text?: Record<string, Partial<ParsedShopText> | string>;
      files?: string[];
    }
  >;
}

export interface ContentPack {
  rootPath?: string;
  pack: PackYaml;
  worlds: Record<
    string,
    {
      config: WorldYaml;
      text?: Record<string, Partial<ParsedWorldContent> | string>;
    }
  >;
  lessons: Record<
    string,
    {
      config: LessonYaml;
      text?: Record<string, Partial<ParsedLessonContent> | string>;
      files?: string[];
    }
  >;
  nodes: Record<
    string,
    {
      config: NodeYaml;
      text?: Record<string, Partial<ParsedNodeContent> | string>;
      files?: string[];
    }
  >;
  missions: Record<
    string,
    {
      config: MissionYaml;
      text?: Record<string, Partial<ParsedMissionContent> | string>;
      files?: string[];
    }
  >;
  shop?: ContentPackShop;
}

export interface ValidatePackOptions {
  previousManifest?: PreviousManifest;
  now?: Date;
}

/**
 * Validates a complete Content Pack according to the OpenSpec content-packs specification.
 */
export function validatePack(pack: ContentPack, options: ValidatePackOptions = {}): PackValidationReport {
  const errors: ValidationError[] = [];
  const warnings: PackValidationWarning[] = [];

  // 1. Validate pack.yaml
  const packYamlRes = validatePackYaml(pack.pack);
  errors.push(...packYamlRes.errors);

  const packLanguages = pack.pack?.languages ?? ['es'];
  const retiredSet = new Set(pack.pack?.retired ?? []);

  // Track all IDs for duplicate and orphan detection
  const worldIds = new Set<string>();
  const lessonIds = new Set<string>();
  const nodeIds = new Set<string>();
  const missionIds = new Set<string>();
  const categoryIds = new Set<string>();
  const subcategoryIds = new Set<string>();
  const productIds = new Set<string>();
  const allItemIds = new Map<string, string>(); // id -> itemType

  const registerId = (id: string, type: string, file: string) => {
    if (allItemIds.has(id)) {
      errors.push({
        file,
        field: 'id',
        message: `Duplicate ID "${id}" already defined as a ${allItemIds.get(id)}`,
        hint: 'Use unique IDs across all content items',
      });
    } else {
      allItemIds.set(id, type);
    }
  };

  // 2. Validate Worlds
  for (const [id, worldEntry] of Object.entries(pack.worlds ?? {})) {
    const file = `worlds/${id}.yaml`;
    registerId(id, 'world', file);
    worldIds.add(id);

    const res = validateWorldYaml(worldEntry.config, file);
    errors.push(...res.errors);

    // Text validation (Spanish required)
    const textRecord = worldEntry.text ?? {};
    if (!textRecord['es']) {
      errors.push({
        file: `worlds/${id}/es.md`,
        message: `World "${id}" is missing required Spanish text (es.md)`,
        hint: 'Create worlds/<id>/es.md with title and topics',
      });
    } else {
      const parsedText = typeof textRecord['es'] === 'string' ? parseWorldMarkdown(textRecord['es']) : textRecord['es'];
      if (!parsedText.title || parsedText.title.trim() === '') {
        errors.push({ file: `worlds/${id}/es.md`, field: 'title', message: `World "${id}" missing title in Spanish`, hint: 'Add # <title>' });
      }
      if (!parsedText.topics || parsedText.topics.trim() === '') {
        errors.push({ file: `worlds/${id}/es.md`, field: 'topics', message: `World "${id}" missing topics in Spanish`, hint: 'Add ## topics' });
      }
    }
  }

  // 3. Validate Lessons
  for (const [id, lessonEntry] of Object.entries(pack.lessons ?? {})) {
    const file = `lessons/${id}/lesson.yaml`;
    registerId(id, 'lesson', file);
    lessonIds.add(id);

    const res = validateLessonYaml(lessonEntry.config, file);
    errors.push(...res.errors);

    const cfg = lessonEntry.config;
    // Images: check relative paths
    if (cfg.images) {
      for (const img of cfg.images) {
        if (!isRelativeMediaPath(img) && !img.startsWith('media/') && !/^[a-z0-9_-]+$/.test(img)) {
          errors.push({
            file,
            field: 'images',
            message: `Image reference "${img}" leaves item folder or is invalid`,
            hint: 'Use simple filenames or media/filename without .. or leading /',
          });
        }
      }
    }

    // Text: Spanish required
    const textRecord = lessonEntry.text ?? {};
    let parsedEs: Partial<ParsedLessonContent> | null = null;
    if (!textRecord['es']) {
      errors.push({
        file: `lessons/${id}/es.md`,
        message: `Lesson "${id}" is missing required Spanish text (es.md)`,
        hint: 'Create lessons/<id>/es.md with lesson sections',
      });
    } else {
      try {
        parsedEs = typeof textRecord['es'] === 'string' ? parseLessonMarkdown(textRecord['es'], cfg) : textRecord['es'];
        // Check required sections for theory lessons
        if (cfg.kind === 'theory' && parsedEs) {
          if (!parsedEs.heading && !parsedEs.title) {
            errors.push({ file: `lessons/${id}/es.md`, field: 'heading', message: `Lesson "${id}" missing heading/title in Spanish`, hint: 'Add # Title or ## heading' });
          }
          if (!parsedEs.hook) {
            errors.push({ file: `lessons/${id}/es.md`, field: 'hook', message: `Lesson "${id}" missing hook in Spanish`, hint: 'Add ## hook' });
          }
          if (!parsedEs.why) {
            errors.push({ file: `lessons/${id}/es.md`, field: 'why', message: `Lesson "${id}" missing why section in Spanish`, hint: 'Add ## why' });
          }
          if (!parsedEs.steps || parsedEs.steps.length === 0) {
            errors.push({ file: `lessons/${id}/es.md`, field: 'steps', message: `Lesson "${id}" missing steps in Spanish`, hint: 'Add ## steps' });
          }
          if (!parsedEs.example || !parsedEs.example.text) {
            errors.push({ file: `lessons/${id}/es.md`, field: 'example', message: `Lesson "${id}" missing example in Spanish`, hint: 'Add ## example' });
          }
          if (!parsedEs.compare || !parsedEs.compare.do || !parsedEs.compare.dont) {
            errors.push({ file: `lessons/${id}/es.md`, field: 'compare', message: `Lesson "${id}" missing do/dont compare section in Spanish`, hint: 'Add ## compare with do and dont' });
          }
          if (!parsedEs.tip) {
            errors.push({ file: `lessons/${id}/es.md`, field: 'tip', message: `Lesson "${id}" missing tip in Spanish`, hint: 'Add ## tip' });
          }
          if (!parsedEs.takeaways || parsedEs.takeaways.length === 0) {
            errors.push({ file: `lessons/${id}/es.md`, field: 'takeaways', message: `Lesson "${id}" missing takeaways in Spanish`, hint: 'Add ## takeaways' });
          }
        }
      } catch (err: unknown) {
        errors.push({
          file: `lessons/${id}/es.md`,
          message: err instanceof Error ? err.message : String(err),
          hint: 'Fix Markdown formatting or remove raw HTML',
        });
      }
    }

    // Check language gaps in non-Spanish translations
    for (const lang of packLanguages) {
      if (lang === 'es') continue;
      if (textRecord[lang] && parsedEs) {
        try {
          const parsedLang = typeof textRecord[lang] === 'string' ? parseLessonMarkdown(textRecord[lang], cfg) : textRecord[lang];
          if (cfg.kind === 'theory') {
            const checkSection = (sec: string, valEs: unknown, valLang: unknown) => {
              if (valEs && !valLang) {
                warnings.push({
                  file: `lessons/${id}/${lang}.md`,
                  field: sec,
                  message: `Language gap: section "${sec}" missing in ${lang} - will fall back to Spanish`,
                });
              }
            };
            checkSection('hook', parsedEs.hook, parsedLang.hook);
            checkSection('why', parsedEs.why, parsedLang.why);
            checkSection('steps', parsedEs.steps, parsedLang.steps);
            checkSection('example', parsedEs.example?.text, parsedLang.example?.text);
            checkSection('compare', parsedEs.compare?.do, parsedLang.compare?.do);
            checkSection('tip', parsedEs.tip, parsedLang.tip);
            checkSection('takeaways', parsedEs.takeaways, parsedLang.takeaways);
          }
        } catch (err: unknown) {
          errors.push({
            file: `lessons/${id}/${lang}.md`,
            message: err instanceof Error ? err.message : String(err),
            hint: 'Fix Markdown formatting',
          });
        }
      }
    }
  }

  // 4. Validate Nodes
  for (const [id, nodeEntry] of Object.entries(pack.nodes ?? {})) {
    const file = `nodes/${id}/node.yaml`;
    registerId(id, 'node', file);
    nodeIds.add(id);

    const res = validateNodeYaml(nodeEntry.config, file);
    errors.push(...res.errors);

    const cfg = nodeEntry.config;

    // Simulation checks
    if (cfg.simulation) {
      if (cfg.simulation.minigame && !SUPPORTED_MINIGAMES.includes(cfg.simulation.minigame)) {
        errors.push({
          file,
          field: 'simulation.minigame',
          message: `Unknown minigame "${cfg.simulation.minigame}"`,
          hint: `Supported minigames are: ${SUPPORTED_MINIGAMES.join(', ')}`,
        });
      }

      if (cfg.simulation.scenarioName) {
        if (!SUPPORTED_SCENARIO_NAMES.includes(cfg.simulation.scenarioName as (typeof SUPPORTED_SCENARIO_NAMES)[number])) {
          errors.push({
            file,
            field: 'simulation.scenarioName',
            message: `Unknown scenario "${cfg.simulation.scenarioName}"`,
            hint: `Supported scenarios are: ${SUPPORTED_SCENARIO_NAMES.join(', ')}`,
          });
        }
      }

      // If embedded scenario is provided for a stage, validate with validateScenario
      if (cfg.mode === 'stage' && cfg.simulation.scenario) {
        try {
          const simErrors = validateScenario({ ...defaultScenario, ...cfg.simulation.scenario } as any);
          for (const sErr of simErrors) {
            errors.push({
              file,
              field: 'simulation.scenario',
              message: `Scenario validation error: ${sErr}`,
              hint: 'Adjust scenario configuration to meet physical constraints',
            });
          }
        } catch (err: unknown) {
          errors.push({
            file,
            field: 'simulation.scenario',
            message: `Scenario failed validation: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }
    }

    // Text: Spanish required
    const textRecord = nodeEntry.text ?? {};
    if (!textRecord['es']) {
      errors.push({
        file: `nodes/${id}/es.md`,
        message: `Node "${id}" is missing required Spanish text (es.md)`,
        hint: 'Create nodes/<id>/es.md with title, primer, and checkpoint',
      });
    } else {
      try {
        const parsedNode = typeof textRecord['es'] === 'string' ? parseNodeMarkdown(textRecord['es']) : textRecord['es'];
        if (!parsedNode.title) {
          errors.push({ file: `nodes/${id}/es.md`, field: 'title', message: `Node "${id}" missing title in Spanish`, hint: 'Add # Title' });
        }
      } catch (err: unknown) {
        errors.push({
          file: `nodes/${id}/es.md`,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  // 5. Validate Missions
  for (const [id, missionEntry] of Object.entries(pack.missions ?? {})) {
    const file = `missions/${id}/mission.yaml`;
    registerId(id, 'mission', file);
    missionIds.add(id);

    const res = validateMissionYaml(missionEntry.config, file);
    errors.push(...res.errors);

    // Text: Spanish required
    const textRecord = missionEntry.text ?? {};
    if (!textRecord['es']) {
      errors.push({
        file: `missions/${id}/es.md`,
        message: `Mission "${id}" is missing required Spanish text (es.md)`,
        hint: 'Create missions/<id>/es.md with target and problems',
      });
    } else {
      try {
        const parsedMission = typeof textRecord['es'] === 'string' ? parseMissionMarkdown(textRecord['es']) : textRecord['es'];
        if (!parsedMission.title) {
          errors.push({ file: `missions/${id}/es.md`, field: 'title', message: `Mission "${id}" missing title in Spanish`, hint: 'Add # Title' });
        }
      } catch (err: unknown) {
        errors.push({
          file: `missions/${id}/es.md`,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  // 5.5 Validate Shop
  if (pack.shop) {
    if (pack.shop.config) {
      const res = validateShopYaml(pack.shop.config, 'shop/shop.yaml');
      errors.push(...res.errors);
    }

    // Categories
    for (const [cId, catEntry] of Object.entries(pack.shop.categories ?? {})) {
      const file = `shop/categories/${cId}/category.yaml`;
      registerId(cId, 'category', file);
      categoryIds.add(cId);

      const res = validateCategoryYaml(catEntry.config, file);
      errors.push(...res.errors);

      const textRecord = catEntry.text ?? {};
      if (!textRecord['es']) {
        errors.push({
          file: `shop/categories/${cId}/es.md`,
          message: `Category "${cId}" is missing required Spanish text (es.md)`,
          hint: 'Create shop/categories/<id>/es.md with title and description',
        });
      } else {
        try {
          const parsed = typeof textRecord['es'] === 'string' ? parseShopItemMarkdown(textRecord['es'], file) : textRecord['es'];
          if (!parsed.title || parsed.title.trim() === '') {
            errors.push({
              file: `shop/categories/${cId}/es.md`,
              field: 'title',
              message: `Category "${cId}" missing title in Spanish`,
              hint: 'Add # <title>',
            });
          }
        } catch (err: unknown) {
          errors.push({
            file: `shop/categories/${cId}/es.md`,
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }

      if (!catEntry.config?.subcategories || catEntry.config.subcategories.length === 0) {
        warnings.push({
          file,
          field: 'subcategories',
          message: `Category "${cId}" has no subcategories`,
        });
      }
    }

    // Subcategories
    for (const [sId, subEntry] of Object.entries(pack.shop.subcategories ?? {})) {
      const file = `shop/subcategories/${sId}/subcategory.yaml`;
      registerId(sId, 'subcategory', file);
      subcategoryIds.add(sId);

      const res = validateSubcategoryYaml(subEntry.config, file);
      errors.push(...res.errors);

      const textRecord = subEntry.text ?? {};
      if (!textRecord['es']) {
        errors.push({
          file: `shop/subcategories/${sId}/es.md`,
          message: `Subcategory "${sId}" is missing required Spanish text (es.md)`,
          hint: 'Create shop/subcategories/<id>/es.md with title and description',
        });
      } else {
        try {
          const parsed = typeof textRecord['es'] === 'string' ? parseShopItemMarkdown(textRecord['es'], file) : textRecord['es'];
          if (!parsed.title || parsed.title.trim() === '') {
            errors.push({
              file: `shop/subcategories/${sId}/es.md`,
              field: 'title',
              message: `Subcategory "${sId}" missing title in Spanish`,
              hint: 'Add # <title>',
            });
          }
        } catch (err: unknown) {
          errors.push({
            file: `shop/subcategories/${sId}/es.md`,
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    // Products
    for (const [pId, prodEntry] of Object.entries(pack.shop.products ?? {})) {
      const file = `shop/products/${pId}/product.yaml`;
      registerId(pId, 'product', file);
      productIds.add(pId);

      const res = validateProductYaml(prodEntry.config, file);
      errors.push(...res.errors);

      const cfg = prodEntry.config;
      if (!cfg?.image || cfg.image.trim() === '') {
        warnings.push({
          file,
          field: 'image',
          message: `Product "${pId}" has no picture`,
        });
      } else if (!isRelativeMediaPath(cfg.image)) {
        errors.push({
          file,
          field: 'image',
          message: `Picture path "${cfg.image}" leaves item folder or is an absolute address`,
          hint: 'Use relative media path inside item media/ folder',
        });
      }

      if (!cfg?.urls || !cfg.urls['es']) {
        errors.push({
          file,
          field: 'urls.es',
          message: `Product "${pId}" has no buy link in Spanish`,
          hint: 'Provide urls.es with an https address',
        });
      }
      if (cfg?.urls) {
        for (const [lang, url] of Object.entries(cfg.urls)) {
          if (!isHttpsUrl(url)) {
            errors.push({
              file,
              field: `urls.${lang}`,
              message: `Buy link for language "${lang}" is not an https address: "${url}"`,
              hint: 'Provide an https:// buy link',
            });
          }
          const amzMatch = /https:\/\/(?:www\.)?amazon\.([a-z.]+)/i.exec(url);
          if (amzMatch) {
            const domain = amzMatch[1].toLowerCase();
            if (lang === 'es' && domain !== 'es') {
              warnings.push({
                file,
                field: `urls.${lang}`,
                message: `Amazon buy link for language "${lang}" is on "amazon.${domain}" instead of expected marketplace "amazon.es"`,
              });
            }
          }
        }
      }

      if (cfg?.priceCheckedAt) {
        const parts = cfg.priceCheckedAt.split('-').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const checkDate = new Date(Date.UTC(parts[0], parts[1] - 1, 1));
          const now = options.now ?? new Date();
          const diffDays = (now.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 90) {
            warnings.push({
              file,
              field: 'priceCheckedAt',
              message: `Price for product "${pId}" was checked more than 90 days ago (${cfg.priceCheckedAt})`,
            });
          }
        }
      }

      const textRecord = prodEntry.text ?? {};
      if (!textRecord['es']) {
        errors.push({
          file: `shop/products/${pId}/es.md`,
          message: `Product "${pId}" is missing required Spanish text (es.md)`,
          hint: 'Create shop/products/<id>/es.md with name and description',
        });
      } else {
        try {
          const parsed = typeof textRecord['es'] === 'string' ? parseShopItemMarkdown(textRecord['es'], file) : textRecord['es'];
          if (!parsed.title || parsed.title.trim() === '') {
            errors.push({
              file: `shop/products/${pId}/es.md`,
              field: 'title',
              message: `Product "${pId}" missing name in Spanish`,
              hint: 'Add # <name>',
            });
          }
        } catch (err: unknown) {
          errors.push({
            file: `shop/products/${pId}/es.md`,
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    // Hierarchy reference checks (missing folders)
    for (const catId of pack.shop.config?.categories ?? []) {
      if (!categoryIds.has(catId)) {
        errors.push({
          file: 'shop/shop.yaml',
          field: 'categories',
          message: `Category "${catId}" listed in shop.yaml has no folder in categories/`,
          hint: `Create shop/categories/${catId}/category.yaml`,
        });
      }
    }

    const referencedSubcategories = new Set<string>();
    for (const [cId, catEntry] of Object.entries(pack.shop.categories ?? {})) {
      for (const subId of catEntry.config?.subcategories ?? []) {
        referencedSubcategories.add(subId);
        if (!subcategoryIds.has(subId)) {
          errors.push({
            file: `shop/categories/${cId}/category.yaml`,
            field: 'subcategories',
            message: `Subcategory "${subId}" listed in category "${cId}" has no folder in subcategories/`,
            hint: `Create shop/subcategories/${subId}/subcategory.yaml`,
          });
        }
      }
    }

    const referencedProducts = new Set<string>();
    for (const [sId, subEntry] of Object.entries(pack.shop.subcategories ?? {})) {
      for (const prodId of subEntry.config?.products ?? []) {
        referencedProducts.add(prodId);
        if (!productIds.has(prodId)) {
          errors.push({
            file: `shop/subcategories/${sId}/subcategory.yaml`,
            field: 'products',
            message: `Product "${prodId}" listed in subcategory "${sId}" has no folder in products/`,
            hint: `Create shop/products/${prodId}/product.yaml`,
          });
        }
      }
    }

    // Orphan subcategories & products
    for (const sId of subcategoryIds) {
      if (!referencedSubcategories.has(sId)) {
        errors.push({
          file: `shop/subcategories/${sId}/subcategory.yaml`,
          message: `Orphan Subcategory: "${sId}" does not belong to any Category`,
          hint: `Add "${sId}" to a Category in shop/categories/`,
        });
      }
    }

    for (const pId of productIds) {
      if (!referencedProducts.has(pId)) {
        errors.push({
          file: `shop/products/${pId}/product.yaml`,
          message: `Orphan Product: "${pId}" does not belong to any Subcategory`,
          hint: `Add "${pId}" to a Subcategory in shop/subcategories/`,
        });
      }
    }
  }

  // Recommendations reference checks
  const checkRecommendations = (recs: RecommendationYaml[] | undefined, file: string, itemId: string) => {
    if (!recs) return;
    recs.forEach((rec, idx) => {
      const isShopTarget = categoryIds.has(rec.target) || subcategoryIds.has(rec.target) || productIds.has(rec.target);
      if (!isShopTarget) {
        errors.push({
          file,
          field: `recommendations[${idx}].target`,
          message: `Recommendation "${rec.id}" on "${itemId}" names unknown target "${rec.target}"`,
          hint: `Target must be an existing Product, Subcategory, or Category in the shop`,
        });
      }
      if (!isRecommendationTrigger(rec.when)) {
        errors.push({
          file,
          field: `recommendations[${idx}].when`,
          message: `Recommendation "${rec.id}" names an unknown trigger "${rec.when}"`,
          hint: 'Allowed triggers: "view", "poste-trouble", "poor-score", or "problem:<problem-id>"',
        });
      }
    });
  };

  for (const [id, lEntry] of Object.entries(pack.lessons ?? {})) {
    checkRecommendations(lEntry.config.recommendations, `lessons/${id}/lesson.yaml`, id);
  }
  for (const [id, nEntry] of Object.entries(pack.nodes ?? {})) {
    checkRecommendations(nEntry.config.recommendations, `nodes/${id}/node.yaml`, id);
  }
  for (const [id, mEntry] of Object.entries(pack.missions ?? {})) {
    checkRecommendations(mEntry.config.recommendations, `missions/${id}/mission.yaml`, id);
  }

  // 6. Check Dangling References across the trail
  const trailReferencedLessons = new Set<string>();
  const trailReferencedNodes = new Set<string>();
  const trailReferencedMissions = new Set<string>();

  for (const [wId, worldEntry] of Object.entries(pack.worlds ?? {})) {
    const file = `worlds/${wId}.yaml`;
    if (worldEntry.config.unlockedBy && !worldIds.has(worldEntry.config.unlockedBy)) {
      errors.push({
        file,
        field: 'unlockedBy',
        message: `World "${wId}" unlockedBy references non-existent World "${worldEntry.config.unlockedBy}"`,
        hint: `Available Worlds: ${[...worldIds].join(', ')}`,
      });
    }

    worldEntry.config.stretches?.forEach((stretch, sIdx) => {
      stretch?.forEach((stop, stopIdx) => {
        const location = `stretches[${sIdx}][${stopIdx}]`;
        if (stop.kind === 'lesson') {
          trailReferencedLessons.add(stop.id);
          if (!lessonIds.has(stop.id)) {
            errors.push({
              file,
              field: location,
              message: `Dangling reference: Lesson "${stop.id}" does not exist in pack`,
              hint: `Available lessons: ${[...lessonIds].join(', ')}`,
            });
          }
        } else if (stop.kind === 'node') {
          trailReferencedNodes.add(stop.id);
          if (!nodeIds.has(stop.id)) {
            errors.push({
              file,
              field: location,
              message: `Dangling reference: Node "${stop.id}" does not exist in pack`,
              hint: `Available nodes: ${[...nodeIds].join(', ')}`,
            });
          }
        } else if (stop.kind === 'mission') {
          trailReferencedMissions.add(stop.id);
          if (!missionIds.has(stop.id)) {
            errors.push({
              file,
              field: location,
              message: `Dangling reference: Mission "${stop.id}" does not exist in pack`,
              hint: `Available missions: ${[...missionIds].join(', ')}`,
            });
          }
        }
      });
    });
  }

  // Node prerequisites and opensAfterLesson references
  for (const [nId, nodeEntry] of Object.entries(pack.nodes ?? {})) {
    const file = `nodes/${nId}/node.yaml`;
    for (const prereq of nodeEntry.config.prerequisites ?? []) {
      if (!nodeIds.has(prereq)) {
        errors.push({
          file,
          field: 'prerequisites',
          message: `Node "${nId}" prerequisite "${prereq}" does not exist in pack`,
          hint: `Available nodes: ${[...nodeIds].join(', ')}`,
        });
      }
    }
    if (nodeEntry.config.opensAfterLesson && !lessonIds.has(nodeEntry.config.opensAfterLesson)) {
      errors.push({
        file,
        field: 'opensAfterLesson',
        message: `Node "${nId}" opensAfterLesson references unknown Lesson "${nodeEntry.config.opensAfterLesson}"`,
        hint: `Available lessons: ${[...lessonIds].join(', ')}`,
      });
    }
  }

  // Mission trains and problem practise references
  for (const [mId, missionEntry] of Object.entries(pack.missions ?? {})) {
    const file = `missions/${mId}/mission.yaml`;
    missionEntry.config.trains?.forEach((trainStop, idx) => {
      if (trainStop.kind === 'node' && !nodeIds.has(trainStop.id)) {
        errors.push({
          file,
          field: `trains[${idx}]`,
          message: `Mission "${mId}" trains unknown Node "${trainStop.id}"`,
          hint: `Available nodes: ${[...nodeIds].join(', ')}`,
        });
      } else if (trainStop.kind === 'lesson' && !lessonIds.has(trainStop.id)) {
        errors.push({
          file,
          field: `trains[${idx}]`,
          message: `Mission "${mId}" trains unknown Lesson "${trainStop.id}"`,
          hint: `Available lessons: ${[...lessonIds].join(', ')}`,
        });
      }
    });

    missionEntry.config.problems?.forEach((prob, idx) => {
      if (prob.practise) {
        if (prob.practise.kind === 'node' && !nodeIds.has(prob.practise.id)) {
          errors.push({
            file,
            field: `problems[${idx}].practise`,
            message: `Mission "${mId}" problem "${prob.id}" practises unknown Node "${prob.practise.id}"`,
            hint: `Available nodes: ${[...nodeIds].join(', ')}`,
          });
        } else if (prob.practise.kind === 'lesson' && !lessonIds.has(prob.practise.id)) {
          errors.push({
            file,
            field: `problems[${idx}].practise`,
            message: `Mission "${mId}" problem "${prob.id}" practises unknown Lesson "${prob.practise.id}"`,
            hint: `Available lessons: ${[...lessonIds].join(', ')}`,
          });
        }
      }
    });
  }

  // 7. Check for Orphans (unreachable content)
  // Allowed non-trail lessons: library first-week (day !== undefined), home lessons, or puppy track lessons
  for (const [lId, lessonEntry] of Object.entries(pack.lessons ?? {})) {
    const isLibraryLesson = lessonEntry.config.day !== undefined;
    const isHomeLesson = lId.startsWith('theory-bite-') || lId === 'theory-bark-home' || lId === 'theory-destroy' || lId === 'theory-eat-objects' || lId === 'theory-alone-space';
    const isPuppyLesson = lId.startsWith('puppy-');
    if (!trailReferencedLessons.has(lId) && !isLibraryLesson && !isHomeLesson && !isPuppyLesson) {
      errors.push({
        file: `lessons/${lId}/lesson.yaml`,
        message: `Orphan Lesson: "${lId}" is not placed on any World trail and is not marked as a library or home item`,
        hint: 'Add this lesson to a World stretch or specify a day for Library first-week lessons',
      });
    }
  }

  for (const [nId, nodeEntry] of Object.entries(pack.nodes ?? {})) {
    const isHomeNode = nId === 'calm-hands' || nId === 'bark-home' || nId === 'destroy' || nId === 'eat-objects' || nId === 'alone-door';
    if (!trailReferencedNodes.has(nId) && !isHomeNode) {
      errors.push({
        file: `nodes/${nId}/node.yaml`,
        message: `Orphan Node: "${nId}" is not placed on any World trail and is not a home behaviour node`,
        hint: 'Add this node to a World stretch',
      });
    }
  }

  for (const [mId, missionEntry] of Object.entries(pack.missions ?? {})) {
    const isHomeMission = missionEntry.config.place === 'home';
    if (!trailReferencedMissions.has(mId) && !isHomeMission) {
      errors.push({
        file: `missions/${mId}/mission.yaml`,
        message: `Orphan Mission: "${mId}" is not placed on any World trail and is not marked as place: "home"`,
        hint: 'Add this mission to a World stretch or set place: home',
      });
    }
  }

  // 8. Stable identifiers and retired IDs check against previous manifest
  if (options.previousManifest?.items) {
    for (const prevId of options.previousManifest.items) {
      if (!allItemIds.has(prevId) && !retiredSet.has(prevId)) {
        errors.push({
          file: 'pack.yaml',
          field: 'retired',
          message: `Silent removal: previously published ID "${prevId}" is missing from pack and not declared in retired list`,
          hint: `Add "${prevId}" to "retired" in pack.yaml to protect user progress`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

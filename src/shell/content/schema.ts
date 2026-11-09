import { parse } from 'yaml';

/**
 * OpenSpec Schema definitions for Content Packs.
 *
 * Content Packs organise Worlds, Lessons, Nodes, and Missions into human- and AI-writable
 * plain files in `content/<channel>/`:
 *   pack.yaml
 *   worlds/<world-id>.yaml (or worlds/<world-id>/world.yaml)
 *   lessons/<lesson-id>/{lesson.yaml, es.md, media/}
 *   nodes/<node-id>/{node.yaml, es.md, media/}
 *   missions/<mission-id>/{mission.yaml, es.md, media/}
 */

export const SUPPORTED_MINIGAMES = [
  'poste-hold',
  'harness-ritual',
  'doorbell-mat',
  'barkdoku',
  'dog-as-dog',
  'home-rest',
  'calm-first',
  'bark-home',
  'destroy',
  'eat-objects',
  'alone',
] as const;
export type MinigameKind = (typeof SUPPORTED_MINIGAMES)[number];

export const SUPPORTED_METRICS = ['tension', 'timing', 'poste', 'attention'] as const;
export type Metric = (typeof SUPPORTED_METRICS)[number];

export const STOP_KINDS = ['lesson', 'node', 'mission'] as const;
export type StopKind = (typeof STOP_KINDS)[number];

export const LESSON_KINDS = ['theory', 'how-to-play'] as const;
export type LessonKind = (typeof LESSON_KINDS)[number];

export const NODE_MODES = ['stage', 'minigame', 'close_exercise'] as const;
export type NodeMode = (typeof NODE_MODES)[number];

export const WORLD_TIERS = ['free', 'plus'] as const;
export type WorldTier = (typeof WORLD_TIERS)[number];

export const PRODUCT_SOURCES = ['amazon', 'manual'] as const;
export type ProductSource = (typeof PRODUCT_SOURCES)[number];

export const RECOMMENDATION_TRIGGERS = ['view', 'poste-trouble', 'poor-score'] as const;
export type RecommendationTrigger = (typeof RECOMMENDATION_TRIGGERS)[number] | `problem:${string}`;

// -- Field documentation metadata for FORMAT.md generation -------------------

export interface FieldDoc {
  name: string;
  type: string;
  required: boolean;
  description: string;
  allowedValues?: readonly string[];
}

export const PACK_SCHEMA_FIELDS: readonly FieldDoc[] = [
  { name: 'formatVersion', type: 'number', required: true, description: 'Version of the pack file format (positive integer, e.g. 1)' },
  { name: 'minAppVersion', type: 'string', required: true, description: 'Minimum semver app version required to load this pack (e.g. "1.0.0")' },
  { name: 'languages', type: 'string[]', required: true, description: 'List of language codes in use; must include "es"' },
  { name: 'retired', type: 'string[]', required: false, description: 'List of retired content item IDs to preserve user progress' },
];

export const WORLD_SCHEMA_FIELDS: readonly FieldDoc[] = [
  { name: 'id', type: 'string', required: true, description: 'Unique kebab-case identifier for the World' },
  { name: 'worldNumber', type: 'number', required: true, description: 'Display number (1-based integer)' },
  { name: 'tier', type: 'string', required: false, description: 'Curriculum tier ("free" or "plus")', allowedValues: WORLD_TIERS },
  { name: 'unlockedBy', type: 'string', required: false, description: 'ID of previous World that unlocks this one (absent for World 1)' },
  { name: 'preview', type: 'boolean', required: false, description: 'Whether this World is an unplayable roadmap preview' },
  { name: 'nodeCount', type: 'number', required: false, description: 'Planned Stop count for preview Worlds' },
  { name: 'stretches', type: 'Stop[][]', required: true, description: 'Ordered array of Stretches, each containing ordered Stops' },
];

export const LESSON_SCHEMA_FIELDS: readonly FieldDoc[] = [
  { name: 'id', type: 'string', required: true, description: 'Unique kebab-case identifier for the Lesson' },
  { name: 'kind', type: 'string', required: true, description: 'Lesson kind ("theory" or "how-to-play")', allowedValues: LESSON_KINDS },
  { name: 'day', type: 'number', required: false, description: 'Suggested day (1-5) for Library first-week lessons' },
  { name: 'images', type: 'string[]', required: false, description: 'Bundled art keys or relative image paths in media/' },
  { name: 'compare', type: 'object', required: false, description: 'Optional illustration keys for do and dont mistakes ({ do?: string, dont?: string })' },
  { name: 'animation', type: 'string', required: false, description: 'Lesson Animation key in hosted media bucket' },
  { name: 'youtube', type: 'Record<string, string>', required: false, description: 'Map of language code to 11-char YouTube video ID' },
  { name: 'notice', type: 'string', required: false, description: 'Optional safety notice key or text shown before the Lesson body' },
  { name: 'steps', type: 'number', required: false, description: 'Number of how-to steps (theory lessons, typically 3-6)' },
  { name: 'takeaways', type: 'number', required: false, description: 'Number of takeaway bullet points (typically 2-4)' },
  { name: 'controls', type: 'number', required: false, description: 'Number of control recap sections (for how-to-play lessons)' },
  { name: 'recommendations', type: 'object[]', required: false, description: 'Optional list of shop recommendations ({ id, target, when })' },
];

export const NODE_SCHEMA_FIELDS: readonly FieldDoc[] = [
  { name: 'id', type: 'string', required: true, description: 'Unique kebab-case identifier for the Node' },
  { name: 'mode', type: 'string', required: true, description: 'Node mode ("stage", "minigame", "close_exercise")', allowedValues: NODE_MODES },
  { name: 'prerequisites', type: 'string[]', required: true, description: 'IDs of Nodes that must be completed before this one is available' },
  { name: 'opensAfterLesson', type: 'string', required: false, description: 'Lesson ID whose reading alone unlocks this Node in its Stretch' },
  { name: 'simulation', type: 'object', required: false, description: 'Stage/close scenario config or scenario name, or minigame kind' },
  { name: 'exercises', type: 'object[]', required: false, description: 'Array of exercises targeting metrics ({ metric, key? })' },
  { name: 'primerCards', type: 'object[]', required: false, description: 'Structured recap cards ({ kind, media?, tutorialUrl? })' },
  { name: 'checkpoint', type: 'object[]', required: false, description: 'Quiz questions ({ question, options, explanation })' },
  { name: 'debrief', type: 'object', required: false, description: 'Hand drill debrief text keys ({ calm, notCalm })' },
  { name: 'recommendations', type: 'object[]', required: false, description: 'Optional list of shop recommendations ({ id, target, when })' },
];

export const MISSION_SCHEMA_FIELDS: readonly FieldDoc[] = [
  { name: 'id', type: 'string', required: true, description: 'Unique kebab-case identifier for the Mission' },
  { name: 'technique', type: 'string', required: true, description: 'Technique trained by this Mission' },
  { name: 'reps', type: 'number', required: true, description: 'Target repetition count (positive integer)' },
  { name: 'place', type: 'string', required: false, description: '"home" for missions done at home; absent for walks', allowedValues: ['home'] },
  { name: 'trains', type: 'Stop[]', required: true, description: 'Stops that train the target of this Mission' },
  { name: 'problems', type: 'object[]', required: true, description: 'List of problem items ({ id, label?, practise? })' },
  { name: 'sharedNote', type: 'string', required: false, description: 'Shared safety note key substituted into problem fixes' },
  { name: 'recommendations', type: 'object[]', required: false, description: 'Optional list of shop recommendations ({ id, target, when })' },
];

export const SHOP_SCHEMA_FIELDS: readonly FieldDoc[] = [
  { name: 'categories', type: 'string[]', required: true, description: 'Ordered list of Category IDs in the shop' },
];

export const CATEGORY_SCHEMA_FIELDS: readonly FieldDoc[] = [
  { name: 'id', type: 'string', required: true, description: 'Unique kebab-case identifier for the Category' },
  { name: 'subcategories', type: 'string[]', required: true, description: 'Ordered list of Subcategory IDs in this Category' },
];

export const SUBCATEGORY_SCHEMA_FIELDS: readonly FieldDoc[] = [
  { name: 'id', type: 'string', required: true, description: 'Unique kebab-case identifier for the Subcategory' },
  { name: 'products', type: 'string[]', required: true, description: 'Ordered list of Product IDs in this Subcategory' },
];

export const PRODUCT_SCHEMA_FIELDS: readonly FieldDoc[] = [
  { name: 'id', type: 'string', required: true, description: 'Unique kebab-case identifier for the Product' },
  { name: 'source', type: 'string', required: false, description: 'Product origin ("amazon" or "manual")', allowedValues: PRODUCT_SOURCES },
  { name: 'urls', type: 'Record<string, string>', required: true, description: 'Map of language code to HTTPS buy link (es required)' },
  { name: 'price', type: 'string', required: false, description: 'Optional approximate display price (e.g. "24,99 €")' },
  { name: 'priceCheckedAt', type: 'string', required: false, description: 'Month price was checked in YYYY-MM format' },
  { name: 'image', type: 'string', required: false, description: 'Optional relative media path in media/' },
];

export const RECOMMENDATION_SCHEMA_FIELDS: readonly FieldDoc[] = [
  { name: 'id', type: 'string', required: true, description: 'Unique kebab-case identifier for the Recommendation' },
  { name: 'target', type: 'string', required: true, description: 'Target Product, Subcategory, or Category ID' },
  { name: 'when', type: 'string', required: true, description: 'Trigger condition ("view", "poste-trouble", "poor-score", or "problem:<id>")' },
];

// -- TypeScript Types --------------------------------------------------------

export interface StopYaml {
  kind: StopKind;
  id: string;
}

export interface PackYaml {
  formatVersion: number;
  minAppVersion: string;
  languages: string[];
  retired?: string[];
}

export interface WorldYaml {
  id: string;
  worldNumber: number;
  tier?: WorldTier;
  preview?: boolean;
  nodeCount?: number;
  unlockedBy?: string;
  stretches: StopYaml[][];
}

export interface RecommendationYaml {
  id: string;
  target: string;
  when: string;
}

export interface LessonYaml {
  id: string;
  kind: LessonKind;
  day?: number;
  images?: string[];
  compare?: {
    do?: string;
    dont?: string;
  };
  animation?: string;
  youtube?: Record<string, string>;
  notice?: string;
  steps?: number;
  takeaways?: number;
  controls?: number;
  recommendations?: RecommendationYaml[];
}

export interface NodeYaml {
  id: string;
  mode: NodeMode;
  prerequisites: string[];
  opensAfterLesson?: string;
  simulation?: {
    scenarioName?: string;
    scenario?: any;
    closeScenarioName?: string;
    closeScenario?: any;
    minigame?: MinigameKind;
  };
  exercises?: Array<{
    metric: Metric;
    key?: string;
    n?: number;
  }>;
  primerCards?: Array<{
    kind?: 'real-world' | 'virtual-dog';
    media?: {
      type: 'image' | 'video';
      url?: string;
      art?: string;
      caption?: string;
      placeholder?: boolean;
    };
    tutorialUrl?: string;
  }>;
  checkpoint?: Array<{
    question?: string;
    options?: Array<{ text: string; correct: boolean }>;
    explanation?: string;
  }>;
  debrief?: {
    calm?: string;
    notCalm?: string;
  };
  recommendations?: RecommendationYaml[];
}

export interface MissionYaml {
  id: string;
  technique: string;
  reps: number;
  place?: 'home';
  trains: StopYaml[];
  problems: Array<{
    id: string;
    label?: string;
    practise?: StopYaml;
  }>;
  sharedNote?: string;
  recommendations?: RecommendationYaml[];
}

export interface ShopYaml {
  categories: string[];
}

export interface CategoryYaml {
  id: string;
  subcategories: string[];
}

export interface SubcategoryYaml {
  id: string;
  products: string[];
}

export interface ProductYaml {
  id: string;
  source?: ProductSource;
  urls: Record<string, string>;
  price?: string;
  priceCheckedAt?: string;
  image?: string;
}

// -- Validation Results ------------------------------------------------------

export interface ValidationError {
  file?: string;
  field?: string;
  message: string;
  hint?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// -- Identifier and Primitive Validators -------------------------------------

const ID_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
const YOUTUBE_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const LANG_REGEX = /^[a-z]{2,3}(-[a-zA-Z0-9]+)?$/;

export function isContentId(id: unknown): id is string {
  return typeof id === 'string' && ID_REGEX.test(id);
}

export function isSemver(ver: unknown): ver is string {
  return typeof ver === 'string' && SEMVER_REGEX.test(ver);
}

export function isYouTubeId(id: unknown): id is string {
  return typeof id === 'string' && YOUTUBE_REGEX.test(id);
}

export function isRelativeMediaPath(path: unknown): boolean {
  if (typeof path !== 'string' || path.trim() === '') return false;
  if (path.startsWith('/') || path.includes('\\')) return false;
  if (/^[a-zA-Z]+:\/\//.test(path)) return false;
  const segments = path.split('/');
  return !segments.includes('..') && !segments.includes('.');
}

export function isHttpsUrl(url: unknown): url is string {
  if (typeof url !== 'string' || url.trim() === '') return false;
  return /^https:\/\/[^\s]+$/.test(url.trim());
}

const YEAR_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
export function isYearMonth(value: unknown): value is string {
  return typeof value === 'string' && YEAR_MONTH_REGEX.test(value);
}

export function isRecommendationTrigger(when: unknown): when is string {
  if (typeof when !== 'string') return false;
  if (RECOMMENDATION_TRIGGERS.includes(when as any)) return true;
  if (when.startsWith('problem:')) return isContentId(when.slice('problem:'.length));
  return false;
}

// -- Safe YAML Parsing -------------------------------------------------------

export function parseYaml<T = unknown>(content: string): T {
  return parse(content) as T;
}

// -- Specific YAML Validators ------------------------------------------------

export function validatePackYaml(raw: unknown, file: string = 'pack.yaml'): ValidationResult {
  const errors: ValidationError[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: [{ file, message: 'pack.yaml must be a YAML object', hint: 'Provide key-value pairs at root' }] };
  }
  const obj = raw as Record<string, unknown>;

  if (typeof obj.formatVersion !== 'number' || !Number.isInteger(obj.formatVersion) || obj.formatVersion < 1) {
    errors.push({ file, field: 'formatVersion', message: 'formatVersion must be a positive integer', hint: 'Set formatVersion: 1' });
  }

  if (!isSemver(obj.minAppVersion)) {
    errors.push({ file, field: 'minAppVersion', message: `minAppVersion must be a semver string (e.g. "1.0.0"), got "${String(obj.minAppVersion)}"`, hint: 'Specify semver like "1.0.0"' });
  }

  if (!Array.isArray(obj.languages) || obj.languages.length === 0) {
    errors.push({ file, field: 'languages', message: 'languages must be a non-empty array of strings', hint: 'Specify languages: ["es"]' });
  } else {
    for (const lang of obj.languages) {
      if (typeof lang !== 'string' || !LANG_REGEX.test(lang)) {
        errors.push({ file, field: 'languages', message: `Invalid language code "${String(lang)}"`, hint: 'Use lowercase codes like "es" or "en"' });
      }
    }
    if (!obj.languages.includes('es')) {
      errors.push({ file, field: 'languages', message: 'languages must include "es" (Spanish is required)', hint: 'Add "es" to languages list' });
    }
  }

  if (obj.retired !== undefined) {
    if (!Array.isArray(obj.retired)) {
      errors.push({ file, field: 'retired', message: 'retired must be an array of strings if provided', hint: 'List retired content ids' });
    } else {
      for (const id of obj.retired) {
        if (!isContentId(id)) {
          errors.push({ file, field: 'retired', message: `Invalid retired ID "${String(id)}"`, hint: 'Use lowercase kebab-case for IDs' });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateStopYaml(stop: unknown, location: string, file?: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!stop || typeof stop !== 'object' || Array.isArray(stop)) {
    errors.push({ file, field: location, message: 'Stop must be an object with { kind, id }', hint: 'Example: { kind: "lesson", id: "calm-leash" }' });
    return errors;
  }
  const s = stop as Record<string, unknown>;
  if (!STOP_KINDS.includes(s.kind as StopKind)) {
    errors.push({ file, field: `${location}.kind`, message: `Unknown stop kind "${String(s.kind)}"`, hint: `Expected one of: ${STOP_KINDS.join(', ')}` });
  }
  if (!isContentId(s.id)) {
    errors.push({ file, field: `${location}.id`, message: `Invalid stop ID "${String(s.id)}"`, hint: 'Use lowercase kebab-case for IDs' });
  }
  return errors;
}

export function validateWorldYaml(raw: unknown, file: string = 'world.yaml'): ValidationResult {
  const errors: ValidationError[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: [{ file, message: 'World definition must be a YAML object', hint: 'Provide world properties at root' }] };
  }
  const obj = raw as Record<string, unknown>;

  if (!isContentId(obj.id)) {
    errors.push({ file, field: 'id', message: `Invalid World ID "${String(obj.id)}"`, hint: 'Use lowercase kebab-case (e.g. "basics")' });
  }

  if (typeof obj.worldNumber !== 'number' || !Number.isInteger(obj.worldNumber) || obj.worldNumber < 1) {
    errors.push({ file, field: 'worldNumber', message: 'worldNumber must be a positive integer', hint: 'Set worldNumber: 1, 2, ...' });
  }

  if (obj.tier !== undefined && !WORLD_TIERS.includes(obj.tier as WorldTier)) {
    errors.push({ file, field: 'tier', message: `Invalid tier "${String(obj.tier)}"`, hint: `Expected one of: ${WORLD_TIERS.join(', ')}` });
  }

  if (obj.unlockedBy !== undefined && !isContentId(obj.unlockedBy)) {
    errors.push({ file, field: 'unlockedBy', message: `Invalid unlockedBy ID "${String(obj.unlockedBy)}"`, hint: 'Must be a valid World ID' });
  }

  if (obj.preview !== undefined && typeof obj.preview !== 'boolean') {
    errors.push({ file, field: 'preview', message: 'preview must be boolean', hint: 'Set preview: true or false' });
  }

  if (obj.nodeCount !== undefined && (typeof obj.nodeCount !== 'number' || obj.nodeCount < 0)) {
    errors.push({ file, field: 'nodeCount', message: 'nodeCount must be a non-negative number', hint: 'Set nodeCount: 4' });
  }

  if (!Array.isArray(obj.stretches)) {
    errors.push({ file, field: 'stretches', message: 'stretches must be an array of Stretch arrays', hint: 'stretches: [[{ kind: ..., id: ... }]]' });
  } else {
    obj.stretches.forEach((stretch, i) => {
      if (!Array.isArray(stretch)) {
        errors.push({ file, field: `stretches[${i}]`, message: `Stretch ${i} must be an array of Stops`, hint: 'Provide an array of Stop objects' });
      } else {
        stretch.forEach((stop, j) => {
          errors.push(...validateStopYaml(stop, `stretches[${i}][${j}]`, file));
        });
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

export function validateLessonYaml(raw: unknown, file: string = 'lesson.yaml'): ValidationResult {
  const errors: ValidationError[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: [{ file, message: 'Lesson definition must be a YAML object', hint: 'Provide lesson properties at root' }] };
  }
  const obj = raw as Record<string, unknown>;

  if (!isContentId(obj.id)) {
    errors.push({ file, field: 'id', message: `Invalid Lesson ID "${String(obj.id)}"`, hint: 'Use lowercase kebab-case' });
  }

  if (!LESSON_KINDS.includes(obj.kind as LessonKind)) {
    errors.push({ file, field: 'kind', message: `Invalid Lesson kind "${String(obj.kind)}"`, hint: `Expected one of: ${LESSON_KINDS.join(', ')}` });
  }

  if (obj.day !== undefined && (typeof obj.day !== 'number' || obj.day < 1)) {
    errors.push({ file, field: 'day', message: 'day must be a positive integer', hint: 'Set day: 1, 2, ...' });
  }

  if (obj.images !== undefined) {
    if (!Array.isArray(obj.images)) {
      errors.push({ file, field: 'images', message: 'images must be an array of art keys or relative paths', hint: 'images: ["art-1", "art-2"]' });
    } else {
      for (const img of obj.images) {
        if (typeof img !== 'string' || img.trim() === '') {
          errors.push({ file, field: 'images', message: 'Image reference must be a non-empty string', hint: 'Provide a valid art name or relative path' });
        } else if (img.includes('/') && !isRelativeMediaPath(img)) {
          errors.push({ file, field: 'images', message: `Invalid image path "${img}" (must be relative inside folder, no ".." or "/")`, hint: 'Use simple filenames or media/filename' });
        }
      }
    }
  }

  if (obj.animation !== undefined) {
    if (!isContentId(obj.animation)) {
      errors.push({ file, field: 'animation', message: `Invalid animation key "${String(obj.animation)}"`, hint: 'Must be kebab-case matching animation key format' });
    }
  }

  if (obj.youtube !== undefined) {
    if (!obj.youtube || typeof obj.youtube !== 'object' || Array.isArray(obj.youtube)) {
      errors.push({ file, field: 'youtube', message: 'youtube must be a map of language codes to video IDs', hint: 'youtube: { es: "..." }' });
    } else {
      for (const [lang, id] of Object.entries(obj.youtube as Record<string, unknown>)) {
        if (!LANG_REGEX.test(lang)) {
          errors.push({ file, field: `youtube.${lang}`, message: `Invalid language key "${lang}" in youtube`, hint: 'Use lowercase language code like "es"' });
        }
        if (!isYouTubeId(id)) {
          errors.push({ file, field: `youtube.${lang}`, message: `Invalid YouTube video ID "${String(id)}" (must be 11 characters)`, hint: 'Provide 11-char YouTube ID' });
        }
      }
    }
  }

  if (obj.recommendations !== undefined) {
    if (!Array.isArray(obj.recommendations)) {
      errors.push({ file, field: 'recommendations', message: 'recommendations must be an array of Recommendation objects', hint: 'recommendations: [{ id: "...", target: "...", when: "..." }]' });
    } else {
      obj.recommendations.forEach((rec, idx) => {
        errors.push(...validateRecommendationYaml(rec, `recommendations[${idx}]`, file));
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateNodeYaml(raw: unknown, file: string = 'node.yaml'): ValidationResult {
  const errors: ValidationError[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: [{ file, message: 'Node definition must be a YAML object', hint: 'Provide node properties at root' }] };
  }
  const obj = raw as Record<string, unknown>;

  if (!isContentId(obj.id)) {
    errors.push({ file, field: 'id', message: `Invalid Node ID "${String(obj.id)}"`, hint: 'Use lowercase kebab-case' });
  }

  if (!NODE_MODES.includes(obj.mode as NodeMode)) {
    errors.push({ file, field: 'mode', message: `Invalid Node mode "${String(obj.mode)}"`, hint: `Expected one of: ${NODE_MODES.join(', ')}` });
  }

  if (!Array.isArray(obj.prerequisites)) {
    errors.push({ file, field: 'prerequisites', message: 'prerequisites must be an array of Node IDs', hint: 'prerequisites: [] or list of ids' });
  } else {
    for (const prereq of obj.prerequisites) {
      if (!isContentId(prereq)) {
        errors.push({ file, field: 'prerequisites', message: `Invalid prerequisite Node ID "${String(prereq)}"`, hint: 'Use lowercase kebab-case' });
      }
    }
  }

  if (obj.opensAfterLesson !== undefined && !isContentId(obj.opensAfterLesson)) {
    errors.push({ file, field: 'opensAfterLesson', message: `Invalid opensAfterLesson ID "${String(obj.opensAfterLesson)}"`, hint: 'Must be a valid Lesson ID' });
  }

  if (obj.simulation !== undefined) {
    if (!obj.simulation || typeof obj.simulation !== 'object' || Array.isArray(obj.simulation)) {
      errors.push({ file, field: 'simulation', message: 'simulation must be an object', hint: 'Specify scenarioName, minigame, or config' });
    } else {
      const sim = obj.simulation as Record<string, unknown>;
      if (sim.minigame !== undefined && !SUPPORTED_MINIGAMES.includes(sim.minigame as MinigameKind)) {
        errors.push({ file, field: 'simulation.minigame', message: `Unknown minigame "${String(sim.minigame)}"`, hint: `Supported minigames are: ${SUPPORTED_MINIGAMES.join(', ')}` });
      }
    }
  }

  if (obj.exercises !== undefined) {
    if (!Array.isArray(obj.exercises)) {
      errors.push({ file, field: 'exercises', message: 'exercises must be an array', hint: 'exercises: [{ metric: "tension" }]' });
    } else {
      obj.exercises.forEach((ex, idx) => {
        if (!ex || typeof ex !== 'object' || Array.isArray(ex)) {
          errors.push({ file, field: `exercises[${idx}]`, message: 'Exercise must be an object', hint: 'Specify { metric: ... }' });
        } else {
          const m = (ex as Record<string, unknown>).metric;
          if (!SUPPORTED_METRICS.includes(m as Metric)) {
            errors.push({ file, field: `exercises[${idx}].metric`, message: `Unknown metric "${String(m)}"`, hint: `Expected one of: ${SUPPORTED_METRICS.join(', ')}` });
          }
        }
      });
    }
  }

  if (obj.recommendations !== undefined) {
    if (!Array.isArray(obj.recommendations)) {
      errors.push({ file, field: 'recommendations', message: 'recommendations must be an array of Recommendation objects', hint: 'recommendations: [{ id: "...", target: "...", when: "..." }]' });
    } else {
      obj.recommendations.forEach((rec, idx) => {
        errors.push(...validateRecommendationYaml(rec, `recommendations[${idx}]`, file));
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateMissionYaml(raw: unknown, file: string = 'mission.yaml'): ValidationResult {
  const errors: ValidationError[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: [{ file, message: 'Mission definition must be a YAML object', hint: 'Provide mission properties at root' }] };
  }
  const obj = raw as Record<string, unknown>;

  if (!isContentId(obj.id)) {
    errors.push({ file, field: 'id', message: `Invalid Mission ID "${String(obj.id)}"`, hint: 'Use lowercase kebab-case' });
  }

  if (typeof obj.technique !== 'string' || obj.technique.trim() === '') {
    errors.push({ file, field: 'technique', message: 'technique must be a non-empty string', hint: 'Specify technique name' });
  }

  if (typeof obj.reps !== 'number' || !Number.isInteger(obj.reps) || obj.reps < 1) {
    errors.push({ file, field: 'reps', message: 'reps must be a positive integer', hint: 'Set reps: 1, 2, ...' });
  }

  if (obj.place !== undefined && obj.place !== 'home') {
    errors.push({ file, field: 'place', message: `Invalid place "${String(obj.place)}"`, hint: 'place can only be "home" or omitted' });
  }

  if (!Array.isArray(obj.trains) || obj.trains.length === 0) {
    errors.push({ file, field: 'trains', message: 'trains must be a non-empty array of Stops', hint: 'List Stops that train this mission' });
  } else {
    obj.trains.forEach((stop, i) => {
      errors.push(...validateStopYaml(stop, `trains[${i}]`, file));
    });
  }

  if (!Array.isArray(obj.problems) || obj.problems.length === 0) {
    errors.push({ file, field: 'problems', message: 'problems must be a non-empty array of problem items', hint: 'List problems for this mission' });
  } else {
    obj.problems.forEach((prob, i) => {
      if (!prob || typeof prob !== 'object' || Array.isArray(prob)) {
        errors.push({ file, field: `problems[${i}]`, message: 'Problem must be an object with { id }', hint: 'Provide problem id' });
      } else {
        const p = prob as Record<string, unknown>;
        if (!isContentId(p.id)) {
          errors.push({ file, field: `problems[${i}].id`, message: `Invalid problem ID "${String(p.id)}"`, hint: 'Use lowercase kebab-case' });
        }
        if (p.practise !== undefined) {
          errors.push(...validateStopYaml(p.practise, `problems[${i}].practise`, file));
        }
      }
    });
  }

  if (obj.recommendations !== undefined) {
    if (!Array.isArray(obj.recommendations)) {
      errors.push({ file, field: 'recommendations', message: 'recommendations must be an array of Recommendation objects', hint: 'recommendations: [{ id: "...", target: "...", when: "..." }]' });
    } else {
      obj.recommendations.forEach((rec, idx) => {
        errors.push(...validateRecommendationYaml(rec, `recommendations[${idx}]`, file));
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateRecommendationYaml(raw: unknown, location: string, file?: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    errors.push({ file, field: location, message: 'Recommendation must be an object with { id, target, when }', hint: 'Example: { id: "rec-1", target: "collar-1", when: "view" }' });
    return errors;
  }
  const r = raw as Record<string, unknown>;
  if (!isContentId(r.id)) {
    errors.push({ file, field: `${location}.id`, message: `Invalid recommendation ID "${String(r.id)}"`, hint: 'Use lowercase kebab-case for IDs' });
  }
  if (!isContentId(r.target)) {
    errors.push({ file, field: `${location}.target`, message: `Invalid recommendation target ID "${String(r.target)}"`, hint: 'Target must be a valid content/shop ID' });
  }
  if (!isRecommendationTrigger(r.when)) {
    errors.push({
      file,
      field: `${location}.when`,
      message: `Invalid trigger "${String(r.when)}"`,
      hint: 'Allowed triggers: "view", "poste-trouble", "poor-score", or "problem:<problem-id>"',
    });
  }
  return errors;
}

export function validateShopYaml(raw: unknown, file: string = 'shop.yaml'): ValidationResult {
  const errors: ValidationError[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: [{ file, message: 'shop.yaml definition must be a YAML object', hint: 'Provide categories list at root' }] };
  }
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.categories)) {
    errors.push({ file, field: 'categories', message: 'categories must be an array of Category IDs', hint: 'categories: ["collares", "camas"]' });
  } else {
    obj.categories.forEach((catId, idx) => {
      if (!isContentId(catId)) {
        errors.push({ file, field: `categories[${idx}]`, message: `Invalid Category ID "${String(catId)}"`, hint: 'Use lowercase kebab-case' });
      }
    });
  }
  return { valid: errors.length === 0, errors };
}

export function validateCategoryYaml(raw: unknown, file: string = 'category.yaml'): ValidationResult {
  const errors: ValidationError[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: [{ file, message: 'Category definition must be a YAML object', hint: 'Provide category properties at root' }] };
  }
  const obj = raw as Record<string, unknown>;
  if (!isContentId(obj.id)) {
    errors.push({ file, field: 'id', message: `Invalid Category ID "${String(obj.id)}"`, hint: 'Use lowercase kebab-case' });
  }
  if (!Array.isArray(obj.subcategories)) {
    errors.push({ file, field: 'subcategories', message: 'subcategories must be an array of Subcategory IDs', hint: 'subcategories: ["arneses"]' });
  } else {
    obj.subcategories.forEach((subId, idx) => {
      if (!isContentId(subId)) {
        errors.push({ file, field: `subcategories[${idx}]`, message: `Invalid Subcategory ID "${String(subId)}"`, hint: 'Use lowercase kebab-case' });
      }
    });
  }
  return { valid: errors.length === 0, errors };
}

export function validateSubcategoryYaml(raw: unknown, file: string = 'subcategory.yaml'): ValidationResult {
  const errors: ValidationError[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: [{ file, message: 'Subcategory definition must be a YAML object', hint: 'Provide subcategory properties at root' }] };
  }
  const obj = raw as Record<string, unknown>;
  if (!isContentId(obj.id)) {
    errors.push({ file, field: 'id', message: `Invalid Subcategory ID "${String(obj.id)}"`, hint: 'Use lowercase kebab-case' });
  }
  if (!Array.isArray(obj.products)) {
    errors.push({ file, field: 'products', message: 'products must be an array of Product IDs', hint: 'products: ["arnes-anti-tirones"]' });
  } else {
    obj.products.forEach((prodId, idx) => {
      if (!isContentId(prodId)) {
        errors.push({ file, field: `products[${idx}]`, message: `Invalid Product ID "${String(prodId)}"`, hint: 'Use lowercase kebab-case' });
      }
    });
  }
  return { valid: errors.length === 0, errors };
}

export function validateProductYaml(raw: unknown, file: string = 'product.yaml'): ValidationResult {
  const errors: ValidationError[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: [{ file, message: 'Product definition must be a YAML object', hint: 'Provide product properties at root' }] };
  }
  const obj = raw as Record<string, unknown>;
  if (!isContentId(obj.id)) {
    errors.push({ file, field: 'id', message: `Invalid Product ID "${String(obj.id)}"`, hint: 'Use lowercase kebab-case' });
  }
  if (obj.source !== undefined && !PRODUCT_SOURCES.includes(obj.source as ProductSource)) {
    errors.push({ file, field: 'source', message: `Invalid product source "${String(obj.source)}"`, hint: `Expected one of: ${PRODUCT_SOURCES.join(', ')}` });
  }
  if (!obj.urls || typeof obj.urls !== 'object' || Array.isArray(obj.urls)) {
    errors.push({ file, field: 'urls', message: 'urls must be a map of language codes to buy links', hint: 'urls: { es: "https://..." }' });
  } else {
    const urls = obj.urls as Record<string, unknown>;
    const langs = Object.keys(urls);
    if (!langs.includes('es')) {
      errors.push({ file, field: 'urls', message: 'urls must include "es" (Spanish buy link is required)', hint: 'Add "es" buy link' });
    }
    for (const [lang, url] of Object.entries(urls)) {
      if (!LANG_REGEX.test(lang)) {
        errors.push({ file, field: `urls.${lang}`, message: `Invalid language key "${lang}" in urls`, hint: 'Use lowercase language code like "es"' });
      }
      if (!isHttpsUrl(url)) {
        errors.push({ file, field: `urls.${lang}`, message: `Invalid buy link "${String(url)}" (must be an https address)`, hint: 'Provide a valid https:// URL' });
      }
    }
  }
  if (obj.price !== undefined && typeof obj.price !== 'string') {
    errors.push({ file, field: 'price', message: 'price must be a string if provided', hint: 'Set price: "24,99 €"' });
  }
  if (obj.priceCheckedAt !== undefined && !isYearMonth(obj.priceCheckedAt)) {
    errors.push({ file, field: 'priceCheckedAt', message: `Invalid priceCheckedAt date "${String(obj.priceCheckedAt)}"`, hint: 'Use YYYY-MM format (e.g. "2026-11")' });
  }
  if (obj.image !== undefined) {
    if (typeof obj.image !== 'string' || !isRelativeMediaPath(obj.image)) {
      errors.push({ file, field: 'image', message: `Invalid image path "${String(obj.image)}" (must be relative inside folder, no ".." or "/")`, hint: 'Use simple filenames or media/filename' });
    }
  }
  return { valid: errors.length === 0, errors };
}

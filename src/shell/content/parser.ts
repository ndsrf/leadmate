import type { TextKey } from '../../i18n';
import type { CompareSide, LessonBlock, LessonKind, VideoSource } from '../lessons/lesson';
import {
  parseYaml,
  type CategoryYaml,
  type LessonYaml,
  type ProductYaml,
  type ShopYaml,
  type SubcategoryYaml,
} from './schema';

/**
 * Error thrown when Markdown parsing fails or contains rejected markup.
 */
export class MarkdownParseError extends Error {
  constructor(
    message: string,
    public readonly line?: number,
    public readonly section?: string,
  ) {
    super(line !== undefined ? `Line ${line}: ${message}` : message);
    this.name = 'MarkdownParseError';
  }
}

/**
 * Raw HTML tag detector. Matches HTML opening, closing, and void tags.
 * Does not match math like "x < y" or arrows.
 */
const RAW_HTML_PATTERN = /<\/?([a-zA-Z][a-zA-Z0-9:-]*)\b[^>]*>/;

/**
 * Normalises a section heading string for fuzzy matching (lowercase, no accents, trimmed).
 */
export function normalizeSectionName(heading: string): string {
  return heading
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Checks content for rejected markup such as raw HTML tags.
 * Throws MarkdownParseError if rejected markup is detected.
 */
export function assertNoRejectedMarkup(content: string, context?: string): void {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = RAW_HTML_PATTERN.exec(lines[i]);
    if (match) {
      const tag = match[0];
      const ctx = context ? ` in ${context}` : '';
      throw new MarkdownParseError(`Raw HTML is not allowed: "${tag}"${ctx}`, i + 1);
    }
  }
}

// -- Parsed Document Types ---------------------------------------------------

export interface ParsedImageMeta {
  alt: string;
  caption: string;
}

export interface ParsedLessonContent {
  title: string;
  heading?: string;
  hook?: string;
  why?: string;
  steps?: string[];
  example?: {
    title: string;
    text: string;
  };
  compare?: {
    do: string;
    dont: string;
  };
  tip?: string;
  takeaways?: string[];
  notice?: string;
  images?: Record<string, ParsedImageMeta>;
  animation?: ParsedImageMeta;
  video?: ParsedImageMeta;
  // For how-to-play lessons:
  intro?: string;
  controls?: Array<{
    heading: string;
    text: string;
    alt?: string;
    caption?: string;
  }>;
  recommendations?: Record<string, string>;
}

export interface ParsedWorldContent {
  title: string;
  topics: string;
}

export interface ParsedNodeCheckpointQuestion {
  question: string;
  options: Array<{ text: string; correct: boolean }>;
  explanation: string;
}

export interface ParsedNodeContent {
  title: string;
  primer?: Array<{
    text: string;
    caption?: string;
  }>;
  checkpoint?: ParsedNodeCheckpointQuestion[];
  exercises?: Record<string, string>;
  debrief?: {
    calm?: string;
    notCalm?: string;
  };
  recommendations?: Record<string, string>;
}

export interface ParsedMissionFix {
  reassure: string;
  cause: string;
  c1: string;
  c2?: string;
  easier: string;
  alt: string;
  caption: string;
}

export interface ParsedMissionProblem {
  id: string;
  label: string;
  fix: ParsedMissionFix;
}

export interface ParsedMissionContent {
  title: string;
  target: string;
  success: string;
  problems: ParsedMissionProblem[];
  general: ParsedMissionFix;
  recommendations?: Record<string, string>;
}

export interface ParsedShopText {
  title: string;
  description: string;
}

export interface ParsedShopCategory {
  config: CategoryYaml;
  text: Record<string, ParsedShopText>;
  files?: string[];
}

export interface ParsedShopSubcategory {
  config: SubcategoryYaml;
  text: Record<string, ParsedShopText>;
  files?: string[];
}

export interface ParsedShopProduct {
  config: ProductYaml;
  text: Record<string, ParsedShopText>;
  files?: string[];
}

export interface ParsedShopTree {
  config?: ShopYaml;
  categories: Record<string, ParsedShopCategory>;
  subcategories: Record<string, ParsedShopSubcategory>;
  products: Record<string, ParsedShopProduct>;
}

// -- Low-level Markdown AST representation -----------------------------------

interface RawSection {
  heading: string;
  level: number;
  body: string[];
  subsections: RawSection[];
}

function parseSections(markdown: string): { title: string; sections: RawSection[] } {
  assertNoRejectedMarkup(markdown);
  const lines = markdown.split('\n');
  let title = '';
  const sections: RawSection[] = [];
  let currentSection: RawSection | null = null;
  let currentSub: RawSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h1Match = /^#\s+(.+)$/.exec(line);
    const h2Match = /^##\s+(.+)$/.exec(line);
    const h3Match = /^###\s+(.+)$/.exec(line);

    if (h1Match) {
      if (!title) title = h1Match[1].trim();
      continue;
    }

    if (h2Match) {
      currentSection = {
        heading: h2Match[1].trim(),
        level: 2,
        body: [],
        subsections: [],
      };
      sections.push(currentSection);
      currentSub = null;
      continue;
    }

    if (h3Match) {
      if (!currentSection) {
        currentSection = { heading: '', level: 2, body: [], subsections: [] };
        sections.push(currentSection);
      }
      currentSub = {
        heading: h3Match[1].trim(),
        level: 3,
        body: [],
        subsections: [],
      };
      currentSection.subsections.push(currentSub);
      continue;
    }

    if (currentSub) {
      currentSub.body.push(line);
    } else if (currentSection) {
      currentSection.body.push(line);
    } else if (!title && line.trim()) {
      // Body before any heading
    }
  }

  return { title, sections };
}

function cleanBodyText(lines: string[]): string {
  return lines
    .filter((l) => !l.startsWith('- alt:') && !l.startsWith('- caption:'))
    .join('\n')
    .trim();
}

function extractListItems(lines: string[]): string[] {
  const items: string[] = [];
  let current = '';

  for (const line of lines) {
    const listMatch = /^(?:[-*]|\d+\.)\s+(.+)$/.exec(line.trim());
    if (listMatch) {
      if (current) items.push(current);
      current = listMatch[1].trim();
    } else if (current && line.trim()) {
      current += ' ' + line.trim();
    }
  }
  if (current) items.push(current);
  return items;
}

function extractMetaKeyValues(lines: string[]): Record<string, string> {
  const res: Record<string, string> = {};
  for (const line of lines) {
    const kvMatch = /^(?:-\s*)?([a-zA-Z0-9_-]+)\s*:\s*(.+)$/.exec(line.trim());
    if (kvMatch) {
      res[kvMatch[1].toLowerCase()] = kvMatch[2].trim();
    }
  }
  return res;
}

// -- Lesson Markdown Parser --------------------------------------------------

export function parseLessonMarkdown(markdown: string, config?: LessonYaml): ParsedLessonContent {
  const { title: rawTitle, sections } = parseSections(markdown);
  let title = rawTitle;

  const res: ParsedLessonContent = {
    title: '',
  };

  for (const sec of sections) {
    const norm = normalizeSectionName(sec.heading);

    switch (norm) {
      case 'title':
      case 'titulo':
        title = cleanBodyText(sec.body);
        break;

      case 'heading':
      case 'encabezado':
      case 'titular':
        res.heading = cleanBodyText(sec.body);
        break;

      case 'hook':
      case 'gancho':
      case 'intro':
      case 'introduccion':
        res.hook = cleanBodyText(sec.body);
        break;

      case 'why':
      case 'por que pasa':
      case 'por que ocurre':
        res.why = cleanBodyText(sec.body);
        break;

      case 'how':
      case 'steps':
      case 'pasos':
      case 'como hacerlo':
        res.steps = extractListItems(sec.body);
        break;

      case 'example':
      case 'ejemplo': {
        let exTitle = '';
        let exText = '';
        if (sec.subsections.length > 0) {
          exTitle = sec.subsections[0].heading;
          exText = cleanBodyText(sec.subsections[0].body);
        } else {
          const lines = sec.body.filter((l) => l.trim().length > 0);
          if (lines.length > 0) {
            const first = lines[0].replace(/^#+\s*/, '').trim();
            exTitle = first;
            exText = lines.slice(1).join('\n').trim();
          }
        }
        res.example = { title: exTitle, text: exText };
        break;
      }

      case 'compare':
      case 'mistakes':
      case 'errores':
      case 'errores comunes':
      case 'errores frecuentes': {
        let doText = '';
        let dontText = '';
        for (const sub of sec.subsections) {
          const subNorm = normalizeSectionName(sub.heading);
          if (subNorm === 'do' || subNorm === 'haz' || subNorm === 'bien') {
            doText = cleanBodyText(sub.body);
          } else if (subNorm === 'dont' || subNorm === 'no hagas' || subNorm === 'mal') {
            dontText = cleanBodyText(sub.body);
          }
        }
        // Fallback: check key-values in main body if no subsections
        if (!doText || !dontText) {
          const kv = extractMetaKeyValues(sec.body);
          if (kv.do) doText = kv.do;
          if (kv.dont || kv['no hagas']) dontText = kv.dont ?? kv['no hagas'];
        }
        res.compare = { do: doText, dont: dontText };
        break;
      }

      case 'do':
      case 'haz':
        res.compare = { ...res.compare, do: cleanBodyText(sec.body), dont: res.compare?.dont ?? '' };
        break;

      case 'dont':
      case 'no hagas':
        res.compare = { ...res.compare, do: res.compare?.do ?? '', dont: cleanBodyText(sec.body) };
        break;

      case 'tip':
      case 'today':
      case 'prueba hoy':
      case 'pruebalo hoy':
      case 'consejo':
        res.tip = cleanBodyText(sec.body);
        break;

      case 'takeaways':
      case 'conclusiones':
      case 'resumen':
        res.takeaways = extractListItems(sec.body);
        break;

      case 'notice':
      case 'aviso':
      case 'atencion':
        res.notice = cleanBodyText(sec.body);
        break;

      case 'images':
      case 'imagenes':
      case 'media': {
        const images: Record<string, ParsedImageMeta> = {};
        for (const sub of sec.subsections) {
          const kv = extractMetaKeyValues(sub.body);
          images[sub.heading] = {
            alt: kv.alt ?? '',
            caption: kv.caption ?? '',
          };
        }
        // Also support bulleted images in body: - `img.png`: alt | caption
        res.images = { ...res.images, ...images };
        break;
      }

      case 'animation':
      case 'animacion': {
        const kv = extractMetaKeyValues(sec.body);
        res.animation = { alt: kv.alt ?? '', caption: kv.caption ?? '' };
        break;
      }

      case 'video':
      case 'video embed': {
        const kv = extractMetaKeyValues(sec.body);
        res.video = { alt: kv.alt ?? '', caption: kv.caption ?? '' };
        break;
      }

      case 'recommendations':
      case 'recomendaciones': {
        const recommendations: Record<string, string> = {};
        if (sec.subsections.length === 0 && cleanBodyText(sec.body)) {
          throw new MarkdownParseError('Each recommendation must have a subsection with its ID (### <id>)');
        }
        for (const sub of sec.subsections) {
          if (!sub.heading.trim()) {
            throw new MarkdownParseError('Recommendation subsection is missing an ID heading');
          }
          recommendations[sub.heading.trim()] = cleanBodyText(sub.body);
        }
        res.recommendations = recommendations;
        break;
      }

      default: {
        // Handle how-to-play controls (e.g. "Control 1", "c1", etc.)
        const cMatch = /^(?:control|c)\s*(\d+)$/i.exec(norm);
        if (cMatch) {
          let cHeading = sec.heading;
          let cBody = cleanBodyText(sec.body);
          const kv = extractMetaKeyValues(sec.body);
          if (sec.subsections.length > 0) {
            cHeading = sec.subsections[0].heading;
            cBody = cleanBodyText(sec.subsections[0].body);
            Object.assign(kv, extractMetaKeyValues(sec.subsections[0].body));
          }
          res.controls = res.controls ?? [];
          res.controls.push({
            heading: cHeading,
            text: cBody,
            alt: kv.alt,
            caption: kv.caption,
          });
        }
        break;
      }
    }
  }

  res.title = title || res.heading || (config ? config.id : '');
  return res;
}

// -- Build LessonBlock[] from parsed markdown and config ---------------------

export interface BuildBlocksOptions {
  keyPrefix?: string;
  mediaBase?: string;
  catalog?: Record<string, string>;
}

export function buildLessonBlocks(
  parsed: ParsedLessonContent,
  config: LessonYaml,
  options: BuildBlocksOptions = {},
): LessonBlock[] {
  const { keyPrefix, mediaBase, catalog } = options;
  const blocks: LessonBlock[] = [];

  // Helper to register text and return either a TextKey or the direct string
  const textRef = (subKey: string, text: string): TextKey => {
    if (keyPrefix) {
      const fullKey = `${keyPrefix}.${subKey}` as TextKey;
      if (catalog) catalog[fullKey] = text;
      return fullKey;
    }
    return text as TextKey;
  };

  if (config.kind === 'how-to-play') {
    if (parsed.intro || parsed.hook) {
      blocks.push({ type: 'text', text: textRef('intro', parsed.intro ?? parsed.hook ?? '') });
    }
    const controls = parsed.controls ?? [];
    controls.forEach((c, idx) => {
      const n = idx + 1;
      blocks.push({ type: 'heading', text: textRef(`c${n}.heading`, c.heading) });
      blocks.push({ type: 'text', text: textRef(`c${n}.text`, c.text) });
      const art = `${config.id}-${n}`;
      blocks.push({
        type: 'image',
        art,
        alt: textRef(`c${n}.alt`, c.alt ?? c.heading),
        caption: textRef(`c${n}.caption`, c.caption ?? c.heading),
      });
    });
    if (parsed.tip) {
      blocks.push({ type: 'tip', text: textRef('tip', parsed.tip) });
    }
    return blocks;
  }

  // Theory Lesson teaching pattern:
  // 1. Optional notice
  if (config.notice || parsed.notice) {
    const noticeText = config.notice ?? parsed.notice!;
    const noticeRef = config.notice?.includes('.') ? (config.notice as TextKey) : textRef('notice', noticeText);
    blocks.push({ type: 'notice', text: noticeRef });
  }

  // 2. Heading
  blocks.push({ type: 'heading', text: textRef('heading', parsed.heading ?? parsed.title) });

  // 3. Hook
  if (parsed.hook) {
    blocks.push({ type: 'text', text: textRef('hook', parsed.hook) });
  }

  // 4. Section: Why
  blocks.push({ type: 'heading', text: 'lesson.section.why' as TextKey });
  if (parsed.why) {
    blocks.push({ type: 'text', text: textRef('why', parsed.why) });
  }

  // 5. Image 1
  const images = config.images ?? Object.keys(parsed.images ?? {});
  const firstImg = images[0] ?? `${config.id}-1`;
  const firstMeta = parsed.images?.[firstImg] ?? Object.values(parsed.images ?? {})[0] ?? { alt: '', caption: '' };
  blocks.push({
    type: 'image',
    art: firstImg,
    alt: textRef('image.1.alt', firstMeta.alt),
    caption: textRef('image.1.caption', firstMeta.caption),
  });

  // 6. Section: How & Steps
  blocks.push({ type: 'heading', text: 'lesson.section.how' as TextKey });
  const stepItems = parsed.steps ?? [];
  blocks.push({
    type: 'steps',
    items: stepItems.map((step, idx) => textRef(`step.${idx + 1}`, step)),
  });

  // 7. Optional Lesson Animation
  if (config.animation && mediaBase) {
    const animMeta = parsed.animation ?? { alt: '', caption: '' };
    blocks.push({
      type: 'video',
      source: { kind: 'animation', key: config.animation },
      poster: `${config.id}-anim`,
      alt: textRef('animation.alt', animMeta.alt),
      caption: textRef('animation.caption', animMeta.caption),
    });
  }

  // 8. Worked example
  if (parsed.example) {
    blocks.push({
      type: 'example',
      title: textRef('example.title', parsed.example.title),
      text: textRef('example.text', parsed.example.text),
    });
  }

  // 9. Subsequent images
  for (let i = 1; i < images.length; i++) {
    const imgName = images[i];
    const meta = parsed.images?.[imgName] ?? Object.values(parsed.images ?? {})[i] ?? { alt: '', caption: '' };
    blocks.push({
      type: 'image',
      art: imgName,
      alt: textRef(`image.${i + 1}.alt`, meta.alt),
      caption: textRef(`image.${i + 1}.caption`, meta.caption),
    });
  }

  // 10. Section: Mistakes & Compare
  blocks.push({ type: 'heading', text: 'lesson.section.mistakes' as TextKey });
  blocks.push({
    type: 'compare',
    do: {
      text: textRef('do', parsed.compare?.do ?? ''),
      art: config.compare?.do,
    },
    dont: {
      text: textRef('dont', parsed.compare?.dont ?? ''),
      art: config.compare?.dont,
    },
  });

  // 11. Optional YouTube video (for current language)
  const videoId = config.youtube?.['es'] ?? (config.youtube ? Object.values(config.youtube)[0] : undefined);
  if (videoId) {
    const vidMeta = parsed.video ?? { alt: '', caption: '' };
    blocks.push({
      type: 'video',
      source: { kind: 'youtube', id: videoId },
      poster: 'poster',
      alt: textRef('video.alt', vidMeta.alt),
      caption: textRef('video.caption', vidMeta.caption),
    });
  }

  // 12. Tip ("Prueba hoy")
  if (parsed.tip) {
    blocks.push({ type: 'tip', text: textRef('today', parsed.tip) });
  }

  // 13. Takeaways
  const takeaways = parsed.takeaways ?? [];
  blocks.push({
    type: 'takeaways',
    items: takeaways.map((item, idx) => textRef(`takeaway.${idx + 1}`, item)),
  });

  return blocks;
}

// -- World Markdown Parser ---------------------------------------------------

export function parseWorldMarkdown(markdown: string): ParsedWorldContent {
  const { title: rawTitle, sections } = parseSections(markdown);
  let title = rawTitle;
  let topics = '';

  for (const sec of sections) {
    const norm = normalizeSectionName(sec.heading);
    if (norm === 'title' || norm === 'titulo') {
      title = cleanBodyText(sec.body);
    } else if (norm === 'topics' || norm === 'temas' || norm === 'temas entrenados') {
      topics = cleanBodyText(sec.body);
    }
  }

  return { title, topics };
}

// -- Node Markdown Parser ----------------------------------------------------

export function parseNodeMarkdown(markdown: string): ParsedNodeContent {
  const { title: rawTitle, sections } = parseSections(markdown);
  let title = rawTitle;
  const primer: Array<{ text: string; caption?: string }> = [];
  const checkpoint: ParsedNodeCheckpointQuestion[] = [];
  const exercises: Record<string, string> = {};
  const debrief: { calm?: string; notCalm?: string } = {};
  let returnRecommendations: Record<string, string> | undefined;

  for (const sec of sections) {
    const norm = normalizeSectionName(sec.heading);
    if (norm === 'title' || norm === 'titulo') {
      title = cleanBodyText(sec.body);
    } else if (norm === 'primer' || norm === 'introduccion') {
      for (const sub of sec.subsections) {
        const kv = extractMetaKeyValues(sub.body);
        primer.push({
          text: cleanBodyText(sub.body),
          caption: kv.caption,
        });
      }
      if (sec.subsections.length === 0 && sec.body.length > 0) {
        primer.push({ text: cleanBodyText(sec.body) });
      }
    } else if (norm === 'checkpoint' || norm === 'preguntas') {
      for (const sub of sec.subsections) {
        let question = '';
        const options: Array<{ text: string; correct: boolean }> = [];
        let explanation = '';

        for (const line of sub.body) {
          const checkMatch = /^-\s*\[([ xX])\]\s*(.+)$/.exec(line.trim());
          const whyMatch = /^-\s*(?:why|porque|explicacion)\s*:\s*(.+)$/i.exec(line.trim());
          if (checkMatch) {
            options.push({
              text: checkMatch[2].trim(),
              correct: checkMatch[1].toLowerCase() === 'x',
            });
          } else if (whyMatch) {
            explanation = whyMatch[1].trim();
          } else if (!question && line.trim()) {
            question = line.trim();
          }
        }
        checkpoint.push({ question, options, explanation });
      }
    } else if (norm === 'exercises' || norm === 'ejercicios') {
      const kv = extractMetaKeyValues(sec.body);
      Object.assign(exercises, kv);
    } else if (norm === 'debrief') {
      const kv = extractMetaKeyValues(sec.body);
      if (kv.calm) debrief.calm = kv.calm;
      if (kv.notcalm || kv['not_calm']) debrief.notCalm = kv.notcalm ?? kv['not_calm'];
    } else if (norm === 'recommendations' || norm === 'recomendaciones') {
      const recommendations: Record<string, string> = {};
      if (sec.subsections.length === 0 && cleanBodyText(sec.body)) {
        throw new MarkdownParseError('Each recommendation must have a subsection with its ID (### <id>)');
      }
      for (const sub of sec.subsections) {
        if (!sub.heading.trim()) {
          throw new MarkdownParseError('Recommendation subsection is missing an ID heading');
        }
        recommendations[sub.heading.trim()] = cleanBodyText(sub.body);
      }
      returnRecommendations = recommendations;
    }
  }

  return { title, primer, checkpoint, exercises, debrief, recommendations: returnRecommendations };
}

// -- Mission Markdown Parser -------------------------------------------------

export function parseMissionMarkdown(markdown: string): ParsedMissionContent {
  const { title: rawTitle, sections } = parseSections(markdown);
  let title = rawTitle;
  let target = '';
  let success = '';
  const problems: ParsedMissionProblem[] = [];
  let general: ParsedMissionFix = { reassure: '', cause: '', c1: '', easier: '', alt: '', caption: '' };
  let recommendations: Record<string, string> | undefined;

  for (const sec of sections) {
    const norm = normalizeSectionName(sec.heading);
    if (norm === 'title' || norm === 'titulo') {
      title = cleanBodyText(sec.body);
    } else if (norm === 'target' || norm === 'objetivo') {
      target = cleanBodyText(sec.body);
    } else if (norm === 'success' || norm === 'exito') {
      success = cleanBodyText(sec.body);
    } else if (norm === 'problems' || norm === 'problemas') {
      for (const sub of sec.subsections) {
        const kv = extractMetaKeyValues(sub.body);
        problems.push({
          id: sub.heading,
          label: kv.label ?? sub.heading,
          fix: {
            reassure: kv.reassure ?? '',
            cause: kv.cause ?? '',
            c1: kv.c1 ?? '',
            c2: kv.c2,
            easier: kv.easier ?? '',
            alt: kv.alt ?? '',
            caption: kv.caption ?? '',
          },
        });
      }
    } else if (norm === 'general' || norm === 'otra cosa') {
      const kv = extractMetaKeyValues(sec.body);
      general = {
        reassure: kv.reassure ?? '',
        cause: kv.cause ?? '',
        c1: kv.c1 ?? '',
        c2: kv.c2,
        easier: kv.easier ?? '',
        alt: kv.alt ?? '',
        caption: kv.caption ?? '',
      };
    } else if (norm === 'recommendations' || norm === 'recomendaciones') {
      const recs: Record<string, string> = {};
      if (sec.subsections.length === 0 && cleanBodyText(sec.body)) {
        throw new MarkdownParseError('Each recommendation must have a subsection with its ID (### <id>)');
      }
      for (const sub of sec.subsections) {
        if (!sub.heading.trim()) {
          throw new MarkdownParseError('Recommendation subsection is missing an ID heading');
        }
        recs[sub.heading.trim()] = cleanBodyText(sub.body);
      }
      recommendations = recs;
    }
  }

  return { title, target, success, problems, general, recommendations };
}

// -- Shop Item Markdown Parser & Shop Directory Reader -----------------------

export function parseShopItemMarkdown(markdown: string, context?: string): ParsedShopText {
  assertNoRejectedMarkup(markdown, context);
  const { title: rawTitle, sections } = parseSections(markdown);
  let title = rawTitle;
  let description = '';

  for (const sec of sections) {
    const norm = normalizeSectionName(sec.heading);
    if (norm === 'title' || norm === 'titulo' || norm === 'name' || norm === 'nombre') {
      title = cleanBodyText(sec.body);
    } else if (norm === 'description' || norm === 'descripcion') {
      description = cleanBodyText(sec.body);
    } else {
      throw new MarkdownParseError(
        `Unexpected section "${sec.heading}"${context ? ` in ${context}` : ''}`,
        undefined,
        sec.heading,
      );
    }
  }

  return { title, description };
}


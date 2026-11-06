import type { TextKey } from '../../i18n';
import type { ScenarioConfig } from '../../sim/config';
import { defaultScenario } from '../../sim/config';
import type { CloseExerciseConfig } from '../../sim/closeExercise';
import { defaultCloseExerciseConfig } from '../../sim/closeExercise';
import type { LessonBlock, LessonDef, LessonKind, VideoSource } from '../lessons/lesson';
import { MEDIA_BASE } from '../ui/media';
import type { CheckpointQuestion, Metric, NodeDef, NodeExercise, PrimerCardDef } from '../nodes/node';
import type { Fix, MissionDef, MissionProblem } from '../missions/mission';
import type { Stop, WorldDef } from '../world';
import {
  buildLessonBlocks,
  parseLessonMarkdown,
  parseMissionMarkdown,
  parseNodeMarkdown,
  parseWorldMarkdown,
  type ParsedLessonContent,
  type ParsedMissionContent,
  type ParsedMissionFix,
  type ParsedNodeContent,
  type ParsedWorldContent,
} from './parser';
import type {
  LessonYaml,
  MissionYaml,
  NodeYaml,
  StopYaml,
  WorldYaml,
} from './schema';
import type { ContentPack } from './validator';

export interface ResolvedPack {
  worlds: WorldDef[];
  lessons: LessonDef[];
  nodes: NodeDef[];
  missions: MissionDef[];
  catalog: Record<string, string>;
}

// Canonical mappings from IDs to existing catalog slugs for exact backward compatibility
export const NODE_ID_TO_SLUG: Record<string, string> = {
  'calm-hands': 'calmhands',
  'dog-as-dog': 'dogasdog',
  'home-rest': 'homerest',
  'calm-first': 'calmfirst',
  'harness-ritual': 'harness',
  'doorbell-mat': 'doorbell',
  'poste-practice': 'poste',
  'walk-distraction': 'walk',
  'blind-corner': 'corner',
  'slack-u': 'u',
  'leave-it-intro': 'leaveit',
  'calm-zone-intro': 'barkdoku',
  'barkdoku-intro': 'barkdoku',
  'scooter-crossing': 'scooter',
  'close-narrow-street-pass': 'closepass',
  'urban-mix': 'urban',
  'park-jogger': 'jogger',
  'park-mix': 'park',
  'bark-home': 'barkhome',
  destroy: 'destroy',
  'eat-objects': 'eatobjects',
};

export const MISSION_ID_TO_SLUG: Record<string, string> = {
  'mission-dog-as-dog': 'dogasdog',
  'mission-home-rest': 'homerest',
  'mission-calm-first': 'calmfirst',
  'mission-harness': 'harness',
  'mission-doorbell': 'doorbell',
  'mission-poste': 'poste',
  'mission-walk': 'walk',
  'mission-corners': 'corners',
  'mission-u-leash': 'uleash',
  'mission-leave-it': 'leaveit',
  'mission-shields': 'shields',
  'mission-cue-choice': 'cuechoice',
  'mission-park-jogger': 'jogger',
  'mission-park-mix': 'parkmix',
  'mission-bite-owner': 'biteowner',
  'mission-bite-others': 'biteothers',
  'mission-bark-home': 'barkhome',
  'mission-destroy': 'destroy',
  'mission-eat-objects': 'eatobjects',
};

function mapStop(stop: StopYaml): Stop {
  return { kind: stop.kind, id: stop.id };
}

/**
 * Resolves a Content Pack for a given language, producing runtime definition objects
 * (WorldDef, LessonDef, NodeDef, MissionDef) and a flat translation catalog layered
 * over Spanish (section-level fallback, never returning an empty or raw key).
 */
export function resolvePack(pack: ContentPack, language: string = 'es', options?: { mediaBase?: string }): ResolvedPack {
  const catalog: Record<string, string> = {};
  const mediaBase = options?.mediaBase !== undefined ? options.mediaBase : MEDIA_BASE;

  // 1. Resolve Worlds
  const worlds: WorldDef[] = Object.entries(pack.worlds ?? {})
    .sort((a, b) => (a[1].config.worldNumber ?? 0) - (b[1].config.worldNumber ?? 0))
    .map(([id, entry]) => {
      const cfg = entry.config;
      const textEsRaw = entry.text?.['es'] ?? '';
      const textLangRaw = language !== 'es' ? entry.text?.[language] : undefined;

      const parsedEs: ParsedWorldContent = typeof textEsRaw === 'string' ? parseWorldMarkdown(textEsRaw) : (textEsRaw as ParsedWorldContent);
      const parsedLang: Partial<ParsedWorldContent> | undefined = textLangRaw ? (typeof textLangRaw === 'string' ? parseWorldMarkdown(textLangRaw) : textLangRaw) : undefined;

      const titleKey = `world.${id}.title` as TextKey;
      const topicsKey = `world.${id}.topics` as TextKey;

      catalog[titleKey] = (parsedLang?.title && parsedLang.title.trim()) ? parsedLang.title : parsedEs.title || id;
      catalog[topicsKey] = (parsedLang?.topics && parsedLang.topics.trim()) ? parsedLang.topics : parsedEs.topics || '';

      const worldDef: WorldDef = {
        id: cfg.id,
        title: titleKey,
        worldNumber: cfg.worldNumber,
        topics: topicsKey,
        stretches: (cfg.stretches ?? []).map((stretch) => stretch.map(mapStop)),
      };

      if (cfg.unlockedBy) worldDef.unlockedBy = cfg.unlockedBy;
      if (cfg.tier) worldDef.tier = cfg.tier;
      if (cfg.preview) worldDef.preview = cfg.preview;
      if (cfg.nodeCount !== undefined) worldDef.nodeCount = cfg.nodeCount;

      return worldDef;
    });

  // 2. Resolve Lessons
  const trailLessonIds = worlds.flatMap((w) => w.stretches.flatMap((s) => s.filter((st) => st.kind === 'lesson').map((st) => st.id)));
  const homeLessonOrder = ['theory-bite-owner', 'theory-bite-others', 'theory-bark-home', 'theory-destroy', 'theory-eat-objects'];
  const puppyLessonOrder = ['puppy-bite', 'puppy-sound', 'puppy-vet'];

  const lessons: LessonDef[] = Object.entries(pack.lessons ?? {})
    .sort(([idA, entryA], [idB, entryB]) => {
      const dayA = entryA.config.day;
      const dayB = entryB.config.day;
      if (dayA !== undefined && dayB !== undefined) return dayA - dayB;
      if (dayA !== undefined) return -1;
      if (dayB !== undefined) return 1;

      const idxA = trailLessonIds.indexOf(idA);
      const idxB = trailLessonIds.indexOf(idB);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;

      const hA = homeLessonOrder.indexOf(idA);
      const hB = homeLessonOrder.indexOf(idB);
      if (hA !== -1 && hB !== -1) return hA - hB;
      if (hA !== -1) return -1;
      if (hB !== -1) return 1;

      const pA = puppyLessonOrder.indexOf(idA);
      const pB = puppyLessonOrder.indexOf(idB);
      if (pA !== -1 && pB !== -1) return pA - pB;
      if (pA !== -1) return -1;
      if (pB !== -1) return 1;

      return idA.localeCompare(idB);
    })
    .map(([id, entry]) => {
    const cfg = entry.config;
    const textEsRaw = entry.text?.['es'] ?? '';
    const textLangRaw = language !== 'es' ? entry.text?.[language] : undefined;

    const parsedEs: ParsedLessonContent = typeof textEsRaw === 'string' ? parseLessonMarkdown(textEsRaw, cfg) : (textEsRaw as ParsedLessonContent);
    const parsedLang: Partial<ParsedLessonContent> | undefined = textLangRaw ? (typeof textLangRaw === 'string' ? parseLessonMarkdown(textLangRaw, cfg) : textLangRaw) : undefined;

    // Animation fallback
    const animEs = parsedEs.animation ?? { alt: `${cfg.id} animation`, caption: `${cfg.id} animation` };
    const animLang = parsedLang?.animation;
    const resolvedAnim = {
      alt: (animLang?.alt && animLang.alt.trim()) ? animLang.alt : animEs.alt,
      caption: (animLang?.caption && animLang.caption.trim()) ? animLang.caption : animEs.caption,
    };

    // Video fallback
    const vidEs = parsedEs.video ?? { alt: `${cfg.id} video`, caption: `${cfg.id} video` };
    const vidLang = parsedLang?.video;
    const resolvedVid = {
      alt: (vidLang?.alt && vidLang.alt.trim()) ? vidLang.alt : vidEs.alt,
      caption: (vidLang?.caption && vidLang.caption.trim()) ? vidLang.caption : vidEs.caption,
    };

    // Layer target language over Spanish at section level
    const merged: ParsedLessonContent = {
      title: (parsedLang?.title && parsedLang.title.trim()) ? parsedLang.title : parsedEs.title || id,
      heading: (parsedLang?.heading && parsedLang.heading.trim()) ? parsedLang.heading : parsedEs.heading || id,
      hook: (parsedLang?.hook && parsedLang.hook.trim()) ? parsedLang.hook : parsedEs.hook || '',
      why: (parsedLang?.why && parsedLang.why.trim()) ? parsedLang.why : parsedEs.why || '',
      steps: (parsedLang?.steps && parsedLang.steps.length > 0) ? parsedLang.steps : parsedEs.steps || [],
      example: (parsedLang?.example?.text && parsedLang.example.text.trim())
        ? {
            title: parsedLang.example.title || parsedEs.example?.title || id,
            text: parsedLang.example.text,
          }
        : parsedEs.example || { title: id, text: '' },
      compare: (parsedLang?.compare?.do && parsedLang.compare.do.trim())
        ? {
            do: parsedLang.compare.do,
            dont: (parsedLang.compare.dont && parsedLang.compare.dont.trim()) ? parsedLang.compare.dont : parsedEs.compare?.dont || '',
          }
        : parsedEs.compare || { do: '', dont: '' },
      tip: (parsedLang?.tip && parsedLang.tip.trim()) ? parsedLang.tip : parsedEs.tip || '',
      takeaways: (parsedLang?.takeaways && parsedLang.takeaways.length > 0) ? parsedLang.takeaways : parsedEs.takeaways || [],
      notice: (parsedLang?.notice && parsedLang.notice.trim()) ? parsedLang.notice : parsedEs.notice,
      images: { ...(parsedEs.images ?? {}), ...(parsedLang?.images ?? {}) },
      animation: resolvedAnim,
      video: resolvedVid,
      intro: (parsedLang?.intro && parsedLang.intro.trim()) ? parsedLang.intro : parsedEs.intro,
      controls: (parsedLang?.controls && parsedLang.controls.length > 0) ? parsedLang.controls : parsedEs.controls,
    };

    const keyPrefix = (cfg as any).keys ?? (cfg.day ? `lesson.${cfg.day}` : `trail.${id}`);
    const titleKey = `${keyPrefix}.title` as TextKey;
    catalog[titleKey] = merged.title;

    const blocks = buildLessonBlocks(merged, cfg, { keyPrefix, catalog, mediaBase });

    const lessonDef: LessonDef = {
      id: cfg.id,
      title: titleKey,
      kind: cfg.kind,
      blocks,
    };

    if (cfg.day !== undefined) lessonDef.day = cfg.day;

    return lessonDef;
  });

  // 3. Resolve Nodes
  const nodes: NodeDef[] = Object.entries(pack.nodes ?? {}).map(([id, entry]) => {
    const cfg = entry.config;
    const textEsRaw = entry.text?.['es'] ?? '';
    const textLangRaw = language !== 'es' ? entry.text?.[language] : undefined;

    const parsedEs: ParsedNodeContent = typeof textEsRaw === 'string' ? parseNodeMarkdown(textEsRaw) : (textEsRaw as ParsedNodeContent);
    const parsedLang: Partial<ParsedNodeContent> | undefined = textLangRaw ? (typeof textLangRaw === 'string' ? parseNodeMarkdown(textLangRaw) : textLangRaw) : undefined;

    const slug = (cfg as any).slug ?? NODE_ID_TO_SLUG[id] ?? id.replace(/-/g, '');
    const keyPrefix = `node.${slug}`;

    const titleKey = `${keyPrefix}.title` as TextKey;
    catalog[titleKey] = (parsedLang?.title && parsedLang.title.trim()) ? parsedLang.title : parsedEs.title || id;

    // Primer cards
    const primerCards: PrimerCardDef[] = [];
    const esPrimer = parsedEs.primer ?? [];
    const langPrimer = parsedLang?.primer ?? [];
    const maxPrimer = Math.max(esPrimer.length, langPrimer.length, cfg.primerCards?.length ?? 0);

    for (let i = 0; i < maxPrimer; i++) {
      const pEs = esPrimer[i];
      const pLang = langPrimer[i];
      const pCfg = cfg.primerCards?.[i];
      const textKey = `${keyPrefix}.recap${i + 1}` as TextKey;
      catalog[textKey] = (pLang?.text && pLang.text.trim()) ? pLang.text : pEs?.text || '';

      const card: PrimerCardDef = {
        kind: pCfg?.kind ?? (i === 0 ? 'real-world' : 'virtual-dog'),
        text: textKey,
      };

      if (pCfg?.media) {
        const captionKey = `media.caption.${slug}` as TextKey;
        catalog[captionKey] = (pLang?.caption && pLang.caption.trim()) ? pLang.caption : pEs?.caption || '';
        card.media = {
          type: pCfg.media.type,
          url: pCfg.media.url ?? '',
          art: pCfg.media.art,
          caption: captionKey,
          placeholder: pCfg.media.placeholder,
        };
      }
      if (pCfg?.tutorialUrl) card.tutorialUrl = pCfg.tutorialUrl;
      primerCards.push(card);
    }

    // Checkpoint
    const checkpoint: CheckpointQuestion[] = [];
    const esQuestions = parsedEs.checkpoint ?? [];
    const langQuestions = parsedLang?.checkpoint ?? [];
    const maxQuestions = Math.max(esQuestions.length, langQuestions.length);

    for (let q = 0; q < maxQuestions; q++) {
      const n = q + 1;
      const qEs = esQuestions[q];
      const qLang = langQuestions[q];
      const qKey = `${keyPrefix}.tq${n}.question` as TextKey;
      catalog[qKey] = (qLang?.question && qLang.question.trim()) ? qLang.question : qEs?.question || '';

      const options = (qEs?.options ?? []).map((opt, oIdx) => {
        const optSuffix = opt.correct ? 'right' : oIdx === 1 ? 'wrong1' : 'wrong2';
        const optKey = `${keyPrefix}.tq${n}.${optSuffix}` as TextKey;
        const langOpt = qLang?.options?.[oIdx];
        catalog[optKey] = (langOpt?.text && langOpt.text.trim()) ? langOpt.text : opt.text;
        return { text: optKey, correct: opt.correct };
      });

      const expKey = `${keyPrefix}.tq${n}.why` as TextKey;
      catalog[expKey] = (qLang?.explanation && qLang.explanation.trim()) ? qLang.explanation : qEs?.explanation || '';

      checkpoint.push({
        question: qKey,
        options,
        explanation: expKey,
      });
    }

    // Exercises
    const exercises: NodeExercise[] = (cfg.exercises ?? []).map((ex, idx) => {
      const exKey = (ex.key as TextKey) ?? (`${keyPrefix}.exercise${idx + 1}` as TextKey);
      const exText = parsedLang?.exercises?.[ex.metric] ?? parsedEs.exercises?.[ex.metric];
      if (exText) catalog[exKey] = exText;
      return { metric: ex.metric, key: exKey };
    });

    const nodeDef: NodeDef = {
      id: cfg.id,
      title: titleKey,
      mode: cfg.mode,
      primerCards,
      checkpoint,
      simulation: cfg.simulation ?? {},
      exercises,
      prerequisites: cfg.prerequisites ?? [],
    };

    if (cfg.opensAfterLesson) nodeDef.opensAfterLesson = cfg.opensAfterLesson;

    // Debrief
    const hasDebrief = cfg.debrief || (parsedEs.debrief && (parsedEs.debrief.calm || parsedEs.debrief.notCalm));
    if (hasDebrief) {
      const calmKey = `${keyPrefix}.debrief.calm` as TextKey;
      const notCalmKey = `${keyPrefix}.debrief.notcalm` as TextKey;
      catalog[calmKey] = parsedLang?.debrief?.calm ?? parsedEs.debrief?.calm ?? cfg.debrief?.calm ?? '';
      catalog[notCalmKey] = parsedLang?.debrief?.notCalm ?? parsedEs.debrief?.notCalm ?? cfg.debrief?.notCalm ?? '';
      nodeDef.debrief = { calm: calmKey, notCalm: notCalmKey };
    }

    return nodeDef;
  });

  const trailNodeIds = worlds.flatMap((w) => w.stretches.flatMap((s) => s.filter((st) => st.kind === 'node').map((st) => st.id)));
  const homeNodeOrder = ['bark-home', 'destroy', 'eat-objects'];

  nodes.sort((a, b) => {
    const idxA = trailNodeIds.indexOf(a.id);
    const idxB = trailNodeIds.indexOf(b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    const hA = homeNodeOrder.indexOf(a.id);
    const hB = homeNodeOrder.indexOf(b.id);
    if (hA !== -1 && hB !== -1) return hA - hB;
    if (hA !== -1) return -1;
    if (hB !== -1) return 1;
    return a.id.localeCompare(b.id);
  });

  // 4. Resolve Missions
  const trailMissionIds = worlds.flatMap((w) => w.stretches.flatMap((s) => s.filter((st) => st.kind === 'mission').map((st) => st.id)));
  const homeMissionOrder = ['mission-bite-owner', 'mission-bite-others', 'mission-bark-home', 'mission-destroy', 'mission-eat-objects'];

  const missions: MissionDef[] = Object.entries(pack.missions ?? {})
    .sort(([idA], [idB]) => {
      const idxA = trailMissionIds.indexOf(idA);
      const idxB = trailMissionIds.indexOf(idB);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      const hA = homeMissionOrder.indexOf(idA);
      const hB = homeMissionOrder.indexOf(idB);
      if (hA !== -1 && hB !== -1) return hA - hB;
      if (hA !== -1) return -1;
      if (hB !== -1) return 1;
      return idA.localeCompare(idB);
    })
    .map(([id, entry]) => {
    const cfg = entry.config;
    const textEsRaw = entry.text?.['es'] ?? '';
    const textLangRaw = language !== 'es' ? entry.text?.[language] : undefined;

    const parsedEs: ParsedMissionContent = typeof textEsRaw === 'string' ? parseMissionMarkdown(textEsRaw) : (textEsRaw as ParsedMissionContent);
    const parsedLang: Partial<ParsedMissionContent> | undefined = textLangRaw ? (typeof textLangRaw === 'string' ? parseMissionMarkdown(textLangRaw) : textLangRaw) : undefined;

    const slug = (cfg as any).slug ?? MISSION_ID_TO_SLUG[id] ?? id.replace(/^mission-/, '').replace(/-/g, '');
    const prefix = `mission.${slug}`;

    const titleKey = `${prefix}.title` as TextKey;
    const targetKey = `${prefix}.target` as TextKey;
    const successKey = `${prefix}.success` as TextKey;

    catalog[titleKey] = (parsedLang?.title && parsedLang.title.trim()) ? parsedLang.title : parsedEs.title || id;
    catalog[targetKey] = (parsedLang?.target && parsedLang.target.trim()) ? parsedLang.target : parsedEs.target || '';
    catalog[successKey] = (parsedLang?.success && parsedLang.success.trim()) ? parsedLang.success : parsedEs.success || '';

    const trains = (cfg.trains ?? []).map(mapStop);
    const defaultPractise = trains[trains.length - 1] ?? { kind: 'node', id: 'default' };

    const resolveFix = (fixSlug: string, probId: string, fixEs: ParsedMissionFix, fixLang?: ParsedMissionFix, practiseStop: Stop = defaultPractise): Fix => {
      const fixPrefix = `fix.${fixSlug}.${probId}`;
      const k = (n: string) => `${fixPrefix}.${n}` as TextKey;

      catalog[k('reassure')] = (fixLang?.reassure && fixLang.reassure.trim()) ? fixLang.reassure : fixEs.reassure || 'Tranquilo';
      catalog[k('cause')] = (fixLang?.cause && fixLang.cause.trim()) ? fixLang.cause : fixEs.cause || 'Paciencia';
      catalog[k('c1')] = (fixLang?.c1 && fixLang.c1.trim()) ? fixLang.c1 : fixEs.c1 || 'Párate';
      if (!cfg.sharedNote && (fixLang?.c2 || fixEs.c2)) {
        catalog[k('c2')] = (fixLang?.c2 && fixLang.c2.trim()) ? fixLang.c2 : fixEs.c2 || '';
      }
      catalog[k('easier')] = (fixLang?.easier && fixLang.easier.trim()) ? fixLang.easier : fixEs.easier || 'Paso a paso';
      catalog[k('alt')] = (fixLang?.alt && fixLang.alt.trim()) ? fixLang.alt : fixEs.alt || 'Pausa';
      catalog[k('caption')] = (fixLang?.caption && fixLang.caption.trim()) ? fixLang.caption : fixEs.caption || 'Parada';

      const blocks: LessonBlock[] = [
        { type: 'text', text: k('reassure') },
        { type: 'text', text: k('cause') },
        { type: 'text', text: k('c1') },
        { type: 'text', text: cfg.sharedNote ? (cfg.sharedNote as TextKey) : k('c2') },
        { type: 'image', art: `fix/${fixSlug}/${probId}`, alt: k('alt'), caption: k('caption') },
      ];

      return {
        id: `fix-${fixSlug}-${probId}`,
        blocks,
        easierTarget: k('easier'),
        practise: practiseStop,
      };
    };

    const problems: MissionProblem[] = (cfg.problems ?? []).map((prob) => {
      const probEs = parsedEs.problems.find((p) => p.id === prob.id) ?? { id: prob.id, label: prob.id, fix: { reassure: '', cause: '', c1: '', easier: '', alt: '', caption: '' } };
      const probLang = parsedLang?.problems?.find((p) => p.id === prob.id);
      const labelKey = `${prefix}.${prob.id}.label` as TextKey;
      catalog[labelKey] = (probLang?.label && probLang.label.trim()) ? probLang.label : probEs.label;

      const practiseStop = prob.practise ? mapStop(prob.practise) : defaultPractise;
      const fix = resolveFix(slug, prob.id, probEs.fix, probLang?.fix, practiseStop);

      return {
        id: prob.id,
        label: labelKey,
        fix,
      };
    });

    const generalFix = resolveFix(slug, 'general', parsedEs.general ?? { reassure: '', cause: '', c1: '', easier: '', alt: '', caption: '' }, parsedLang?.general, defaultPractise);

    const missionDef: MissionDef = {
      id: cfg.id,
      title: titleKey,
      target: targetKey,
      reps: cfg.reps,
      successSign: successKey,
      technique: cfg.technique,
      trains,
      problems,
      generalFix,
    };

    if (cfg.place) missionDef.place = cfg.place;

    return missionDef;
  });

  return {
    worlds,
    lessons,
    nodes,
    missions,
    catalog,
  };
}

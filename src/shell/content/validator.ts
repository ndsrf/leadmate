import { defaultScenario } from '../../sim/config';
import { validateScenario } from '../../sim/scenery';
import {
  parseLessonMarkdown,
  parseMissionMarkdown,
  parseNodeMarkdown,
  parseWorldMarkdown,
  type ParsedLessonContent,
  type ParsedMissionContent,
  type ParsedNodeContent,
  type ParsedWorldContent,
} from './parser';
import {
  isContentId,
  isRelativeMediaPath,
  isYouTubeId,
  SUPPORTED_METRICS,
  SUPPORTED_MINIGAMES,
  validateLessonYaml,
  validateMissionYaml,
  validateNodeYaml,
  validatePackYaml,
  validateWorldYaml,
  type LessonYaml,
  type MissionYaml,
  type NodeYaml,
  type PackYaml,
  type StopYaml,
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
}

export interface ValidatePackOptions {
  previousManifest?: PreviousManifest;
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
    const isHomeLesson = lId.startsWith('theory-bite-') || lId === 'theory-bark-home' || lId === 'theory-destroy' || lId === 'theory-eat-objects';
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
    const isHomeNode = nId === 'calm-hands' || nId === 'bark-home' || nId === 'destroy' || nId === 'eat-objects';
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

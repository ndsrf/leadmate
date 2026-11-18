/**
 * Usage Analytics Typed Event Contract
 *
 * Rules:
 * - Event names are snake_case object_verb (e.g. `stage_started`, `funnel_step_viewed`).
 * - Property names are snake_case.
 * - Global versioning with SCHEMA_VERSION.
 *   - Additive changes (a new event, an optional property, a new enum value) keep SCHEMA_VERSION.
 *   - Breaking changes (renaming/removing an event, property, or value; changing property meaning/kind) raise SCHEMA_VERSION.
 * - Privacy: only declared properties of kinds int, bool, enum, or id are permitted.
 *   - Free text is forbidden.
 *   - `id` properties must be lowercase, alphanumeric/symbols (. : - _), <=64 chars, and never UUID-shaped.
 *   - `id` values must be content/catalog ids (e.g. node_id, lesson_id, world_id, stop_id), never user-entered text.
 *   - Undeclared or invalid properties cause the event to be dropped (returns null).
 */

export const SCHEMA_VERSION = 1;

export const FUNNEL_STEPS = [
  'welcome',
  'language',
  'dog',
  'concern',
  'taste_briefing',
  'taste_stage',
  'taste_payoff',
  'setup_equipment',
  'setup_weights',
  'setup_about',
  'setup_home',
  'setup_questions',
  'diagnostic',
  'plan',
  'method',
  'first_primer',
  'first_checkpoint',
  'first_walk',
  'first_debrief',
  'register_prompt',
  'account',
  'paywall',
  'map',
] as const;

export type FunnelStep = (typeof FUNNEL_STEPS)[number];

export type PropertyKind =
  | { kind: 'int' }
  | { kind: 'bool' }
  | { kind: 'enum'; values: readonly string[] }
  | { kind: 'id' };

export interface PropertyDefinition {
  kind: PropertyKind;
  optional?: boolean;
}

export type EventDeclaration = Record<string, PropertyDefinition>;

export const EVENTS: Record<string, EventDeclaration> = {
  funnel_step_viewed: {
    step: { kind: { kind: 'enum', values: FUNNEL_STEPS } },
    repeat: { kind: { kind: 'bool' } },
  },
  session_started: {
    days_since_install: { kind: { kind: 'int' } },
    first_session: { kind: { kind: 'bool' } },
    upgraded_install: { kind: { kind: 'bool' } },
  },
  stage_started: {
    stage_kind: { kind: { kind: 'enum', values: ['taste', 'first', 'node', 'daily', 'warmup'] } },
    stage_id: { kind: { kind: 'id' } },
    mode: { kind: { kind: 'enum', values: ['stage', 'close_exercise'] } },
    attempt: { kind: { kind: 'int' } },
    encounter_id: { kind: { kind: 'id' }, optional: true },
    encounter_attempt: { kind: { kind: 'int' }, optional: true },
  },
  stage_ended: {
    stage_kind: { kind: { kind: 'enum', values: ['taste', 'first', 'node', 'daily', 'warmup'] } },
    stage_id: { kind: { kind: 'id' } },
    mode: { kind: { kind: 'enum', values: ['stage', 'close_exercise'] } },
    attempt: { kind: { kind: 'int' } },
    outcome: { kind: { kind: 'enum', values: ['finished', 'skipped', 'left'] } },
    duration_seconds: { kind: { kind: 'int' } },
    handling_score: { kind: { kind: 'int' }, optional: true },
    encounter_id: { kind: { kind: 'id' }, optional: true },
    encounter_attempt: { kind: { kind: 'int' }, optional: true },
    paws: { kind: { kind: 'int' }, optional: true },
  },
  minigame_started: {
    node_id: { kind: { kind: 'id' } },
    attempt: { kind: { kind: 'int' } },
  },
  minigame_ended: {
    node_id: { kind: { kind: 'id' } },
    attempt: { kind: { kind: 'int' } },
    outcome: { kind: { kind: 'enum', values: ['finished', 'left'] } },
    duration_seconds: { kind: { kind: 'int' } },
    handling_score: { kind: { kind: 'int' }, optional: true },
  },
  lesson_opened: {
    lesson_id: { kind: { kind: 'id' } },
    source: { kind: { kind: 'enum', values: ['trail', 'library', 'video_unlock'] } },
  },
  lesson_done: {
    lesson_id: { kind: { kind: 'id' } },
    closed_by: { kind: { kind: 'enum', values: ['done', 'back'] } },
    seconds_on_screen: { kind: { kind: 'int' } },
    scrolled_percent: { kind: { kind: 'int' } },
  },
  checkpoint_answered: {
    node_id: { kind: { kind: 'id' } },
    question_index: { kind: { kind: 'int' } },
    result: { kind: { kind: 'enum', values: ['correct', 'wrong', 'missed'] } },
    seconds_to_answer: { kind: { kind: 'int' } },
  },
  stop_completed: {
    world_id: { kind: { kind: 'id' } },
    stop_id: { kind: { kind: 'id' } },
    stop_kind: { kind: { kind: 'enum', values: ['lesson', 'node', 'mission'] } },
    stop_index: { kind: { kind: 'int' } },
  },
};

export interface CommonProperties {
  app_version: string;
  content_version: number;
  content_channel: 'stable' | 'beta';
  language: 'es' | 'en';
  seconds_since_install: number;
}

export interface BuiltEvent {
  name: string;
  properties: Record<string, string | number | boolean>;
}

const ID_REGEX = /^[a-z0-9][a-z0-9_.:-]{0,63}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateAndCoerceValue(
  def: PropertyDefinition,
  value: unknown
): string | number | boolean | null {
  if (value === undefined || value === null) {
    if (def.optional) {
      return null;
    }
    return null;
  }

  const kind = def.kind;
  switch (kind.kind) {
    case 'int': {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null;
      }
      return Math.round(value);
    }
    case 'bool': {
      if (typeof value !== 'boolean') {
        return null;
      }
      return value;
    }
    case 'enum': {
      if (typeof value !== 'string' || !kind.values.includes(value)) {
        return null;
      }
      return value;
    }
    case 'id': {
      if (typeof value !== 'string') {
        return null;
      }
      if (!ID_REGEX.test(value)) {
        return null;
      }
      if (UUID_REGEX.test(value)) {
        return null;
      }
      return value;
    }
  }
}

export function buildEvent(
  name: string,
  props: Record<string, unknown>,
  common: CommonProperties
): BuiltEvent | null {
  const declaration = EVENTS[name];
  if (!declaration) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(`[analytics] Dropping event with unknown name: "${name}"`);
    }
    return null;
  }

  // Reject undeclared properties
  for (const key of Object.keys(props)) {
    if (!(key in declaration)) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn(`[analytics] Dropping event "${name}": undeclared property "${key}"`);
      }
      return null;
    }
  }

  const validatedProps: Record<string, string | number | boolean> = {};

  for (const [propName, propDef] of Object.entries(declaration)) {
    const rawVal = props[propName];
    if (rawVal === undefined || rawVal === null) {
      if (!propDef.optional) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(`[analytics] Dropping event "${name}": missing required property "${propName}"`);
        }
        return null;
      }
      // optional and omitted
      continue;
    }

    const coerced = validateAndCoerceValue(propDef, rawVal);
    if (coerced === null) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn(
          `[analytics] Dropping event "${name}": invalid value for property "${propName}": ${JSON.stringify(
            rawVal
          )}`
        );
      }
      return null;
    }
    validatedProps[propName] = coerced;
  }

  const secondsSinceInstall = Math.max(0, Math.round(common.seconds_since_install || 0));

  const properties: Record<string, string | number | boolean> = {
    schema_version: SCHEMA_VERSION,
    app_version: common.app_version,
    content_version: Math.round(common.content_version),
    content_channel: common.content_channel,
    language: common.language,
    seconds_since_install: secondsSinceInstall,
    ...validatedProps,
  };

  return {
    name,
    properties,
  };
}

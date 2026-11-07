import { findLesson } from './lessons/content';
import { findMission } from './missions/content';
import { findNode } from './nodes/content';
import { HOME_CONCERNS, type HomeConcern } from './concerns';

/** The content a Home Behaviour has: the ids of its Lesson, Node and Mission; absent while it has none. */
export interface HomeBehaviourContent {
  lesson?: string;
  node?: string;
  mission?: string;
}

export const CONTENT_PARTS = ['lesson', 'node', 'mission'] as const;
export type ContentPart = (typeof CONTENT_PARTS)[number];

/**
 * The parts each Home Behaviour must have. Biting others has no exercise by design: a simulation
 * that can be failed is the wrong way to teach bite handling, so a missing Node there is not a gap.
 */
export const REQUIRED_PARTS: Record<HomeConcern, readonly ContentPart[]> = {
  'bite-owner': CONTENT_PARTS,
  'bite-others': ['lesson', 'mission'],
  'bark-home': CONTENT_PARTS,
  destroy: CONTENT_PARTS,
  'eat-objects': CONTENT_PARTS,
};

/** What each Home Behaviour has: the ids of its Lesson, Node and Mission. */
export const HOME_BEHAVIOUR_CONTENT: Record<HomeConcern, HomeBehaviourContent> = {
  'bite-owner': { lesson: 'theory-bite-owner', node: 'calm-hands', mission: 'mission-bite-owner' },
  'bite-others': { lesson: 'theory-bite-others', mission: 'mission-bite-others' },
  'bark-home': { lesson: 'theory-bark-home', node: 'bark-home', mission: 'mission-bark-home' },
  destroy: { lesson: 'theory-destroy', node: 'destroy', mission: 'mission-destroy' },
  'eat-objects': { lesson: 'theory-eat-objects', node: 'eat-objects', mission: 'mission-eat-objects' },
};

/**
 * Home Behaviour content that is known to be missing, as "concern:part". The coverage test fails when an entry
 * is for content that now exists, and when content is missing without an entry here, so neither can be forgotten.
 * Empty: every Home Behaviour has all the parts it requires.
 */
export const KNOWN_GAPS: readonly string[] = [];

const REGISTRY: Record<ContentPart, (id: string) => unknown> = { lesson: findLesson, node: findNode, mission: findMission };

/** True when the Home Behaviour has this part and it exists in the shipped content. */
export function hasContent(concern: HomeConcern, part: ContentPart): boolean {
  const id = HOME_BEHAVIOUR_CONTENT[concern][part];
  return id !== undefined && REGISTRY[part](id) !== undefined;
}

/** The part-by-part gaps of a Home Behaviour computed from the content. */
export function contentGaps(): string[] {
  return HOME_CONCERNS.flatMap((c) => REQUIRED_PARTS[c].filter((part) => !hasContent(c, part)).map((part) => `${c}:${part}`));
}

/** True when the Home Behaviour has a Lesson of its own, so a plan item for it needs no "coming soon" line. */
export const hasDedicatedLesson = (concern: HomeConcern): boolean => hasContent(concern, 'lesson');

/** One Home Behaviour as the Other Home Behaviours section shows it. */
export interface HomeBehaviourEntry {
  concern: HomeConcern;
  /** The Dog's level for it, 0 when it is not a Concern. */
  level: 0 | 1 | 2 | 3;
  /** True when it is a Concern for the Dog (one declared after World 2 was complete stays in the section with its level). */
  isConcern: boolean;
  /** No Lesson of its own yet: the row is a "coming soon" placeholder. */
  comingSoon: boolean;
}

/**
 * The rows of Other Home Behaviours: one per Home Behaviour in the usual order, except those whose Home Stretch is a
 * Stretch of World 2 for this Dog (`inWorld`). These Stretches gate nothing and count in no total of the trail.
 */
export function homeBehaviourEntries(
  homeConcerns: Readonly<Partial<Record<HomeConcern, 1 | 2 | 3>>>,
  inWorld: (concern: HomeConcern) => boolean = () => false,
): HomeBehaviourEntry[] {
  return HOME_CONCERNS.filter((concern) => !inWorld(concern)).map((concern) => {
    const level = homeConcerns[concern] ?? 0;
    return { concern, level, isConcern: level > 0, comingSoon: !hasDedicatedLesson(concern) };
  });
}

/** The Stops of a Home Behaviour's Stretch (ADR 0023): its Lesson, its Node when it has one, and its Mission. */
export function homeStretchOf(concern: HomeConcern): { kind: 'lesson' | 'node' | 'mission'; id: string }[] {
  const own = HOME_BEHAVIOUR_CONTENT[concern];
  const stops: { kind: 'lesson' | 'node' | 'mission'; id: string }[] = [];
  for (const part of CONTENT_PARTS) {
    const id = own[part];
    if (id && hasContent(concern, part)) stops.push({ kind: part, id });
  }
  return stops;
}

/** Every Home Stretch that has a Lesson, biting first, with its Concern. */
export function homeStretchStops(): { concern: HomeConcern; stops: { kind: 'lesson' | 'node' | 'mission'; id: string }[] }[] {
  return HOME_CONCERNS.map((concern) => ({ concern, stops: homeStretchOf(concern) })).filter((h) => h.stops.length > 0 && h.stops[0].kind === 'lesson');
}

/**
 * The Home Stretches that are Stretches of World 2 for a Dog: those of a Concern it has that belong to World 2
 * (`worldHome`; absent means every Concern it has), and any of those already started when the Concern was removed.
 */
export function homeStretchesInWorldTwo(
  homeConcerns: Readonly<Partial<Record<HomeConcern, 1 | 2 | 3>>>,
  worldHome: readonly HomeConcern[] | undefined,
  started: (stops: { kind: 'lesson' | 'node' | 'mission'; id: string }[]) => boolean,
) {
  const members = worldHome ?? HOME_CONCERNS.filter((c) => (homeConcerns[c] ?? 0) > 0);
  return homeStretchStops().filter((h) => members.includes(h.concern) && ((homeConcerns[h.concern] ?? 0) > 0 || started(h.stops)));
}

/** What a Home Behaviour has done toward its own progress: parts it has, and how many are finished. Never part of a World's. */
export function homeBehaviourProgress(
  concern: HomeConcern,
  done: { readLessons: readonly string[]; completedNodes: readonly string[]; missions: Readonly<Record<string, { passedOn?: string }>> },
  content: Record<HomeConcern, HomeBehaviourContent> = HOME_BEHAVIOUR_CONTENT,
): { done: number; total: number } {
  const own = content[concern];
  const parts: boolean[] = [];
  if (own.lesson) parts.push(done.readLessons.includes(own.lesson));
  if (own.node) parts.push(done.completedNodes.includes(own.node));
  if (own.mission) parts.push(!!done.missions[own.mission]?.passedOn);
  return { done: parts.filter(Boolean).length, total: parts.length };
}

/** What of the Dog record the Home Behaviours read: finished Lessons and Nodes, and the Missions' states. */
export interface HomeBehaviourDone {
  readLessons: readonly string[];
  completedNodes: readonly string[];
  missions: Readonly<Record<string, { passedOn?: string; startedAt?: string }>>;
}

/** One button of an opened Home Behaviour row: its Lesson, Exercise (the Node) or Mission. */
export interface BehaviourAction {
  part: ContentPart;
  id: string;
  /** Lesson, Exercise and Mission are all open (Other Home Behaviours is optional, ADR 0021). */
  enabled: boolean;
  done: boolean;
}

/** The buttons of a Home Behaviour row: only the parts that exist, in the order Lesson, Exercise, Mission. */
export function behaviourActions(entry: Pick<HomeBehaviourEntry, 'concern' | 'isConcern'>, done: HomeBehaviourDone): BehaviourAction[] {
  const own = HOME_BEHAVIOUR_CONTENT[entry.concern];
  const actions: BehaviourAction[] = [];
  for (const part of CONTENT_PARTS) {
    const id = own[part];
    if (!id || !hasContent(entry.concern, part)) continue;
    const finished = part === 'lesson' ? done.readLessons.includes(id) : part === 'node' ? done.completedNodes.includes(id) : !!done.missions[id]?.passedOn;
    actions.push({ part, id, enabled: true, done: finished });
  }
  return actions;
}

const STOP_PART = { lesson: 'lesson', node: 'node', mission: 'mission' } as const;

/** The Home Behaviour a Stop belongs to; undefined for a Stop of a World. */
export function homeConcernOfStop(stop: { kind: 'lesson' | 'node' | 'mission'; id: string }): HomeConcern | undefined {
  return HOME_CONCERNS.find((c) => HOME_BEHAVIOUR_CONTENT[c][STOP_PART[stop.kind]] === stop.id);
}

/** True for the Mission of a Home Behaviour. */
export const isHomeMission = (missionId: string): boolean => homeConcernOfStop({ kind: 'mission', id: missionId }) !== undefined;

/** True when a Personal Plan item names the Home Stretch of a Home Behaviour (by its Lesson) rather than a Stretch of a World. */
export const isHomeStretchId = (stretchId: string): boolean => homeConcernOfStop({ kind: 'lesson', id: stretchId }) !== undefined;

/** The Mission of the Home Behaviour whose Node this is; undefined for any other Node. */
export const homeMissionOfNode = (nodeId: string): string | undefined => {
  const concern = homeConcernOfStop({ kind: 'node', id: nodeId });
  return concern && HOME_BEHAVIOUR_CONTENT[concern].mission;
};

/**
 * The Mission whose brief opens when a Home Behaviour's last step before it is done: its Node's Debrief closing, or its
 * Lesson being read when it has no Node (the biting ones). Only for a Concern whose Mission is not started or passed;
 * null means back to the map and its Home Behaviours section.
 */
export function homeMissionAfter(
  stop: { kind: 'lesson' | 'node'; id: string },
  record: { homeConcerns: Readonly<Partial<Record<HomeConcern, 1 | 2 | 3>>>; missions: HomeBehaviourDone['missions'] },
): string | null {
  const concern = homeConcernOfStop(stop);
  if (!concern || (record.homeConcerns[concern] ?? 0) === 0) return null;
  const own = HOME_BEHAVIOUR_CONTENT[concern];
  const lastBeforeMission = own.node ? stop.kind === 'node' : stop.kind === 'lesson';
  const missionId = own.mission;
  if (!lastBeforeMission || !missionId || !hasContent(concern, 'mission')) return null;
  const state = record.missions[missionId];
  return state?.passedOn || state?.startedAt ? null : missionId;
}

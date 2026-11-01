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

/** What each Home Behaviour has today. `add-home-behaviour-training` fills this in; until then the whole table is gaps. */
export const HOME_BEHAVIOUR_CONTENT: Record<HomeConcern, HomeBehaviourContent> = {
  'bite-owner': {},
  'bite-others': {},
  'bark-home': {},
  destroy: {},
  'eat-objects': {},
};

/**
 * Home Behaviour content that is known to be missing, as "concern:part". The coverage test fails when an entry
 * is for content that now exists, and when content is missing without an entry here, so neither can be forgotten.
 */
export const KNOWN_GAPS: readonly string[] = HOME_CONCERNS.flatMap((c) => CONTENT_PARTS.map((part) => `${c}:${part}`));

const REGISTRY: Record<ContentPart, (id: string) => unknown> = { lesson: findLesson, node: findNode, mission: findMission };

/** True when the Home Behaviour has this part and it exists in the shipped content. */
export function hasContent(concern: HomeConcern, part: ContentPart): boolean {
  const id = HOME_BEHAVIOUR_CONTENT[concern][part];
  return id !== undefined && REGISTRY[part](id) !== undefined;
}

/** The part-by-part gaps of a Home Behaviour computed from the content. */
export function contentGaps(): string[] {
  return HOME_CONCERNS.flatMap((c) => CONTENT_PARTS.filter((part) => !hasContent(c, part)).map((part) => `${c}:${part}`));
}

/** True when the Home Behaviour has a Lesson of its own, so a plan item for it needs no "coming soon" line. */
export const hasDedicatedLesson = (concern: HomeConcern): boolean => hasContent(concern, 'lesson');

/** One Home Behaviour as the World Map's Home Behaviours section shows it. */
export interface HomeBehaviourEntry {
  concern: HomeConcern;
  /** The Dog's level for it, 0 when it is not a Concern. */
  level: 0 | 1 | 2 | 3;
  /** True when it is a Concern for the Dog; otherwise its row is folded to a header. */
  isConcern: boolean;
  /** No Lesson of its own yet: the row is a "coming soon" placeholder. */
  comingSoon: boolean;
}

/**
 * The section's rows, one per Home Behaviour in the usual order. These Stretches are not part of any World, so they
 * count in no completion, unlock or progress total of the trail.
 */
export function homeBehaviourEntries(homeConcerns: Readonly<Partial<Record<HomeConcern, 1 | 2 | 3>>>): HomeBehaviourEntry[] {
  return HOME_CONCERNS.map((concern) => {
    const level = homeConcerns[concern] ?? 0;
    return { concern, level, isConcern: level > 0, comingSoon: !hasDedicatedLesson(concern) };
  });
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

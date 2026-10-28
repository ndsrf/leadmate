import type { TextKey, Translate } from '../../i18n';
import { findFix } from '../missions/content';
import type { Fix, MissionDef, SeenFix } from '../missions/mission';
import { placeOfLesson } from '../world';
import type { LessonDef, LibraryEntry } from './lesson';

/** The kind of a Lesson, named in text: "Teoría" or "Cómo se juega". */
export function lessonKindLabel(lesson: Pick<LessonDef, 'kind'>, t: Translate): string {
  return t(`lesson.kind.${lesson.kind}`);
}

/** Where a Lesson belongs: its suggested day ("Día 3"), or its place on a trail ("Mundo 2 · Tramo 1"). */
export function lessonPlaceLabel(lesson: Pick<LessonDef, 'id' | 'day'>, t: Translate): string {
  if (lesson.day !== undefined) return `${t('library.day')} ${lesson.day}`;
  const place = placeOfLesson(lesson.id);
  return place ? t('library.place').replace('{world}', String(place.world)).replace('{stretch}', String(place.stretch)) : '';
}

/** A Library entry for a screen reader: place, kind, title, minutes, read state and "for today". */
export function libraryEntryLabel({ lesson, read, today }: LibraryEntry, t: Translate): string {
  const parts = [lessonPlaceLabel(lesson, t), lessonKindLabel(lesson, t), t(lesson.title), `${lesson.minutes} ${t('lesson.minutes')}`, t(read ? 'library.read' : 'library.unread')];
  if (today) parts.push(t('library.today'));
  return `${parts.filter((p) => p !== '').join('. ')}.`;
}

export interface FixEntry {
  fix: Fix;
  mission: MissionDef;
  problem: TextKey;
  /** When the Fix was first shown. */
  at: string;
}

/** "Tus ajustes": every Fix the user has been shown, most recent first; a Fix no longer in the catalog is left out. */
export function fixEntries(seen: readonly SeenFix[]): FixEntry[] {
  return seen
    .flatMap((s): FixEntry[] => {
      const found = findFix(s.fixId);
      return found ? [{ ...found, at: s.at }] : [];
    })
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

/** One "Tus ajustes" entry: "«Mission» · «problem»". */
export function fixEntryLabel(entry: FixEntry, t: Translate): string {
  return t('library.fixEntry').replace('{mission}', t(entry.mission.title)).replace('{problem}', t(entry.problem));
}

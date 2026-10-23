import { LESSONS } from './content';
import { libraryEntries } from './lesson';
import { lessonItems, readingProgress } from './lessonRun';

describe('lessonItems', () => {
  it('ends every Lesson with the Done action, once', () => {
    for (const l of LESSONS) {
      const items = lessonItems(l);
      expect(items[items.length - 1]).toEqual({ type: 'done' });
      expect(items.filter((i) => i.type === 'done')).toHaveLength(1);
      expect(items.slice(0, -1)).toEqual(l.blocks);
    }
  });
});

describe('readingProgress', () => {
  it('maps the scroll offset to a percentage and clamps it', () => {
    expect(readingProgress(0, 1000, 500)).toBe(0);
    expect(readingProgress(250, 1000, 500)).toBe(50);
    expect(readingProgress(900, 1000, 500)).toBe(100);
    expect(readingProgress(-20, 1000, 500)).toBe(0);
  });

  it('is complete when the content fits the viewport', () => {
    expect(readingProgress(0, 400, 800)).toBe(100);
    expect(readingProgress(0, 0, 0)).toBe(100);
  });
});

describe('libraryEntries', () => {
  it('keeps the fixed order and puts the Lesson for today first', () => {
    const entries = libraryEntries(LESSONS, ['calm-leash'], 3);
    expect(entries.map((e) => e.lesson.id)).toEqual(['body-language', 'calm-leash', 'smile-leash', 'marking-rewarding', 'sniffing-decompression']);
    expect(entries.filter((e) => e.today)).toHaveLength(1);
    expect(entries.find((e) => e.lesson.id === 'calm-leash')?.read).toBe(true);
  });

  it('marks nothing for today before the first Stage or when caught up', () => {
    expect(libraryEntries(LESSONS, [], null).some((e) => e.today)).toBe(false);
    expect(libraryEntries(LESSONS, ['calm-leash'], 1).some((e) => e.today)).toBe(false);
  });
});

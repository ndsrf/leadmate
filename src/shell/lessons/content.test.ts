import { es } from '../../i18n';
import { videoEmbedUrl } from '../ui/media';
import { LESSONS } from './content';

describe('placeholder Lessons', () => {
  it('has unique ids and days 1 to 5', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    for (const day of [1, 2, 3, 4, 5]) expect(LESSONS.some((l) => l.day === day)).toBe(true);
  });

  it('only uses catalog keys, and Lesson text is flagged placeholder', () => {
    for (const l of LESSONS) {
      expect(l.placeholder).toBe(true);
      expect(es[l.title]).toBeTruthy();
      for (const b of l.blocks) {
        if (b.type === 'heading' || b.type === 'text' || b.type === 'tip') expect(es[b.text]).toBeTruthy();
        else {
          expect(es[b.alt]).toBeTruthy();
          expect(es[b.caption]).toBeTruthy();
          expect(b.placeholder).toBe(true);
        }
      }
    }
  });

  it('has an embeddable video id in every Lesson', () => {
    for (const l of LESSONS) {
      const videos = l.blocks.filter((b) => b.type === 'video');
      expect(videos.length).toBeGreaterThan(0);
      for (const v of videos) if (v.type === 'video') expect(videoEmbedUrl(v.videoId)).not.toBeNull();
    }
  });

  it('mixes text, image and video', () => {
    for (const l of LESSONS) for (const type of ['text', 'image', 'video'] as const) expect(l.blocks.some((b) => b.type === type)).toBe(true);
  });
});

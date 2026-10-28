import { es } from '../../i18n';
import { videoEmbedUrl } from '../ui/media';
import { FIRST_WEEK_LESSONS, LESSONS, TRAIL_LESSONS } from './content';

describe('placeholder Lessons', () => {
  it('has unique ids, and the first week covers days 1 to 5', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    for (const day of [1, 2, 3, 4, 5]) expect(FIRST_WEEK_LESSONS.some((l) => l.day === day)).toBe(true);
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

  it('has an embeddable video id in every first-week Lesson', () => {
    for (const l of FIRST_WEEK_LESSONS) {
      const videos = l.blocks.filter((b) => b.type === 'video');
      expect(videos.length).toBeGreaterThan(0);
      for (const v of videos) if (v.type === 'video') expect(videoEmbedUrl(v.videoId)).not.toBeNull();
    }
  });

  it('mixes text and media in every Lesson', () => {
    for (const l of LESSONS) {
      expect(l.blocks.some((b) => b.type === 'text')).toBe(true);
      expect(l.blocks.some((b) => b.type === 'image' || b.type === 'video')).toBe(true);
    }
    for (const l of FIRST_WEEK_LESSONS) for (const type of ['text', 'image', 'video'] as const) expect(l.blocks.some((b) => b.type === type)).toBe(true);
  });
});

describe('trail Lessons', () => {
  it('have a kind, and the first-week Lessons are theory', () => {
    for (const l of LESSONS) expect(['theory', 'how-to-play']).toContain(l.kind);
    expect(FIRST_WEEK_LESSONS.every((l) => l.kind === 'theory')).toBe(true);
  });

  it('have no suggested day', () => {
    for (const l of TRAIL_LESSONS) expect(l.day).toBeUndefined();
  });

  it('show every control of a How-to-play Lesson with an image or video', () => {
    const howTo = TRAIL_LESSONS.filter((l) => l.kind === 'how-to-play');
    expect(howTo.map((l) => l.id)).toEqual(['howto-tap-hold', 'howto-walking', 'howto-cues', 'howto-long-leash']);
    for (const l of howTo) {
      const headings = l.blocks.filter((b) => b.type === 'heading').length;
      const media = l.blocks.filter((b) => b.type === 'image' || b.type === 'video').length;
      expect(media).toBeGreaterThan(0);
      expect(media).toBe(headings);
    }
  });

  it('cover the joystick, the leash, the Poste and Go Sniff before the first walk', () => {
    const walking = TRAIL_LESSONS.find((l) => l.id === 'howto-walking')!;
    const text = walking.blocks.map((b) => (b.type === 'heading' ? es[b.text] : '')).join(' ');
    for (const word of ['joystick', 'correa', 'Poste', 'Olfatear']) expect(text).toContain(word);
  });
});

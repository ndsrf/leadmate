import { activeLine, lineTextKey, parseAnimationTimeline, TIMELINE_MAX_BYTES } from './animationTimeline';

const valid = {
  version: 1,
  duration: 8,
  beats: [
    { id: 'look', start: 0, end: 3 },
    { id: 'mark', start: 3, end: 6 },
    { id: 'treat', start: 6, end: 8 },
  ],
  lines: [{ id: 'bien', start: 3.4, end: 4.6, voice: 'marker' }],
};
const parse = (v: unknown) => parseAnimationTimeline(JSON.stringify(v));
const withBeats = (beats: unknown[]) => parse({ ...valid, beats });
const withLines = (lines: unknown[]) => parse({ ...valid, lines });

describe('parseAnimationTimeline', () => {
  it('reads a valid file', () => {
    expect(parse(valid)).toEqual(valid);
    expect(parse({ ...valid, lines: undefined })).toEqual({ ...valid, lines: [] });
    expect(withLines([{ id: 'vamos', start: 4, end: 5 }])?.lines).toEqual([{ id: 'vamos', start: 4, end: 5 }]);
  });

  it('rejects anything that is not a version 1 timeline', () => {
    expect(parseAnimationTimeline('not json')).toBeNull();
    expect(parseAnimationTimeline('[]')).toBeNull();
    expect(parse({ ...valid, version: 2 })).toBeNull();
    expect(parse({ ...valid, beats: undefined })).toBeNull();
    expect(parse({ ...valid, lines: {} })).toBeNull();
  });

  it('rejects a file over 16 KB', () => {
    const big = JSON.stringify({ ...valid, pad: 'x'.repeat(TIMELINE_MAX_BYTES) });
    expect(parseAnimationTimeline(big)).toBeNull();
  });

  it('rejects a duration that is missing, not finite, zero or over 15 s', () => {
    for (const duration of [undefined, '8', 0, -1, 15.1, 1e400]) expect(parse({ ...valid, duration })).toBeNull();
    expect(parse({ ...valid, duration: 15 })).not.toBeNull();
  });

  it('rejects times that are not finite numbers or break 0 ≤ start < end ≤ duration', () => {
    for (const beat of [
      { id: 'a', start: -0.1, end: 1 },
      { id: 'a', start: 1, end: 1 },
      { id: 'a', start: 2, end: 1 },
      { id: 'a', start: 0, end: 8.1 },
      { id: 'a', start: '0', end: 1 },
      { id: 'a', start: 0, end: null },
    ]) {
      expect(withBeats([beat])).toBeNull();
      expect(withLines([beat])).toBeNull();
    }
    // JSON cannot carry Infinity or NaN; a hand-written one still fails
    expect(parseAnimationTimeline('{"version":1,"duration":8,"beats":[{"id":"a","start":0,"end":1e999}]}')).toBeNull();
  });

  it('rejects beats out of order or overlapping, and accepts touching ones', () => {
    expect(withBeats([{ id: 'b', start: 3, end: 6 }, { id: 'a', start: 0, end: 3 }])).toBeNull();
    expect(withBeats([{ id: 'a', start: 0, end: 3.5 }, { id: 'b', start: 3, end: 6 }])).toBeNull();
    expect(withBeats([{ id: 'a', start: 0, end: 3 }, { id: 'b', start: 3, end: 6 }])).not.toBeNull();
  });

  it('rejects an id outside the key pattern', () => {
    for (const id of ['Bien', 'a.b', 'a/b', '-a', '', 7]) {
      expect(withBeats([{ id, start: 0, end: 1 }])).toBeNull();
      expect(withLines([{ id, start: 0, end: 1 }])).toBeNull();
    }
  });

  it('rejects a voice other than cue or marker', () => {
    expect(withLines([{ id: 'bien', start: 1, end: 2, voice: 'shout' }])).toBeNull();
    expect(withLines([{ id: 'vamos', start: 1, end: 2, voice: 'cue' }])).not.toBeNull();
  });

  it('drops a Line with no catalog text and keeps the rest', () => {
    const json = JSON.stringify({ ...valid, lines: [{ id: 'hola', start: 1, end: 2 }, ...valid.lines] });
    const timeline = parseAnimationTimeline(json, (id) => id === 'bien');
    expect(timeline?.lines.map((l) => l.id)).toEqual(['bien']);
    expect(timeline?.beats).toEqual(valid.beats);
  });
});

describe('activeLine', () => {
  const timeline = parse(valid);

  it('includes the start of a range and excludes its end', () => {
    expect(activeLine(timeline, 3.39)).toBeNull();
    expect(activeLine(timeline, 3.4)?.id).toBe('bien');
    expect(activeLine(timeline, 4.59)?.id).toBe('bien');
    expect(activeLine(timeline, 4.6)).toBeNull();
  });

  it('starts over after a loop, when t is back near 0', () => {
    expect(activeLine(timeline, 7.9)).toBeNull();
    expect(activeLine(timeline, 0.05)).toBeNull();
    expect(activeLine(timeline, 3.5)?.id).toBe('bien');
  });

  it('shows nothing without a timeline', () => {
    expect(activeLine(null, 3.5)).toBeNull();
  });
});

describe('lineTextKey', () => {
  it('names the Line under the animation prefix', () => {
    expect(lineTextKey('lesson.4.animation.caption', 'bien')).toBe('lesson.4.animation.line.bien');
  });
});

import { shouldStartSession, daysSince, secondsSince, SESSION_BACKGROUND_THRESHOLD_MS } from './session';

describe('App Session Utilities (Task 5.1)', () => {
  describe('shouldStartSession', () => {
    it('returns false when no background timestamp exists', () => {
      expect(shouldStartSession(null, Date.now())).toBe(false);
      expect(shouldStartSession(undefined, Date.now())).toBe(false);
    });

    it('returns false after a short background of 5 minutes', () => {
      const now = new Date('2026-11-18T10:05:00.000Z');
      const fiveMinAgo = new Date('2026-11-18T10:00:00.000Z');
      expect(shouldStartSession(fiveMinAgo, now)).toBe(false);
    });

    it('returns true after a long background of 45 minutes', () => {
      const now = new Date('2026-11-18T10:45:00.000Z');
      const fortyFiveMinAgo = new Date('2026-11-18T10:00:00.000Z');
      expect(shouldStartSession(fortyFiveMinAgo, now)).toBe(true);
    });

    it('returns true exactly at the 30 minute threshold', () => {
      const now = new Date('2026-11-18T10:30:00.000Z');
      const thirtyMinAgo = new Date('2026-11-18T10:00:00.000Z');
      expect(shouldStartSession(thirtyMinAgo, now)).toBe(true);
    });

    it('returns false at 29 minutes and 59 seconds', () => {
      const now = new Date('2026-11-18T10:29:59.000Z');
      const backgroundAt = new Date('2026-11-18T10:00:00.000Z');
      expect(shouldStartSession(backgroundAt, now)).toBe(false);
    });
  });

  describe('secondsSince', () => {
    it('computes whole seconds since start', () => {
      const start = new Date('2026-11-18T10:00:00.000Z');
      const now = new Date('2026-11-18T10:01:25.500Z');
      expect(secondsSince(start, now)).toBe(85);
    });

    it('clamps negative values to 0 if clock is set backwards', () => {
      const start = new Date('2026-11-18T10:05:00.000Z');
      const now = new Date('2026-11-18T10:00:00.000Z');
      expect(secondsSince(start, now)).toBe(0);
    });
  });

  describe('daysSince', () => {
    it('computes whole days since start', () => {
      const start = new Date('2026-11-10T10:00:00.000Z');
      const now = new Date('2026-11-18T15:00:00.000Z');
      expect(daysSince(start, now)).toBe(8);
    });

    it('returns 0 on the same day', () => {
      const start = new Date('2026-11-18T08:00:00.000Z');
      const now = new Date('2026-11-18T18:00:00.000Z');
      expect(daysSince(start, now)).toBe(0);
    });

    it('clamps negative values to 0 if clock is set backwards', () => {
      const start = new Date('2026-11-18T10:00:00.000Z');
      const now = new Date('2026-11-10T10:00:00.000Z');
      expect(daysSince(start, now)).toBe(0);
    });
  });
});

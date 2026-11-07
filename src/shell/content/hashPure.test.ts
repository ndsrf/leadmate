import { createHash } from 'node:crypto';
import { sha256Bytes } from './hash';

describe('sha256Bytes (pure JS)', () => {
  it('matches node crypto across lengths', () => {
    for (const n of [0, 1, 3, 55, 56, 63, 64, 65, 119, 120, 1000]) {
      const b = Uint8Array.from({ length: n }, (_, i) => (i * 7 + 3) & 255);
      const exp = createHash('sha256').update(b).digest('hex');
      expect(Buffer.from(sha256Bytes(b)).toString('hex')).toBe(exp);
    }
  });
});

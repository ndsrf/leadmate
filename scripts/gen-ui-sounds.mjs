// Generates the UI sounds (press, success, star, unlock) as short mono 16-bit WAV files.
// They are synthesized by this script, so they are original to the project and need no credit.
// Usage: node scripts/gen-ui-sounds.mjs [outDir]
import { mkdirSync, writeFileSync } from 'node:fs';

const out = process.argv[2] ?? 'assets/ui';
const RATE = 22050;

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const head = Buffer.alloc(44);
  head.write('RIFF', 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write('WAVEfmt ', 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(1, 22);
  head.writeUInt32LE(RATE, 24);
  head.writeUInt32LE(RATE * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write('data', 36);
  head.writeUInt32LE(data.length, 40);
  return Buffer.concat([head, data]);
}

/** A soft bell-like note: a sine and its octave under a fast attack and an exponential decay. */
function note(freq, seconds, gain = 0.4) {
  const n = Math.floor(seconds * RATE);
  return Array.from({ length: n }, (_, i) => {
    const t = i / RATE;
    const env = Math.min(1, i / (0.004 * RATE)) * Math.exp((-5 * i) / n);
    return env * gain * (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t));
  });
}

function mix(...parts) {
  const len = Math.max(...parts.map((p) => p.offset + p.samples.length));
  const buf = new Array(len).fill(0);
  for (const { offset, samples } of parts) samples.forEach((v, i) => (buf[offset + i] += v));
  return buf;
}
const at = (s, samples) => ({ offset: Math.floor(s * RATE), samples });

mkdirSync(out, { recursive: true });
const sounds = {
  press: note(520, 0.07, 0.3),
  success: mix(at(0, note(523, 0.18)), at(0.09, note(784, 0.28))),
  star: mix(at(0, note(880, 0.2)), at(0.05, note(1320, 0.3, 0.25))),
  unlock: mix(at(0, note(523, 0.2)), at(0.1, note(659, 0.2)), at(0.2, note(784, 0.2)), at(0.3, note(1047, 0.45))),
};
for (const [name, samples] of Object.entries(sounds)) writeFileSync(`${out}/${name}.wav`, wav(samples));
console.log('wrote', Object.keys(sounds).join(', '), 'to', out);

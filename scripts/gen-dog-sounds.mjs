// Generates the placeholder dog vocalizations (bark, whine, growl) as small mono 16-bit WAV files.
// They are synthesized, so they are stand-ins until recorded assets replace them.
// Usage: node scripts/gen-dog-sounds.mjs [outDir]
import { mkdirSync, writeFileSync } from 'node:fs';

const out = process.argv[2] ?? 'assets/dog';
const RATE = 16000;

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

let seed = 7;
const noise = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2147483648 - 1);

/** A tone with a pitch glide, a harmonic and a little noise, shaped by an attack/decay envelope. */
function voice({ seconds, from, to, noiseMix, attack, decay, vibrato = 0 }) {
  const n = Math.floor(seconds * RATE);
  const samples = [];
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const f = (from + (to - from) * t) * (1 + vibrato * Math.sin(i / RATE * 40));
    phase += (2 * Math.PI * f) / RATE;
    const env = Math.min(1, i / (attack * RATE)) * Math.exp(-decay * t);
    const tone = Math.sin(phase) + 0.5 * Math.sin(2 * phase) + 0.25 * Math.sin(3 * phase);
    samples.push(env * ((1 - noiseMix) * tone * 0.45 + noiseMix * noise() * 0.6));
  }
  return samples;
}

mkdirSync(out, { recursive: true });
const gap = (s) => new Array(Math.floor(s * RATE)).fill(0);
// a sharp double bark
const bark = [...voice({ seconds: 0.16, from: 520, to: 300, noiseMix: 0.35, attack: 0.008, decay: 5 }), ...gap(0.07), ...voice({ seconds: 0.16, from: 560, to: 320, noiseMix: 0.35, attack: 0.008, decay: 5 })];
// a rising, wavering whine
const whine = voice({ seconds: 0.7, from: 600, to: 1100, noiseMix: 0.05, attack: 0.08, decay: 1.6, vibrato: 0.04 });
// a low, rough growl
const growl = voice({ seconds: 0.8, from: 110, to: 90, noiseMix: 0.55, attack: 0.1, decay: 1.5, vibrato: 0.08 });
for (const [name, samples] of Object.entries({ bark, whine, growl })) writeFileSync(`${out}/${name}.wav`, wav(samples));
console.log('wrote', Object.keys({ bark, whine, growl }).join(', '), 'to', out);

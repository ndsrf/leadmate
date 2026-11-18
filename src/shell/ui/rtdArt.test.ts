import { LOOKING_PARTS, RTD_ART, partsOf, type RtdPart } from './rtdArt';

const SIGNALS = Object.keys(RTD_ART) as (keyof typeof RTD_ART)[];
const PARTS: RtdPart[] = ['body', 'ears', 'eyes', 'mouth', 'tail', 'hackles', 'gaze'];

describe('rtdArt parts spec', () => {
  it('has all nine Body Signals', () => {
    expect(SIGNALS.sort()).toEqual(['ears_up_still', 'freeze_stare', 'hackles_up', 'lip_lick', 'loose_wag', 'play_bow', 'soft_loose', 'stiff_closed_mouth', 'whale_eye']);
  });

  it('every pair of signals differs in at least one part', () => {
    for (let i = 0; i < SIGNALS.length; i++) {
      for (let j = i + 1; j < SIGNALS.length; j++) {
        const a = RTD_ART[SIGNALS[i]!];
        const b = RTD_ART[SIGNALS[j]!];
        expect(PARTS.some((p) => a[p] !== b[p])).toBe(true);
      }
    }
  });

  it('draws hackles only for hackles_up', () => {
    for (const s of SIGNALS) expect(RTD_ART[s].hackles).toBe(s === 'hackles_up');
  });

  it('draws the whale eye, tongue flick, tight mouth, play bow and wag where named', () => {
    expect(RTD_ART.whale_eye.eyes).toBe('whale');
    expect(RTD_ART.lip_lick.mouth).toBe('tongue_flick');
    expect(RTD_ART.stiff_closed_mouth.mouth).toBe('tight');
    expect(RTD_ART.play_bow.body).toBe('bow');
    expect(RTD_ART.loose_wag.tail).toBe('wag');
  });

  it('keeps `looking` as the old Diagnostic look: ears up, wide eye, gaze lines, nothing else changed', () => {
    expect(LOOKING_PARTS).toMatchObject({ ears: 'up', eyes: 'wide', gaze: true, body: 'level', mouth: 'soft', tail: 'neutral', hackles: false });
    expect(partsOf('looking')).toBe(LOOKING_PARTS);
    expect(partsOf(undefined, true)).toBe(LOOKING_PARTS);
  });

  it('is neutral with no signal and no looking', () => {
    expect(partsOf(undefined, false)).toMatchObject({ body: 'level', ears: 'relaxed', eyes: 'soft', mouth: 'soft', tail: 'neutral', hackles: false, gaze: false });
  });
});

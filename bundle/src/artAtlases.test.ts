import hudAtlas from '../assets/hud/sprites.json';
import portraitAtlas from '../assets/portrait/sprites.json';

/** Every frame the in-stage-feedback and readable-dog specs name, by atlas frame name. */
const HUD_FRAMES = [
  // one icon per kind of action (stage-action-feedback "An icon per kind of action")
  'icon_paw', 'icon_eye', 'icon_heart', 'icon_nose', 'icon_hourglass', 'icon_sparkle', 'icon_star', 'icon_puff', 'icon_mark',
  // effect shapes of the four tiers
  'burst_spark', 'burst_star', 'banner_frame', 'glow_edge',
  // the Nose and Connection Stage Meters (stage-meters)
  'meter_nose', 'meter_connection',
];

/** Every Dog portrait layer of readable-dog design Decision 5. */
const PORTRAIT_FRAMES = [
  'portrait_body',
  'portrait_head_level', 'portrait_head_up', 'portrait_head_down', 'portrait_head_left', 'portrait_head_right', 'portrait_head_viewer',
  'portrait_ears_forward', 'portrait_ears_neutral', 'portrait_ears_back',
  'portrait_eyes_handler', 'portrait_eyes_left', 'portrait_eyes_right', 'portrait_eyes_down',
  'portrait_tail_high', 'portrait_tail_wag_a', 'portrait_tail_wag_b', 'portrait_tail_neutral', 'portrait_tail_tucked',
];

type Frame = {
  frame: { x: number; y: number; w: number; h: number };
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
  pivot: { x: number; y: number };
};
const frames = (a: unknown): Record<string, Frame> => (a as { frames: Record<string, Frame> }).frames;

describe('HUD atlas (in-stage-feedback 3.1)', () => {
  it('has every icon and effect shape the specs name', () => {
    const have = Object.keys(frames(hudAtlas));
    for (const name of HUD_FRAMES) expect(have).toContain(name);
  });
  it('keeps frames inside the atlas', () => {
    const { w, h } = (hudAtlas as unknown as { meta: { size: { w: number; h: number } } }).meta.size;
    for (const f of Object.values(frames(hudAtlas))) {
      expect(f.frame.x + f.frame.w).toBeLessThanOrEqual(w);
      expect(f.frame.y + f.frame.h).toBeLessThanOrEqual(h);
    }
  });
});

describe('Dog portrait atlas (readable-dog 4.1)', () => {
  it('has every layer of design Decision 5', () => {
    const have = Object.keys(frames(portraitAtlas));
    for (const name of PORTRAIT_FRAMES) expect(have).toContain(name);
  });
  it('registers every layer on one shared canvas and anchor so any combination composes', () => {
    const all = Object.values(frames(portraitAtlas));
    for (const f of all) {
      expect(f.sourceSize).toEqual(all[0].sourceSize);
      expect(f.pivot).toEqual(all[0].pivot);
      expect(f.spriteSourceSize.x + f.spriteSourceSize.w).toBeLessThanOrEqual(f.sourceSize.w);
      expect(f.spriteSourceSize.y + f.spriteSourceSize.h).toBeLessThanOrEqual(f.sourceSize.h);
    }
  });
});

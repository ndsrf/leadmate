import Phaser from 'phaser';
import type { Translate } from '../../src/i18n';
import { HUD_AROUSAL_NUM, HUD_BORDER, HUD_COLOR, HUD_COLOR_NUM, HUD_DEPTH, HUD_PRIMARY_BUTTON, HUD_TENSION_NUM } from './tokens.generated';
import { CUE_LABEL_WIDTH, CUE_RADIUS, fitFontSize, hudLayout, MARKER_RADIUS, SNIFF_RADIUS, visibleCues } from '../../src/hud/layout';
import { dogPose, gaitPeriod } from '../../src/hud/pose';
import { applyDetents, keyboardInput, screenToWorldDirection, type Keys } from '../../src/hud/input';
import { project } from '../../src/hud/iso';
import { smoothZoom, targetZoom } from '../../src/hud/camera';
import { createChangeDetector } from '../../src/hud/dirty';
import { HINT_SECONDS, HintTracker } from '../../src/hud/hints';
import type { CueType, ScenarioConfig } from '../../src/sim/config';
import { leashCurve, leashPoint, type TensionState } from '../../src/sim/leash';
import { buildPayload, type SimulationDebriefPayload } from '../../src/sim/payload';
import { activeDistractor, createState, isDogLooking, isGoSniffAvailable, routeOf, setPaused, tick, noInput, wrappedLeash, type ReactionTier, type SimEvent, type SimInput, type SimState } from '../../src/sim/sim';
import type { StageSignal } from '../../src/sim/messages';
import { add, length, scale, sub, type Vec2 } from '../../src/sim/vec';
import { TEXTURES, TILE_ORIGIN_Y } from './assets';
import { drawDecor, drawGroundPatch, drawProp, groundBounds, wallQuad, WALL_COLORS, WALL_HEIGHT } from './props';
import { atlas, atlasUrl, ATLAS, DOG_COATS, facingDegrees, pivotOf, propFrame, propScale, resOf } from './sprites';
import { layoutGround, propWalls, routePoints, shapeOf, type GroundPlan } from '../../src/sim/scenery';

export interface StageOptions {
  seed: number;
  scenario: ScenarioConfig;
  t: Translate;
  onEnd: (payload: SimulationDebriefPayload) => void;
  /** A Cue took effect; the shell plays the audio. */
  onCue?: (cue: CueType) => void;
  /** The Dog crossed a Reaction Tier threshold; the shell plays a vocalization. */
  onTier?: (tier: ReactionTier, time: number) => void;
  onSignal?: (signal: StageSignal, time: number) => void;
  /** The scene finished creating; the render loop may now sleep when the Stage is paused or ended. */
  onReady?: () => void;
}

const COLORS: Record<TensionState, number> = { slack: HUD_TENSION_NUM.slack, taut: HUD_TENSION_NUM.taut, rigid: HUD_TENSION_NUM.rigid };
const JOY_RADIUS = 70;
const TILE_M = 2; // one ground tile is 2 m wide
/** Half the width of the road drawn along the route, which Ground Cover leaves alone. */
const ROAD_HALF: Partial<Record<ScenarioConfig['theme'], number>> = { quiet_suburb: 1.2 };
/** Themes with a flat floor instead of grass tiles: indoors and the paved city. */
const FLOORS: Partial<Record<ScenarioConfig['theme'], [number, number]>> = { indoor_apartment: [0xd6c7a8, 0xc8b78f], urban_street: [0x9ca3af, 0x94a3b8] };

/** Deterministic pseudo-random for scenery only; never feeds the simulation. */
function hash(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

export class StageScene extends Phaser.Scene {
  private options!: StageOptions;
  private sim!: SimState;
  private gfx!: Phaser.GameObjects.Graphics;
  /** Shadows, boards and wheels, under every sprite. */
  private under!: Phaser.GameObjects.Graphics;
  private actors!: { handler: Phaser.GameObjects.Image; dog: Phaser.GameObjects.Image; other: Phaser.GameObjects.Image };
  /** The wall pieces, which fade out when they stand between the camera and an actor. */
  private wallPieces: { g: Phaser.GameObjects.Graphics; x0: number; x1: number; y0: number; y1: number; depth: number }[] = [];
  private lastSeen = new Map<string, { x: number; y: number; moved: number; deg: number }>();
  private hud!: Phaser.GameObjects.Graphics;
  private hudCam!: Phaser.Cameras.Scene2D.Camera;
  private markerLabel!: Phaser.GameObjects.Text;
  private cueLabel!: Phaser.GameObjects.Text;
  private leaveItLabel!: Phaser.GameObjects.Text;
  private sniffLabel!: Phaser.GameObjects.Text;
  private markerCount!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private hintUntil = 0;
  private hints = new HintTracker();
  private baseZoom = 1;
  private zoom = 0;
  private keys!: Record<keyof Keys | 'marker' | 'marker2' | 'cue' | 'leaveIt' | 'sniff', Phaser.Input.Keyboard.Key>;
  private joy: { id: number; base: Vec2; knob: Vec2 } | null = null;
  private joyHome: Vec2 = { x: 120, y: 300 };
  private markerHome: Vec2 = { x: 700, y: 300 };
  private cueHome: Vec2 = { x: 700, y: 180 };
  private leaveItHome: Vec2 = { x: 700, y: 180 };
  private sniffHome: Vec2 = { x: 600, y: 300 };
  private cuePointerDown = false;
  private cuePressed: CueType | null = null;
  private leaveItPointerDown = false;
  private sniffPointerDown = false;
  private sniffPressed = false;
  private markerPointerDown = false;
  private markerPressed = false;
  private accumulator = 0;
  private hudDirty = createChangeDetector();
  private cameraDirty = createChangeDetector();
  /** Fixed simulation steps run so far (dev readout). */
  simSteps = 0;
  private flash: { color: number; until: number } | null = null;
  private camPos: Vec2 = { x: 0, y: 0 };
  private ended = false;
  private signalsSent = new Set<StageSignal>();

  constructor() {
    super('stage');
  }

  init(options: StageOptions): void {
    this.options = options;
    this.ended = false;
    this.signalsSent = new Set();
    this.accumulator = 0;
    this.flash = null;
    this.hints = new HintTracker();
    this.hintUntil = 0;
    this.zoom = 0;
    this.joy = null;
    this.markerPointerDown = false;
    this.markerPressed = false;
    this.cuePointerDown = false;
    this.cuePressed = null;
    this.leaveItPointerDown = false;
    this.sniffPointerDown = false;
    this.sniffPressed = false;
  }

  preload(): void {
    for (const [key, url] of Object.entries(TEXTURES)) {
      if (!this.textures.exists(key)) this.load.image(key, url);
    }
    if (!this.textures.exists(ATLAS)) this.load.atlas(ATLAS, atlasUrl, atlas as object);
  }

  create(): void {
    this.sim = createState(this.options.seed, this.options.scenario);
    this.buildScenery();
    this.textures.get(ATLAS).setFilter(Phaser.Textures.FilterMode.LINEAR); // the game renders without antialiasing; sprites need smoothing
    this.under = this.add.graphics().setDepth(-5e4);
    const actor = () => this.add.image(0, 0, ATLAS, 'handler_idle0_0').setVisible(false);
    this.actors = { handler: actor(), dog: actor(), other: actor() };
    this.gfx = this.add.graphics();
    const world = [...this.children.list];
    this.hud = this.add.graphics();
    this.hudDirty.reset();
    this.cameraDirty.reset();
    this.markerLabel = this.add
      .text(0, 0, this.options.t('hud.marker'), { fontFamily: 'system-ui, sans-serif', color: HUD_COLOR.ink, fontSize: '16px', fontStyle: 'bold', backgroundColor: HUD_COLOR.surface, padding: { x: 8, y: 2 } })
      .setOrigin(0.5, 0);
    this.cueLabel = this.add
      .text(0, 0, this.options.t('hud.cue'), { fontFamily: 'system-ui, sans-serif', color: HUD_COLOR.ink, fontSize: '14px', fontStyle: 'bold', backgroundColor: HUD_COLOR.surface, padding: { x: 8, y: 2 } })
      .setOrigin(0.5, 1);
    this.leaveItLabel = this.add
      .text(0, 0, this.options.t('hud.leaveIt'), { fontFamily: 'system-ui, sans-serif', color: HUD_COLOR.ink, fontSize: '14px', fontStyle: 'bold', backgroundColor: HUD_COLOR.surface, padding: { x: 8, y: 2 } })
      .setOrigin(0.5, 1);
    this.sniffLabel = this.add
      .text(0, 0, this.options.t('hud.sniff'), { fontFamily: 'system-ui, sans-serif', color: HUD_COLOR.ink, fontSize: '14px', fontStyle: 'bold', backgroundColor: HUD_COLOR.surface, padding: { x: 8, y: 2 } })
      .setOrigin(0.5, 1)
      .setVisible(false);
    this.markerCount = this.add
      .text(0, 0, '', { fontFamily: 'system-ui, sans-serif', color: HUD_COLOR.ink, fontSize: '15px', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.hintText = this.add
      .text(0, 0, '', { fontFamily: 'system-ui, sans-serif', color: HUD_COLOR.ink, fontSize: '16px', backgroundColor: `${HUD_COLOR.surface}f2`, padding: { x: 10, y: 6 }, align: 'center' })
      .setOrigin(0.5, 0)
      .setVisible(false);
    // the HUD has its own unzoomed camera so it stays in screen pixels
    this.hudCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.hudCam.ignore(world);
    this.cameras.main.ignore([this.hud, this.markerLabel, this.cueLabel, this.leaveItLabel, this.sniffLabel, this.markerCount, this.hintText]);

    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      w: kb.addKey(K.W),
      a: kb.addKey(K.A),
      s: kb.addKey(K.S),
      d: kb.addKey(K.D),
      quick: kb.addKey(K.TWO),
      marker: kb.addKey(K.SPACE),
      marker2: kb.addKey(K.M),
      cue: kb.addKey(K.C),
      leaveIt: kb.addKey(K.L),
      sniff: kb.addKey(K.N),
    };
    kb.on('keydown-SPACE', () => (this.markerPressed = true));
    kb.on('keydown-M', () => (this.markerPressed = true));
    kb.on('keydown-C', () => (this.cuePressed = 'lets-go'));
    kb.on('keydown-L', () => (this.cuePressed = 'leave-it'));
    kb.on('keydown-N', () => (this.sniffPressed = true));

    this.input.addPointer(2);
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);

    this.scale.on('resize', this.layout, this);
    this.layout();

    const start = project(this.sim.handler);
    this.camPos = { ...start };
    this.cameras.main.centerOn(start.x, start.y);
    this.options.onReady?.();
  }

  /** Pauses the simulation clock; time stops until `resumeStage`. */
  pauseStage(): void {
    setPaused(this.sim, true);
  }

  resumeStage(): void {
    this.accumulator = 0;
    setPaused(this.sim, false);
  }

  get isPaused(): boolean {
    return this.sim?.paused ?? false;
  }

  get isEnded(): boolean {
    return this.ended;
  }

  private layout(): void {
    const { width, height } = this.scale;
    ({ joyHome: this.joyHome, markerHome: this.markerHome, cueHome: this.cueHome, leaveItHome: this.leaveItHome, sniffHome: this.sniffHome } = hudLayout(width, height, this.options.scenario.cues));
    const font = fitFontSize(this.options.t('hud.marker'), MARKER_RADIUS * 2.4, 16);
    this.markerLabel.setFontSize(font).setPosition(this.markerHome.x, this.markerHome.y + MARKER_RADIUS + 6);
    // Cue labels sit above their buttons, clear of the Marker below
    const dual = visibleCues(this.options.scenario.cues).length > 1;
    const letsGo = this.options.t(dual ? 'hud.letsGo' : 'hud.cue');
    this.cueLabel.setText(letsGo).setFontSize(fitFontSize(letsGo, CUE_LABEL_WIDTH, 14)).setOrigin(0.5, 1).setPosition(this.cueHome.x, this.cueHome.y - CUE_RADIUS - 4);
    const leaveIt = this.options.t('hud.leaveIt');
    this.leaveItLabel.setFontSize(fitFontSize(leaveIt, CUE_LABEL_WIDTH, 14)).setPosition(this.leaveItHome.x, this.leaveItHome.y - CUE_RADIUS - 4);
    const sniff = this.options.t('hud.sniff');
    this.sniffLabel.setFontSize(fitFontSize(sniff, CUE_LABEL_WIDTH, 14)).setPosition(this.sniffHome.x, this.sniffHome.y - SNIFF_RADIUS - 4);
    this.markerCount.setPosition(this.markerHome.x + MARKER_RADIUS * 0.72, this.markerHome.y - MARKER_RADIUS * 0.72);
    this.baseZoom = Phaser.Math.Clamp(Math.min(width / 640, height / 380), 0.8, 2);
    this.hintText.setPosition(width / 2, 12).setWordWrapWidth(width * 0.8);
    this.hudCam?.setSize(width, height);
  }

  private buildScenery(): void {
    const { config } = this.sim;
    const route = [config.handlerStart, ...routeOf(config)];
    const corners = [...route, ...config.walls.flatMap((w) => [w.from, w.to]), ...config.scenery.map((p) => p.pos)];
    const { i0, i1, j0, j1 } = groundBounds(corners, TILE_M, 14);
    const road = config.theme === 'quiet_suburb';
    // road tiles under every leg of the route that runs along an axis
    const roads = new Map<string, 'roadEW' | 'roadNS'>();
    if (road) {
      for (let k = 1; k < route.length; k++) {
        const a = route[k - 1];
        const b = route[k];
        if (Math.abs(a.y - b.y) < 0.5) {
          for (let i = Math.floor(Math.min(a.x, b.x) / TILE_M); i <= Math.ceil(Math.max(a.x, b.x) / TILE_M); i++) roads.set(`${i},${Math.round(a.y / TILE_M)}`, 'roadEW');
        } else if (Math.abs(a.x - b.x) < 0.5) {
          for (let j = Math.floor(Math.min(a.y, b.y) / TILE_M); j <= Math.ceil(Math.max(a.y, b.y) / TILE_M); j++) roads.set(`${Math.round(a.x / TILE_M)},${j}`, 'roadNS');
        }
      }
    }
    // the ground is baked once into render textures: base tiles, Ground Cover patches, flat decoration, water
    const tiles: { x: number; y: number; key?: string; corners?: Vec2[]; color?: number }[] = [];
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const flat = FLOORS[config.theme];
        if (flat) {
          const c = [project({ x: i * TILE_M, y: j * TILE_M }), project({ x: (i + 1) * TILE_M, y: j * TILE_M }), project({ x: (i + 1) * TILE_M, y: (j + 1) * TILE_M }), project({ x: i * TILE_M, y: (j + 1) * TILE_M })];
          tiles.push({ x: c[0].x, y: c[0].y, corners: c, color: (i + j) % 2 === 0 ? flat[0] : flat[1] });
          continue;
        }
        const pos = project({ x: i * TILE_M, y: j * TILE_M });
        tiles.push({ x: pos.x, y: pos.y, key: roads.get(`${i},${j}`) ?? 'grass' });
      }
    }
    this.bakeGround(tiles, layoutGround(config.theme, routePoints(config), this.sim.seed), config.scenery.filter((p) => p.type === 'pond'));
    this.wallPieces = [];
    // solid walls, in short pieces so the Dog and Handler can pass in front of or behind them
    const height = WALL_HEIGHT[config.theme];
    const colors = WALL_COLORS[config.theme];
    for (const wall of config.walls) {
      const len = length(sub(wall.to, wall.from));
      const pieces = Math.max(1, Math.ceil(len / 2));
      for (let k = 0; k < pieces; k++) {
        const a = add(wall.from, scale(sub(wall.to, wall.from), k / pieces));
        const b = add(wall.from, scale(sub(wall.to, wall.from), (k + 1) / pieces));
        const quad = wallQuad(a, b, height);
        const g = this.add.graphics();
        g.fillStyle(colors.side).fillPoints(quad, true);
        g.lineStyle(1, 0x000000, 0.25).strokePoints(quad, true);
        g.lineStyle(3, colors.top).lineBetween(quad[3].x, quad[3].y, quad[2].x, quad[2].y);
        const depth = Math.max(quad[0].y, quad[1].y);
        g.setDepth(depth);
        const xs = quad.map((q) => q.x);
        const ys = quad.map((q) => q.y);
        this.wallPieces.push({ g, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), depth });
      }
    }
    // the scenery set: Kenney sprites where there is one, shapes for the rest
    const shadows = this.add.graphics().setDepth(-5e4 + 1);
    config.scenery.forEach((item, n) => {
      if (item.type === 'pond') return void this.dressPond(item, shadows); // the water is baked into the ground
      const pos = project(item.pos);
      const frame = propFrame(item, n, hash);
      if (frame) {
        const shape = shapeOf(item.type);
        const wide = shape.length ? (16 + shape.length * 22) * Math.min(1, propScale(item.type) + 0.15) : (shape.radius ?? 0.3) * 56 + 10;
        shadows.fillStyle(0x000000, 0.18).fillEllipse(pos.x, pos.y, wide, wide / 2);
        const pivot = pivotOf(frame);
        this.add.image(pos.x, pos.y, ATLAS, frame).setOrigin(pivot.x, pivot.y).setScale(propScale(item.type)).setDepth(pos.y);
      } else {
        const g = this.add.graphics();
        drawProp(g, item, pos.x, pos.y);
        g.setDepth(pos.y);
      }
    });
    // debug: the collision footprints of the Obstacles, on with `?footprints` in the page address
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('footprints')) {
      const dbg = this.add.graphics().setDepth(1e6);
      dbg.lineStyle(2, 0xff00ff, 0.9);
      for (const w of propWalls(config.scenery)) {
        const a = project(w.from);
        const b = project(w.to);
        dbg.lineBetween(a.x, a.y, b.x, b.y);
      }
    }
  }

  /** Draws the ground into a few render textures (only where there is ground) instead of one image per tile. */
  private bakeGround(tiles: { x: number; y: number; key?: string; corners?: Vec2[]; color?: number }[], plan: GroundPlan, ponds: ScenarioConfig['scenery']): void {
    const CHUNK = 1024;
    const chunks = new Map<string, { cx: number; cy: number; rt: Phaser.GameObjects.RenderTexture }>();
    const chunkFor = (x: number, y: number) => {
      const cx = Math.floor(x / CHUNK);
      const cy = Math.floor(y / CHUNK);
      const key = `${cx},${cy}`;
      let chunk = chunks.get(key);
      if (!chunk) {
        const rt = this.add.renderTexture(cx * CHUNK, cy * CHUNK, CHUNK + 2, CHUNK + 2).setOrigin(0, 0).setDepth(-1e5);
        rt.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
        chunk = { cx, cy, rt };
        chunks.set(key, chunk);
      }
      return chunk;
    };
    // make every chunk that has a tile in it, plus the neighbours a tile spills into
    for (const t of tiles) for (const dx of [-60, 60]) for (const dy of [-40, 40]) chunkFor(t.x + dx, t.y + dy);
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const stamp = (obj: Phaser.GameObjects.GameObject) => {
      for (const { cx, cy, rt } of chunks.values()) rt.draw(obj, -cx * CHUNK, -cy * CHUNK);
    };
    // tile images back to front, so a tile's side is covered by the one in front of it
    const ordered = [...tiles].sort((a, b) => a.y - b.y || a.x - b.x);
    for (const t of ordered) if (t.corners) g.fillStyle(t.color ?? 0xffffff).fillPoints(t.corners, true);
    stamp(g);
    g.clear();
    for (const t of ordered) {
      if (!t.key) continue;
      const frame = this.textures.getFrame(t.key);
      for (const { cx, cy, rt } of chunks.values()) {
        const x = t.x - frame.width / 2 - cx * CHUNK;
        const y = t.y - frame.height * TILE_ORIGIN_Y - cy * CHUNK;
        if (x > -frame.width && y > -frame.height && x < CHUNK + 2 && y < CHUNK + 2) rt.drawFrame(t.key, undefined, x, y);
      }
    }
    // Ground Cover patches lie on the base floor, beside the road where there is one
    for (const patch of plan.patches) drawGroundPatch(g, patch, ROAD_HALF[this.sim.config.theme] ?? 0);
    for (const decor of plan.decor) drawDecor(g, decor);
    for (const pond of ponds) {
      const c = project(pond.pos);
      g.fillStyle(0x5b4b32, 0.3).fillEllipse(c.x, c.y + 2, 132, 68);
      g.fillStyle(0x2f7fb8).fillEllipse(c.x, c.y, 116, 58);
      g.fillStyle(0x3b9fd8).fillEllipse(c.x, c.y, 104, 50);
      g.fillStyle(0x58b6e8).fillEllipse(c.x + 4, c.y + 2, 78, 34);
      g.fillStyle(0x9bd8f5, 0.55).fillEllipse(c.x - 16, c.y - 8, 30, 9).fillEllipse(c.x + 18, c.y + 8, 18, 6);
      g.lineStyle(2, 0xffffff, 0.28).strokeEllipse(c.x, c.y, 104, 50);
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2 + hash(pond.pos.x + k) * 0.3;
        const sx = c.x + Math.cos(a) * 62;
        const sy = c.y + Math.sin(a) * 31;
        g.fillStyle(0x7d8590).fillEllipse(sx, sy + 1, 13, 7).fillStyle(0xb4bbc6).fillEllipse(sx, sy - 1, 11, 5);
      }
    }
    stamp(g);
    g.destroy();
  }

  // -- input -----------------------------------------------------------------------------------

  private onPointerDown(p: Phaser.Input.Pointer): void {
    const { width } = this.scale;
    const cues = visibleCues(this.options.scenario.cues);
    if (cues.includes('lets-go') && Math.hypot(p.x - this.cueHome.x, p.y - this.cueHome.y) <= CUE_RADIUS * 1.5) {
      this.cuePressed = 'lets-go';
      this.cuePointerDown = true;
      return;
    }
    if (cues.includes('leave-it') && Math.hypot(p.x - this.leaveItHome.x, p.y - this.leaveItHome.y) <= CUE_RADIUS * 1.5) {
      this.cuePressed = 'leave-it';
      this.leaveItPointerDown = true;
      return;
    }
    if (this.sniffOnOffer && Math.hypot(p.x - this.sniffHome.x, p.y - this.sniffHome.y) <= SNIFF_RADIUS * 1.5) {
      this.sniffPressed = true;
      this.sniffPointerDown = true;
      return;
    }
    const dx = p.x - this.markerHome.x;
    const dy = p.y - this.markerHome.y;
    if (Math.hypot(dx, dy) <= MARKER_RADIUS * 1.6 || p.x > width * 0.5) {
      this.markerPressed = true;
      this.markerPointerDown = true;
      return;
    }
    if (p.x < width * 0.5 && !this.joy) {
      const base = { x: Phaser.Math.Clamp(p.x, JOY_RADIUS, width * 0.5), y: Phaser.Math.Clamp(p.y, JOY_RADIUS, this.scale.height - JOY_RADIUS) };
      this.joy = { id: p.id, base, knob: { x: p.x, y: p.y } };
    }
  }

  private onPointerMove(p: Phaser.Input.Pointer): void {
    if (this.joy && this.joy.id === p.id) this.joy.knob = { x: p.x, y: p.y };
  }

  private onPointerUp(p: Phaser.Input.Pointer): void {
    if (this.joy && this.joy.id === p.id) this.joy = null;
    if (p.x > this.scale.width * 0.5) {
      this.markerPointerDown = false;
      this.cuePointerDown = false;
      this.leaveItPointerDown = false;
      this.sniffPointerDown = false;
    }
  }

  /** The Go Sniff button is on the HUD only while it is on offer. */
  private get sniffOnOffer(): boolean {
    return isGoSniffAvailable(this.sim);
  }

  private readInput(): SimInput {
    const cfg = this.sim.config;
    let move: Omit<SimInput, 'marker'> = { direction: { x: 0, y: 0 }, strength: 0 };
    if (this.joy) {
      const delta = sub(this.joy.knob, this.joy.base);
      const raw = Math.min(1, length(delta) / JOY_RADIUS);
      const strength = applyDetents(raw, cfg.walkStrength);
      if (strength > 0) move = { direction: screenToWorldDirection(delta), strength };
    } else {
      const k = this.keys;
      move = keyboardInput({ w: k.w.isDown, a: k.a.isDown, s: k.s.isDown, d: k.d.isDown, quick: k.quick.isDown }, cfg.walkStrength);
    }
    // the press stays queued until a tick consumes it (a frame can be shorter than one tick)
    const marker = this.markerPressed && this.marksLeft > 0;
    return { ...move, marker, cue: this.cuePressed !== null, cueType: this.cuePressed ?? undefined, sniff: this.sniffPressed };
  }

  private get marksLeft(): number {
    return this.sim.config.markBudget - this.sim.telemetry.marksUsed;
  }

  // -- loop ------------------------------------------------------------------------------------

  update(_time: number, delta: number): void {
    if (!this.sim) return;
    const step = this.sim.config.fixedStep;
    let input = this.readInput();
    if (this.sim.paused || this.ended) {
      input = noInput;
      this.markerPressed = false;
      this.cuePressed = null;
      this.sniffPressed = false;
    } else {
      if (input.strength > 0 || input.marker || input.cue || input.sniff) this.signal('first-input', this.sim.time);
      this.accumulator += Math.min(delta, 100) / 1000;
      while (this.accumulator >= step && !this.sim.ended) {
        this.simSteps++;
        this.handleEvents(tick(this.sim, input, step));
        input = { ...input, marker: false, cue: false, sniff: false }; // a press counts for one tick only
        this.markerPressed = false;
        this.cuePressed = null;
        this.sniffPressed = false;
        this.accumulator -= step;
      }
    }
    this.showHints();
    this.followCamera(delta);
    this.draw(input);
    this.drawHud();
  }

  /** Each signal goes to the shell once per Stage. */
  private signal(signal: StageSignal, time: number): void {
    if (this.signalsSent.has(signal)) return;
    this.signalsSent.add(signal);
    this.options.onSignal?.(signal, time);
  }

  private handleEvents(events: SimEvent[]): void {
    const now = this.time.now;
    for (const e of events) {
      if (e.type === 'marker-hit') this.flash = { color: 0x22c55e, until: now + 500 };
      else if (e.type === 'marker-miss') this.flash = { color: 0xef4444, until: now + 500 };
      else if (e.type === 'marker-reactive') this.flash = { color: 0xfb923c, until: now + 500 };
      else if (e.type === 'check-in-hit') this.flash = { color: 0x38bdf8, until: now + 500 };
      else if (e.type === 'marker-wasted') this.flash = { color: 0x94a3b8, until: now + 500 };
      else if (e.type === 'cue') {
        this.flash = { color: 0xa78bfa, until: now + 500 };
        this.options.onCue?.(e.cueType);
      } else if (e.type === 'cue-mismatch') this.flash = { color: 0x94a3b8, until: now + 500 };
      else if (e.type === 'go-sniff-start') this.flash = { color: 0x38bdf8, until: now + 500 };
      else if (e.type === 'reaction-tier-change') this.options.onTier?.(e.tier, e.time);
      else if (e.type === 'tension-change' && e.tension === 'taut') this.signal('first-taut', e.time);
      else if (e.type === 'tension-change' && e.tension === 'rigid') this.signal('leash-limit', e.time);
      else if (e.type === 'fixation-start') this.signal('first-fixation', e.time);
      else if (e.type === 'stage-end' && !this.ended) {
        this.ended = true;
        this.options.onEnd(buildPayload(this.sim));
      }
    }
  }

  private followCamera(delta: number): void {
    const mid = scale(add(project(this.sim.handler), project(this.sim.dog)), 0.5);
    const k = 1 - Math.pow(0.001, delta / 1000);
    this.camPos = add(this.camPos, scale(sub(mid, this.camPos), k));
    const { width, height } = this.scale;
    const target = targetZoom(
      length(sub(this.sim.handler, this.sim.dog)),
      this.sim.config.leashLength,
      project(this.sim.handler),
      project(this.sim.dog),
      { width, height },
      this.baseZoom,
      this.sim.config.camera,
    );
    this.zoom = this.zoom === 0 ? target : smoothZoom(this.zoom, target, delta, this.sim.config.camera);
    if (this.cameraDirty.changed(`${this.zoom},${this.camPos.x},${this.camPos.y},${width},${height}`)) {
      this.cameras.main.setZoom(this.zoom);
      this.cameras.main.centerOn(this.camPos.x, this.camPos.y);
    }
  }

  private showHints(): void {
    if (this.sim.paused || this.ended) return;
    const key = this.hints.observe(this.sim.tension);
    if (key) {
      this.hintText.setText(this.options.t(key)).setVisible(true);
      this.hintUntil = this.time.now + HINT_SECONDS * 1000;
    } else if (this.hintText.visible && this.time.now >= this.hintUntil) {
      this.hintText.setVisible(false);
    }
  }

  // -- drawing ---------------------------------------------------------------------------------

  private draw(input: SimInput): void {
    const g = this.gfx;
    const s = this.sim;
    const pose = dogPose(s);
    g.clear();

    // route: small markers for the corridor points, the flag at the end
    const route = routeOf(s.config);
    route.slice(0, -1).forEach((point, i) => {
      const q = project(point);
      g.fillStyle(i < s.routeIndex ? 0x64748b : 0xfbbf24, 0.8).fillEllipse(q.x, q.y, 22, 11);
    });
    const flag = project(s.config.waypoint);
    g.fillStyle(0x000000, 0.25).fillEllipse(flag.x, flag.y, 30, 15);
    g.lineStyle(3, 0xf1f5f9).lineBetween(flag.x, flag.y, flag.x, flag.y - 60);
    g.fillStyle(0xf59e0b).fillTriangle(flag.x, flag.y - 60, flag.x + 30, flag.y - 50, flag.x, flag.y - 40);

    // Poste anchor
    const handlerPos = project(s.handler);
    if (input.strength === 0 && s.ratio >= 0.99) {
      g.lineStyle(3, 0xe2e8f0, 0.9).strokeEllipse(handlerPos.x, handlerPos.y, 46, 23);
    }

    this.under.clear();

    // dog
    const dogPos = project(s.dog);
    const looking = isDogLooking(s);
    const dogFace =
      s.dogMode === 'fixated'
        ? sub(s.distractor.pos, s.dog)
        : s.dogMode === 'holding' || looking
          ? sub(s.handler, s.dog)
          : s.dogFacing;

    // Sintonía: a soft green glow under the Handler and the Dog
    if (pose.flowGlow) {
      const pulse = 0.55 + 0.25 * Math.sin(this.time.now / 220);
      for (const pos of [handlerPos, dogPos]) g.fillStyle(0x4ade80, 0.22 * pulse).fillEllipse(pos.x, pos.y, 78, 39).lineStyle(2, 0x86efac, 0.6 * pulse).strokeEllipse(pos.x, pos.y, 78, 39);
    }
    this.drawActors(s, pose, dogFace);
    if (s.dogMode === 'fixated') {
      g.fillStyle(0xfacc15).fillRoundedRect(dogPos.x - 3, dogPos.y - 46, 6, 14, 2).fillCircle(dogPos.x, dogPos.y - 26, 3);
    } else if (pose.tier === 'alert' && !pose.headDown) {
      // Alert: a small question mark of attention
      g.lineStyle(2, 0xfde047).strokeCircle(dogPos.x, dogPos.y - 42, 5);
    }
    if (pose.barking) {
      // sound marks beside the Dog's head
      const toward = project({ x: dogFace.x, y: dogFace.y });
      const len = Math.hypot(toward.x, toward.y) || 1;
      const nx = toward.x / len;
      const ny = toward.y / len;
      const wobble = Math.sin(this.time.now / 70) * 2;
      for (let k = 0; k < 3; k++) {
        const r = 16 + k * 7;
        g.lineStyle(2, 0xfb923c, 0.9 - k * 0.25).beginPath().arc(dogPos.x + nx * 10, dogPos.y - 24 + ny * 5 + wobble, r, Math.atan2(ny, nx) - 0.5, Math.atan2(ny, nx) + 0.5).strokePath();
      }
    }
    if (pose.headDown) {
      // sniffing: little scent dots over the ground
      for (let k = 0; k < 3; k++) g.fillStyle(0xe2e8f0, 0.7 - k * 0.2).fillCircle(dogPos.x + Math.sin(this.time.now / 300 + k) * 14, dogPos.y - 12 - k * 7, 2);
    }

    if (looking && s.dogMode !== 'fixated') {
      // eye contact: a gaze line to the Handler and a blue eye over the Dog's head
      g.lineStyle(2, 0x38bdf8, 0.8).lineBetween(dogPos.x, dogPos.y - 22, handlerPos.x, handlerPos.y - 38);
      g.fillStyle(0xffffff).fillEllipse(dogPos.x, dogPos.y - 38, 16, 10);
      g.fillStyle(0x0ea5e9).fillCircle(dogPos.x, dogPos.y - 38, 4);
    }

    // leash: around wall corners when a wall is in the way
    const pulse = s.tension === 'slack' ? 1 : 0.65 + 0.35 * Math.sin(this.time.now / (s.tension === 'rigid' ? 60 : 160));
    g.lineStyle(s.tension === 'rigid' ? 5 : 3, COLORS[s.tension], pulse);
    const wrapped = wrappedLeash(s);
    g.beginPath();
    if (wrapped && wrapped.points.length > 2) {
      wrapped.points.forEach((point, i) => {
        const z = i === 0 ? 1.0 : i === wrapped.points.length - 1 ? 0.4 : 0.7;
        const sp = project(point, z);
        if (i === 0) g.moveTo(sp.x, sp.y);
        else g.lineTo(sp.x, sp.y);
      });
    } else {
      const curve = leashCurve(s.handler, s.dog, s.config.leashLength);
      for (let i = 0; i <= 20; i++) {
        const q = leashPoint(curve, i / 20);
        const sp = project({ x: q.x, y: q.y }, q.z);
        if (i === 0) g.moveTo(sp.x, sp.y);
        else g.lineTo(sp.x, sp.y);
      }
    }
    g.strokePath();
    g.setDepth(Math.max(handlerPos.y, dogPos.y) + 1);

    // feedback ring around the dog
    if (this.flash && this.time.now < this.flash.until) {
      g.lineStyle(4, this.flash.color, 0.9).strokeCircle(dogPos.x, dogPos.y - 10, 26);
    }
  }

  /** How the actor `id` is moving: its facing from where it went (or `fallback`), and whether it moved lately. */
  private track(id: string, pos: Vec2, fallback: Vec2): { deg: number; moving: boolean } {
    const now = this.time.now;
    const prev = this.lastSeen.get(id);
    const step = prev ? Math.hypot(pos.x - prev.x, pos.y - prev.y) : 0;
    const seen = { x: pos.x, y: pos.y, moved: prev?.moved ?? -1e9, deg: prev?.deg ?? facingDegrees(fallback) };
    if (step > 0.004) {
      seen.moved = now;
      seen.deg = facingDegrees({ x: pos.x - prev!.x, y: pos.y - prev!.y });
    }
    this.lastSeen.set(id, seen);
    return { deg: seen.deg, moving: now - seen.moved < 160 };
  }

  /** A looping clip frame: `${set}_${clip}${n}_${deg}`. */
  private clip(set: string, clip: string, count: number, deg: number, fps: number): string {
    return `${set}_${clip}${Math.floor((this.time.now / 1000) * fps) % count}_${deg}`;
  }

  /** The Handler, the Dog and the Distractor as sprites, with shadows and boards under them. */
  private drawActors(s: SimState, pose: ReturnType<typeof dogPose>, dogFace: Vec2): void {
    const u = this.under;
    const seen: Vec2[] = [project(s.handler), project(s.dog)];
    if (s.distractor.active && !s.distractor.finished) seen.push(project(s.distractor.pos));
    this.fadeWalls(seen);
    const place = (img: Phaser.GameObjects.Image, frame: string, at: Vec2, size = 1) => {
      const pivot = pivotOf(frame);
      img.setFrame(frame).setOrigin(pivot.x, pivot.y).setPosition(at.x, at.y).setScale(size / resOf(frame)).setDepth(at.y).setVisible(true).clearTint();
      u.fillStyle(0x000000, 0.22).fillEllipse(at.x, at.y, 30 * size, 15 * size);
    };

    const h = project(s.handler);
    const hm = this.track('handler', s.handler, s.handlerFacing);
    place(this.actors.handler, hm.moving ? this.clip('handler', 'walk', 4, hm.deg, 9) : `handler_idle0_${facingDegrees(s.handlerFacing)}`, h);

    const d = project(s.dog);
    const dm = this.track('dog', s.dog, dogFace);
    // facing: where it is looking while it holds or fixates, otherwise where it goes
    const dogDeg = dm.moving && s.dogMode !== 'fixated' && !pose.headDown ? dm.deg : facingDegrees(dogFace);
    const dogFrame = pose.headDown ? this.clip('dog', 'eat', 2, dogDeg, 3) : dm.moving ? this.clip('dog', pose.lunging ? 'run' : 'walk', pose.lunging ? 2 : 4, dogDeg, pose.lunging ? 10 : 8) : `dog_idle0_${dogDeg}`;
    const look = s.config.look;
    place(this.actors.dog, dogFrame, d, (look?.dogScale ?? 1) * (s.config.learning.posture === 0 ? 0.94 : 1));
    this.actors.dog.setTint(DOG_COATS[look?.dogCoat ?? 'golden'] ?? DOG_COATS.golden);

    const o = this.actors.other;
    if (!s.distractor.active || s.distractor.finished) return void o.setVisible(false);
    const p = project(s.distractor.pos);
    const om = this.track('other', s.distractor.pos, { x: 1, y: 0 });
    const kind = activeDistractor(s).kind;
    switch (kind) {
      case 'food':
        o.setVisible(false);
        u.fillStyle(0xb45309).fillEllipse(p.x, p.y - 3, 20, 10).fillStyle(0xfbbf24).fillCircle(p.x - 3, p.y - 6, 4).fillCircle(p.x + 4, p.y - 5, 3);
        break;
      case 'dog':
        place(o, om.moving ? this.clip('dog', 'walk', 4, om.deg, 8) : `dog_idle0_${om.deg}`, p, 0.9);
        o.setTint(0xd8d2c8);
        break;
      case 'child':
        place(o, this.clip('child', 'walk', 2, om.deg, 6), p);
        break;
      case 'other': // a jogger
        place(o, this.clip('jogger', 'sprint', 4, om.deg, 10), p);
        break;
      case 'bicycle': {
        const f = project({ x: Math.cos((om.deg * Math.PI) / 180), y: Math.sin((om.deg * Math.PI) / 180) });
        const n = Math.hypot(f.x, f.y) || 1;
        u.lineStyle(2, 0x111827);
        for (const k of [-1, 1]) u.strokeCircle(p.x + (f.x / n) * 10 * k, p.y - 7 + (f.y / n) * 5 * k, 7);
        place(o, `rider_idle0_${om.deg}`, { x: p.x, y: p.y - 6 });
        break;
      }
      default: {
        // a skateboard or scooter: the deck lies under the rider's feet
        const f = project({ x: Math.cos((om.deg * Math.PI) / 180), y: Math.sin((om.deg * Math.PI) / 180) });
        const n = Math.hypot(f.x, f.y) || 1;
        u.lineStyle(5, 0xa855f7).lineBetween(p.x - (f.x / n) * 14, p.y - (f.y / n) * 7, p.x + (f.x / n) * 14, p.y + (f.y / n) * 7);
        place(o, `rider_idle0_${om.deg}`, { x: p.x, y: p.y - 3 });
      }
    }
  }

  /** A pond's rim of rocks and its lily pads, as sprites over the baked water. */
  private dressPond(pond: ScenarioConfig['scenery'][number], shadows: Phaser.GameObjects.Graphics): void {
    const rocks = ['plant_bush', 'plant_bushLarge', 'flower_redA', 'flower_yellowA', 'flower_purpleA'];
    const base = pond.pos.x * 7.3 + pond.pos.y * 3.1;
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + hash(base + k) * 0.5;
      const r = 2.3 + hash(base + k * 3) * 0.5;
      const at = project({ x: pond.pos.x + Math.cos(a) * r, y: pond.pos.y + Math.sin(a) * r });
      const frame = rocks[Math.floor(hash(base + k * 5) * rocks.length)];
      const pivot = pivotOf(frame);
      shadows.fillStyle(0x000000, 0.18).fillEllipse(at.x, at.y, 22, 11);
      this.add.image(at.x, at.y, ATLAS, frame).setOrigin(pivot.x, pivot.y).setDepth(at.y);
    }
    for (let k = 0; k < 4; k++) {
      const a = hash(base + k * 11) * Math.PI * 2;
      const r = 0.3 + hash(base + k * 13) * 0.9;
      const at = project({ x: pond.pos.x + Math.cos(a) * r, y: pond.pos.y + Math.sin(a) * r });
      const frame = k % 2 === 0 ? 'lily_large' : 'lily_small';
      const pivot = pivotOf(frame);
      this.add.image(at.x, at.y, ATLAS, frame).setOrigin(pivot.x, pivot.y).setDepth(-5e4 + 2);
    }
  }

  /** Fades the wall pieces that hide the Handler, the Dog or the Distractor behind them. */
  private fadeWalls(points: Vec2[]): void {
    for (const w of this.wallPieces) {
      const hides = points.some((p) => w.depth > p.y && p.x > w.x0 - 14 && p.x < w.x1 + 14 && p.y - 50 < w.y1 && p.y > w.y0);
      w.g.setAlpha(w.g.alpha + ((hides ? 0.22 : 1) - w.g.alpha) * 0.25);
    }
  }

  /** A HUD disc in the shell's depth style: ink outline, solid ink shadow `shadow` points down-right, face shifted `press` points toward it. */
  private hudDisc(h: Phaser.GameObjects.Graphics, x: number, y: number, r: number, fill: number, shadow: number, press: number, edge: number = HUD_COLOR_NUM.ink): void {
    if (shadow > 0) h.fillStyle(HUD_COLOR_NUM.ink).fillCircle(x + shadow, y + shadow, r);
    h.fillStyle(fill).fillCircle(x + press, y + press, r);
    h.lineStyle(HUD_BORDER, edge).strokeCircle(x + press, y + press, r);
  }

  private drawHud(): void {
    const h = this.hud;
    const cues = visibleCues(this.options.scenario.cues);
    const offer = this.sniffOnOffer;
    const left = this.marksLeft;
    const { width, height } = this.scale;
    const barW = Math.min(220, width * 0.4);
    const level = this.sim.arousal / 100;
    const sniffLeft = offer ? Math.max(0, this.sim.sniffOfferUntil - this.sim.time) / this.sim.config.goSniff.offerSeconds : 0;
    // everything the HUD drawing below reads; unchanged since the last frame means nothing to redraw
    const key = [
      this.joy ? `${this.joy.base.x},${this.joy.base.y},${this.joy.knob.x},${this.joy.knob.y}` : '-',
      width,
      height,
      left,
      cues.join('+'),
      offer ? sniffLeft : '-',
      Math.round(barW * level),
      level < 0.5 ? 0 : level < 0.75 ? 1 : 2,
      this.markerPointerDown || this.keys.marker.isDown || this.keys.marker2.isDown,
      this.cuePointerDown || this.keys.cue.isDown,
      this.leaveItPointerDown || this.keys.leaveIt.isDown,
      this.sniffPointerDown || this.keys.sniff.isDown,
    ].join('|');
    if (!this.hudDirty.changed(key)) return;
    h.clear();
    const base = this.joy?.base ?? this.joyHome;
    let knob = this.joy?.knob ?? base;
    const delta = sub(knob, base);
    if (length(delta) > JOY_RADIUS) knob = add(base, scale(delta, JOY_RADIUS / length(delta)));
    // joystick: a paper ring with an ink outline, the knob a raised ink-outlined disc
    h.fillStyle(HUD_COLOR_NUM.surface, 0.35).fillCircle(base.x, base.y, JOY_RADIUS);
    h.lineStyle(HUD_BORDER, HUD_COLOR_NUM.ink, 0.6).strokeCircle(base.x, base.y, JOY_RADIUS);
    const walkR = JOY_RADIUS * this.sim.config.walkStrength;
    h.lineStyle(1, HUD_COLOR_NUM.ink, 0.35).strokeCircle(base.x, base.y, walkR);
    this.hudDisc(h, knob.x, knob.y, 26, HUD_COLOR_NUM.surface, 0, this.joy ? HUD_DEPTH - 1 : HUD_DEPTH);

    const m = this.markerHome;
    const enabled = left > 0;
    const down = enabled && (this.markerPointerDown || this.keys.marker.isDown || this.keys.marker2.isDown);
    // raised like the shell's buttons: an ink-outlined disc on a solid offset shadow that it sinks into while pressed
    const my = down ? m.y + 3 : m.y;
    this.hudDisc(h, m.x, m.y, MARKER_RADIUS, enabled ? HUD_COLOR_NUM.accent : HUD_COLOR_NUM.disabled, enabled ? HUD_DEPTH : 0, down ? 3 : 0, enabled ? HUD_COLOR_NUM.ink : HUD_COLOR_NUM.disabledText);
    // remaining Marks, as a badge on the button
    const badge = { x: m.x + MARKER_RADIUS * 0.72, y: m.y - MARKER_RADIUS * 0.72 };
    h.fillStyle(enabled ? HUD_COLOR_NUM.surface : HUD_COLOR_NUM.disabled).fillCircle(badge.x, badge.y, 14).lineStyle(HUD_BORDER - 0.5, enabled ? HUD_COLOR_NUM.ink : HUD_COLOR_NUM.disabledText).strokeCircle(badge.x, badge.y, 14);
    this.markerCount.setText(String(Math.max(0, left)));
    this.markerLabel.setAlpha(enabled ? 1 : 0.5);
    // Cue buttons above the Marker: "Let's Go" is a speech bubble, "Leave It" a raised hand
    this.cueLabel.setVisible(cues.includes('lets-go'));
    this.leaveItLabel.setVisible(cues.includes('leave-it'));
    if (cues.includes('lets-go')) {
      const c = this.cueHome;
      const press = this.cuePointerDown || this.keys.cue.isDown ? 3 : 0;
      this.hudDisc(h, c.x, c.y, CUE_RADIUS, HUD_COLOR_NUM.brand, HUD_DEPTH, press);
      h.fillStyle(HUD_COLOR_NUM.ink).fillRoundedRect(c.x - 14 + press, c.y - 12 + press, 28, 18, 5).fillTriangle(c.x - 6 + press, c.y + 5 + press, c.x + 2 + press, c.y + 5 + press, c.x - 8 + press, c.y + 14 + press);
    }
    if (cues.includes('leave-it')) {
      const c = this.leaveItHome;
      const press = this.leaveItPointerDown || this.keys.leaveIt.isDown ? 3 : 0;
      this.hudDisc(h, c.x, c.y, CUE_RADIUS, HUD_COLOR_NUM.info, HUD_DEPTH, press);
      // an open hand: palm and four fingers
      h.fillStyle(HUD_COLOR_NUM.onInfo).fillRoundedRect(c.x - 11 + press, c.y - 4 + press, 22, 16, 5);
      for (let k = 0; k < 4; k++) h.fillRoundedRect(c.x - 11 + k * 6 + press, c.y - 15 - (k === 1 || k === 2 ? 3 : 0) + press, 4, 15, 2);
    }
    // Go Sniff: only while on offer, a nose over scent dots
    this.sniffLabel.setVisible(offer);
    if (offer) {
      const n = this.sniffHome;
      const timeLeft = sniffLeft;
      const press = this.sniffPointerDown || this.keys.sniff.isDown ? 3 : 0;
      this.hudDisc(h, n.x, n.y, SNIFF_RADIUS, HUD_COLOR_NUM.surface, HUD_DEPTH, press);
      h.fillStyle(HUD_COLOR_NUM.ink).fillEllipse(n.x + press, n.y + 2 + press, 20, 14);
      h.fillStyle(HUD_COLOR_NUM.surface).fillCircle(n.x - 4 + press, n.y + 3 + press, 2).fillCircle(n.x + 4 + press, n.y + 3 + press, 2);
      // the time left to use it, as a ring that runs down
      h.lineStyle(4, HUD_COLOR_NUM.sintonia).beginPath().arc(n.x, n.y, SNIFF_RADIUS + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * timeLeft).strokePath();
    }

    // Arousal: a thin bar at the top of the screen, no text
    const barX = (width - barW) / 2;
    h.fillStyle(HUD_COLOR_NUM.surfaceSunken).fillRoundedRect(barX, height - 16, barW, 10, 5).lineStyle(2, HUD_COLOR_NUM.ink).strokeRoundedRect(barX, height - 16, barW, 10, 5);
    if (level > 0) h.fillStyle(level < 0.5 ? HUD_AROUSAL_NUM.calm : level < 0.75 ? HUD_AROUSAL_NUM.alert : HUD_AROUSAL_NUM.reactive).fillRoundedRect(barX + 1, height - 15, Math.max(8, (barW - 2) * level), 8, 4);

    // checkmark icon: the Marker says "right now, good"
    h.lineStyle(8, enabled ? HUD_COLOR_NUM.ink : HUD_COLOR_NUM.disabledText).beginPath().moveTo(m.x - 18, my).lineTo(m.x - 5, my + 14).lineTo(m.x + 20, my - 14).strokePath();
  }
}

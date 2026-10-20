import Phaser from 'phaser';
import type { Translate } from '../../src/i18n';
import { CUE_LABEL_WIDTH, CUE_RADIUS, fitFontSize, hudLayout, MARKER_RADIUS, SNIFF_RADIUS, visibleCues } from '../../src/hud/layout';
import { dogPose, gaitPeriod } from '../../src/hud/pose';
import { applyDetents, keyboardInput, screenToWorldDirection, type Keys } from '../../src/hud/input';
import { project } from '../../src/hud/iso';
import { smoothZoom, targetZoom } from '../../src/hud/camera';
import { HINT_SECONDS, HintTracker } from '../../src/hud/hints';
import type { CueType, ScenarioConfig } from '../../src/sim/config';
import { leashCurve, leashPath, leashPoint, type TensionState } from '../../src/sim/leash';
import { buildPayload, type SimulationDebriefPayload } from '../../src/sim/payload';
import { activeDistractor, createState, isDogLooking, isGoSniffAvailable, routeOf, setPaused, tick, noInput, type ReactionTier, type SimEvent, type SimInput, type SimState } from '../../src/sim/sim';
import type { StageSignal } from '../../src/sim/messages';
import { add, length, scale, sub, type Vec2 } from '../../src/sim/vec';
import { TEXTURES, TILE_ORIGIN_Y } from './assets';
import { drawProp, groundBounds, TEXTURED, wallQuad, WALL_COLORS, WALL_HEIGHT } from './props';

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
}

const COLORS: Record<TensionState, number> = { slack: 0x22c55e, taut: 0xfacc15, rigid: 0xef4444 };
const JOY_RADIUS = 70;
const TILE_M = 2; // one ground tile is 2 m wide
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
  }

  create(): void {
    this.sim = createState(this.options.seed, this.options.scenario);
    this.buildScenery();
    this.gfx = this.add.graphics();
    const world = [...this.children.list];
    this.hud = this.add.graphics();
    this.markerLabel = this.add
      .text(0, 0, this.options.t('hud.marker'), { fontFamily: 'system-ui, sans-serif', color: '#f8fafc', fontSize: '16px' })
      .setOrigin(0.5, 0);
    this.cueLabel = this.add
      .text(0, 0, this.options.t('hud.cue'), { fontFamily: 'system-ui, sans-serif', color: '#f8fafc', fontSize: '14px' })
      .setOrigin(0.5, 1);
    this.leaveItLabel = this.add
      .text(0, 0, this.options.t('hud.leaveIt'), { fontFamily: 'system-ui, sans-serif', color: '#f8fafc', fontSize: '14px' })
      .setOrigin(0.5, 1);
    this.sniffLabel = this.add
      .text(0, 0, this.options.t('hud.sniff'), { fontFamily: 'system-ui, sans-serif', color: '#f8fafc', fontSize: '14px' })
      .setOrigin(0.5, 1)
      .setVisible(false);
    this.markerCount = this.add
      .text(0, 0, '', { fontFamily: 'system-ui, sans-serif', color: '#052e16', fontSize: '15px', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.hintText = this.add
      .text(0, 0, '', { fontFamily: 'system-ui, sans-serif', color: '#f8fafc', fontSize: '16px', backgroundColor: '#0f172acc', padding: { x: 10, y: 6 }, align: 'center' })
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
    const floor = this.add.graphics().setDepth(-1e5);
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const flat = FLOORS[config.theme];
        if (flat) {
          const c = [project({ x: i * TILE_M, y: j * TILE_M }), project({ x: (i + 1) * TILE_M, y: j * TILE_M }), project({ x: (i + 1) * TILE_M, y: (j + 1) * TILE_M }), project({ x: i * TILE_M, y: (j + 1) * TILE_M })];
          floor.fillStyle((i + j) % 2 === 0 ? flat[0] : flat[1]).fillPoints(c, true);
          continue;
        }
        const pos = project({ x: i * TILE_M, y: j * TILE_M });
        this.add.image(pos.x, pos.y, roads.get(`${i},${j}`) ?? 'grass').setOrigin(0.5, TILE_ORIGIN_Y).setDepth(-1e5 + pos.y);
      }
    }
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
        g.setDepth(Math.max(quad[0].y, quad[1].y));
      }
    }
    // the scenery set
    config.scenery.forEach((item, n) => {
      const pos = project(item.pos);
      const textures = TEXTURED[item.type];
      if (textures) {
        this.add.image(pos.x, pos.y, textures[Math.floor(hash(n * 13 + item.pos.x) * textures.length)]).setOrigin(0.5, 0.95).setDepth(pos.y);
      } else {
        const g = this.add.graphics();
        drawProp(g, item, pos.x, pos.y);
        g.setDepth(pos.y);
      }
    });
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
      this.accumulator += Math.min(delta, 100) / 1000;
      while (this.accumulator >= step && !this.sim.ended) {
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
    this.cameras.main.setZoom(this.zoom);
    this.cameras.main.centerOn(this.camPos.x, this.camPos.y);
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

    // distractor
    if (s.distractor.active && !s.distractor.finished) this.drawDistractor(g, s);

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
    const bob = pose.trotting ? Math.abs(Math.sin((this.time.now / 1000 / gaitPeriod(pose)) * Math.PI)) * 5 : 0;
    this.drawDog(g, { x: dogPos.x, y: dogPos.y - bob }, dogFace, s.config.learning.posture, pose);
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

    // handler
    this.drawBody(g, handlerPos, s.handlerFacing, { color: 0x3b82f6, width: 18, height: 34, lift: 22, radius: 9 });

    // leash: around wall corners when a wall is in the way
    const pulse = s.tension === 'slack' ? 1 : 0.65 + 0.35 * Math.sin(this.time.now / (s.tension === 'rigid' ? 60 : 160));
    g.lineStyle(s.tension === 'rigid' ? 5 : 3, COLORS[s.tension], pulse);
    const wrapped = s.config.walls.length > 0 ? leashPath(s.handler, s.dog, s.config.walls) : null;
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

  /** The Distractor by kind: a skateboarder or scooter, a bicycle, a jogger, food on the ground, a dog or a child. */
  private drawDistractor(g: Phaser.GameObjects.Graphics, s: SimState): void {
    const p = project(s.distractor.pos);
    const cfg = activeDistractor(s);
    g.fillStyle(0x000000, 0.25).fillEllipse(p.x, p.y, 34, 17);
    switch (cfg.kind) {
      case 'food':
        g.fillStyle(0xb45309).fillEllipse(p.x, p.y - 3, 20, 10);
        g.fillStyle(0xfbbf24).fillCircle(p.x - 3, p.y - 6, 4).fillCircle(p.x + 4, p.y - 5, 3);
        break;
      case 'bicycle':
        g.lineStyle(2, 0x111827).strokeCircle(p.x - 9, p.y - 7, 7).strokeCircle(p.x + 9, p.y - 7, 7);
        g.fillStyle(0xdb2777).fillRoundedRect(p.x - 5, p.y - 34, 10, 22, 4);
        g.fillStyle(0xfde68a).fillCircle(p.x, p.y - 38, 6);
        break;
      case 'dog':
        g.fillStyle(0x78716c).fillRoundedRect(p.x - 12, p.y - 16, 24, 11, 5);
        g.fillStyle(0x57534e).fillCircle(p.x + 12, p.y - 17, 5);
        break;
      case 'child':
        g.fillStyle(0xf472b6).fillRoundedRect(p.x - 5, p.y - 24, 10, 18, 4);
        g.fillStyle(0xfde68a).fillCircle(p.x, p.y - 28, 5);
        break;
      case 'other':
        // a jogger: long stride
        g.lineStyle(3, 0x0ea5e9).lineBetween(p.x, p.y - 14, p.x - 6, p.y).lineBetween(p.x, p.y - 14, p.x + 7, p.y - 3);
        g.fillStyle(0x0ea5e9).fillRoundedRect(p.x - 5, p.y - 36, 10, 24, 4);
        g.fillStyle(0xfde68a).fillCircle(p.x, p.y - 40, 6);
        break;
      default:
        g.fillStyle(0xa855f7).fillRoundedRect(p.x - 16, p.y - 8, 32, 8, 3); // board or scooter deck
        g.fillStyle(0xdb2777).fillRoundedRect(p.x - 6, p.y - 34, 12, 26, 4); // rider
        g.fillStyle(0xfde68a).fillCircle(p.x, p.y - 38, 6);
    }
  }

  /** The Dog: posture (visual only), plus the Reaction Tier, sniffing and trotting poses. */
  private drawDog(g: Phaser.GameObjects.Graphics, pos: Vec2, facing: Vec2, posture: 0 | 1 | 2, pose: ReturnType<typeof dogPose>): void {
    const hunched = posture === 0 || pose.headDown;
    const lean = pose.lunging ? 4 : 0;
    this.drawBody(g, pos, facing, { color: 0xf97316, width: 26, height: hunched ? 11 : 14, lift: hunched ? 6 : 8, radius: 7 });
    const f = project({ x: facing.x, y: facing.y });
    const len = Math.hypot(f.x, f.y) || 1;
    const dir = { x: f.x / len, y: f.y / len };
    const tail = { x: pos.x - dir.x * 13, y: pos.y - (hunched ? 10 : 14) - dir.y * 6 };
    if (pose.trotting) {
      // rhythmic legs
      const phase = Math.sin((this.time.now / 1000 / gaitPeriod(pose)) * Math.PI * 2);
      g.lineStyle(3, 0x9a3412).lineBetween(pos.x - 6, pos.y - 4, pos.x - 6 + phase * 5, pos.y).lineBetween(pos.x + 6, pos.y - 4, pos.x + 6 - phase * 5, pos.y);
    }
    if (pose.headUp) {
      // head and ears raised
      const head = { x: pos.x + dir.x * 14 + lean * dir.x, y: pos.y - 26 + dir.y * 6 };
      g.fillStyle(0xf97316).fillCircle(head.x, head.y, 6);
      g.fillStyle(0x9a3412).fillTriangle(head.x - 4, head.y - 4, head.x - 1, head.y - 13, head.x + 2, head.y - 4).fillTriangle(head.x + 1, head.y - 4, head.x + 4, head.y - 13, head.x + 7, head.y - 4);
      if (pose.barking) g.fillStyle(0x7f1d1d).fillEllipse(head.x + dir.x * 5, head.y + 3, 6, 4);
    } else if (pose.headDown) {
      g.fillStyle(0xf97316).fillCircle(pos.x + dir.x * 15, pos.y - 5 + dir.y * 3, 5);
    }
    g.lineStyle(3, 0xc2410c);
    if (pose.tier === 'reactive') {
      // stiff, straight tail
      g.lineBetween(tail.x, tail.y, tail.x, tail.y - 14);
    } else if (hunched && !pose.headDown) {
      // stiff tail pointing straight up, ears forward
      g.lineBetween(tail.x, tail.y, tail.x, tail.y - 12);
      g.fillStyle(0x9a3412).fillTriangle(pos.x + dir.x * 11, pos.y - 17, pos.x + dir.x * 16, pos.y - 24, pos.x + dir.x * 7, pos.y - 22);
    } else if (posture === 1) {
      g.lineBetween(tail.x, tail.y, tail.x - dir.x * 4, tail.y - 8);
    } else {
      // relaxed: a loose, wagging tail
      const wag = Math.sin(this.time.now / (pose.trotting ? 90 : 140)) * 6;
      g.lineBetween(tail.x, tail.y, tail.x - dir.x * 4 + wag, tail.y - 9);
    }
  }

  private drawBody(
    g: Phaser.GameObjects.Graphics,
    pos: Vec2,
    facing: Vec2,
    shape: { color: number; width: number; height: number; lift: number; radius: number },
  ): void {
    g.fillStyle(0x000000, 0.25).fillEllipse(pos.x, pos.y, shape.width * 1.3, shape.width * 0.65);
    g.fillStyle(shape.color).fillRoundedRect(pos.x - shape.width / 2, pos.y - shape.lift - shape.height / 2, shape.width, shape.height, shape.radius);
    const f = project({ x: facing.x, y: facing.y });
    const len = Math.hypot(f.x, f.y) || 1;
    g.fillStyle(0xffffff).fillCircle(pos.x + (f.x / len) * shape.width * 0.45, pos.y - shape.lift - shape.height * 0.2 + (f.y / len) * shape.width * 0.25, 3);
  }

  private drawHud(): void {
    const h = this.hud;
    h.clear();
    const base = this.joy?.base ?? this.joyHome;
    let knob = this.joy?.knob ?? base;
    const delta = sub(knob, base);
    if (length(delta) > JOY_RADIUS) knob = add(base, scale(delta, JOY_RADIUS / length(delta)));
    h.fillStyle(0xffffff, 0.12).fillCircle(base.x, base.y, JOY_RADIUS);
    h.lineStyle(2, 0xffffff, 0.35).strokeCircle(base.x, base.y, JOY_RADIUS);
    const walkR = JOY_RADIUS * this.sim.config.walkStrength;
    h.lineStyle(1, 0xffffff, 0.25).strokeCircle(base.x, base.y, walkR);
    h.fillStyle(0xffffff, this.joy ? 0.7 : 0.4).fillCircle(knob.x, knob.y, 26);

    const m = this.markerHome;
    const left = this.marksLeft;
    const enabled = left > 0;
    const down = enabled && (this.markerPointerDown || this.keys.marker.isDown || this.keys.marker2.isDown);
    const fill = !enabled ? 0x64748b : down ? 0x16a34a : 0x22c55e;
    h.fillStyle(fill, enabled ? 0.85 : 0.5).fillCircle(m.x, m.y, MARKER_RADIUS);
    h.lineStyle(3, 0xffffff, enabled ? 0.8 : 0.35).strokeCircle(m.x, m.y, MARKER_RADIUS);
    // remaining Marks, as a badge on the button
    const badge = { x: m.x + MARKER_RADIUS * 0.72, y: m.y - MARKER_RADIUS * 0.72 };
    h.fillStyle(enabled ? 0xfef08a : 0xcbd5e1).fillCircle(badge.x, badge.y, 14);
    this.markerCount.setText(String(Math.max(0, left)));
    this.markerLabel.setAlpha(enabled ? 1 : 0.5);
    // Cue buttons above the Marker: "Let's Go" is a speech bubble, "Leave It" a raised hand
    const cues = visibleCues(this.options.scenario.cues);
    this.cueLabel.setVisible(cues.includes('lets-go'));
    this.leaveItLabel.setVisible(cues.includes('leave-it'));
    if (cues.includes('lets-go')) {
      const c = this.cueHome;
      h.fillStyle(0x8b5cf6, 0.85).fillCircle(c.x, c.y, CUE_RADIUS);
      h.lineStyle(3, 0xffffff, 0.8).strokeCircle(c.x, c.y, CUE_RADIUS);
      h.fillStyle(0xffffff).fillRoundedRect(c.x - 14, c.y - 12, 28, 18, 5).fillTriangle(c.x - 6, c.y + 5, c.x + 2, c.y + 5, c.x - 8, c.y + 14);
      if (this.cuePointerDown || this.keys.cue.isDown) h.lineStyle(4, 0xfef08a).strokeCircle(c.x, c.y, CUE_RADIUS + 3);
    }
    if (cues.includes('leave-it')) {
      const c = this.leaveItHome;
      h.fillStyle(0xf97316, 0.9).fillCircle(c.x, c.y, CUE_RADIUS);
      h.lineStyle(3, 0xffffff, 0.8).strokeCircle(c.x, c.y, CUE_RADIUS);
      // an open hand: palm and four fingers
      h.fillStyle(0xffffff).fillRoundedRect(c.x - 11, c.y - 4, 22, 16, 5);
      for (let k = 0; k < 4; k++) h.fillRoundedRect(c.x - 11 + k * 6, c.y - 15 - (k === 1 || k === 2 ? 3 : 0), 4, 15, 2);
      if (this.leaveItPointerDown || this.keys.leaveIt.isDown) h.lineStyle(4, 0xfef08a).strokeCircle(c.x, c.y, CUE_RADIUS + 3);
    }
    // Go Sniff: only while on offer, a nose over scent dots
    const offer = this.sniffOnOffer;
    this.sniffLabel.setVisible(offer);
    if (offer) {
      const n = this.sniffHome;
      const timeLeft = Math.max(0, this.sim.sniffOfferUntil - this.sim.time) / this.sim.config.goSniff.offerSeconds;
      h.fillStyle(0x0ea5e9, 0.9).fillCircle(n.x, n.y, SNIFF_RADIUS);
      h.lineStyle(3, 0xffffff, 0.85).strokeCircle(n.x, n.y, SNIFF_RADIUS);
      h.fillStyle(0xffffff).fillEllipse(n.x, n.y + 2, 20, 14);
      h.fillStyle(0x0c4a6e).fillCircle(n.x - 4, n.y + 3, 2).fillCircle(n.x + 4, n.y + 3, 2);
      // the time left to use it, as a ring that runs down
      h.lineStyle(4, 0xfef08a, 0.9).beginPath().arc(n.x, n.y, SNIFF_RADIUS + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * timeLeft).strokePath();
      if (this.sniffPointerDown || this.keys.sniff.isDown) h.lineStyle(4, 0xfef08a).strokeCircle(n.x, n.y, SNIFF_RADIUS + 9);
    }

    // Arousal: a thin bar at the top of the screen, no text
    const barW = Math.min(220, this.scale.width * 0.4);
    const barX = (this.scale.width - barW) / 2;
    const level = this.sim.arousal / 100;
    h.fillStyle(0xffffff, 0.15).fillRect(barX, this.scale.height - 14, barW, 6);
    h.fillStyle(level < 0.5 ? 0x22c55e : level < 0.75 ? 0xfacc15 : 0xef4444).fillRect(barX, this.scale.height - 14, barW * level, 6);

    // checkmark icon: the Marker says "right now, good"
    h.lineStyle(8, 0xffffff, enabled ? 1 : 0.5).beginPath().moveTo(m.x - 18, m.y).lineTo(m.x - 5, m.y + 14).lineTo(m.x + 20, m.y - 14).strokePath();
  }
}

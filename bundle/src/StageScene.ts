import Phaser from 'phaser';
import type { Translate } from '../../src/i18n';
import { fitFontSize } from '../../src/hud/layout';
import { applyDetents, keyboardInput, screenToWorldDirection, type Keys } from '../../src/hud/input';
import { project } from '../../src/hud/iso';
import { smoothZoom, targetZoom } from '../../src/hud/camera';
import { HINT_SECONDS, HintTracker } from '../../src/hud/hints';
import { defaultScenario, type ScenarioConfig } from '../../src/sim/config';
import { leashCurve, leashPoint, type TensionState } from '../../src/sim/leash';
import { buildPayload, type SimulationDebriefPayload } from '../../src/sim/payload';
import { createState, isDogLooking, setPaused, tick, noInput, type SimEvent, type SimInput, type SimState } from '../../src/sim/sim';
import { add, length, scale, sub, type Vec2 } from '../../src/sim/vec';
import { TEXTURES, TILE_ORIGIN_Y, TREES } from './assets';

export interface StageOptions {
  seed: number;
  scenario: ScenarioConfig;
  t: Translate;
  onEnd: (payload: SimulationDebriefPayload) => void;
}

const COLORS: Record<TensionState, number> = { slack: 0x22c55e, taut: 0xfacc15, rigid: 0xef4444 };
const JOY_RADIUS = 70;
const MARKER_RADIUS = 52;
const TILE_M = 2; // one ground tile is 2 m wide

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
  private markerCount!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private hintUntil = 0;
  private hints = new HintTracker();
  private baseZoom = 1;
  private zoom = 0;
  private keys!: Record<keyof Keys | 'marker' | 'marker2', Phaser.Input.Keyboard.Key>;
  private joy: { id: number; base: Vec2; knob: Vec2 } | null = null;
  private joyHome: Vec2 = { x: 120, y: 300 };
  private markerHome: Vec2 = { x: 700, y: 300 };
  private markerPointerDown = false;
  private markerPressed = false;
  private accumulator = 0;
  private flash: { color: number; until: number } | null = null;
  private camPos: Vec2 = { x: 0, y: 0 };
  private ended = false;

  constructor() {
    super('stage');
  }

  init(options: StageOptions): void {
    this.options = options;
    this.ended = false;
    this.accumulator = 0;
    this.flash = null;
    this.hints = new HintTracker();
    this.hintUntil = 0;
    this.zoom = 0;
    this.joy = null;
    this.markerPointerDown = false;
    this.markerPressed = false;
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
    this.cameras.main.ignore([this.hud, this.markerLabel, this.markerCount, this.hintText]);

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
    };
    kb.on('keydown-SPACE', () => (this.markerPressed = true));
    kb.on('keydown-M', () => (this.markerPressed = true));

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
    this.joyHome = { x: Math.min(130, width * 0.2), y: height - Math.min(120, height * 0.25) };
    this.markerHome = { x: width - Math.min(120, width * 0.18), y: height - Math.min(120, height * 0.25) };
    const font = fitFontSize(this.options.t('hud.marker'), MARKER_RADIUS * 2.4, 16);
    this.markerLabel.setFontSize(font).setPosition(this.markerHome.x, this.markerHome.y + MARKER_RADIUS + 6);
    this.markerCount.setPosition(this.markerHome.x + MARKER_RADIUS * 0.72, this.markerHome.y - MARKER_RADIUS * 0.72);
    this.baseZoom = Phaser.Math.Clamp(Math.min(width / 640, height / 380), 0.8, 2);
    this.hintText.setPosition(width / 2, 12).setWordWrapWidth(width * 0.8);
    this.hudCam?.setSize(width, height);
  }

  private buildScenery(): void {
    const { waypoint } = this.sim.config;
    const lastTile = Math.ceil(waypoint.x / TILE_M) + 4;
    for (let i = -8; i <= lastTile; i++) {
      for (let j = -8; j <= 8; j++) {
        const pos = project({ x: i * TILE_M, y: j * TILE_M });
        const key = j === 0 && i >= -2 && i <= lastTile - 2 ? 'roadEW' : 'grass';
        this.add.image(pos.x, pos.y, key).setOrigin(0.5, TILE_ORIGIN_Y).setDepth(-1e5 + pos.y);
      }
    }
    for (let i = -3; i <= lastTile; i += 1) {
      for (const side of [-1, 1]) {
        if (hash(i * 3 + side) > 0.45) continue;
        const y = side * (3 + hash(i * 7 + side * 11) * 6);
        const x = i * TILE_M + hash(i + side * 5) * TILE_M;
        const pos = project({ x, y });
        const key = TREES[Math.floor(hash(i * 13 + side * 17) * TREES.length)];
        this.add.image(pos.x, pos.y, key).setOrigin(0.5, 0.95).setDepth(pos.y);
      }
    }
  }

  // -- input -----------------------------------------------------------------------------------

  private onPointerDown(p: Phaser.Input.Pointer): void {
    const { width } = this.scale;
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
    if (this.markerPointerDown && p.x > this.scale.width * 0.5) this.markerPointerDown = false;
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
    return { ...move, marker };
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
    } else {
      this.accumulator += Math.min(delta, 100) / 1000;
      while (this.accumulator >= step && !this.sim.ended) {
        this.handleEvents(tick(this.sim, input, step));
        input = { ...input, marker: false }; // a press counts for one tick only
        this.markerPressed = false;
        this.accumulator -= step;
      }
    }
    this.showHints();
    this.followCamera(delta);
    this.draw(input);
    this.drawHud();
  }

  private handleEvents(events: SimEvent[]): void {
    const now = this.time.now;
    for (const e of events) {
      if (e.type === 'marker-hit') this.flash = { color: 0x22c55e, until: now + 500 };
      else if (e.type === 'marker-miss') this.flash = { color: 0xef4444, until: now + 500 };
      else if (e.type === 'marker-reactive') this.flash = { color: 0xfb923c, until: now + 500 };
      else if (e.type === 'check-in-hit') this.flash = { color: 0x38bdf8, until: now + 500 };
      else if (e.type === 'marker-wasted') this.flash = { color: 0x94a3b8, until: now + 500 };
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
    g.clear();

    // waypoint flag
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
    if (s.distractor.active && !s.distractor.finished) {
      const p = project(s.distractor.pos);
      g.fillStyle(0x000000, 0.25).fillEllipse(p.x, p.y, 34, 17);
      g.fillStyle(0xa855f7).fillRoundedRect(p.x - 16, p.y - 8, 32, 8, 3); // board
      g.fillStyle(0xdb2777).fillRoundedRect(p.x - 6, p.y - 34, 12, 26, 4); // rider
      g.fillStyle(0xfde68a).fillCircle(p.x, p.y - 38, 6);
    }

    // dog
    const dogPos = project(s.dog);
    const looking = isDogLooking(s);
    const dogFace =
      s.dogMode === 'fixated'
        ? sub(s.distractor.pos, s.dog)
        : s.dogMode === 'holding' || looking
          ? sub(s.handler, s.dog)
          : s.dogFacing;
    this.drawBody(g, dogPos, dogFace, { color: 0xf97316, width: 26, height: 14, lift: 8, radius: 7 });
    if (s.dogMode === 'fixated') {
      g.fillStyle(0xfacc15).fillRoundedRect(dogPos.x - 3, dogPos.y - 46, 6, 14, 2).fillCircle(dogPos.x, dogPos.y - 26, 3);
    }

    if (looking && s.dogMode !== 'fixated') {
      // eye contact: a gaze line to the Handler and a blue eye over the Dog's head
      g.lineStyle(2, 0x38bdf8, 0.8).lineBetween(dogPos.x, dogPos.y - 22, handlerPos.x, handlerPos.y - 38);
      g.fillStyle(0xffffff).fillEllipse(dogPos.x, dogPos.y - 38, 16, 10);
      g.fillStyle(0x0ea5e9).fillCircle(dogPos.x, dogPos.y - 38, 4);
    }

    // handler
    this.drawBody(g, handlerPos, s.handlerFacing, { color: 0x3b82f6, width: 18, height: 34, lift: 22, radius: 9 });

    // leash
    const curve = leashCurve(s.handler, s.dog, s.config.leashLength);
    const pulse = s.tension === 'slack' ? 1 : 0.65 + 0.35 * Math.sin(this.time.now / (s.tension === 'rigid' ? 60 : 160));
    g.lineStyle(s.tension === 'rigid' ? 5 : 3, COLORS[s.tension], pulse);
    g.beginPath();
    for (let i = 0; i <= 20; i++) {
      const q = leashPoint(curve, i / 20);
      const sp = project({ x: q.x, y: q.y }, q.z);
      if (i === 0) g.moveTo(sp.x, sp.y);
      else g.lineTo(sp.x, sp.y);
    }
    g.strokePath();
    g.setDepth(Math.max(handlerPos.y, dogPos.y) + 1);

    // feedback ring around the dog
    if (this.flash && this.time.now < this.flash.until) {
      g.lineStyle(4, this.flash.color, 0.9).strokeCircle(dogPos.x, dogPos.y - 10, 26);
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
    // checkmark icon: the Marker says "right now, good"
    h.lineStyle(8, 0xffffff, enabled ? 1 : 0.5).beginPath().moveTo(m.x - 18, m.y).lineTo(m.x - 5, m.y + 14).lineTo(m.x + 20, m.y - 14).strokePath();
  }
}

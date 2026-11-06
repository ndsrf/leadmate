import Phaser from 'phaser';
import type { Translate } from '../../src/i18n';
import {
  HUD_AROUSAL_NUM,
  HUD_COLOR,
  HUD_COLOR_NUM,
  HUD_DEPTH,
  HUD_TENSION_NUM,
} from './tokens.generated';
import { project } from '../../src/hud/iso';
import { HAND_HEIGHT, COLLAR_HEIGHT, type Point3, type TensionState } from '../../src/sim/leash';
import { distance, type Vec2 } from '../../src/sim/vec';
import {
  buildCloseExercisePayload,
  calculateCloseLeashCurve,
  createCloseExerciseState,
  defaultCloseExerciseConfig,
  tickCloseExercise,
  type CloseExerciseConfig,
  type CloseExerciseInput,
  type CloseExerciseState,
} from '../../src/sim/closeExercise';
import { mapCloseKeyboardEvent } from '../../src/hud/input';
import { CLOSE_HUD_MARGIN, closeHudLayout } from '../../src/hud/layout';
import { HandDrillView } from './handDrillView';
import { createSignalGate } from '../../src/sim/messages';
import type { CueType } from '../../src/sim/config';
import type { SimulationDebriefPayload } from '../../src/sim/payload';
import type { ReactionTier } from '../../src/sim/sim';
import type { StageControl, StageSignal } from '../../src/sim/messages';
import { TEXTURES } from './assets';
import {
  ATLAS,
  atlas,
  atlasUrl,
  CLOSE_ATLAS,
  closeAtlas,
  closeAtlasUrl,
  closePivotOf,
  caninePostureFrame,
  handlerStanceFrame,
  distractorCloseFrame,
  closeControlsOffered,
  DOG_COATS,
} from './sprites';

export interface CloseExerciseOptions {
  seed: number;
  scenario: Partial<CloseExerciseConfig>;
  t: Translate;
  onCue?: (cueType?: CueType) => void;
  onTier?: (tier: ReactionTier, time: number) => void;
  onSignal?: (signal: StageSignal, time: number, detail?: { control?: StageControl; bearing?: number }) => void;
  onReady?: () => void;
  /** The scene may need the loop again (the how-to card was dismissed). */
  onWake?: () => void;
  onEnd?: (payload: SimulationDebriefPayload) => void;
}

const TENSION_COLORS: Record<TensionState, number> = {
  slack: HUD_TENSION_NUM.slack,
  taut: HUD_TENSION_NUM.taut,
  rigid: HUD_TENSION_NUM.rigid,
};

/** Scene pixels the close view must show side by side (Handler, Dog and the offered hand, sprites included). */
const CLOSE_VIEW_W = 260;
const CLOSE_VIEW_H = 300;
const CLOSE_ZOOM_MIN = 1;
const CLOSE_ZOOM_MAX = 1.4;

/** Zoom that keeps the whole encounter on screen at any size, as sharp as the 128 px sprites allow. */
export function closeZoom(width: number, height: number): number {
  return Math.min(CLOSE_ZOOM_MAX, Math.max(CLOSE_ZOOM_MIN, Math.min(width / CLOSE_VIEW_W, height / CLOSE_VIEW_H)));
}

/**
 * Dedicated close-view Phaser scene focusing on leash manipulation,
 * handler shielding, and narrow-passage encounters (ADR 0020).
 */
export class CloseExerciseScene extends Phaser.Scene {
  sim!: CloseExerciseState;
  options!: CloseExerciseOptions;
  t!: Translate;

  isPaused = false;
  isEnded = false;
  simSteps = 0;
  private simAccumulator = 0;

  // Input state
  inputState: CloseExerciseInput = {
    gather: false,
    shieldSide: 'none',
    poste: false,
    marker: false,
  };

  // Sprites & graphics
  private handlerSprite!: Phaser.GameObjects.Sprite;
  private dogSprite!: Phaser.GameObjects.Sprite;
  private distractorSprite!: Phaser.GameObjects.Sprite;
  private leashGfx!: Phaser.GameObjects.Graphics;
  private auraGfx!: Phaser.GameObjects.Graphics;
  private signalGate = createSignalGate();
  private sceneryGfx!: Phaser.GameObjects.Graphics;
  private hudContainer!: Phaser.GameObjects.Container;
  /** The HUD has its own unzoomed camera so the buttons stay in screen pixels, as in the Stage. */
  /** Hand drill: the HTML/SVG view that draws it (design 18); the Phaser world is not built for that scheme. */
  private view?: HandDrillView;
  /** Hand drill: the "how to play" card is up, the sim waits for "Empezar". */
  private introOpen = false;
  private shadowGfx!: Phaser.GameObjects.Graphics;
  private hudCam!: Phaser.Cameras.Scene2D.Camera;

  // HUD buttons
  private gatherBtn!: Phaser.GameObjects.Container;
  private shieldLBtn!: Phaser.GameObjects.Container;
  private shieldRBtn!: Phaser.GameObjects.Container;
  private posteBtn!: Phaser.GameObjects.Container;
  private cueBtn!: Phaser.GameObjects.Container;
  private markerBtn!: Phaser.GameObjects.Container;

  constructor() {
    super('close_exercise');
  }

  init(options: CloseExerciseOptions): void {
    this.options = options;
    this.t = options.t;
    this.sim = createCloseExerciseState(options.scenario, options.seed);
    this.isPaused = false;
    this.isEnded = false;
    this.simSteps = 0;
    this.simAccumulator = 0;
    this.signalGate = createSignalGate();
    this.introOpen = this.sim.config.controls === 'hand_drill';
    this.inputState = {
      gather: false,
      shieldSide: 'none',
      poste: false,
      marker: false,
    };
  }

  preload(): void {
    if (!this.textures.exists(CLOSE_ATLAS)) {
      this.load.atlas(CLOSE_ATLAS, closeAtlasUrl, closeAtlas as object);
    }
    if (!this.textures.exists(ATLAS)) {
      this.load.atlas(ATLAS, atlasUrl, atlas as object);
    }
    for (const [key, src] of Object.entries(TEXTURES)) {
      if (!this.textures.exists(key)) this.load.image(key, src);
    }
  }

  create(): void {
    // the game renders without antialiasing; zoomed sprites need smoothing
    this.textures.get(CLOSE_ATLAS).setFilter(Phaser.Textures.FilterMode.LINEAR);

    if (this.sim.config.controls === 'hand_drill') {
      this.createDrillView();
      return;
    }

    // 1. Build the narrow street scenery
    this.buildNarrowCorridorScenery();
    this.shadowGfx = this.add.graphics();
    this.shadowGfx.setDepth(5);

    // 2. Leash graphics (rendered between characters)
    this.leashGfx = this.add.graphics();
    this.leashGfx.setDepth(10);

    // 3. Characters
    const hPivot = closePivotOf('handler_close_torso');
    this.handlerSprite = this.add.sprite(0, 0, CLOSE_ATLAS, 'handler_close_torso');
    this.handlerSprite.setOrigin(hPivot.x, hPivot.y);
    this.handlerSprite.setDepth(20);

    const dPivot = closePivotOf('dog_close_neutral');
    this.dogSprite = this.add.sprite(0, 0, CLOSE_ATLAS, 'dog_close_neutral');
    this.dogSprite.setOrigin(dPivot.x, dPivot.y);
    this.dogSprite.setDepth(21); // in front of the Handler, who stands behind it

    const distPivot = closePivotOf('distractor_close_walk0');
    this.distractorSprite = this.add.sprite(0, 0, CLOSE_ATLAS, 'distractor_close_walk0');
    this.distractorSprite.setOrigin(distPivot.x, distPivot.y);
    this.distractorSprite.setDepth(12);

    // 4. Arousal / Feedback ring
    this.auraGfx = this.add.graphics();
    this.auraGfx.setDepth(14);

    // 5. Setup Camera
    this.setupCamera();

    // 6. Build specialized leash HUD controls
    this.hudCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.buildHud();

    // 7. Setup Keyboard Bindings
    this.setupKeyboard();

    // Resize handler
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);

    // Initial position update
    this.updateVisuals();

    this.options.onReady?.();
  }

  /** The hand drill is drawn by `HandDrillView` (design 18); the scene keeps the clock, the sim and the input. */
  private createDrillView(): void {
    const input = this.inputState;
    this.view = new HandDrillView(
      this.t,
      this.sim.config.reward === 'toy' ? 'toy' : 'treat',
      {
        onGather: (down) => { input.gather = down; },
        onPoste: (down) => { input.poste = down; },
        onMark: () => { input.marker = true; },
        onStart: () => {
          this.introOpen = false;
          this.syncStill();
          this.wakeLoop();
        },
      },
      this.introOpen,
    );
    this.syncStill(); // one place decides the animations' state, including a pause that arrived before the view
    this.setupKeyboard();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.view?.destroy();
      this.view = undefined;
    });
    this.view.render(this.sim, performance.now());
    this.options.onReady?.();
  }

  private buildNarrowCorridorScenery(): void {
    this.sceneryGfx = this.add.graphics();
    this.sceneryGfx.setDepth(1);
    const g = this.sceneryGfx;

    // Draw narrow street pavement and brick walls in isometric perspective
    // Alley width approx 3.5m (x: -1.2 to 2.4, y: -15 to 15)
    for (let y = -14; y <= 14; y += 1.5) {
      for (let x = -1.2; x <= 2.2; x += 1.2) {
        const p = project({ x, y });
        g.fillStyle(0xd5cec5, 1);
        g.fillEllipse(p.x, p.y, 60, 30);
        g.lineStyle(1, 0xb8b0a5, 0.6);
        g.strokeEllipse(p.x, p.y, 60, 30);
      }
    }

    // Street curbs on left and right
    const curbLeftA = project({ x: -1.4, y: -16 });
    const curbLeftB = project({ x: -1.4, y: 16 });
    g.lineStyle(4, 0x8c827a, 1).lineBetween(curbLeftA.x, curbLeftA.y, curbLeftB.x, curbLeftB.y);

    const curbRightA = project({ x: 2.4, y: -16 });
    const curbRightB = project({ x: 2.4, y: 16 });
    g.lineStyle(4, 0x8c827a, 1).lineBetween(curbRightA.x, curbRightA.y, curbRightB.x, curbRightB.y);

    // Brick wall facade on left
    const wallA = project({ x: -1.5, y: -16 }, 0);
    const wallB = project({ x: -1.5, y: 16 }, 0);
    const wallTopA = project({ x: -1.5, y: -16 }, 2.5);
    const wallTopB = project({ x: -1.5, y: 16 }, 2.5);

    g.fillStyle(0x9a4f3b, 0.9);
    g.fillPoints([wallA, wallB, wallTopB, wallTopA]);
  }

  private setupCamera(): void {
    const cam = this.cameras.main;
    this.centerCamera();
  }

  private centerCamera(): void {
    const cam = this.cameras.main;
    const { width, height } = this.scale;
    cam.setSize(width, height);
    cam.setZoom(closeZoom(width, height));
    // frame the Handler and the Dog, a little above the ground for the thumb controls
    const midX = (this.sim.handler.x + this.sim.dog.x) / 2;
    const midY = (this.sim.handler.y + this.sim.dog.y) / 2;
    const screenMid = project({ x: midX, y: midY });
    cam.centerOn(screenMid.x, screenMid.y - 30);
  }

  private setupKeyboard(): void {
    if (!this.input.keyboard) return;

    this.input.keyboard.on('keydown', (e: KeyboardEvent) => {
      this.inputState = mapCloseKeyboardEvent(e.code, true, this.inputState);
      this.updateShieldButtonHighlight();
    });

    this.input.keyboard.on('keyup', (e: KeyboardEvent) => {
      this.inputState = mapCloseKeyboardEvent(e.code, false, this.inputState);
      this.updateShieldButtonHighlight();
    });
  }

  private buildHud(): void {
    if (this.hudContainer) this.hudContainer.destroy();
    this.hudContainer = this.add.container(0, 0);
    this.hudContainer.setScrollFactor(0);
    this.hudContainer.setDepth(100);

    const { width, height } = this.scale;
    this.hudCam.setSize(width, height);
    const margin = CLOSE_HUD_MARGIN;
    const layout = closeHudLayout(width, height);
    const t = this.options.t;
    const gatherLabel = t ? t('hud.gather').toUpperCase() : 'RECOGER';
    const shieldLLabel = t ? `${t('hud.shield').toUpperCase()} I` : 'ESCUDO I';
    const shieldRLabel = t ? `${t('hud.shield').toUpperCase()} D` : 'ESCUDO D';
    const markerLabel = t ? t('hud.marker').toUpperCase() : 'MARCAR';
    const posteLabel = t ? t('hud.poste').toUpperCase() : 'POSTE';
    const cueLabel = t ? t('hud.letsGo').toUpperCase() : 'VAMOS';

    const offered = closeControlsOffered(this.sim.config.controls);

    // --- LEFT THUMB: Gather & Shield ---
    // Gather Leash Button (Hold to shorten)
    this.gatherBtn = this.createHudButton(
      layout.gather.x,
      layout.gather.y,
      layout.gather.w,
      layout.gather.h,
      gatherLabel,
      HUD_COLOR_NUM.brand,
      () => { this.inputState.gather = true; },
      () => { this.inputState.gather = false; },
    );

    // Shield Left & Right Toggle Buttons
    this.shieldLBtn = this.createHudButton(
      margin + 20,
      height - margin - 130,
      70,
      44,
      shieldLLabel,
      HUD_COLOR_NUM.info,
      () => {
        this.inputState.shieldSide = this.inputState.shieldSide === 'left' ? 'none' : 'left';
        this.updateShieldButtonHighlight();
      },
    );

    this.shieldRBtn = this.createHudButton(
      margin + 100,
      height - margin - 130,
      70,
      44,
      shieldRLabel,
      HUD_COLOR_NUM.info,
      () => {
        this.inputState.shieldSide = this.inputState.shieldSide === 'right' ? 'none' : 'right';
        this.updateShieldButtonHighlight();
      },
    );

    // --- RIGHT THUMB: Poste, Cue & Marker ---
    // Marker Button
    this.markerBtn = this.createHudButton(
      layout.marker.x,
      layout.marker.y,
      layout.marker.w,
      layout.marker.h,
      markerLabel,
      HUD_COLOR_NUM.accent,
      () => { this.inputState.marker = true; },
    );

    // Poste Button
    this.posteBtn = this.createHudButton(
      layout.poste.x,
      layout.poste.y,
      layout.poste.w,
      layout.poste.h,
      posteLabel,
      HUD_COLOR_NUM.brandDeep,
      () => { this.inputState.poste = true; },
      () => { this.inputState.poste = false; },
    );

    // Cue Button
    this.cueBtn = this.createHudButton(
      width - margin - 150,
      height - margin - 90,
      80,
      50,
      cueLabel,
      HUD_COLOR_NUM.surface,
      () => {
        this.inputState.cue = true;
        this.inputState.cueType = 'lets-go';
      },
    );

    const controls = [this.gatherBtn, this.posteBtn, this.markerBtn];
    if (offered.shield) controls.push(this.shieldLBtn, this.shieldRBtn);
    else {
      this.shieldLBtn.destroy();
      this.shieldRBtn.destroy();
    }
    if (offered.cue) controls.push(this.cueBtn);
    else this.cueBtn.destroy();
    this.hudContainer.add(controls);

    // the world is drawn by the zoomed camera only, the HUD by the unzoomed one only
    this.cameras.main.ignore(this.hudContainer);
    this.hudCam.ignore([
      this.sceneryGfx,
      this.leashGfx,
      this.handlerSprite,
      this.dogSprite,
      this.distractorSprite,
      this.auraGfx,
      this.shadowGfx,
    ]);
  }

  private createHudButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    colorNum: number,
    onDown: () => void,
    onUp?: () => void,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, w, h, colorNum, 0.95);
    bg.setStrokeStyle(HUD_DEPTH, HUD_COLOR_NUM.ink, 0.8);
    bg.setInteractive({ useHandCursor: true });

    const txt = this.add.text(0, 0, label, {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: `${Math.min(16, Math.max(11, Math.round(w / 6)))}px`,
      color: HUD_COLOR.ink,
      fontStyle: 'bold',
    });
    txt.setOrigin(0.5);

    bg.on('pointerdown', () => {
      bg.setScale(0.95);
      onDown();
    });

    const release = () => {
      bg.setScale(1.0);
      onUp?.();
    };

    bg.on('pointerup', release);
    bg.on('pointerout', release);

    container.add([bg, txt]);
    return container;
  }

  private updateShieldButtonHighlight(): void {
    const lBg = this.shieldLBtn.getAt(0) as Phaser.GameObjects.Rectangle;
    const rBg = this.shieldRBtn.getAt(0) as Phaser.GameObjects.Rectangle;

    lBg.setFillStyle(
      this.inputState.shieldSide === 'left' ? HUD_COLOR_NUM.focus : HUD_COLOR_NUM.info,
      this.inputState.shieldSide === 'left' ? 1.0 : 0.7,
    );
    rBg.setFillStyle(
      this.inputState.shieldSide === 'right' ? HUD_COLOR_NUM.focus : HUD_COLOR_NUM.info,
      this.inputState.shieldSide === 'right' ? 1.0 : 0.7,
    );
  }

  private onResize(gameSize: Phaser.Structs.Size): void {
    this.centerCamera();
    this.buildHud();
  }

  update(time: number, delta: number): void {
    if (this.isPaused || this.isEnded) return;
    if (this.introOpen) return; // the hand drill's how-to-play card is up: the clock waits for "Empezar"

    // Fixed step loop
    this.simAccumulator += Math.min(delta / 1000, 0.1);
    const dt = this.sim.config.fixedStep;

    while (this.simAccumulator >= dt) {
      this.simAccumulator -= dt;
      this.simSteps += 1;

      // a press counts even if it changes nothing: the Coach mark is about learning the control
      const inp = this.inputState;
      if (inp.gather) this.signal('gather');
      if (inp.poste) this.signal('poste');
      if (inp.marker) this.signal('close-mark');
      if (this.sim.config.controls === 'hand_drill') {
        // Keyboard shortcuts must not reach controls this scheme does not offer.
        this.inputState.shieldSide = 'none';
        this.inputState.cue = false;
      }
      const events = tickCloseExercise(this.sim, this.inputState);

      // Process lifecycle events
      for (const e of events) {
        if (e.type === 'cue') {
          this.options.onCue?.(e.cueType);
        } else if (e.type === 'reaction-tier-change') {
          this.options.onTier?.(e.tier, e.time);
        } else if (e.type === 'marker-hit') {
          this.view?.celebrate(performance.now());
        } else if (e.type === 'exercise-complete') {
          this.isEnded = true;
          this.syncStill();
          const payload = buildCloseExercisePayload(this.sim);
          // the hand drill holds its last frame (the reward and the sparkles) for a moment before the Debrief
          const celebrate = this.view && e.outcome === 'calm' ? 1300 : 0;
          if (celebrate) this.view!.render(this.sim, performance.now());
          setTimeout(() => this.options.onEnd?.(payload), celebrate);
        }
      }

      // Clear one-shot inputs
      this.inputState.marker = false;
      this.inputState.cue = false;
    }

    // Render updates
    if (this.view) this.view.render(this.sim, performance.now());
    else this.updateVisuals();
  }

  /** Each control is reported to the shell once per exercise. */
  private signal(control: StageControl): void {
    if (!this.signalGate('control-used', control)) return;
    this.options.onSignal?.('control-used', this.sim.time, { control });
  }

  private updateVisuals(): void {
    const s = this.sim;

    // 1. Update Handler Sprite
    const hPos = project(s.handler);
    this.handlerSprite.setPosition(hPos.x, hPos.y);
    const hFrame = handlerStanceFrame(s.shieldSide, s.isPoste, s.isGathering);
    this.handlerSprite.setFrame(hFrame);

    // 2. Update Dog Sprite
    const dPos = project(s.dog);
    // a straining or excited Dog bobs, so the view is never a still picture
    const bob = s.arousal > 5 ? Math.abs(Math.sin(this.time.now / 110)) * Math.min(5, s.arousal / 8) : 0;
    this.dogSprite.setPosition(dPos.x, dPos.y - bob);
    const dFrame = caninePostureFrame(s.dogPosture);
    this.dogSprite.setFrame(dFrame);

    // Dog coat tint
    const coat = s.config.learning ? 'golden' : undefined;
    if (coat && DOG_COATS[coat]) {
      this.dogSprite.setTint(DOG_COATS[coat]);
    }

    // 3. Update Distractor Sprite
    if (s.distractor.active && !s.distractor.finished) {
      this.distractorSprite.setVisible(true);
      const distPos = project(s.distractor.pos);
      this.distractorSprite.setPosition(distPos.x, distPos.y);
      const distFrame = distractorCloseFrame(s.tier, this.simSteps);
      this.distractorSprite.setFrame(distFrame);
    } else {
      this.distractorSprite.setVisible(false);
    }

    this.renderShadows(hPos, dPos);

    // 4. Render Dynamic Leash Bézier curve (Task 2.3)
    this.renderCloseLeash();

    // 5. Render Dog Arousal & Reactive Feedback (Task 3.3)
    this.renderArousalFeedback(dPos);
  }

  private renderShadows(hPos: Vec2, dPos: Vec2): void {
    const g = this.shadowGfx;
    g.clear();
    g.fillStyle(0x1e2a3a, 0.22);
    g.fillEllipse(hPos.x, hPos.y, 40, 15);
    g.fillEllipse(dPos.x, dPos.y, 34, 13);
  }

  /**
   * Renders close-up dynamic leash Bézier curve with tension color states
   * and sag clamping preventing dipping through the ground plane (Task 2.3).
   */
  renderCloseLeash(): void {
    const s = this.sim;
    const g = this.leashGfx;
    g.clear();

    const { start: pStart, control: controlPoint, end: pEnd } = calculateCloseLeashCurve(
      s.handler,
      s.dog,
      s.effectiveLeashLength,
    );

    // Tension styling and pulse
    const color = TENSION_COLORS[s.tension];
    const pulse = s.tension === 'slack' ? 1.0 : 0.75 + 0.25 * Math.sin(this.time.now / (s.tension === 'rigid' ? 60 : 150));
    const width = s.tension === 'rigid' ? 6 : s.tension === 'taut' ? 5 : 4;

    const SEGMENTS = 20;
    for (const pass of [0, 1]) {
      // an ink outline first, so the leash reads against any floor
      g.lineStyle(pass === 0 ? width + 4 : width, pass === 0 ? HUD_COLOR_NUM.ink : color, pass === 0 ? 0.55 : pulse);
      g.beginPath();
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS;
      const u = 1 - t;
      const x = u * u * pStart.x + 2 * u * t * controlPoint.x + t * t * pEnd.x;
      const y = u * u * pStart.y + 2 * u * t * controlPoint.y + t * t * pEnd.y;
      const z = u * u * pStart.z + 2 * u * t * controlPoint.z + t * t * pEnd.z;

      const screenPt = project({ x, y }, z);
      if (i === 0) g.moveTo(screenPt.x, screenPt.y);
      else g.lineTo(screenPt.x, screenPt.y);
    }
    g.strokePath();
    }
  }

  private renderArousalFeedback(dogPos: Vec2): void {
    const s = this.sim;
    const g = this.auraGfx;
    g.clear();

    if (s.arousal > 5) {
      const auraColor =
        s.tier === 'reactive'
          ? HUD_AROUSAL_NUM.reactive
          : s.tier === 'alert'
          ? HUD_AROUSAL_NUM.alert
          : HUD_AROUSAL_NUM.calm;

      const intensity = Math.min(1, s.arousal / 50);
      const wobble = Math.sin(this.time.now / 90) * 3;
      const radius = 28 + wobble + intensity * 8;

      g.lineStyle(3, auraColor, 0.7 * intensity);
      g.strokeCircle(dogPos.x, dogPos.y - 12, radius);

      if (s.tier === 'reactive') {
        // Warning pulses for reactive lunge
        g.lineStyle(2, 0xff0055, 0.8);
        g.strokeCircle(dogPos.x, dogPos.y - 12, radius + 10);
      }
    }

    // Line of sight occlusion shield indicator
    if (s.isShieldingOccluded) {
      const hPos = project(s.handler);
      g.lineStyle(2, HUD_COLOR_NUM.info, 0.6);
      g.lineBetween(hPos.x, hPos.y - 40, dogPos.x, dogPos.y - 20);
    }
  }

  pauseStage(): void {
    this.isPaused = true;
    this.syncStill();
  }

  resumeStage(): void {
    this.isPaused = false;
    this.syncStill();
  }

  /** The hand drill's how-to-play card is up: the clock waits and the loop can sleep. */
  get isWaitingToStart(): boolean {
    return this.introOpen;
  }

  /** False for the hand drill, which is HTML/SVG over the page: the Phaser canvas has nothing to draw. */
  get drawsCanvas(): boolean {
    return !this.view;
  }

  /** Wakes the render loop: through the owner's hook, or directly when the scene was created without one. */
  private wakeLoop(): void {
    if (this.options.onWake) {
      this.options.onWake();
      return;
    }
    const loop = this.game?.loop;
    if (loop && !loop.running) {
      loop.wake();
      loop.resetDelta();
    }
  }

  /** The hand drill's endless animations run only while the drill is playing. */
  private syncStill(): void {
    this.view?.setStill(this.isPaused || this.isEnded || this.introOpen);
  }

  focusCamera(): void {
    this.centerCamera();
  }
}

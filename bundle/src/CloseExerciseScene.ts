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
  onEnd?: (payload: SimulationDebriefPayload) => void;
}

const TENSION_COLORS: Record<TensionState, number> = {
  slack: HUD_TENSION_NUM.slack,
  taut: HUD_TENSION_NUM.taut,
  rigid: HUD_TENSION_NUM.rigid,
};

const CLOSE_CAMERA_ZOOM = 3.2;

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
  private sceneryGfx!: Phaser.GameObjects.Graphics;
  private hudContainer!: Phaser.GameObjects.Container;

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
    // 1. Build narrow corridor scenery
    this.buildNarrowCorridorScenery();

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
    this.dogSprite.setDepth(15);

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
    this.buildHud();

    // 7. Setup Keyboard Bindings
    this.setupKeyboard();

    // Resize handler
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);

    // Initial position update
    this.updateVisuals();

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
    cam.setZoom(CLOSE_CAMERA_ZOOM);
    this.centerCamera();
  }

  private centerCamera(): void {
    const cam = this.cameras.main;
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
    const margin = 24;
    const t = this.options.t;
    const gatherLabel = t ? t('hud.gather').toUpperCase() : 'RECOGER';
    const shieldLLabel = t ? `${t('hud.shield').toUpperCase()} I` : 'ESCUDO I';
    const shieldRLabel = t ? `${t('hud.shield').toUpperCase()} D` : 'ESCUDO D';
    const markerLabel = t ? t('hud.marker').toUpperCase() : 'MARCAR';
    const posteLabel = t ? t('hud.poste').toUpperCase() : 'POSTE';
    const cueLabel = t ? t('hud.letsGo').toUpperCase() : 'VAMOS';

    // --- LEFT THUMB: Gather & Shield ---
    // Gather Leash Button (Hold to shorten)
    this.gatherBtn = this.createHudButton(
      margin + 50,
      height - margin - 50,
      100,
      60,
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
      width - margin - 50,
      height - margin - 50,
      100,
      60,
      markerLabel,
      HUD_COLOR_NUM.accent,
      () => { this.inputState.marker = true; },
    );

    // Poste Button
    this.posteBtn = this.createHudButton(
      width - margin - 50,
      height - margin - 130,
      100,
      48,
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

    this.hudContainer.add([
      this.gatherBtn,
      this.shieldLBtn,
      this.shieldRBtn,
      this.posteBtn,
      this.cueBtn,
      this.markerBtn,
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

    // Fixed step loop
    this.simAccumulator += Math.min(delta / 1000, 0.1);
    const dt = this.sim.config.fixedStep;

    while (this.simAccumulator >= dt) {
      this.simAccumulator -= dt;
      this.simSteps += 1;

      const events = tickCloseExercise(this.sim, this.inputState);

      // Process lifecycle events
      for (const e of events) {
        if (e.type === 'cue') {
          this.options.onCue?.(e.cueType);
        } else if (e.type === 'reaction-tier-change') {
          this.options.onTier?.(e.tier, e.time);
        } else if (e.type === 'exercise-complete') {
          this.isEnded = true;
          const payload = buildCloseExercisePayload(this.sim);
          this.options.onEnd?.(payload);
        }
      }

      // Clear one-shot inputs
      this.inputState.marker = false;
      this.inputState.cue = false;
    }

    // Render updates
    this.updateVisuals();
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
    this.dogSprite.setPosition(dPos.x, dPos.y);
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

    // 4. Render Dynamic Leash Bézier curve (Task 2.3)
    this.renderCloseLeash();

    // 5. Render Dog Arousal & Reactive Feedback (Task 3.3)
    this.renderArousalFeedback(dPos);
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

    g.lineStyle(width, color, pulse);
    g.beginPath();

    const SEGMENTS = 20;
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
  }

  resumeStage(): void {
    this.isPaused = false;
  }

  focusCamera(): void {
    this.centerCamera();
  }
}

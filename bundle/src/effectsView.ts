import Phaser from 'phaser';
import hudAtlasUrl from '../assets/hud/sprites.png';
import hudAtlas from '../assets/hud/sprites.json';
import type { FeedbackMessage, FeedbackTier } from '../../src/hud/feedback';
import type { FeedbackActionKind, FeedbackPolarity } from '../../src/sim/feedbackKinds';
import {
  alphaFade,
  bounceOffset,
  createEffectsTracker,
  iconForKind,
  MAX_EFFECT_PARTICLES,
  meterBadgeFrame,
  wobbleOffset,
  type ActiveFlyingPoint,
  type EffectsTracker,
  type FlyingPointEvent,
} from '../../src/hud/effectsPool';
import {
  bannerLayout,
  feedbackMessagePosition,
  stageMetersLayout,
  type HudCue,
  type Point,
  type StageMeterLayout,
} from '../../src/hud/layout';
import {
  HUD_BORDER,
  HUD_COLOR,
  HUD_COLOR_NUM,
  HUD_DEPTH,
  HUD_RADIUS,
} from './tokens.generated';

export const HUD_ATLAS = 'hud';

export interface MeterConfig {
  id: string;
  labelKey: string;
  icon: string;
  target: number;
}

export class EffectsView {
  private readonly scene: Phaser.Scene;
  private readonly hudCam: Phaser.Cameras.Scene2D.Camera;
  private readonly reducedMotion: boolean;
  private readonly tracker: EffectsTracker;

  // Pooled GameObjects
  private messageContainer!: Phaser.GameObjects.Container;
  private messageBg!: Phaser.GameObjects.Graphics;
  private messageIcon!: Phaser.GameObjects.Image;
  private messageText!: Phaser.GameObjects.Text;

  private bannerContainer!: Phaser.GameObjects.Container;
  private bannerFrame!: Phaser.GameObjects.Image;
  private bannerIcon!: Phaser.GameObjects.Image;
  private bannerText!: Phaser.GameObjects.Text;
  private bannerGlow!: Phaser.GameObjects.Image;

  private particlePool: Phaser.GameObjects.Image[] = [];
  private flyingPool: {
    container: Phaser.GameObjects.Container;
    icon: Phaser.GameObjects.Image;
    text: Phaser.GameObjects.Text;
  }[] = [];

  // Stage Meters
  private metersGfx!: Phaser.GameObjects.Graphics;
  private meterBadges: Phaser.GameObjects.Image[] = [];
  private meterLabels: Phaser.GameObjects.Text[] = [];
  private meterValues: Phaser.GameObjects.Text[] = [];
  private meterStars: Phaser.GameObjects.Image[] = [];
  private currentMeterValues: Record<string, number> = {};

  // Positioning
  private lastDogPos: Point = { x: 0, y: 0 };
  private messageBasePos: Point = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, hudCam: Phaser.Cameras.Scene2D.Camera, reducedMotion = false) {
    this.scene = scene;
    this.hudCam = hudCam;
    this.reducedMotion = reducedMotion;
    this.tracker = createEffectsTracker(this.reducedMotion);
  }

  static preload(scene: Phaser.Scene): void {
    if (!scene.textures.exists(HUD_ATLAS)) {
      scene.load.atlas(HUD_ATLAS, hudAtlasUrl, hudAtlas as object);
    }
  }

  create(): void {
    if (this.scene.textures.exists(HUD_ATLAS)) {
      this.scene.textures.get(HUD_ATLAS).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }

    // 1. Screen edge glow for big tier
    this.bannerGlow = this.scene.add
      .image(0, 0, HUD_ATLAS, 'glow_edge')
      .setOrigin(0, 0)
      .setVisible(false);

    // 2. Banner container (big tier)
    this.bannerFrame = this.scene.add.image(0, 0, HUD_ATLAS, 'banner_frame').setOrigin(0.5, 0.5);
    this.bannerIcon = this.scene.add.image(-180, 0, HUD_ATLAS, 'icon_star').setOrigin(0.5, 0.5).setScale(0.5);
    this.bannerText = this.scene.add
      .text(0, 0, '', {
        fontFamily: 'system-ui, sans-serif',
        color: HUD_COLOR.ink,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5);

    this.bannerContainer = this.scene.add
      .container(0, 0, [this.bannerFrame, this.bannerIcon, this.bannerText])
      .setVisible(false);

    // 3. Message container (small, medium, wrong)
    this.messageBg = this.scene.add.graphics();
    this.messageIcon = this.scene.add.image(0, 0, HUD_ATLAS, 'icon_sparkle').setOrigin(0.5, 0.5).setScale(0.4);
    this.messageText = this.scene.add.text(0, 0, '', {
      fontFamily: 'system-ui, sans-serif',
      color: HUD_COLOR.ink,
      fontSize: '14px',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.messageContainer = this.scene.add
      .container(0, 0, [this.messageBg, this.messageIcon, this.messageText])
      .setVisible(false);

    // 4. Fixed pool of 40 particle images (design Decision 6)
    this.particlePool = [];
    for (let i = 0; i < MAX_EFFECT_PARTICLES; i++) {
      const p = this.scene.add.image(0, 0, HUD_ATLAS, 'burst_spark').setVisible(false);
      this.particlePool.push(p);
    }

    // 5. Flying meter points pool (2 items)
    this.flyingPool = [];
    for (let i = 0; i < 2; i++) {
      const icon = this.scene.add.image(-12, 0, HUD_ATLAS, 'icon_eye').setOrigin(0.5, 0.5).setScale(0.35);
      const text = this.scene.add.text(0, 0, '', {
        fontFamily: 'system-ui, sans-serif',
        color: HUD_COLOR.brandDeep,
        fontSize: '14px',
        fontStyle: 'bold',
        backgroundColor: `${HUD_COLOR.surface}ee`,
        padding: { x: 4, y: 2 },
      }).setOrigin(0, 0.5);
      const c = this.scene.add.container(0, 0, [icon, text]).setVisible(false);
      this.flyingPool.push({ container: c, icon, text });
    }

    // 6. Stage Meters
    this.metersGfx = this.scene.add.graphics();
    this.meterBadges = [
      this.scene.add.image(0, 0, HUD_ATLAS, 'meter_nose').setOrigin(0.5, 0.5).setScale(0.34).setVisible(false),
      this.scene.add.image(0, 0, HUD_ATLAS, 'meter_connection').setOrigin(0.5, 0.5).setScale(0.34).setVisible(false),
    ];
    this.meterLabels = [
      this.scene.add.text(0, 0, '', { fontFamily: 'system-ui, sans-serif', color: HUD_COLOR.ink, fontSize: '10px', fontStyle: 'bold' }).setVisible(false),
      this.scene.add.text(0, 0, '', { fontFamily: 'system-ui, sans-serif', color: HUD_COLOR.ink, fontSize: '10px', fontStyle: 'bold' }).setVisible(false),
    ];
    this.meterValues = [
      this.scene.add.text(0, 0, '', { fontFamily: 'system-ui, sans-serif', color: HUD_COLOR.inkMuted, fontSize: '10px' }).setOrigin(1, 0).setVisible(false),
      this.scene.add.text(0, 0, '', { fontFamily: 'system-ui, sans-serif', color: HUD_COLOR.inkMuted, fontSize: '10px' }).setOrigin(1, 0).setVisible(false),
    ];
    this.meterStars = [
      this.scene.add.image(0, 0, HUD_ATLAS, 'icon_star').setOrigin(0.5, 0.5).setScale(0.24).setVisible(false),
      this.scene.add.image(0, 0, HUD_ATLAS, 'icon_star').setOrigin(0.5, 0.5).setScale(0.24).setVisible(false),
    ];

    // Ensure all effect objects are only drawn by hudCam
    const all = [
      this.bannerGlow,
      this.bannerContainer,
      this.messageContainer,
      ...this.particlePool,
      ...this.flyingPool.map((f) => f.container),
      this.metersGfx,
      ...this.meterBadges,
      ...this.meterLabels,
      ...this.meterValues,
      ...this.meterStars,
    ];
    this.scene.cameras.main.ignore(all);
  }

  /**
   * Triggers a Feedback Message with its game-style effects (small, medium, big, wrong).
   */
  showFeedback(
    message: FeedbackMessage,
    text: string,
    dogScreenPos: Point,
    screenWidth: number,
    screenHeight: number,
    time: number,
    cues?: readonly HudCue[],
  ): void {
    this.lastDogPos = dogScreenPos;
    this.tracker.triggerFeedback(message, time);

    const iconFrame = iconForKind(message.kind, message.polarity);
    this.messageBasePos = feedbackMessagePosition(dogScreenPos, screenWidth, screenHeight, cues);

    if (message.tier === 'big') {
      // Big tier uses the banner and screen-edge glow
      const b = bannerLayout(screenWidth, screenHeight);
      this.bannerContainer.setPosition(b.x, b.y).setVisible(true);
      this.bannerText.setText(text);
      this.bannerIcon.setFrame(iconFrame).setPosition(-this.bannerText.width / 2 - 24, 0);

      this.bannerGlow
        .setPosition(0, 0)
        .setDisplaySize(screenWidth, screenHeight)
        .setAlpha(this.reducedMotion ? 0 : 0.6)
        .setVisible(!this.reducedMotion);

      // Hide message bubble during banner
      this.messageContainer.setVisible(false);
    } else {
      // Small, medium, or wrong tiers use the pop-up message container
      this.bannerContainer.setVisible(false);
      this.bannerGlow.setVisible(false);

      this.messageText.setText(text);
      this.messageIcon.setFrame(iconFrame);

      const padX = 10;
      const padY = 5;
      const textW = this.messageText.width;
      const textH = this.messageText.height;
      const iconW = 22;
      const totalW = iconW + textW + padX * 2 + 6;
      const totalH = Math.max(textH, iconW) + padY * 2;

      this.messageIcon.setPosition(-totalW / 2 + padX + iconW / 2, 0);
      this.messageText.setPosition(-totalW / 2 + padX + iconW + 6, 0);

      // Draw bubble background
      this.messageBg.clear();
      // Drop shadow
      this.messageBg.fillStyle(HUD_COLOR_NUM.ink, 0.4);
      this.messageBg.fillRoundedRect(-totalW / 2 + 2, -totalH / 2 + 3, totalW, totalH, 8);
      // Face
      this.messageBg.fillStyle(message.polarity === 'wrong' ? 0xf1f5f9 : HUD_COLOR_NUM.surface, 0.95);
      this.messageBg.fillRoundedRect(-totalW / 2, -totalH / 2, totalW, totalH, 8);
      // Border
      this.messageBg.lineStyle(HUD_BORDER - 1, HUD_COLOR_NUM.ink, 0.9);
      this.messageBg.strokeRoundedRect(-totalW / 2, -totalH / 2, totalW, totalH, 8);

      this.messageContainer.setPosition(this.messageBasePos.x, this.messageBasePos.y).setVisible(true);
    }
  }

  /**
   * Spawns a Meter Point flying from the Dog into the target meter.
   */
  showMeterPoints(
    event: { meterId: string; points: number; kind: FeedbackActionKind; value: number; full: boolean },
    dogScreenPos: Point,
    targetMeterPos: Point,
    time: number,
  ): void {
    this.currentMeterValues[event.meterId] = event.value;
    this.tracker.triggerMeterPoints(
      {
        meterId: event.meterId,
        points: event.points,
        kind: event.kind,
        value: event.value,
        full: event.full,
        from: dogScreenPos,
        to: targetMeterPos,
      },
      time,
    );
  }

  /**
   * Update effects animations per frame.
   */
  update(
    time: number,
    screenWidth: number,
    screenHeight: number,
    meters?: readonly MeterConfig[],
    simMeterValues?: readonly { id: string; value: number }[] | Record<string, number>,
    t?: (key: string) => string,
  ): void {
    if (Array.isArray(simMeterValues)) {
      for (const m of simMeterValues) {
        this.currentMeterValues[m.id] = m.value;
      }
    } else if (simMeterValues) {
      Object.assign(this.currentMeterValues, simMeterValues);
    }

    // 1. Update Feedback Message animation
    const activeMsg = this.tracker.getActiveFeedback(time);
    if (activeMsg) {
      if (activeMsg.message.tier === 'big') {
        const b = bannerLayout(screenWidth, screenHeight);
        this.bannerContainer
          .setPosition(b.x, b.y)
          .setAlpha(activeMsg.alpha)
          .setVisible(true);
        if (!this.reducedMotion) {
          this.bannerGlow.setAlpha(activeMsg.alpha * 0.5).setVisible(true);
        }
      } else {
        const posX = this.messageBasePos.x + activeMsg.wobbleX;
        const posY = this.messageBasePos.y + activeMsg.bounceY;
        this.messageContainer
          .setPosition(posX, posY)
          .setAlpha(activeMsg.alpha)
          .setScale(activeMsg.alpha < 0.2 ? 0.8 + activeMsg.alpha : 1)
          .setVisible(true);
      }
    } else {
      this.messageContainer.setVisible(false);
      this.bannerContainer.setVisible(false);
      this.bannerGlow.setVisible(false);
    }

    // 2. Update Particles
    const particles = this.tracker.getParticles(time);
    for (let i = 0; i < this.particlePool.length; i++) {
      const img = this.particlePool[i];
      if (i < particles.length) {
        const p = particles[i];
        img
          .setFrame(p.frame)
          .setPosition(this.lastDogPos.x + p.x, this.lastDogPos.y + p.y)
          .setAlpha(p.alpha)
          .setScale(p.scale)
          .setVisible(true);
      } else {
        img.setVisible(false);
      }
    }

    // 3. Update Flying Points
    const flying = this.tracker.getFlyingPoints(time);
    for (let i = 0; i < this.flyingPool.length; i++) {
      const fItem = this.flyingPool[i];
      if (i < flying.length) {
        const pt = flying[i];
        fItem.container.setPosition(pt.pos.x, pt.pos.y).setAlpha(pt.alpha).setVisible(true);
        fItem.icon.setFrame(pt.icon);
        const pointStr = '+' + String(pt.points);
        fItem.text.setText(pointStr);
      } else {
        fItem.container.setVisible(false);
      }
    }

    // 4. Draw Stage Meters
    this.drawStageMeters(screenWidth, screenHeight, meters, t);
  }

  private drawStageMeters(
    screenWidth: number,
    screenHeight: number,
    meters?: readonly MeterConfig[],
    t?: (key: string) => string,
  ): void {
    if (!meters || meters.length === 0) {
      this.metersGfx.clear();
      this.meterBadges.forEach((b) => b.setVisible(false));
      this.meterLabels.forEach((l) => l.setVisible(false));
      this.meterValues.forEach((v) => v.setVisible(false));
      this.meterStars.forEach((s) => s.setVisible(false));
      return;
    }

    const layouts = stageMetersLayout(screenWidth, screenHeight, meters);
    const g = this.metersGfx;
    g.clear();

    layouts.forEach((layout, i) => {
      if (i >= meters.length) return;
      const meter = meters[i];
      const value = Math.min(meter.target, this.currentMeterValues[meter.id] ?? 0);
      const isFull = value >= meter.target;
      const fillRatio = meter.target > 0 ? value / meter.target : 0;

      // Draw container card/bar
      // Card background
      g.fillStyle(HUD_COLOR_NUM.surface, 0.95);
      g.fillRoundedRect(layout.x, layout.y, layout.width, layout.height, 6);
      g.lineStyle(1, HUD_COLOR_NUM.ink, 0.6);
      g.strokeRoundedRect(layout.x, layout.y, layout.width, layout.height, 6);

      // Sunken bar background
      const barX = layout.bar.x;
      const barY = layout.y + 15;
      const barH = 6;
      const barW = layout.width - 34;
      g.fillStyle(HUD_COLOR_NUM.surfaceSunken, 0.9);
      g.fillRoundedRect(barX, barY, barW, barH, 3);

      // Filled portion
      if (fillRatio > 0) {
        const fillW = Math.max(4, Math.round(barW * fillRatio));
        g.fillStyle(isFull ? HUD_COLOR_NUM.accent : HUD_COLOR_NUM.brand, 1);
        g.fillRoundedRect(barX, barY, fillW, barH, 3);
      }

      // Badge image
      const badgeImg = this.meterBadges[i];
      if (badgeImg) {
        const badgeFrame = meterBadgeFrame(meter.icon, meter.id);
        badgeImg
          .setFrame(badgeFrame)
          .setPosition(layout.badge.x, layout.badge.y)
          .setScale(0.34)
          .setVisible(true);
      }

      // Label text
      const labelText = this.meterLabels[i];
      if (labelText) {
        const label = t ? t(meter.labelKey) : meter.labelKey;
        labelText
          .setText(label)
          .setPosition(layout.bar.x, layout.y + 2)
          .setVisible(true);
      }

      // Full state star
      const starImg = this.meterStars[i];
      if (starImg) {
        if (isFull) {
          starImg
            .setPosition(layout.x + layout.width - 11, layout.y + 8)
            .setScale(0.24)
            .setVisible(true);
        } else {
          starImg.setVisible(false);
        }
      }
    });

    for (let i = meters.length; i < this.meterBadges.length; i++) {
      this.meterBadges[i]?.setVisible(false);
      this.meterLabels[i]?.setVisible(false);
      this.meterValues[i]?.setVisible(false);
      this.meterStars[i]?.setVisible(false);
    }
  }

  /**
   * Tells whether any effect or projectile animation is actively running.
   */
  isActive(time: number): boolean {
    return this.tracker.isActive(time);
  }

  /**
   * Get screen position of a Stage Meter's badge for projectile targeting.
   */
  getMeterPosition(screenWidth: number, screenHeight: number, meterId: string, meters?: readonly MeterConfig[]): Point | null {
    if (!meters || meters.length === 0) return null;
    const layouts = stageMetersLayout(screenWidth, screenHeight, meters);
    const found = layouts.find((l) => l.id === meterId);
    return found ? { x: found.badge.x, y: found.badge.y } : null;
  }
}

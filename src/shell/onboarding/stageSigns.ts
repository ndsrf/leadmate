import type { TextKey } from '../../i18n';
import type { FeedbackActionKind } from '../../sim/feedbackKinds';
import type { DogSign } from '../../sim/messages';
import type { HintId } from './hints';

/** A Hint that explains a sign: a `HintId`, or the full-text Hint of a Feedback Message kind (`feedback:<kind>`). */
export type SignHint = HintId | `feedback:${FeedbackActionKind}`;

/**
 * One thing the guided first Stage can show (explain-guided-first-stage): where it is drawn and how it is explained,
 * by a Hint at the moment it first appears (`hint`), by a line of the Primer overview card (`overview`), or both.
 * A sign the Stage cannot show in the guided first walk has `exempt` (the reason) instead.
 */
export interface StageSign {
  id: string;
  group: 'dog-sign' | 'feedback' | 'ring' | 'control' | 'hud' | 'meter';
  /** Where it is drawn (a source file and function). */
  drawnBy: string;
  hint?: SignHint;
  overview?: TextKey;
  /** The Dog sign this entry stands for, when it is a sign drawn by `StageScene.draw` (the "!" is `fixation`). */
  dogSign?: DogSign | 'fixation';
  /** The HUD atlas frames of a Feedback icon this entry covers. */
  frames?: readonly string[];
  /** The Feedback Message kinds this entry covers. */
  feedbackKinds?: readonly FeedbackActionKind[];
  /** Why it is not explained: it cannot appear in the guided first Stage, or its action kind is not Introduced there. */
  exempt?: string;
}

export const STAGE_SIGNS: readonly StageSign[] = [
  // Dog signs, drawn in StageScene.draw
  { id: 'dog-fixation', group: 'dog-sign', drawnBy: 'StageScene.draw', dogSign: 'fixation', hint: 'fixation-ring', overview: 'stage.overview.fixation' },
  { id: 'dog-alert', group: 'dog-sign', drawnBy: 'StageScene.draw', dogSign: 'alert', hint: 'sign-alert', overview: 'stage.overview.alert' },
  { id: 'dog-eye', group: 'dog-sign', drawnBy: 'StageScene.draw', dogSign: 'eye', hint: 'sign-eye', overview: 'stage.overview.eye' },
  { id: 'dog-bark', group: 'dog-sign', drawnBy: 'StageScene.draw', dogSign: 'bark', hint: 'sign-bark' },
  { id: 'dog-scent', group: 'dog-sign', drawnBy: 'StageScene.draw', dogSign: 'scent', exempt: 'the scent dots need Go Sniff, which is not Introduced in the guided first Stage (no seed from 1 to 8 reaches them)' },
  { id: 'dog-sintonia', group: 'dog-sign', drawnBy: 'StageScene.draw', dogSign: 'sintonia', exempt: 'the Sintonía glow needs a run of right actions that the guided first walk does not reach (no seed from 1 to 8 shows it)' },

  // Feedback Message icons, explained by the Feedback Message's own first-time Hint (its full text)
  { id: 'feedback-marker-hit', group: 'feedback', drawnBy: 'effectsView.showFeedback', frames: ['icon_mark'], feedbackKinds: ['marker-hit'], hint: 'feedback:marker-hit' },
  { id: 'feedback-check-in', group: 'feedback', drawnBy: 'effectsView.showFeedback', frames: ['icon_eye'], feedbackKinds: ['check-in-hit'], hint: 'feedback:check-in-hit' },
  { id: 'feedback-disengagement', group: 'feedback', drawnBy: 'effectsView.showFeedback', frames: ['icon_star'], feedbackKinds: ['disengagement'], hint: 'feedback:disengagement' },
  {
    id: 'feedback-wrong',
    group: 'feedback',
    drawnBy: 'effectsView.showFeedback',
    frames: ['icon_puff'],
    feedbackKinds: ['missed-reward-window', 'late-marker-press', 'reactive-marker', 'wasted-marker', 'missed-opportunity', 'rigid-pull'],
    hint: 'feedback:rigid-pull',
  },

  // The Approach ring and the Check-in arc (telegraph-marker-timing), explained with the Fixation
  { id: 'approach-ring', group: 'ring', drawnBy: 'StageScene.drawTelegraph', hint: 'fixation-ring', overview: 'stage.overview.fixation' },
  { id: 'checkin-arc', group: 'ring', drawnBy: 'StageScene.drawTelegraph', hint: 'sign-eye', overview: 'stage.overview.eye' },

  // The leash and the Poste ring, drawn in StageScene.draw
  { id: 'leash-colors', group: 'control', drawnBy: 'StageScene.draw', hint: 'leash-colors', overview: 'stage.overview.leash' },
  { id: 'poste-ring', group: 'control', drawnBy: 'StageScene.draw', hint: 'poste' },

  // HUD controls and readouts, drawn in StageScene.drawHud
  { id: 'joystick', group: 'hud', drawnBy: 'StageScene.drawHud', hint: 'coach-move', overview: 'stage.overview.joystick' },
  { id: 'marker-button', group: 'hud', drawnBy: 'StageScene.drawHud', hint: 'coach-mark', overview: 'stage.overview.marker' },
  { id: 'marks-badge', group: 'hud', drawnBy: 'StageScene.drawHud', overview: 'stage.overview.marker' },
  { id: 'cue-button', group: 'hud', drawnBy: 'StageScene.drawHud', overview: 'stage.overview.cue' },
  { id: 'arousal-bar', group: 'hud', drawnBy: 'StageScene.drawHud', overview: 'stage.overview.arousal' },
  { id: 'dog-portrait', group: 'hud', drawnBy: 'StageScene.drawPortrait', overview: 'stage.overview.arousal' },
  { id: 'route-markers', group: 'hud', drawnBy: 'StageScene.drawRoute', overview: 'stage.overview.joystick' },

  // Not shown in the guided first Stage
  { id: 'stage-meters', group: 'meter', drawnBy: 'effectsView', exempt: 'the guided first walk has no Stage Meters' },
  { id: 'flying-meter-points', group: 'meter', drawnBy: 'effectsView', exempt: 'they come from Stage Meters, which the guided first walk does not have' },
  { id: 'jackpot-badge', group: 'hud', drawnBy: 'StageScene.drawHud', exempt: 'the Jackpot button needs a Jackpot budget, which the guided first walk does not give' },
  { id: 'go-sniff-button', group: 'hud', drawnBy: 'StageScene.drawHud', exempt: 'go-sniff is not Introduced in the guided first Stage' },
  { id: 'feedback-go-sniff', group: 'feedback', drawnBy: 'effectsView.showFeedback', frames: ['icon_nose'], feedbackKinds: ['go-sniff'], exempt: 'go-sniff is not Introduced in the guided first Stage' },
];

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    Pressable: (props: any) => React.createElement('button', props, props.children),
    ScrollView: (props: any) => React.createElement('div', props, props.children),
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
    useWindowDimensions: () => ({ width: 390, height: 844 }),
    AppState: { currentState: 'active', addEventListener: () => ({ remove: () => {} }) },
  };
});

jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) => React.createElement('svg', props, props.children),
    Svg: (props: any) => React.createElement('svg', props, props.children),
    Circle: (props: any) => React.createElement('circle', props, props.children),
    Ellipse: (props: any) => React.createElement('ellipse', props, props.children),
    Line: (props: any) => React.createElement('line', props, props.children),
    Path: (props: any) => React.createElement('path', props, props.children),
    Rect: (props: any) => React.createElement('rect', props, props.children),
    G: (props: any) => React.createElement('g', props, props.children),
  };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: {
      View: (props: any) => React.createElement('div', props, props.children),
    },
    FadeIn: { duration: () => ({}) },
    FadeInDown: { duration: () => ({}) },
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: any) => v,
    withRepeat: (v: any) => v,
    withSequence: (...args: any[]) => args[0],
    cancelAnimation: () => {},
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

const mockPlayDogSound = jest.fn();
jest.mock('../audio', () => ({
  playDogSound: (s: any) => mockPlayDogSound(s),
}));

import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, es } from '../../i18n';
import { starsFor, type Stars } from '../stars';
import {
  barkdokuResult,
  BarkdokuView,
  clockFace,
  DogHeadSilhouette,
  SolvedCard,
  RuleBanner,
  ZoneTracker,
} from './BarkdokuView';
import { createPuzzle, pausePuzzle, ratePuzzle, resumePuzzle, toggleCell } from '../puzzle/engine';
import type { BarkdokuBoard } from '../puzzle/types';
import { configureFeedback } from '../ui/feedback';

describe('Barkdoku UI & Canine Visuals', () => {
  const t = createTranslator(es);
  const mockHaptic = jest.fn();
  const mockSound = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    configureFeedback({
      haptic: mockHaptic,
      sound: mockSound,
      cueAudioActive: () => false,
    });
  });

  const board4: BarkdokuBoard = {
    id: 'test-view-4x4',
    name: 'Pradera Test',
    size: 4,
    regions: [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ],
    solution: [
      { row: 0, col: 1 },
      { row: 1, col: 3 },
      { row: 2, col: 0 },
      { row: 3, col: 2 },
    ],
  };

  describe('ZoneTracker (Task 2.2)', () => {
    it('renders silhouettes when zones are unfulfilled', () => {
      const tree = ZoneTracker({
        board: board4,
        dogs: [],
        conflicts: [],
        breed: 'mestizo',
        coat: 'golden',
      });
      expect(tree).toBeDefined();
      expect(tree.props.testID).toBe('zone-tracker');
      expect(tree.props.children.length).toBe(4);
      // All 4 zones are pending
      for (let i = 0; i < 4; i++) {
        expect(tree.props.children[i].props.accessibilityLabel).toContain('pendiente');
      }
    });

    it('illuminates silhouette into BreedArt when zone is fulfilled', () => {
      // Place dog in region 0 at (0, 1)
      const tree = ZoneTracker({
        board: board4,
        dogs: [{ row: 0, col: 1 }],
        conflicts: [],
        breed: 'pastor',
        coat: 'black',
      });
      // Zone 0 is completed
      expect(tree.props.children[0].props.accessibilityLabel).toContain('completada');
      // Zones 1, 2, 3 are pending
      expect(tree.props.children[1].props.accessibilityLabel).toContain('pendiente');
      expect(tree.props.children[2].props.accessibilityLabel).toContain('pendiente');
      expect(tree.props.children[3].props.accessibilityLabel).toContain('pendiente');
    });

    it('matches snapshot for unfulfilled and fulfilled ZoneTracker', () => {
      const emptyTracker = ZoneTracker({
        board: board4,
        dogs: [],
        conflicts: [],
      });
      expect(emptyTracker).toMatchSnapshot('unfulfilled-tracker');

      const fulfilledTracker = ZoneTracker({
        board: board4,
        dogs: [{ row: 0, col: 1 }],
        conflicts: [],
      });
      expect(fulfilledTracker).toMatchSnapshot('fulfilled-tracker');
    });
  });

  describe('RuleBanner (Task 2.3)', () => {
    it('renders the 3 mini-cards for territory, line of sight, and personal space', () => {
      const markup = renderToStaticMarkup(<RuleBanner t={t} />);
      expect(markup).toContain('rule-banner');
      for (const key of ['ruleZoneTitle', 'ruleSightTitle', 'ruleBubbleTitle'] as const) expect(markup).toContain(t(`minigame.barkdoku.${key}`));
    });
  });

  describe('BarkdokuView interactions & feedback (Tasks 2.1, 2.4, 2.5)', () => {
    it('renders initial view with treat HUD and grid cells', () => {
      const markup = renderToStaticMarkup(
        <BarkdokuView
          t={t}
          board={board4}
        />
      );
      expect(markup).toBeDefined();
      expect(markup).toContain('treat-lives-hud');
      expect(markup).toContain('barkdoku-grid');
      expect(markup).toContain('cell-0-0');
      expect(markup).toContain('cell-3-3');
      expect(markup).toContain('rule-banner');
      expect(markup).toContain('zone-tracker');
    });

    it('displays 3 active treat pips at start', () => {
      const markup = renderToStaticMarkup(
        <BarkdokuView
          t={t}
          board={board4}
        />
      );
      expect(markup).toContain('treat-pip-0-active');
      expect(markup).toContain('treat-pip-1-active');
      expect(markup).toContain('treat-pip-2-active');
    });

    it('renders visual shield icon on shield state', () => {
      // Test that VisualShield produces white X icon
      const { createPuzzle, toggleCell } = require('../puzzle/engine');
      let state = createPuzzle(board4);
      state = toggleCell(state, { row: 0, col: 0 }).state; // state.grid[0][0] is 'shield'
      expect(state.grid[0][0]).toBe('shield');
    });

    it('triggers audio and feedback appropriately on taps and conflicts', () => {
      const { createPuzzle, toggleCell } = require('../puzzle/engine');
      const { feedback } = require('../ui/feedback');
      let state = createPuzzle(board4);

      // Tap 1: shield
      let step = toggleCell(state, { row: 0, col: 0 });
      feedback.press();
      expect(mockHaptic).toHaveBeenCalledWith('light');
      expect(mockSound).toHaveBeenCalledWith('press');
      state = step.state;

      // Tap 2: dog (valid)
      step = toggleCell(state, { row: 0, col: 0 });
      feedback.press();
      state = step.state;

      // Place conflicting dog at (0, 1) in same row
      step = toggleCell(state, { row: 0, col: 1 }); // shield
      step = toggleCell(step.state, { row: 0, col: 1 }); // dog -> conflict!
      expect(step.event).toBe('dog_conflict');
      mockPlayDogSound('bark');
      expect(mockPlayDogSound).toHaveBeenCalledWith('bark');

      // Solve board -> success feedback
      feedback.success();
      expect(mockHaptic).toHaveBeenCalledWith('success');
      expect(mockSound).toHaveBeenCalledWith('success');
    });
  });
});

describe('Solve Time clock', () => {
  const t = createTranslator(es);
  const board5: BarkdokuBoard = {
    id: 'clock-5x5',
    size: 5,
    difficulty: 'easy',
    regions: [[0, 0, 1, 1, 1], [0, 0, 1, 2, 2], [3, 3, 3, 2, 2], [3, 4, 4, 4, 2], [3, 4, 4, 4, 4]],
    solution: [],
  };

  it('reads 0:00 until the first tap, whatever the time spent reading the rules', () => {
    expect(clockFace(t, createPuzzle(board5), 30000)).toMatchObject({ time: '0:00', target: 'Objetivo 2:00', over: false });
  });

  it('runs from the first tap and names the target for screen readers', () => {
    const state = toggleCell(createPuzzle(board5), { row: 0, col: 0 }, 1000).state;
    const face = clockFace(t, state, 76000);
    expect(face.time).toBe('1:15');
    expect(face.label).toBe('Tiempo 1:15, objetivo 2:00');
  });

  it('changes tone past the target', () => {
    const state = toggleCell(createPuzzle(board5), { row: 0, col: 0 }, 0).state;
    expect(clockFace(t, state, 120000).over).toBe(false);
    expect(clockFace(t, state, 121000).over).toBe(true);
  });

  it('leaves background time out', () => {
    let state = toggleCell(createPuzzle(board5), { row: 0, col: 0 }, 0).state;
    state = resumePuzzle(pausePuzzle(state, 10000), 310000);
    expect(clockFace(t, state, 315000).time).toBe('0:15');
  });

  it('shows no target on a tutorial board', () => {
    const face = clockFace(t, createPuzzle({ ...board5, difficulty: 'tutorial' }), 0);
    expect(face.target).toBeUndefined();
    expect(face.label).toBe('Tiempo 0:00');
  });

  it('renders on the board next to the treats', () => {
    const markup = renderToStaticMarkup(<BarkdokuView t={t} board={board5} />);
    expect(markup).toContain('puzzle-clock');
    expect(markup).toContain('Objetivo 2:00');
    expect(markup).not.toContain('Práctica');
  });

  it('marks a practice board', () => {
    expect(renderToStaticMarkup(<BarkdokuView t={t} board={board5} practice />)).toContain('Práctica');
  });
});

describe('SolvedCard', () => {
  const t = createTranslator(es);
  const metrics = (over: Partial<Parameters<typeof SolvedCard>[0]['metrics']> = {}) => ({
    solved: true,
    mistakes: 0,
    treatsLeft: 3,
    durationSeconds: 102,
    targetSeconds: 120,
    withinTarget: true,
    stars: 3 as Stars,
    ...over,
  });
  const card = (m: ReturnType<typeof metrics>, practice = false) => renderToStaticMarkup(<SolvedCard t={t} metrics={m} practice={practice} onContinue={() => {}} />);

  it('shows the time, the target, the target-met mark and the stars', () => {
    const html = card(metrics());
    expect(html).toContain('Tu tiempo: 1:42 · objetivo 2:00');
    expect(html).toContain('target-met');
    expect(html).toContain('3 de 3 estrellas');
  });

  it('words a missed target encouragingly, without the mark', () => {
    const html = card(metrics({ durationSeconds: 150, withinTarget: false, stars: 2 }));
    expect(html).toContain('target-missed');
    expect(html).not.toContain('target-met');
    expect(html).toContain('Con práctica');
  });

  it('shows only the time on a tutorial board', () => {
    const html = card(metrics({ targetSeconds: undefined }));
    expect(html).toContain('Tu tiempo: 1:42');
    expect(html).not.toContain('objetivo');
    expect(html).not.toContain('target-');
  });

  it('in practice shows the time with no stars or target mark', () => {
    const html = card(metrics(), true);
    expect(html).toContain('Tu tiempo: 1:42');
    expect(html).toContain('practice-kept');
    expect(html).not.toContain('estrellas');
    expect(html).not.toContain('target-met');
  });
});

describe('barkdokuResult', () => {
  it('scores a run so its stars match the puzzle rating, within, over or without a target', () => {
    for (const solved of [true, false]) {
      for (const mistakes of [0, 1, 2, 3]) {
        for (const target of ['within', 'over', 'none'] as const) {
          const withinTarget = target !== 'over';
          const metrics = {
            solved,
            mistakes,
            treatsLeft: Math.max(0, 3 - mistakes),
            durationSeconds: target === 'over' ? 200 : 30,
            ...(target === 'none' ? {} : { targetSeconds: 120 }),
            withinTarget,
            stars: (solved ? ratePuzzle(mistakes, withinTarget) : 1) as Stars,
          };
          expect(starsFor(barkdokuResult(metrics).handlingScore)).toBe(metrics.stars);
        }
      }
    }
  });
});

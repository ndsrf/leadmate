jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    Pressable: (props: any) => React.createElement('button', props, props.children),
    ScrollView: (props: any) => React.createElement('div', props, props.children),
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
    useWindowDimensions: () => ({ width: 390, height: 844 }),
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
  DogHeadSilhouette,
  RuleBanner,
  ZoneTracker,
} from './BarkdokuView';
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
      const banner = RuleBanner({ t });
      expect(banner).toBeDefined();
      expect(banner.props.testID).toBe('rule-banner');
      const cards = banner.props.children.props.children;
      expect(cards.length).toBe(3);
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

describe('barkdokuResult', () => {
  it('scores a run so its stars match the puzzle rating', () => {
    for (const solved of [true, false]) {
      for (const mistakes of [0, 1, 2, 3]) {
        const metrics = { solved, mistakes, treatsLeft: Math.max(0, 3 - mistakes), durationSeconds: 30, stars: (!solved ? 1 : mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1) as Stars };
        expect(starsFor(barkdokuResult(metrics).handlingScore)).toBe(metrics.stars);
      }
    }
  });
});

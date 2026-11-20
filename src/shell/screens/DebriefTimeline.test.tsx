import React from 'react';
import * as fs from 'fs';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { createTranslator, es, en } from '../../i18n';
import type { TimelineEntry } from '../../sim/scentWalk';
import type { SimulationDebriefPayload } from '../../sim/payload';
import * as path from 'path';
import { defaultScenario, type ScenarioConfig } from '../../sim/config';
import { buildPayload } from '../../sim/payload';
import { createState, noInput, tick } from '../../sim/sim';
import { introducedKinds } from '../introductions';
import { loadPackFromDisk } from '../content/loader';
import { resolvePack } from '../content/resolver';
import { payloadWith } from '../testPayload';
import { DebriefTimelineSection } from './DebriefTimeline';
import { DebriefScreen } from './NodeScreens';
import { startNode, type NodeDef, type NodeRun } from '../nodes/node';
import { paletteVariables } from '../ui/theme';

const mockPressables: any[] = [];

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => {
      const { style, ...rest } = props;
      const flat = Array.isArray(style) ? Object.assign({}, ...style.flat(Infinity).filter(Boolean)) : style;
      return React.createElement('div', { ...rest, style: flat }, props.children);
    },
    Text: (props: any) => {
      const { style, ...rest } = props;
      const flat = Array.isArray(style) ? Object.assign({}, ...style.flat(Infinity).filter(Boolean)) : { ...style };
      if (typeof flat.lineHeight === 'number' && flat.lineHeight > 3) {
        flat.lineHeight = `${flat.lineHeight}px`;
      }
      return React.createElement('span', { ...rest, style: flat }, props.children);
    },
    Pressable: (props: any) => {
      mockPressables.push(props);
      const { style, ...rest } = props;
      const resolvedStyle = typeof style === 'function' ? style({ pressed: false }) : style;
      const body = typeof props.children === 'function' ? props.children({ pressed: false }) : props.children;
      return React.createElement('button', { ...rest, style: resolvedStyle }, body);
    },
    ScrollView: (props: any) => React.createElement('div', props, props.children),
    Platform: { OS: 'web' },
  };
});

jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) => React.createElement('svg', props, props.children),
    Svg: (props: any) => React.createElement('svg', props, props.children),
    Path: (props: any) => React.createElement('path', props, props.children),
    Rect: (props: any) => React.createElement('rect', props, props.children),
    Circle: (props: any) => React.createElement('circle', props, props.children),
    Ellipse: (props: any) => React.createElement('ellipse', props, props.children),
    Polygon: (props: any) => React.createElement('polygon', props, props.children),
    G: (props: any) => React.createElement('g', props, props.children),
    Line: (props: any) => React.createElement('line', props, props.children),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('expo', () => ({ useEvent: () => ({ status: 'idle' }), useEventListener: () => {} }));
jest.mock('expo-video', () => ({ VideoView: () => null, useVideoPlayer: () => ({}) }));

jest.mock('../ui/useReveal', () => ({
  useReveal: (target: any) => ({
    state: {
      phase: 'done',
      elapsed: 2000,
      scoreShown: target.score,
      starsShown: target.stars,
      target,
    },
    skip: () => {},
  }),
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: {
      View: (props: any) => React.createElement('div', props, props.children),
    },
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: any) => v,
    cancelAnimation: () => {},
    Easing: {
      linear: () => {},
      bezier: () => () => {},
    },
    FadeIn: { duration: () => ({}) },
    FadeInDown: { duration: () => ({}) },
  };
});

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const realConsoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const msg = String(args[0]);
    if (msg.includes('react-test-renderer is deprecated') || msg.includes('not wrapped in act')) return;
    realConsoleError(...args);
  });
});

afterAll(() => {
  (console.error as any).mockRestore?.();
});

describe('DebriefTimelineSection component', () => {
  const t = createTranslator(es);
  const tEn = createTranslator(en);

  const fixtureTimeline: TimelineEntry[] = [
    { t: 4.2, kind: 'granted-sniff', polarity: 'right' },
    { t: 12.0, kind: 'food-eaten', polarity: 'wrong' },
    { t: 18.5, kind: 'chain', polarity: 'right' },
    { t: 25.0, kind: 'waited-plant', polarity: 'right' },
  ];

  const fixturePayload: SimulationDebriefPayload = payloadWith({
    durationSeconds: 30,
    handlingScore: 850,
    scentWalk: {
      sniffsGranted: 1,
      sniffsEmpty: 0,
      scentsDraggedPast: 0,
      plantsWaited: 1,
      plantsDragged: 0,
      markingsWaited: 0,
      markingsInterrupted: 0,
      foodEaten: 1,
      foodLeft: 0,
      freshMoves: 2,
      repeatedMoves: 0,
      chains: 1,
      jackpotsSmart: 0,
      jackpotsWasted: 0,
    },
    timeline: fixtureTimeline,
  });

  beforeEach(() => {
    mockPressables.length = 0;
  });

  it('renders the timeline strip and moments with accessible buttons', () => {
    let root: any;
    act(() => {
      root = ReactTestRenderer.create(<DebriefTimelineSection t={t} payload={fixturePayload} />);
    });

    const tree = root.toJSON();
    expect(tree).toBeDefined();

    // Moment buttons should be rendered
    const momentButtons = root.root.findAll((node: any) => node.type === 'button' && node.props['data-moment-index'] !== undefined);
    expect(momentButtons.length).toBe(fixtureTimeline.length);

    // Each button should have an accessible label
    for (let i = 0; i < fixtureTimeline.length; i++) {
      const btn = momentButtons[i];
      const entry = fixtureTimeline[i];
      expect(btn.props.accessibilityLabel).toContain(String(entry.t));
      expect(btn.props.accessibilityLabel).toContain(t(`feedback.${entry.kind}.short`));
    }
  });

  it('uses distinct shapes and polarity colors for right vs wrong moments', () => {
    let root: any;
    act(() => {
      root = ReactTestRenderer.create(<DebriefTimelineSection t={t} payload={fixturePayload} />);
    });

    const rightButton = root.root.find((node: any) => node.type === 'button' && node.props['data-moment-index'] === 0);
    const wrongButton = root.root.find((node: any) => node.type === 'button' && node.props['data-moment-index'] === 1);

    expect(rightButton.props['data-polarity']).toBe('right');
    expect(wrongButton.props['data-polarity']).toBe('wrong');

    // Right moment uses circle shape; wrong moment uses diamond/polygon shape
    expect(rightButton.props['data-shape']).toBe('circle');
    expect(wrongButton.props['data-shape']).toBe('diamond');
  });

  it('tapping a moment shows its short feedback message text and time', () => {
    let root: any;
    act(() => {
      root = ReactTestRenderer.create(<DebriefTimelineSection t={t} payload={fixturePayload} />);
    });

    // Before tapping, find the wrong moment button (moment index 1 = food-eaten)
    const wrongButton = root.root.find((node: any) => node.type === 'button' && node.props['data-moment-index'] === 1);

    act(() => {
      wrongButton.props.onPress();
    });

    // Now it must show the time and short feedback message for food-eaten
    const messageNode = root.root.find((node: any) => node.type === 'span' && node.props.testID === 'timeline-selected-message');
    expect(messageNode).toBeDefined();
    // In Spanish: 'Se la comió. Di Déjalo antes.' (includes what to try instead)
    expect(messageNode.props.children).toBe(t('feedback.food-eaten.short'));

    const timeNode = root.root.find((node: any) => node.type === 'span' && node.props.testID === 'timeline-selected-time');
    expect(timeNode.props.children).toContain('12');
  });

  it('displays "Done well" (up to two) and "Try next" (one) from summarizeScentWalk', () => {
    let root: any;
    act(() => {
      root = ReactTestRenderer.create(<DebriefTimelineSection t={t} payload={fixturePayload} />);
    });

    // In fixturePayload:
    // chains: 1, plantsWaited: 1, foodEaten: 1
    // RIGHT_PRIORITY: chain, waited-plant -> doneWell has ['chain', 'waited-plant']
    // WRONG_PRIORITY: food-eaten -> tryNext has ['food-eaten']
    const doneWellNodes = root.root.findAll((node: any) => node.type === 'div' && typeof node.props.testID === 'string' && node.props.testID.startsWith('debrief-done-well-'));
    expect(doneWellNodes.length).toBe(2);

    const tryNextNode = root.root.find((node: any) => node.type === 'div' && node.props.testID === 'debrief-try-next');
    expect(tryNextNode).toBeDefined();
  });

  it('works in English locale', () => {
    let root: any;
    act(() => {
      root = ReactTestRenderer.create(<DebriefTimelineSection t={tEn} payload={fixturePayload} />);
    });

    const wrongButton = root.root.find((node: any) => node.type === 'button' && node.props['data-moment-index'] === 1);
    act(() => {
      wrongButton.props.onPress();
    });

    const messageNode = root.root.find((node: any) => node.type === 'span' && node.props.testID === 'timeline-selected-message');
    expect(messageNode.props.children).toBe(tEn('feedback.food-eaten.short'));
  });

  it('handles an empty timeline gracefully', () => {
    const emptyPayload = { ...fixturePayload, timeline: [] };
    let root: any;
    act(() => {
      root = ReactTestRenderer.create(<DebriefTimelineSection t={t} payload={emptyPayload} />);
    });

    const emptyNote = root.root.find((node: any) => node.props.testID === 'timeline-empty-note');
    expect(emptyNote).toBeDefined();
    expect(emptyNote.props.children).toBe(t('debrief.timeline.empty'));
  });

  it('generates HTML evidence for playwright capture', () => {
    const scentPayload = payloadWith({
      durationSeconds: 60,
      handlingScore: 820,
      slackPercentage: 82,
      tautPercentage: 14,
      pullPercentage: 4,
      markerHits: 6,
      checkInHits: 5,
      followMarks: 3,
      goSniffs: 3,
      scentWalk: {
        sniffsGranted: 3,
        sniffsEmpty: 1,
        scentsDraggedPast: 1,
        plantsWaited: 2,
        plantsDragged: 0,
        markingsWaited: 1,
        markingsInterrupted: 0,
        foodEaten: 0,
        foodLeft: 1,
        freshMoves: 4,
        repeatedMoves: 1,
        chains: 2,
        jackpotsSmart: 1,
        jackpotsWasted: 0,
      },
      timeline: [
        { t: 4.5, kind: 'granted-sniff', polarity: 'right' },
        { t: 12.0, kind: 'fresh-move', polarity: 'right' },
        { t: 18.2, kind: 'repeated-move-ignored', polarity: 'wrong' },
        { t: 26.0, kind: 'chain', polarity: 'right' },
        { t: 34.5, kind: 'waited-plant', polarity: 'right' },
        { t: 43.0, kind: 'scent-dragged-past', polarity: 'wrong' },
        { t: 52.0, kind: 'smart-jackpot', polarity: 'right' },
      ],
    });

    const sampleNode: NodeDef = {
      id: 'park-nose-on',
      mode: 'stage',
      title: 'node.title' as any,
      primerCards: [],
      checkpoint: [],
      exercises: [{ metric: 'tension', key: 'exercise.test' as any }],
      prerequisites: [],
      simulation: {
        scenario: { id: 'park-nose-on', world: 6 } as any,
      },
    };

    const run: NodeRun = {
      ...startNode(sampleNode),
      step: 'debrief',
      result: { kind: 'stage', payload: scentPayload },
    };

    const markup = renderToStaticMarkup(
      <DebriefScreen
        t={t}
        run={run}
        showPosteLink={false}
        onPosteLink={() => {}}
        onDone={() => {}}
        onPlayAgain={() => {}}
        best={2}
        celebrations={[]}
      />
    );

    let tailwindCss = '';
    try {
      tailwindCss = fs.readFileSync('/tmp/tailwind.css', 'utf8');
    } catch {}

    const vars = paletteVariables('light');
    const cssVars = Object.entries(vars).map(([k, v]) => `${k}: ${v};`).join('\n');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Debrief Scent Walk Replay</title>
  <style>
    ${tailwindCss}
    :root {
      ${cssVars}
    }
    * { box-sizing: border-box; }
    div, span, button {
      position: relative;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }
    .flex-row {
      flex-direction: row !important;
    }
    .items-center {
      align-items: center !important;
    }
    .justify-between {
      justify-content: space-between !important;
    }
    .justify-center {
      justify-content: center !important;
    }
    body {
      background-color: rgb(var(--c-bg));
      color: rgb(var(--c-ink));
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 16px;
      display: flex;
      justify-content: center;
    }
    .container {
      width: 360px;
      max-width: 100%;
      position: relative;
    }
    .absolute.inset-0 {
      position: relative !important;
      inset: auto !important;
    }
    button {
      background: none;
      border: none;
      padding: 0;
      font: inherit;
      cursor: pointer;
      text-align: inherit;
    }
  </style>
</head>
<body>
  <div class="container">
    ${markup}
  </div>
</body>
</html>`;

    fs.writeFileSync('/tmp/debrief_evidence.html', html, 'utf8');
    expect(fs.existsSync('/tmp/debrief_evidence.html')).toBe(true);
  });
});

describe('DebriefTimelineSection Introduced filter', () => {
  const t = createTranslator(es);

  // a real seeded park-nose-on Stage, with a followed-turn moment added to its timeline
  const beta = resolvePack(loadPackFromDisk(path.join(__dirname, '../../../content/beta')), 'es');
  const setFor = (nodeId: string) => introducedKinds({ kind: 'node', nodeId }, beta.worlds, beta.nodes);
  const parkNoseOn = beta.nodes.find((n) => n.id === 'park-nose-on')!;
  const config: ScenarioConfig = { ...defaultScenario, ...parkNoseOn.simulation.scenario };
  const sim = createState(7, config);
  for (let i = 0; i < 200; i++) tick(sim, noInput, config.fixedStep);
  const base = buildPayload(sim);
  const timeline: TimelineEntry[] = [
    { t: 3, kind: 'check-in-hit', polarity: 'right' },
    { t: 9, kind: 'followed-turn', polarity: 'right' },
    { t: 15, kind: 'granted-sniff', polarity: 'right' },
  ];
  const payload: SimulationDebriefPayload = { ...base, durationSeconds: 30, timeline };
  const render = (introducedKinds?: readonly string[]) => {
    let root: any;
    act(() => {
      root = ReactTestRenderer.create(<DebriefTimelineSection t={t} payload={payload} introducedKinds={introducedKinds} />);
    });
    return root.root.findAll((n: any) => n.type === 'button' && n.props['data-moment-index'] !== undefined);
  };

  it("park-nose-on's Introduced set has granted-sniff but not followed-turn", () => {
    const set = setFor('park-nose-on');
    expect(set).toContain('granted-sniff');
    expect(set).not.toContain('followed-turn');
  });

  it('hides the followed-turn moment of a park-nose-on payload, leaving the payload untouched', () => {
    const buttons = render(setFor('park-nose-on'));
    expect(buttons).toHaveLength(2);
    expect(buttons.map((b: any) => b.props.accessibilityLabel).join('|')).not.toContain(t('feedback.followed-turn.short'));
    expect(payload.timeline).toHaveLength(3);
  });

  it('shows every moment when the set is absent', () => {
    expect(render()).toHaveLength(3);
  });

  it('shows the moment once it is Introduced (park-unpredictable)', () => {
    expect(render(setFor('park-unpredictable'))).toHaveLength(3);
  });
});

const mockPressables: any[] = [];

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    Pressable: (props: any) => {
      mockPressables.push(props);
      return React.createElement(
        'button',
        props,
        typeof props.children === 'function'
          ? props.children({ pressed: false })
          : props.children,
      );
    },
    ScrollView: (props: any) => React.createElement('div', props, props.children),
    AppState: {
      currentState: 'active',
      addEventListener: () => ({ remove: () => {} }),
    },
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

import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, es } from '../../i18n';
import { BarkdokuChip, PlusChip, TrialStatusModal, WorldMapScreen } from './WorldMapScreen';
import { NO_STREAK } from '../streak';
import { findWorld, progressOf, stopsOf, worldTitle, type Progress, type Stop, type WorldDef } from '../world';
import { LESSONS } from '../lessons/content';

describe('WorldMapScreen - Daily Barkdoku chip', () => {
  const t = createTranslator(es);
  const mockOnBarkdoku = jest.fn();
  const mockOnDaily = jest.fn();

  it('renders map header with the Guaudoku daily chip', () => {
    const markup = renderToStaticMarkup(
      <WorldMapScreen
        t={t}
        progress={progressOf([])}
        stars={{}}
        now={new Date('2026-10-28T09:00:00')}
        streak={NO_STREAK}
        today="2026-10-28"
        dailyBest={undefined}
        rustyPrompt={false}
        rusty={false}
        skippedWarmup={false}
        onWarmup={() => {}}
        onSkipWarmup={() => {}}
        onDaily={mockOnDaily}
        onBarkdoku={mockOnBarkdoku}
        onOpenStop={() => {}}
        onSettings={() => {}}
      />
    );

    expect(markup).toBeDefined();
    expect(markup).toContain(es['map.barkdoku.daily']);
    expect(markup).toContain(es['map.barkdoku.dailyHelp']);
  });

  it('wires onBarkdoku callback for navigation', () => {
    const element = (
      <WorldMapScreen
        t={t}
        progress={progressOf([])}
        stars={{}}
        now={new Date('2026-10-28T09:00:00')}
        streak={NO_STREAK}
        today="2026-10-28"
        dailyBest={undefined}
        rustyPrompt={false}
        rusty={false}
        skippedWarmup={false}
        onWarmup={() => {}}
        onSkipWarmup={() => {}}
        onDaily={mockOnDaily}
        onBarkdoku={mockOnBarkdoku}
        onOpenStop={() => {}}
        onSettings={() => {}}
      />
    );

    expect(element.props.onBarkdoku).toBe(mockOnBarkdoku);
    element.props.onBarkdoku();
    expect(mockOnBarkdoku).toHaveBeenCalled();
  });
});

describe('WorldMapScreen - Trail Scenery Integration (Task 4.2 & 4.3)', () => {
  const t = createTranslator(es);

  it('renders Trail Scenery and Top Landmarks in active world blocks', () => {
    const markup = renderToStaticMarkup(
      <WorldMapScreen
        t={t}
        progress={progressOf([])}
        stars={{}}
        now={new Date('2026-10-28T09:00:00')}
        streak={NO_STREAK}
        today="2026-10-28"
        dailyBest={undefined}
        rustyPrompt={false}
        rusty={false}
        skippedWarmup={false}
        onWarmup={() => {}}
        onSkipWarmup={() => {}}
        onDaily={() => {}}
        onBarkdoku={() => {}}
        onOpenStop={() => {}}
        onSettings={() => {}}
      />
    );

    // World 1 active block contains Trail Scenery, environmental backdrop, and World 1 landmark
    expect(markup).toContain('testID="world-scenery-background"');
    expect(markup).toContain('testID="environmental-backdrop"');
    expect(markup).toContain('testID="environmental-backdrop-home"');
    expect(markup).toContain('testID="top-landmark-home"');
    // Middle row margin scenery
    expect(markup).toContain('testID="margin-scenery"');
    expect(markup).toContain('testID="margin-row-1"');
  });

  it('omits Trail Scenery in collapsed locked worlds', () => {
    const markup = renderToStaticMarkup(
      <WorldMapScreen
        t={t}
        progress={progressOf([])}
        stars={{}}
        now={new Date('2026-10-28T09:00:00')}
        streak={NO_STREAK}
        today="2026-10-28"
        dailyBest={undefined}
        rustyPrompt={false}
        rusty={false}
        skippedWarmup={false}
        onWarmup={() => {}}
        onSkipWarmup={() => {}}
        onDaily={() => {}}
        onBarkdoku={() => {}}
        onOpenStop={() => {}}
        onSettings={() => {}}
      />
    );

    // World 3 & World 4 are collapsed when progress is empty, so their Top Landmarks and backdrops are omitted
    expect(markup).not.toContain('testID="top-landmark-urban"');
    expect(markup).not.toContain('testID="top-landmark-park"');
    expect(markup).not.toContain('testID="environmental-backdrop-urban"');
    expect(markup).not.toContain('testID="environmental-backdrop-park"');
  });

  it('re-exports HouseLandmark for backward compatibility', () => {
    const { HouseLandmark } = require('./WorldMapScreen');
    expect(HouseLandmark).toBeDefined();
    const markup = renderToStaticMarkup(<HouseLandmark />);
    expect(markup).toContain('top-landmark-home');
  });
});

describe('WorldMapScreen - Settings gear', () => {
  const t = createTranslator(es);

  it('shows Settings as a labelled gear button with no visible text, and opens Settings', () => {
    const onSettings = jest.fn();
    mockPressables.length = 0;
    const markup = renderToStaticMarkup(
      <WorldMapScreen
        t={t}
        progress={progressOf([])}
        stars={{}}
        now={new Date('2026-10-28T09:00:00')}
        streak={NO_STREAK}
        today="2026-10-28"
        dailyBest={undefined}
        rustyPrompt={false}
        rusty={false}
        skippedWarmup={false}
        onWarmup={() => {}}
        onSkipWarmup={() => {}}
        onDaily={() => {}}
        onBarkdoku={() => {}}
        onOpenStop={() => {}}
        onSettings={onSettings}
      />
    );

    expect(markup).not.toContain(`>${es['map.settings']}<`);
    const gear = mockPressables.filter((p) => p.accessibilityLabel === es['map.settings']);
    expect(gear).toHaveLength(1);
    expect(gear[0].accessibilityRole).toBe('button');
    gear[0].onPress();
    expect(onSettings).toHaveBeenCalledTimes(1);
  });
});

describe('WorldMapScreen - Map Header', () => {
  const t = createTranslator(es);

  const renderHeader = () => {
    mockPressables.length = 0;
    renderToStaticMarkup(
      <WorldMapScreen
        t={t}
        progress={progressOf([])}
        stars={{}}
        now={new Date('2026-10-28T09:00:00')}
        streak={NO_STREAK}
        today="2026-10-28"
        dailyBest={undefined}
        rustyPrompt={false}
        rusty={false}
        skippedWarmup={false}
        onWarmup={() => {}}
        onSkipWarmup={() => {}}
        onDaily={() => {}}
        onBarkdoku={() => {}}
        onOpenStop={() => {}}
        onSettings={() => {}}
        onLibrary={() => {}}
        onDiary={() => {}}
      />
    );
    return mockPressables.map((p) => String(p.accessibilityLabel ?? ''));
  };

  it('shows Streak, Library, Plus, gear, Daily and Guaudoku in that order with nothing between them', () => {
    const labels = renderHeader();
    const start = labels.findIndex((l) => l.startsWith(es['streak.flame']));
    expect(start).toBeGreaterThanOrEqual(0);
    expect(labels[start]).toContain(es['diary.chip']);
    expect(labels[start + 1]).toBe(es['library.chip']);
    expect(labels[start + 2]).toBe('Plus. 7 días gratis');
    expect(labels[start + 3]).toBe(es['map.settings']);
    expect(labels[start + 4]).toBe(es['daily.title']);
    expect(labels[start + 5].startsWith(es['map.barkdoku.daily'])).toBe(true);
  });

  it('has no Diario chip: only the Streak chip mentions the Diary', () => {
    const labels = renderHeader();
    expect(labels.filter((l) => l === es['diary.chip'])).toHaveLength(0);
    const diary = labels.filter((l) => l.includes(es['diary.chip']));
    expect(diary).toHaveLength(1);
    expect(diary[0].startsWith(es['streak.flame'])).toBe(true);
  });
});

describe('BarkdokuChip', () => {
  const t = createTranslator(es);
  const chip = (solve?: { seconds: number; at: string; targetSeconds?: number }) => renderToStaticMarkup(<BarkdokuChip t={t} solve={solve} onPress={() => {}} />);

  it('shows a highlighted new state before the first solve', () => {
    const html = chip();
    expect(html).toContain('Guaudoku');
    expect(html).toContain(es['map.dailyNew']);
  });

  it('shows the Daily Solve Time against the target, marked when met', () => {
    const html = chip({ seconds: 102, at: '2026-10-28T09:00:00.000Z', targetSeconds: 120 });
    expect(html).toContain('1:42 / 2:00 ✓');
    expect(html).toContain('Tiempo 1:42, objetivo 2:00. ¡Objetivo cumplido!');
  });

  it('leaves the mark off when over the target', () => {
    const html = chip({ seconds: 150, at: '2026-10-28T09:00:00.000Z', targetSeconds: 120 });
    expect(html).toContain('2:30 / 2:00');
    expect(html).not.toContain('✓');
    expect(html).not.toContain(es['map.dailyNew']);
  });
});

describe('WorldMapScreen - Completed Worlds', () => {
  const t = createTranslator(es);
  const passed = { target: 'full' as const, skipRun: 0, attempts: [], startedAt: '2026-10-01T09:00:00.000Z', passedOn: '2026-10-02' };
  const skipped = { target: 'full' as const, skipRun: 0, attempts: [], startedAt: '2026-10-27T09:00:00.000Z', skippedAt: '2026-10-27T09:00:00.000Z' };
  /** Every Stop of the given Worlds done, the way a user who finished them has it. */
  const done = (ids: string[], missions: Record<string, object> = {}) => {
    const stops = ids.flatMap((id) => stopsOf(findWorld(id)!));
    return progressOf(stops.filter((s) => s.kind === 'node').map((s) => s.id), {
      readLessons: stops.filter((s) => s.kind === 'lesson').map((s) => s.id),
      missions: { ...Object.fromEntries(stops.filter((s) => s.kind === 'mission').map((s) => [s.id, passed])), ...missions } as Progress['missions'],
    });
  };
  const basicsDone = done(['basics']);
  const render = (props: Partial<React.ComponentProps<typeof WorldMapScreen>> = {}) => {
    mockPressables.length = 0;
    return renderToStaticMarkup(
      <WorldMapScreen
        t={t}
        progress={basicsDone}
        stars={{}}
        now={new Date('2026-10-28T09:00:00')}
        streak={NO_STREAK}
        today="2026-10-28"
        dailyBest={undefined}
        rustyPrompt={false}
        rusty={false}
        skippedWarmup={false}
        onWarmup={() => {}}
        onSkipWarmup={() => {}}
        onDaily={() => {}}
        onOpenStop={() => {}}
        onSettings={() => {}}
        {...props}
      />,
    );
  };
  const basics = findWorld('basics')!;
  const basicsTitle = worldTitle(basics, t);
  const count = stopsOf(basics).length;
  const label = (expanded: boolean) => `${basicsTitle}. ${es['map.worldCompleted']}. ${expanded ? es['map.hideStops'] : es['map.showStops']}`;
  const firstStop = (world: string) => t(LESSONS.find((l) => l.id === stopsOf(findWorld(world)!)[0].id)!.title);

  it('folds a Completed World to a header row with its count and no trail or scenery', () => {
    const markup = render();
    const header = mockPressables.filter((p) => p.accessibilityLabel === label(false));
    expect(header).toHaveLength(1);
    expect(header[0].accessibilityRole).toBe('button');
    expect(header[0].accessibilityState).toEqual({ expanded: false });
    expect(markup).toContain(`${count} de ${count} paradas`);
    expect(markup).not.toContain('testID="environmental-backdrop-basics"');
    expect(markup).not.toContain('testID="top-landmark-basics"');
    expect(markup).not.toContain(firstStop('basics'));
    // the in-progress World is drawn in full
    expect(markup).toContain('testID="environmental-backdrop-home"');
  });

  it('draws an opened Completed World in full, and its header folds it again', () => {
    const onToggleCompleted = jest.fn();
    const markup = render({ expandedCompleted: new Set(['basics']), onToggleCompleted });
    expect(markup).toContain('testID="environmental-backdrop-basics"');
    expect(markup).toContain(firstStop('basics'));
    const header = mockPressables.filter((p) => p.accessibilityLabel === label(true));
    expect(header).toHaveLength(1);
    expect(header[0].accessibilityState).toEqual({ expanded: true });
    header[0].onPress();
    expect(onToggleCompleted).toHaveBeenCalledWith('basics');
  });

  it('opens a folded Completed World from its header', () => {
    const onToggleCompleted = jest.fn();
    render({ onToggleCompleted });
    mockPressables.find((p) => p.accessibilityLabel === label(false))!.onPress();
    expect(onToggleCompleted).toHaveBeenCalledWith('basics');
  });

  it('does not make the in-progress World\'s header a toggle', () => {
    render();
    const homeTitle = worldTitle(findWorld('home')!, t);
    expect(mockPressables.filter((p) => String(p.accessibilityLabel ?? '').startsWith(homeTitle))).toEqual([]);
  });

  it('keeps a World with an Owed Mission open, with its "Cerrar el mundo" panel', () => {
    const missionId = stopsOf(basics).find((s) => s.kind === 'mission')!.id;
    const markup = render({ progress: done(['basics'], { [missionId]: skipped }) });
    expect(mockPressables.filter((p) => String(p.accessibilityLabel ?? '').includes(es['map.worldCompleted']))).toEqual([]);
    expect(markup).toContain('testID="environmental-backdrop-basics"');
    expect(markup).toContain(es['map.closeWorld.title']);
  });
});

describe('WorldMapScreen - a Completed Plus World after Plus lapses', () => {
  const t = createTranslator(es);

  it('shows the locked World, not the completed row', () => {
    jest.isolateModules(() => {
      jest.doMock('../world', () => {
        const actual = jest.requireActual('../world');
        return { ...actual, WORLDS: actual.WORLDS.map((w: WorldDef) => (w.id === 'basics' ? { ...w, tier: 'plus' } : w)) };
      });
      const { WorldMapScreen: Screen } = require('./WorldMapScreen');
      const world = require('../world');
      const stops = world.stopsOf(world.findWorld('basics'));
      const progress = world.progressOf(stops.filter((s: Stop) => s.kind === 'node').map((s: Stop) => s.id), {
        readLessons: stops.filter((s: Stop) => s.kind === 'lesson').map((s: Stop) => s.id),
        missions: Object.fromEntries(stops.filter((s: Stop) => s.kind === 'mission').map((s: Stop) => [s.id, { target: 'full', skipRun: 0, attempts: [], startedAt: '2026-10-01T09:00:00.000Z', passedOn: '2026-10-02' }])),
      });
      // the isolated registry has its own React, so the screen is rendered with that one
      const IsolatedReact = require('react');
      const { renderToStaticMarkup: isolatedRender } = require('react-dom/server');
      mockPressables.length = 0;
      const markup = isolatedRender(
        IsolatedReact.createElement(Screen, {
          t,
          progress,
          stars: {},
          now: new Date('2026-10-28T09:00:00'),
          streak: NO_STREAK,
          today: '2026-10-28',
          dailyBest: undefined,
          rustyPrompt: false,
          rusty: false,
          skippedWarmup: false,
          onWarmup: () => {},
          onSkipWarmup: () => {},
          onDaily: () => {},
          onOpenStop: () => {},
          onSettings: () => {},
        }),
      );
      expect(mockPressables.filter((p) => String(p.accessibilityLabel ?? '').includes(es['map.worldCompleted']))).toEqual([]);
      expect(markup).toContain(es['world.unlockPlus']);
    });
  });
});

describe('PlusChip and TrialStatusModal', () => {
  const t = createTranslator(es);

  it('renders PlusChip unstarted state with "7 días gratis"', () => {
    let pressed = false;
    const markup = renderToStaticMarkup(
      <PlusChip t={t} state="unstarted" onPress={() => { pressed = true; }} />
    );
    expect(markup).toContain('Plus');
    expect(markup).toContain('7 días gratis');
    expect(markup).toContain('Plus. 7 días gratis');
  });

  it('renders PlusChip active state with countdown days', () => {
    const markup = renderToStaticMarkup(
      <PlusChip t={t} state="active" daysRemaining={4} onPress={() => {}} />
    );
    expect(markup).toContain('Plus');
    expect(markup).toContain('4 d');
    expect(markup).toContain('Plus · 4 d');
  });

  it('renders PlusChip expired state with "Pasar a Plus"', () => {
    const markup = renderToStaticMarkup(
      <PlusChip t={t} state="expired" onPress={() => {}} />
    );
    expect(markup).toContain('Plus');
    expect(markup).toContain('Pasar a Plus');
    expect(markup).toContain('Plus. Pasar a Plus');
  });

  it('renders PlusChip subscribed state with "Activo"', () => {
    const markup = renderToStaticMarkup(
      <PlusChip t={t} state="expired" isSubscribed={true} onPress={() => {}} />
    );
    expect(markup).toContain('Plus');
    expect(markup).toContain('Activo');
    expect(markup).toContain('Plus · Activo');
  });

  it('renders TrialStatusModal with remaining days and active perks', () => {
    let dismissed = false;
    const markup = renderToStaticMarkup(
      <TrialStatusModal
        t={t}
        daysRemaining={5}
        onDismiss={() => { dismissed = true; }}
      />
    );
    expect(markup).toContain('LeadMate Plus activo');
    expect(markup).toContain('5 días restantes');
    expect(markup).toContain('Demostraciones en vídeo desbloqueadas');
    expect(markup).toContain('Saltos de día ilimitados en misiones');
    expect(markup).toContain('Acceso a los mundos avanzados de Plus');
    expect(markup).toContain('Entendido');
  });

  it('renders TrialStatusModal subscribed state with "Activo" and subscribed subtitle', () => {
    const markup = renderToStaticMarkup(
      <TrialStatusModal
        t={t}
        daysRemaining={0}
        isSubscribed={true}
        onDismiss={() => {}}
      />
    );
    expect(markup).toContain('LeadMate Plus activo');
    expect(markup).toContain('Activo');
    expect(markup).toContain('Disfruta de todas las ventajas incluidas con tu suscripción.');
    expect(markup).toContain('Demostraciones en vídeo desbloqueadas');
  });

  describe('WorldMapScreen - Anchored Banner Integration', () => {
    const baseMembership = {
      onboarding: {
        trialStartedAt: null as string | null,
        mockSubscribed: false,
      },
    };

    it('renders Anchored Banner for Free Tier users (no trial)', () => {
      const markup = renderToStaticMarkup(
        <WorldMapScreen
          t={t}
          progress={progressOf([])}
          membership={baseMembership as any}
          stars={{}}
          now={new Date('2026-10-28T09:00:00')}
          streak={NO_STREAK}
          today="2026-10-28"
          dailyBest={undefined}
          rustyPrompt={false}
          rusty={false}
          skippedWarmup={false}
          onWarmup={() => {}}
          onSkipWarmup={() => {}}
          onDaily={() => {}}
          onBarkdoku={() => {}}
          onOpenStop={() => {}}
          onSettings={() => {}}
        />
      );
      expect(markup).toContain('leadmate-ad-banner');
    });

    it('suppresses Anchored Banner for active Trial Plus members', () => {
      const trialMembership = {
        onboarding: {
          trialStartedAt: '2026-10-27T09:00:00Z',
          mockSubscribed: false,
        },
      };
      const markup = renderToStaticMarkup(
        <WorldMapScreen
          t={t}
          progress={progressOf([])}
          membership={trialMembership as any}
          stars={{}}
          now={new Date('2026-10-28T09:00:00Z')}
          streak={NO_STREAK}
          today="2026-10-28"
          dailyBest={undefined}
          rustyPrompt={false}
          rusty={false}
          skippedWarmup={false}
          onWarmup={() => {}}
          onSkipWarmup={() => {}}
          onDaily={() => {}}
          onBarkdoku={() => {}}
          onOpenStop={() => {}}
          onSettings={() => {}}
        />
      );
      expect(markup).not.toContain('leadmate-ad-banner');
    });

    it('suppresses Anchored Banner for subscribed Plus members', () => {
      const subscribedMembership = {
        onboarding: {
          trialStartedAt: null,
          mockSubscribed: true,
        },
      };
      const markup = renderToStaticMarkup(
        <WorldMapScreen
          t={t}
          progress={progressOf([])}
          membership={subscribedMembership as any}
          stars={{}}
          now={new Date('2026-10-28T09:00:00Z')}
          streak={NO_STREAK}
          today="2026-10-28"
          dailyBest={undefined}
          rustyPrompt={false}
          rusty={false}
          skippedWarmup={false}
          onWarmup={() => {}}
          onSkipWarmup={() => {}}
          onDaily={() => {}}
          onBarkdoku={() => {}}
          onOpenStop={() => {}}
          onSettings={() => {}}
        />
      );
      expect(markup).not.toContain('leadmate-ad-banner');
    });
  });
});

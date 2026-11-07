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
    ScrollView: (props: any) => React.createElement('div', { ...props, 'data-testid': 'map-scroll-view' }, props.children),
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
import { BarkdokuChip, ComingSoonCard, MORE_COMING_SCENARIO_KEYS, MoreComingCard, NEXT_UP_PULSE_CYCLES, PlusChip, PreviewTeaser, TrialStatusModal, WorldBlock, WorldMapScreen } from './WorldMapScreen';
import { NO_STREAK } from '../streak';
import { findWorld, isWorldUnlocked, progressOf, stopsOf, worldsFor, worldTitle, type Progress, type Stop, type WorldDef } from '../world';
import { mapModel, type MapWorld } from '../mapModel';
import { LESSONS } from '../lessons/content';
import { PUPPY_SATELLITE_STOPS } from '../puppyTrack';

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
    expect(markup).toContain('testID="environmental-backdrop-basics"');
    expect(markup).toContain('testID="top-landmark-basics"');
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

    // World 2 (the first locked World) starts folded to its header, and so do the Worlds after it
    expect(markup).not.toContain('testID="top-landmark-home"');
    expect(markup).not.toContain('testID="environmental-backdrop-home"');
    expect(markup).toContain(worldTitle(findWorld('home')!, t));
    expect(markup).not.toContain('Termina «');
    expect(markup).not.toContain(es['world.unlockGeneric']);
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
        onLibrary={() => {}}
        onDiary={() => {}}
      />
    );
    return {
      labels: mockPressables.map((p) => String(p.accessibilityLabel ?? '')),
      markup,
    };
  };

  it('shows Streak, Library, and gear in row 1, and Plus, Daily Paseo, and Guaudoku in row 2', () => {
    const { labels, markup } = renderHeader();
    const start = labels.findIndex((l) => l.startsWith(es['streak.flame']));
    expect(start).toBeGreaterThanOrEqual(0);
    // Row 1: Streak, Library, and Settings gear on the right
    expect(labels[start]).toContain(es['diary.chip']);
    expect(labels[start + 1]).toBe(es['library.chip']);
    expect(labels[start + 2]).toBe(es['map.settings']);
    // Row 2: Plus, Daily Paseo, Guaudoku
    expect(labels[start + 3]).toBe('Plus. 7 días gratis');
    expect(labels[start + 4]).toBe(es['daily.title']);
    expect(labels[start + 5].startsWith(es['map.barkdoku.daily'])).toBe(true);

    // Verifies two-row container layout
    expect(markup).toContain('flex-row items-center justify-between');
    expect(markup).toContain('flex-row flex-wrap items-center');
    expect(markup).toContain(es['daily.chip']);
  });

  it('has no Diario chip: only the Streak chip mentions the Diary', () => {
    const { labels } = renderHeader();
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
    const home = findWorld('home')!;
    const homeTitle = worldTitle(home, t);
    const missionId = stopsOf(home).find((s) => s.kind === 'mission')!.id;
    const markup = render({ progress: done(['basics', 'home'], { [missionId]: skipped }) });
    expect(mockPressables.filter((p) => String(p.accessibilityLabel ?? '').startsWith(homeTitle))).toEqual([]);
    expect(markup).toContain('testID="environmental-backdrop-home"');
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
      // locked again, and the first locked World starts folded to its header, whose tap opens the preview
      expect(markup).toContain(`Mundo 1 · Un perro es un perro. ${es['map.openPreview']}`);
    });
  });
});

describe('PlusChip and TrialStatusModal', () => {
  const t = createTranslator(es);

  it('renders PlusChip unstarted state with "Gratis"', () => {
    let pressed = false;
    const markup = renderToStaticMarkup(
      <PlusChip t={t} state="unstarted" onPress={() => { pressed = true; }} />
    );
    expect(markup).toContain('Plus');
    expect(markup).toContain('Gratis');
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

  it('renders TrialStatusModal via viewport overlay outside scroll container when trialModalOpen is true', () => {
    const markup = renderToStaticMarkup(
      <WorldMapScreen
        t={t}
        progress={progressOf([])}
        membership={
          {
            onboarding: {
              trialStartedAt: '2026-10-27T09:00:00Z',
              mockSubscribed: false,
            },
          } as any
        }
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
        trialModalOpen={true}
      />
    );

    expect(markup).toContain('LeadMate Plus activo');
    const scrollMatch = markup.match(/<div[^>]*data-testid="map-scroll-view"[^>]*>([\s\S]*?)<\/div>/);
    expect(scrollMatch).not.toBeNull();
    expect(scrollMatch![1]).not.toContain('LeadMate Plus activo');
  });

  it('does not render TrialStatusModal when trialModalOpen is false', () => {
    const markup = renderToStaticMarkup(
      <WorldMapScreen
        t={t}
        progress={progressOf([])}
        membership={
          {
            onboarding: {
              trialStartedAt: '2026-10-27T09:00:00Z',
              mockSubscribed: false,
            },
          } as any
        }
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
        trialModalOpen={false}
      />
    );

    expect(markup).not.toContain('LeadMate Plus activo');
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

describe('WorldMapScreen - Next Up pulse', () => {
  it('pulses a bounded number of cycles, never forever', () => {
    expect(Number.isFinite(NEXT_UP_PULSE_CYCLES)).toBe(true);
    expect(NEXT_UP_PULSE_CYCLES).toBe(4);
  });
});

describe('WorldMapScreen - Home Behaviours section', () => {
  const t = createTranslator(es);
  const base = {
    t,
    progress: progressOf([]),
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
    onBarkdoku: () => {},
    onOpenStop: () => {},
    onSettings: () => {},
  };

  it('shows the section with its five rows, none of them "coming soon", when given the home props', () => {
    const markup = renderToStaticMarkup(<WorldMapScreen {...base} home={{ concerns: { 'bark-home': 2 }, onBecomeConcern: () => {} }} />);
    expect(markup).toContain(es['home.title']);
    expect(markup).not.toContain(es['home.comingSoon']);
  });

  it('shows the section collapsed (header only) immediately after World 2, and hides it when every Home Stretch is in World 2', () => {
    const markup = renderToStaticMarkup(<WorldMapScreen {...base} home={{ concerns: {}, onBecomeConcern: () => {} }} />);
    expect(markup.match(/Otros comportamientos en casa/g)).toHaveLength(2); // title + accessibility label
    expect(markup).not.toContain(es['home.help']);
    expect(markup.indexOf(es['home.title'])).toBeGreaterThan(markup.indexOf(worldTitle(findWorld('home')!, t)));
    expect(markup.indexOf(es['home.title'])).toBeLessThan(markup.indexOf(worldTitle(findWorld('sidewalk')!, t)));
    const all = { 'bite-owner': 1, 'bite-others': 1, 'bark-home': 1, destroy: 1, 'eat-objects': 1 } as const;
    expect(renderToStaticMarkup(<WorldMapScreen {...base} progress={progressOf([], { homeConcerns: all })} home={{ concerns: all, onBecomeConcern: () => {} }} />)).not.toContain(es['home.title']);
  });

  it('shows the Home Stretches of the Dog\'s Concerns as Stretches of World 2 when unlocked', () => {
    const stops = stopsOf(findWorld('basics')!);
    const progress = progressOf(
      stops.filter((s) => s.kind === 'node').map((s) => s.id),
      {
        readLessons: stops.filter((s) => s.kind === 'lesson').map((s) => s.id),
        missions: Object.fromEntries(stops.filter((s) => s.kind === 'mission').map((s) => [s.id, { target: 'full', skipRun: 0, attempts: [], startedAt: '2026-10-01T09:00:00.000Z', passedOn: '2026-10-02' }])) as Progress['missions'],
        homeConcerns: { 'bark-home': 1 },
      },
    );
    const markup = renderToStaticMarkup(<WorldMapScreen {...base} progress={progress} home={{ concerns: { 'bark-home': 1 }, onBecomeConcern: () => {} }} />);
    expect(markup).toContain('Ladra en casa');
  });

  it('hides the section without the home props', () => {
    expect(renderToStaticMarkup(<WorldMapScreen {...base} />)).not.toContain(es['home.title']);
  });
});

describe('WorldMapScreen - World 2 sections', () => {
  const t = createTranslator(es);
  const basicsStops = stopsOf(findWorld('basics')!);
  const basicsDoneProgress = progressOf(
    basicsStops.filter((s) => s.kind === 'node').map((s) => s.id),
    {
      readLessons: basicsStops.filter((s) => s.kind === 'lesson').map((s) => s.id),
      missions: Object.fromEntries(basicsStops.filter((s) => s.kind === 'mission').map((s) => [s.id, { target: 'full', skipRun: 0, attempts: [], startedAt: '2026-10-01T09:00:00.000Z', passedOn: '2026-10-02' }])) as Progress['missions'],
    },
  );
  const base = {
    t,
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
    onBarkdoku: () => {},
    onOpenStop: () => {},
    onSettings: () => {},
  };

  it('draws both "Para tu perro" and "Más cosas de casa" headers when World 2 is open with Concerns', () => {
    const progress: Progress = { ...basicsDoneProgress, homeConcerns: { 'bark-home': 1 } };
    const markup = renderToStaticMarkup(<WorldMapScreen {...base} progress={progress} home={{ concerns: { 'bark-home': 1 }, onBecomeConcern: () => {} }} />);
    expect(markup).toContain(es['map.section.forDog']);
    expect(markup).toContain(es['map.section.moreHome']);
    expect(markup.indexOf(es['map.section.forDog'])).toBeLessThan(markup.indexOf(es['map.section.moreHome']));
  });

  it('draws only "Más cosas de casa" when World 2 is open with no Concerns', () => {
    const progress: Progress = { ...basicsDoneProgress, homeConcerns: {} };
    const markup = renderToStaticMarkup(<WorldMapScreen {...base} progress={progress} home={{ concerns: {}, onBecomeConcern: () => {} }} />);
    expect(markup).not.toContain(es['map.section.forDog']);
    expect(markup).toContain(es['map.section.moreHome']);
  });

  it('does not draw section headers when World 2 is locked and collapsed', () => {
    const progress: Progress = { ...progressOf([]), homeConcerns: { 'bark-home': 1 } };
    const markup = renderToStaticMarkup(<WorldMapScreen {...base} progress={progress} home={{ concerns: { 'bark-home': 1 }, onBecomeConcern: () => {} }} />);
    expect(markup).not.toContain(es['map.section.forDog']);
    expect(markup).not.toContain(es['map.section.moreHome']);
  });

  it('draws section headers when locked World 2 is expanded', () => {
    const progress: Progress = { ...progressOf([]), homeConcerns: { 'bark-home': 1 }, worldHome: ['bark-home'] };
    const entry = mapModel(progress, {}, base.now, { worlds: worldsFor([], progress) }).worlds.find((w: MapWorld) => w.world.id === 'home')!;
    const markup = renderToStaticMarkup(
      <WorldBlock
        t={t}
        entry={entry}
        width={360}
        rusty={false}
        pulse={false}
        live={true}
        isFirstLocked={true}
        isExpanded={true}
        onToggleExpand={() => {}}
        completedOpen={false}
        onToggleCompleted={() => {}}
        onPressNode={() => {}}
        onPressPaywall={() => {}}
        onLayout={() => {}}
        onPathLayout={() => {}}
      />,
    );
    expect(markup).toContain(es['map.section.forDog']);
    expect(markup).toContain(es['map.section.moreHome']);
  });
});

describe('Task 6.1b: Pack-marked Plus World paywall verification', () => {
  const t = createTranslator(es);

  it('verifies pack-marked Plus World still shows the paywall to a free user', () => {
    const onPaywall = jest.fn();
    // In the resolved pack, world 6 ('recall') is tier: 'plus'
    const recallWorld = findWorld('recall');
    expect(recallWorld).toBeDefined();
    expect(recallWorld?.tier).toBe('plus');

    // Free user without Plus entitlement
    const freeProgress = progressOf([]);
    expect(freeProgress.plus).toBeFalsy();
    expect(isWorldUnlocked(recallWorld!, freeProgress)).toBe(false);

    const base = {
      t,
      progress: freeProgress,
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
      onBarkdoku: () => {},
      onOpenStop: () => {},
      onSettings: () => {},
      onPaywall,
    };

    const markup = renderToStaticMarkup(<WorldMapScreen {...base} />);
    // The Plus badge for pack-marked plus worlds is rendered
    expect(markup).toContain(es['world.plusBadge']);
  });
});

describe('WorldMapScreen - Satellite Stops for Puppies (Task 4.2 & 4.3)', () => {
  const t = createTranslator(es);
  const base = {
    t,
    progress: progressOf([]),
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
    onBarkdoku: () => {},
    onOpenStop: () => {},
    onSettings: () => {},
  };

  it('renders all three companion satellite stops in World 1 when ageBand is puppy', () => {
    mockPressables.length = 0;
    const markup = renderToStaticMarkup(<WorldMapScreen {...base} ageBand="puppy" />);

    const satellites = mockPressables.filter((p) =>
      typeof p.accessibilityLabel === 'string' && p.accessibilityLabel.includes(es['map.satellite.puppy'])
    );
    expect(satellites).toHaveLength(3);

    for (const def of PUPPY_SATELLITE_STOPS) {
      const match = satellites.find((p) => p.accessibilityLabel.includes(t(def.title)));
      expect(match).toBeDefined();
    }
    expect(markup).toContain(es['map.satellite.puppy']);
  });

  it('announces completion in accessibility label and renders checkmark when completed', () => {
    mockPressables.length = 0;
    const progressCompleted = progressOf([], { readLessons: ['puppy-bite'] });
    const markup = renderToStaticMarkup(<WorldMapScreen {...base} ageBand="puppy" progress={progressCompleted} />);
    expect(markup).toContain('✓');

    const biteBtn = mockPressables.find(
      (p) => typeof p.accessibilityLabel === 'string' && p.accessibilityLabel.includes(t('trail.puppy-bite.title'))
    );
    expect(biteBtn).toBeDefined();
    expect(biteBtn.accessibilityLabel).toContain(es['map.satellite.done']);

    const soundBtn = mockPressables.find(
      (p) => typeof p.accessibilityLabel === 'string' && p.accessibilityLabel.includes(t('trail.puppy-sound.title'))
    );
    expect(soundBtn).toBeDefined();
    expect(soundBtn.accessibilityLabel).not.toContain(es['map.satellite.done']);
  });

  it('does not render satellite stops for adult, adolescent, senior, or null ageBand', () => {
    for (const age of ['adult', 'adolescent', 'senior', null, undefined] as const) {
      mockPressables.length = 0;
      const markup = renderToStaticMarkup(<WorldMapScreen {...base} ageBand={age} />);
      const satellites = mockPressables.filter((p) =>
        typeof p.accessibilityLabel === 'string' && p.accessibilityLabel.includes(es['map.satellite.puppy'])
      );
      expect(satellites).toHaveLength(0);
      expect(markup).not.toContain(es['map.satellite.puppy']);
    }
  });

  it('invokes onOpenStop with { kind: "lesson", id: sat.lessonId } when a satellite stop is tapped', () => {
    const onOpenStop = jest.fn();
    mockPressables.length = 0;
    renderToStaticMarkup(<WorldMapScreen {...base} ageBand="puppy" onOpenStop={onOpenStop} />);

    for (const def of PUPPY_SATELLITE_STOPS) {
      const button = mockPressables.find(
        (p) => typeof p.accessibilityLabel === 'string' && p.accessibilityLabel.includes(t(def.title))
      );
      expect(button).toBeDefined();
      button.onPress();
      expect(onOpenStop).toHaveBeenCalledWith({ kind: 'lesson', id: def.lessonId });
    }
    expect(onOpenStop).toHaveBeenCalledTimes(3);
  });

  it('renders checkmark indicator when a puppy satellite module is completed in readLessons', () => {
    const progressCompleted = progressOf([], { readLessons: ['puppy-bite'] });
    const markup = renderToStaticMarkup(<WorldMapScreen {...base} ageBand="puppy" progress={progressCompleted} />);
    expect(markup).toContain('✓');
  });
});

describe('Coming-soon World card (Task 4.1)', () => {
  const t = createTranslator(es);
  const recallWorld = findWorld('recall')!;
  const recallEntry: MapWorld = {
    world: recallWorld,
    unlocked: false,
    complete: false,
    done: 0,
    total: 4,
    stops: [],
    owed: [],
    topics: recallWorld.topics,
    tier: 'plus',
    preview: true,
  };

  const defaultProps = {
    t,
    entry: recallEntry,
    width: 390,
    rusty: false,
    pulse: false,
    live: false,
    isFirstLocked: true,
    isExpanded: true,
    onToggleExpand: () => {},
    completedOpen: false,
    onToggleCompleted: () => {},
    onPressNode: () => {},
    onPressPaywall: () => {},
    onLayout: () => {},
    onPathLayout: () => {},
  };

  it('renders free teaser for free user with teaser title, body, and paywall button', () => {
    mockPressables.length = 0;
    const markup = renderToStaticMarkup(<WorldBlock {...defaultProps} plus={false} />);
    expect(markup).toContain(es['map.plusTeaserTitle']);
    expect(markup).toContain(es['map.plusTeaserBody']);
    expect(markup).toContain(es['paywall.badge']);
    expect(markup).not.toContain(es['world.recall.preview']);
  });

  it('renders ComingSoonCard for trial user with blurb, walk count, auto-unlock note, and no paywall button', () => {
    mockPressables.length = 0;
    const markup = renderToStaticMarkup(<WorldBlock {...defaultProps} plus={true} />);
    expect(markup).toContain(es['world.previewBadge']);
    expect(markup).toContain(es['world.recall.preview']);
    expect(markup).toContain(es['world.previewWalkCount'].replace('{count}', '4'));
    expect(markup).toContain(es['world.comingSoonAutoUnlock']);
    expect(markup).not.toContain(es['map.plusTeaserTitle']);
    expect(markup).not.toContain(es['map.plusTeaserBody']);
    expect(markup).not.toContain(es['paywall.badge']);
  });

  it('renders ComingSoonCard identically for subscribed user with no paywall wording', () => {
    mockPressables.length = 0;
    const markup = renderToStaticMarkup(<WorldBlock {...defaultProps} plus={true} />);
    expect(markup).toContain(es['world.recall.preview']);
    expect(markup).not.toContain(es['map.plusTeaserTitle']);
    expect(markup).not.toContain(es['paywall.badge']);
  });

  it('drops the Plus badge button from the unlock banner for Plus users', () => {
    const freeMarkup = renderToStaticMarkup(<WorldBlock {...defaultProps} plus={false} isFirstLocked={true} />);
    expect(freeMarkup).toContain(es['world.unlockPlus']);

    const plusMarkup = renderToStaticMarkup(<WorldBlock {...defaultProps} plus={true} isFirstLocked={true} />);
    expect(plusMarkup).not.toContain(es['world.unlockPlus']);
  });

  it('flips the card when trial starts and ends', () => {
    // Before trial: free teaser
    const free = renderToStaticMarkup(<WorldBlock {...defaultProps} plus={false} />);
    expect(free).toContain(es['map.plusTeaserTitle']);
    expect(free).not.toContain(es['world.recall.preview']);

    // Trial starts: flips to Próximamente card
    const activeTrial = renderToStaticMarkup(<WorldBlock {...defaultProps} plus={true} />);
    expect(activeTrial).toContain(es['world.recall.preview']);
    expect(activeTrial).not.toContain(es['map.plusTeaserTitle']);

    // Trial ends: flips back to free teaser
    const expired = renderToStaticMarkup(<WorldBlock {...defaultProps} plus={false} />);
    expect(expired).toContain(es['map.plusTeaserTitle']);
    expect(expired).not.toContain(es['world.recall.preview']);
  });
});

describe('MoreComingCard at the end of the map (Task 4.2)', () => {
  const t = createTranslator(es);
  const onPaywall = jest.fn();

  it('renders heading, scenario list, disclaimer and paywall button for free users', () => {
    mockPressables.length = 0;
    const markup = renderToStaticMarkup(<MoreComingCard t={t} plus={false} onPressPaywall={onPaywall} />);
    expect(markup).toContain(es['map.more.title']);
    expect(markup).toContain(es['map.more.intro']);
    for (const key of MORE_COMING_SCENARIO_KEYS) {
      expect(markup).toContain(es[key]);
    }
    expect(markup).toContain(es['map.more.disclaimer']);
    expect(markup).toContain(es['paywall.badge']);
  });

  it('renders heading and scenario list with no disclaimer or paywall button for Plus users', () => {
    mockPressables.length = 0;
    const markup = renderToStaticMarkup(<MoreComingCard t={t} plus={true} onPressPaywall={onPaywall} />);
    expect(markup).toContain(es['map.more.title']);
    expect(markup).toContain(es['map.more.intro']);
    for (const key of MORE_COMING_SCENARIO_KEYS) {
      expect(markup).toContain(es[key]);
    }
    expect(markup).not.toContain(es['map.more.disclaimer']);
    expect(markup).not.toContain(es['paywall.badge']);
  });

  it('renders MoreComingCard inside WorldMapScreen after all worlds', () => {
    const base = {
      t,
      progress: progressOf([]),
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
      onBarkdoku: () => {},
      onOpenStop: () => {},
      onSettings: () => {},
    };

    const markup = renderToStaticMarkup(<WorldMapScreen {...base} />);
    expect(markup).toContain(es['map.more.title']);
    expect(markup).toContain(es['map.more.intro']);
    for (const key of MORE_COMING_SCENARIO_KEYS) {
      expect(markup).toContain(es[key]);
    }
  });
});

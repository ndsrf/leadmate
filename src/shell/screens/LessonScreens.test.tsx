const mockPressables: any[] = [];

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    Pressable: (props: any) => {
      mockPressables.push(props);
      const { style, ...rest } = props;
      const resolvedStyle = typeof style === 'function' ? style({ pressed: false }) : style;
      const body = typeof props.children === 'function' ? props.children({ pressed: false }) : props.children;
      return React.createElement('button', { ...rest, style: resolvedStyle }, body);
    },
    ScrollView: (props: any) => React.createElement('div', props, props.children),
    Image: (props: any) => React.createElement('img', { alt: props.accessibilityLabel }),
    Linking: { openURL: jest.fn().mockResolvedValue(true) },
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    },
    Platform: { OS: 'web' },
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
    default: { View: (props: any) => React.createElement('div', props, props.children) },
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

jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('expo', () => ({ useEvent: () => ({ status: 'idle' }), useEventListener: () => {} }));
jest.mock('expo-video', () => ({ VideoView: () => null, useVideoPlayer: () => ({}) }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: (p: any) => p.children,
  SafeAreaView: (p: any) => p.children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, es } from '../../i18n';
import type { LessonDef } from '../lessons/lesson';
import { findLesson } from '../lessons/content';
import { LessonScreen } from './LessonScreens';
import { getActiveContent, setActiveContent } from '../content/runtime';
import type { ResolvedShop } from '../content/resolver';

describe('LessonScreen video gating and text readability', () => {
  const t = createTranslator(es);
  const sampleLesson: LessonDef = {
    id: 'test-lesson',
    title: 'lesson.kind.theory',
    kind: 'theory',
    day: 1,
    blocks: [
      { type: 'heading', text: 'lesson.kind.theory' },
      { type: 'text', text: 'lesson.kind.theory' },
      { type: 'tip', text: 'lesson.kind.theory' },
      {
        type: 'video',
        source: { kind: 'youtube', id: 'vid-1' },
        alt: 'media.caption.poste',
        caption: 'media.caption.poste',
        poster: 'poster',
      },
      { type: 'takeaways', items: ['lesson.kind.theory'] },
    ],
  };

  it('renders all text, tips, and takeaways for free users while video remains gated', () => {
    let unlockCalled = false;
    const markup = renderToStaticMarkup(
      <LessonScreen
        t={t}
        lesson={sampleLesson}
        isPlus={false}
        trialState="unstarted"
        onUnlockVideo={() => {
          unlockCalled = true;
        }}
        onDone={() => {}}
        onBack={() => {}}
      />,
    );
    // Non-video text remains readable
    expect(markup).toContain(es['lesson.kind.theory']);
    expect(markup).toContain(es['lesson.tipLabel']);
    expect(markup).toContain(es['lesson.takeawaysLabel']);

    // Video block is gated with unlock CTA
    expect(markup).toContain('Desbloquear con 7 días gratis');
    expect(markup).not.toContain('Desbloqueado con Plus');
  });

  it('renders unlocked video badge for Plus users', () => {
    const markup = renderToStaticMarkup(
      <LessonScreen
        t={t}
        lesson={sampleLesson}
        isPlus={true}
        trialState="active"
        onDone={() => {}}
        onBack={() => {}}
      />,
    );
    expect(markup).toContain('Desbloqueado con Plus');
    expect(markup).not.toContain('Desbloquear con');
  });
});

describe('Home Behaviour Lessons', () => {
  const t = createTranslator(es);
  const render = (lesson: LessonDef) =>
    renderToStaticMarkup(<LessonScreen t={t} lesson={lesson} isPlus={false} trialState="unstarted" onDone={() => {}} onBack={() => {}} />);

  const HOME_LESSONS = ['theory-bite-owner', 'theory-bite-others', 'theory-bark-home', 'theory-destroy', 'theory-eat-objects'].map((id) => findLesson(id)!);

  it('has the five Home Lessons, theory ones, readable by a free user', () => {
    expect(HOME_LESSONS.map((l) => l.id)).toEqual(['theory-bite-owner', 'theory-bite-others', 'theory-bark-home', 'theory-destroy', 'theory-eat-objects']);
    for (const lesson of HOME_LESSONS) {
      expect(lesson.kind).toBe('theory');
      const markup = render(lesson);
      expect(markup).toContain(es[lesson.title]);
      expect(markup).toContain(es['lesson.takeawaysLabel']);
    }
  });

  it('leads both biting Lessons with the professional-help note, and the eating Lesson with the vet note', () => {
    for (const id of ['theory-bite-owner', 'theory-bite-others']) {
      const lesson = HOME_LESSONS.find((l) => l.id === id)!;
      expect(lesson.blocks[0]).toEqual({ type: 'notice', text: 'plan.note.professional' });
      const markup = render(lesson);
      const heading = lesson.blocks[1];
      expect(heading.type).toBe('heading');
      expect(markup.indexOf(es['lesson.noticeLabel'])).toBeGreaterThanOrEqual(0);
      expect(markup.indexOf(es['lesson.noticeLabel'])).toBeLessThan(markup.indexOf(es[(heading as { text: keyof typeof es }).text]));
    }
    expect(HOME_LESSONS.find((l) => l.id === 'theory-eat-objects')!.blocks[0]).toEqual({ type: 'notice', text: 'lesson.note.vet' });
    for (const id of ['theory-bark-home', 'theory-destroy']) expect(HOME_LESSONS.find((l) => l.id === id)!.blocks[0].type).toBe('heading');
  });

  describe('Shop recommendations (Task 7.1)', () => {
    const sampleShop: ResolvedShop = {
      categories: [
        {
          id: 'collares',
          title: 'Collares',
          description: 'Collares',
          subcategories: [
            {
              id: 'arneses',
              title: 'Arneses',
              description: 'Arneses',
              products: [
                {
                  id: 'arnes-ergonomico-y',
                  name: 'Arnés ergonómico en Y',
                  description: 'Arnés anti-tiro',
                  url: 'https://example.com/arnes',
                },
                {
                  id: 'collar-plano-acolchado',
                  name: 'Collar plano acolchado',
                  description: 'Collar',
                  url: 'https://example.com/collar',
                },
              ],
            },
          ],
        },
      ],
      idToKind: {
        collares: 'category',
        arneses: 'subcategory',
        'arnes-ergonomico-y': 'product',
        'collar-plano-acolchado': 'product',
      },
    };

    it('renders up to two view recommendations before takeaways and calls onShop when tapped', () => {
      const baseContent = getActiveContent();
      setActiveContent({
        ...baseContent,
        resolved: {
          ...baseContent.resolved,
          shop: sampleShop,
        },
      });

      try {
        mockPressables.length = 0;
        const onShop = jest.fn();
        const lessonWithRecs: LessonDef = {
          id: 'lesson-with-recs',
          title: 'lesson.kind.theory',
          kind: 'theory',
          blocks: [
            { type: 'text', text: 'lesson.kind.theory' },
            { type: 'takeaways', items: ['lesson.kind.theory'] },
          ],
          recommendations: [
            {
              id: 'rec-1',
              target: 'arnes-ergonomico-y',
              targetKind: 'product',
              when: 'view',
              explanation: 'Un arnés ergonómico reduce la presión.',
            },
            {
              id: 'rec-2',
              target: 'arneses',
              targetKind: 'subcategory',
              when: 'view',
              explanation: 'Explora nuestra selección de arneses.',
            },
            {
              id: 'rec-3-excess',
              target: 'collar-plano-acolchado',
              targetKind: 'product',
              when: 'view',
              explanation: 'Tercera recomendación que debe omitirse por límite de 2.',
            },
            {
              id: 'rec-trouble-not-view',
              target: 'arnes-ergonomico-y',
              targetKind: 'product',
              when: 'poste-trouble',
              explanation: 'Esta es para trouble, no para view.',
            },
            {
              id: 'rec-unknown-target',
              target: 'non-existent-product',
              targetKind: 'product',
              when: 'view',
              explanation: 'Producto inexistente.',
            },
          ],
        };

        const markup = renderToStaticMarkup(
          <LessonScreen
            t={t}
            lesson={lessonWithRecs}
            onDone={() => {}}
            onBack={() => {}}
            onShop={onShop}
          />,
        );

        // Verify rec 1 and rec 2 are rendered
        expect(markup).toContain('Un arnés ergonómico reduce la presión.');
        expect(markup).toContain('Explora nuestra selección de arneses.');
        // Verify excess rec (> 2) is not rendered
        expect(markup).not.toContain('Tercera recomendación que debe omitirse por límite de 2.');
        // Verify non-view rec is not rendered as in-content card
        expect(markup).not.toContain('Esta es para trouble, no para view.');
        // Verify unknown target is ignored
        expect(markup).not.toContain('Producto inexistente.');

        // Verify position: cards appear BEFORE takeaways in markup
        const rec1Pos = markup.indexOf('Un arnés ergonómico reduce la presión.');
        const takeawayPos = markup.indexOf(es['lesson.takeawaysLabel']);
        expect(rec1Pos).toBeLessThan(takeawayPos);

        // Verify tap triggers onShop
        const buttons = mockPressables.filter((p) => p.testID === 'shop-link-card-action');
        expect(buttons.length).toBe(2);
        buttons[0].onPress();
        expect(onShop).toHaveBeenCalledWith({ level: 'product', id: 'arnes-ergonomico-y' });
      } finally {
        setActiveContent(baseContent);
      }
    });
  });
});

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { DogLookScreen, LanguageScreen } from './IntroScreens';
import { newDogRecord } from '../dogRecord';
import { t } from '../../i18n';

const pressed: Record<string, () => void> = {};

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: (p: any) => p.children,
  SafeAreaView: (p: any) => p.children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: {
      View: (props: any) => React.createElement('div', props, props.children),
      Text: (props: any) => React.createElement('span', props, props.children),
    },
    FadeIn: { duration: () => ({}) },
    FadeInDown: { duration: () => ({}) },
    useSharedValue: (init: any) => ({ value: init }),
    useAnimatedStyle: () => ({}),
    withTiming: (to: any) => to,
    withSpring: (to: any) => to,
    cancelAnimation: jest.fn(),
    Easing: { bezier: () => ({}), inOut: () => ({}), ease: {} },
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

jest.mock('react-native', () => {
  const React = require('react');
  const text = (children: any): string =>
    Array.isArray(children)
      ? children.map(text).join('')
      : typeof children === 'string'
      ? children
      : children?.props
      ? text(children.props.children)
      : '';
  return {
    View: (props: any) => {
      const { accessibilityRole, accessibilityLabel, accessibilityState, ...rest } = props;
      return React.createElement('div', rest, props.children);
    },
    Text: (props: any) => {
      const { accessibilityRole, accessibilityLabel, accessibilityState, ...rest } = props;
      return React.createElement('span', rest, props.children);
    },
    TextInput: (props: any) => {
      const { accessibilityRole, accessibilityLabel, accessibilityState, ...rest } = props;
      return React.createElement('input', rest);
    },
    ScrollView: ({ scrollEventThrottle, contentContainerStyle, accessibilityRole, accessibilityLabel, accessibilityState, ...props }: any) =>
      React.createElement('div', props, props.children),
    Pressable: (props: any) => {
      const body = typeof props.children === 'function' ? props.children({ pressed: false }) : props.children;
      const label = props.accessibilityLabel || text(body);
      if (label && props.onPress) pressed[label.trim()] = props.onPress;
      const { accessibilityRole, accessibilityLabel, accessibilityState, ...rest } = props;
      return React.createElement('button', rest, body);
    },
    Platform: { OS: 'web' },
    AccessibilityInfo: {
      isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
      addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
      announceForAccessibility: jest.fn(),
    },
    BackHandler: {
      addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    },
  };
});

describe('DogLookScreen', () => {
  beforeEach(() => {
    for (const key of Object.keys(pressed)) delete pressed[key];
  });

  it('renders breed and coat choice on part 1', () => {
    const html = renderToStaticMarkup(
      <DogLookScreen
        t={t}
        record={newDogRecord()}
        onDone={() => {}}
      />
    );

    expect(html).toContain(t('dog.title'));
    expect(html).toContain(t('dog.breed.title'));
    expect(html).toContain(t('setup.look.title'));
    expect(html).toContain(t('setup.next'));
  });

  it('renders age stage chips on part 2 when name is set', () => {
    const record = { ...newDogRecord(), name: 'Toby' };
    let doneArgs: any = null;
    const html = renderToStaticMarkup(
      <DogLookScreen
        t={t}
        record={record}
        onDone={(name, coat, breed, ageBand) => {
          doneArgs = { name, coat, breed, ageBand };
        }}
      />
    );

    expect(html).toContain(t('dog.breed.title'));
  });

  it('registers hardwareBackPress listener when advancing to part 2 (name)', () => {
    const { BackHandler } = require('react-native');
    BackHandler.addEventListener.mockClear();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <DogLookScreen
          t={t}
          record={newDogRecord()}
          onDone={() => {}}
        />
      );
    });

    expect(BackHandler.addEventListener).not.toHaveBeenCalled();

    act(() => {
      pressed[t('setup.next')]();
    });
    expect(BackHandler.addEventListener).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
  });
});

describe('LanguageScreen', () => {
  it('renders Spanish and English options with pre-selected language', () => {
    const html = renderToStaticMarkup(
      <LanguageScreen
        t={t}
        selectedLanguage="en"
        onSelectLanguage={() => {}}
        onDone={() => {}}
        onBack={() => {}}
      />
    );

    expect(html).toContain(t('language.title'));
    expect(html).toContain(t('language.subtitle'));
    expect(html).toContain(t('language.es'));
    expect(html).toContain(t('language.en'));
    expect(html).toContain(t('language.continue'));
  });
});

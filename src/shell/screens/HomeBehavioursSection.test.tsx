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
        { disabled: props.disabled },
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
import { HOME_CONCERNS } from '../concerns';
import { homeBehaviourEntries } from '../homeBehaviours';
import { newDogRecord, setHomeConcern } from '../dogRecord';
import { BehaviourActions, HomeBehavioursSection } from './HomeBehavioursSection';

const onBecome = jest.fn();

const t = createTranslator(es);
const none = { readLessons: [], completedNodes: [], missions: {} };

/** The buttons of the last render, in order, with their label, whether they are disabled and a way to press them. */
function buttons(markup: string) {
  const labels = [...markup.matchAll(/<button[^>]*>[\s\S]*?<\/button>/g)].map((m) => m[0]);
  return labels.map((html, i) => ({ html, disabled: /disabled=""/.test(html), text: html.replace(/<[^>]*>/g, ''), press: () => mockPressables[mockPressables.length - labels.length + i].onPress() }));
}

describe('Home Behaviours section buttons', () => {
  const row = (concern: (typeof HOME_CONCERNS)[number], level: 0 | 1 = 0) => homeBehaviourEntries(level ? { [concern]: 1 } : {}).find((e) => e.concern === concern)!;

  beforeEach(() => {
    mockPressables.length = 0;
  });

  it('shows no Exercise button on bite-others row, but shows Exercise on bite-owner', () => {
    const markupOthers = renderToStaticMarkup(<BehaviourActions t={t} entry={row('bite-others', 1)} done={none} onOpen={() => {}} onBecomeConcern={() => {}} />);
    const textOthers = buttons(markupOthers).map((b) => b.text);
    expect(textOthers).toEqual([es['home.part.lesson'], es['home.part.mission']]);
    expect(markupOthers).not.toContain(es['home.part.exercise']);

    const markupOwner = renderToStaticMarkup(<BehaviourActions t={t} entry={row('bite-owner', 1)} done={none} onOpen={() => {}} onBecomeConcern={() => {}} />);
    const textOwner = buttons(markupOwner).map((b) => b.text);
    expect(textOwner).toEqual([es['home.part.lesson'], es['home.part.exercise'], es['home.part.mission']]);
  });

  it('shows Lesson, Exercise and Mission on the others', () => {
    const markup = renderToStaticMarkup(<BehaviourActions t={t} entry={row('destroy', 1)} done={none} onOpen={() => {}} onBecomeConcern={() => {}} />);
    expect(buttons(markup).map((b) => b.text)).toEqual([es['home.part.lesson'], es['home.part.exercise'], es['home.part.mission']]);
  });

  it('enables Lesson, Exercise and Mission of a non-Concern, with no "not a problem" note, and offers "Ahora es un problema"', () => {
    const markup = renderToStaticMarkup(<BehaviourActions t={t} entry={row('destroy')} done={none} onOpen={() => {}} onBecomeConcern={() => {}} />);
    expect(buttons(markup).map((x) => [x.text, x.disabled])).toEqual([
      [es['home.part.lesson'], false],
      [es['home.part.exercise'], false],
      [es['home.part.mission'], false],
      [es['home.becomeConcern'], false],
    ]);
    expect(markup).not.toContain('no es un problema');
  });

  it('offers no become-a-Concern button once it is a Concern', () => {
    const markup = renderToStaticMarkup(<BehaviourActions t={t} entry={row('destroy', 1)} done={none} onOpen={() => {}} onBecomeConcern={() => {}} />);
    expect(buttons(markup).every((x) => !x.disabled)).toBe(true);
    expect(markup).not.toContain(es['home.becomeConcern']);
  });

  it('opens the Lesson, the Node and the Mission as Stops, and "Ahora es un problema" makes it a Concern', () => {
    const opened: unknown[] = [];
    let became = 0;
    const markup = renderToStaticMarkup(<BehaviourActions t={t} entry={row('bark-home')} done={none} onOpen={(s) => opened.push(s)} onBecomeConcern={() => (became += 1)} />);
    const b = buttons(markup);
    b[0].press();
    b[3].press();
    expect(opened).toEqual([{ kind: 'lesson', id: 'theory-bark-home' }]);
    expect(became).toBe(1);
    const concern = renderToStaticMarkup(<BehaviourActions t={t} entry={row('bark-home', 1)} done={none} onOpen={(s) => opened.push(s)} onBecomeConcern={() => {}} />);
    const c = buttons(concern);
    c[1].press();
    c[2].press();
    expect(opened).toEqual([{ kind: 'lesson', id: 'theory-bark-home' }, { kind: 'node', id: 'bark-home' }, { kind: 'mission', id: 'mission-bark-home' }]);
  });

  it('marks finished parts as done', () => {
    const done = { readLessons: ['theory-destroy'], completedNodes: [], missions: {} };
    const markup = renderToStaticMarkup(<BehaviourActions t={t} entry={row('destroy', 1)} done={done} onOpen={() => {}} onBecomeConcern={() => {}} />);
    const text = buttons(markup).map((b) => b.text);
    expect(text[0]).toContain(es['home.part.done']);
    expect(text[1]).not.toContain(es['home.part.done']);
  });

  it('is collapsed by default: only the header shows, with no rows', () => {
    const markup = renderToStaticMarkup(<HomeBehavioursSection t={t} concerns={{}} done={none} onOpen={() => {}} onBecomeConcern={() => {}} />);
    expect(markup).toContain(es['home.title']);
    expect(markup.match(/▼/g)).toHaveLength(1);
    expect(markup).not.toContain(es['home.help']);
  });

  it('lists one folded row per Home Behaviour once expanded, with no "coming soon" text', () => {
    const markup = renderToStaticMarkup(<HomeBehavioursSection t={t} concerns={{}} done={none} defaultExpanded onOpen={() => {}} onBecomeConcern={() => {}} />);
    expect(markup).not.toContain(es['home.comingSoon']);
    expect(markup.match(/▼/g)).toHaveLength(HOME_CONCERNS.length);
  });

  it('leaves out the Home Behaviours that are Stretches of World 1, and is hidden when none is left', () => {
    const some = renderToStaticMarkup(<HomeBehavioursSection t={t} concerns={{ 'bite-owner': 1 }} inWorld={(c) => c === 'bite-owner'} done={none} defaultExpanded onOpen={() => {}} onBecomeConcern={() => {}} />);
    expect(some.match(/▼/g)).toHaveLength(HOME_CONCERNS.length - 1);
    const empty = renderToStaticMarkup(<HomeBehavioursSection t={t} concerns={{}} inWorld={() => true} done={none} onOpen={() => {}} onBecomeConcern={() => {}} />);
    expect(empty).toBe('');
  });
});

describe('Being alone in Other Home Behaviours', () => {
  beforeEach(() => {
    mockPressables.length = 0;
  });

  it('is listed while it is not a Concern (after "Muy bien" or "Aún no lo sé"), and "Ahora es un problema" makes it level 1', () => {
    const markup = renderToStaticMarkup(<HomeBehavioursSection t={t} concerns={{}} done={none} defaultExpanded onOpen={() => {}} onBecomeConcern={onBecome} />);
    expect(markup).toContain(es['concern.alone']);
    const entry = homeBehaviourEntries({}).find((e) => e.concern === 'alone')!;
    expect(entry.isConcern).toBe(false);
    const row = renderToStaticMarkup(<BehaviourActions t={t} entry={entry} done={none} onOpen={() => {}} onBecomeConcern={() => onBecome('alone')} />);
    const become = buttons(row).find((b) => b.text === es['home.becomeConcern']);
    expect(become).toBeDefined();
    become!.press();
    expect(onBecome).toHaveBeenCalledWith('alone');
    const record = setHomeConcern(newDogRecord(), 'alone', 1);
    expect(record.homeConcerns.alone).toBe(1);
    expect(record.aloneAnswer).toBe('sometimes');
  });
});

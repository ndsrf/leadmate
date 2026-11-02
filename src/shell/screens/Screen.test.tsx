import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', { ...props, 'data-testid': props.testID || 'view' }, props.children),
    ScrollView: (props: any) => React.createElement('div', { ...props, 'data-testid': 'scroll-view' }, props.children),
  };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: {
      View: (props: any) => React.createElement('div', { ...props, 'data-testid': 'animated-view' }, props.children),
    },
    FadeIn: { duration: () => ({}) },
    FadeInDown: { duration: () => ({}) },
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import { Screen } from './Screen';

describe('Screen component', () => {
  it('renders children inside the ScrollView container', () => {
    const html = renderToStaticMarkup(
      <Screen>
        <span id="child-content">Main Content</span>
      </Screen>
    );
    expect(html).toContain('id="child-content"');
    expect(html).toContain('data-testid="scroll-view"');
  });

  it('renders header, footer and scrollable content', () => {
    const html = renderToStaticMarkup(
      <Screen
        header={<div id="header-content">Header</div>}
        footer={<div id="footer-content">Footer</div>}
      >
        <span>Content</span>
      </Screen>
    );
    expect(html).toContain('id="header-content"');
    expect(html).toContain('id="footer-content"');
  });

  it('renders overlay outside of the ScrollView at the viewport container root', () => {
    const html = renderToStaticMarkup(
      <Screen
        header={<div>Header</div>}
        footer={<div>Footer</div>}
        overlay={<div id="viewport-overlay">Modal Overlay</div>}
      >
        <div id="scroll-child">Scroll Body</div>
      </Screen>
    );

    expect(html).toContain('id="viewport-overlay"');
    // Ensure overlay is rendered outside of data-testid="scroll-view"
    const scrollViewMatch = html.match(/<div[^>]*data-testid="scroll-view"[^>]*>([\s\S]*?)<\/div>/);
    expect(scrollViewMatch).not.toBeNull();
    const scrollViewContent = scrollViewMatch![1];
    expect(scrollViewContent).toContain('id="scroll-child"');
    expect(scrollViewContent).not.toContain('id="viewport-overlay"');
  });

  it('does not render overlay when overlay is omitted or falsy', () => {
    const html = renderToStaticMarkup(
      <Screen overlay={false && <div>Hidden</div>}>
        <div>Content</div>
      </Screen>
    );
    expect(html).not.toContain('Hidden');
  });
});

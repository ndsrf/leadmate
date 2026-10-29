jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    StyleSheet: {
      absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    },
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

import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { theme } from './theme';
import {
  WorldSceneryBackground,
  TopLandmark,
  HomeTopLandmark,
  SidewalkTopLandmark,
  UrbanTopLandmark,
  ParkTopLandmark,
  HouseLandmark,
  FullHeightEnvironmentalBackdrop,
  World1EnvironmentalBackdrop,
  World2EnvironmentalBackdrop,
  World3EnvironmentalBackdrop,
  World4EnvironmentalBackdrop,
  TOP_LANDMARK_HEIGHT,
  PATH_TOP_OFFSET,
} from './WorldSceneryBackground';
import { ROW_HEIGHT } from './mapLayout';

describe('WorldSceneryBackground - Top Landmarks (Task 1.1)', () => {
  it('renders 48px height HomeTopLandmark for World 1 with gable roof and doorway arch', () => {
    const markup = renderToStaticMarkup(<HomeTopLandmark palette={theme.world.w1} />);
    expect(markup).toContain('top-landmark-1');
    expect(markup).toContain(`height="${TOP_LANDMARK_HEIGHT}"`);
    expect(markup).toContain('height:48px');
    // Gable roof fill using palette accent
    expect(markup).toContain(theme.world.w1.accent);
  });

  it('renders 48px height SidewalkTopLandmark for World 2 with brick pillar and street sign', () => {
    const markup = renderToStaticMarkup(<SidewalkTopLandmark palette={theme.world.w2} />);
    expect(markup).toContain('top-landmark-2');
    expect(markup).toContain(`height="${TOP_LANDMARK_HEIGHT}"`);
    expect(markup).toContain('height:48px');
    expect(markup).toContain(theme.world.w2.accent);
    expect(markup).toContain(theme.world.w2.deep);
  });

  it('renders 48px height UrbanTopLandmark for World 3 with transit shelter and skyline', () => {
    const markup = renderToStaticMarkup(<UrbanTopLandmark palette={theme.world.w3} />);
    expect(markup).toContain('top-landmark-3');
    expect(markup).toContain(`height="${TOP_LANDMARK_HEIGHT}"`);
    expect(markup).toContain('height:48px');
    expect(markup).toContain(theme.world.w3.accent);
    expect(markup).toContain(theme.world.w3.deep);
  });

  it('renders 48px height ParkTopLandmark for World 4 with pergola arbor and signpost', () => {
    const markup = renderToStaticMarkup(<ParkTopLandmark palette={theme.world.w4} />);
    expect(markup).toContain('top-landmark-4');
    expect(markup).toContain(`height="${TOP_LANDMARK_HEIGHT}"`);
    expect(markup).toContain('height:48px');
    expect(markup).toContain(theme.world.w4.accent);
    expect(markup).toContain(theme.world.w4.deep);
  });

  it('provides backward-compatible HouseLandmark export rendering 48px house', () => {
    const markup = renderToStaticMarkup(<HouseLandmark />);
    expect(markup).toContain('top-landmark-1');
    expect(markup).toContain(`height="${TOP_LANDMARK_HEIGHT}"`);
    expect(markup).toContain('pointer-events="none"');
  });

  it('TopLandmark dispatcher correctly delegates by worldNumber and enforces pointerEvents="none"', () => {
    const w1 = renderToStaticMarkup(<TopLandmark worldNumber={1} palette={theme.world.w1} />);
    expect(w1).toContain('top-landmark-1');
    expect(w1).toContain('pointer-events="none"');
    expect(renderToStaticMarkup(<TopLandmark worldNumber={2} palette={theme.world.w2} />)).toContain('top-landmark-2');
    expect(renderToStaticMarkup(<TopLandmark worldNumber={3} palette={theme.world.w3} />)).toContain('top-landmark-3');
    expect(renderToStaticMarkup(<TopLandmark worldNumber={4} palette={theme.world.w4} />)).toContain('top-landmark-4');
  });
});

describe('WorldSceneryBackground - Margin Scenery & Preview Silhouettes (Task 2.1 - 2.3)', () => {
  it('renders margin scenery at middle-row gutter intervals (index % 2 === 1)', () => {
    // 5 stops: indices 0, 1, 2, 3, 4 -> middle rows are 1 and 3
    const markup = renderToStaticMarkup(
      <WorldSceneryBackground
        worldNumber={1}
        palette={theme.world.w1}
        stopCount={5}
      />
    );

    expect(markup).toContain('margin-scenery');
    expect(markup).toContain('margin-row-1');
    expect(markup).toContain('margin-row-3');
    expect(markup).not.toContain('margin-row-0');
    expect(markup).not.toContain('margin-row-2');
    expect(markup).not.toContain('margin-row-4');

    // Check vertical positioning of row 1 and row 3
    const expectedTop1 = PATH_TOP_OFFSET + 1 * ROW_HEIGHT;
    const expectedTop3 = PATH_TOP_OFFSET + 3 * ROW_HEIGHT;
    expect(markup).toContain(`top:${expectedTop1}px`);
    expect(markup).toContain(`top:${expectedTop3}px`);
  });

  it('renders World 1 hallway lines and window frame motifs', () => {
    const markup = renderToStaticMarkup(
      <WorldSceneryBackground
        worldNumber={1}
        palette={theme.world.w1}
        stopCount={3}
      />
    );
    expect(markup).toContain(theme.world.w1.deep);
    expect(markup).toContain(theme.world.w1.sky);
  });

  it('renders World 2 garden fences and sidewalk street lamp motifs', () => {
    const markup = renderToStaticMarkup(
      <WorldSceneryBackground
        worldNumber={2}
        palette={theme.world.w2}
        stopCount={3}
      />
    );
    expect(markup).toContain(theme.world.w2.ground);
  });

  it('renders World 3 building facades and crosswalk motifs', () => {
    const markup = renderToStaticMarkup(
      <WorldSceneryBackground
        worldNumber={3}
        palette={theme.world.w3}
        stopCount={3}
      />
    );
    expect(markup).toContain(theme.world.w3.deep);
  });

  it('renders World 4 park trees and wooden bench motifs', () => {
    const markup = renderToStaticMarkup(
      <WorldSceneryBackground
        worldNumber={4}
        palette={theme.world.w4}
        stopCount={3}
      />
    );
    expect(markup).toContain(theme.world.w4.ground);
  });

  it('renders alternating distinct margin motifs between row 1 and row 3 across active worlds', () => {
    const w1 = renderToStaticMarkup(
      <WorldSceneryBackground worldNumber={1} palette={theme.world.w1} stopCount={5} />
    );
    expect(w1).toContain('margin-row-1');
    expect(w1).toContain('margin-row-3');

    const w4 = renderToStaticMarkup(
      <WorldSceneryBackground worldNumber={4} palette={theme.world.w4} stopCount={5} />
    );
    expect(w4).toContain('margin-row-1');
    expect(w4).toContain('margin-row-3');
  });

  it('renders preview world silhouettes for worlds 5 to 8 when expanded or preview', () => {
    const w5 = renderToStaticMarkup(<WorldSceneryBackground worldNumber={5} palette={theme.world.w1} isExpandedPreview />);
    expect(w5).toContain('preview-silhouette-5');

    const w6 = renderToStaticMarkup(<WorldSceneryBackground worldNumber={6} palette={theme.world.w2} isExpandedPreview />);
    expect(w6).toContain('preview-silhouette-6');

    const w7 = renderToStaticMarkup(<WorldSceneryBackground worldNumber={7} palette={theme.world.w3} isExpandedPreview />);
    expect(w7).toContain('preview-silhouette-7');

    const w8 = renderToStaticMarkup(<WorldSceneryBackground worldNumber={8} palette={theme.world.w4} isExpandedPreview />);
    expect(w8).toContain('preview-silhouette-8');
  });
});

describe('WorldSceneryBackground - Touch & Accessibility Safety (Task 3.1 & 3.2)', () => {
  it('enforces pointerEvents="none", aria-hidden={true}, and accessibilityElementsHidden', () => {
    const markup = renderToStaticMarkup(
      <WorldSceneryBackground
        worldNumber={1}
        palette={theme.world.w1}
        stopCount={4}
      />
    );

    expect(markup).toContain('pointer-events="none"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup.toLowerCase()).toContain('importantforaccessibility="no-hide-descendants"');
  });
});

describe('WorldSceneryBackground - Full-Height Environmental Backdrops (Task 6.1 - 6.3)', () => {
  it('renders World 1 wainscoting wallpaper, ceiling lamp, and floorboard backdrop', () => {
    const markup = renderToStaticMarkup(<World1EnvironmentalBackdrop palette={theme.world.w1} />);
    expect(markup).toContain('environmental-backdrop-1');
    expect(markup).toContain(theme.world.w1.soft);
    expect(markup).toContain(theme.world.w1.deep);
  });

  it('renders World 2 suburban horizon, sidewalk curb, and clouds backdrop', () => {
    const markup = renderToStaticMarkup(<World2EnvironmentalBackdrop palette={theme.world.w2} />);
    expect(markup).toContain('environmental-backdrop-2');
    expect(markup).toContain(theme.world.w2.soft);
    expect(markup).toContain(theme.world.w2.ground);
  });

  it('renders World 3 urban cityscape skyline, antennas, and street grid backdrop', () => {
    const markup = renderToStaticMarkup(<World3EnvironmentalBackdrop palette={theme.world.w3} />);
    expect(markup).toContain('environmental-backdrop-3');
    expect(markup).toContain(theme.world.w3.deep);
    expect(markup).toContain(theme.world.w3.soft);
  });

  it('renders World 4 park rolling hills, treeline, and sun backdrop', () => {
    const markup = renderToStaticMarkup(<World4EnvironmentalBackdrop palette={theme.world.w4} />);
    expect(markup).toContain('environmental-backdrop-4');
    expect(markup).toContain(theme.world.w4.ground);
    expect(markup).toContain(theme.world.w4.accent);
  });

  it('dispatches FullHeightEnvironmentalBackdrop based on worldNumber', () => {
    expect(renderToStaticMarkup(<FullHeightEnvironmentalBackdrop worldNumber={1} palette={theme.world.w1} />)).toContain('environmental-backdrop-1');
    expect(renderToStaticMarkup(<FullHeightEnvironmentalBackdrop worldNumber={2} palette={theme.world.w2} />)).toContain('environmental-backdrop-2');
    expect(renderToStaticMarkup(<FullHeightEnvironmentalBackdrop worldNumber={3} palette={theme.world.w3} />)).toContain('environmental-backdrop-3');
    expect(renderToStaticMarkup(<FullHeightEnvironmentalBackdrop worldNumber={4} palette={theme.world.w4} />)).toContain('environmental-backdrop-4');
  });

  it('includes full-height environmental backdrop in active WorldSceneryBackground blocks', () => {
    const markup = renderToStaticMarkup(
      <WorldSceneryBackground worldNumber={1} palette={theme.world.w1} stopCount={4} />
    );
    expect(markup).toContain('environmental-backdrop');
    expect(markup).toContain('environmental-backdrop-1');
  });
});

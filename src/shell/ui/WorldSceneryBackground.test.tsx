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
  HomeEnvironmentalBackdrop,
  SidewalkEnvironmentalBackdrop,
  UrbanEnvironmentalBackdrop,
  ParkEnvironmentalBackdrop,
  BasicsTopLandmark,
  BasicsEnvironmentalBackdrop,
  sceneryOf,
  worldPalette,
  TOP_LANDMARK_HEIGHT,
  PATH_TOP_OFFSET,
} from './WorldSceneryBackground';
import { ROW_HEIGHT } from './mapLayout';
import { findWorld, WORLDS } from '../world';

describe('WorldSceneryBackground - Top Landmarks (Task 1.1)', () => {
  it('renders 48px height HomeTopLandmark for World 1 with gable roof and doorway arch', () => {
    const markup = renderToStaticMarkup(<HomeTopLandmark palette={theme.world.home} />);
    expect(markup).toContain('top-landmark-home');
    expect(markup).toContain(`height="${TOP_LANDMARK_HEIGHT}"`);
    expect(markup).toContain('height:48px');
    // Gable roof fill using palette accent
    expect(markup).toContain(theme.world.home.accent);
  });

  it('renders 48px height SidewalkTopLandmark for World 2 with brick pillar and street sign', () => {
    const markup = renderToStaticMarkup(<SidewalkTopLandmark palette={theme.world.sidewalk} />);
    expect(markup).toContain('top-landmark-sidewalk');
    expect(markup).toContain(`height="${TOP_LANDMARK_HEIGHT}"`);
    expect(markup).toContain('height:48px');
    expect(markup).toContain(theme.world.sidewalk.accent);
    expect(markup).toContain(theme.world.sidewalk.deep);
  });

  it('renders 48px height UrbanTopLandmark for World 3 with transit shelter and skyline', () => {
    const markup = renderToStaticMarkup(<UrbanTopLandmark palette={theme.world.urban} />);
    expect(markup).toContain('top-landmark-urban');
    expect(markup).toContain(`height="${TOP_LANDMARK_HEIGHT}"`);
    expect(markup).toContain('height:48px');
    expect(markup).toContain(theme.world.urban.accent);
    expect(markup).toContain(theme.world.urban.deep);
  });

  it('renders 48px height ParkTopLandmark for World 4 with pergola arbor and signpost', () => {
    const markup = renderToStaticMarkup(<ParkTopLandmark palette={theme.world.park} />);
    expect(markup).toContain('top-landmark-park');
    expect(markup).toContain(`height="${TOP_LANDMARK_HEIGHT}"`);
    expect(markup).toContain('height:48px');
    expect(markup).toContain(theme.world.park.accent);
    expect(markup).toContain(theme.world.park.deep);
  });

  it('provides backward-compatible HouseLandmark export rendering 48px house', () => {
    const markup = renderToStaticMarkup(<HouseLandmark />);
    expect(markup).toContain('top-landmark-home');
    expect(markup).toContain(`height="${TOP_LANDMARK_HEIGHT}"`);
    expect(markup).toContain('pointer-events="none"');
  });

  it('TopLandmark dispatcher correctly delegates by World id and enforces pointerEvents="none"', () => {
    const w1 = renderToStaticMarkup(<TopLandmark worldId="home" palette={theme.world.home} />);
    expect(w1).toContain('top-landmark-home');
    expect(w1).toContain('pointer-events="none"');
    expect(renderToStaticMarkup(<TopLandmark worldId="sidewalk" palette={theme.world.sidewalk} />)).toContain('top-landmark-sidewalk');
    expect(renderToStaticMarkup(<TopLandmark worldId="urban" palette={theme.world.urban} />)).toContain('top-landmark-urban');
    expect(renderToStaticMarkup(<TopLandmark worldId="park" palette={theme.world.park} />)).toContain('top-landmark-park');
  });
});

describe('WorldSceneryBackground - Margin Scenery & Preview Silhouettes (Task 2.1 - 2.3)', () => {
  it('renders margin scenery at middle-row gutter intervals (index % 2 === 1)', () => {
    // 5 stops: indices 0, 1, 2, 3, 4 -> middle rows are 1 and 3
    const markup = renderToStaticMarkup(
      <WorldSceneryBackground
        worldId="home"
        palette={theme.world.home}
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
        worldId="home"
        palette={theme.world.home}
        stopCount={3}
      />
    );
    expect(markup).toContain(theme.world.home.deep);
    expect(markup).toContain(theme.world.home.sky);
  });

  it('renders World 2 garden fences and sidewalk street lamp motifs', () => {
    const markup = renderToStaticMarkup(
      <WorldSceneryBackground
        worldId="sidewalk"
        palette={theme.world.sidewalk}
        stopCount={3}
      />
    );
    expect(markup).toContain(theme.world.sidewalk.ground);
  });

  it('renders World 3 building facades and crosswalk motifs', () => {
    const markup = renderToStaticMarkup(
      <WorldSceneryBackground
        worldId="urban"
        palette={theme.world.urban}
        stopCount={3}
      />
    );
    expect(markup).toContain(theme.world.urban.deep);
  });

  it('renders World 4 park trees and wooden bench motifs', () => {
    const markup = renderToStaticMarkup(
      <WorldSceneryBackground
        worldId="park"
        palette={theme.world.park}
        stopCount={3}
      />
    );
    expect(markup).toContain(theme.world.park.ground);
  });

  it('renders alternating distinct margin motifs between row 1 and row 3 across active worlds', () => {
    const w1 = renderToStaticMarkup(
      <WorldSceneryBackground worldId="home" palette={theme.world.home} stopCount={5} />
    );
    expect(w1).toContain('margin-row-1');
    expect(w1).toContain('margin-row-3');

    const w4 = renderToStaticMarkup(
      <WorldSceneryBackground worldId="park" palette={theme.world.park} stopCount={5} />
    );
    expect(w4).toContain('margin-row-1');
    expect(w4).toContain('margin-row-3');
  });

  it('renders preview world silhouettes for worlds 5 to 8 when expanded or preview', () => {
    const w5 = renderToStaticMarkup(<WorldSceneryBackground worldId="recall" palette={theme.world.home} isExpandedPreview />);
    expect(w5).toContain('preview-silhouette-recall');

    const w6 = renderToStaticMarkup(<WorldSceneryBackground worldId="cafe" palette={theme.world.sidewalk} isExpandedPreview />);
    expect(w6).toContain('preview-silhouette-cafe');

    const w7 = renderToStaticMarkup(<WorldSceneryBackground worldId="trails" palette={theme.world.urban} isExpandedPreview />);
    expect(w7).toContain('preview-silhouette-trails');

    const w8 = renderToStaticMarkup(<WorldSceneryBackground worldId="crowds" palette={theme.world.park} isExpandedPreview />);
    expect(w8).toContain('preview-silhouette-crowds');
  });
});

describe('WorldSceneryBackground - Touch & Accessibility Safety (Task 3.1 & 3.2)', () => {
  it('enforces pointerEvents="none", aria-hidden={true}, and accessibilityElementsHidden', () => {
    const markup = renderToStaticMarkup(
      <WorldSceneryBackground
        worldId="home"
        palette={theme.world.home}
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
    const markup = renderToStaticMarkup(<HomeEnvironmentalBackdrop palette={theme.world.home} />);
    expect(markup).toContain('environmental-backdrop-home');
    expect(markup).toContain(theme.world.home.soft);
    expect(markup).toContain(theme.world.home.deep);
  });

  it('renders World 2 suburban horizon, sidewalk curb, and clouds backdrop', () => {
    const markup = renderToStaticMarkup(<SidewalkEnvironmentalBackdrop palette={theme.world.sidewalk} />);
    expect(markup).toContain('environmental-backdrop-sidewalk');
    expect(markup).toContain(theme.world.sidewalk.soft);
    expect(markup).toContain(theme.world.sidewalk.ground);
  });

  it('renders World 3 urban cityscape skyline, antennas, and street grid backdrop', () => {
    const markup = renderToStaticMarkup(<UrbanEnvironmentalBackdrop palette={theme.world.urban} />);
    expect(markup).toContain('environmental-backdrop-urban');
    expect(markup).toContain(theme.world.urban.deep);
    expect(markup).toContain(theme.world.urban.soft);
  });

  it('renders World 4 park rolling hills, treeline, and sun backdrop', () => {
    const markup = renderToStaticMarkup(<ParkEnvironmentalBackdrop palette={theme.world.park} />);
    expect(markup).toContain('environmental-backdrop-park');
    expect(markup).toContain(theme.world.park.ground);
    expect(markup).toContain(theme.world.park.accent);
  });

  it('dispatches FullHeightEnvironmentalBackdrop by World id', () => {
    expect(renderToStaticMarkup(<FullHeightEnvironmentalBackdrop worldId="home" palette={theme.world.home} />)).toContain('environmental-backdrop-home');
    expect(renderToStaticMarkup(<FullHeightEnvironmentalBackdrop worldId="sidewalk" palette={theme.world.sidewalk} />)).toContain('environmental-backdrop-sidewalk');
    expect(renderToStaticMarkup(<FullHeightEnvironmentalBackdrop worldId="urban" palette={theme.world.urban} />)).toContain('environmental-backdrop-urban');
    expect(renderToStaticMarkup(<FullHeightEnvironmentalBackdrop worldId="park" palette={theme.world.park} />)).toContain('environmental-backdrop-park');
  });

  it('includes full-height environmental backdrop in active WorldSceneryBackground blocks', () => {
    const markup = renderToStaticMarkup(
      <WorldSceneryBackground worldId="home" palette={theme.world.home} stopCount={4} />
    );
    expect(markup).toContain('environmental-backdrop');
    expect(markup).toContain('environmental-backdrop-home');
  });
});

describe('WorldSceneryBackground - chosen by World, not by number', () => {
  it('keeps Home on its wainscoting backdrop and house landmark whatever its worldNumber', () => {
    const home = findWorld('home')!;
    for (const worldNumber of [1, 2, 7]) {
      const moved = { ...home, worldNumber };
      const markup = renderToStaticMarkup(<WorldSceneryBackground worldId={moved.id} palette={worldPalette(moved.id)} stopCount={4} />);
      expect(markup).toContain('environmental-backdrop-home');
      expect(markup).toContain('top-landmark-home');
    }
    expect(worldPalette('home')).toBe(theme.world.home);
  });

  it('draws the Basics World as a living room with a dog bed landmark, a sofa, a dog bed and a garden door', () => {
    const markup = renderToStaticMarkup(<WorldSceneryBackground worldId="basics" palette={theme.world.basics} stopCount={5} />);
    expect(markup).toContain('environmental-backdrop-basics');
    expect(markup).toContain('top-landmark-basics');
    expect(markup).toContain('basics-sofa');
    expect(markup).toContain('basics-dog-bed');
    expect(markup).toContain('basics-garden-door');
    expect(renderToStaticMarkup(<BasicsTopLandmark palette={theme.world.basics} />)).toContain(`height="${TOP_LANDMARK_HEIGHT}"`);
    expect(renderToStaticMarkup(<BasicsEnvironmentalBackdrop palette={theme.world.basics} />)).toContain(theme.world.basics.accent);
  });

  it('gives every playable World its own scenery and cycles the rest by trail index', () => {
    for (const id of ['basics', 'home', 'sidewalk', 'urban', 'park']) expect(sceneryOf(id)).toBe(id);
    for (const w of WORLDS.filter((w) => w.preview)) expect(['home', 'sidewalk', 'urban', 'park']).toContain(sceneryOf(w.id));
  });
});

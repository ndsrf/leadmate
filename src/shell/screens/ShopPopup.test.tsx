import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockAccessibilityInfo = {
  isScreenReaderEnabled: jest.fn().mockResolvedValue(false),
};

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    Pressable: (props: any) => {
      return React.createElement(
        'button',
        {
          ...props,
          onClick: props.onPress,
        },
        typeof props.children === 'function'
          ? props.children({ pressed: false })
          : props.children
      );
    },
    AccessibilityInfo: mockAccessibilityInfo,
  };
});

jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) => React.createElement('svg', props, props.children),
    Svg: (props: any) => React.createElement('svg', props, props.children),
    Path: (props: any) => React.createElement('path', props, props.children),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 0, left: 0, right: 0 }),
}));

import { ShopPopup } from './ShopPopup';

describe('ShopPopup component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockAccessibilityInfo.isScreenReaderEnabled.mockReset();
    mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(false);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders the popup text, action button, and close button', async () => {
    const onOpen = jest.fn();
    const onClose = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ShopPopup
          text="¿Quieres ver productos recomendados?"
          onOpen={onOpen}
          onClose={onClose}
        />
      );
    });

    const root = renderer!.root;
    const textNode = root.findByProps({ testID: 'shop-popup-text' });
    expect(textNode.props.children).toBe('¿Quieres ver productos recomendados?');

    const actionBtn = root.findByProps({ testID: 'shop-popup-action' });
    expect(actionBtn.props.accessibilityLabel).toBe('Ver');

    const closeBtn = root.findByProps({ testID: 'shop-popup-close' });
    expect(closeBtn.props.accessibilityLabel).toBe('Cerrar');
  });

  it('calls onOpen when action button is pressed', async () => {
    const onOpen = jest.fn();
    const onClose = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ShopPopup
          text="Oferta de tienda"
          onOpen={onOpen}
          onClose={onClose}
        />
      );
    });

    const actionBtn = renderer!.root.findByProps({ testID: 'shop-popup-action' });
    act(() => {
      actionBtn.props.onPress();
    });

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when close button is pressed', async () => {
    const onOpen = jest.fn();
    const onClose = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ShopPopup
          text="Oferta de tienda"
          onOpen={onOpen}
          onClose={onClose}
        />
      );
    });

    const closeBtn = renderer!.root.findByProps({ testID: 'shop-popup-close' });
    act(() => {
      closeBtn.props.onPress();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('automatically dismisses after 10 seconds when screen reader is disabled', async () => {
    const onClose = jest.fn();

    await act(async () => {
      ReactTestRenderer.create(
        <ShopPopup
          text="Auto dismiss test"
          onOpen={() => {}}
          onClose={onClose}
        />
      );
    });

    expect(onClose).not.toHaveBeenCalled();

    // Fast-forward 9.9 seconds: should still be open
    act(() => {
      jest.advanceTimersByTime(9900);
    });
    expect(onClose).not.toHaveBeenCalled();

    // Fast-forward past 10 seconds: should call onClose
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT automatically dismiss after 10 seconds when screen reader is enabled', async () => {
    mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(true);
    const onClose = jest.fn();

    await act(async () => {
      ReactTestRenderer.create(
        <ShopPopup
          text="Screen reader test"
          onOpen={() => {}}
          onClose={onClose}
        />
      );
    });

    // Fast-forward 15 seconds
    act(() => {
      jest.advanceTimersByTime(15000);
    });

    // Should still NOT be closed
    expect(onClose).not.toHaveBeenCalled();
  });

  it('clears the timer upon unmount so onClose is not called after unmounting', async () => {
    const onClose = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ShopPopup
          text="Unmount test"
          onOpen={() => {}}
          onClose={onClose}
        />
      );
    });

    act(() => {
      renderer!.unmount();
    });

    act(() => {
      jest.advanceTimersByTime(12000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('has non-blocking pointerEvents on wrapper and alert role on popup', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ShopPopup
          text="Accessibility & layout test"
          onOpen={() => {}}
          onClose={() => {}}
        />
      );
    });

    const root = renderer!.root;
    // Outer view has pointerEvents="box-none"
    const outerView = root.children[0] as ReactTestRenderer.ReactTestInstance;
    expect(outerView.props.pointerEvents).toBe('box-none');

    // Inner popup card has accessibilityRole="alert"
    const popupCard = root.findByProps({ testID: 'shop-popup' });
    expect(popupCard.props.accessibilityRole).toBe('alert');
    expect(popupCard.props.pointerEvents).toBe('auto');
  });
});

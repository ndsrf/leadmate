import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import type { TextKey } from '../../i18n';
import type { ResolvedShop } from '../content/resolver';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockLinking = {
  openURL: jest.fn().mockResolvedValue(true),
  canOpenURL: jest.fn().mockResolvedValue(true),
};

const mockBackHandler = {
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
};

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    Image: (props: any) => React.createElement('img', props),
    ScrollView: (props: any) => React.createElement('div', props, props.children),
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
    Linking: mockLinking,
    BackHandler: mockBackHandler,
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

import { ShopScreen } from './ShopScreen';

describe('ShopScreen component', () => {
  const mockCatalog: Record<string, string> = {
    'shop.title': 'Tienda',
    'shop.categoriesTitle': 'Categorías',
    'shop.productsTitle': 'Productos',
    'shop.empty': 'No hay productos disponibles por ahora.',
    'shop.buyAction': 'Comprar',
    'shop.buyOffline': 'Necesitas conexión a internet para abrir la tienda.',
    'shop.buyError': 'No se pudo abrir el enlace.',
    'shop.disclosure': 'Los enlaces son recomendaciones y LeadMate puede recibir una comisión cuando compras a través de un enlace de afiliado.',
    'shop.healthNote': 'Elige según el tamaño y la salud de tu perro; ante dudas consulta a tu veterinario.',
    'shop.priceApproximate': 'Precio orientativo',
    'cat.collares.title': 'Collares y arneses',
    'cat.collares.desc': 'Material para pasear con calma.',
    'sub.arneses.title': 'Arneses en Y',
    'sub.arneses.desc': 'Arneses ergonómicos antitirones.',
    'sub.empty.title': 'Subcategoría vacía',
    'sub.empty.desc': 'Sin productos por ahora.',
    'prod.arnes.name': 'Arnés Ergonómico Pro',
    'prod.arnes.desc': 'Arnés en Y acolchado con anilla frontal.',
    'prod.collar.name': 'Collar Básico',
    'prod.collar.desc': 'Collar sin precio de prueba.',
  };

  const mockTranslate = (key: TextKey) => mockCatalog[key] ?? key;

  const sampleShop: ResolvedShop = {
    categories: [
      {
        id: 'collares',
        title: 'cat.collares.title',
        description: 'cat.collares.desc',
        subcategories: [
          {
            id: 'arneses',
            title: 'sub.arneses.title',
            description: 'sub.arneses.desc',
            products: [
              {
                id: 'arnes-pro',
                name: 'prod.arnes.name',
                description: 'prod.arnes.desc',
                price: '34,95 €',
                priceCheckedAt: '2026-11',
                image: 'arnes.png',
                url: 'https://example.com/arnes-pro',
                source: 'manual',
              },
              {
                id: 'collar-basico',
                name: 'prod.collar.name',
                description: 'prod.collar.desc',
                // No price and no image
                url: 'https://example.com/collar-basico',
                source: 'manual',
              },
            ],
          },
          {
            id: 'empty-sub',
            title: 'sub.empty.title',
            description: 'sub.empty.desc',
            products: [], // 0 products: should be hidden!
          },
        ],
      },
    ],
    idToKind: {
      collares: 'category',
      arneses: 'subcategory',
      'empty-sub': 'subcategory',
      'arnes-pro': 'product',
      'collar-basico': 'product',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders categories on home level, fixed disclosure and health notes', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ShopScreen t={mockTranslate} onBack={() => {}} shop={sampleShop} />
      );
    });

    const root = renderer!.root;
    // Categories listed
    const catCard = root.findByProps({ testID: 'category-card-collares' });
    expect(catCard).toBeDefined();

    // Fixed Notes present
    expect(root.findByProps({ testID: 'shop-health-note' })).toBeDefined();
    expect(root.findByProps({ testID: 'shop-disclosure-note' })).toBeDefined();
  });

  it('browses categories -> subcategory -> product list -> product detail and pops back', async () => {
    const onBack = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ShopScreen t={mockTranslate} onBack={onBack} shop={sampleShop} />
      );
    });

    const root = renderer!.root;

    // 1. Home -> Tap Category
    const catCard = root.findByProps({ testID: 'category-card-collares' });
    act(() => {
      catCard.props.onPress();
    });

    // Subcategory card should now appear
    const subCard = root.findByProps({ testID: 'subcategory-card-arneses' });
    expect(subCard).toBeDefined();

    // Empty subcategory should be hidden!
    expect(() => root.findByProps({ testID: 'subcategory-card-empty-sub' })).toThrow();

    // 2. Category -> Tap Subcategory
    act(() => {
      subCard.props.onPress();
    });

    // Products list should appear
    expect(root.findByProps({ testID: 'product-card-arnes-pro' })).toBeDefined();
    expect(root.findByProps({ testID: 'product-card-collar-basico' })).toBeDefined();

    // 3. Subcategory -> Tap Product for Detail
    const prodTitlePressable = root.findByProps({ testID: 'product-title-arnes-pro' });
    act(() => {
      prodTitlePressable.props.onPress();
    });

    // Product detail elements
    expect(root.findByProps({ testID: 'product-detail-price' })).toBeDefined();
    expect(root.findByProps({ testID: 'buy-button-arnes-pro' })).toBeDefined();

    // 4. Pop back through levels
    const backBtn = root.findByProps({ testID: 'shop-back-button' });

    // Pop from product detail -> subcategory
    act(() => {
      backBtn.props.onPress();
    });
    expect(root.findByProps({ testID: 'product-card-arnes-pro' })).toBeDefined();

    // Pop from subcategory -> category
    act(() => {
      backBtn.props.onPress();
    });
    expect(root.findByProps({ testID: 'subcategory-card-arneses' })).toBeDefined();

    // Pop from category -> home
    act(() => {
      backBtn.props.onPress();
    });
    expect(root.findByProps({ testID: 'category-card-collares' })).toBeDefined();

    // Pop from home -> calls onBack()
    act(() => {
      backBtn.props.onPress();
    });
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders themed placeholder for products with missing picture without shifting layout', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ShopScreen
          t={mockTranslate}
          onBack={() => {}}
          shop={sampleShop}
          initialTarget={{ level: 'subcategory', id: 'arneses' }}
        />
      );
    });

    const root = renderer!.root;
    // collar-basico has no image
    const collarCard = root.findByProps({ testID: 'product-card-collar-basico' });
    const placeholder = collarCard.findByProps({ testID: 'product-image-placeholder' });
    expect(placeholder).toBeDefined();
    expect(placeholder.props.style.width).toBe(80);
    expect(placeholder.props.style.height).toBe(80);
  });

  it('falls back to themed placeholder when image load triggers onError', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ShopScreen
          t={mockTranslate}
          onBack={() => {}}
          shop={sampleShop}
          initialTarget={{ level: 'subcategory', id: 'arneses' }}
        />
      );
    });

    const root = renderer!.root;
    const arnesCard = root.findByProps({ testID: 'product-card-arnes-pro' });
    const img = arnesCard.findByProps({ testID: 'product-image' });
    expect(img).toBeDefined();

    act(() => {
      img.props.onError({ nativeEvent: { error: 'failed' } });
    });

    const placeholder = arnesCard.findByProps({ testID: 'product-image-placeholder' });
    expect(placeholder).toBeDefined();
    expect(placeholder.props.style.width).toBe(80);
    expect(placeholder.props.style.height).toBe(80);
  });

  describe('Buy Action (Task 5.2)', () => {
    it('opens product buy URL via Linking.openURL on success', async () => {
      const mockOpen = jest.fn().mockResolvedValue(true);
      const mockCanOpen = jest.fn().mockResolvedValue(true);

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await act(async () => {
        renderer = ReactTestRenderer.create(
          <ShopScreen
            t={mockTranslate}
            onBack={() => {}}
            shop={sampleShop}
            initialTarget={{ level: 'subcategory', id: 'arneses' }}
            openURL={mockOpen}
            canOpenURL={mockCanOpen}
          />
        );
      });

      const buyBtn = renderer!.root.findByProps({ testID: 'buy-button-arnes-pro' });
      await act(async () => {
        buyBtn.props.onPress();
      });

      expect(mockCanOpen).toHaveBeenCalledWith('https://example.com/arnes-pro');
      expect(mockOpen).toHaveBeenCalledWith('https://example.com/arnes-pro');
      // No error shown
      expect(() => renderer!.root.findByProps({ testID: 'shop-buy-error' })).toThrow();
    });

    it('displays offline error message when offline without opening link', async () => {
      const mockOpen = jest.fn();

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await act(async () => {
        renderer = ReactTestRenderer.create(
          <ShopScreen
            t={mockTranslate}
            onBack={() => {}}
            shop={sampleShop}
            initialTarget={{ level: 'subcategory', id: 'arneses' }}
            isOffline={true}
            openURL={mockOpen}
          />
        );
      });

      const buyBtn = renderer!.root.findByProps({ testID: 'buy-button-arnes-pro' });
      await act(async () => {
        buyBtn.props.onPress();
      });

      expect(mockOpen).not.toHaveBeenCalled();
      const err = renderer!.root.findByProps({ testID: 'shop-buy-error' });
      expect(err).toBeDefined();
      expect(err.props.children.props.children).toBe('Necesitas conexión a internet para abrir la tienda.');
    });

    it('displays error message gracefully when openURL fails', async () => {
      const mockOpen = jest.fn().mockRejectedValue(new Error('Cannot open URL'));

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await act(async () => {
        renderer = ReactTestRenderer.create(
          <ShopScreen
            t={mockTranslate}
            onBack={() => {}}
            shop={sampleShop}
            initialTarget={{ level: 'subcategory', id: 'arneses' }}
            openURL={mockOpen}
          />
        );
      });

      const buyBtn = renderer!.root.findByProps({ testID: 'buy-button-arnes-pro' });
      await act(async () => {
        buyBtn.props.onPress();
      });

      expect(mockOpen).toHaveBeenCalled();
      const err = renderer!.root.findByProps({ testID: 'shop-buy-error' });
      expect(err).toBeDefined();
      expect(err.props.children.props.children).toBe('No se pudo abrir el enlace.');
    });
  });
});

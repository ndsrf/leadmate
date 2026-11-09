import { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import type { Translate } from '../../i18n';
import { getActiveContent } from '../content/runtime';
import type {
  ResolvedCategory,
  ResolvedProduct,
  ResolvedShop,
  ResolvedSubcategory,
} from '../content/resolver';
import { usePalette } from '../ui/theme';

export type ShopLevel = 'home' | 'category' | 'subcategory' | 'product';

export interface ShopStackEntry {
  level: ShopLevel;
  id?: string;
}

export interface ShopScreenProps {
  t: Translate;
  onBack: () => void;
  shop?: ResolvedShop;
  initialTarget?: {
    level: ShopLevel;
    id?: string;
  };
  isOffline?: boolean;
  openURL?: (url: string) => any;
  canOpenURL?: (url: string) => any;
}

export function ShopScreen({
  t,
  onBack,
  shop: shopProp,
  initialTarget,
  isOffline = false,
  openURL,
  canOpenURL,
}: ShopScreenProps) {
  const insets = useSafeAreaInsets();
  const color = usePalette();
  const [buyError, setBuyError] = useState<string | null>(null);

  // Resolved shop from props or active runtime content
  const shop: ResolvedShop = useMemo(() => {
    if (shopProp) return shopProp;
    const active = getActiveContent();
    return active?.resolved?.shop ?? { categories: [], idToKind: {} };
  }, [shopProp]);

  // Compute initial stack based on initialTarget
  const initialStack = useMemo<ShopStackEntry[]>(() => {
    if (!initialTarget || initialTarget.level === 'home' || !initialTarget.id) {
      return [{ level: 'home' }];
    }

    const { level, id } = initialTarget;

    if (level === 'category') {
      return [{ level: 'home' }, { level: 'category', id }];
    }

    if (level === 'subcategory') {
      const parentCat = shop.categories.find((c) =>
        c.subcategories.some((s) => s.id === id)
      );
      if (parentCat) {
        return [
          { level: 'home' },
          { level: 'category', id: parentCat.id },
          { level: 'subcategory', id },
        ];
      }
      return [{ level: 'home' }, { level: 'subcategory', id }];
    }

    if (level === 'product') {
      for (const cat of shop.categories) {
        for (const sub of cat.subcategories) {
          if (sub.products.some((p) => p.id === id)) {
            return [
              { level: 'home' },
              { level: 'category', id: cat.id },
              { level: 'subcategory', id: sub.id },
              { level: 'product', id },
            ];
          }
        }
      }
      return [{ level: 'home' }, { level: 'product', id }];
    }

    return [{ level: 'home' }];
  }, [initialTarget, shop]);

  const [stack, setStack] = useState<ShopStackEntry[]>(initialStack);

  const current = stack[stack.length - 1];

  // Hardware / System Back handling
  useEffect(() => {
    const onHardwareBack = () => {
      if (stack.length > 1) {
        setStack((prev) => prev.slice(0, -1));
        return true;
      }
      onBack();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [stack.length, onBack]);

  const handlePop = () => {
    if (stack.length > 1) {
      setStack((prev) => prev.slice(0, -1));
    } else {
      onBack();
    }
  };

  const pushLevel = (level: ShopLevel, id?: string) => {
    setBuyError(null);
    setStack((prev) => [...prev, { level, id }]);
  };

  // Buy hand-off action
  const handleBuy = async (url: string) => {
    setBuyError(null);

    if (isOffline) {
      setBuyError(t('shop.buyOffline'));
      return;
    }

    try {
      const can = canOpenURL ?? Linking.canOpenURL;
      const open = openURL ?? Linking.openURL;

      const isSupported = can ? await can(url) : true;
      if (!isSupported) {
        setBuyError(t('shop.buyError'));
        return;
      }

      await open(url);
    } catch {
      setBuyError(t('shop.buyError'));
    }
  };

  // Find active items
  let activeCategory: ResolvedCategory | undefined;
  let activeSubcategory: ResolvedSubcategory | undefined;
  let activeProduct: ResolvedProduct | undefined;

  if (current.level === 'category' && current.id) {
    activeCategory = shop.categories.find((c) => c.id === current.id);
  } else if (current.level === 'subcategory' && current.id) {
    for (const c of shop.categories) {
      const found = c.subcategories.find((s) => s.id === current.id);
      if (found) {
        activeSubcategory = found;
        activeCategory = c;
        break;
      }
    }
  } else if (current.level === 'product' && current.id) {
    for (const c of shop.categories) {
      for (const s of c.subcategories) {
        const found = s.products.find((p) => p.id === current.id);
        if (found) {
          activeProduct = found;
          activeSubcategory = s;
          activeCategory = c;
          break;
        }
      }
      if (activeProduct) break;
    }
  }

  // Titles
  const headerTitle =
    current.level === 'home'
      ? t('shop.title')
      : current.level === 'category' && activeCategory
      ? t(activeCategory.title)
      : current.level === 'subcategory' && activeSubcategory
      ? t(activeSubcategory.title)
      : current.level === 'product' && activeProduct
      ? t(activeProduct.name)
      : t('shop.title');

  return (
    <View
      testID="shop-screen"
      style={{
        flex: 1,
        backgroundColor: color.bg,
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      {/* Header Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderColor: color.edge,
          backgroundColor: color.surface,
          gap: 12,
        }}
      >
        <Pressable
          testID="shop-back-button"
          onPress={handlePop}
          accessibilityRole="button"
          accessibilityLabel={t('shop.back')}
          hitSlop={8}
          style={({ pressed }) => ({
            padding: 6,
            borderRadius: 8,
            backgroundColor: pressed ? color.surfaceSunken : 'transparent',
          })}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 19l-7-7 7-7"
              stroke={color.ink}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>

        <Text
          testID="shop-header-title"
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: color.ink,
            flex: 1,
          }}
        >
          {headerTitle}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          maxWidth: 600,
          width: '100%',
          alignSelf: 'center',
          gap: 16,
        }}
      >
        {/* Error Banner */}
        {buyError && (
          <View
            testID="shop-buy-error"
            accessibilityRole="alert"
            style={{
              backgroundColor: color.danger,
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: color.outline,
            }}
          >
            <Text style={{ color: color.dangerText, fontSize: 13, fontWeight: '600' }}>
              {buyError}
            </Text>
          </View>
        )}

        {/* Level: HOME (Category List) */}
        {current.level === 'home' && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: color.inkMuted }}>
              {t('shop.categoriesTitle')}
            </Text>

            {shop.categories.length === 0 ? (
              <Text testID="shop-empty-message" style={{ color: color.inkMuted, fontSize: 14 }}>
                {t('shop.empty')}
              </Text>
            ) : (
              shop.categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  testID={`category-card-${cat.id}`}
                  onPress={() => pushLevel('category', cat.id)}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    backgroundColor: color.surface,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: color.edge,
                    opacity: pressed ? 0.8 : 1,
                    shadowColor: color.outline,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  })}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: color.ink, marginBottom: 4 }}>
                    {t(cat.title)}
                  </Text>
                  <Text style={{ fontSize: 13, color: color.inkMuted, lineHeight: 18 }}>
                    {t(cat.description)}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* Level: CATEGORY (Subcategory List) */}
        {current.level === 'category' && activeCategory && (
          <View style={{ gap: 12 }}>
            <View style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: 13, color: color.inkMuted, lineHeight: 18 }}>
                {t(activeCategory.description)}
              </Text>
            </View>

            {/* Filter: hide subcategories with 0 buyable products */}
            {activeCategory.subcategories
              .filter((sub) => sub.products.length > 0)
              .map((sub) => (
                <Pressable
                  key={sub.id}
                  testID={`subcategory-card-${sub.id}`}
                  onPress={() => pushLevel('subcategory', sub.id)}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    backgroundColor: color.surface,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: color.edge,
                    opacity: pressed ? 0.8 : 1,
                    gap: 4,
                  })}
                >
                  <Text style={{ fontSize: 15, fontWeight: '700', color: color.ink }}>
                    {t(sub.title)}
                  </Text>
                  <Text style={{ fontSize: 13, color: color.inkMuted, lineHeight: 18 }}>
                    {t(sub.description)}
                  </Text>
                </Pressable>
              ))}
          </View>
        )}

        {/* Level: SUBCATEGORY (Product List) */}
        {current.level === 'subcategory' && activeSubcategory && (
          <View style={{ gap: 12 }}>
            <View style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: 13, color: color.inkMuted, lineHeight: 18 }}>
                {t(activeSubcategory.description)}
              </Text>
            </View>

            {activeSubcategory.products.map((prod) => (
              <View
                key={prod.id}
                testID={`product-card-${prod.id}`}
                style={{
                  backgroundColor: color.surface,
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: color.edge,
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                {/* Product Picture or Themed Placeholder */}
                {prod.image ? (
                  <Image
                    testID="product-image"
                    source={{ uri: prod.image }}
                    style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: color.surfaceSunken }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    testID="product-image-placeholder"
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 12,
                      backgroundColor: color.surfaceSunken,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M4 10h16l-2 10H6L4 10zm4 0V7a4 4 0 118 0v3"
                        stroke={color.ink}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                )}

                <View style={{ flex: 1, gap: 4 }}>
                  <Pressable
                    testID={`product-title-${prod.id}`}
                    onPress={() => pushLevel('product', prod.id)}
                  >
                    <Text style={{ fontSize: 15, fontWeight: '700', color: color.ink }}>
                      {t(prod.name)}
                    </Text>
                  </Pressable>

                  <Text
                    numberOfLines={2}
                    style={{ fontSize: 12, color: color.inkMuted, lineHeight: 16 }}
                  >
                    {t(prod.description)}
                  </Text>

                  {/* Price with "precio orientativo" label and month */}
                  {prod.price && (
                    <Text
                      testID="product-price-label"
                      style={{ fontSize: 12, color: color.inkMuted, fontWeight: '500' }}
                    >
                      {t('shop.priceApproximate')}: {prod.price}
                      {prod.priceCheckedAt ? ` · ${prod.priceCheckedAt}` : ''}
                    </Text>
                  )}

                  <View style={{ marginTop: 4, flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      testID={`buy-button-${prod.id}`}
                      onPress={() => handleBuy(prod.url)}
                      accessibilityRole="button"
                      accessibilityLabel={`${t('shop.buyAction')} ${t(prod.name)}`}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? color.brandDeep : color.brand,
                        paddingHorizontal: 16,
                        paddingVertical: 7,
                        borderRadius: 16,
                        alignItems: 'center',
                      })}
                    >
                      <Text style={{ color: color.onBrand, fontWeight: '700', fontSize: 13 }}>
                        {t('shop.buyAction')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Level: PRODUCT (Detail View) */}
        {current.level === 'product' && activeProduct && (
          <View style={{ gap: 16, backgroundColor: color.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: color.edge }}>
            {/* Main Picture or Placeholder */}
            {activeProduct.image ? (
              <Image
                testID="product-detail-image"
                source={{ uri: activeProduct.image }}
                style={{ width: '100%', height: 220, borderRadius: 16, backgroundColor: color.surfaceSunken }}
                resizeMode="contain"
              />
            ) : (
              <View
                testID="product-image-placeholder"
                style={{
                  width: '100%',
                  height: 180,
                  borderRadius: 16,
                  backgroundColor: color.surfaceSunken,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M4 10h16l-2 10H6L4 10zm4 0V7a4 4 0 118 0v3"
                    stroke={color.ink}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            )}

            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: color.ink }}>
                {t(activeProduct.name)}
              </Text>

              {activeProduct.price && (
                <Text
                  testID="product-detail-price"
                  style={{ fontSize: 14, color: color.inkMuted, fontWeight: '600' }}
                >
                  {t('shop.priceApproximate')}: {activeProduct.price}
                  {activeProduct.priceCheckedAt ? ` · ${activeProduct.priceCheckedAt}` : ''}
                </Text>
              )}

              <Text style={{ fontSize: 14, color: color.inkMuted, lineHeight: 20 }}>
                {t(activeProduct.description)}
              </Text>

              <Pressable
                testID={`buy-button-${activeProduct.id}`}
                onPress={() => handleBuy(activeProduct!.url)}
                accessibilityRole="button"
                accessibilityLabel={`${t('shop.buyAction')} ${t(activeProduct.name)}`}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? color.brandDeep : color.brand,
                  paddingVertical: 12,
                  borderRadius: 16,
                  alignItems: 'center',
                  marginTop: 8,
                })}
              >
                <Text style={{ color: color.onBrand, fontWeight: '700', fontSize: 15 }}>
                  {t('shop.buyAction')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Fixed Notes on All Shop Screens (Health note & Disclosure) */}
        <View style={{ gap: 8, marginTop: 12 }}>
          {/* Health Note */}
          <View
            testID="shop-health-note"
            style={{
              backgroundColor: color.surfaceSunken,
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: color.edge,
            }}
          >
            <Text style={{ fontSize: 12, color: color.inkMuted, lineHeight: 17 }}>
              {t('shop.healthNote')}
            </Text>
          </View>

          {/* Disclosure Note */}
          <View
            testID="shop-disclosure-note"
            style={{
              backgroundColor: color.surfaceSunken,
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: color.edge,
            }}
          >
            <Text style={{ fontSize: 12, color: color.inkMuted, lineHeight: 17 }}>
              {t('shop.disclosure')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

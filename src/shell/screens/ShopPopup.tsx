import { useEffect } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { usePalette } from '../ui/theme';

export interface ShopPopupProps {
  text: string;
  onOpen: () => void;
  onClose: () => void;
  actionLabel?: string;
  closeLabel?: string;
  testID?: string;
  /** In milliseconds, defaults to 10000 (10 seconds). Set to 0 to disable. */
  autoDismissMs?: number;
}

/**
 * Non-blocking floating toast popup offering the Shop or showing a contextual trouble recommendation.
 * Pinned at the top of the screen; only the popup itself accepts touch events.
 * Automatically dismisses after 10s unless a screen reader is active.
 */
export function ShopPopup({
  text,
  onOpen,
  onClose,
  actionLabel = 'Ver',
  closeLabel = 'Cerrar',
  testID = 'shop-popup',
  autoDismissMs = 10000,
}: ShopPopupProps) {
  const insets = useSafeAreaInsets();
  const color = usePalette();

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (autoDismissMs > 0) {
      AccessibilityInfo.isScreenReaderEnabled()
        .then((enabled) => {
          if (!mounted) return;
          if (!enabled) {
            timer = setTimeout(() => {
              if (mounted) {
                onClose();
              }
            }, autoDismissMs);
          }
        })
        .catch(() => {
          if (mounted) {
            timer = setTimeout(() => {
              if (mounted) {
                onClose();
              }
            }, autoDismissMs);
          }
        });
    }

    return () => {
      mounted = false;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [autoDismissMs, onClose]);

  const topOffset = Math.max(insets?.top ?? 0, 12);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        paddingTop: topOffset,
        paddingHorizontal: 16,
        alignItems: 'center',
      }}
    >
      <View
        testID={testID}
        pointerEvents="auto"
        accessible={true}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: color.surface,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: color.edge,
          paddingVertical: 10,
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: color.outline,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
          gap: 10,
        }}
      >
        {/* Basket Icon */}
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: color.surfaceSunken,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M4 10h16l-2 10H6L4 10zm4 0V7a4 4 0 118 0v3"
              stroke={color.ink}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        {/* Message Text */}
        <Text
          testID="shop-popup-text"
          style={{
            flex: 1,
            fontSize: 13,
            lineHeight: 18,
            color: color.ink,
            fontWeight: '500',
          }}
        >
          {text}
        </Text>

        {/* Open / Action Button */}
        <Pressable
          testID="shop-popup-action"
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => ({
            backgroundColor: pressed ? color.brandDeep : color.brand,
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
          })}
        >
          <Text
            style={{
              color: color.onBrand,
              fontWeight: '700',
              fontSize: 13,
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>

        {/* Close Button */}
        <Pressable
          testID="shop-popup-close"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          hitSlop={8}
          style={({ pressed }) => ({
            padding: 4,
            opacity: pressed ? 0.6 : 1,
            justifyContent: 'center',
            alignItems: 'center',
          })}
        >
          <Text
            style={{
              fontSize: 16,
              lineHeight: 18,
              color: color.inkMuted,
              fontWeight: '600',
            }}
          >
            ✕
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

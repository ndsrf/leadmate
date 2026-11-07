import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Translate } from '../../i18n';
import { getContentProgress, subscribeContentProgress } from '../content/progress';
import { Migas } from './art';
import { ProgressBar } from './components';
import { useMotionGate } from './useMotionGate';

/** Migas, wiggling from side to side while content downloads; still under reduced motion. */
function DancingMigas() {
  const wiggle = useRef(new Animated.Value(0)).current;
  const moving = useMotionGate();
  useEffect(() => {
    if (!moving) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wiggle, { toValue: 1, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: -1, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [moving, wiggle]);
  const rotate = wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] });
  const lift = wiggle.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, -4, 0] });
  return (
    <Animated.View style={{ transform: [{ translateY: lift }, { rotate }] }}>
      <Migas width={56} />
    </Animated.View>
  );
}

/**
 * A bar across the top of the app while a Content Pack downloads (a channel switch or an update found on launch),
 * so the wait is not silent. It never takes touches, and shows nothing when no download is running.
 */
export function ContentUpdateBanner({ t }: { t: Translate }) {
  const progress = useSyncExternalStore(subscribeContentProgress, getContentProgress);
  const insets = useSafeAreaInsets();
  if (!progress.active) return null;
  return (
    <View
      testID="content-update-banner"
      pointerEvents="none"
      accessibilityRole="progressbar"
      accessibilityLiveRegion="polite"
      accessibilityLabel={t('content.updating')}
      accessibilityValue={{ min: 0, max: progress.total, now: progress.done }}
      className="absolute left-0 right-0 flex-row items-center bg-surface px-4 py-2"
      style={{ top: 0, paddingTop: insets.top + 8, zIndex: 50, elevation: 50 }}
    >
      <DancingMigas />
      <View className="ml-3 flex-1">
        <Text className="mb-1 font-display text-body text-ink">{t('content.updating')}</Text>
        <ProgressBar value={progress.done} max={Math.max(progress.total, 1)} />
      </View>
    </View>
  );
}

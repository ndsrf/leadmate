import { useEffect } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, useAnimatedProps, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import type { Translate } from '../../i18n';
import { LeadLine, MeadowBackdrop, Migas } from '../ui/art';
import { Raised } from '../ui/components';
import { color, theme } from '../ui/theme';
import { useMotion } from '../ui/useMotion';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const LOADER_PATH = 'M8 14H50C64 14 70 38 80 38S96 14 110 14H152';

/** The Lead drawing itself while the app loads; under reduced motion it is a static, fully drawn line. */
function LoaderLead({ animate }: { animate: boolean }) {
  const offset = useSharedValue(animate ? 200 : 0);
  useEffect(() => {
    if (!animate) {
      offset.value = 0;
      return;
    }
    offset.value = withRepeat(withTiming(0, { duration: theme.motion.duration.loop + 800, easing: Easing.inOut(Easing.ease) }), -1, false);
  }, [animate, offset]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  return (
    <Svg width={72} height={24} viewBox="0 0 160 50" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d={LOADER_PATH} fill="none" stroke={color.edge} strokeWidth={7} strokeLinecap="round" />
      <AnimatedPath d={LOADER_PATH} fill="none" stroke={color.ink} strokeWidth={7} strokeLinecap="round" strokeDasharray="200" animatedProps={props} />
    </Svg>
  );
}

export function SplashScreen({ t, onShown }: { t: Translate; onShown?: () => void }) {
  const { reduced, transition } = useMotion();
  const { width, height } = useWindowDimensions();
  const entering = reduced ? FadeIn.duration(transition.durationMs) : FadeInDown.duration(transition.durationMs);
  const exiting = FadeOut.duration(transition.durationMs);
  const migasWidth = Math.min(180, width * 0.5);

  return (
    <Animated.View entering={entering} exiting={exiting} pointerEvents="none" onLayout={onShown} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: color.sky }}>
      <MeadowBackdrop width={width} height={height} />
      <View className="items-center" style={{ position: 'absolute', left: 0, right: 0, top: Math.max(64, height * 0.114) }}>
        <Text className="font-display text-ink" style={{ fontSize: 62, lineHeight: 68 }} accessibilityRole="header">
          {t('app.title')}
        </Text>
        <LeadLine width={Math.min(310, width - 80)} className="mt-1" />
      </View>
      <View style={{ position: 'absolute', left: (width - migasWidth) / 2, top: height * 0.615 }}>
        <Migas width={migasWidth} />
      </View>
      <View className="items-center" style={{ position: 'absolute', left: 0, right: 0, bottom: 56 }}>
        <Raised fill={color.surface} radius={theme.radius.pill} offset={theme.depth.sm.x} faceStyle={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 10 }}>
          <LoaderLead animate={!reduced} />
          <Text className="font-display text-body text-ink">{t('splash.tagline')}</Text>
        </Raised>
      </View>
    </Animated.View>
  );
}

import { useEffect } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, FadeOut, useAnimatedProps, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import type { Translate } from '../../i18n';
import { Button } from '../Overlays';
import { LeadLine, MeadowBackdrop, Migas } from '../ui/art';
import { Raised } from '../ui/components';
import { color, theme } from '../ui/theme';
import { useMotion } from '../ui/useMotion';
import { useLive } from '../ui/useAppActive';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const LOADER_PATH = 'M8 14H50C64 14 70 38 80 38S96 14 110 14H152';

/**
 * The Lead drawing itself while the app loads; under reduced motion, or while the app is in the background, it is a
 * static, fully drawn line.
 */
function LoaderLead({ animate }: { animate: boolean }) {
  const live = useLive();
  const offset = useSharedValue(animate ? 200 : 0);
  useEffect(() => {
    if (!animate || !live) {
      cancelAnimation(offset);
      offset.value = 0;
      return;
    }
    offset.value = 200;
    offset.value = withRepeat(withTiming(0, { duration: theme.motion.duration.loop + 800, easing: Easing.inOut(Easing.ease) }), -1, false);
    return () => cancelAnimation(offset);
  }, [animate, live, offset]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  return (
    <Svg width={72} height={24} viewBox="0 0 160 50" aria-hidden>
      <Path d={LOADER_PATH} fill="none" stroke={color.edge} strokeWidth={7} strokeLinecap="round" />
      <AnimatedPath d={LOADER_PATH} fill="none" stroke={color.ink} strokeWidth={7} strokeLinecap="round" strokeDasharray="200" animatedProps={props} />
    </Svg>
  );
}

/**
 * The branded screen shown on every cold start. For a new user, once loading is done, the same screen
 * stays up and its loader gives way to the welcome actions: Start, and a small link for an existing account.
 */
export function SplashScreen({ t, onShown, actions }: { t: Translate; onShown?: () => void; actions?: { onStart: () => void; onLogIn?: () => void } }) {
  const { reduced, transition } = useMotion();
  const { width, height } = useWindowDimensions();
  // a plain fade: a sliding entrance would uncover what is underneath (the Stage view) while it moves
  const entering = FadeIn.duration(transition.durationMs);
  const exiting = FadeOut.duration(transition.durationMs);
  // Migas takes the whole free space between the title and the bottom actions, as wide as the screen allows
  const titleTop = Math.max(64, height * 0.114);
  const slotTop = titleTop + 110;
  const slotBottom = actions ? 170 : 130;
  const migasWidth = Math.max(120, Math.min(width, ((height - slotTop - slotBottom) * 210) / 150));

  return (
    <Animated.View entering={entering} exiting={exiting} pointerEvents={actions ? 'box-none' : 'none'} onLayout={onShown} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: color.sky }}>
      <MeadowBackdrop width={width} height={height} />
      <View className="items-center" style={{ position: 'absolute', left: 0, right: 0, top: titleTop }}>
        <Text className="font-display text-ink" style={{ fontSize: 62, lineHeight: 68 }} accessibilityRole="header">
          {t('app.title')}
        </Text>
        <LeadLine width={Math.min(310, width - 80)} className="mt-1" />
      </View>
      <View className="items-center justify-center" style={{ position: 'absolute', left: 0, right: 0, top: slotTop, bottom: slotBottom }}>
        <Migas width={migasWidth} />
      </View>
      {actions ? (
        <View className="items-center px-6" style={{ position: 'absolute', left: 0, right: 0, bottom: 40 }}>
          <View style={{ width: '100%', maxWidth: 360 }}>
            <Button label={t('welcome.start')} onPress={actions.onStart} />
            {actions.onLogIn && (
              <Pressable onPress={actions.onLogIn} accessibilityRole="link" className="mt-1 items-center justify-center" style={{ minHeight: 44 }}>
                <Text className="text-body text-ink underline">{t('welcome.haveAccount')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <View className="items-center" style={{ position: 'absolute', left: 0, right: 0, bottom: 56 }}>
          <Raised fill={color.surface} radius={theme.radius.pill} offset={theme.depth.sm.x} faceStyle={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 10 }}>
            <LoaderLead animate={!reduced} />
            <Text className="font-display text-body text-ink">{t('splash.tagline')}</Text>
          </Raised>
        </View>
      )}
    </Animated.View>
  );
}

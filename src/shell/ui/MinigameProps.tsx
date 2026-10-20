import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import type { Translate } from '../../i18n';
import { leashSegments } from './canine';
import { color } from './theme';
import { useMotion } from './useMotion';

/** The entrance door of the Doorbell Mat; while the bell rings a chime ripple pulses out of it. */
export function DoorProp({ t, ringing }: { t: Translate; ringing: boolean }) {
  const { reduced } = useMotion();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (ringing && !reduced) pulse.value = withRepeat(withTiming(1, { duration: 700 }), -1, false);
    else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
    return () => cancelAnimation(pulse);
  }, [ringing, reduced, pulse]);
  const ripple = useAnimatedStyle(() => ({ opacity: ringing ? (reduced ? 0.6 : 0.7 * (1 - pulse.value)) : 0, transform: [{ scale: 1 + pulse.value * 0.8 }] }));
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={t(ringing ? 'minigame.doorRinging' : 'minigame.door')} style={{ width: 70, height: 100, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Animated.View style={[{ position: 'absolute', top: 10, right: -6, width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: color.accent }, ripple]} />
      <View style={{ width: 56, height: 96, borderRadius: 6, backgroundColor: color.quiet, borderWidth: 3, borderColor: color.quietEdge }}>
        <View style={{ position: 'absolute', right: 6, top: 46, width: 6, height: 6, borderRadius: 3, backgroundColor: color.accent }} />
      </View>
    </View>
  );
}

/** The target mat; it lights up while the Dog is settling on it. */
export function MatProp({ t, active }: { t: Translate; active: boolean }) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('minigame.mat')}
      style={{ width: 130, height: 14, borderRadius: 7, backgroundColor: active ? color.brand : color.surfaceHigh, borderBottomWidth: 3, borderBottomColor: active ? color.brandEdge : color.quietEdge }}
    />
  );
}

const LEASH_W = 190;
const LEASH_H = 70;

/** The leash between the Handler's hand and the Dog's collar: a Bezier that sags when slack and runs straight when taut. */
export function LeashProp({ t, tension }: { t: Translate; tension: number }) {
  const segments = leashSegments(tension, { x: 8, y: 12 }, { x: LEASH_W - 8, y: 12 }, 44);
  const taut = tension >= 0.5;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={t(taut ? 'minigame.leashTaut' : 'minigame.leashSlack')} style={{ width: LEASH_W, height: LEASH_H, alignSelf: 'center' }}>
      {segments.map((s, i) => (
        <View
          key={i}
          style={{ position: 'absolute', left: s.x - s.length / 2, top: s.y - 1.5, width: s.length + 1, height: 3, borderRadius: 2, backgroundColor: taut ? color.danger : color.inkMuted, transform: [{ rotate: `${s.angleDeg}deg` }] }}
        />
      ))}
      <View style={{ position: 'absolute', left: 0, top: 4, width: 14, height: 18, borderRadius: 4, backgroundColor: color.info }} />
    </View>
  );
}

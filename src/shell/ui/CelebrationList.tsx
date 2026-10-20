import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import type { Translate } from '../../i18n';
import { celebrationSound, celebrationText } from '../celebrationText';
import type { Celebration } from '../celebrations';
import { feedback } from './feedback';
import { useMotion } from './useMotion';

/**
 * The celebrations of one completion, shown when it mounts: one sound for the whole group (the
 * unlock jingle if any is an unlock), a pop-in (a fade under reduced motion). The list comes from a
 * single diff computed when the result opened, so mounting again never invents new ones.
 */
export function CelebrationList({ t, celebrations }: { t: Translate; celebrations: readonly Celebration[] }) {
  const { reduced } = useMotion();
  useEffect(() => {
    if (celebrations.length === 0) return;
    if (celebrations.some((c) => celebrationSound(c) === 'unlock')) feedback.unlock();
    else feedback.success();
    // once per mount: the list is fixed for this result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      {celebrations.map((c, i) => (
        <Animated.View key={`${c.type}-${i}`} entering={reduced ? FadeIn.duration(150) : ZoomIn.duration(250).delay(i * 120)} className="mb-3 rounded-game-lg bg-accent p-3" accessibilityRole="alert">
          <Text className="text-center font-display text-lg text-onAccent">{celebrationText(c, t)}</Text>
        </Animated.View>
      ))}
    </>
  );
}

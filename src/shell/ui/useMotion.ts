import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { motionValues, type MotionValues } from './motion';

/** The OS reduced-motion preference (native and web) as the motion values every animated component reads. */
export function useMotion(): MotionValues {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => alive && setReduced(on))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return motionValues(reduced);
}

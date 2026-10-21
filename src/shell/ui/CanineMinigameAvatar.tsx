import { View } from 'react-native';
import type { Translate } from '../../i18n';
import { postureSpec, type CaninePosture } from './canine';
import { color } from './theme';

const W = 120;
const H = 90;

/** The Dog of a static Minigame, drawn from plain views so it stays crisp and costs nothing per frame. */
export function CanineMinigameAvatar({ t, posture }: { t: Translate; posture: CaninePosture }) {
  const spec = postureSpec(posture);
  const bodyH = 34 * spec.height;
  const headY = H - bodyH - 30;
  const tailRotate = spec.tail === 'up' ? '-50deg' : spec.tail === 'wag' ? '-25deg' : '25deg';
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={t(spec.label)} style={{ width: W, height: H, alignSelf: 'center' }}>
      <View style={{ position: 'absolute', left: 0, bottom: 0, width: W, height: H, transform: [{ rotate: `${spec.leanDeg}deg` }] }}>
        <View style={{ position: 'absolute', left: 8, bottom: 6, width: 70, height: bodyH, borderRadius: 18, backgroundColor: color.accent }} />
        <View style={{ position: 'absolute', left: 0, bottom: 8 + bodyH * 0.4, width: 26, height: 7, borderRadius: 4, backgroundColor: color.accentEdge, transform: [{ rotate: tailRotate }] }} />
        <View style={{ position: 'absolute', left: 66, top: headY, width: 40, height: 32, borderRadius: 16, backgroundColor: color.accent }}>
          <View style={{ position: 'absolute', left: 6, top: spec.earsUp ? -10 : 4, width: 10, height: 16, borderRadius: 5, backgroundColor: color.accentEdge }} />
          <View style={{ position: 'absolute', left: 26, top: 9, width: 5, height: 5, borderRadius: 3, backgroundColor: color.onAccent }} />
          <View style={{ position: 'absolute', left: 30, top: 18, width: spec.mouthOpen ? 10 : 8, height: spec.mouthOpen ? 9 : 3, borderRadius: 3, backgroundColor: spec.mouthOpen ? color.danger : color.onAccent }} />
        </View>
      </View>
    </View>
  );
}

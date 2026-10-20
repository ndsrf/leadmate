import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMotion } from '../ui/useMotion';
import { theme } from '../ui/theme';

/**
 * A full-screen page over the simulation, scrollable, with a readable column on wide screens, the
 * safe-area insets respected and a short entrance (a fade alone under reduced motion). The entrance
 * never disables touches, so the new screen takes input at once.
 */
export function Screen({ children, header, scrollRef }: { children: React.ReactNode; /** A fixed bar above the scrolling content. */ header?: React.ReactNode; scrollRef?: React.Ref<ScrollView> }) {
  const insets = useSafeAreaInsets();
  const { transition } = useMotion();
  const entering = transition.kind === 'fade' ? FadeIn.duration(transition.durationMs) : FadeInDown.duration(transition.durationMs);
  return (
    <View className="absolute inset-0 bg-bg">
      <Animated.View entering={entering} style={{ flex: 1 }}>
        {header && (
          <View className="items-center bg-bg" style={{ paddingTop: insets.top + theme.space.sm, paddingLeft: insets.left + theme.space.md, paddingRight: insets.right + theme.space.md, paddingBottom: theme.space.sm }}>
            <View style={{ width: '100%', maxWidth: theme.readableWidth }}>{header}</View>
          </View>
        )}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            alignItems: 'center',
            paddingTop: header ? theme.space.sm : insets.top + theme.space.md,
            paddingBottom: insets.bottom + theme.space.lg,
            paddingLeft: insets.left + theme.space.md,
            paddingRight: insets.right + theme.space.md,
          }}
        >
          <View style={{ width: '100%', maxWidth: theme.readableWidth }}>{children}</View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

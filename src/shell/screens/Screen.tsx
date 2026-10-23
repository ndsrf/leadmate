import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMotion } from '../ui/useMotion';
import { theme } from '../ui/theme';

/**
 * A full-screen page over the simulation, scrollable, with a readable column on wide screens, the
 * safe-area insets respected and a short entrance (a fade alone under reduced motion). The entrance
 * never disables touches, so the new screen takes input at once.
 */
export function Screen({ children, header, scrollRef, onScroll }: { children: React.ReactNode; /** A fixed bar above the scrolling content. */ header?: React.ReactNode; scrollRef?: React.Ref<ScrollView>; onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void }) {
  const insets = useSafeAreaInsets();
  const { transition } = useMotion();
  const entering = transition.kind === 'fade' ? FadeIn.duration(transition.durationMs) : FadeInDown.duration(transition.durationMs);
  return (
    <View className="absolute inset-0 bg-bg">
      <Animated.View entering={entering} style={{ flex: 1 }}>
        {header && (
          <View className="items-center bg-bg" style={{ paddingTop: insets.top + theme.space[2], paddingLeft: insets.left + theme.space[4], paddingRight: insets.right + theme.space[4], paddingBottom: theme.space[2] }}>
            <View style={{ width: '100%', maxWidth: theme.size.readableWidth }}>{header}</View>
          </View>
        )}
        <ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={onScroll ? 32 : undefined}
          contentContainerStyle={{
            alignItems: 'center',
            paddingTop: header ? theme.space[2] : insets.top + theme.space[4],
            paddingBottom: insets.bottom + theme.space[6],
            paddingLeft: insets.left + theme.space[4],
            paddingRight: insets.right + theme.space[4],
          }}
        >
          <View style={{ width: '100%', maxWidth: theme.size.readableWidth }}>{children}</View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

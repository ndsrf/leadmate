import { ScrollView, View } from 'react-native';

/** A full-screen page over the simulation, scrollable, with a readable column on wide screens. */
export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <View className="absolute inset-0 bg-slate-900">
      <ScrollView contentContainerClassName="items-center p-4">
        <View className="w-full max-w-md">{children}</View>
      </ScrollView>
    </View>
  );
}

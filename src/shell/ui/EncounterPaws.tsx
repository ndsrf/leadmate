import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme, usePalette } from './theme';

/** The Paw glyph (a pad and four toes) in a 38 unit box, shared by the Diagnostic progress and the Encounter Paws. */
export const PAW_PATHS = ['M9 14a2.4 3 0 1 0 0.1 0z', 'M15 8a2.4 3 0 1 0 0.1 0z', 'M23 8a2.4 3 0 1 0 0.1 0z', 'M29 14a2.4 3 0 1 0 0.1 0z', 'M19 17c-6 0-10 5-10 9 0 3.5 3 4.5 6 4 2-.4 2.6-.6 4-.6s2 .2 4 .6c3 .5 6-.5 6-4 0-4-4-9-10-9z'];

/**
 * One to three earned Paws out of three ("Encounters — Paw result card" board): earned Paws are filled accent gold,
 * the rest stay sunken, both ink outlined, so the count reads without colour. The caller labels the row.
 */
export function EncounterPaws({ paws, size = 44, label, testID }: { paws: number; size?: number; label?: string; testID?: string }) {
  const color = usePalette();
  return (
    <View accessible={label !== undefined} accessibilityRole="image" accessibilityLabel={label} testID={testID} className="flex-row items-center" style={{ gap: size < 30 ? 1 : theme.space[1] }}>
      {[0, 1, 2].map((i) => (
        <Svg key={i} width={size} height={size} viewBox="0 0 38 38" aria-hidden data-earned={i < paws ? 'true' : 'false'}>
          {PAW_PATHS.map((d) => (
            <Path key={d} d={d} fill={i < paws ? color.accent : color.surfaceSunken} stroke={color.ink} strokeWidth={2.2} strokeLinejoin="round" />
          ))}
        </Svg>
      ))}
    </View>
  );
}

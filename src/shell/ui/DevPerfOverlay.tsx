import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { usePalette } from './theme';
import { devPerfEnabled, devPerfSnapshot, subscribeDevPerf, type DevPerfSnapshot } from './devPerf';

function Readout() {
  const [snap, setSnap] = useState<DevPerfSnapshot>(devPerfSnapshot());
  useEffect(() => subscribeDevPerf(() => setSnap(devPerfSnapshot())), []);
  const color = usePalette();
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, padding: 4, backgroundColor: color.surface, zIndex: 9999 }}>
      <Text style={{ color: color.ink, fontSize: 10 }}>
        {`${snap.appState}  ${snap.screen}\nloops ${snap.loops.length} [${snap.loops.join(',')}]\ntimers ${snap.timers.length} [${snap.timers.join(',')}]`}
      </Text>
    </View>
  );
}

/**
 * Development-only counters on screen. Hidden by default; set EXPO_PUBLIC_DEV_PERF_OVERLAY=1 to show it. The counters
 * themselves keep running in development either way. Renders nothing in a production build.
 */
export function DevPerfOverlay() {
  if (!devPerfEnabled() || process.env.EXPO_PUBLIC_DEV_PERF_OVERLAY !== '1') return null;
  return <Readout />;
}

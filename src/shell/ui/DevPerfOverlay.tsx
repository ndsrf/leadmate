import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { usePalette } from './theme';
import { devPerfEnabled, devPerfSnapshot, subscribeDevPerf, type DevPerfSnapshot } from './devPerf';

/** JS-thread frame rate, counted with requestAnimationFrame while the overlay is shown (dev only). */
function useJsRate(active: boolean): number {
  const [rate, setRate] = useState(0);
  useEffect(() => {
    if (!active) return; // no rAF/interval wakeups while the app is not in the foreground
    let frames = 0;
    let raf = 0;
    const loop = () => {
      frames++;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      setRate((frames * 1000) / (now - last));
      frames = 0;
      last = now;
    }, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
    };
  }, [active]);
  return rate;
}

function Readout() {
  const [snap, setSnap] = useState<DevPerfSnapshot>(devPerfSnapshot());
  useEffect(() => subscribeDevPerf(() => setSnap(devPerfSnapshot())), []);
  const rate = useJsRate(snap.appState === 'active');
  const color = usePalette();
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, padding: 4, backgroundColor: color.surface, zIndex: 9999 }}>
      <Text style={{ color: color.ink, fontSize: 10 }}>
        {`js ${rate.toFixed(0)}/s  ${snap.appState}  ${snap.screen}\nloops ${snap.loops.length} [${snap.loops.join(',')}]\ntimers ${snap.timers.length} [${snap.timers.join(',')}]`}
      </Text>
    </View>
  );
}

/** Development-only counters on screen. Renders nothing (and runs nothing) in a production build. */
export function DevPerfOverlay() {
  if (!devPerfEnabled()) return null;
  return <Readout />;
}

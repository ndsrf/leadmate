import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { FeedbackTier } from '../../hud/feedback';
import type { FeedbackPolarity } from '../../sim/feedbackKinds';
import { BURST_PARTS, burstFrame } from './feedbackBurstFrame';
// The Dog scene stays Light whatever the Appearance, so its Feedback Messages do too.
import { lightColor, theme } from './theme';
import { useMotion } from './useMotion';

/** One burst to show; a new `id` replaces the one still showing. All text is already translated. */
export interface FeedbackBurstProps {
  /** Rises once per event, so the same tier twice in a row still restarts the burst. */
  id: number;
  tier: FeedbackTier;
  polarity: FeedbackPolarity;
  /** The signal line, already filled with the Dog's name. */
  text: string;
  /** The Combo after this event; shown as a counter from 2 up on medium and big. */
  combo: number;
  /** Called once when the burst has finished its `TIER_SECONDS` and faded out. */
  onDone?: () => void;
}

const ICON = 22;
const SPARK_ANGLES = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];

/** A four-point sparkle for a right answer, a grey puff for a wrong one: the icon tells them apart without colour. */
export function BurstIcon({ polarity }: { polarity: FeedbackPolarity }) {
  return (
    <Svg width={ICON} height={ICON} viewBox="0 0 24 24" aria-hidden>
      {polarity === 'right' ? (
        <Path d="M12 2 L14.6 9.4 L22 12 L14.6 14.6 L12 22 L9.4 14.6 L2 12 L9.4 9.4 Z" fill={lightColor.accent} stroke={lightColor.ink} strokeWidth={1.8} strokeLinejoin="round" />
      ) : (
        <>
          <Circle cx={8} cy={14} r={5} fill={lightColor.locked} stroke={lightColor.ink} strokeWidth={1.8} />
          <Circle cx={15} cy={12} r={6} fill={lightColor.locked} stroke={lightColor.ink} strokeWidth={1.8} />
          <Circle cx={12} cy={16} r={4.5} fill={lightColor.locked} stroke={lightColor.ink} strokeWidth={1.8} />
        </>
      )}
    </Svg>
  );
}

/** Small stars around the pill; their ring grows with `spread`. */
function Sparks({ count, spread }: { count: number; spread: number }) {
  const r = 18 + 22 * spread;
  return (
    <Svg width={140} height={60} viewBox="-70 -30 140 60" style={{ position: 'absolute' }} aria-hidden>
      {SPARK_ANGLES.slice(0, count).map((deg, i) => {
        const a = ((deg + (i % 2) * 18) * Math.PI) / 180;
        return <Circle key={deg} cx={Math.cos(a) * r * 1.9} cy={Math.sin(a) * r * 0.7} r={2.4} fill={lightColor.accent} stroke={lightColor.ink} strokeWidth={1} />;
      })}
    </Svg>
  );
}

function Burst({ tier, polarity, text, combo, onDone }: FeedbackBurstProps) {
  const { reduced } = useMotion();
  const [elapsed, setElapsed] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const start = Date.now();
    let raf = 0;
    let finished = false;
    const tick = () => {
      const e = (Date.now() - start) / 1000;
      setElapsed(e);
      if (burstFrame(tier, e, reduced).done) {
        if (!finished) {
          finished = true;
          done.current?.();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tier, reduced]);
  const f = burstFrame(tier, elapsed, reduced);
  const parts = BURST_PARTS[tier];
  const wrong = tier === 'wrong';
  const showCombo = parts.comboCounter && combo >= 2;
  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '30%', alignItems: 'center', justifyContent: 'center', opacity: f.opacity, transform: [{ translateX: f.dx }, { translateY: f.dy }, { scale: f.scale }] }}
    >
      {parts.sparks > 0 && <Sparks count={parts.sparks} spread={f.spread} />}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space[2],
          paddingHorizontal: theme.space[3],
          paddingVertical: theme.space[1],
          borderRadius: theme.radius.lg,
          borderWidth: theme.border.ink,
          borderColor: lightColor.ink,
          backgroundColor: wrong ? lightColor.locked : parts.banner ? lightColor.accent : lightColor.surface,
          maxWidth: '96%',
          ...(parts.banner ? { alignSelf: 'stretch', marginHorizontal: theme.space[2], justifyContent: 'center' as const } : {}),
        }}
      >
        <BurstIcon polarity={polarity} />
        <Text className="font-display text-body" style={{ color: wrong ? lightColor.lockedText : lightColor.ink, flexShrink: 1 }} numberOfLines={2}>
          {text}
        </Text>
        {showCombo && (
          <Text className="font-display text-title" style={{ color: lightColor.ink }}>
            {`×${combo}`}
          </Text>
        )}
        {parts.puff && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: lightColor.locked, borderWidth: 1.5, borderColor: lightColor.ink, opacity: 1 - f.spread * 0.5, transform: [{ translateY: -f.spread * 6 }] }} />}
      </View>
    </View>
  );
}

/** The shell burst drawing one Feedback Message tier above the Dog; a new `id` replaces the burst still showing. */
export function FeedbackBurst(props: FeedbackBurstProps) {
  return <Burst key={props.id} {...props} />;
}

import { useEffect, useRef, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import type { TextKey, Translate } from '../../i18n';
import { activeLine, lineTextKey, parseAnimationTimeline, type AnimationTimeline } from '../lessons/animationTimeline';
import type { LessonBlock, VideoSource } from '../lessons/lesson';
import { Button } from '../Overlays';
import { Badge, Panel, Raised } from './components';
import { LessonPicture } from './LessonImage';
import { animationTimelineUrl, browserNext, MEDIA_BASE, videoPlayback, type BrowserState } from './media';
import { CanineMinigameAvatar } from './CanineMinigameAvatar';
import { handlePress } from './press';
import { theme, usePalette } from './theme';
import type { TrialState, VideoGatingProps } from '../plus';

export type VideoBlock = Extract<LessonBlock, { type: 'video' }>;

/**
 * What the platform supplies: the player for a given source kind and address, wired to report its load result and,
 * for a Lesson Animation, its playback time in seconds (`onTime`), which drives the subtitles.
 */
export type PlayerRenderer = (props: {
  kind: VideoSource['kind'];
  uri: string;
  attempt: number;
  onLoaded: () => void;
  onError: () => void;
  onTime: (seconds: number) => void;
}) => React.ReactNode;

/** The subtitle text at playback time `seconds`: the active Line's catalog text, or null. */
export function subtitleAt(t: Translate, caption: string, timeline: AnimationTimeline | null, seconds: number): string | null {
  const line = activeLine(timeline, seconds);
  return line ? t(lineTextKey(caption, line.id) as TextKey) : null;
}

/**
 * Fetches and reads a Lesson Animation's timeline, keeping only Lines with catalog text; null when there is no
 * address, the fetch fails or the file is invalid, so the clip just plays without subtitles.
 */
export async function loadAnimationTimeline(url: string | null, t: Translate, caption: string, get: typeof fetch = fetch): Promise<AnimationTimeline | null> {
  if (url === null) return null;
  try {
    const res = await get(url);
    if (!res.ok) return null;
    return parseAnimationTimeline(await res.text(), (id) => t(lineTextKey(caption, id) as TextKey).trim() !== '');
  } catch {
    return null;
  }
}

/**
 * A Lesson Video block, shared by native and web. Until the user taps play it is only its bundled poster, a play
 * control, the caption and, for YouTube, a "Plays from YouTube" label, so no host is contacted. After the tap the
 * platform player loads; a failed load shows the themed placeholder with retry. A YouTube video also offers "Open
 * video"; a Lesson Animation does not. A Lesson Animation also fetches its timeline on the tap and draws the active
 * Line as a subtitle over the bottom of the clip; without a timeline it plays with none.
 *
 * Gated by LeadMate Plus: free users see the poster under a locked overlay with an unlock button instead of the
 * play control. Members (active trial or full) get an unlocked badge and play it as above; with `autoPlay` it starts
 * at once (the play action held while the paywall was open).
 */
export function LessonVideoCard({
  t,
  block,
  renderPlayer,
  mediaBase = MEDIA_BASE,
  gating,
  isPlus: propIsPlus,
  trialState: propTrialState,
  onUnlock: propOnUnlock,
  autoPlay: propAutoPlay,
}: {
  t: Translate;
  block: VideoBlock;
  renderPlayer: PlayerRenderer;
  mediaBase?: string;
  gating?: VideoGatingProps;
  isPlus?: boolean;
  trialState?: TrialState;
  onUnlock?: () => void;
  autoPlay?: boolean;
}) {
  const isPlus = gating?.isPlus ?? propIsPlus ?? false;
  const trialState = gating?.trialState ?? propTrialState ?? 'unstarted';
  const onUnlock = gating?.onUnlock ?? propOnUnlock;
  const autoPlay = gating?.autoPlay ?? propAutoPlay ?? false;
  const color = usePalette();
  const [started, setStarted] = useState(isPlus && autoPlay);
  const [state, setState] = useState<BrowserState>('loading');
  const [attempt, setAttempt] = useState(0);
  const [timeline, setTimeline] = useState<AnimationTimeline | null>(null);
  const [time, setTime] = useState(0);
  const { uri, watch } = videoPlayback(block.source, mediaBase);
  const youtube = block.source.kind === 'youtube';
  const request = useRef(0);
  useEffect(() => () => void (request.current += 1), []);
  /** On the play or retry tap only: fetch the timeline; a reply for an earlier tap or after unmount is ignored. */
  const loadTimeline = () => {
    if (block.source.kind !== 'animation') return;
    const id = ++request.current;
    setTimeline(null);
    setTime(0);
    void loadAnimationTimeline(animationTimelineUrl(block.source.key, mediaBase), t, block.caption).then((tl) => {
      if (request.current === id) setTimeline(tl);
    });
  };
  // a held play action: start as soon as the user is Plus, and fetch the timeline as the play tap would
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!isPlus || !autoPlay || autoStarted.current) return;
    autoStarted.current = true;
    setStarted(true);
    setState('loading');
    loadTimeline();
    // only when the gate opens, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlus, autoPlay]);
  const subtitle = started && !youtube ? subtitleAt(t, block.caption, timeline, time) : null;
  const failed = started && isPlus && (state === 'offline' || uri === null);
  const open = () => {
    if (watch) void Linking.openURL(watch).catch(() => {});
  };
  const unlockLabel = trialState === 'expired' ? t('media.video.unlockPlus') : t('media.video.unlockTrial');
  return (
    <View accessible={!started} accessibilityLabel={started ? undefined : `${t(block.alt)}. ${t(block.caption)}`} className="mt-4">
      <Raised fill={color.surfaceSunken} radius={theme.radius.lg} offset={theme.depth.sm.x} faceStyle={{ overflow: 'hidden' }}>
        <View style={{ aspectRatio: 16 / 9, width: '100%', backgroundColor: color.outline }}>
          {failed ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.surfaceSunken }}>
              <CanineMinigameAvatar t={t} posture="calm_sphinx_on_mat" />
              <Text className="mt-2 text-caption text-inkMuted">{t('media.unavailable')}</Text>
            </View>
          ) : started && uri && isPlus ? (
            <>
              {renderPlayer({
                kind: block.source.kind,
                uri,
                attempt,
                onLoaded: () => setState((s) => browserNext(s, 'loaded')),
                onError: () => setState((s) => browserNext(s, 'error')),
                onTime: setTime,
              })}
              {subtitle !== null && state !== 'loading' && (
                <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: theme.space[3], alignItems: 'center' }}>
                  {/* cream on navy in both palettes, like the loading label */}
                  <Text className="font-display text-body" style={{ color: color.onInfo, backgroundColor: color.outline, borderRadius: theme.radius.md, paddingHorizontal: theme.space[3], paddingVertical: theme.space[1], overflow: 'hidden' }}>
                    {subtitle}
                  </Text>
                </View>
              )}
              {state === 'loading' && (
                <View pointerEvents="none" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                  {/* cream on the dark player in both palettes */}
                  <Text className="font-display text-body" style={{ color: color.onInfo }}>{t('media.video.loading')}</Text>
                </View>
              )}
            </>
          ) : !isPlus ? (
            <>
              <LessonPicture t={t} art={block.poster} />
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', alignItems: 'center', justifyContent: 'center', gap: theme.space[2] }}>
                <Badge label={t('plus.label')} tone="accent" />
                <Button label={unlockLabel} onPress={() => onUnlock?.()} />
              </View>
            </>
          ) : (
            <>
              <LessonPicture t={t} art={block.poster} />
              <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Button
                  label={t('media.video.play')}
                  onPress={() => {
                    setState('loading');
                    setStarted(true);
                    loadTimeline();
                  }}
                />
              </View>
            </>
          )}
        </View>
        <View className="gap-2 p-3">
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge label={t('media.badge.video')} />
            {isPlus && <Badge label={t('media.video.unlockedPlus')} tone="accent" />}
            {!isPlus && <Text className="text-caption text-inkMuted">{t('media.video.locked')}</Text>}
            {isPlus && youtube && !started && <Text className="text-caption text-inkMuted">{t('media.video.source')}</Text>}
          </View>
          <Text className="text-body text-inkMuted">{t(block.caption)}</Text>
          {failed && (
            <Panel tone="warn">
              <Text className="text-body text-ink">{t('media.video.error')}</Text>
              <Button
                label={t('media.video.retry')}
                onPress={() => {
                  setState((s) => browserNext(s, 'retry'));
                  setAttempt((n) => n + 1);
                  loadTimeline();
                }}
              />
            </Panel>
          )}
          {started && isPlus && youtube && (
            <View className="flex-row">
              <Button label={t('media.video.open')} tone="quiet" onPress={() => handlePress(open)} />
            </View>
          )}
        </View>
      </Raised>
    </View>
  );
}

import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import type { LessonBlock } from '../lessons/lesson';
import { Button } from '../Overlays';
import { Badge, Panel, Raised } from './components';
import { LessonArt, isLessonArt } from './lessonArt';
import { browserNext, videoEmbedUrl, videoWatchUrl, type BrowserState } from './media';
import { CanineMinigameAvatar } from './CanineMinigameAvatar';
import { handlePress } from './press';
import { theme, usePalette } from './theme';

export type VideoBlock = Extract<LessonBlock, { type: 'video' }>;

/** What the platform supplies: the player for a given embed address, wired to report its load result. */
export type PlayerRenderer = (props: { uri: string; attempt: number; onLoaded: () => void; onError: () => void }) => React.ReactNode;

/**
 * A Lesson video block, shared by native and web. Until the user taps play it is only bundled art, a play
 * control, a "Plays from YouTube" label and the caption, so the video host is never contacted. After the tap the
 * platform player loads; a failed load shows the themed placeholder with retry, and "Open video" always works.
 */
export function LessonVideoCard({ t, block, renderPlayer }: { t: Translate; block: VideoBlock; renderPlayer: PlayerRenderer }) {
  const color = usePalette();
  const [started, setStarted] = useState(false);
  const [state, setState] = useState<BrowserState>('loading');
  const [attempt, setAttempt] = useState(0);
  const embed = videoEmbedUrl(block.videoId);
  const watch = videoWatchUrl(block.videoId);
  const failed = started && (state === 'offline' || embed === null);
  const open = () => {
    if (watch) void Linking.openURL(watch).catch(() => {});
  };
  return (
    <View accessible={!started} accessibilityLabel={started ? undefined : `${t(block.alt)}. ${t(block.caption)}`} className="mt-4">
      <Raised fill={color.surfaceSunken} radius={theme.radius.lg} offset={theme.depth.sm.x} faceStyle={{ overflow: 'hidden' }}>
        <View style={{ aspectRatio: 16 / 9, width: '100%', backgroundColor: color.outline }}>
          {failed ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.surfaceSunken }}>
              <CanineMinigameAvatar t={t} posture="calm_sphinx_on_mat" />
              <Text className="mt-2 text-caption text-inkMuted">{t('media.unavailable')}</Text>
            </View>
          ) : started && embed ? (
            <>
              {renderPlayer({ uri: embed, attempt, onLoaded: () => setState((s) => browserNext(s, 'loaded')), onError: () => setState((s) => browserNext(s, 'error')) })}
              {state === 'loading' && (
                <View pointerEvents="none" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                  {/* cream on the dark player in both palettes */}
                  <Text className="font-display text-body" style={{ color: color.onInfo }}>{t('media.video.loading')}</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <LessonArt name={isLessonArt(block.poster) ? block.poster : 'poster'} width={640} />
              <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Button
                  label={t('media.video.play')}
                  onPress={() => {
                    setState('loading');
                    setStarted(true);
                  }}
                />
              </View>
            </>
          )}
        </View>
        <View className="gap-2 p-3">
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge label={t('media.badge.video')} />
            {block.placeholder && <Badge label={t('media.badge.placeholder')} tone="warn" />}
            {!started && <Text className="text-caption text-inkMuted">{t('media.video.source')}</Text>}
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
                }}
              />
            </Panel>
          )}
          {started && (
            <View className="flex-row">
              <Button label={t('media.video.open')} tone="quiet" onPress={() => handlePress(open)} />
            </View>
          )}
        </View>
      </Raised>
    </View>
  );
}

import { createElement } from 'react';
import type { Translate } from '../../i18n';
import { LessonVideoCard, type VideoBlock } from './LessonVideoCard';
import type { TrialState } from '../plus';

/** Web: the embed plays in an iframe that is created only after the tap. */
export function LessonVideo({
  t,
  block,
  isPlus,
  trialState,
  onUnlock,
  autoPlay,
}: {
  t: Translate;
  block: VideoBlock;
  isPlus?: boolean;
  trialState?: TrialState;
  onUnlock?: () => void;
  autoPlay?: boolean;
}) {
  return (
    <LessonVideoCard
      t={t}
      block={block}
      isPlus={isPlus}
      trialState={trialState}
      onUnlock={onUnlock}
      autoPlay={autoPlay}
      renderPlayer={({ uri, attempt, onLoaded, onError }) =>
        createElement('iframe', {
          key: attempt,
          src: uri,
          title: t(block.alt),
          allow: 'encrypted-media; picture-in-picture; fullscreen',
          allowFullScreen: true,
          referrerPolicy: 'strict-origin-when-cross-origin',
          onLoad: onLoaded,
          onError,
          style: { border: 0, width: '100%', height: '100%' },
        })
      }
    />
  );
}

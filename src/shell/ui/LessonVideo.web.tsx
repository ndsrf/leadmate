import { createElement } from 'react';
import type { Translate } from '../../i18n';
import { LessonVideoCard, type VideoBlock } from './LessonVideoCard';
import type { TrialState, VideoGatingProps } from '../plus';

/**
 * Web: a Lesson Animation plays in a silent, looping `<video>`, a YouTube video in an iframe; either is created only
 * after the tap. A tap on the animation pauses or resumes it; its `timeupdate` drives the subtitles.
 */
export function LessonVideo({
  t,
  block,
  gating,
  isPlus,
  trialState,
  onUnlock,
  autoPlay,
}: {
  t: Translate;
  block: VideoBlock;
  gating?: VideoGatingProps;
  isPlus?: boolean;
  trialState?: TrialState;
  onUnlock?: () => void;
  autoPlay?: boolean;
}) {
  const videoGating: VideoGatingProps = gating ?? { isPlus, trialState, onUnlock, autoPlay };
  return (
    <LessonVideoCard
      t={t}
      block={block}
      gating={videoGating}
      renderPlayer={({ kind, uri, attempt, onLoaded, onError, onTime }) =>
        kind === 'animation'
          ? createElement('video', {
              key: attempt,
              src: uri,
              title: t(block.alt),
              'aria-label': t(block.alt),
              muted: true,
              loop: true,
              playsInline: true,
              autoPlay: true,
              onCanPlay: onLoaded,
              onError,
              onTimeUpdate: (e: { currentTarget: HTMLVideoElement }) => onTime(e.currentTarget.currentTime),
              onClick: (e: { currentTarget: HTMLVideoElement }) => (e.currentTarget.paused ? void e.currentTarget.play() : e.currentTarget.pause()),
              style: { border: 0, width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' },
            })
          : createElement('iframe', {
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

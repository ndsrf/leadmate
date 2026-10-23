import { createElement } from 'react';
import type { Translate } from '../../i18n';
import { LessonVideoCard, type VideoBlock } from './LessonVideoCard';

/** Web: the embed plays in an iframe that is created only after the tap. */
export function LessonVideo({ t, block }: { t: Translate; block: VideoBlock }) {
  return (
    <LessonVideoCard
      t={t}
      block={block}
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

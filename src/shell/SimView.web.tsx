import { lightColor } from './ui/theme';
import { createElement, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { getSimUrl } from './simUrl';
import type { SimViewHandle, SimViewProps } from './simViewTypes';

/** Web: the same bundle runs in an iframe, talking over window.postMessage. */
export const SimView = forwardRef<SimViewHandle, SimViewProps>(function SimView(
  { onMessage, onLoadError },
  ref,
) {
  const frame = useRef<HTMLIFrameElement>(null);

  useImperativeHandle(ref, () => ({
    post: (message) => {
      frame.current?.contentWindow?.focus(); // keyboard input needs the frame focused
      frame.current?.contentWindow?.postMessage(JSON.stringify(message), '*');
    },
  }));

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      try {
        onMessage(typeof event.data === 'string' ? JSON.parse(event.data) : event.data);
      } catch {
        // ignore messages that are not ours
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [onMessage]);

  return createElement('iframe', {
    ref: frame,
    src: getSimUrl(),
    onError: () => onLoadError?.(),
    style: { border: 0, width: '100%', height: '100%', flex: 1, background: lightColor.bg },
  });
});

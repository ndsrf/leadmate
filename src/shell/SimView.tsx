import { color } from './ui/theme';
import { forwardRef, useImperativeHandle, useRef, type ComponentType, type Ref } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent, type WebViewProps } from 'react-native-webview';
import { SIM_HTML } from './simHtml.generated';
import { getSimUrl } from './simUrl';
import type { SimViewHandle, SimViewProps } from './simViewTypes';

// react-native-webview's class typing resolves its props to `never` (generic defaults to `undefined`).
const NativeWebView = WebView as unknown as ComponentType<WebViewProps & { ref?: Ref<WebView> }>;

/** Native: the simulation bundle runs inside a WebView (ADR 0001). */
export const SimView = forwardRef<SimViewHandle, SimViewProps>(function SimView(
  { onMessage, onLoadError },
  ref,
) {
  const webview = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    post: (message) => webview.current?.postMessage(JSON.stringify(message)),
  }));

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      onMessage(JSON.parse(event.nativeEvent.data));
    } catch {
      // ignore messages that are not ours
    }
  };

  return (
    <NativeWebView
      ref={webview}
      style={styles.fill}
      // embedded bundle by default (no network needed); EXPO_PUBLIC_SIM_URL loads a dev server instead
      source={SIM_HTML && !process.env.EXPO_PUBLIC_SIM_URL ? { html: SIM_HTML, baseUrl: 'https://leadmate.local' } : { uri: getSimUrl() }}
      originWhitelist={['*']}
      onMessage={handleMessage}
      onError={() => onLoadError?.()}
      onHttpError={() => onLoadError?.()}
      javaScriptEnabled
      bounces={false}
      scrollEnabled={false}
      overScrollMode="never"
    />
  );
});

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: color.bg } });

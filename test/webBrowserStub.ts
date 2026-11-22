// Jest stub for expo-web-browser (native module, ESM build). Tests inject their own openBrowser when they need it.
export async function openBrowserAsync(_url: string): Promise<{ type: 'opened' }> {
  return { type: 'opened' };
}
export function dismissBrowser(): void {}

// Jest stand-in for `nativewind`, which needs the real react-native: `vars()` returns the variables as a plain style, as on web.
export function vars(variables: Record<string, string | number>): Record<string, string> {
  return Object.fromEntries(Object.entries(variables).map(([k, v]) => [k.startsWith('--') ? k : `--${k}`, String(v)]));
}

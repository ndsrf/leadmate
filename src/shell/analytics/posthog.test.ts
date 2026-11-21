jest.mock('posthog-react-native', () => ({ PostHog: class {}, PostHogPersistedProperty: { Queue: 'queue' } }));

import { buildPostHogOptions, replayAllowed, DEFAULT_POSTHOG_HOST } from './posthog';

describe('buildPostHogOptions (Task 11.7)', () => {
  it('records replays only in dev builds, internal previews and the closed-test build', () => {
    expect(replayAllowed('dev_build')).toBe(true);
    expect(replayAllowed('preview')).toBe(true);
    expect(replayAllowed('closed_test')).toBe(true);
    for (const runtime of ['store', 'expo_go', 'web', undefined]) expect(replayAllowed(runtime)).toBe(false);
  });

  it.each(['store', 'expo_go', 'web'])('has replay off for %s', (runtime) => {
    const options = buildPostHogOptions(DEFAULT_POSTHOG_HOST, 'install-1', runtime);
    expect(options.enableSessionReplay).toBe(false);
    expect(options.sessionReplayConfig).toBeUndefined();
  });

  it('has replay off when the runtime is unknown', () => {
    expect(buildPostHogOptions(DEFAULT_POSTHOG_HOST, 'install-1').enableSessionReplay).toBe(false);
  });

  it.each(['dev_build', 'preview', 'closed_test'])('has replay on with everything masked for %s', (runtime) => {
    const options = buildPostHogOptions(DEFAULT_POSTHOG_HOST, 'install-1', runtime);
    expect(options.enableSessionReplay).toBe(true);
    expect(options.sessionReplayConfig).toMatchObject({
      maskAllTextInputs: true,
      maskAllImages: true,
      maskAllSandboxedViews: true,
      captureLog: false,
    });
  });

  it('keeps the privacy settings in every runtime', () => {
    for (const runtime of ['store', 'dev_build']) {
      const options = buildPostHogOptions('https://eu.i.posthog.com', 'install-1', runtime);
      expect(options).toMatchObject({
        host: 'https://eu.i.posthog.com',
        disableGeoip: true,
        personProfiles: 'never',
        captureAppLifecycleEvents: false,
        bootstrap: { distinctId: 'install-1', isIdentifiedId: false },
      });
    }
  });
});

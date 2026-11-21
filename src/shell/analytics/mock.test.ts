import { MockAnalyticsService } from './mock';
import type { AnalyticsEvent } from './types';
import type { AnalyticsState } from './state';

describe('MockAnalyticsService (Task 3.3)', () => {
  const dummyState: AnalyticsState = {
    installId: 'mock-install-id',
    installedAt: '2026-11-18T00:00:00.000Z',
    choice: null,
    funnelDoneOnce: false,
    funnelOpen: false,
    upgradedInstall: false,
    sessionCount: 0,
  };

  const dummyEvent: AnalyticsEvent = {
    name: 'session_started',
    properties: {
      schema_version: 1,
      app_version: '1.2.0',
      content_version: 1,
      content_channel: 'beta',
      language: 'es',
      seconds_since_install: 0,
      days_since_install: 0,
      first_session: true,
      upgraded_install: false,
    },
  };

  it('captures events in memory when enabled', async () => {
    const service = new MockAnalyticsService();
    await service.start(dummyState);

    await service.capture(dummyEvent);
    expect(service.events).toHaveLength(1);
    expect(service.captured).toHaveLength(1);
    expect(service.events[0]).toEqual(dummyEvent);
  });

  it('does not capture events when disabled', async () => {
    const service = new MockAnalyticsService();
    await service.start({ ...dummyState, choice: 'off' });

    await service.capture(dummyEvent);
    expect(service.events).toHaveLength(0);
  });

  it('clears queued events when setEnabled(false) is called', async () => {
    const service = new MockAnalyticsService();
    await service.start(dummyState);
    await service.capture(dummyEvent);
    expect(service.events).toHaveLength(1);

    await service.setEnabled(false);
    expect(service.events).toHaveLength(0);
    expect(service.enabled).toBe(false);
  });

  it('records flush call', async () => {
    const service = new MockAnalyticsService();
    expect(service.flushed).toBe(false);
    await service.flush();
    expect(service.flushed).toBe(true);
  });
});

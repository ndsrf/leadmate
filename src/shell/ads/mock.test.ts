import { MockAdService } from './mock';
import { clearInterstitialTimestamp, getLastInterstitialTimestamp, isInterstitialCooldownActive, recordInterstitialImpression } from './storage';

describe('MockAdService', () => {
  let service: MockAdService;

  beforeEach(async () => {
    await clearInterstitialTimestamp();
    service = new MockAdService();
  });

  afterEach(async () => {
    await clearInterstitialTimestamp();
  });

  it('initializes cleanly', async () => {
    expect(service.initialized).toBe(false);
    await service.initialize();
    expect(service.initialized).toBe(true);
  });

  it('handles consent queries and form display', async () => {
    expect(await service.requestConsentInfoUpdate()).toBe('NOT_REQUIRED');
    expect(await service.showConsentFormIfRequired()).toBe('NOT_REQUIRED');

    service.consentStatus = 'REQUIRED';
    expect(await service.requestConsentInfoUpdate()).toBe('REQUIRED');
    expect(await service.showConsentFormIfRequired()).toBe('OBTAINED');
    expect(service.consentStatus).toBe('OBTAINED');
  });

  it('manages interstitial lifecycle with cooldown enforcement', async () => {
    expect(service.isInterstitialReady()).toBe(false);
    expect(await service.canShowInterstitial()).toBe(false);

    // Cannot show if not preloaded
    const shownBeforePreload = await service.showInterstitial();
    expect(shownBeforePreload).toBe(false);

    // Preload
    await service.preloadInterstitial();
    expect(service.isInterstitialReady()).toBe(true);
    expect(await service.canShowInterstitial()).toBe(true);

    // Show interstitial
    const shown = await service.showInterstitial();
    expect(shown).toBe(true);
    expect(service.showCount).toBe(1);
    expect(service.isInterstitialReady()).toBe(false);

    // Cannot show immediately again (unready and on cooldown)
    await service.preloadInterstitial();
    expect(service.isInterstitialReady()).toBe(true);
    expect(await service.canShowInterstitial()).toBe(false); // on cooldown!
    const shownDuringCooldown = await service.showInterstitial();
    expect(shownDuringCooldown).toBe(false);
  });

  it('purges interstitial cache on clearCache()', async () => {
    await service.preloadInterstitial();
    expect(service.isInterstitialReady()).toBe(true);

    service.clearCache();
    expect(service.isInterstitialReady()).toBe(false);
  });

  it('persists impression timestamp in storage', async () => {
    expect(await getLastInterstitialTimestamp()).toBeNull();
    const testDate = new Date('2026-10-31T12:00:00Z');
    await recordInterstitialImpression(testDate);

    expect(await getLastInterstitialTimestamp()).toBe(testDate.getTime());

    // 2 minutes later: still on 5-minute cooldown
    const twoMinutesLater = new Date('2026-10-31T12:02:00Z');
    expect(await isInterstitialCooldownActive(twoMinutesLater)).toBe(true);

    // 6 minutes later: cooldown expired
    const sixMinutesLater = new Date('2026-10-31T12:06:00Z');
    expect(await isInterstitialCooldownActive(sixMinutesLater)).toBe(false);
  });
});

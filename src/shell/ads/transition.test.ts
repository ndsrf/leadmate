jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  NativeModules: { RNGoogleMobileAdsModule: {} },
}));

import { getAdService, resetAdService } from './index';
import { MockAdService } from './mock';
import { clearInterstitialTimestamp, isInterstitialCooldownActive } from './storage';

describe('Transition Interstitials Lifecycle & Debrief Integration', () => {
  let adService: MockAdService;

  beforeEach(async () => {
    resetAdService();
    await clearInterstitialTimestamp();
    adService = getAdService({ forceMock: true }) as MockAdService;
  });

  afterEach(async () => {
    await clearInterstitialTimestamp();
    resetAdService();
  });

  it('preloads and triggers interstitial on debrief exit for Free Tier user', async () => {
    // 1. Reaching Debrief triggers background preload
    await adService.preloadInterstitial();
    expect(adService.isInterstitialReady()).toBe(true);

    // 2. Tapping "Volver al mapa" triggers showInterstitial
    const shown = await adService.showInterstitial();
    expect(shown).toBe(true);
    expect(adService.showCount).toBe(1);
    expect(adService.isInterstitialReady()).toBe(false);

    // 3. Cooldown is now active
    expect(await isInterstitialCooldownActive()).toBe(true);
  });

  it('bypasses interstitial on cooldown (< 5 minutes) without blocking navigation', async () => {
    // First impression
    await adService.preloadInterstitial();
    await adService.showInterstitial();

    // Subsequent debrief completed 2 minutes later
    await adService.preloadInterstitial();
    expect(adService.isInterstitialReady()).toBe(true);

    // Cannot show during cooldown
    expect(await adService.canShowInterstitial()).toBe(false);
    const shown = await adService.showInterstitial();
    expect(shown).toBe(false);
    expect(adService.showCount).toBe(1); // Still 1
  });

  it('safely proceeds if ad is not ready (offline or unfill)', async () => {
    // Ad was not ready / failed to preload
    expect(adService.isInterstitialReady()).toBe(false);

    const shown = await adService.showInterstitial();
    expect(shown).toBe(false);
    expect(adService.showCount).toBe(0);
  });

  it('purges cached interstitial immediately on clearCache() upon Plus upgrade', async () => {
    await adService.preloadInterstitial();
    expect(adService.isInterstitialReady()).toBe(true);

    // User starts trial or purchases subscription
    adService.clearCache();
    expect(adService.isInterstitialReady()).toBe(false);

    const shown = await adService.showInterstitial();
    expect(shown).toBe(false);
  });
});

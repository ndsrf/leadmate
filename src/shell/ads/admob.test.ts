jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  NativeModules: { RNGoogleMobileAdsModule: {} },
}));

import { GoogleMobileAdsService, isNativeGoogleMobileAdsAvailable } from './admob';
import { clearInterstitialTimestamp } from './storage';

describe('GoogleMobileAdsService', () => {
  let service: GoogleMobileAdsService;

  beforeEach(async () => {
    await clearInterstitialTimestamp();
    service = new GoogleMobileAdsService();
  });

  afterEach(async () => {
    await clearInterstitialTimestamp();
    service.clearCache();
  });

  it('detects native ads availability', () => {
    expect(isNativeGoogleMobileAdsAvailable()).toBe(true);
  });

  it('initializes and handles consent status mapping', async () => {
    await service.initialize();
    const status = await service.requestConsentInfoUpdate();
    expect(status).toBe('NOT_REQUIRED');

    const formResult = await service.showConsentFormIfRequired();
    expect(formResult).toBe('NOT_REQUIRED');
  });

  it('preloads and displays interstitial respecting cooldown', async () => {
    expect(service.isInterstitialReady()).toBe(false);
    expect(await service.canShowInterstitial()).toBe(false);

    // Preload
    const preloaded = await service.preloadInterstitial();
    expect(preloaded).toBe(true);
    expect(service.isInterstitialReady()).toBe(true);
    expect(await service.canShowInterstitial()).toBe(true);

    // Show
    const shown = await service.showInterstitial();
    expect(shown).toBe(true);
    expect(service.isInterstitialReady()).toBe(false);

    // Preload again immediately: should be on cooldown
    await service.preloadInterstitial();
    expect(service.isInterstitialReady()).toBe(true);
    expect(await service.canShowInterstitial()).toBe(false);

    const shownOnCooldown = await service.showInterstitial();
    expect(shownOnCooldown).toBe(false);
  });

  it('clears cache and listeners on clearCache', async () => {
    await service.preloadInterstitial();
    expect(service.isInterstitialReady()).toBe(true);
    service.clearCache();
    expect(service.isInterstitialReady()).toBe(false);
  });

  it('returns valid unit IDs', () => {
    expect(service.getBannerUnitId()).toBeTruthy();
    expect(service.getInterstitialUnitId()).toBeTruthy();
  });
});

import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

jest.mock('react-native', () => {
  const mockTurboModuleRegistry = {
    get: jest.fn(),
  };
  return {
    Platform: { OS: 'ios' },
    NativeModules: { RNGoogleMobileAdsModule: {} },
    TurboModuleRegistry: mockTurboModuleRegistry,
  };
});

import {
  GoogleMobileAdsService,
  isNativeGoogleMobileAdsAvailable,
  getGoogleMobileAdsModule,
  resetGoogleMobileAdsModule,
  FallbackTestIds,
} from './admob';
import { clearInterstitialTimestamp } from './storage';

describe('GoogleMobileAdsService and Native Availability', () => {
  let service: GoogleMobileAdsService;

  beforeEach(async () => {
    await clearInterstitialTimestamp();
    resetGoogleMobileAdsModule();
    (NativeModules as any).RNGoogleMobileAdsModule = {};
    (TurboModuleRegistry.get as jest.Mock).mockReset();
    Platform.OS = 'ios';
    service = new GoogleMobileAdsService();
  });

  afterEach(async () => {
    await clearInterstitialTimestamp();
    service.clearCache();
    resetGoogleMobileAdsModule();
  });

  describe('isNativeGoogleMobileAdsAvailable', () => {
    it('detects native ads availability via NativeModules bridge', () => {
      (NativeModules as any).RNGoogleMobileAdsModule = {};
      expect(isNativeGoogleMobileAdsAvailable()).toBe(true);
    });

    it('detects native ads availability via TurboModuleRegistry', () => {
      delete (NativeModules as any).RNGoogleMobileAdsModule;
      (TurboModuleRegistry.get as jest.Mock).mockReturnValue({});
      expect(isNativeGoogleMobileAdsAvailable()).toBe(true);
      expect(TurboModuleRegistry.get).toHaveBeenCalledWith('RNGoogleMobileAdsModule');
    });

    it('returns false when neither TurboModule nor NativeModules are present (Expo Go)', () => {
      delete (NativeModules as any).RNGoogleMobileAdsModule;
      (TurboModuleRegistry.get as jest.Mock).mockReturnValue(null);
      expect(isNativeGoogleMobileAdsAvailable()).toBe(false);
    });

    it('returns false when Platform.OS is web', () => {
      Platform.OS = 'web' as any;
      expect(isNativeGoogleMobileAdsAvailable()).toBe(false);
    });
  });

  describe('getGoogleMobileAdsModule and caching', () => {
    it('returns module when native is available and caches result', () => {
      const mod1 = getGoogleMobileAdsModule();
      expect(mod1).toBeTruthy();
      const mod2 = getGoogleMobileAdsModule();
      expect(mod2).toBe(mod1);
    });

    it('returns null when native is unavailable', () => {
      Platform.OS = 'web' as any;
      expect(getGoogleMobileAdsModule()).toBeNull();
    });

    it('clears cached module when resetGoogleMobileAdsModule is called', () => {
      const mod1 = getGoogleMobileAdsModule();
      expect(mod1).toBeTruthy();
      resetGoogleMobileAdsModule();
      // Even if reset, subsequent call re-resolves if available
      const mod2 = getGoogleMobileAdsModule();
      expect(mod2).toBeTruthy();
    });
  });

  describe('GoogleMobileAdsService operations', () => {
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

    it('degrades gracefully when native ads module is unavailable', async () => {
      Platform.OS = 'web' as any;
      const unlinkedService = new GoogleMobileAdsService();

      // Should not throw and handle safely
      await unlinkedService.initialize();
      const consent = await unlinkedService.requestConsentInfoUpdate();
      expect(consent).toBe('UNKNOWN');

      const formResult = await unlinkedService.showConsentFormIfRequired();
      expect(formResult).toBe('UNKNOWN');

      const preloadResult = await unlinkedService.preloadInterstitial();
      expect(preloadResult).toBe(false);

      const showResult = await unlinkedService.showInterstitial();
      expect(showResult).toBe(false);

      expect(unlinkedService.getBannerUnitId()).toBe(FallbackTestIds.BANNER);
      expect(unlinkedService.getInterstitialUnitId()).toBe(FallbackTestIds.INTERSTITIAL);
    });
  });
});

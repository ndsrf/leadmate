import { NativeModules, Platform } from 'react-native';
import MobileAds, {
  AdEventType,
  AdsConsent,
  AdsConsentStatus,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';
import { AdConsentStatus as LeadMateConsentStatus, AdService } from './types';
import { isInterstitialCooldownActive, recordInterstitialImpression } from './storage';

export function isNativeGoogleMobileAdsAvailable(): boolean {
  if (typeof Platform === 'undefined' || !Platform || Platform.OS === 'web') {
    return false;
  }
  return Boolean(
    typeof NativeModules !== 'undefined' &&
      NativeModules &&
      (NativeModules.RNGoogleMobileAdsModule ||
        NativeModules.RNGoogleMobileAdsInitModule ||
        NativeModules.RNGoogleMobileAdsConsentModule)
  );
}

export class GoogleMobileAdsService implements AdService {
  private initialized = false;
  private cachedInterstitial: InterstitialAd | null = null;
  private isLoaded = false;
  private consentStatus: LeadMateConsentStatus = 'UNKNOWN';
  private unsubscribeListeners: (() => void)[] = [];

  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      await MobileAds().initialize();
      this.initialized = true;
    } catch {
      // Gracefully survive initialization errors
    }
  }

  async requestConsentInfoUpdate(): Promise<LeadMateConsentStatus> {
    try {
      const consentInfo = await AdsConsent.requestInfoUpdate();
      this.consentStatus = this.mapConsentStatus(consentInfo.status);
      return this.consentStatus;
    } catch {
      return this.consentStatus;
    }
  }

  async showConsentFormIfRequired(): Promise<LeadMateConsentStatus> {
    try {
      const status = await this.requestConsentInfoUpdate();
      if (status === 'REQUIRED') {
        const result = await AdsConsent.showForm();
        this.consentStatus = this.mapConsentStatus(result.status);
      }
      return this.consentStatus;
    } catch {
      return this.consentStatus;
    }
  }

  private mapConsentStatus(status: AdsConsentStatus | string): LeadMateConsentStatus {
    switch (status) {
      case AdsConsentStatus.REQUIRED:
      case 'REQUIRED':
        return 'REQUIRED';
      case AdsConsentStatus.OBTAINED:
      case 'OBTAINED':
        return 'OBTAINED';
      case AdsConsentStatus.NOT_REQUIRED:
      case 'NOT_REQUIRED':
        return 'NOT_REQUIRED';
      default:
        return 'UNKNOWN';
    }
  }

  getBannerUnitId(): string {
    const custom = process.env.EXPO_PUBLIC_ADMOB_BANNER_ID;
    if (custom && typeof __DEV__ !== 'undefined' && !__DEV__) {
      return custom;
    }
    return TestIds.BANNER;
  }

  getInterstitialUnitId(): string {
    const custom = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID;
    if (custom && typeof __DEV__ !== 'undefined' && !__DEV__) {
      return custom;
    }
    return TestIds.INTERSTITIAL;
  }

  isInterstitialReady(): boolean {
    return this.isLoaded && this.cachedInterstitial !== null;
  }

  async canShowInterstitial(): Promise<boolean> {
    if (!this.isInterstitialReady()) {
      return false;
    }
    const cooldownActive = await isInterstitialCooldownActive();
    return !cooldownActive;
  }

  async preloadInterstitial(): Promise<boolean> {
    if (this.isInterstitialReady()) {
      return true;
    }

    try {
      this.clearCache();
      const unitId = this.getInterstitialUnitId();
      const requestNonPersonalizedAdsOnly = this.consentStatus !== 'OBTAINED';
      const interstitial = InterstitialAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly,
      });

      this.cachedInterstitial = interstitial;

      const unsubs: (() => void)[] = [];

      unsubs.push(
        interstitial.addAdEventListener(AdEventType.LOADED, () => {
          this.isLoaded = true;
        })
      );

      unsubs.push(
        interstitial.addAdEventListener(AdEventType.ERROR, () => {
          this.clearCache();
        })
      );

      unsubs.push(
        interstitial.addAdEventListener(AdEventType.CLOSED, () => {
          this.clearCache();
        })
      );

      this.unsubscribeListeners = unsubs;
      interstitial.load();
      return true;
    } catch {
      this.clearCache();
      return false;
    }
  }

  async showInterstitial(): Promise<boolean> {
    const canShow = await this.canShowInterstitial();
    if (!canShow || !this.cachedInterstitial) {
      return false;
    }

    try {
      const ad = this.cachedInterstitial;
      await ad.show();
      await recordInterstitialImpression();
      this.clearCache();
      return true;
    } catch {
      this.clearCache();
      return false;
    }
  }

  clearCache(): void {
    for (const unsub of this.unsubscribeListeners) {
      try {
        unsub();
      } catch {
        // Ignore
      }
    }
    this.unsubscribeListeners = [];
    this.cachedInterstitial = null;
    this.isLoaded = false;
  }
}

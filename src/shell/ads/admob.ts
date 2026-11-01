import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import type {
  AdsConsentStatus as AdsConsentStatusType,
  InterstitialAd,
} from 'react-native-google-mobile-ads';
import { AdConsentStatus as LeadMateConsentStatus, AdService } from './types';
import { isInterstitialCooldownActive, recordInterstitialImpression } from './storage';

export const FallbackTestIds = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
} as const;

export function isNativeGoogleMobileAdsAvailable(): boolean {
  if (typeof Platform === 'undefined' || !Platform || Platform.OS === 'web') {
    return false;
  }
  try {
    let hasTurbo = false;
    if (
      typeof TurboModuleRegistry !== 'undefined' &&
      TurboModuleRegistry &&
      typeof TurboModuleRegistry.get === 'function'
    ) {
      hasTurbo = Boolean(TurboModuleRegistry.get('RNGoogleMobileAdsModule'));
    }

    const hasBridge = Boolean(
      typeof NativeModules !== 'undefined' &&
        NativeModules &&
        (NativeModules.RNGoogleMobileAdsModule ||
          NativeModules.RNGoogleMobileAdsInitModule ||
          NativeModules.RNGoogleMobileAdsConsentModule)
    );

    return hasTurbo || hasBridge;
  } catch {
    return false;
  }
}

let cachedGoogleMobileAds: any = null;

export function getGoogleMobileAdsModule(): any {
  if (cachedGoogleMobileAds) {
    return cachedGoogleMobileAds;
  }
  if (!isNativeGoogleMobileAdsAvailable()) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedGoogleMobileAds = require('react-native-google-mobile-ads');
    return cachedGoogleMobileAds;
  } catch {
    return null;
  }
}

export function resetGoogleMobileAdsModule(): void {
  cachedGoogleMobileAds = null;
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
      const gma = getGoogleMobileAdsModule();
      if (!gma) return;
      const MobileAds = gma.default ?? gma.MobileAds;
      if (typeof MobileAds === 'function') {
        await MobileAds().initialize();
      }
      this.initialized = true;
    } catch {
      // Gracefully survive initialization errors
    }
  }

  async requestConsentInfoUpdate(): Promise<LeadMateConsentStatus> {
    try {
      const gma = getGoogleMobileAdsModule();
      if (!gma?.AdsConsent?.requestInfoUpdate) {
        return this.consentStatus;
      }
      const consentInfo = await gma.AdsConsent.requestInfoUpdate();
      this.consentStatus = this.mapConsentStatus(consentInfo.status);
      return this.consentStatus;
    } catch {
      return this.consentStatus;
    }
  }

  async showConsentFormIfRequired(): Promise<LeadMateConsentStatus> {
    try {
      const gma = getGoogleMobileAdsModule();
      if (!gma?.AdsConsent?.showForm) {
        return this.consentStatus;
      }
      const status = await this.requestConsentInfoUpdate();
      if (status === 'REQUIRED') {
        const result = await gma.AdsConsent.showForm();
        this.consentStatus = this.mapConsentStatus(result.status);
      }
      return this.consentStatus;
    } catch {
      return this.consentStatus;
    }
  }

  private mapConsentStatus(status: AdsConsentStatusType | string): LeadMateConsentStatus {
    switch (status) {
      case 'REQUIRED':
        return 'REQUIRED';
      case 'OBTAINED':
        return 'OBTAINED';
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
    const gma = getGoogleMobileAdsModule();
    return gma?.TestIds?.BANNER ?? FallbackTestIds.BANNER;
  }

  getInterstitialUnitId(): string {
    const custom = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID;
    if (custom && typeof __DEV__ !== 'undefined' && !__DEV__) {
      return custom;
    }
    const gma = getGoogleMobileAdsModule();
    return gma?.TestIds?.INTERSTITIAL ?? FallbackTestIds.INTERSTITIAL;
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
      const gma = getGoogleMobileAdsModule();
      if (!gma?.InterstitialAd?.createForAdRequest) {
        return false;
      }

      const unitId = this.getInterstitialUnitId();
      const requestNonPersonalizedAdsOnly = this.consentStatus !== 'OBTAINED';
      const interstitial: InterstitialAd = gma.InterstitialAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly,
      });

      this.cachedInterstitial = interstitial;

      const unsubs: (() => void)[] = [];
      const eventLoaded = gma.AdEventType?.LOADED ?? 'loaded';
      const eventError = gma.AdEventType?.ERROR ?? 'error';
      const eventClosed = gma.AdEventType?.CLOSED ?? 'closed';

      unsubs.push(
        interstitial.addAdEventListener(eventLoaded, () => {
          this.isLoaded = true;
        })
      );

      unsubs.push(
        interstitial.addAdEventListener(eventError, () => {
          this.clearCache();
        })
      );

      unsubs.push(
        interstitial.addAdEventListener(eventClosed, () => {
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

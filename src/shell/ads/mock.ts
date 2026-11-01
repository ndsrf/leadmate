import { AdConsentStatus, AdService } from './types';
import { isInterstitialCooldownActive, recordInterstitialImpression } from './storage';

export class MockAdService implements AdService {
  public initialized = false;
  public consentStatus: AdConsentStatus = 'NOT_REQUIRED';
  public interstitialReady = false;
  public preloadCount = 0;
  public showCount = 0;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async requestConsentInfoUpdate(): Promise<AdConsentStatus> {
    return this.consentStatus;
  }

  async showConsentFormIfRequired(): Promise<AdConsentStatus> {
    if (this.consentStatus === 'REQUIRED') {
      this.consentStatus = 'OBTAINED';
    }
    return this.consentStatus;
  }

  isInterstitialReady(): boolean {
    return this.interstitialReady;
  }

  async canShowInterstitial(): Promise<boolean> {
    if (!this.interstitialReady) return false;
    const cooldownActive = await isInterstitialCooldownActive();
    return !cooldownActive;
  }

  async preloadInterstitial(): Promise<boolean> {
    this.preloadCount++;
    this.interstitialReady = true;
    return true;
  }

  async showInterstitial(): Promise<boolean> {
    const canShow = await this.canShowInterstitial();
    if (!canShow) {
      return false;
    }
    this.interstitialReady = false;
    this.showCount++;
    await recordInterstitialImpression();
    return true;
  }

  clearCache(): void {
    this.interstitialReady = false;
  }

  getBannerUnitId(): string {
    return 'ca-app-pub-3940256099942544/6300978111';
  }

  getInterstitialUnitId(): string {
    return 'ca-app-pub-3940256099942544/1033173712';
  }
}

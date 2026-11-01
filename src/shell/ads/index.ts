import { AdService } from './types';
import { MockAdService } from './mock';
import {
  GoogleMobileAdsService,
  isNativeGoogleMobileAdsAvailable,
  resetGoogleMobileAdsModule,
} from './admob';

export * from './types';
export * from './mock';
export * from './admob';
export * from './storage';
export * from './AdBanner';

let adInstance: AdService | null = null;

export interface GetAdServiceOptions {
  forceMock?: boolean;
}

/**
 * Returns the singleton AdService instance.
 * Automatically falls back to MockAdService on web, Jest, and environments
 * where native Google Mobile Ads modules are not linked.
 */
export function getAdService(options?: GetAdServiceOptions): AdService {
  if (adInstance) {
    return adInstance;
  }

  const shouldUseMock =
    options?.forceMock ||
    process.env.NODE_ENV === 'test' ||
    !isNativeGoogleMobileAdsAvailable();

  if (shouldUseMock) {
    adInstance = new MockAdService();
  } else {
    adInstance = new GoogleMobileAdsService();
  }

  return adInstance;
}

export function setAdService(service: AdService | null): void {
  adInstance = service;
}

export function resetAdService(): void {
  adInstance = null;
  resetGoogleMobileAdsModule();
}

/**
 * Gathers ad consent (Google UMP), then starts the ads SDK, in that order so no
 * ad is requested before consent is settled. Consent failing still starts the
 * SDK, which then serves non-personalized ads. Never rejects.
 */
export async function prepareAds(service: AdService = getAdService()): Promise<void> {
  try {
    await service.showConsentFormIfRequired();
  } catch {
    // fall through: non-personalized ads
  }
  try {
    await service.initialize();
  } catch {
    // the banner collapses on its own if ads cannot load
  }
}

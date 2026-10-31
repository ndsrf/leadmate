/**
 * Advertising subsystem interface definitions for LeadMate.
 */

export type AdConsentStatus = 'UNKNOWN' | 'NOT_REQUIRED' | 'REQUIRED' | 'OBTAINED';

export type AdEventType = 'loaded' | 'opened' | 'closed' | 'error' | 'clicked';

export type AdEventListener = (event: { type: AdEventType; error?: Error }) => void;

export interface AdService {
  /** Initializes SDK and prepares advertising subsystem. */
  initialize(): Promise<void>;

  /** Requests current UMP consent status. */
  requestConsentInfoUpdate(): Promise<AdConsentStatus>;

  /**
   * Displays the UMP consent form modally if consent is required.
   * Resolves immediately with current status if not required.
   */
  showConsentFormIfRequired(): Promise<AdConsentStatus>;

  /** Returns whether a transition interstitial is cached and ready to display. */
  isInterstitialReady(): boolean;

  /**
   * Checks whether an interstitial can be shown right now:
   * verifies an ad is preloaded and the 5-minute cooldown has elapsed.
   */
  canShowInterstitial(): Promise<boolean>;

  /** Preloads an interstitial in the background. */
  preloadInterstitial(): Promise<boolean>;

  /**
   * Shows the preloaded transition interstitial if ready and cooldown has elapsed.
   * Returns true if the ad was shown; returns false if not ready or on cooldown.
   * Never throws and never stalls caller navigation.
   */
  showInterstitial(): Promise<boolean>;

  /** Purges preloaded interstitial cache and resets in-flight ad requests (e.g. upon Plus upgrade). */
  clearCache(): void;

  /** Returns active banner ad unit ID (production or test fallback). */
  getBannerUnitId(): string;

  /** Returns active interstitial ad unit ID (production or test fallback). */
  getInterstitialUnitId(): string;
}

/** Cooldown interval between Transition Interstitials: 300 seconds (5 minutes). */
export const AD_INTERSTITIAL_COOLDOWN_MS = 300_000;

/** Device storage key where the last interstitial impression ISO timestamp is persisted. */
export const AD_LAST_INTERSTITIAL_STORAGE_KEY = '@leadmate/ads:last_interstitial_at';

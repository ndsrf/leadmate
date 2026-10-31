import React from 'react';
import { View } from 'react-native';

export const TestIds = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
};

export const BannerAdSize = {
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
  BANNER: 'BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
};

export const AdEventType = {
  LOADED: 'loaded',
  OPENED: 'opened',
  CLOSED: 'closed',
  ERROR: 'error',
  CLICKED: 'clicked',
};

export const AdsConsentStatus = {
  UNKNOWN: 'UNKNOWN',
  NOT_REQUIRED: 'NOT_REQUIRED',
  REQUIRED: 'REQUIRED',
  OBTAINED: 'OBTAINED',
};

export const AdsConsent = {
  requestInfoUpdate: async () => ({
    status: AdsConsentStatus.NOT_REQUIRED,
    isConsentFormAvailable: false,
  }),
  showForm: async () => ({
    status: AdsConsentStatus.OBTAINED,
  }),
};

export class InterstitialAd {
  private listeners: Map<string, Function[]> = new Map();
  public loaded = false;

  static createForAdRequest(unitId: string, _options?: Record<string, unknown>) {
    return new InterstitialAd(unitId);
  }

  constructor(public unitId: string) {}

  addAdEventListener(event: string, handler: Function) {
    const list = this.listeners.get(event) ?? [];
    list.push(handler);
    this.listeners.set(event, list);
    return () => {
      const cur = this.listeners.get(event) ?? [];
      this.listeners.set(event, cur.filter((h) => h !== handler));
    };
  }

  load() {
    this.loaded = true;
    const handlers = this.listeners.get(AdEventType.LOADED) ?? [];
    handlers.forEach((h) => h());
  }

  async show() {
    this.loaded = false;
    const opened = this.listeners.get(AdEventType.OPENED) ?? [];
    opened.forEach((h) => h());
    const closed = this.listeners.get(AdEventType.CLOSED) ?? [];
    closed.forEach((h) => h());
  }
}

export function BannerAd(props: any) {
  return React.createElement(View, { testID: 'admob-banner', ...props });
}

export function MobileAds() {
  return {
    initialize: async () => [],
    setRequestConfiguration: async () => {},
  };
}

export default MobileAds;

import React, { useState } from 'react';
import { View } from 'react-native';
import { getAdService } from './index';
import { isNativeGoogleMobileAdsAvailable, getGoogleMobileAdsModule } from './admob';
import { theme } from '../ui/theme';

export interface AdBannerProps {
  /** When true, ads are completely suppressed and component renders null. */
  isPlus?: boolean;
  /** Optional custom unit ID override (defaults to active AdService unit ID). */
  unitId?: string;
  /** Test identifier for testing. */
  testID?: string;
}

const baseContainerStyle = {
  width: '100%' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  borderTopWidth: 1,
  overflow: 'hidden' as const,
};

/**
 * Anchored adaptive banner component displayed at the base of the World Map
 * for Free Tier users. Unmounts immediately when `isPlus` is true and collapses
 * cleanly to 0 height if loading fails or when offline.
 *
 * Gracefully renders safe fallback in Expo Go, web, or when native TurboModules
 * are not registered in the native binary.
 */
export function AdBanner({ isPlus, unitId, testID = 'leadmate-ad-banner' }: AdBannerProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Plus members never see advertisements
  if (isPlus) {
    return null;
  }

  // If loading failed or inventory unfilled, collapse cleanly to 0 height
  if (hasError) {
    return null;
  }

  const adService = getAdService();
  const activeUnitId = unitId ?? adService.getBannerUnitId();

  // In non-native environments (e.g. web, Expo Go without custom binary, or Jest without native modules)
  if (!isNativeGoogleMobileAdsAvailable()) {
    return (
      <View
        testID={testID}
        style={[
          baseContainerStyle,
          {
            backgroundColor: theme.color.bg,
            borderTopColor: theme.color.edge,
          },
        ]}
      />
    );
  }

  const gma = getGoogleMobileAdsModule();
  const BannerAd = gma?.BannerAd;
  const BannerAdSize = gma?.BannerAdSize;

  if (!BannerAd) {
    return (
      <View
        testID={testID}
        style={[
          baseContainerStyle,
          {
            backgroundColor: theme.color.bg,
            borderTopColor: theme.color.edge,
          },
        ]}
      />
    );
  }

  return (
    <View
      testID={testID}
      style={[
        baseContainerStyle,
        {
          backgroundColor: theme.color.bg,
          borderTopColor: theme.color.edge,
          minHeight: isLoaded ? undefined : 50,
        },
      ]}
    >
      <BannerAd
        unitId={activeUnitId}
        size={BannerAdSize?.ANCHORED_ADAPTIVE_BANNER ?? 'ANCHORED_ADAPTIVE_BANNER'}
        onAdLoaded={() => {
          setIsLoaded(true);
          setHasError(false);
        }}
        onAdFailedToLoad={() => {
          setHasError(true);
        }}
      />
    </View>
  );
}

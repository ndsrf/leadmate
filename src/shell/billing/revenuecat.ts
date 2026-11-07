import { NativeModules, Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PACKAGE_TYPE,
  PurchasesPackage,
  PurchasesOfferings,
} from 'react-native-purchases';
import {
  BillingPackage,
  BillingService,
  CustomerEntitlement,
  PurchaseResult,
  RestoreResult,
} from './types';
import { DEFAULT_MOCK_PACKAGES } from './mock';

export const PLUS_ENTITLEMENT_ID = 'plus';

export function isNativePurchasesAvailable(): boolean {
  if (Platform.OS === 'web') {
    return false;
  }
  return Boolean(NativeModules && NativeModules.RNPurchases);
}

export function getRevenueCatApiKey(): string | null {
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY ?? null;
  }
  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY ?? null;
  }
  return null;
}

export interface RevenueCatServiceOptions {
  purchasesSdk?: typeof Purchases;
  apiKey?: string;
}

export class RevenueCatBillingService implements BillingService {
  private sdk: typeof Purchases;
  private configured = false;
  private cachedPackages: Map<string, PurchasesPackage> = new Map();
  private apiKey: string | null = null;

  constructor(options?: RevenueCatServiceOptions) {
    this.sdk = options?.purchasesSdk ?? Purchases;
    if (options?.apiKey) {
      this.apiKey = options.apiKey;
    }
  }

  async initialize(apiKey?: string, appUserId?: string): Promise<void> {
    const key = apiKey ?? this.apiKey ?? getRevenueCatApiKey();
    if (!key) {
      console.warn('[RevenueCatBillingService] No API key available for current platform; initialization skipped');
      return;
    }

    if (!isNativePurchasesAvailable() && !this.sdk.configure) {
      console.warn('[RevenueCatBillingService] Native purchases module is not available');
      return;
    }

    this.sdk.configure({
      apiKey: key,
      appUserID: appUserId ?? undefined,
    });
    this.configured = true;
  }

  isConfigured(): boolean {
    return this.configured;
  }

  private mapPackage(rcPkg: PurchasesPackage): BillingPackage {
    const isAnnual =
      rcPkg.packageType === PACKAGE_TYPE.ANNUAL ||
      rcPkg.identifier.toLowerCase().includes('annual') ||
      rcPkg.product.identifier.toLowerCase().includes('annual');

    return {
      id: rcPkg.identifier,
      tier: isAnnual ? 'annual' : 'monthly',
      priceString: rcPkg.product.priceString,
      rawPrice: rcPkg.product.price,
      currencyCode: rcPkg.product.currencyCode,
    };
  }

  async getPackages(): Promise<BillingPackage[]> {
    try {
      const offerings: PurchasesOfferings = await this.sdk.getOfferings();
      this.cachedPackages.clear();

      const available = offerings.current?.availablePackages ?? [];
      if (available.length === 0) {
        return DEFAULT_MOCK_PACKAGES;
      }

      const packages: BillingPackage[] = [];
      for (const pkg of available) {
        this.cachedPackages.set(pkg.identifier, pkg);
        packages.push(this.mapPackage(pkg));
      }

      return packages;
    } catch (err) {
      console.warn('[RevenueCatBillingService] Failed to load offerings from store, falling back to defaults:', err);
      return DEFAULT_MOCK_PACKAGES;
    }
  }

  private extractEntitlement(customerInfo: CustomerInfo): CustomerEntitlement {
    const active = customerInfo.entitlements?.active ?? {};
    const entitlement = active[PLUS_ENTITLEMENT_ID] ?? active['LeadMate Plus'] ?? Object.values(active)[0];

    if (entitlement && entitlement.isActive !== false) {
      const isAnnual =
        entitlement.productIdentifier?.toLowerCase().includes('annual') ||
        entitlement.identifier?.toLowerCase().includes('annual');

      return {
        isPlus: true,
        expiresAt: entitlement.expirationDate ?? null,
        tier: isAnnual ? 'annual' : 'monthly',
        willRenew: entitlement.willRenew ?? true,
      };
    }

    return {
      isPlus: false,
      expiresAt: null,
    };
  }

  async purchasePackage(pkg: BillingPackage): Promise<PurchaseResult> {
    try {
      let rcPkg = this.cachedPackages.get(pkg.id);
      if (!rcPkg) {
        const offerings = await this.sdk.getOfferings();
        const available = offerings.current?.availablePackages ?? [];
        for (const item of available) {
          this.cachedPackages.set(item.identifier, item);
        }
        rcPkg = this.cachedPackages.get(pkg.id);
      }

      if (!rcPkg) {
        return {
          success: false,
          isPlus: false,
          error: `Package ${pkg.id} not found in store offerings`,
        };
      }

      const { customerInfo } = await this.sdk.purchasePackage(rcPkg);
      const entitlement = this.extractEntitlement(customerInfo);

      return {
        success: entitlement.isPlus,
        isPlus: entitlement.isPlus,
      };
    } catch (error: any) {
      if (error?.userCancelled || error?.code === '1') {
        return {
          success: false,
          isPlus: false,
          userCancelled: true,
        };
      }

      return {
        success: false,
        isPlus: false,
        error: error?.message ?? String(error),
      };
    }
  }

  async restorePurchases(): Promise<RestoreResult> {
    try {
      const customerInfo = await this.sdk.restorePurchases();
      const entitlement = this.extractEntitlement(customerInfo);
      return {
        success: true,
        isPlus: entitlement.isPlus,
      };
    } catch (error: any) {
      return {
        success: false,
        isPlus: false,
        error: error?.message ?? String(error),
      };
    }
  }

  async logIn(userId: string): Promise<void> {
    try {
      await this.sdk.logIn(userId);
    } catch (err) {
      console.warn('[RevenueCatBillingService] Failed to log in user:', err);
    }
  }

  async logOut(): Promise<void> {
    try {
      // RevenueCat rejects logOut for an anonymous user, which is the normal state before any sign-in
      if (await this.sdk.isAnonymous()) return;
      await this.sdk.logOut();
    } catch (err) {
      console.warn('[RevenueCatBillingService] Failed to log out user:', err);
    }
  }

  async checkEntitlements(): Promise<CustomerEntitlement> {
    try {
      const customerInfo = await this.sdk.getCustomerInfo();
      return this.extractEntitlement(customerInfo);
    } catch (err) {
      console.warn('[RevenueCatBillingService] Failed to check entitlements:', err);
      return {
        isPlus: false,
        expiresAt: null,
      };
    }
  }
}

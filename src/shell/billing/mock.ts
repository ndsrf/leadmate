import { BillingPackage, BillingService, CustomerEntitlement, PurchaseResult, RestoreResult } from './types';

export const DEFAULT_MOCK_PACKAGES: BillingPackage[] = [
  {
    id: '$rc_annual',
    tier: 'annual',
    priceString: '39,99 €',
    rawPrice: 39.99,
    currencyCode: 'EUR',
  },
  {
    id: '$rc_monthly',
    tier: 'monthly',
    priceString: '4,99 €',
    rawPrice: 4.99,
    currencyCode: 'EUR',
  },
];

export interface MockBillingOptions {
  packages?: BillingPackage[];
  initialEntitlement?: Partial<CustomerEntitlement>;
}

export class MockBillingService implements BillingService {
  private packages: BillingPackage[];
  private entitlement: CustomerEntitlement;
  private currentUserId: string | null = null;
  private initialized = false;

  // Simulation hooks for testing
  private nextPurchaseResult: PurchaseResult | null = null;
  private nextRestoreResult: RestoreResult | null = null;

  constructor(options?: MockBillingOptions) {
    this.packages = options?.packages ? [...options.packages] : [...DEFAULT_MOCK_PACKAGES];
    this.entitlement = {
      isPlus: false,
      expiresAt: null,
      ...options?.initialEntitlement,
    };
  }

  async initialize(apiKey?: string, appUserId?: string): Promise<void> {
    this.initialized = true;
    if (appUserId) {
      this.currentUserId = appUserId;
    }
  }

  isReady(): boolean {
    return this.initialized;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  setPackages(packages: BillingPackage[]): void {
    this.packages = [...packages];
  }

  async getPackages(): Promise<BillingPackage[]> {
    return [...this.packages];
  }

  setEntitlement(entitlement: Partial<CustomerEntitlement>): void {
    this.entitlement = {
      ...this.entitlement,
      ...entitlement,
    };
  }

  setNextPurchaseResult(result: PurchaseResult | null): void {
    this.nextPurchaseResult = result;
  }

  setNextRestoreResult(result: RestoreResult | null): void {
    this.nextRestoreResult = result;
  }

  async purchasePackage(pkg: BillingPackage): Promise<PurchaseResult> {
    if (this.nextPurchaseResult) {
      const res = this.nextPurchaseResult;
      this.nextPurchaseResult = null;
      if (res.success && res.isPlus) {
        this.entitlement = {
          isPlus: true,
          tier: pkg.tier,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          willRenew: true,
        };
      }
      return res;
    }

    // Default successful purchase simulation
    const durationDays = pkg.tier === 'annual' ? 365 : 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    this.entitlement = {
      isPlus: true,
      tier: pkg.tier,
      expiresAt,
      willRenew: true,
    };

    return {
      success: true,
      isPlus: true,
    };
  }

  async restorePurchases(): Promise<RestoreResult> {
    if (this.nextRestoreResult) {
      const res = this.nextRestoreResult;
      this.nextRestoreResult = null;
      if (res.success && res.isPlus) {
        this.entitlement.isPlus = true;
      }
      return res;
    }

    // Default restore behavior: returns current entitlement status
    return {
      success: true,
      isPlus: this.entitlement.isPlus,
    };
  }

  async logIn(userId: string): Promise<void> {
    this.currentUserId = userId;
  }

  async logOut(): Promise<void> {
    this.currentUserId = null;
  }

  async checkEntitlements(): Promise<CustomerEntitlement> {
    return { ...this.entitlement };
  }
}

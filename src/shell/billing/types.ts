export type BillingTier = 'annual' | 'monthly';

export interface BillingPackage {
  id: string;
  tier: BillingTier;
  priceString: string;
  rawPrice: number;
  currencyCode: string;
}

export interface CustomerEntitlement {
  isPlus: boolean;
  expiresAt: string | null;
  tier?: BillingTier;
  willRenew?: boolean;
}

export interface PurchaseResult {
  success: boolean;
  isPlus: boolean;
  userCancelled?: boolean;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  isPlus: boolean;
  error?: string;
}

export interface BillingService {
  initialize(apiKey?: string, appUserId?: string): Promise<void>;
  getPackages(): Promise<BillingPackage[]>;
  purchasePackage(pkg: BillingPackage): Promise<PurchaseResult>;
  restorePurchases(): Promise<RestoreResult>;
  logIn(userId: string): Promise<void>;
  logOut(): Promise<void>;
  checkEntitlements(): Promise<CustomerEntitlement>;
}

import { BillingService } from './types';
import { MockBillingService } from './mock';
import { RevenueCatBillingService, isNativePurchasesAvailable } from './revenuecat';

export * from './types';
export * from './mock';
export * from './revenuecat';

let billingInstance: BillingService | null = null;

export interface GetBillingServiceOptions {
  forceMock?: boolean;
}

export function getBillingService(options?: GetBillingServiceOptions): BillingService {
  if (billingInstance) {
    return billingInstance;
  }

  const shouldUseMock =
    options?.forceMock ||
    process.env.NODE_ENV === 'test' ||
    !isNativePurchasesAvailable();

  if (shouldUseMock) {
    billingInstance = new MockBillingService();
  } else {
    billingInstance = new RevenueCatBillingService();
  }

  return billingInstance;
}

export function setBillingService(service: BillingService | null): void {
  billingInstance = service;
}

export function resetBillingService(): void {
  billingInstance = null;
}

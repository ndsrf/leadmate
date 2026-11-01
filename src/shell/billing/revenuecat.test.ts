jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  NativeModules: { RNPurchases: {} },
}));

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    getCustomerInfo: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(),
  },
  PACKAGE_TYPE: {
    ANNUAL: 'ANNUAL',
    MONTHLY: 'MONTHLY',
    WEEKLY: 'WEEKLY',
    LIFETIME: 'LIFETIME',
    SIX_MONTH: 'SIX_MONTH',
    THREE_MONTH: 'THREE_MONTH',
    TWO_MONTH: 'TWO_MONTH',
    CUSTOM: 'CUSTOM',
    UNKNOWN: 'UNKNOWN',
  },
}));

import { RevenueCatBillingService, PLUS_ENTITLEMENT_ID } from './revenuecat';
import { DEFAULT_MOCK_PACKAGES } from './mock';
import { PACKAGE_TYPE } from 'react-native-purchases';

describe('RevenueCatBillingService', () => {
  let mockSdk: any;
  let service: RevenueCatBillingService;

  const mockActiveEntitlement = {
    identifier: PLUS_ENTITLEMENT_ID,
    isActive: true,
    expirationDate: '2027-01-01T00:00:00.000Z',
    productIdentifier: 'com.leadmate.plus.annual',
    willRenew: true,
  };

  const mockCustomerInfo = {
    entitlements: {
      active: {
        [PLUS_ENTITLEMENT_ID]: mockActiveEntitlement,
      },
    },
  };

  const mockPurchasesPackage = {
    identifier: '$rc_annual',
    packageType: PACKAGE_TYPE.ANNUAL,
    product: {
      identifier: 'com.leadmate.plus.annual',
      price: 39.99,
      priceString: '39,99 €',
      currencyCode: 'EUR',
    },
  };

  beforeEach(() => {
    mockSdk = {
      configure: jest.fn(),
      getOfferings: jest.fn().mockResolvedValue({
        current: {
          availablePackages: [mockPurchasesPackage],
        },
      }),
      purchasePackage: jest.fn().mockResolvedValue({
        customerInfo: mockCustomerInfo,
      }),
      restorePurchases: jest.fn().mockResolvedValue(mockCustomerInfo),
      getCustomerInfo: jest.fn().mockResolvedValue(mockCustomerInfo),
      logIn: jest.fn().mockResolvedValue({ customerInfo: mockCustomerInfo }),
      logOut: jest.fn().mockResolvedValue(mockCustomerInfo),
    };

    service = new RevenueCatBillingService({
      purchasesSdk: mockSdk,
      apiKey: 'test-rc-key',
    });
  });

  it('configures sdk with provided API key and app user ID', async () => {
    await service.initialize('explicit-api-key', 'user-123');
    expect(mockSdk.configure).toHaveBeenCalledWith({
      apiKey: 'explicit-api-key',
      appUserID: 'user-123',
    });
    expect(service.isConfigured()).toBe(true);
  });

  it('retrieves and maps available packages', async () => {
    const packages = await service.getPackages();
    expect(packages).toHaveLength(1);
    expect(packages[0]).toEqual({
      id: '$rc_annual',
      tier: 'annual',
      priceString: '39,99 €',
      rawPrice: 39.99,
      currencyCode: 'EUR',
    });
  });

  it('falls back to default packages if offerings fetch fails', async () => {
    mockSdk.getOfferings.mockRejectedValueOnce(new Error('Network error'));
    const packages = await service.getPackages();
    expect(packages).toEqual(DEFAULT_MOCK_PACKAGES);
  });

  it('executes successful package purchase', async () => {
    await service.getPackages();
    const result = await service.purchasePackage({
      id: '$rc_annual',
      tier: 'annual',
      priceString: '39,99 €',
      rawPrice: 39.99,
      currencyCode: 'EUR',
    });

    expect(mockSdk.purchasePackage).toHaveBeenCalledWith(mockPurchasesPackage);
    expect(result.success).toBe(true);
    expect(result.isPlus).toBe(true);
  });

  it('handles user cancellation gracefully without error', async () => {
    await service.getPackages();
    mockSdk.purchasePackage.mockRejectedValueOnce({
      userCancelled: true,
      code: '1',
      message: 'User cancelled',
    });

    const result = await service.purchasePackage({
      id: '$rc_annual',
      tier: 'annual',
      priceString: '39,99 €',
      rawPrice: 39.99,
      currencyCode: 'EUR',
    });

    expect(result.success).toBe(false);
    expect(result.isPlus).toBe(false);
    expect(result.userCancelled).toBe(true);
  });

  it('handles unexpected transaction failure', async () => {
    await service.getPackages();
    mockSdk.purchasePackage.mockRejectedValueOnce(new Error('Card declined'));

    const result = await service.purchasePackage({
      id: '$rc_annual',
      tier: 'annual',
      priceString: '39,99 €',
      rawPrice: 39.99,
      currencyCode: 'EUR',
    });

    expect(result.success).toBe(false);
    expect(result.isPlus).toBe(false);
    expect(result.error).toContain('Card declined');
  });

  it('restores purchases successfully', async () => {
    const result = await service.restorePurchases();
    expect(mockSdk.restorePurchases).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.isPlus).toBe(true);
  });

  it('restores purchases when user has no active entitlement', async () => {
    mockSdk.restorePurchases.mockResolvedValueOnce({
      entitlements: { active: {} },
    });
    const result = await service.restorePurchases();
    expect(result.success).toBe(true);
    expect(result.isPlus).toBe(false);
  });

  it('handles error during restore purchases', async () => {
    mockSdk.restorePurchases.mockRejectedValueOnce(new Error('Receipt missing'));
    const result = await service.restorePurchases();
    expect(result.success).toBe(false);
    expect(result.isPlus).toBe(false);
    expect(result.error).toContain('Receipt missing');
  });

  it('delegates logIn and logOut to sdk', async () => {
    await service.logIn('supabase-uuid-456');
    expect(mockSdk.logIn).toHaveBeenCalledWith('supabase-uuid-456');

    await service.logOut();
    expect(mockSdk.logOut).toHaveBeenCalled();
  });

  it('checks entitlements from customer info', async () => {
    const entitlement = await service.checkEntitlements();
    expect(entitlement.isPlus).toBe(true);
    expect(entitlement.tier).toBe('annual');
    expect(entitlement.expiresAt).toBe('2027-01-01T00:00:00.000Z');
  });
});

import { MockBillingService, DEFAULT_MOCK_PACKAGES } from './mock';
import { BillingPackage } from './types';

describe('MockBillingService', () => {
  it('initializes with default packages and empty entitlement', async () => {
    const service = new MockBillingService();
    expect(service.isReady()).toBe(false);

    await service.initialize('mock_key', 'initial-user');
    expect(service.isReady()).toBe(true);
    expect(service.getCurrentUserId()).toBe('initial-user');

    const packages = await service.getPackages();
    expect(packages).toEqual(DEFAULT_MOCK_PACKAGES);

    const entitlement = await service.checkEntitlements();
    expect(entitlement.isPlus).toBe(false);
    expect(entitlement.expiresAt).toBeNull();
  });

  it('allows customizing packages', async () => {
    const customPackages: BillingPackage[] = [
      {
        id: 'tier_special',
        tier: 'monthly',
        priceString: '$2.99',
        rawPrice: 2.99,
        currencyCode: 'USD',
      },
    ];
    const service = new MockBillingService({ packages: customPackages });
    expect(await service.getPackages()).toEqual(customPackages);

    service.setPackages(DEFAULT_MOCK_PACKAGES);
    expect(await service.getPackages()).toEqual(DEFAULT_MOCK_PACKAGES);
  });

  it('handles simulated purchase successfully', async () => {
    const service = new MockBillingService();
    const [annualPkg] = await service.getPackages();

    const result = await service.purchasePackage(annualPkg);
    expect(result.success).toBe(true);
    expect(result.isPlus).toBe(true);

    const entitlement = await service.checkEntitlements();
    expect(entitlement.isPlus).toBe(true);
    expect(entitlement.tier).toBe('annual');
    expect(entitlement.expiresAt).toBeTruthy();
  });

  it('handles user cancellation simulation without granting plus', async () => {
    const service = new MockBillingService();
    const [, monthlyPkg] = await service.getPackages();

    service.setNextPurchaseResult({
      success: false,
      isPlus: false,
      userCancelled: true,
    });

    const result = await service.purchasePackage(monthlyPkg);
    expect(result.success).toBe(false);
    expect(result.userCancelled).toBe(true);

    const entitlement = await service.checkEntitlements();
    expect(entitlement.isPlus).toBe(false);
  });

  it('handles error simulation during purchase', async () => {
    const service = new MockBillingService();
    const [pkg] = await service.getPackages();

    service.setNextPurchaseResult({
      success: false,
      isPlus: false,
      error: 'Network connection failed',
    });

    const result = await service.purchasePackage(pkg);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network connection failed');
    expect((await service.checkEntitlements()).isPlus).toBe(false);
  });

  it('handles purchase restoration', async () => {
    const service = new MockBillingService();

    // No purchases yet
    const restoreEmpty = await service.restorePurchases();
    expect(restoreEmpty.success).toBe(true);
    expect(restoreEmpty.isPlus).toBe(false);

    // Purchase made
    const [pkg] = await service.getPackages();
    await service.purchasePackage(pkg);

    // Now restore finds the purchase
    const restoreActive = await service.restorePurchases();
    expect(restoreActive.success).toBe(true);
    expect(restoreActive.isPlus).toBe(true);
  });

  it('handles simulated restore result', async () => {
    const service = new MockBillingService();
    service.setNextRestoreResult({
      success: true,
      isPlus: true,
    });

    const result = await service.restorePurchases();
    expect(result.success).toBe(true);
    expect(result.isPlus).toBe(true);
    expect((await service.checkEntitlements()).isPlus).toBe(true);
  });

  it('tracks logIn and logOut transitions', async () => {
    const service = new MockBillingService();
    await service.initialize();
    expect(service.getCurrentUserId()).toBeNull();

    await service.logIn('supabase-user-uuid');
    expect(service.getCurrentUserId()).toBe('supabase-user-uuid');

    await service.logOut();
    expect(service.getCurrentUserId()).toBeNull();
  });
});

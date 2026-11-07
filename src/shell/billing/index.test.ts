jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  NativeModules: { RNPurchases: {} },
}));

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
  },
  PACKAGE_TYPE: {
    ANNUAL: 'ANNUAL',
    MONTHLY: 'MONTHLY',
  },
}));

import {
  getBillingService,
  setBillingService,
  resetBillingService,
  MockBillingService,
  RevenueCatBillingService,
} from './index';
import * as rcModule from './revenuecat';

describe('billing factory (getBillingService)', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    resetBillingService();
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('defaults to MockBillingService in test environment', () => {
    const service = getBillingService();
    expect(service).toBeInstanceOf(MockBillingService);
  });

  it('returns singleton instance on subsequent calls', () => {
    const service1 = getBillingService();
    const service2 = getBillingService();
    expect(service1).toBe(service2);
  });

  it('allows overriding service with setBillingService', () => {
    const customMock = new MockBillingService();
    setBillingService(customMock);
    expect(getBillingService()).toBe(customMock);
  });

  it('clears instance on resetBillingService', () => {
    const first = getBillingService();
    resetBillingService();
    const second = getBillingService();
    expect(first).not.toBe(second);
  });

  it('selects RevenueCatBillingService in non-test environment when native module available', () => {
    process.env.NODE_ENV = 'production';
    jest.spyOn(rcModule, 'isNativePurchasesAvailable').mockReturnValue(true);
    jest.spyOn(rcModule, 'getRevenueCatApiKey').mockReturnValue('test_key');

    const service = getBillingService();
    expect(service).toBeInstanceOf(RevenueCatBillingService);
  });

  it('falls back to MockBillingService when the native module exists but no RevenueCat key is set', () => {
    process.env.NODE_ENV = 'production';
    jest.spyOn(rcModule, 'isNativePurchasesAvailable').mockReturnValue(true);
    jest.spyOn(rcModule, 'getRevenueCatApiKey').mockReturnValue(null);

    const service = getBillingService();
    expect(service).toBeInstanceOf(MockBillingService);
  });

  it('falls back to MockBillingService in production when native module unavailable', () => {
    process.env.NODE_ENV = 'production';
    jest.spyOn(rcModule, 'isNativePurchasesAvailable').mockReturnValue(false);

    const service = getBillingService();
    expect(service).toBeInstanceOf(MockBillingService);
  });
});

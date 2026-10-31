jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  NativeModules: { RNGoogleMobileAdsModule: {} },
}));

import { getAdService, resetAdService, setAdService } from './index';
import { MockAdService } from './mock';
import { GoogleMobileAdsService } from './admob';

describe('AdService Factory', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    resetAdService();
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('defaults to MockAdService in test environment', () => {
    const service = getAdService();
    expect(service).toBeInstanceOf(MockAdService);
  });

  it('reuses singleton instance on multiple calls', () => {
    const s1 = getAdService();
    const s2 = getAdService();
    expect(s1).toBe(s2);
  });

  it('respects forceMock option', () => {
    const service = getAdService({ forceMock: true });
    expect(service).toBeInstanceOf(MockAdService);
  });

  it('supports overriding service via setAdService', () => {
    const custom = new GoogleMobileAdsService();
    setAdService(custom);
    expect(getAdService()).toBe(custom);
  });

  it('clears instance on resetAdService', () => {
    const s1 = getAdService();
    resetAdService();
    const s2 = getAdService();
    expect(s1).not.toBe(s2);
  });
});

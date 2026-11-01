jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  NativeModules: { RNGoogleMobileAdsModule: {} },
}));

import { getAdService, prepareAds, resetAdService, setAdService } from './index';
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

describe('prepareAds', () => {
  it('asks for consent first, then starts the ads SDK', async () => {
    const service = new MockAdService();
    const calls: string[] = [];
    service.showConsentFormIfRequired = async () => {
      calls.push('consent');
      return 'OBTAINED';
    };
    service.initialize = async () => {
      calls.push('initialize');
    };
    await prepareAds(service);
    expect(calls).toEqual(['consent', 'initialize']);
  });

  it('still starts the SDK when the consent step fails, so non-personalized ads can serve', async () => {
    const service = new MockAdService();
    service.showConsentFormIfRequired = async () => {
      throw new Error('UMP unavailable');
    };
    await prepareAds(service);
    expect(service.initialized).toBe(true);
  });

  it('never rejects, even when the SDK fails to start', async () => {
    const service = new MockAdService();
    service.initialize = async () => {
      throw new Error('boom');
    };
    await expect(prepareAds(service)).resolves.toBeUndefined();
  });
});

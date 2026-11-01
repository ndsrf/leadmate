jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  NativeModules: {},
  AppState: { addEventListener: jest.fn() },
}));

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {},
  PACKAGE_TYPE: {
    ANNUAL: 'ANNUAL',
    MONTHLY: 'MONTHLY',
  },
}));

import type { SupabaseClient } from '@supabase/supabase-js';
import { MockBillingService, setBillingService } from '../billing';
import { supabaseAuth } from './auth';
import { syncAuthWithBilling } from './useAccount';

describe('syncAuthWithBilling', () => {
  let mockBilling: MockBillingService;

  beforeEach(() => {
    mockBilling = new MockBillingService();
    setBillingService(mockBilling);
  });

  it('calls logIn with userId when user signs in with a valid userId', async () => {
    const logInSpy = jest.spyOn(mockBilling, 'logIn');
    const logOutSpy = jest.spyOn(mockBilling, 'logOut');

    await syncAuthWithBilling(true, 'supabase-user-uuid-123', mockBilling);

    expect(logInSpy).toHaveBeenCalledWith('supabase-user-uuid-123');
    expect(logOutSpy).not.toHaveBeenCalled();
    expect(mockBilling.getCurrentUserId()).toBe('supabase-user-uuid-123');
  });

  it('calls logOut when user signs out', async () => {
    await mockBilling.logIn('previous-user');
    const logInSpy = jest.spyOn(mockBilling, 'logIn');
    const logOutSpy = jest.spyOn(mockBilling, 'logOut');

    await syncAuthWithBilling(false, null, mockBilling);

    expect(logOutSpy).toHaveBeenCalled();
    expect(logInSpy).not.toHaveBeenCalled();
    expect(mockBilling.getCurrentUserId()).toBeNull();
  });

  it('does nothing when signedIn is true but userId is empty or null', async () => {
    const logInSpy = jest.spyOn(mockBilling, 'logIn');
    const logOutSpy = jest.spyOn(mockBilling, 'logOut');

    await syncAuthWithBilling(true, null, mockBilling);
    await syncAuthWithBilling(true, undefined, mockBilling);

    expect(logInSpy).not.toHaveBeenCalled();
    expect(logOutSpy).not.toHaveBeenCalled();
  });

  it('integrates with supabaseAuth watcher to trigger billing transitions on auth changes', async () => {
    let authListener: ((event: string, session: any) => void) | null = null;
    const initialSession: any = null;

    const fakeClient = {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        getSession: jest.fn().mockImplementation(async () => ({
          data: { session: initialSession },
        })),
        onAuthStateChange: jest.fn().mockImplementation((callback: (event: string, session: any) => void) => {
          authListener = callback;
          return { data: { subscription: { unsubscribe: jest.fn() } } };
        }),
      },
      functions: { invoke: jest.fn() },
    } as unknown as SupabaseClient;

    const authApi = supabaseAuth(fakeClient);

    // Set up auth watch listener mimicking useAccount
    const unsub = authApi.watch((isSignedIn, userId) => {
      syncAuthWithBilling(isSignedIn, userId, mockBilling);
    });

    // 1. Initial state (unauthenticated)
    expect(mockBilling.getCurrentUserId()).toBeNull();

    // 2. User signs in
    if (authListener) {
      (authListener as (event: string, session: any) => void)('SIGNED_IN', {
        user: { id: 'auth-user-999' },
      });
    }
    expect(mockBilling.getCurrentUserId()).toBe('auth-user-999');

    // 3. User signs out
    if (authListener) {
      (authListener as (event: string, session: any) => void)('SIGNED_OUT', null);
    }
    expect(mockBilling.getCurrentUserId()).toBeNull();

    unsub();
  });
});

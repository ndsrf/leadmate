import { getClient, isConfigured } from './client';

describe('Supabase client', () => {
  it('is null when the environment variables are unset, so sync does nothing', () => {
    expect(isConfigured(undefined, undefined)).toBe(false);
    expect(isConfigured('https://x.supabase.co', '')).toBe(false);
    expect(getClient()).toBeNull();
  });

  it('counts as configured when both variables are set', () => {
    expect(isConfigured('https://x.supabase.co', 'anon')).toBe(true);
  });
});

export const PACKAGE_TYPE = {
  ANNUAL: 'ANNUAL',
  MONTHLY: 'MONTHLY',
  WEEKLY: 'WEEKLY',
  LIFETIME: 'LIFETIME',
  SIX_MONTH: 'SIX_MONTH',
  THREE_MONTH: 'THREE_MONTH',
  TWO_MONTH: 'TWO_MONTH',
  CUSTOM: 'CUSTOM',
  UNKNOWN: 'UNKNOWN',
};

const Purchases = {
  configure: () => {},
  getOfferings: async () => ({ current: null }),
  purchasePackage: async () => ({ customerInfo: { entitlements: { active: {} } } }),
  restorePurchases: async () => ({ entitlements: { active: {} } }),
  getCustomerInfo: async () => ({ entitlements: { active: {} } }),
  logIn: async () => ({ customerInfo: { entitlements: { active: {} } } }),
  logOut: async () => ({ entitlements: { active: {} } }),
};

export default Purchases;

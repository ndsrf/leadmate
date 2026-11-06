/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/bundle'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^nativewind$': '<rootDir>/test/nativewind.ts',
    '^react-native-purchases$': '<rootDir>/test/purchasesStub.ts',
    '^react-native-google-mobile-ads$': '<rootDir>/test/googleMobileAdsStub.ts',
    '^@react-native-async-storage/async-storage$': '<rootDir>/test/asyncStorageStub.ts',
    '^expo-constants$': '<rootDir>/test/expoConstantsStub.ts',
    // a bundled image is an opaque asset id, as Metro resolves it
    '\\.png$': '<rootDir>/jest.assetStub.js',
  },
  transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json', diagnostics: true }] },
};

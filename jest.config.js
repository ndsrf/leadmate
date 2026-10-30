/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/bundle'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^nativewind$': '<rootDir>/test/nativewind.ts',
    // a bundled image is an opaque asset id, as Metro resolves it
    '\\.png$': '<rootDir>/jest.assetStub.js',
  },
  transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json', diagnostics: true }] },
};

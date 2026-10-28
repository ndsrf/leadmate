/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/bundle'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json', diagnostics: true }] },
};

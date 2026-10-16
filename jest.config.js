// Jest configuration for Expo/React Native
// Using ts-jest for pure logic tests

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "!lib/**/*.d.ts",
    "!lib/**/__tests__/**",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        // Includes app/api + lib/server (excluded from root Expo tsconfig)
        tsconfig: "<rootDir>/tsconfig.jest.json",
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // jose is ESM-only; allow Jest to transform it for dynamic import()
  transformIgnorePatterns: ["/node_modules/(?!(jose)/)"],
};

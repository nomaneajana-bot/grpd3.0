// Jest configuration for Expo/React Native
// Using ts-jest for pure logic tests; babel-jest for ESM-only deps (jose).

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "\\.d02\\.test\\.ts$"],
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "!lib/**/*.d.ts",
    "!lib/**/__tests__/**",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "mjs", "cjs"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json",
      },
    ],
    "^.+\\.(js|mjs)$": [
      "babel-jest",
      { configFile: "./babel.jest.config.js" },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transformIgnorePatterns: ["/node_modules/(?!(jose)/)"],
};

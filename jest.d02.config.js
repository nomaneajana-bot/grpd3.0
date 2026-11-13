/** Jest config for D02 backend integration (Node + disposable Postgres). */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/lib/server/__tests__"],
  testMatch: ["**/*.d02.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "mjs", "cjs"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
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
  transformIgnorePatterns: ["/node_modules/(?!(jose)/)"],
  testTimeout: 60000,
};

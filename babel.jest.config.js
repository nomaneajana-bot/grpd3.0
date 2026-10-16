// Jest-only Babel config: convert ESM-only deps (jose) for the CJS Jest runtime.
// App/Expo builds continue to use babel.config.js (babel-preset-expo).
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: { node: "current" },
        modules: "commonjs",
      },
    ],
  ],
};

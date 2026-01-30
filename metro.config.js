// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude Next.js API routes and server-only lib from bundling (Expo does not run these)
config.resolver.blockList = [
  ...(config.resolver.blockList || []),
  /backend\/.*/,
  /app\/api\/.*/,
  /lib\/server\/.*/,
  /lib\/api\/(prisma|auth-helpers|role-checks)\.ts/,
];

// Also exclude from watchFolders to prevent Metro from watching these directories
config.watchFolders = config.watchFolders || [];
config.watchFolders = config.watchFolders.filter(
  (folder) => !folder.includes("/backend"),
);

module.exports = config;

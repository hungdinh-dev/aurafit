// Expo SDK 52+ configures Metro for npm-workspace monorepos automatically
// (watchFolders + nodeModulesPaths), so @aurafit/* packages resolve from source.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });

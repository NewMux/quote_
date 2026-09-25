const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// marketing/ holds standalone projects (the Remotion launch video) with their own node_modules;
// keep Metro from crawling or resolving anything in them.
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList) ? existingBlockList : existingBlockList ? [existingBlockList] : []),
  /[/\\]marketing[/\\].*/,
];

module.exports = withNativeWind(config, { input: './global.css' });

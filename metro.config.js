const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /\.codex\/.*/,
  /\.agents\/.*/,
];

module.exports = config;

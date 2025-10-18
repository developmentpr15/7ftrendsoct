const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for @ alias
config.resolver.alias = {
  '@': './src',
  '@components': './src/components',
  '@screens': './src/screens',
  '@navigation': './src/navigation',
  '@utils': './src/utils',
  '@store': './src/store',
  '@styles': './src/styles',
  '@config': './src/config',
  '@hooks': './src/hooks',
  '@services': './src/services',
};

module.exports = config;
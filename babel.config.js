module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
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
          },
        },
      ],
      // Note: react-native-reanimated/plugin must be the last plugin
      'react-native-reanimated/plugin',
    ],
  };
};
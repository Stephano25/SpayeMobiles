const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ajouter la résolution pour web-streams-polyfill
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'web-streams-polyfill/ponyfill/es6': require.resolve('web-streams-polyfill/ponyfill/es6')
};

module.exports = config;

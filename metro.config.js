// ============================================================
// METRO CONFIG - SPaye Mobile
// ============================================================

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Désactiver les fonctionnalités problématiques
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Permettre l'importation de fichiers .android.js, .ios.js, etc.
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
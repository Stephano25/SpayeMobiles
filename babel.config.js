module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        // Désactiver la transformation des imports/exports pour éviter les conflits
        disableImportExportTransform: true,
        // Forcer l'utilisation de React JSX runtime automatique
        jsxRuntime: 'automatic'
      }]
    ],
    plugins: [
      // Pas de plugin reanimated
    ]
  };
};

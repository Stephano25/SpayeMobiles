// src/polyfills.ts
// ✅ Polyfills pour Expo SDK 54

// ✅ Polyfill pour PlatformConstants
try {
  const { NativeModules } = require('react-native');
  if (NativeModules && !NativeModules.PlatformConstants) {
    // @ts-ignore
    NativeModules.PlatformConstants = {
      getConstants: () => ({
        reactNativeVersion: { major: 0, minor: 74, patch: 3 },
        Version: '0.74.3',
        OS: 'android',
      }),
    };
  }
} catch (error) {
  console.warn('⚠️ Impossible de polyfill PlatformConstants:', error);
}

// ✅ Polyfill pour window sur mobile
if (typeof window !== 'undefined' && !window.navigator) {
  // @ts-ignore
  window.navigator = {};
}

export {};
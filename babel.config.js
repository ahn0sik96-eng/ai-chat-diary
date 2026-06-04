module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo (SDK 54+) automatically configures the
    // react-native-worklets / reanimated babel plugin, so we don't add it manually.
    presets: ['babel-preset-expo'],
  };
};

module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-reanimated 必须放在 plugins 列表的最后
      'react-native-reanimated/plugin',
    ],
  };
};

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 确保 watchFolders 使用正确的路径
config.watchFolders = [__dirname];

// 安全地获取 Expo 的默认排除列表
const existingBlockList = [].concat(config.resolver.blockList || []);

config.resolver.blockList = [
  ...existingBlockList,
  /.*\/\.expo\/.*/, // Expo 的缓存和构建产物目录

  // 1. 原生代码 (Java/C++/Objective-C)
  /.*\/react-native\/ReactAndroid\/.*/,
  /.*\/react-native\/ReactCommon\/.*/,

  // 2. 纯开发和调试工具
  /.*\/@typescript-eslint\/eslint-plugin\/.*/,

  // 3. 构建时数据
  /.*\/caniuse-lite\/data\/.*/,

  // 4. 通用规则
  /.*\/__tests__\/.*/, // 排除所有测试目录
  /.*\.git\/.*/, // 排除 Git 目录

  // 5. pnpm 临时目录（避免 ENOENT 错误）
  /.*node_modules\/\.pnpm\/.*_tmp_\d.*/,
];

// 导出配置（只有一个导出）
module.exports = config;


# 项目记账应用 - Android APK 构建指南

## ⭐ 最推荐方式：GitHub Actions 自动构建

**无需配置环境，直接从 GitHub 下载构建好的 APK**

### 快速开始

1. **访问 Actions 页面**
   - 打开: https://github.com/yazi8929/workhours-app/actions

2. **下载最新构建**
   - 选择最新的成功构建（绿色✓）
   - 向下滚动到 "Artifacts" 部分
   - 点击 `android-apk-production` 下载

3. **安装到手机**
   - 将 APK 文件传输到 Android 手机
   - 点击 APK 文件进行安装
   - 允许安装未知来源应用

### 详细说明

查看 [GitHub Actions 构建指南](./GITHUB_ACTIONS_GUIDE.md) 了解完整配置和使用方法。

---

## 🚀 其他构建方式（如果你需要自定义）

如果你需要在本地构建或自定义构建配置，请参考以下方法。

---

## 代码兼容性检查结果 ✅

经过全面检查，该应用完全支持Android本地使用：

### ✅ 数据存储
- 使用 `@react-native-async-storage/async-storage` 进行本地数据存储
- 数据完全存储在手机本地，不依赖后端服务
- 支持项目、支出、收款记录、开票记录的完整本地存储

### ✅ 平台兼容性
- 无使用Web API（localStorage、window、document等）
- 所有依赖包均支持Android平台
- 正确使用Expo官方库和React Native组件
- 文件操作使用 `expo-file-system/legacy`，完全兼容Android

### ✅ 权限配置
已在 `app.config.ts` 中配置必要的Android权限：
- 相册访问权限（expo-image-picker）
- 相机权限（expo-camera）
- 麦克风权限（expo-camera）
- 位置权限（expo-location）

### ✅ 应用配置
- 应用名称：ProjectAccountingApp
- 版本号：1.0.0
- 支持的SDK版本：Expo SDK 54
- 构建类型：APK（可直接安装）
- 包名：com.anonymous.x7613422460242919487

---

## 构建 APK 的两种方法

### 方法一：使用 EAS Build（推荐，最简单）

#### 1. 安装 EAS CLI
```bash
npm install -g eas-cli
```

#### 2. 登录 Expo 账户
```bash
eas login
```
如果没有账号，请先在 https://expo.dev 注册

#### 3. 配置构建（首次使用）
```bash
cd /workspace/projects/client
eas build:configure
```

#### 4. 开始构建预览版 APK
```bash
eas build --platform android --profile preview
```

#### 5. 等待构建完成
构建过程通常需要10-20分钟，完成后会提供APK下载链接

#### 6. 下载并安装
- 通过构建页面提供的链接下载APK文件
- 在Android手机上安装APK（需要允许安装未知来源应用）

---

### 方法二：本地构建（需要Android Studio）

#### 前置要求
- 安装 Android Studio
- 配置 Android SDK
- 安装 Java JDK（版本17或更高）
- 配置环境变量：ANDROID_HOME

#### 构建步骤

```bash
# 1. 进入项目目录
cd /workspace/projects/client

# 2. 生成原生项目（首次构建需要）
npx expo prebuild

# 3. 进入Android目录
cd android

# 4. 生成签名密钥（首次构建需要）
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.p12 -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# 5. 配置签名（编辑 android/app/build.gradle）
# 添加签名配置：
# signingConfigs {
#     release {
#         storeFile file('my-release-key.p12')
#         storePassword '你的密码'
#         keyAlias 'my-key-alias'
#         keyPassword '你的密码'
#     }
# }

# 6. 构建Release APK
cd ..
./gradlew assembleRelease

# 7. APK文件位置
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 构建配置说明

### EAS 构建配置 (eas.json)

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### 支持的构建模式

| 模式 | 说明 | 使用场景 |
|------|------|----------|
| **preview** | 预览版，构建速度快 | 内部测试、快速验证 |
| **production** | 生产版，经过完整优化 | 正式发布给用户 |

---

## 安装 APK 到手机

### 方法一：直接安装
1. 下载APK文件到手机
2. 在手机上点击APK文件
3. 允许安装未知来源应用（如果提示）
4. 点击安装

### 方法二：使用 ADB（需要开发者模式）
```bash
# 1. 启用手机的开发者模式和USB调试
# 2. 连接手机到电脑
# 3. 安装APK
adb install app-release.apk
```

---

## 应用功能验证

安装APK后，请验证以下功能：

### ✅ 基础功能
- [ ] 应用可以正常启动
- [ ] 创建新项目
- [ ] 编辑项目信息
- [ ] 添加支出记录
- [ ] 查看统计数据

### ✅ 本地存储功能
- [ ] 关闭应用后重新打开，数据仍然存在
- [ ] 收款记录正常保存和显示
- [ ] 开票记录正常保存和显示
- [ ] 数据导出功能正常
- [ ] 数据导入功能正常

### ✅ 权限功能
- [ ] 可以访问相册选择图片
- [ ] 可以使用相机拍照（如果需要）
- [ ] 文件导出正常

---

## 常见问题

### Q1: 构建失败，提示权限错误
**A**: 确保在 `app.config.ts` 中正确配置了所有权限

### Q2: APK 安装后无法打开
**A**: 检查Android版本，建议Android 7.0及以上

### Q3: 数据丢失
**A**: 应用数据存储在本地，卸载应用会清除数据。请使用数据导出功能备份

### Q4: EAS构建速度慢
**A**: 构建时间取决于服务器队列，通常需要10-20分钟

### Q5: 如何自定义应用图标和名称
**A**: 修改 `app.config.ts` 中的 `name` 和 `icon` 字段，然后重新构建

---

## 数据备份建议

由于应用使用本地存储，建议定期备份数据：

1. 使用应用内的"导出数据"功能导出JSON文件
2. 将导出的文件保存到云盘或电脑
3. 需要恢复时使用"导入数据"功能

---

## 技术支持

如遇到构建或使用问题，请检查：
1. Expo SDK版本是否为54.0.0
2. Node.js版本是否为18或更高
3. 网络连接是否正常（EAS构建需要）

---

## 版本信息

- 应用名称：ProjectAccountingApp
- 版本：1.0.0
- Expo SDK：54.0.0
- React Native：0.81.5
- 构建日期：2026-03-08

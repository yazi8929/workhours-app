# 快速构建指南 - Android APK

## 🚀 最推荐方式：GitHub Actions 自动构建 ⭐⭐⭐

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

查看 [GitHub Actions 构建指南](./GITHUB_ACTIONS_GUIDE.md) 了解：
- 如何配置自动构建
- 如何手动触发构建
- 如何查看构建报告
- 常见问题解答

---

## 📱 应用兼容性检查 ✅

您的项目记账应用**完全支持Android本地使用**，所有检查均已通过：

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 本地数据存储 | ✅ | 使用AsyncStorage，数据完全在本地 |
| 无网络依赖 | ✅ | 不依赖后端API，完全离线可用 |
| Android兼容 | ✅ | 所有依赖支持Android平台 |
| 权限配置 | ✅ | 已配置相册、相机、位置等权限 |
| 文件操作 | ✅ | 使用expo-file-system，完全兼容 |

---

## 🚀 其他构建方式（如果你需要）

### 方式一：使用构建脚本（最简单）⭐推荐

```bash
# 1. 进入项目目录
cd /workspace/projects

# 2. 运行构建脚本
./build-apk.sh

# 3. 按照提示操作
# - 输入1选择Preview模式（快速测试）
# - 输入2选择Production模式（正式发布）

# 4. 等待构建完成（10-20分钟）
# 5. 通过提供的链接下载APK
```

**首次使用需要：**
```bash
# 登录Expo账户（如果没有账号，先在 https://expo.dev 注册）
eas login
```

---

### 方式二：使用EAS命令行

```bash
# 1. 进入客户端目录
cd /workspace/projects/client

# 2. 登录Expo账户（首次使用）
eas login

# 3. 构建Preview版APK
eas build --platform android --profile preview

# 或构建Production版APK
eas build --platform android --profile production
```

---

### 方式三：本地构建（需要Android Studio）

**前置要求：**
- Android Studio
- Android SDK
- Java JDK 17+

**详细步骤：**
```bash
# 生成原生项目
npx expo prebuild

# 进入Android目录
cd android

# 生成签名密钥
keytool -genkeypair -v -storetype PKCS12 \
  -keystore my-release-key.p12 \
  -alias my-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# 构建Release APK
cd ..
./gradlew assembleRelease

# APK文件位置
android/app/build/outputs/apk/release/app-release.apk
```

---

## 📦 应用信息

| 项目 | 信息 |
|------|------|
| **应用名称** | ProjectAccountingApp |
| **包名** | com.anonymous.x7613422460242919487 |
| **版本号** | 1.0.0 |
| **Expo SDK** | 54.0.0 |
| **React Native** | 0.81.5 |
| **构建类型** | APK（可直接安装） |

---

## 📲 安装APK到手机

### 方法一：直接安装
1. 从EAS构建页面下载APK文件
2. 将APK传输到Android手机
3. 在手机上点击APK文件
4. 允许安装未知来源应用
5. 点击安装

### 方法二：ADB安装（开发者模式）
```bash
# 启用手机的开发者模式和USB调试
# 连接手机到电脑
adb install app-release.apk
```

---

## ✅ 功能验证清单

安装后请验证以下功能：

### 基础功能
- [ ] 应用正常启动
- [ ] 项目管理（创建、编辑、删除）
- [ ] 支出记录（添加、查看、统计）
- [ ] 数据导出/导入

### 本地存储
- [ ] 关闭应用后重新打开，数据存在
- [ ] 收款记录正常保存
- [ ] 开票记录正常保存
- [ ] 所有数据在本地，无需网络

### 权限功能
- [ ] 访问相册选择图片
- [ ] 导出文件到本地

---

## 🔐 数据备份建议

由于应用使用本地存储，建议定期备份：

```bash
# 在应用内：
# 1. 进入"数据"页面
# 2. 点击"导出数据"
# 3. 保存导出的JSON文件

# 恢复数据：
# 1. 进入"数据"页面
# 2. 点击"导入数据"
# 3. 选择之前导出的JSON文件
```

---

## ❓ 常见问题

### Q: 构建失败，提示未登录？
**A:** 运行 `eas login` 登录Expo账户

### Q: EAS CLI未安装？
**A:** 运行 `npm install -g eas-cli`

### Q: 构建时间太长？
**A:** Preview模式约10分钟，Production模式约20分钟，属于正常范围

### Q: APK安装失败？
**A:** 检查手机Android版本（建议7.0+），允许安装未知来源应用

### Q: 数据丢失？
**A:** 应用数据存储在本地，卸载应用会清除数据。请定期使用导出功能备份

---

## 📞 技术支持

如遇到问题，请检查：
- Node.js版本（需要18+）
- 网络连接（EAS构建需要）
- Expo账户状态
- 构建日志中的错误信息

---

## 🎯 下一步

1. **选择构建方式**：推荐使用 `./build-apk.sh` 脚本
2. **首次构建**：先登录Expo账户 `eas login`
3. **等待构建**：约10-20分钟
4. **下载安装**：通过提供的链接下载APK
5. **功能验证**：按照验证清单测试各项功能
6. **数据备份**：定期使用导出功能备份数据

---

## 📚 相关文档

- [详细构建指南](./BUILD_GUIDE.md)
- [Expo文档](https://docs.expo.dev)
- [EAS Build文档](https://docs.expo.dev/build/introduction)

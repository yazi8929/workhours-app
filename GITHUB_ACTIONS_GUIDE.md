# GitHub Actions 自动构建指南

## 📱 使用 GitHub Actions 构建 Android APK

本指南介绍如何使用 GitHub Actions 自动构建 Android APK。

---

## 🔧 前置配置

### 1. 配置 GitHub Secrets

在你的 GitHub 仓库中配置以下 Secrets：

#### 获取 EXPO_TOKEN

1. 访问 https://expo.dev/accounts
2. 登录你的 Expo 账户
3. 点击 "Settings" -> "Access Tokens"
4. 点击 "Create Access Token"
5. 输入名称（如：github-actions）
6. 选择权限：Build
7. 复制生成的 token

#### 添加到 GitHub

1. 进入 GitHub 仓库
2. 点击 "Settings" -> "Secrets and variables" -> "Actions"
3. 点击 "New repository secret"
4. Name: `EXPO_TOKEN`
5. Secret: 粘贴刚才复制的 Expo token
6. 点击 "Add secret"

---

## 🚀 触发构建

### 方式一：自动触发（推送到主分支）

```bash
# 提交代码并推送到 main 或 master 分支
git add .
git commit -m "更新代码"
git push origin main
```

GitHub Actions 会自动开始构建。

### 方式二：手动触发

1. 进入 GitHub 仓库
2. 点击 "Actions" 标签
3. 选择 "Build Android APK" workflow
4. 点击 "Run workflow"
5. 选择构建类型：
   - **preview**: 预览版（快速测试，约10分钟）
   - **production**: 生产版（正式发布，约20分钟）
6. 点击 "Run workflow"

---

## 📦 下载 APK

### 方式一：从 Actions 页面下载

1. 构建完成后，进入 Actions 页面
2. 点击对应的工作流运行
3. 向下滚动到 "Artifacts" 部分
4. 下载 `android-apk-preview` 或 `android-apk-production`
5. 同时可以下载 `build-report-preview` 或 `build-report-production` 查看详细报告

### 方式二：从 Releases 下载（仅 Production）

如果构建类型是 production，APK 会自动创建为 Release：

1. 进入 GitHub 仓库的 "Releases" 页面
2. 下载最新版本的 APK

---

## 📊 构建流程

GitHub Actions 会自动执行以下步骤：

```
1. 检出代码
   ↓
2. 设置 Node.js 18
   ↓
3. 安装项目依赖
   ↓
4. 安装 EAS CLI
   ↓
5. 配置 Git 信息
   ↓
6. 使用 EAS Build 构建 APK
   ↓
7. 等待构建完成
   ↓
8. 下载 APK 文件
   ↓
9. 上传 APK 到 Artifacts
   ↓
10. 生成构建报告
    ↓
11. 创建 Release（仅 production）
    ↓
12. 构建完成
```

---

## 📝 构建信息

每次构建会生成以下信息：

### 构建报告包含：
- 应用名称和版本
- 包名
- 构建类型（preview/production）
- 构建ID
- 构建时间
- 触发方式
- 下载链接
- 安装说明
- 功能验证清单

### 下载方式：
- GitHub Artifacts（自动保存30天）
- EAS 构建页面
- 直接下载链接
- GitHub Release（仅production）

---

## ⚙️ 工作流配置

### 工作流文件位置
`.github/workflows/build-apk.yml`

### 触发条件
- 推送到 `main` 或 `master` 分支
- 手动触发（workflow_dispatch）

### 构建模式
- **preview**: 快速测试，约10分钟
- **production**: 完整优化，约20分钟

### 产物保留
- APK 文件和构建报告保留 30 天

---

## 🔍 查看构建日志

1. 进入 GitHub 仓库
2. 点击 "Actions" 标签
3. 选择对应的工作流运行
4. 点击工作流名称查看详细日志

---

## ❌ 常见问题

### Q1: 构建失败，提示 EXPO_TOKEN 错误
**A**:
- 检查 GitHub Secrets 中是否正确配置了 EXPO_TOKEN
- 确认 token 未过期
- 重新生成 token 并更新

### Q2: 构建超时
**A**:
- preview 模式约 10-15 分钟
- production 模式约 20-30 分钟
- 如果超时，检查 EAS 构建页面了解详情

### Q3: 无法下载 APK
**A**:
- 检查 Actions 页面的 Artifacts 部分
- 确认构建状态为 "Success"
- 尝试刷新页面或稍后重试

### Q4: 如何修改构建配置
**A**:
编辑 `.github/workflows/build-apk.yml` 文件，然后提交到仓库。

---

## 🎯 最佳实践

1. **日常测试**: 使用 preview 模式快速验证
2. **正式发布**: 使用 production 模式进行完整构建
3. **版本管理**: 在 commit message 中注明版本变更
4. **自动备份**: 定期检查构建产物，下载重要版本
5. **查看日志**: 关注构建日志中的警告和错误

---

## 📌 提示

- **首次构建**: 可能需要较长时间（约30分钟）
- **构建数量**: EAS 免费账户每月有一定构建限制
- **更新频率**: 频繁推送会触发多次构建，注意控制频率
- **Token 安全**: 不要泄露 EXPO_TOKEN，定期更换

---

## 🔗 相关链接

- [GitHub Actions 文档](https://docs.github.com/actions)
- [EAS Build 文档](https://docs.expo.dev/build/introduction)
- [Expo 账户](https://expo.dev)
- [你的 GitHub 仓库](https://github.com/yazi8929/workhours-app)

---

## 📚 其他构建方式

如果 GitHub Actions 无法满足需求，你也可以：

1. **使用本地构建脚本**：`./build-apk.sh`
2. **使用 EAS CLI 本地构建**：`eas build --platform android`
3. **使用 Android Studio 本地构建**：参考 `BUILD_GUIDE.md`

---

## 💡 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/yazi8929/workhours-app.git
cd workhours-app

# 2. 配置 GitHub Secrets（在 GitHub 网页操作）
# Settings -> Secrets -> Actions -> New repository secret
# Name: EXPO_TOKEN
# Secret: 你的 Expo token

# 3. 推送代码触发构建
git add .
git commit -m "触发构建"
git push origin main

# 4. 或者在 GitHub 网页手动触发
# Actions -> Build Android APK -> Run workflow
```

---

## 📞 技术支持

如遇到问题，请：
1. 查看构建日志
2. 检查 EAS 构建页面
3. 查看 GitHub Actions 文档
4. 联系项目维护者

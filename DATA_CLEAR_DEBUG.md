# 数据清空功能调试指南

## 问题描述
点击"清空所有数据"按钮没有反应

## 已做的修复

### 1. 添加调试日志
在 `handleClearData` 函数中添加了 console.log，方便在控制台查看点击是否被触发：
```typescript
console.log('清空数据按钮被点击');
console.log('开始清空数据...');
console.log('数据清空成功');
```

### 2. 增加点击区域
- 添加 `hitSlop` 属性，增加按钮的点击热区
- 添加 `activeOpacity={0.7}`，提供点击视觉反馈
- 增加按钮的最小高度 `minHeight: 48`
- 增加水平内边距 `paddingHorizontal: Spacing.xl`

### 3. 改进异步操作
使用 `Promise.all` 确保所有清空操作并行执行且全部完成：
```typescript
await Promise.all([
  ProjectStorage.clear(),
  TransactionStorage.clear(),
  ExpenseCategoryStorage.clear()
]);
```

## 如何调试

### 方法 1: 查看控制台日志
1. 打开应用
2. 打开开发者工具（Expo DevTools 或 React Native Debugger）
3. 点击"清空所有数据"按钮
4. 查看控制台输出：
   - 如果看到 `清空数据按钮被点击`，说明按钮点击事件正常触发
   - 如果看到 `开始清空数据...`，说明用户确认了操作
   - 如果看到 `数据清空成功`，说明清空操作成功

### 方法 2: 检查 Alert 弹窗
点击按钮后，应该会弹出确认对话框：
- 标题："清空数据"
- 内容："此操作将永久删除所有项目、交易记录和支出分类，无法恢复。是否继续？"
- 按钮："取消" 和 "清空"

如果没有弹出 Alert，可能是：
- 按钮点击事件未触发（查看控制台日志）
- Alert 模块未正确导入（已确认导入正确）

### 方法 3: 手动测试清空功能
在浏览器控制台中运行以下代码，直接测试清空功能：

```javascript
// 在应用的控制台中运行
(async () => {
  const AsyncStorage = await import('@react-native-async-storage/async-storage');
  const PROJECTS_KEY = '@project_accounting_projects';
  const TRANSACTIONS_KEY = '@project_accounting_transactions';
  const EXPENSE_CATEGORIES_KEY = '@project_accounting_expense_categories';

  await AsyncStorage.default.removeItem(PROJECTS_KEY);
  await AsyncStorage.default.removeItem(TRANSACTIONS_KEY);
  await AsyncStorage.default.removeItem(EXPENSE_CATEGORIES_KEY);
  console.log('所有数据已清空');
})();
```

### 方法 4: 检查数据是否真的被清空
1. 导出当前数据（记录导出时间）
2. 执行清空操作
3. 再次导出数据
4. 对比两个导出文件：
   - 清空后的导出文件应该：
     - `projects: []`
     - `transactions: []`
     - `expenseCategories: []`

## 可能的原因和解决方案

### 原因 1: 按钮被其他元素遮挡
**症状**: 点击无反应，无控制台日志
**解决方案**: 已增加 `hitSlop` 扩大点击区域

### 原因 2: ScrollView 滚动冲突
**症状**: 点击后页面滚动而不是触发按钮
**解决方案**: 按钮已经在 ScrollView 的正确位置，应该不会有冲突

### 原因 3: AsyncStorage 操作失败
**症状**: 有控制台日志，但数据未被清空
**解决方案**: 检查控制台是否有错误信息

### 原因 4: Alert 在某些平台不工作
**症状**: 点击后有控制台日志，但没有 Alert 弹窗
**解决方案**: 这是平台特定问题，可能需要使用自定义 Modal

## 验证步骤

1. 打开应用
2. 进入"数据"页面
3. 滚动到页面底部
4. 点击"清空所有数据"按钮
5. 应该弹出确认对话框
6. 点击"清空"按钮
7. 应该弹出"清空成功"提示
8. 切换到"项目"页面，确认所有项目已被删除
9. 切换到"支出"页面，确认所有支出记录已被删除

## 如果仍然无法工作

请提供以下信息：
1. 控制台的完整日志输出
2. 点击按钮时是否有任何视觉反馈（如透明度变化）
3. 使用的平台（Web、iOS、Android）
4. 是否有错误提示

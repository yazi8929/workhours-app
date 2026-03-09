# 快速修复：使用普通 Button 替代 TouchableOpacity

如果点击TouchableOpacity没有反应，可以尝试以下修改：

## 临时测试方案

在 `/workspace/projects/client/screens/data/index.tsx` 中，将：

```typescript
<TouchableOpacity
  style={localStyles.dangerButton}
  onPress={handleClearData}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  activeOpacity={0.7}
>
  <FontAwesome6 name="trash" size={20} color={theme.error} />
  <ThemedText variant="body" color={theme.error} style={localStyles.dangerButtonText}>
    清空所有数据
  </ThemedText>
</TouchableOpacity>
```

替换为（添加测试按钮）：

```typescript
{/* 测试按钮 */}
<View style={{ marginBottom: Spacing.md }}>
  <TouchableOpacity
    style={{
      backgroundColor: '#007AFF',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    }}
    onPress={() => {
      console.log('测试按钮被点击');
      Alert.alert('测试', '按钮点击正常工作！');
    }}
  >
    <ThemedText variant="body" style={{ color: '#fff' }}>
      测试按钮点击
    </ThemedText>
  </TouchableOpacity>
</View>

{/* 原始清空按钮 */}
<TouchableOpacity
  style={localStyles.dangerButton}
  onPress={handleClearData}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  activeOpacity={0.7}
>
  <FontAwesome6 name="trash" size={20} color={theme.error} />
  <ThemedText variant="body" color={theme.error} style={localStyles.dangerButtonText}>
    清空所有数据
  </ThemedText>
</TouchableOpacity>
```

## 验证步骤

1. 先点击"测试按钮点击"，看看是否有反应
   - 如果有反应，说明 TouchableOpacity 组件本身工作正常
   - 如果没有反应，说明可能是整个页面的问题

2. 如果测试按钮有反应，但清空按钮没有反应，可能是：
   - `handleClearData` 函数有问题
   - 样式导致按钮被遮挡

3. 查看控制台输出，确认是否能看到 `测试按钮被点击` 和 `清空数据按钮被点击`

import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Modal, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Alert, FlatList } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Transaction, Project, ExpenseCategory } from '@/types';
import { TransactionStorage, ProjectStorage, ExpenseCategoryStorage } from '@/utils/storage';
import { generateUUID, formatDate } from '@/utils/helpers';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['5xl'],
    flexGrow: 1,
  },
  formCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
  },
  formTitle: {
    marginBottom: Spacing.md,
  },
  formField: {
    marginBottom: Spacing.xl,
  },
  fieldLabel: {
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: Spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  dateText: {
    fontSize: 16,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  selectButtonText: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  optionItemLast: {
    borderBottomWidth: 0,
  },
  dateOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
});

export default function AddExpenseScreen() {
  const { theme, isDark } = useTheme();
  const router = useSafeRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(formatDate(new Date().toISOString()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const loadData = useCallback(async () => {
    const [projData, catData] = await Promise.all([
      ProjectStorage.getAll(),
      ExpenseCategoryStorage.getAll(),
    ]);
    setProjects(projData);
    setCategories(catData);

    // 默认选择第一个项目
    if (projData.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projData[0].id);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    async function init() {
      await loadData();
    }
    init();
  }, [loadData]);

  const handleSave = async () => {
    if (!selectedProjectId) {
      Alert.alert('错误', '请先创建项目');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('提示', '请输入有效的金额');
      return;
    }

    if (!description.trim()) {
      Alert.alert('提示', '请输入描述');
      return;
    }

    const newTransaction: Transaction = {
      id: generateUUID(),
      projectId: selectedProjectId,
      type: 'material',
      amount: amountValue,
      description: description.trim(),
      date,
      categoryId: selectedCategoryId || undefined,
      createdAt: new Date().toISOString(),
    };

    const success = await TransactionStorage.save(newTransaction);
    if (success) {
      router.back();
    } else {
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  if (projects.length === 0) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <ThemedView level="root" style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.backgroundTertiary }]} onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.headerTitle}>
              添加支出
            </ThemedText>
            <View style={{ width: 32 }} />
          </View>

          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: Spacing.xl,
          }}>
            <FontAwesome6 name="folder-open" size={64} color={theme.textMuted} style={{ opacity: 0.5, marginBottom: Spacing.lg }} />
            <ThemedText variant="h4" color={theme.textSecondary} style={{ marginBottom: Spacing.sm, textAlign: 'center' }}>
              暂无项目
            </ThemedText>
            <ThemedText variant="body" color={theme.textMuted} style={{ textAlign: 'center', marginBottom: Spacing.xl }}>
              请先创建项目后再添加支出
            </ThemedText>
            <TouchableOpacity
              style={{
                paddingHorizontal: Spacing.xl,
                paddingVertical: Spacing.md,
                borderRadius: BorderRadius.md,
                backgroundColor: theme.primary,
              }}
              onPress={() => router.push('/projects/add')}
            >
              <ThemedText variant="body" color={theme.buttonPrimaryText}>
                创建项目
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ThemedView level="root" style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.backgroundTertiary }]} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h3" color={theme.textPrimary} style={styles.headerTitle}>
            添加支出
          </ThemedText>
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSave}>
            <ThemedText variant="body" color={theme.buttonPrimaryText}>保存</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView level="default" style={styles.formCard}>
            <ThemedText variant="h4" color={theme.textSecondary} style={styles.formTitle}>
              选择项目<ThemedText style={{ color: theme.error }}>*</ThemedText>
            </ThemedText>
            <View style={styles.formField}>
              <TouchableOpacity
                style={[styles.selectButton, { backgroundColor: theme.backgroundTertiary }]}
                onPress={() => setShowProjectSelector(true)}
              >
                <FontAwesome6 name="folder" size={18} color={theme.textSecondary} />
                <ThemedText variant="body" color={selectedProjectId ? theme.textPrimary : theme.textMuted} style={styles.selectButtonText}>
                  {selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name || '请选择项目' : '请选择项目'}
                </ThemedText>
                <FontAwesome6 name="chevron-right" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {categories.length > 0 && (
              <View style={styles.formField}>
                <ThemedText variant="body" color={theme.textPrimary} style={styles.fieldLabel}>
                  支出分类
                </ThemedText>
                <TouchableOpacity
                  style={[styles.selectButton, { backgroundColor: theme.backgroundTertiary }]}
                  onPress={() => setShowCategorySelector(true)}
                >
                  <FontAwesome6 name="tag" size={18} color={theme.textSecondary} />
                  <ThemedText variant="body" color={selectedCategoryId ? theme.textPrimary : theme.textMuted} style={styles.selectButtonText}>
                    {selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name || '不分类' : '不分类'}
                  </ThemedText>
                  <FontAwesome6 name="chevron-right" size={16} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.formField}>
              <ThemedText variant="body" color={theme.textPrimary} style={styles.fieldLabel}>
                金额（元）<ThemedText style={{ color: theme.error }}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                placeholder="请输入金额"
                placeholderTextColor={theme.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formField}>
              <ThemedText variant="body" color={theme.textPrimary} style={styles.fieldLabel}>
                描述<ThemedText style={{ color: theme.error }}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                placeholder="请输入支出描述"
                placeholderTextColor={theme.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formField}>
              <ThemedText variant="body" color={theme.textPrimary} style={styles.fieldLabel}>
                日期<ThemedText style={{ color: theme.error }}>*</ThemedText>
              </ThemedText>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: theme.backgroundTertiary }]}
                onPress={() => setShowDatePicker(true)}
              >
                <FontAwesome6 name="calendar" size={18} color={theme.textSecondary} />
                <ThemedText variant="body" color={theme.textPrimary} style={styles.dateText}>
                  {date}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ScrollView>

        {/* 日期选择 Modal */}
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} disabled={Platform.OS === 'web'}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View style={styles.modalContainer}>
                <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
                  <View style={styles.modalHeader}>
                    <ThemedText variant="h4" color={theme.textPrimary}>选择日期</ThemedText>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <FontAwesome6 name="xmark" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView>
                    {Array.from({ length: 30 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - i);
                      const dateStr = formatDate(d.toISOString());
                      return (
                        <TouchableOpacity
                          key={dateStr}
                          style={[styles.dateOption, date === dateStr && { backgroundColor: theme.primary }]}
                          onPress={() => {
                            setDate(dateStr);
                            setShowDatePicker(false);
                          }}
                        >
                          <ThemedText
                            variant="body"
                            color={date === dateStr ? theme.buttonPrimaryText : theme.textPrimary}
                          >
                            {dateStr}
                          </ThemedText>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Modal>

        {/* 项目选择 Modal */}
        <Modal
          visible={showProjectSelector}
          transparent
          animationType="slide"
          onRequestClose={() => setShowProjectSelector(false)}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={() => setShowProjectSelector(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.modalHeader}>
                <ThemedText variant="h4" color={theme.textPrimary}>选择项目</ThemedText>
                <TouchableOpacity onPress={() => setShowProjectSelector(false)}>
                  <FontAwesome6 name="xmark" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={projects}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[styles.optionItem, index === projects.length - 1 && styles.optionItemLast, selectedProjectId === item.id && { backgroundColor: theme.primary + '20' }]}
                    onPress={() => {
                      setSelectedProjectId(item.id);
                      setShowProjectSelector(false);
                    }}
                  >
                    <FontAwesome6 name="folder" size={18} color={selectedProjectId === item.id ? theme.primary : theme.textSecondary} />
                    <ThemedText variant="body" color={theme.textPrimary} style={{ marginLeft: Spacing.md, flex: 1 }}>
                      {item.name}
                    </ThemedText>
                    {selectedProjectId === item.id && (
                      <FontAwesome6 name="check" size={18} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* 分类选择 Modal */}
        <Modal
          visible={showCategorySelector}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCategorySelector(false)}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={() => setShowCategorySelector(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.modalHeader}>
                <ThemedText variant="h4" color={theme.textPrimary}>选择分类</ThemedText>
                <TouchableOpacity onPress={() => setShowCategorySelector(false)}>
                  <FontAwesome6 name="xmark" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={[{ id: null, name: '不分类', color: theme.textSecondary }, ...categories]}
                keyExtractor={(item) => item.id || 'none'}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[styles.optionItem, index === categories.length && styles.optionItemLast, selectedCategoryId === item.id && { backgroundColor: item.id === null ? theme.primary + '20' : item.color + '20' }]}
                    onPress={() => {
                      setSelectedCategoryId(item.id);
                      setShowCategorySelector(false);
                    }}
                  >
                    {item.id === null ? (
                      <FontAwesome6 name="tag" size={18} color={selectedCategoryId === null ? theme.primary : theme.textSecondary} />
                    ) : (
                      <View style={{ width: 10, height: 10, borderRadius: 5, marginRight: 0, backgroundColor: item.color }} />
                    )}
                    <ThemedText variant="body" color={theme.textPrimary} style={{ marginLeft: Spacing.md, flex: 1 }}>
                      {item.name}
                    </ThemedText>
                    {selectedCategoryId === item.id && (
                      <FontAwesome6 name="check" size={18} color={item.id === null ? theme.primary : item.color} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </ThemedView>
    </Screen>
  );
}

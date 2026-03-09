import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, Alert, Modal } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Transaction, Project, ExpenseCategory } from '@/types';
import { TransactionStorage, ProjectStorage, ExpenseCategoryStorage } from '@/utils/storage';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { TransactionTypeNames } from '@/types';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  filterButtonText: {
    flex: 1,
    fontSize: 12,
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
});

export default function ExpensesScreen() {
  const { theme, isDark } = useTheme();
  const router = useSafeRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showProjectFilter, setShowProjectFilter] = useState(false);

  const loadData = useCallback(async () => {
    const [txData, projData, catData] = await Promise.all([
      TransactionStorage.getAll(),
      ProjectStorage.getAll(),
      ExpenseCategoryStorage.getAll(),
    ]);
    setTransactions(txData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setProjects(projData);
    setCategories(catData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedCategory && tx.categoryId !== selectedCategory) return false;
      if (selectedProject && tx.projectId !== selectedProject) return false;
      return true;
    });
  }, [transactions, selectedCategory, selectedProject]);

  const totalExpense = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredTransactions]);

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const project = projects.find(p => p.id === item.projectId);
    const category = categories.find(c => c.id === item.categoryId);

    return (
      <ThemedView level="default" style={{
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
        boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm }}>
          <View style={{ flex: 1 }}>
            <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: 4 }}>
              {TransactionTypeNames[item.type]}
            </ThemedText>
            {category && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: category.color,
                  marginRight: 6,
                }} />
                <ThemedText variant="caption" color={theme.textSecondary}>
                  {category.name}
                </ThemedText>
              </View>
            )}
            {project && (
              <ThemedText variant="caption" color={theme.textMuted}>
                {project.name}
              </ThemedText>
            )}
          </View>
          <ThemedText variant="h4" color={theme.primary} style={{ fontWeight: '600' }}>
            {formatCurrency(item.amount)}
          </ThemedText>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ThemedText variant="caption" color={theme.textMuted}>
            {formatDate(item.date)}
          </ThemedText>
        </View>

        {item.description ? (
          <ThemedText variant="body" color={theme.textSecondary} style={{ marginTop: Spacing.sm }}>
            {item.description}
          </ThemedText>
        ) : null}
      </ThemedView>
    );
  };

  const renderFilterButton = () => {
    if (selectedCategory || selectedProject) {
      return (
        <TouchableOpacity
          style={{
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            borderRadius: BorderRadius.md,
            backgroundColor: theme.backgroundTertiary,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onPress={() => {
            setSelectedCategory(null);
            setSelectedProject(null);
          }}
        >
          <ThemedText variant="caption" color={theme.textSecondary}>
            清除筛选
          </ThemedText>
          <FontAwesome6 name="xmark" size={12} color={theme.textSecondary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ThemedView level="root" style={{ flex: 1 }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.xl,
          paddingBottom: Spacing.lg,
        }}>
          <ThemedText variant="h3" color={theme.textPrimary}>
            支出记录
          </ThemedText>
          <TouchableOpacity
            style={{
              width: 32,
              height: 32,
              borderRadius: BorderRadius.sm,
              backgroundColor: theme.backgroundTertiary,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => router.push('/expenses/categories')}
          >
            <FontAwesome6 name="tags" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={{
          paddingHorizontal: Spacing.lg,
          marginBottom: Spacing.lg,
        }}>
          <ThemedView level="default" style={{
            borderRadius: BorderRadius.lg,
            padding: Spacing.lg,
            boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
          }}>
            <ThemedText variant="caption" color={theme.textSecondary} style={{ marginBottom: 4 }}>
              总支出
            </ThemedText>
            <ThemedText variant="h1" color={theme.primary}>
              {formatCurrency(totalExpense)}
            </ThemedText>
          </ThemedView>
        </View>

        <View style={styles.filterRow}>
          <ThemedText variant="h4" color={theme.textSecondary}>
            筛选
          </ThemedText>
          {renderFilterButton()}
        </View>

        <View style={styles.filterContainer}>
          {categories.length > 0 && (
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.backgroundTertiary }]}
              onPress={() => setShowCategoryFilter(true)}
            >
              <FontAwesome6 name="tag" size={14} color={selectedCategory ? theme.primary : theme.textSecondary} />
              <ThemedText
                variant="caption"
                color={selectedCategory ? theme.textPrimary : theme.textMuted}
                style={styles.filterButtonText}
              >
                {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name || '全部分类' : '全部分类'}
              </ThemedText>
              <FontAwesome6 name="chevron-down" size={12} color={theme.textMuted} />
            </TouchableOpacity>
          )}

          {projects.length > 0 && (
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.backgroundTertiary }]}
              onPress={() => setShowProjectFilter(true)}
            >
              <FontAwesome6 name="folder" size={14} color={selectedProject ? theme.primary : theme.textSecondary} />
              <ThemedText
                variant="caption"
                color={selectedProject ? theme.textPrimary : theme.textMuted}
                style={styles.filterButtonText}
              >
                {selectedProject ? projects.find(p => p.id === selectedProject)?.name || '全部项目' : '全部项目'}
              </ThemedText>
              <FontAwesome6 name="chevron-down" size={12} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            paddingBottom: Spacing['5xl'],
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingTop: Spacing['6xl'],
            }}>
              <FontAwesome6 name="receipt" size={64} color={theme.textMuted} style={{ opacity: 0.5, marginBottom: Spacing.lg }} />
              <ThemedText variant="h4" color={theme.textSecondary} style={{ marginBottom: Spacing.sm }}>
                暂无支出记录
              </ThemedText>
              <ThemedText variant="body" color={theme.textMuted}>
                在项目中添加交易记录后，会显示在这里
              </ThemedText>
            </View>
          }
        />
        <TouchableOpacity
          style={{
            position: 'absolute',
            right: Spacing.lg,
            bottom: Spacing.xl,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.primary,
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0px 4px 12px rgba(79, 70, 229, 0.3)',
          }}
          onPress={() => router.push('/expenses/add')}
        >
          <FontAwesome6 name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* 分类筛选 Modal */}
        <Modal
          visible={showCategoryFilter}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCategoryFilter(false)}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={() => setShowCategoryFilter(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.modalHeader}>
                <ThemedText variant="h4" color={theme.textPrimary}>选择分类</ThemedText>
                <TouchableOpacity onPress={() => setShowCategoryFilter(false)}>
                  <FontAwesome6 name="xmark" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={[{ id: null, name: '全部分类', color: theme.textSecondary }, ...categories]}
                keyExtractor={(item) => item.id || 'all'}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[styles.optionItem, index === categories.length && styles.optionItemLast, selectedCategory === item.id && { backgroundColor: item.id === null ? theme.primary + '20' : item.color + '20' }]}
                    onPress={() => {
                      setSelectedCategory(item.id);
                      setShowCategoryFilter(false);
                    }}
                  >
                    {item.id === null ? (
                      <FontAwesome6 name="tag" size={18} color={selectedCategory === null ? theme.primary : theme.textSecondary} />
                    ) : (
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color }} />
                    )}
                    <ThemedText variant="body" color={theme.textPrimary} style={{ marginLeft: Spacing.md, flex: 1 }}>
                      {item.name}
                    </ThemedText>
                    {selectedCategory === item.id && (
                      <FontAwesome6 name="check" size={18} color={item.id === null ? theme.primary : item.color} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* 项目筛选 Modal */}
        <Modal
          visible={showProjectFilter}
          transparent
          animationType="slide"
          onRequestClose={() => setShowProjectFilter(false)}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={() => setShowProjectFilter(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.modalHeader}>
                <ThemedText variant="h4" color={theme.textPrimary}>选择项目</ThemedText>
                <TouchableOpacity onPress={() => setShowProjectFilter(false)}>
                  <FontAwesome6 name="xmark" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={[{ id: null, name: '全部项目' }, ...projects]}
                keyExtractor={(item) => item.id || 'all'}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[styles.optionItem, index === projects.length && styles.optionItemLast, selectedProject === item.id && { backgroundColor: theme.primary + '20' }]}
                    onPress={() => {
                      setSelectedProject(item.id);
                      setShowProjectFilter(false);
                    }}
                  >
                    <FontAwesome6 name="folder" size={18} color={selectedProject === item.id ? theme.primary : theme.textSecondary} />
                    <ThemedText variant="body" color={theme.textPrimary} style={{ marginLeft: Spacing.md, flex: 1 }}>
                      {item.name}
                    </ThemedText>
                    {selectedProject === item.id && (
                      <FontAwesome6 name="check" size={18} color={theme.primary} />
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

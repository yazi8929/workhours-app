import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, FlatList, Keyboard } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Project, Transaction, DeliveryRecord, PaymentRecord } from '@/types';
import { ProjectStorage, TransactionStorage, DeliveryRecordStorage, PaymentRecordStorage } from '@/utils/storage';
import { formatCurrency, formatDate, calculateProjectStats } from '@/utils/helpers';
import { ProjectTypeNames, TransactionTypeNames } from '@/types';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles';

type SearchFilter = 'all' | 'projects' | 'transactions' | 'deliveries' | 'payments';

const FilterLabels: Record<SearchFilter, string> = {
  all: '全部',
  projects: '项目',
  transactions: '支出',
  deliveries: '送货',
  payments: '收款',
};

interface SearchResult {
  id: string;
  type: 'project' | 'transaction' | 'delivery' | 'payment';
  title: string;
  subtitle: string;
  amount?: number;
  date?: string;
  projectId?: string;
  icon: string;
  iconColor: string;
}

export default function SearchScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deliveryRecords, setDeliveryRecords] = useState<DeliveryRecord[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      const [projectData, transactionData, deliveryData, paymentData] = await Promise.all([
        ProjectStorage.getAll(),
        TransactionStorage.getAll(),
        DeliveryRecordStorage.getAll(),
        PaymentRecordStorage.getAll(),
      ]);
      setProjects(projectData);
      setTransactions(transactionData);
      setDeliveryRecords(deliveryData);
      setPaymentRecords(paymentData);
    };
    loadData();
  }, []);

  // 搜索结果
  const searchResults = useMemo((): SearchResult[] => {
    if (!searchText.trim()) return [];

    const query = searchText.toLowerCase().trim();
    const results: SearchResult[] = [];

    // 搜索项目
    if (filter === 'all' || filter === 'projects') {
      projects.forEach(project => {
        if (
          project.name.toLowerCase().includes(query) ||
          (project.description && project.description.toLowerCase().includes(query))
        ) {
          results.push({
            id: project.id,
            type: 'project',
            title: project.name,
            subtitle: ProjectTypeNames[project.projectType],
            icon: 'folder-open',
            iconColor: theme.primary,
          });
        }
      });
    }

    // 搜索支出记录
    if (filter === 'all' || filter === 'transactions') {
      transactions.forEach(transaction => {
        const project = projects.find(p => p.id === transaction.projectId);
        if (
          transaction.description.toLowerCase().includes(query) ||
          (project && project.name.toLowerCase().includes(query)) ||
          String(transaction.amount).includes(query)
        ) {
          results.push({
            id: transaction.id,
            type: 'transaction',
            title: transaction.description || TransactionTypeNames[transaction.type],
            subtitle: project?.name || '未知项目',
            amount: -transaction.amount,
            date: transaction.date,
            projectId: transaction.projectId,
            icon: 'receipt',
            iconColor: theme.error,
          });
        }
      });
    }

    // 搜索送货记录
    if (filter === 'all' || filter === 'deliveries') {
      deliveryRecords.forEach(delivery => {
        if (
          delivery.description.toLowerCase().includes(query) ||
          delivery.projectName.toLowerCase().includes(query) ||
          String(delivery.amount).includes(query)
        ) {
          results.push({
            id: delivery.id,
            type: 'delivery',
            title: delivery.description || '送货',
            subtitle: delivery.projectName,
            amount: delivery.amount,
            date: delivery.date,
            projectId: delivery.projectId,
            icon: 'truck',
            iconColor: theme.primary,
          });
        }
      });
    }

    // 搜索收款记录
    if (filter === 'all' || filter === 'payments') {
      paymentRecords.forEach(payment => {
        if (
          (payment.description && payment.description.toLowerCase().includes(query)) ||
          payment.projectName.toLowerCase().includes(query) ||
          String(payment.amount).includes(query)
        ) {
          results.push({
            id: payment.id,
            type: 'payment',
            title: payment.description || '收款',
            subtitle: payment.projectName,
            amount: payment.amount,
            date: payment.date,
            projectId: payment.projectId,
            icon: 'hand-holding-dollar',
            iconColor: theme.success,
          });
        }
      });
    }

    return results;
  }, [searchText, filter, projects, transactions, deliveryRecords, paymentRecords, theme]);

  // 获取项目名称
  const getProjectName = (projectId?: string) => {
    if (!projectId) return '';
    return projects.find(p => p.id === projectId)?.name || '';
  };

  // 点击结果
  const handleResultPress = (result: SearchResult) => {
    Keyboard.dismiss();
    if (result.type === 'project') {
      router.push('/projects/detail', { id: result.id });
    } else if (result.projectId) {
      router.push('/projects/detail', { id: result.projectId });
    }
  };

  // 热门搜索建议
  const suggestions = useMemo(() => {
    // 从支出记录中提取常用描述
    const descCounts = new Map<string, number>();
    transactions.forEach(t => {
      if (t.description) {
        const count = descCounts.get(t.description) || 0;
        descCounts.set(t.description, count + 1);
      }
    });

    return Array.from(descCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([desc]) => desc);
  }, [transactions]);

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ThemedView level="root" style={styles.container}>
        {/* 搜索头部 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.backgroundTertiary }]}
            onPress={() => router.back()}
          >
            <FontAwesome6 name="arrow-left" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.searchInputContainer}>
            <FontAwesome6 name="magnifying-glass" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="搜索项目、支出、送货..."
              placeholderTextColor={theme.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <FontAwesome6 name="xmark" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 筛选标签 */}
        <View style={styles.filterSection}>
          <View style={styles.filterTabs}>
            {(Object.keys(FilterLabels) as SearchFilter[]).map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterTab,
                  filter === key ? styles.filterTabActive : styles.filterTabInactive,
                ]}
                onPress={() => setFilter(key)}
              >
                <ThemedText
                  style={styles.filterTabText}
                  color={filter === key ? theme.buttonPrimaryText : theme.textMuted}
                >
                  {FilterLabels[key]}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 搜索结果或建议 */}
        {searchText.trim() ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={{ flexGrow: 1 }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <FontAwesome6 name="magnifying-glass" size={48} color={theme.textMuted} style={styles.emptyIcon} />
                <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
                  未找到相关结果
                </ThemedText>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.resultItem}
                onPress={() => handleResultPress(item)}
              >
                <View style={[styles.resultIcon, { backgroundColor: `${item.iconColor}15` }]}>
                  <FontAwesome6 name={item.icon as any} size={18} color={item.iconColor} />
                </View>
                <View style={styles.resultContent}>
                  <ThemedText variant="body" color={theme.textPrimary} style={styles.resultTitle}>
                    {item.title}
                  </ThemedText>
                  <ThemedText variant="small" color={theme.textMuted} style={styles.resultSubtitle}>
                    {item.subtitle}
                  </ThemedText>
                </View>
                {item.amount !== undefined && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <ThemedText 
                      variant="body" 
                      color={item.amount >= 0 ? theme.success : theme.error}
                      style={styles.resultAmount}
                    >
                      {item.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(item.amount))}
                    </ThemedText>
                    {item.date && (
                      <ThemedText variant="small" color={theme.textMuted} style={styles.resultDate}>
                        {formatDate(item.date)}
                      </ThemedText>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.suggestionsContainer}>
            <ThemedText variant="h4" color={theme.textPrimary} style={styles.suggestionsTitle}>
              常用搜索
            </ThemedText>
            {suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => setSearchText(suggestion)}
                >
                  <FontAwesome6 name="clock-rotate-left" size={16} color={theme.textMuted} />
                  <ThemedText variant="body" style={styles.suggestionText}>
                    {suggestion}
                  </ThemedText>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <FontAwesome6 name="magnifying-glass" size={48} color={theme.textMuted} style={styles.emptyIcon} />
                <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
                  输入关键词开始搜索
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </ThemedView>
    </Screen>
  );
}

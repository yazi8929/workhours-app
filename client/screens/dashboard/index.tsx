import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Project, Transaction, DeliveryRecord, PaymentRecord, ProjectStatus } from '@/types';
import { ProjectStorage, TransactionStorage, DeliveryRecordStorage, PaymentRecordStorage } from '@/utils/storage';
import { formatCurrency, formatDate, calculateProjectStats } from '@/utils/helpers';
import { ProjectStatusNames, TransactionTypeNames } from '@/types';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles';

type RecentTab = 'transactions' | 'deliveries' | 'payments';

export default function DashboardScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deliveryRecords, setDeliveryRecords] = useState<DeliveryRecord[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [projectStats, setProjectStats] = useState<Map<string, { totalIncome: number; totalExpense: number; netProfit: number }>>(new Map());
  const [refreshing, setRefreshing] = useState(false);
  const [recentTab, setRecentTab] = useState<RecentTab>('transactions');

  const loadData = useCallback(async () => {
    const projectData = await ProjectStorage.getAll();
    const transactionData = await TransactionStorage.getAll();
    const deliveryRecordsData = await DeliveryRecordStorage.getAll();
    const paymentRecordsData = await PaymentRecordStorage.getAll();

    const statsMap = new Map<string, { totalIncome: number; totalExpense: number; netProfit: number }>();
    for (const project of projectData) {
      const stats = await calculateProjectStats(project);
      statsMap.set(project.id, {
        totalIncome: stats.totalIncome,
        totalExpense: stats.totalExpense,
        netProfit: stats.netProfit,
      });
    }

    setProjects(projectData);
    setTransactions(transactionData);
    setDeliveryRecords(deliveryRecordsData);
    setPaymentRecords(paymentRecordsData);
    setProjectStats(statsMap);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // 财务统计计算
  const financeStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 本月支出
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });
    const monthExpense = monthTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // 本月收入（收款记录）
    const monthPayments = paymentRecords.filter(p => {
      const date = new Date(p.date);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });
    const monthIncome = monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // 本年支出
    const yearTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === currentYear;
    });
    const yearExpense = yearTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // 本年收入
    const yearPayments = paymentRecords.filter(p => {
      const date = new Date(p.date);
      return date.getFullYear() === currentYear;
    });
    const yearIncome = yearPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // 应收账款总额（送货项目的累计金额 - 已收款金额）
    const deliveryProjects = projects.filter(p => p.projectType === 'delivery');
    let totalReceivable = 0;
    for (const project of deliveryProjects) {
      const records = deliveryRecords.filter(r => r.projectId === project.id);
      const totalAmount = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const receivedAmount = records.reduce((sum, r) => sum + (Number(r.receivedAmount) || 0), 0);
      totalReceivable += (totalAmount - receivedAmount);
    }

    return {
      monthIncome,
      monthExpense,
      monthNet: monthIncome - monthExpense,
      yearIncome,
      yearExpense,
      yearNet: yearIncome - yearExpense,
      totalReceivable,
    };
  }, [transactions, projects, deliveryRecords, paymentRecords]);

  // 项目状态统计
  const projectStats2 = useMemo(() => {
    const active = projects.filter(p => p.status === 'active').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const paused = projects.filter(p => p.status === 'paused').length;
    const total = projects.length;

    return { active, completed, paused, total };
  }, [projects]);

  // 最近支出记录
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // 最近收款记录
  const recentPayments = useMemo(() => {
    return [...paymentRecords]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [paymentRecords]);

  // 最近送货记录
  const recentDeliveries = useMemo(() => {
    return [...deliveryRecords]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [deliveryRecords]);

  // 提醒事项
  const reminders = useMemo(() => {
    const list: { type: 'warning' | 'error' | 'info'; text: string }[] = [];
    
    // 应收账款提醒
    if (financeStats.totalReceivable > 0) {
      list.push({
        type: 'warning',
        text: `应收账款 ${formatCurrency(financeStats.totalReceivable)} 待收取`,
      });
    }

    // 进行中项目提醒
    if (projectStats2.active > 5) {
      list.push({
        type: 'info',
        text: `当前有 ${projectStats2.active} 个项目进行中`,
      });
    }

    // 最近有大额支出
    const recentBigExpense = transactions.find(t => {
      const date = new Date(t.date);
      const now = new Date();
      const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7 && Number(t.amount) >= 10000;
    });
    if (recentBigExpense) {
      list.push({
        type: 'info',
        text: `近7日有大额支出 ${formatCurrency(Number(recentBigExpense.amount))}`,
      });
    }

    return list;
  }, [financeStats, projectStats2, transactions]);

  // 获取项目名称
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || '未知项目';
  };

  // 获取支出类型图标
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'material': return 'cube';
      case 'equipment': return 'truck';
      case 'labor': return 'users';
      default: return 'money-bill';
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
        }
      >
        {/* 欢迎区域 + 搜索入口 */}
        <View style={styles.welcomeSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
            <View>
              <ThemedText variant="h2" color={theme.textPrimary} style={styles.welcomeTitle}>
                联智记帐
              </ThemedText>
              <ThemedText variant="body" color={theme.textSecondary} style={styles.welcomeSubtitle}>
                {formatDate(new Date().toISOString())} · 今天也要加油哦
              </ThemedText>
            </View>
            <TouchableOpacity 
              style={{
                width: 44,
                height: 44,
                borderRadius: BorderRadius.lg,
                backgroundColor: theme.backgroundTertiary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => router.push('/search')}
            >
              <FontAwesome6 name="magnifying-glass" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 提醒卡片 */}
        {reminders.length > 0 && (
          <View style={styles.reminderSection}>
            <View style={[styles.reminderCard, { borderLeftColor: theme.warning }]}>
              <View style={styles.reminderHeader}>
                <FontAwesome6 name="bell" size={16} color={theme.warning} />
                <ThemedText variant="h4" color={theme.textPrimary} style={styles.reminderTitle}>
                  待办提醒
                </ThemedText>
              </View>
              <View style={styles.reminderList}>
                {reminders.map((item, index) => (
                  <View key={index} style={styles.reminderItem}>
                    <View style={[styles.reminderDot, { 
                      backgroundColor: item.type === 'error' ? theme.error : 
                                      item.type === 'warning' ? theme.warning : theme.info 
                    }]} />
                    <ThemedText variant="body" color={theme.textSecondary} style={styles.reminderText}>
                      {item.text}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* 财务概况 */}
        <View style={styles.financeSection}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.sectionTitle}>
              财务概况
            </ThemedText>
            <TouchableOpacity onPress={() => router.navigate('/stats')}>
              <ThemedText variant="small" color={theme.primary} style={styles.seeMoreText}>
                查看详情 →
              </ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.financeGrid}>
            {/* 本月收入 */}
            <View style={styles.financeCard}>
              <View style={[styles.financeCardIcon, { backgroundColor: `${theme.success}15` }]}>
                <FontAwesome6 name="arrow-trend-up" size={20} color={theme.success} />
              </View>
              <ThemedText variant="small" color={theme.textMuted} style={styles.financeCardLabel}>
                本月收入
              </ThemedText>
              <ThemedText variant="h3" color={theme.success} style={styles.financeCardAmount}>
                {formatCurrency(financeStats.monthIncome)}
              </ThemedText>
            </View>

            {/* 本月支出 */}
            <View style={styles.financeCard}>
              <View style={[styles.financeCardIcon, { backgroundColor: `${theme.error}15` }]}>
                <FontAwesome6 name="arrow-trend-down" size={20} color={theme.error} />
              </View>
              <ThemedText variant="small" color={theme.textMuted} style={styles.financeCardLabel}>
                本月支出
              </ThemedText>
              <ThemedText variant="h3" color={theme.error} style={styles.financeCardAmount}>
                {formatCurrency(financeStats.monthExpense)}
              </ThemedText>
            </View>

            {/* 本年净利 */}
            <View style={styles.financeCard}>
              <View style={[styles.financeCardIcon, { backgroundColor: `${theme.primary}15` }]}>
                <FontAwesome6 name="chart-line" size={20} color={theme.primary} />
              </View>
              <ThemedText variant="small" color={theme.textMuted} style={styles.financeCardLabel}>
                本年净利
              </ThemedText>
              <ThemedText 
                variant="h3" 
                color={financeStats.yearNet >= 0 ? theme.success : theme.error} 
                style={styles.financeCardAmount}
              >
                {formatCurrency(financeStats.yearNet)}
              </ThemedText>
            </View>

            {/* 应收账款 */}
            <View style={styles.financeCard}>
              <View style={[styles.financeCardIcon, { backgroundColor: `${theme.warning}15` }]}>
                <FontAwesome6 name="hand-holding-dollar" size={20} color={theme.warning} />
              </View>
              <ThemedText variant="small" color={theme.textMuted} style={styles.financeCardLabel}>
                应收账款
              </ThemedText>
              <ThemedText variant="h3" color={theme.warning} style={styles.financeCardAmount}>
                {formatCurrency(financeStats.totalReceivable)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* 项目状态概览 */}
        <View style={styles.projectSection}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.sectionTitle}>
              项目状态
            </ThemedText>
            <TouchableOpacity onPress={() => router.navigate('/projects')}>
              <ThemedText variant="small" color={theme.primary} style={styles.seeMoreText}>
                查看全部 →
              </ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.projectStatusGrid}>
            {/* 进行中 */}
            <View style={styles.projectStatusCard}>
              <View style={[styles.projectStatusIcon, { backgroundColor: `${theme.success}15` }]}>
                <FontAwesome6 name="spinner" size={22} color={theme.success} />
              </View>
              <ThemedText variant="h2" color={theme.success} style={styles.projectStatusNumber}>
                {projectStats2.active}
              </ThemedText>
              <ThemedText variant="small" color={theme.textMuted} style={styles.projectStatusLabel}>
                进行中
              </ThemedText>
            </View>

            {/* 已暂停 */}
            <View style={styles.projectStatusCard}>
              <View style={[styles.projectStatusIcon, { backgroundColor: `${theme.warning}15` }]}>
                <FontAwesome6 name="pause" size={22} color={theme.warning} />
              </View>
              <ThemedText variant="h2" color={theme.warning} style={styles.projectStatusNumber}>
                {projectStats2.paused}
              </ThemedText>
              <ThemedText variant="small" color={theme.textMuted} style={styles.projectStatusLabel}>
                已暂停
              </ThemedText>
            </View>

            {/* 已完成 */}
            <View style={styles.projectStatusCard}>
              <View style={[styles.projectStatusIcon, { backgroundColor: `${theme.textMuted}15` }]}>
                <FontAwesome6 name="check" size={22} color={theme.textMuted} />
              </View>
              <ThemedText variant="h2" color={theme.textSecondary} style={styles.projectStatusNumber}>
                {projectStats2.completed}
              </ThemedText>
              <ThemedText variant="small" color={theme.textMuted} style={styles.projectStatusLabel}>
                已完成
              </ThemedText>
            </View>
          </View>
        </View>

        {/* 近期动态 */}
        <View style={styles.recentSection}>
          <ThemedText variant="h3" color={theme.textPrimary} style={[styles.sectionTitle, { marginBottom: Spacing.md }]}>
            近期动态
          </ThemedText>
          
          {/* Tab 切换 */}
          <View style={styles.recentTabs}>
            <TouchableOpacity 
              style={[styles.recentTab, recentTab === 'transactions' ? styles.recentTabActive : styles.recentTabInactive]}
              onPress={() => setRecentTab('transactions')}
            >
              <ThemedText 
                variant="small" 
                color={recentTab === 'transactions' ? theme.buttonPrimaryText : theme.textMuted}
                style={styles.recentTabText}
              >
                支出记录
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.recentTab, recentTab === 'payments' ? styles.recentTabActive : styles.recentTabInactive]}
              onPress={() => setRecentTab('payments')}
            >
              <ThemedText 
                variant="small" 
                color={recentTab === 'payments' ? theme.buttonPrimaryText : theme.textMuted}
                style={styles.recentTabText}
              >
                收款记录
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.recentTab, recentTab === 'deliveries' ? styles.recentTabActive : styles.recentTabInactive]}
              onPress={() => setRecentTab('deliveries')}
            >
              <ThemedText 
                variant="small" 
                color={recentTab === 'deliveries' ? theme.buttonPrimaryText : theme.textMuted}
                style={styles.recentTabText}
              >
                送货记录
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* 记录列表 */}
          <View style={styles.recentList}>
            {recentTab === 'transactions' ? (
              recentTransactions.length > 0 ? (
                recentTransactions.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.recentItem}
                    onPress={() => router.push('/projects/detail', { id: item.projectId })}
                  >
                    <View style={[styles.recentItemIcon, { backgroundColor: `${theme.error}15` }]}>
                      <FontAwesome6 
                        name={getTransactionIcon(item.type)} 
                        size={16} 
                        color={theme.error} 
                      />
                    </View>
                    <View style={styles.recentItemContent}>
                      <ThemedText variant="body" color={theme.textPrimary} style={styles.recentItemTitle}>
                        {item.description || TransactionTypeNames[item.type]}
                      </ThemedText>
                      <ThemedText variant="small" color={theme.textMuted} style={styles.recentItemSubtitle}>
                        {getProjectName(item.projectId)}
                      </ThemedText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <ThemedText 
                        variant="body" 
                        color={theme.error}
                        style={styles.recentItemAmount}
                      >
                        -{formatCurrency(Number(item.amount))}
                      </ThemedText>
                      <ThemedText variant="small" color={theme.textMuted} style={styles.recentItemDate}>
                        {formatDate(item.date)}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <FontAwesome6 name="inbox" size={40} color={theme.textMuted} style={styles.emptyIcon} />
                  <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
                    暂无支出记录
                  </ThemedText>
                </View>
              )
            ) : recentTab === 'payments' ? (
              recentPayments.length > 0 ? (
                recentPayments.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.recentItem}
                    onPress={() => router.push('/projects/detail', { id: item.projectId })}
                  >
                    <View style={[styles.recentItemIcon, { backgroundColor: `${theme.success}15` }]}>
                      <FontAwesome6 name="arrow-down" size={16} color={theme.success} />
                    </View>
                    <View style={styles.recentItemContent}>
                      <ThemedText variant="body" color={theme.textPrimary} style={styles.recentItemTitle}>
                        {item.description || '收款'}
                      </ThemedText>
                      <ThemedText variant="small" color={theme.textMuted} style={styles.recentItemSubtitle}>
                        {item.projectName}
                      </ThemedText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <ThemedText variant="body" color={theme.success} style={styles.recentItemAmount}>
                        +{formatCurrency(Number(item.amount))}
                      </ThemedText>
                      <ThemedText variant="small" color={theme.textMuted} style={styles.recentItemDate}>
                        {formatDate(item.date)}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <FontAwesome6 name="hand-holding-dollar" size={40} color={theme.textMuted} style={styles.emptyIcon} />
                  <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
                    暂无收款记录
                  </ThemedText>
                </View>
              )
            ) : (
              recentDeliveries.length > 0 ? (
                recentDeliveries.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.recentItem}
                    onPress={() => router.push('/projects/detail', { id: item.projectId })}
                  >
                    <View style={[styles.recentItemIcon, { backgroundColor: `${theme.primary}15` }]}>
                      <FontAwesome6 name="truck" size={16} color={theme.primary} />
                    </View>
                    <View style={styles.recentItemContent}>
                      <ThemedText variant="body" color={theme.textPrimary} style={styles.recentItemTitle}>
                        {item.description || '送货'}
                      </ThemedText>
                      <ThemedText variant="small" color={theme.textMuted} style={styles.recentItemSubtitle}>
                        {item.projectName}
                      </ThemedText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <ThemedText variant="body" color={theme.primary} style={styles.recentItemAmount}>
                        {formatCurrency(Number(item.amount))}
                      </ThemedText>
                      <ThemedText variant="small" color={theme.textMuted} style={styles.recentItemDate}>
                        {formatDate(item.date)}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <FontAwesome6 name="truck" size={40} color={theme.textMuted} style={styles.emptyIcon} />
                  <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
                    暂无送货记录
                  </ThemedText>
                </View>
              )
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

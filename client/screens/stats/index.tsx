import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PieChart, LineChart } from 'react-native-gifted-charts';
import { Project, Transaction, DeliveryRecord, PaymentRecord, ExpenseCategory } from '@/types';
import { ProjectStorage, TransactionStorage, DeliveryRecordStorage, PaymentRecordStorage, ExpenseCategoryStorage } from '@/utils/storage';
import { formatCurrency, formatDate, calculateProjectStats } from '@/utils/helpers';
import { TransactionTypeNames } from '@/types';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles';

type TimeFilter = 'week' | 'month' | 'quarter' | 'year';

const TimeFilterLabels: Record<TimeFilter, string> = {
  week: '本周',
  month: '本月',
  quarter: '本季度',
  year: '本年',
};

export default function StatsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deliveryRecords, setDeliveryRecords] = useState<DeliveryRecord[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

  const loadData = useCallback(async () => {
    const projectData = await ProjectStorage.getAll();
    const transactionData = await TransactionStorage.getAll();
    const deliveryRecordsData = await DeliveryRecordStorage.getAll();
    const paymentRecordsData = await PaymentRecordStorage.getAll();
    const categoriesData = await ExpenseCategoryStorage.getAll();

    setProjects(projectData);
    setTransactions(transactionData);
    setDeliveryRecords(deliveryRecordsData);
    setPaymentRecords(paymentRecordsData);
    setExpenseCategories(categoriesData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // 时间范围计算
  const timeRange = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDay();

    switch (timeFilter) {
      case 'week': {
        const start = new Date(now);
        start.setDate(now.getDate() - currentDay);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      case 'month': {
        const start = new Date(currentYear, currentMonth, 1);
        const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
        return { start, end };
      }
      case 'quarter': {
        const quarterMonth = Math.floor(currentMonth / 3) * 3;
        const start = new Date(currentYear, quarterMonth, 1);
        const end = new Date(currentYear, quarterMonth + 3, 0, 23, 59, 59, 999);
        return { start, end };
      }
      case 'year': {
        const start = new Date(currentYear, 0, 1);
        const end = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        return { start, end };
      }
    }
  }, [timeFilter]);

  // 过滤时间范围内的数据
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      return date >= timeRange.start && date <= timeRange.end;
    });
  }, [transactions, timeRange]);

  const filteredPayments = useMemo(() => {
    return paymentRecords.filter(p => {
      const date = new Date(p.date);
      return date >= timeRange.start && date <= timeRange.end;
    });
  }, [paymentRecords, timeRange]);

  // 支出分类统计
  const categoryStats = useMemo(() => {
    const stats = new Map<string, number>();
    
    filteredTransactions.forEach(t => {
      const categoryId = t.categoryId || t.type; // 使用分类ID或类型
      const current = stats.get(categoryId) || 0;
      stats.set(categoryId, current + Number(t.amount));
    });

    return Array.from(stats.entries()).map(([id, amount]) => {
      const category = expenseCategories.find(c => c.id === id);
      return {
        id,
        name: category?.name || TransactionTypeNames[id as keyof typeof TransactionTypeNames] || id,
        amount,
        color: category?.color || theme.primary,
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, expenseCategories, theme]);

  // 饼图数据
  const pieData = useMemo(() => {
    const total = categoryStats.reduce((sum, c) => sum + c.amount, 0);
    if (total === 0) return [];
    
    return categoryStats.map((c, index) => ({
      value: c.amount,
      color: c.color || theme.primary,
      text: `${Math.round((c.amount / total) * 100)}%`,
    }));
  }, [categoryStats, theme]);

  // 应收账款追踪
  const receivableProjects = useMemo(() => {
    return projects
      .filter(p => p.projectType === 'delivery')
      .map(project => {
        const records = deliveryRecords.filter(r => r.projectId === project.id);
        const totalAmount = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        const receivedAmount = records.reduce((sum, r) => sum + (Number(r.receivedAmount) || 0), 0);
        const invoicedAmount = records.reduce((sum, r) => sum + (Number(r.invoiceAmount) || 0), 0);
        
        return {
          id: project.id,
          name: project.name,
          totalAmount,
          receivedAmount,
          invoicedAmount,
          pending: totalAmount - receivedAmount,
          progress: totalAmount > 0 ? receivedAmount / totalAmount : 0,
        };
      })
      .filter(p => p.totalAmount > 0)
      .sort((a, b) => b.pending - a.pending);
  }, [projects, deliveryRecords]);

  // 应收账款汇总
  const receivableSummary = useMemo(() => {
    const totalAmount = receivableProjects.reduce((sum, p) => sum + p.totalAmount, 0);
    const receivedAmount = receivableProjects.reduce((sum, p) => sum + p.receivedAmount, 0);
    const invoicedAmount = receivableProjects.reduce((sum, p) => sum + p.invoicedAmount, 0);
    
    return {
      totalAmount,
      receivedAmount,
      invoicedAmount,
      pending: totalAmount - receivedAmount,
    };
  }, [receivableProjects]);

  // 趋势图数据
  const trendData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      // 该月支出
      const monthExpense = transactions
        .filter(t => {
          const tDate = new Date(t.date);
          return tDate.getFullYear() === year && tDate.getMonth() === month;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      // 该月收入
      const monthIncome = paymentRecords
        .filter(p => {
          const pDate = new Date(p.date);
          return pDate.getFullYear() === year && pDate.getMonth() === month;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      months.push({
        month: `${month + 1}月`,
        expense: monthExpense,
        income: monthIncome,
      });
    }
    
    return months;
  }, [transactions, paymentRecords]);

  // 趋势图数据格式化
  const expenseLineData = useMemo(() => {
    return trendData.map(d => ({
      value: d.expense / 1000, // 转为千元
      dataPointText: d.expense > 0 ? `${(d.expense / 1000).toFixed(0)}k` : '',
    }));
  }, [trendData]);

  const incomeLineData = useMemo(() => {
    return trendData.map(d => ({
      value: d.income / 1000,
      dataPointText: d.income > 0 ? `${(d.income / 1000).toFixed(0)}k` : '',
    }));
  }, [trendData]);

  // 期间统计
  const periodStats = useMemo(() => {
    const totalExpense = filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalIncome = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    return {
      totalExpense,
      totalIncome,
      netProfit: totalIncome - totalExpense,
      transactionCount: filteredTransactions.length,
      paymentCount: filteredPayments.length,
    };
  }, [filteredTransactions, filteredPayments]);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - Spacing.lg * 4;

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 时间筛选器 */}
        <View style={styles.filterSection}>
          <View style={styles.filterTabs}>
            {(Object.keys(TimeFilterLabels) as TimeFilter[]).map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterTab,
                  timeFilter === key ? styles.filterTabActive : styles.filterTabInactive,
                ]}
                onPress={() => setTimeFilter(key)}
              >
                <ThemedText
                  variant="small"
                  color={timeFilter === key ? theme.buttonPrimaryText : theme.textMuted}
                  style={styles.filterTabText}
                >
                  {TimeFilterLabels[key]}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 期间统计卡片 */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText variant="h4" color={theme.success} style={styles.statValue}>
                {formatCurrency(periodStats.totalIncome)}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.statLabel}>
                收入
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText variant="h4" color={theme.error} style={styles.statValue}>
                {formatCurrency(periodStats.totalExpense)}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.statLabel}>
                支出
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText 
                variant="h4" 
                color={periodStats.netProfit >= 0 ? theme.success : theme.error} 
                style={styles.statValue}
              >
                {formatCurrency(periodStats.netProfit)}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.statLabel}>
                净利
              </ThemedText>
            </View>
          </View>
        </View>

        {/* 支出分类统计 */}
        <View style={styles.sectionHeader}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            支出分类统计
          </ThemedText>
        </View>
        <View style={styles.chartContainer}>
          {pieData.length > 0 ? (
            <>
              <PieChart
                data={pieData}
                radius={80}
                innerRadius={40}
                showText
                textColor={theme.textPrimary}
                textSize={12}
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <ThemedText variant="small" color={theme.textMuted}>
                      总支出
                    </ThemedText>
                    <ThemedText variant="h4" color={theme.textPrimary}>
                      {formatCurrency(periodStats.totalExpense)}
                    </ThemedText>
                  </View>
                )}
              />
              <View style={styles.legendContainer}>
                {categoryStats.map((cat) => (
                  <View key={cat.id} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                    <ThemedText variant="small" color={theme.textSecondary} style={styles.legendText}>
                      {cat.name} {formatCurrency(cat.amount)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome6 name="chart-pie" size={40} color={theme.textMuted} style={styles.emptyIcon} />
              <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
                暂无支出数据
              </ThemedText>
            </View>
          )}
        </View>

        {/* 收支趋势图 */}
        <View style={styles.sectionHeader}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            收支趋势（近6个月）
          </ThemedText>
        </View>
        <View style={styles.trendContainer}>
          <View style={styles.trendLegend}>
            <View style={styles.trendLegendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
              <ThemedText variant="small" color={theme.textSecondary}>收入</ThemedText>
            </View>
            <View style={styles.trendLegendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.error }]} />
              <ThemedText variant="small" color={theme.textSecondary}>支出</ThemedText>
            </View>
          </View>
          <LineChart
            data={expenseLineData}
            data2={incomeLineData}
            height={180}
            width={chartWidth}
            spacing={chartWidth / 6}
            color={theme.error}
            color2={theme.success}
            dataPointsHeight={6}
            dataPointsWidth={6}
            dataPointsColor={theme.error}
            dataPointsColor2={theme.success}
            textShiftY={-8}
            textShiftX={-5}
            textColor={theme.textMuted}
            yAxisTextStyle={{ color: theme.textMuted, fontSize: 10 }}
            noOfSections={4}
            curved
          />
        </View>

        {/* 项目利润排行榜 */}
        <View style={styles.sectionHeader}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            项目利润排行
          </ThemedText>
        </View>
        <View style={styles.rankingContainer}>
          {projects.length > 0 ? (
            projects
              .map(async (project) => {
                const stats = await calculateProjectStats(project);
                return { project, stats };
              })
              .slice(0, 10)
              .map((item, index) => {
                // 由于 map 返回的是 Promise，我们需要特殊处理
                return null;
              })
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome6 name="ranking-star" size={40} color={theme.textMuted} style={styles.emptyIcon} />
              <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
                暂无项目数据
              </ThemedText>
            </View>
          )}
          {/* 同步渲染排行榜 */}
          <ProjectRankingList projects={projects} theme={theme} />
        </View>

        {/* 应收账款追踪 */}
        <View style={styles.sectionHeader}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            应收账款追踪
          </ThemedText>
        </View>
        <View style={styles.receivableContainer}>
          {/* 汇总 */}
          <View style={styles.receivableSummary}>
            <View style={styles.summaryItem}>
              <ThemedText variant="h4" color={theme.primary} style={styles.summaryValue}>
                {formatCurrency(receivableSummary.totalAmount)}
              </ThemedText>
              <ThemedText variant="small" color={theme.textMuted} style={styles.summaryLabel}>
                总金额
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText variant="h4" color={theme.success} style={styles.summaryValue}>
                {formatCurrency(receivableSummary.receivedAmount)}
              </ThemedText>
              <ThemedText variant="small" color={theme.textMuted} style={styles.summaryLabel}>
                已收款
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText variant="h4" color={theme.warning} style={styles.summaryValue}>
                {formatCurrency(receivableSummary.pending)}
              </ThemedText>
              <ThemedText variant="small" color={theme.textMuted} style={styles.summaryLabel}>
                待收款
              </ThemedText>
            </View>
          </View>

          {/* 项目列表 */}
          {receivableProjects.length > 0 ? (
            receivableProjects.map((project, index) => (
              <View 
                key={project.id} 
                style={[
                  styles.receivableProjectItem,
                  index === receivableProjects.length - 1 ? styles.receivableProjectItemLast : null,
                ]}
              >
                <View style={styles.projectHeader}>
                  <ThemedText variant="body" color={theme.textPrimary} style={styles.projectName}>
                    {project.name}
                  </ThemedText>
                  <ThemedText variant="body" color={theme.primary} style={styles.projectTotal}>
                    {formatCurrency(project.totalAmount)}
                  </ThemedText>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${project.progress * 100}%`,
                        backgroundColor: project.progress >= 0.8 ? theme.success : 
                                       project.progress >= 0.5 ? theme.warning : theme.error,
                      }
                    ]} 
                  />
                </View>
                <View style={styles.progressLabels}>
                  <ThemedText variant="small" color={theme.success} style={styles.progressLabel}>
                    已收 {formatCurrency(project.receivedAmount)}
                  </ThemedText>
                  <ThemedText variant="small" color={theme.warning} style={styles.progressLabel}>
                    待收 {formatCurrency(project.pending)}
                  </ThemedText>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome6 name="hand-holding-dollar" size={40} color={theme.textMuted} style={styles.emptyIcon} />
              <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
                暂无应收账款
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

// 项目排行榜组件
function ProjectRankingList({ projects, theme }: { projects: Project[]; theme: any }) {
  const [rankings, setRankings] = useState<Array<{
    id: string;
    name: string;
    type: string;
    netProfit: number;
    totalExpense: number;
    totalIncome: number;
  }>>([]);

  useEffect(() => {
    const loadRankings = async () => {
      const results = await Promise.all(
        projects.map(async (project) => {
          const stats = await calculateProjectStats(project);
          return {
            id: project.id,
            name: project.name,
            type: project.projectType,
            netProfit: stats.netProfit,
            totalExpense: stats.totalExpense,
            totalIncome: stats.totalIncome,
          };
        })
      );
      setRankings(results.sort((a, b) => b.netProfit - a.netProfit).slice(0, 10));
    };
    loadRankings();
  }, [projects]);

  if (rankings.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
        <FontAwesome6 name="ranking-star" size={40} color={theme.textMuted} />
        <ThemedText variant="body" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
          暂无项目数据
        </ThemedText>
      </View>
    );
  }

  return (
    <>
      {rankings.map((project, index) => {
        const profitRate = project.totalIncome > 0 
          ? ((project.netProfit / project.totalIncome) * 100).toFixed(1) 
          : '0.0';
        
        return (
          <View 
            key={project.id} 
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: Spacing.md,
              borderBottomWidth: index === rankings.length - 1 ? 0 : 1,
              borderBottomColor: theme.borderLight,
            }}
          >
            <View 
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: index < 3 ? theme.primary : theme.backgroundTertiary,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: Spacing.md,
              }}
            >
              <ThemedText 
                variant="small" 
                color={index < 3 ? theme.buttonPrimaryText : theme.textMuted}
                style={{ fontWeight: '700' }}
              >
                {index + 1}
              </ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText variant="body" color={theme.textPrimary} style={{ fontWeight: '600' }}>
                {project.name}
              </ThemedText>
              <ThemedText variant="small" color={theme.textMuted}>
                支出 {formatCurrency(project.totalExpense)}
              </ThemedText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <ThemedText 
                variant="body" 
                color={project.netProfit >= 0 ? theme.success : theme.error}
                style={{ fontWeight: '700' }}
              >
                {formatCurrency(project.netProfit)}
              </ThemedText>
              <ThemedText 
                variant="small" 
                color={project.netProfit >= 0 ? theme.success : theme.error}
              >
                利润率 {profitRate}%
              </ThemedText>
            </View>
          </View>
        );
      })}
    </>
  );
}

import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Project, Transaction, DeliveryRecord, InvoiceStatusNames } from '@/types';
import { ProjectStorage, TransactionStorage, DeliveryRecordStorage } from '@/utils/storage';
import { formatCurrency, formatDate, calculateProjectStats } from '@/utils/helpers';
import { TransactionTypeNames } from '@/types';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

// 送货记录卡片组件 - 使用 memo 避免不必要的重渲染
const DeliveryRecordCard = memo(({ record, index, totalCount, theme, onDelete, styles }: {
  record: DeliveryRecord;
  index: number;
  totalCount: number;
  theme: any;
  onDelete: (record: DeliveryRecord) => void;
  styles: any;
}) => {
  return (
    <TouchableOpacity
      onLongPress={() => onDelete(record)}
      activeOpacity={0.8}
    >
      <ThemedView level="default" style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={[styles.typeBadge, { backgroundColor: theme.accent + '20', marginRight: 8 }]}>
              <Text style={{ fontSize: 12, color: theme.accent }}>
                第 {totalCount - index} 次
              </Text>
            </View>
            <Text style={{ flex: 1, fontSize: 14, color: theme.textPrimary }}>
              {record.description}
            </Text>
          </View>
          {record.amount > 0 && (
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.primary }}>
              {formatCurrency(record.amount)}
            </Text>
          )}
        </View>
        <View style={styles.transactionFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 12, color: theme.textMuted }}>
              {formatDate(record.date)}
            </Text>
            <Text style={{ fontSize: 12, color: theme.textMuted }}>
              {record.images.length} 张图片
            </Text>
            {record.invoiceStatus !== 'none' && (
              <View style={[styles.typeBadge, { 
                backgroundColor: record.invoiceStatus === 'completed' 
                  ? theme.success + '20' 
                  : theme.accent + '20' 
              }]}>
                <Text style={{ fontSize: 12, color: record.invoiceStatus === 'completed' ? theme.success : theme.accent }}>
                  {record.invoiceStatus === 'completed' ? '已开票' : '部分开票'}
                </Text>
              </View>
            )}
            {record.receivedAmount > 0 && (
              <View style={[styles.typeBadge, { backgroundColor: theme.success + '20' }]}>
                <Text style={{ fontSize: 12, color: theme.success }}>
                  已收款 {formatCurrency(record.receivedAmount)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
});

// 交易记录卡片组件
const TransactionCard = memo(({ transaction, theme, styles }: {
  transaction: Transaction;
  theme: any;
  styles: any;
}) => {
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'material': return theme.primary;
      case 'equipment': return theme.success;
      case 'labor': return theme.accent;
      default: return theme.textSecondary;
    }
  };

  return (
    <ThemedView level="default" style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionTypeContainer}>
          <View style={[styles.transactionTypeBadge, { backgroundColor: getTransactionTypeColor(transaction.type) + '20' }]}>
            <Text style={{ fontSize: 12, color: getTransactionTypeColor(transaction.type) }}>
              {TransactionTypeNames[transaction.type]}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.error }}>
          -{formatCurrency(transaction.amount)}
        </Text>
      </View>
      <Text style={{ fontSize: 14, color: theme.textPrimary, marginBottom: 8 }}>
        {transaction.description}
      </Text>
      <View style={styles.transactionFooter}>
        <Text style={{ fontSize: 12, color: theme.textMuted }}>
          {formatDate(transaction.date)}
        </Text>
      </View>
    </ThemedView>
  );
});

export default function ProjectDetailScreen() {
  const { theme, isDark } = useTheme();
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deliveryRecords, setDeliveryRecords] = useState<DeliveryRecord[]>([]);
  const [stats, setStats] = useState({ totalExpense: 0, netProfit: 0 });
  const [loading, setLoading] = useState(true);

  // 缓存送货记录的计算结果
  const deliveryStats = useMemo(() => {
    const totalAmount = deliveryRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalReceived = deliveryRecords.reduce((sum, r) => sum + (r.receivedAmount || 0), 0);
    const totalInvoiced = deliveryRecords.reduce((sum, r) => sum + (r.invoiceAmount || 0), 0);
    const totalImages = deliveryRecords.reduce((sum, r) => sum + r.images.length, 0);
    return { totalAmount, totalReceived, totalInvoiced, totalImages };
  }, [deliveryRecords]);

  // 计算基础金额
  const baseAmount = useMemo(() => {
    return project?.projectType === 'delivery' 
      ? deliveryStats.totalAmount 
      : (project?.contractAmount ?? 0);
  }, [project, deliveryStats.totalAmount]);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    
    try {
      const projectData = await ProjectStorage.getById(id);
      if (!projectData) {
        Alert.alert('错误', '项目不存在');
        router.back();
        return;
      }

      const [transactionsData, deliveryRecordsData, projectStats] = await Promise.all([
        TransactionStorage.getByProjectId(id),
        DeliveryRecordStorage.getByProjectId(id),
        calculateProjectStats(projectData),
      ]);

      setProject(projectData);
      setTransactions(transactionsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setDeliveryRecords(deliveryRecordsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setStats(projectStats);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // 删除送货记录
  const handleDeleteDeliveryRecord = useCallback((record: DeliveryRecord) => {
    Alert.alert(
      '删除送货记录',
      `确定要删除这条送货记录吗？\n\n${record.description}\n\n此操作不可撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const success = await DeliveryRecordStorage.delete(record.id);
            if (success) {
              loadData();
            } else {
              Alert.alert('错误', '删除失败，请重试');
            }
          },
        },
      ]
    );
  }, [loadData]);

  const handleAddDelivery = useCallback(() => {
    router.push('/delivery-add', { projectId: id });
  }, [router, id]);

  const handleAddTransaction = useCallback(() => {
    router.push('/transactions/add', { projectId: id });
  }, [router, id]);

  // 样式对象 - 使用 useMemo 缓存
  const styles = useMemo(() => ({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center' as const,
      marginLeft: -40,
    },
    listContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing['5xl'],
    },
    infoCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    projectTitleRow: { marginBottom: Spacing.sm },
    detailProjectName: { marginLeft: Spacing.sm },
    projectDescription: { marginTop: Spacing.sm, marginBottom: Spacing.sm },
    projectMeta: { flexDirection: 'row' as const, alignItems: 'center' as const, marginTop: Spacing.md, gap: Spacing.md },
    statusBadge: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusBadgeText: {},
    metaItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
    metaText: {},
    typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statsCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    statsTitle: { marginBottom: Spacing.md },
    statsRow: { flexDirection: 'row' as const, marginBottom: Spacing.md },
    statItem: { flex: 1 },
    statValue: { marginTop: 4 },
    detailRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginVertical: Spacing.md,
    },
    transactionCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    transactionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: Spacing.xs,
    },
    transactionTypeContainer: {},
    transactionTypeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    transactionTypeText: {},
    transactionDescription: { marginBottom: Spacing.xs },
    transactionFooter: { flexDirection: 'row' as const, alignItems: 'center' as const },
    emptyCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing['2xl'],
      alignItems: 'center' as const,
      marginBottom: Spacing.md,
    },
    emptyIcon: { marginBottom: Spacing.md },
    emptyText: { marginBottom: Spacing.xs },
    emptyHint: {},
    expenseTypeRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    expenseTypeHeader: { flexDirection: 'row' as const, alignItems: 'center' as const },
    expenseTypeValues: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: Spacing.sm },
    typeDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
    addButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: theme.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
  }), [theme]);

  // 列表数据
  const listData = useMemo(() => {
    const items: Array<{ type: string; data?: any; key: string }> = [];
    
    if (!project) return items;

    // 项目基本信息
    items.push({ type: 'projectInfo', key: 'projectInfo' });
    
    // 时间信息
    items.push({ type: 'timeInfo', key: 'timeInfo' });
    
    // 财务概况
    items.push({ type: 'financeInfo', key: 'financeInfo' });
    
    // 开票信息
    items.push({ type: 'invoiceInfo', key: 'invoiceInfo' });

    // 支出分类统计
    if (stats.totalExpense > 0) {
      items.push({ type: 'expenseStats', key: 'expenseStats' });
    }

    // 送货记录（仅送货项目）
    if (project.projectType === 'delivery') {
      items.push({ type: 'deliveryStats', key: 'deliveryStats' });
      items.push({ type: 'deliveryHeader', key: 'deliveryHeader' });
      
      if (deliveryRecords.length === 0) {
        items.push({ type: 'emptyDelivery', key: 'emptyDelivery' });
      } else {
        deliveryRecords.forEach((record, index) => {
          items.push({ type: 'deliveryRecord', data: { record, index }, key: record.id });
        });
      }
    }

    // 交易记录
    items.push({ type: 'transactionHeader', key: 'transactionHeader' });
    
    if (transactions.length === 0) {
      items.push({ type: 'emptyTransaction', key: 'emptyTransaction' });
    } else {
      transactions.forEach((transaction) => {
        items.push({ type: 'transaction', data: transaction, key: transaction.id });
      });
    }

    return items;
  }, [project, stats.totalExpense, deliveryRecords, transactions]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return theme.success;
      case 'completed': return theme.primary;
      case 'paused': return theme.textMuted;
      default: return theme.textMuted;
    }
  }, [theme]);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'active': return '进行中';
      case 'completed': return '已完成';
      case 'paused': return '已暂停';
      default: return status;
    }
  }, []);

  const isOverdue = useCallback((date: string) => {
    return new Date(date) < new Date();
  }, []);

  const calculateProjectDuration = useCallback((startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} 天`;
  }, []);

  const calculateRunDuration = useCallback((startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} 天`;
  }, []);

  const getTransactionTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'material': return theme.primary;
      case 'equipment': return theme.success;
      case 'labor': return theme.accent;
      default: return theme.textSecondary;
    }
  }, [theme]);

  // 渲染列表项
  const renderItem = useCallback(({ item }: { item: { type: string; data?: any; key: string } }) => {
    if (!project) return null;

    switch (item.type) {
      case 'projectInfo':
        return (
          <ThemedView level="default" style={styles.infoCard}>
            <View style={styles.projectTitleRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.typeBadge, { backgroundColor: project.projectType === 'delivery' ? theme.accent : theme.primary }]}>
                  <Text style={{ fontSize: 10, fontWeight: '500', color: '#fff' }}>
                    {project.projectType === 'delivery' ? '采购' : '工程'}
                  </Text>
                </View>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.textPrimary, marginLeft: Spacing.sm }}>
                  {project.name}
                </Text>
              </View>
            </View>
            {project.description && (
              <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: Spacing.sm, marginBottom: Spacing.sm }}>
                {project.description}
              </Text>
            )}
            <View style={styles.projectMeta}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(project.status) }]} />
                <Text style={{ fontSize: 12, color: getStatusColor(project.status) }}>
                  {getStatusText(project.status)}
                </Text>
              </View>
              {project.manager && (
                <View style={styles.metaItem}>
                  <FontAwesome6 name="user" size={12} color={theme.textMuted} />
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                    {project.manager}
                  </Text>
                </View>
              )}
            </View>
          </ThemedView>
        );

      case 'timeInfo':
        return (
          <ThemedView level="default" style={styles.statsCard}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textSecondary, marginBottom: Spacing.md }}>
              时间规划
            </Text>
            <View style={styles.detailRow}>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>开始日期</Text>
              <Text style={{ fontSize: 14, color: theme.textPrimary }}>
                {project.startDate ? formatDate(project.startDate) : '未设置'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>预计完成</Text>
              <Text style={{ fontSize: 14, color: project.endDate && isOverdue(project.endDate) ? theme.error : theme.textPrimary }}>
                {project.endDate ? formatDate(project.endDate) : '未设置'}
                {project.endDate && isOverdue(project.endDate) && ' (已过期)'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>创建时间</Text>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                {formatDate(project.createdAt)}
              </Text>
            </View>
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>更新时间</Text>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                {formatDate(project.updatedAt)}
              </Text>
            </View>
          </ThemedView>
        );

      case 'financeInfo':
        const receivedAmount = project.projectType === 'delivery'
          ? deliveryStats.totalReceived
          : project.receivedAmount;
        return (
          <ThemedView level="default" style={styles.statsCard}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textSecondary, marginBottom: Spacing.md }}>
              财务概况
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>
                  {project.projectType === 'delivery' ? '送货总额' : '合同金额'}
                </Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.primary, marginTop: 4 }}>
                  {formatCurrency(baseAmount)}
                </Text>
              </View>
              {project.projectType === 'contract' && (
                <View style={styles.statItem}>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>结算金额</Text>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.textSecondary, marginTop: 4 }}>
                    {formatCurrency(project.settlementAmount ?? 0)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>已收款</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.success, marginTop: 4 }}>
                  {formatCurrency(receivedAmount)}
                </Text>
                {baseAmount > 0 && (
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>
                    收款率 {((receivedAmount / baseAmount) * 100).toFixed(1)}%
                  </Text>
                )}
              </View>
              <View style={styles.statItem}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>已支出</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.error, marginTop: 4 }}>
                  {formatCurrency(stats.totalExpense)}
                </Text>
              </View>
            </View>
            <View style={[styles.statsRow, { marginBottom: 0 }]}>
              <View style={styles.statItem}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>净收益</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: stats.netProfit >= 0 ? theme.success : theme.error, marginTop: 4 }}>
                  {formatCurrency(stats.netProfit)}
                </Text>
              </View>
            </View>
          </ThemedView>
        );

      case 'invoiceInfo':
        const invoicedAmount = project.projectType === 'delivery'
          ? deliveryStats.totalInvoiced
          : (project.invoiceAmount ?? 0);
        return (
          <ThemedView level="default" style={styles.statsCard}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textSecondary, marginBottom: Spacing.md }}>
              开票信息
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>已开票金额</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.error, marginTop: 4 }}>
                  {formatCurrency(invoicedAmount)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>开票状态</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.primary, marginTop: 4 }}>
                  {InvoiceStatusNames[project.invoiceStatus ?? 'none']}
                </Text>
              </View>
            </View>
          </ThemedView>
        );

      case 'expenseStats':
        return (
          <ThemedView level="default" style={styles.statsCard}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textSecondary, marginBottom: Spacing.md }}>
              支出分类统计
            </Text>
            {(Object.keys(TransactionTypeNames) as Array<keyof typeof TransactionTypeNames>).map((type) => {
              const typeTransactions = transactions.filter(t => t.type === type);
              const typeTotal = typeTransactions.reduce((sum, t) => sum + t.amount, 0);
              if (typeTotal === 0) return null;
              const percent = (typeTotal / stats.totalExpense) * 100;
              return (
                <View key={type} style={styles.expenseTypeRow}>
                  <View style={styles.expenseTypeHeader}>
                    <View style={[styles.typeDot, { backgroundColor: getTransactionTypeColor(type) }]} />
                    <Text style={{ fontSize: 14, color: theme.textPrimary }}>
                      {TransactionTypeNames[type]} ({typeTransactions.length}笔)
                    </Text>
                  </View>
                  <View style={styles.expenseTypeValues}>
                    <Text style={{ fontSize: 14, color: theme.textPrimary }}>
                      {formatCurrency(typeTotal)}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>
                      {percent.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </ThemedView>
        );

      case 'deliveryStats':
        return (
          <ThemedView level="default" style={styles.statsCard}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textSecondary, marginBottom: Spacing.md }}>
              送货统计
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>送货次数</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.accent, marginTop: 4 }}>
                  {deliveryRecords.length}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>总图片数</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.primary, marginTop: 4 }}>
                  {deliveryStats.totalImages}
                </Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>送货总额</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.success, marginTop: 4 }}>
                  {formatCurrency(deliveryStats.totalAmount)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>已收款</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.success, marginTop: 4 }}>
                  {formatCurrency(deliveryStats.totalReceived)}
                </Text>
              </View>
            </View>
          </ThemedView>
        );

      case 'deliveryHeader':
        return (
          <View style={styles.sectionHeader}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textSecondary }}>送货记录</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>共 {deliveryRecords.length} 条</Text>
              <TouchableOpacity onPress={handleAddDelivery} style={styles.addButton}>
                <FontAwesome6 name="plus" size={12} color="#fff" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, color: '#fff' }}>添加送货</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'emptyDelivery':
        return (
          <TouchableOpacity onPress={handleAddDelivery} activeOpacity={0.8}>
            <ThemedView level="default" style={styles.emptyCard}>
              <FontAwesome6 name="truck" size={48} color={theme.textMuted} style={{ marginBottom: Spacing.md }} />
              <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 4 }}>暂无送货记录</Text>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>点击此处添加第一条送货记录</Text>
            </ThemedView>
          </TouchableOpacity>
        );

      case 'deliveryRecord':
        return (
          <DeliveryRecordCard
            record={item.data.record}
            index={item.data.index}
            totalCount={deliveryRecords.length}
            theme={theme}
            onDelete={handleDeleteDeliveryRecord}
            styles={styles}
          />
        );

      case 'transactionHeader':
        return (
          <View style={styles.sectionHeader}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textSecondary }}>交易记录</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>共 {transactions.length} 条</Text>
              <TouchableOpacity onPress={handleAddTransaction} style={styles.addButton}>
                <FontAwesome6 name="plus" size={12} color="#fff" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, color: '#fff' }}>添加支出</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'emptyTransaction':
        return (
          <TouchableOpacity onPress={handleAddTransaction} activeOpacity={0.8}>
            <ThemedView level="default" style={styles.emptyCard}>
              <FontAwesome6 name="receipt" size={48} color={theme.textMuted} style={{ marginBottom: Spacing.md }} />
              <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 4 }}>暂无交易记录</Text>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>点击此处添加第一笔交易</Text>
            </ThemedView>
          </TouchableOpacity>
        );

      case 'transaction':
        return <TransactionCard transaction={item.data} theme={theme} styles={styles} />;

      default:
        return null;
    }
  }, [project, styles, theme, stats, deliveryRecords, deliveryStats, baseAmount, transactions, getStatusColor, getStatusText, isOverdue, handleAddDelivery, handleAddTransaction, handleDeleteDeliveryRecord, getTransactionTypeColor]);

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  if (!project) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.textMuted }}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.textPrimary }}>
            项目详情
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          data={listData}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
        />
      </View>
    </Screen>
  );
}

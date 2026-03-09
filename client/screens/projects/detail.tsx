import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Project, Transaction, InvoiceStatusNames } from '@/types';
import { ProjectStorage, TransactionStorage } from '@/utils/storage';
import { formatCurrency, formatDate, calculateProjectStats } from '@/utils/helpers';
import { TransactionTypeNames } from '@/types';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles';

export default function ProjectDetailScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ totalExpense: 0, netProfit: 0 });

  const loadData = useCallback(async () => {
    if (!id) return;

    const projectData = await ProjectStorage.getById(id);
    if (!projectData) {
      Alert.alert('错误', '项目不存在');
      router.back();
      return;
    }

    const transactionsData = await TransactionStorage.getByProjectId(id);
    const projectStats = await calculateProjectStats(projectData);

    setProject(projectData);
    setTransactions(transactionsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setStats(projectStats);
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddTransaction = () => {
    router.push('/transactions/add', { projectId: id });
  };

  const handleEditProject = () => {
    router.push('/projects/edit', { id });
  };

  if (!project) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <ThemedView level="root" style={styles.container}>
          <View style={styles.loadingContainer}>
            <ThemedText variant="body" color={theme.textMuted}>加载中...</ThemedText>
          </View>
        </ThemedView>
      </Screen>
    );
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'material': return theme.primary;
      case 'equipment': return theme.success;
      case 'labor': return theme.accent;
      default: return theme.textSecondary;
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ThemedView level="root" style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h3" color={theme.textPrimary} style={styles.headerTitle}>
            项目详情
          </ThemedText>
          <TouchableOpacity style={styles.editIconButton} onPress={handleEditProject}>
            <FontAwesome6 name="pen-to-square" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 项目基本信息 */}
          <ThemedView level="default" style={styles.infoCard}>
            <View style={styles.projectTitleRow}>
              <ThemedText variant="h2" color={theme.textPrimary} style={styles.detailProjectName}>
                {project.name}
              </ThemedText>
            </View>

            {project.description && (
              <ThemedText variant="body" color={theme.textSecondary} style={styles.projectDescription}>
                {project.description}
              </ThemedText>
            )}

            <View style={styles.projectMeta}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(project.status) }]} />
                <ThemedText variant="caption" color={getStatusColor(project.status)} style={styles.statusBadgeText}>
                  {getStatusText(project.status)}
                </ThemedText>
              </View>
              {project.manager && (
                <View style={styles.metaItem}>
                  <FontAwesome6 name="user" size={12} color={theme.textMuted} />
                  <ThemedText variant="caption" color={theme.textSecondary} style={styles.metaText}>
                    {project.manager}
                  </ThemedText>
                </View>
              )}
            </View>
          </ThemedView>

          {/* 时间信息 */}
          <ThemedView level="default" style={styles.statsCard}>
            <ThemedText variant="h4" color={theme.textSecondary} style={styles.statsTitle}>
              时间规划
            </ThemedText>
            <View style={styles.detailRow}>
              <ThemedText variant="caption" color={theme.textMuted}>开始日期</ThemedText>
              <ThemedText variant="body" color={theme.textPrimary}>
                {project.startDate ? formatDate(project.startDate) : '未设置'}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText variant="caption" color={theme.textMuted}>预计完成</ThemedText>
              <ThemedText variant="body" color={project.endDate && isOverdue(project.endDate) ? theme.error : theme.textPrimary}>
                {project.endDate ? formatDate(project.endDate) : '未设置'}
                {project.endDate && isOverdue(project.endDate) && ' (已过期)'}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText variant="caption" color={theme.textMuted}>创建时间</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                {formatDate(project.createdAt)}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText variant="caption" color={theme.textMuted}>更新时间</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                {formatDate(project.updatedAt)}
              </ThemedText>
            </View>
            {project.startDate && project.endDate && (
              <View style={styles.detailRow}>
                <ThemedText variant="caption" color={theme.textMuted}>项目周期</ThemedText>
                <ThemedText variant="caption" color={theme.textPrimary}>
                  {calculateProjectDuration(project.startDate, project.endDate)}
                </ThemedText>
              </View>
            )}
            {project.startDate && (
              <View style={styles.detailRow}>
                <ThemedText variant="caption" color={theme.textMuted}>已运行</ThemedText>
                <ThemedText variant="caption" color={theme.textPrimary}>
                  {calculateRunDuration(project.startDate)}
                </ThemedText>
              </View>
            )}
          </ThemedView>

          {/* 财务概况 */}
          <ThemedView level="default" style={styles.statsCard}>
            <ThemedText variant="h4" color={theme.textSecondary} style={styles.statsTitle}>
              财务概况
            </ThemedText>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText variant="caption" color={theme.textMuted}>合同金额</ThemedText>
                <ThemedText variant="h3" color={theme.primary} style={styles.statValue}>
                  {formatCurrency(project.contractAmount ?? 0)}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText variant="caption" color={theme.textMuted}>结算金额</ThemedText>
                <ThemedText variant="h3" color={theme.textSecondary} style={styles.statValue}>
                  {formatCurrency(project.settlementAmount ?? 0)}
                </ThemedText>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText variant="caption" color={theme.textMuted}>已收款</ThemedText>
                <ThemedText variant="h3" color={theme.success} style={styles.statValue}>
                  {formatCurrency(project.receivedAmount)}
                </ThemedText>
                {project.contractAmount && (
                  <ThemedText variant="caption" color={theme.textMuted}>
                    收款率 {((project.receivedAmount / project.contractAmount) * 100).toFixed(1)}%
                  </ThemedText>
                )}
              </View>
              <View style={styles.statItem}>
                <ThemedText variant="caption" color={theme.textMuted}>已支出</ThemedText>
                <ThemedText variant="h3" color={theme.error} style={styles.statValue}>
                  {formatCurrency(stats.totalExpense)}
                </ThemedText>
                {project.contractAmount && (
                  <ThemedText variant="caption" color={theme.textMuted}>
                    占比 {((stats.totalExpense / project.contractAmount) * 100).toFixed(1)}%
                  </ThemedText>
                )}
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <ThemedText variant="caption" color={theme.textMuted}>净收益</ThemedText>
                <ThemedText variant="h3" color={stats.netProfit >= 0 ? theme.success : theme.error} style={styles.statValue}>
                  {formatCurrency(stats.netProfit)}
                </ThemedText>
                {project.contractAmount && (
                  <ThemedText variant="caption" color={theme.textMuted}>
                    利润率 {((stats.netProfit / project.contractAmount) * 100).toFixed(1)}%
                  </ThemedText>
                )}
              </View>
            </View>
          </ThemedView>

          {/* 开票信息 */}
          <ThemedView level="default" style={styles.statsCard}>
            <ThemedText variant="h4" color={theme.textSecondary} style={styles.statsTitle}>
              开票信息
            </ThemedText>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText variant="caption" color={theme.textMuted}>已开票金额</ThemedText>
                <ThemedText variant="h3" color={theme.error} style={styles.statValue}>
                  {formatCurrency(project.invoiceAmount ?? 0)}
                </ThemedText>
                {project.contractAmount && (
                  <ThemedText variant="caption" color={theme.textMuted}>
                    开票率 {(((project.invoiceAmount ?? 0) / project.contractAmount) * 100).toFixed(1)}%
                  </ThemedText>
                )}
              </View>
              <View style={styles.statItem}>
                <ThemedText variant="caption" color={theme.textMuted}>开票状态</ThemedText>
                <ThemedText variant="h3" color={theme.primary} style={styles.statValue}>
                  {InvoiceStatusNames[project.invoiceStatus ?? 'none']}
                </ThemedText>
              </View>
            </View>
            {project.contractAmount && (
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <ThemedText variant="caption" color={theme.textMuted}>待开票金额</ThemedText>
                  <ThemedText variant="h3" color={theme.textSecondary} style={styles.statValue}>
                    {formatCurrency(project.contractAmount - (project.invoiceAmount ?? 0))}
                  </ThemedText>
                </View>
              </View>
            )}
          </ThemedView>

          {/* 支出分类统计 */}
          {stats.totalExpense > 0 && (
            <ThemedView level="default" style={styles.statsCard}>
              <ThemedText variant="h4" color={theme.textSecondary} style={styles.statsTitle}>
                支出分类统计
              </ThemedText>
              {(Object.keys(TransactionTypeNames) as Array<keyof typeof TransactionTypeNames>).map((type) => {
                const typeTransactions = transactions.filter(t => t.type === type);
                const typeTotal = typeTransactions.reduce((sum, t) => sum + t.amount, 0);
                if (typeTotal === 0) return null;
                const percent = (typeTotal / stats.totalExpense) * 100;
                return (
                  <View key={type} style={styles.expenseTypeRow}>
                    <View style={styles.expenseTypeHeader}>
                      <View style={[styles.typeDot, { backgroundColor: getTransactionTypeColor(type) }]} />
                      <ThemedText variant="body" color={theme.textPrimary}>
                        {TransactionTypeNames[type]} ({typeTransactions.length}笔)
                      </ThemedText>
                    </View>
                    <View style={styles.expenseTypeValues}>
                      <ThemedText variant="body" color={theme.textPrimary}>
                        {formatCurrency(typeTotal)}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {percent.toFixed(1)}%
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
            </ThemedView>
          )}

          {/* 交易记录 */}
          <View style={styles.sectionHeader}>
            <ThemedText variant="h4" color={theme.textSecondary}>交易记录</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>
              共 {transactions.length} 条
            </ThemedText>
          </View>

          {transactions.length === 0 ? (
            <ThemedView level="default" style={styles.emptyCard}>
              <FontAwesome6 name="receipt" size={48} color={theme.textMuted} style={styles.emptyIcon} />
              <ThemedText variant="body" color={theme.textSecondary} style={styles.emptyText}>
                暂无交易记录
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.emptyHint}>
                点击右下角按钮添加第一笔交易
              </ThemedText>
            </ThemedView>
          ) : (
            transactions.map((transaction) => (
              <ThemedView key={transaction.id} level="default" style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionTypeContainer}>
                    <View style={[styles.transactionTypeBadge, { backgroundColor: getTransactionTypeColor(transaction.type) + '20' }]}>
                      <ThemedText variant="caption" color={getTransactionTypeColor(transaction.type)} style={styles.transactionTypeText}>
                        {TransactionTypeNames[transaction.type]}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText variant="h4" color={theme.error} style={styles.transactionAmount}>
                    -{formatCurrency(transaction.amount)}
                  </ThemedText>
                </View>
                <ThemedText variant="body" color={theme.textPrimary} style={styles.transactionDescription}>
                  {transaction.description}
                </ThemedText>
                <View style={styles.transactionFooter}>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {formatDate(transaction.date)}
                  </ThemedText>
                </View>
              </ThemedView>
            ))
          )}

          <View style={{ height: Spacing['6xl'] }} />
        </ScrollView>

        <TouchableOpacity style={styles.fab} onPress={handleAddTransaction}>
          <FontAwesome6 name="plus" size={24} color={theme.buttonPrimaryText} />
        </TouchableOpacity>
      </ThemedView>
    </Screen>
  );

  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return theme.success;
      case 'completed': return theme.primary;
      case 'paused': return theme.textMuted;
      default: return theme.textMuted;
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'active': return '进行中';
      case 'completed': return '已完成';
      case 'paused': return '已暂停';
      default: return status;
    }
  }

  function isOverdue(date: string) {
    return new Date(date) < new Date();
  }

  function calculateProjectDuration(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} 天`;
  }

  function calculateRunDuration(startDate: string) {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} 天`;
  }
}

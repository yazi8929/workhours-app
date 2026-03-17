import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Project, Transaction, ProjectType, DeliveryRecord } from '@/types';
import { ProjectStorage, TransactionStorage, DeliveryRecordStorage } from '@/utils/storage';
import { formatCurrency, formatDate, calculateProjectStats } from '@/utils/helpers';
import { ProjectStatusNames, InvoiceStatusNames, ProjectTypeNames } from '@/types';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export default function StatsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deliveryRecords, setDeliveryRecords] = useState<DeliveryRecord[]>([]);
  const [projectStats, setProjectStats] = useState<Map<string, { totalIncome: number; totalExpense: number; netProfit: number }>>(new Map());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  
  // 送货开票收款记录选择器
  const [deliveryRecordProjectId, setDeliveryRecordProjectId] = useState<string | null>(null);
  const [deliveryRecordSelectorVisible, setDeliveryRecordSelectorVisible] = useState(false);

  const loadData = useCallback(async () => {
    const projectData = await ProjectStorage.getAll();
    const transactionData = await TransactionStorage.getAll();
    const deliveryRecordsData = await DeliveryRecordStorage.getAll();

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
    setProjectStats(statsMap);
  }, []);

  // 计算送货项目的累计金额（从送货记录计算）
  const getDeliveryTotalAmount = useCallback((projectId: string) => {
    const records = deliveryRecords.filter(r => r.projectId === projectId);
    return records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [deliveryRecords]);

  // 计算送货项目的已开票金额（从送货记录计算）
  const getDeliveryInvoicedAmount = useCallback((projectId: string) => {
    const records = deliveryRecords.filter(r => r.projectId === projectId);
    return records.reduce((sum, r) => sum + (Number(r.invoiceAmount) || 0), 0);
  }, [deliveryRecords]);

  // 计算送货项目的已收款金额（从送货记录计算）
  const getDeliveryReceivedAmount = useCallback((projectId: string) => {
    const records = deliveryRecords.filter(r => r.projectId === projectId);
    return records.reduce((sum, r) => sum + (Number(r.receivedAmount) || 0), 0);
  }, [deliveryRecords]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // 根据筛选条件过滤数据
  const filteredProjects = useMemo(() => {
    if (!selectedProjectId) return projects;
    return projects.filter(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const filteredTransactions = useMemo(() => {
    if (!selectedProjectId) return transactions;
    return transactions.filter(t => t.projectId === selectedProjectId);
  }, [transactions, selectedProjectId]);

  // 送货项目列表（用于送货开票收款记录选择）
  const deliveryProjects = useMemo(() => {
    return projects.filter(p => p.projectType === 'delivery');
  }, [projects]);

  // 送货开票收款记录汇总：按项目合并
  const deliveryInvoicePaymentSummary = useMemo(() => {
    // 获取所有有送货记录的项目
    const projectIds = new Set<string>();
    deliveryRecords.forEach(r => {
      projectIds.add(r.projectId);
    });

    // 如果选择了项目，只返回该项目的汇总
    const targetProjectIds = deliveryRecordProjectId 
      ? [deliveryRecordProjectId] 
      : Array.from(projectIds);

    return targetProjectIds.map(projectId => {
      const projectRecords = deliveryRecords.filter(r => r.projectId === projectId);
      const project = projects.find(p => p.id === projectId);
      
      return {
        projectId,
        projectName: project?.name || '未知项目',
        totalAmount: projectRecords.reduce((sum, r) => sum + (r.amount || 0), 0),
        invoiceAmount: projectRecords.reduce((sum, r) => sum + (r.invoiceAmount || 0), 0),
        receivedAmount: projectRecords.reduce((sum, r) => sum + (r.receivedAmount || 0), 0),
        recordCount: projectRecords.length,
      };
    });
  }, [deliveryRecords, deliveryRecordProjectId, projects]);

  // 合同项目统计
  const contractProjects = filteredProjects.filter(p => p.projectType === 'contract' || !p.projectType);
  const contractTotalIncome = contractProjects.reduce((sum, p) => sum + p.receivedAmount, 0);
  const contractTotalExpense = Array.from(projectStats.entries())
    .filter(([id]) => contractProjects.some(p => p.id === id))
    .reduce((sum, [_, s]) => sum + s.totalExpense, 0);
  const contractTotalUnpaid = contractProjects.reduce((sum, p) => {
    const totalAmount = p.settlementAmount || p.contractAmount || 0;
    return sum + (totalAmount - p.receivedAmount);
  }, 0);

  // 计算总金额（合同金额 + 送货记录总额）
  const totalAmount = useMemo(() => {
    return projects.reduce((sum, p) => {
      // 工程项目使用合同金额
      if (p.projectType === 'contract' || !p.projectType) {
        return sum + (p.contractAmount || 0);
      }
      // 零星采购使用送货记录总额
      if (p.projectType === 'delivery') {
        const records = deliveryRecords.filter(r => r.projectId === p.id);
        const deliveryTotal = records.reduce((s, r) => s + (Number(r.amount) || 0), 0);
        return sum + deliveryTotal;
      }
      return sum;
    }, 0);
  }, [projects, deliveryRecords]);

  // 项目数量统计
  const projectCounts = useMemo(() => {
    const contractCount = projects.filter(p => p.projectType === 'contract' || !p.projectType).length;
    const deliveryCount = projects.filter(p => p.projectType === 'delivery').length;
    return { contractCount, deliveryCount };
  }, [projects]);

  // 送货项目统计
  const deliveryStatsProjects = filteredProjects.filter(p => p.projectType === 'delivery');
  const deliveryTotalAmount = deliveryStatsProjects.reduce((sum, p) => sum + getDeliveryTotalAmount(p.id), 0);
  const deliveryTotalInvoiced = deliveryStatsProjects.reduce((sum, p) => sum + getDeliveryInvoicedAmount(p.id), 0);
  const deliveryTotalIncome = deliveryStatsProjects.reduce((sum, p) => sum + getDeliveryReceivedAmount(p.id), 0);
  const deliveryTotalUnpaid = deliveryTotalAmount - deliveryTotalIncome;

  // 总体统计
  const totalIncome = contractTotalIncome + deliveryTotalIncome;
  const totalExpense = Array.from(projectStats.entries())
    .filter(([id]) => !selectedProjectId || id === selectedProjectId)
    .reduce((sum, [_, s]) => sum + s.totalExpense, 0);
  const totalNetProfit = totalIncome - totalExpense;
  const totalUnpaid = contractTotalUnpaid + deliveryTotalUnpaid;

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.success;
      case 'completed': return theme.primary;
      case 'paused': return theme.textMuted;
      default: return theme.textMuted;
    }
  };

  // 获取项目名称
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || '未知项目';
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ThemedView level="root" style={styles.container}>
        <View style={styles.header}>
          <ThemedText variant="h2" color={theme.textPrimary}>统计概览</ThemedText>
          {projects.length > 0 && (
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowProjectSelector(true)}
            >
              <FontAwesome6 name="filter" size={18} color={theme.primary} />
              <ThemedText variant="body" color={theme.primary} style={styles.filterButtonText}>
                {selectedProject ? selectedProject.name : '全部项目'}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 总金额 */}
          <ThemedView level="default" style={styles.totalAmountCard}>
            <View style={styles.totalAmountContent}>
              <View style={styles.totalAmountIconContainer}>
                <FontAwesome6 name="sack-dollar" size={28} color={theme.primary} />
              </View>
              <View style={styles.totalAmountInfo}>
                <ThemedText variant="caption" color={theme.textSecondary}>
                  总金额
                </ThemedText>
                <ThemedText variant="h2" color={theme.primary} style={{ fontWeight: '700' }}>
                  ¥{totalAmount.toLocaleString()}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  工程项目 {projectCounts.contractCount} 个 · 零星采购 {projectCounts.deliveryCount} 个
                </ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* 总体概况 */}
          <ThemedView level="default" style={styles.overviewCard}>
            <ThemedText variant="h4" color={theme.textSecondary} style={styles.cardTitle}>
              {selectedProject ? `${selectedProject.name} - 概况` : '总体概况'}
            </ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <FontAwesome6 name="receipt" size={24} color={theme.error} style={styles.statIcon} />
                <ThemedText variant="caption" color={theme.textMuted}>总支出</ThemedText>
                <ThemedText variant="h2" color={theme.error}>{formatCurrency(totalExpense)}</ThemedText>
              </View>
              <View style={styles.statItem}>
                <FontAwesome6 name="wallet" size={24} color={theme.success} style={styles.statIcon} />
                <ThemedText variant="caption" color={theme.textMuted}>总收入</ThemedText>
                <ThemedText variant="h2" color={theme.success}>{formatCurrency(totalIncome)}</ThemedText>
              </View>
              <View style={styles.statItem}>
                <FontAwesome6 name="clock" size={24} color={theme.error} style={styles.statIcon} />
                <ThemedText variant="caption" color={theme.textMuted}>未收款</ThemedText>
                <ThemedText variant="h2" color={theme.error}>{formatCurrency(totalUnpaid)}</ThemedText>
              </View>
              <View style={styles.statItem}>
                <FontAwesome6 name="scale-balanced" size={24} color={theme.primary} style={styles.statIcon} />
                <ThemedText variant="caption" color={theme.textMuted}>净收益</ThemedText>
                <ThemedText variant="h2" color={totalNetProfit >= 0 ? theme.success : theme.error}>{formatCurrency(totalNetProfit)}</ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* 工程项目统计 */}
          {!selectedProjectId && contractProjects.length > 0 && (
            <ThemedView level="default" style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionTypeBadge, { backgroundColor: theme.primary }]}>
                    <ThemedText variant="caption" color="#FFFFFF">合同</ThemedText>
                  </View>
                  <ThemedText variant="h4" color={theme.textPrimary}>工程项目</ThemedText>
                </View>
                <ThemedText variant="caption" color={theme.textMuted}>{contractProjects.length} 个</ThemedText>
              </View>
              <View style={styles.sectionStats}>
                <View style={styles.sectionStatItem}>
                  <ThemedText variant="caption" color={theme.textMuted}>合同总额</ThemedText>
                  <ThemedText variant="h3" color={theme.primary}>
                    {formatCurrency(contractProjects.reduce((sum, p) => sum + (p.contractAmount || 0), 0))}
                  </ThemedText>
                </View>
                <View style={styles.sectionStatItem}>
                  <ThemedText variant="caption" color={theme.textMuted}>未收款</ThemedText>
                  <ThemedText variant="h3" color={theme.error}>{formatCurrency(contractTotalUnpaid)}</ThemedText>
                </View>
              </View>
            </ThemedView>
          )}

          {/* 零星采购统计 */}
          {!selectedProjectId && deliveryStatsProjects.length > 0 && (
            <ThemedView level="default" style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionTypeBadge, { backgroundColor: '#E53935' }]}>
                    <ThemedText variant="caption" color="#FFFFFF">采购</ThemedText>
                  </View>
                  <ThemedText variant="h4" color={theme.textPrimary}>零星采购</ThemedText>
                </View>
                <ThemedText variant="caption" color={theme.textMuted}>{deliveryStatsProjects.length} 个</ThemedText>
              </View>
              <View style={styles.sectionStats}>
                <View style={styles.sectionStatItem}>
                  <ThemedText variant="caption" color={theme.textMuted}>送货总额</ThemedText>
                  <ThemedText variant="h3" color={theme.accent}>{formatCurrency(deliveryTotalAmount)}</ThemedText>
                </View>
                <View style={styles.sectionStatItem}>
                  <ThemedText variant="caption" color={theme.textMuted}>未收款</ThemedText>
                  <ThemedText variant="h3" color={theme.error}>{formatCurrency(deliveryTotalUnpaid)}</ThemedText>
                </View>
              </View>
            </ThemedView>
          )}

          {/* 零星采购开票收款记录 */}
          {!selectedProjectId && deliveryProjects.length > 0 && (
            <ThemedView level="default" style={styles.sectionCard}>
              <ThemedText variant="h4" color={theme.textSecondary} style={styles.sectionTitle}>
                零星采购开票收款记录
              </ThemedText>

              {/* 项目选择器 */}
              <TouchableOpacity
                style={[styles.projectSelector, { backgroundColor: theme.backgroundTertiary }]}
                onPress={() => setDeliveryRecordSelectorVisible(true)}
              >
                <ThemedText variant="body" color={deliveryRecordProjectId ? theme.textPrimary : theme.textMuted}>
                  {deliveryRecordProjectId
                    ? projects.find(p => p.id === deliveryRecordProjectId)?.name || '选择项目'
                    : '全部零星采购'
                  }
                </ThemedText>
                <FontAwesome6 name="chevron-down" size={16} color={theme.textMuted} />
              </TouchableOpacity>

              {/* 项目汇总列表 */}
              {deliveryInvoicePaymentSummary.length > 0 ? (
                deliveryInvoicePaymentSummary.map((item, index) => (
                  <View key={item.projectId} style={[styles.summaryCard, { borderBottomWidth: index === deliveryInvoicePaymentSummary.length - 1 ? 0 : 1 }]}>
                    <View style={styles.summaryCardHeader}>
                      <View style={[styles.typeBadgeSmall, { backgroundColor: '#E53935' }]}>
                        <ThemedText variant="caption" color="#FFFFFF" style={{ fontSize: 10 }}>送</ThemedText>
                      </View>
                      <ThemedText variant="body" color={theme.textPrimary} style={{ flex: 1, fontWeight: '600' }}>
                        {item.projectName}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {item.recordCount} 条记录
                      </ThemedText>
                    </View>
                    
                    <View style={styles.summaryCardStats}>
                      <View style={styles.summaryCardStatItem}>
                        <ThemedText variant="caption" color={theme.textMuted}>送货总额</ThemedText>
                        <ThemedText variant="body" color={theme.accent}>{formatCurrency(item.totalAmount)}</ThemedText>
                      </View>
                      <View style={styles.summaryCardStatItem}>
                        <ThemedText variant="caption" color={theme.textMuted}>已开票</ThemedText>
                        <ThemedText variant="body" color={theme.primary}>{formatCurrency(item.invoiceAmount)}</ThemedText>
                      </View>
                      <View style={styles.summaryCardStatItem}>
                        <ThemedText variant="caption" color={theme.textMuted}>已收款</ThemedText>
                        <ThemedText variant="body" color={theme.success}>{formatCurrency(item.receivedAmount)}</ThemedText>
                      </View>
                      <View style={styles.summaryCardStatItem}>
                        <ThemedText variant="caption" color={theme.textMuted}>未收款</ThemedText>
                        <ThemedText variant="body" color={theme.error}>{formatCurrency(item.totalAmount - item.receivedAmount)}</ThemedText>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <ThemedText variant="caption" color={theme.textMuted} style={{ paddingVertical: Spacing.md, textAlign: 'center' }}>
                  暂无开票收款记录
                </ThemedText>
              )}
            </ThemedView>
          )}

          <View style={{ height: Spacing['5xl'] }} />
        </ScrollView>

        {/* 项目选择器 Modal */}
        <Modal
          visible={showProjectSelector}
          transparent
          animationType="slide"
          onRequestClose={() => setShowProjectSelector(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowProjectSelector(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText variant="h4" color={theme.textPrimary}>选择项目</ThemedText>
                <TouchableOpacity onPress={() => setShowProjectSelector(false)}>
                  <FontAwesome6 name="xmark" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={projects}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.projectOption,
                      selectedProjectId === item.id && styles.projectOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedProjectId(selectedProjectId === item.id ? null : item.id);
                      setShowProjectSelector(false);
                    }}
                  >
                    <View style={styles.projectOptionContent}>
                      <View style={[styles.typeBadgeSmall, { backgroundColor: item.projectType === 'delivery' ? '#E53935' : theme.primary }]}>
                        <ThemedText variant="caption" color="#FFFFFF" style={{ fontSize: 10 }}>
                          {item.projectType === 'delivery' ? '送' : '合'}
                        </ThemedText>
                      </View>
                      <ThemedText
                        variant="body"
                        color={selectedProjectId === item.id ? theme.buttonPrimaryText : theme.textPrimary}
                      >
                        {item.name}
                      </ThemedText>
                    </View>
                    {selectedProjectId === item.id && (
                      <FontAwesome6 name="check" size={18} color={theme.buttonPrimaryText} />
                    )}
                  </TouchableOpacity>
                )}
                ListHeaderComponent={() => (
                  <TouchableOpacity
                    style={[
                      styles.projectOption,
                      selectedProjectId === null && styles.projectOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedProjectId(null);
                      setShowProjectSelector(false);
                    }}
                  >
                    <ThemedText
                      variant="body"
                      color={selectedProjectId === null ? theme.buttonPrimaryText : theme.textPrimary}
                    >
                      全部项目
                    </ThemedText>
                    {selectedProjectId === null && (
                      <FontAwesome6 name="check" size={18} color={theme.buttonPrimaryText} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* 零星采购开票收款记录项目选择器 Modal */}
        <Modal
          visible={deliveryRecordSelectorVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDeliveryRecordSelectorVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setDeliveryRecordSelectorVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText variant="h4" color={theme.textPrimary}>选择零星采购</ThemedText>
                <TouchableOpacity onPress={() => setDeliveryRecordSelectorVisible(false)}>
                  <FontAwesome6 name="xmark" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={deliveryProjects}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.projectOption,
                      deliveryRecordProjectId === item.id && styles.projectOptionSelected
                    ]}
                    onPress={() => {
                      setDeliveryRecordProjectId(deliveryRecordProjectId === item.id ? null : item.id);
                      setDeliveryRecordSelectorVisible(false);
                    }}
                  >
                    <View style={styles.projectOptionContent}>
                      <View style={[styles.typeBadgeSmall, { backgroundColor: '#E53935' }]}>
                        <ThemedText variant="caption" color="#FFFFFF" style={{ fontSize: 10 }}>送</ThemedText>
                      </View>
                      <ThemedText
                        variant="body"
                        color={deliveryRecordProjectId === item.id ? theme.buttonPrimaryText : theme.textPrimary}
                      >
                        {item.name}
                      </ThemedText>
                    </View>
                    {deliveryRecordProjectId === item.id && (
                      <FontAwesome6 name="check" size={18} color={theme.buttonPrimaryText} />
                    )}
                  </TouchableOpacity>
                )}
                ListHeaderComponent={() => (
                  <TouchableOpacity
                    style={[
                      styles.projectOption,
                      deliveryRecordProjectId === null && styles.projectOptionSelected
                    ]}
                    onPress={() => {
                      setDeliveryRecordProjectId(null);
                      setDeliveryRecordSelectorVisible(false);
                    }}
                  >
                    <ThemedText
                      variant="body"
                      color={deliveryRecordProjectId === null ? theme.buttonPrimaryText : theme.textPrimary}
                    >
                      全部零星采购
                    </ThemedText>
                    {deliveryRecordProjectId === null && (
                      <FontAwesome6 name="check" size={18} color={theme.buttonPrimaryText} />
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

function createStyles(theme: Theme) {
  return StyleSheet.create({
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
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing['5xl'],
      flexGrow: 1,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
      gap: Spacing.sm,
    },
    filterButtonText: {
      marginLeft: Spacing.xs,
    },
    // 总金额卡片样式
    totalAmountCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      backgroundColor: theme.primary + '15',
      boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
    },
    totalAmountContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    totalAmountIconContainer: {
      width: 56,
      height: 56,
      borderRadius: BorderRadius.lg,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.lg,
    },
    totalAmountInfo: {
      flex: 1,
    },
    overviewCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
    },
    cardTitle: {
      marginBottom: Spacing.lg,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statItem: {
      width: '48%',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    statIcon: {
      marginBottom: Spacing.sm,
    },
    sectionCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    sectionTypeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
    },
    sectionStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    sectionStatItem: {
      alignItems: 'center',
    },
    sectionTitle: {
      marginBottom: Spacing.md,
    },
    projectsList: {
      gap: Spacing.sm,
      backgroundColor: 'transparent',
    },
    expenseCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
    },
    totalExpenseRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalExpenseAmount: {
      fontWeight: '600',
    },
    projectCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
    },
    projectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    projectInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: Spacing.sm,
    },
    typeBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
      marginRight: Spacing.sm,
    },
    typeBadgeText: {
      fontSize: 10,
      fontWeight: '500',
    },
    projectName: {
      flex: 1,
    },
    projectSection: {
      marginBottom: Spacing.sm,
    },
    projectStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    projectStatItem: {
      flex: 1,
    },
    projectInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.xs,
    },
    emptyCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing['2xl'],
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyIcon: {
      marginBottom: Spacing.md,
    },
    emptyText: {
      textAlign: 'center',
    },
    // 送货开票收款记录样式
    projectSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.md,
    },
    summaryCard: {
      paddingVertical: Spacing.md,
      borderBottomColor: theme.borderLight,
    },
    summaryCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
      gap: Spacing.sm,
    },
    summaryCardStats: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    summaryCardStatItem: {
      flex: 1,
      minWidth: '45%',
    },
    // Modal 样式
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.backgroundDefault,
      borderTopLeftRadius: BorderRadius.lg,
      borderTopRightRadius: BorderRadius.lg,
      maxHeight: '70%',
      paddingBottom: Spacing['2xl'],
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    projectOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    projectOptionSelected: {
      backgroundColor: theme.primary,
    },
    projectOptionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    typeBadgeSmall: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
  });
}

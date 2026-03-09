import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Project, Transaction } from '@/types';
import { ProjectStorage, TransactionStorage } from '@/utils/storage';
import { formatCurrency, formatDate, calculateProjectStats } from '@/utils/helpers';
import { ProjectStatusNames, InvoiceStatusNames } from '@/types';
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
  const [projectStats, setProjectStats] = useState<Map<string, { totalIncome: number; totalExpense: number; netProfit: number }>>(new Map());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);

  const loadData = useCallback(async () => {
    const projectData = await ProjectStorage.getAll();
    const transactionData = await TransactionStorage.getAll();

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
    setProjectStats(statsMap);
  }, []);

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

  const totalIncome = filteredProjects.reduce((sum, p) => sum + p.receivedAmount, 0);
  const totalExpense = Array.from(projectStats.entries())
    .filter(([id]) => !selectedProjectId || id === selectedProjectId)
    .reduce((sum, [_, s]) => sum + s.totalExpense, 0);
  const totalNetProfit = totalIncome - totalExpense;
  const totalUnpaid = filteredProjects.reduce((sum, p) => {
    const totalAmount = p.settlementAmount || p.contractAmount || 0;
    return sum + (totalAmount - p.receivedAmount);
  }, 0);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.success;
      case 'completed': return theme.primary;
      case 'paused': return theme.textMuted;
      default: return theme.textMuted;
    }
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
          <ThemedView level="default" style={styles.overviewCard}>
            <ThemedText variant="h4" color={theme.textSecondary} style={styles.cardTitle}>
              {selectedProject ? `${selectedProject.name} - 概况` : '总体概况'}
            </ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <FontAwesome6 name="folder" size={24} color={theme.primary} style={styles.statIcon} />
                <ThemedText variant="caption" color={theme.textMuted}>{selectedProject ? '项目' : '项目数'}</ThemedText>
                <ThemedText variant="h2" color={theme.textPrimary}>{filteredProjects.length}</ThemedText>
              </View>
              <View style={styles.statItem}>
                <FontAwesome6 name="wallet" size={24} color={theme.success} style={styles.statIcon} />
                <ThemedText variant="caption" color={theme.textMuted}>总收入</ThemedText>
                <ThemedText variant="h2" color={theme.success}>{formatCurrency(totalIncome)}</ThemedText>
              </View>
              <View style={styles.statItem}>
                <FontAwesome6 name="clock" size={24} color={theme.error} style={styles.statIcon} />
                <ThemedText variant="caption" color={theme.textMuted}>未收款总额</ThemedText>
                <ThemedText variant="h2" color={theme.error}>{formatCurrency(totalUnpaid)}</ThemedText>
              </View>
              <View style={styles.statItem}>
                <FontAwesome6 name="scale-balanced" size={24} color={theme.primary} style={styles.statIcon} />
                <ThemedText variant="caption" color={theme.textMuted}>净收益</ThemedText>
                <ThemedText variant="h2" color={totalNetProfit >= 0 ? theme.success : theme.error}>{formatCurrency(totalNetProfit)}</ThemedText>
              </View>
            </View>
          </ThemedView>

          <ThemedView level="default" style={styles.expenseCard}>
            <ThemedText variant="h4" color={theme.textSecondary} style={styles.cardTitle}>
              支出分类
            </ThemedText>
            <View style={styles.totalExpenseRow}>
              <ThemedText variant="body" color={theme.textPrimary}>
                总支出
              </ThemedText>
              <ThemedText variant="h3" color={theme.error} style={styles.totalExpenseAmount}>
                {formatCurrency(totalExpense)}
              </ThemedText>
            </View>
          </ThemedView>

          <ThemedText variant="h4" color={theme.textSecondary} style={styles.sectionTitle}>
            {selectedProject ? '项目详情' : '项目明细'}
          </ThemedText>

          {filteredProjects.length === 0 ? (
            <ThemedView level="default" style={styles.emptyCard}>
              <FontAwesome6 name="chart-pie" size={48} color={theme.textMuted} style={styles.emptyIcon} />
              <ThemedText variant="body" color={theme.textSecondary} style={styles.emptyText}>
                {selectedProject ? '该项目无数据' : '暂无项目数据'}
              </ThemedText>
            </ThemedView>
          ) : (
            filteredProjects.map((project) => {
              const stats = projectStats.get(project.id);
              if (!stats) return null;

              return (
                <ThemedView key={project.id} level="default" style={styles.projectCard}>
                  <View style={styles.projectHeader}>
                    <View style={styles.projectInfo}>
                      <View style={[styles.statusDot, { backgroundColor: getProjectStatusColor(project.status) }]} />
                      <ThemedText variant="h4" color={theme.textPrimary} style={styles.projectName}>
                        {project.name}
                      </ThemedText>
                    </View>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      {ProjectStatusNames[project.status]}
                    </ThemedText>
                  </View>

                  {/* 财务信息 */}
                  <View style={styles.projectSection}>
                    <View style={styles.projectStats}>
                      <View style={styles.projectStatItem}>
                        <ThemedText variant="caption" color={theme.textMuted}>合同</ThemedText>
                        <ThemedText variant="body" color={theme.primary}>
                          {formatCurrency(project.contractAmount ?? 0)}
                        </ThemedText>
                      </View>
                      <View style={styles.projectStatItem}>
                        <ThemedText variant="caption" color={theme.textMuted}>已收款</ThemedText>
                        <ThemedText variant="body" color={theme.success}>
                          {formatCurrency(stats.totalIncome)}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.projectStats}>
                      <View style={styles.projectStatItem}>
                        <ThemedText variant="caption" color={theme.textMuted}>已支出</ThemedText>
                        <ThemedText variant="body" color={theme.error}>
                          {formatCurrency(stats.totalExpense)}
                        </ThemedText>
                      </View>
                      <View style={styles.projectStatItem}>
                        <ThemedText variant="caption" color={theme.textMuted}>净收益</ThemedText>
                        <ThemedText variant="body" color={stats.netProfit >= 0 ? theme.success : theme.error}>
                          {formatCurrency(stats.netProfit)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* 未收款信息 */}
                  <View style={styles.projectSection}>
                    <View style={styles.unpaidAmountRow}>
                      <ThemedText variant="caption" color={theme.textMuted}>未收款</ThemedText>
                      {(() => {
                        const totalAmount = project.settlementAmount || project.contractAmount || 0;
                        const unpaidAmount = totalAmount - stats.totalIncome;
                        return (
                          <ThemedText variant="h3" color={theme.error} style={styles.unpaidAmountText}>
                            {formatCurrency(unpaidAmount)}
                          </ThemedText>
                        );
                      })()}
                    </View>
                  </View>

                  {/* 开票信息 */}
                  <View style={styles.projectSection}>
                    <View style={styles.projectStats}>
                      <View style={styles.projectStatItem}>
                        <ThemedText variant="caption" color={theme.textMuted}>已开票</ThemedText>
                        <ThemedText variant="body" color={theme.error}>
                          {formatCurrency(project.invoiceAmount ?? 0)}
                        </ThemedText>
                      </View>
                      <View style={styles.projectStatItem}>
                        <ThemedText variant="caption" color={theme.textMuted}>开票状态</ThemedText>
                        <ThemedText variant="body" color={theme.primary}>
                          {InvoiceStatusNames[project.invoiceStatus ?? 'none']}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* 时间信息 */}
                  <View style={styles.projectSection}>
                    {project.endDate && (
                      <View style={styles.projectInfoRow}>
                        <ThemedText variant="caption" color={theme.textMuted}>截止日期</ThemedText>
                        <ThemedText variant="caption" color={new Date(project.endDate) < new Date() ? theme.error : theme.textPrimary}>
                          {formatDate(project.endDate)}
                          {new Date(project.endDate) < new Date() && ' (已过期)'}
                        </ThemedText>
                      </View>
                    )}
                    {project.manager && (
                      <View style={styles.projectInfoRow}>
                        <ThemedText variant="caption" color={theme.textMuted}>负责人</ThemedText>
                        <ThemedText variant="caption" color={theme.textPrimary}>
                          {project.manager}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </ThemedView>
              );
            })
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
                    <ThemedText
                      variant="body"
                      color={selectedProjectId === item.id ? theme.buttonPrimaryText : theme.textPrimary}
                    >
                      {item.name}
                    </ThemedText>
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
    overviewCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    statItem: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      alignItems: 'center',
    },
    statIcon: {
      marginBottom: Spacing.xs,
    },
    expenseCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
    },
    cardTitle: {
      marginBottom: Spacing.md,
    },
    expenseTypeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    expenseTypeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    typeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: Spacing.sm,
    },
    expenseTypeValues: {
      alignItems: 'flex-end',
    },
    totalExpenseRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.md,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
    },
    totalExpenseAmount: {
      fontWeight: 'bold',
    },
    sectionTitle: {
      marginBottom: Spacing.md,
    },
    projectCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
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
    projectName: {
      flex: 1,
    },
    projectStats: {
      flexDirection: 'row',
      marginBottom: Spacing.md,
    },
    projectStatItem: {
      flex: 1,
      alignItems: 'center',
    },
    projectSection: {
      marginTop: Spacing.md,
    },
    projectInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
    },
    unpaidAmountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.md,
    },
    unpaidAmountText: {
      fontWeight: 'bold',
    },
    progressContainer: {
      marginTop: Spacing.sm,
    },
    progressBar: {
      height: 6,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 3,
      marginBottom: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressLabel: {
      textAlign: 'right',
    },
    emptyCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing['2xl'],
      alignItems: 'center',
      boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
    },
    emptyIcon: {
      marginBottom: Spacing.md,
      opacity: 0.5,
    },
    emptyText: {
      textAlign: 'center',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
      gap: Spacing.xs,
    },
    filterButtonText: {
      marginLeft: Spacing.xs,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.backgroundRoot,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      maxHeight: '70%',
      paddingTop: Spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    projectOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    projectOptionSelected: {
      backgroundColor: theme.backgroundTertiary,
    },
  });
}

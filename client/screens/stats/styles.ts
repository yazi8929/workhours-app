import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: Spacing['5xl'],
    },
    
    // 时间筛选器
    filterSection: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    filterTabs: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    filterTab: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
    },
    filterTabActive: {
      backgroundColor: theme.primary,
    },
    filterTabInactive: {
      backgroundColor: theme.backgroundTertiary,
    },
    filterTabText: {
      fontWeight: '600',
      fontSize: 13,
    },
    
    // 区块标题
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      marginTop: Spacing.lg,
    },
    sectionTitle: {
      fontWeight: '700',
    },
    
    // 支出分类图表
    chartContainer: {
      marginHorizontal: Spacing.lg,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
      boxShadow: '0px 4px 12px rgba(79, 70, 229, 0.08)',
    },
    chartTitle: {
      marginBottom: Spacing.md,
    },
    pieChartContainer: {
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    legendContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendText: {
      fontSize: 12,
    },
    
    // 项目利润排行
    rankingContainer: {
      marginHorizontal: Spacing.lg,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      boxShadow: '0px 4px 12px rgba(79, 70, 229, 0.08)',
    },
    rankingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    rankingItemLast: {
      borderBottomWidth: 0,
    },
    rankNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    rankText: {
      fontWeight: '700',
      fontSize: 14,
    },
    rankingContent: {
      flex: 1,
    },
    rankingName: {
      fontWeight: '600',
      marginBottom: 2,
    },
    rankingSub: {
      fontSize: 12,
    },
    rankingProfit: {
      alignItems: 'flex-end',
    },
    rankingAmount: {
      fontWeight: '700',
      marginBottom: 2,
    },
    rankingRate: {
      fontSize: 11,
    },
    
    // 应收账款追踪
    receivableContainer: {
      marginHorizontal: Spacing.lg,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      boxShadow: '0px 4px 12px rgba(79, 70, 229, 0.08)',
    },
    receivableSummary: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
    },
    summaryItem: {
      alignItems: 'center',
    },
    summaryValue: {
      fontWeight: '800',
      marginBottom: 4,
    },
    summaryLabel: {
      fontSize: 12,
    },
    receivableProjectItem: {
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    receivableProjectItemLast: {
      borderBottomWidth: 0,
    },
    projectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    projectName: {
      fontWeight: '600',
      flex: 1,
      marginRight: Spacing.md,
    },
    projectTotal: {
      fontWeight: '700',
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: Spacing.xs,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    progressLabel: {
      fontSize: 11,
    },
    
    // 趋势图
    trendContainer: {
      marginHorizontal: Spacing.lg,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      boxShadow: '0px 4px 12px rgba(79, 70, 229, 0.08)',
    },
    trendLegend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.lg,
      marginBottom: Spacing.md,
    },
    trendLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    
    // 空状态
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing['2xl'],
    },
    emptyIcon: {
      marginBottom: Spacing.md,
    },
    emptyText: {
      textAlign: 'center',
    },
    
    // 统计卡片
    statsCard: {
      marginHorizontal: Spacing.lg,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      boxShadow: '0px 4px 12px rgba(79, 70, 229, 0.08)',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontWeight: '700',
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 11,
    },
  });
};

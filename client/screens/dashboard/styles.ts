import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingBottom: Spacing['5xl'],
    },
    // 欢迎区域
    welcomeSection: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      marginBottom: Spacing.lg,
    },
    welcomeTitle: {
      marginBottom: Spacing.xs,
    },
    welcomeSubtitle: {
      marginTop: Spacing.xs,
    },
    // 财务概况区域
    financeSection: {
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontWeight: '700',
    },
    seeMoreText: {
      color: theme.primary,
    },
    // 财务卡片网格
    financeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    financeCard: {
      width: '48%',
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      boxShadow: '0px 4px 12px rgba(79, 70, 229, 0.08)',
    },
    financeCardFull: {
      width: '100%',
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0px 4px 12px rgba(79, 70, 229, 0.08)',
    },
    financeCardIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    financeCardLabel: {
      marginBottom: Spacing.xs,
    },
    financeCardAmount: {
      fontWeight: '800',
    },
    financeCardTrend: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.xs,
      gap: Spacing.xs,
    },
    // 项目状态概览
    projectSection: {
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    projectStatusGrid: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    projectStatusCard: {
      flex: 1,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      alignItems: 'center',
      boxShadow: '0px 4px 12px rgba(79, 70, 229, 0.08)',
    },
    projectStatusIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    projectStatusNumber: {
      fontWeight: '800',
      marginBottom: 2,
    },
    projectStatusLabel: {
      fontSize: 12,
    },
    // 近期动态
    recentSection: {
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    recentTabs: {
      flexDirection: 'row',
      marginBottom: Spacing.md,
      gap: Spacing.sm,
    },
    recentTab: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
    },
    recentTabActive: {
      backgroundColor: theme.primary,
    },
    recentTabInactive: {
      backgroundColor: theme.backgroundTertiary,
    },
    recentTabText: {
      fontWeight: '600',
      fontSize: 13,
    },
    recentList: {
      gap: Spacing.sm,
    },
    recentItem: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.06)',
    },
    recentItemIcon: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    recentItemContent: {
      flex: 1,
    },
    recentItemTitle: {
      fontWeight: '600',
      marginBottom: 2,
    },
    recentItemSubtitle: {
      fontSize: 12,
    },
    recentItemAmount: {
      fontWeight: '700',
    },
    recentItemDate: {
      fontSize: 11,
      marginTop: 2,
    },
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
    // 提醒卡片
    reminderSection: {
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    reminderCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderLeftWidth: 4,
      boxShadow: '0px 4px 12px rgba(79, 70, 229, 0.08)',
    },
    reminderHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
      gap: Spacing.sm,
    },
    reminderTitle: {
      fontWeight: '700',
    },
    reminderList: {
      gap: Spacing.sm,
    },
    reminderItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
      gap: Spacing.sm,
    },
    reminderDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    reminderText: {
      flex: 1,
      fontSize: 13,
    },
  });
};

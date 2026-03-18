import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.md,
      gap: Spacing.md,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      height: 44,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      marginLeft: Spacing.sm,
    },
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    // 筛选标签
    filterSection: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    filterTabs: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    filterTab: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
    },
    filterTabActive: {
      backgroundColor: theme.primary,
    },
    filterTabInactive: {
      backgroundColor: theme.backgroundTertiary,
    },
    filterTabText: {
      fontSize: 13,
      fontWeight: '500',
    },
    
    // 结果列表
    resultsContainer: {
      flex: 1,
    },
    sectionTitle: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    resultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    resultIcon: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    resultContent: {
      flex: 1,
    },
    resultTitle: {
      fontWeight: '600',
      marginBottom: 2,
    },
    resultSubtitle: {
      fontSize: 12,
    },
    resultAmount: {
      fontWeight: '700',
    },
    resultDate: {
      fontSize: 11,
      marginTop: 2,
    },
    
    // 空状态
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: Spacing['4xl'],
    },
    emptyIcon: {
      marginBottom: Spacing.md,
    },
    emptyText: {
      textAlign: 'center',
    },
    
    // 搜索建议
    suggestionsContainer: {
      padding: Spacing.lg,
    },
    suggestionsTitle: {
      marginBottom: Spacing.md,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      gap: Spacing.md,
    },
    suggestionText: {
      color: theme.textSecondary,
    },
  });
};

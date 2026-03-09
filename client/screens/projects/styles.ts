import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.lg,
    },
    backButton: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.sm,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing['5xl'],
      flexGrow: 1,
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0px 4px 12px rgba(79, 70, 229, 0.15)',
    },
    listContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing['5xl'],
      flexGrow: 1,
    },
    projectCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
    },
    projectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.sm,
    },
    projectBody: {
      marginTop: Spacing.sm,
    },
    projectTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: Spacing.sm,
      minWidth: 0,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: Spacing.sm,
      flexShrink: 0,
    },
    projectName: {
      flex: 1,
      marginRight: Spacing.sm,
      minWidth: 0,
    },
    statusText: {
      marginLeft: Spacing.sm,
      flexShrink: 0,
    },
    projectDescription: {
      marginBottom: Spacing.sm,
      lineHeight: 20,
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
      marginLeft: Spacing.sm,
      flexShrink: 0,
    },
    priorityText: {
      fontSize: 11,
    },
    editButton: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: Spacing.sm,
      flexShrink: 0,
      zIndex: 1,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    progressBar: {
      flex: 1,
      height: 6,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 3,
      marginRight: Spacing.sm,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressLabel: {
      fontSize: 11,
      minWidth: 35,
      textAlign: 'right',
    },
    projectTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    metaItem: {
      flex: 1,
    },
    metaText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    editIconButton: {
      padding: Spacing.sm,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    projectInfo: {
      gap: Spacing.xs,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    infoItem: {
      flex: 1,
      alignItems: 'flex-start',
    },
    infoValue: {
      marginTop: 2,
    },
    tagsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: Spacing.xs,
    },
    tagBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
      marginRight: Spacing.sm,
      marginBottom: 4,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: Spacing['6xl'],
    },
    emptyIcon: {
      marginBottom: Spacing.lg,
      opacity: 0.5,
    },
    emptyText: {
      marginBottom: Spacing.sm,
    },
    emptyHint: {
      textAlign: 'center',
    },
    infoCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
    },
    detailProjectName: {
      marginBottom: Spacing.sm,
    },
    projectMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
    },
    statusBadgeText: {
      fontSize: 12,
    },
    statsCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
    },
    statsTitle: {
      marginBottom: Spacing.md,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      marginTop: 4,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    emptyCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing['2xl'],
      alignItems: 'center',
      boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
    },
    transactionCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
    },
    transactionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    transactionTypeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    transactionTypeBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
    },
    transactionTypeText: {
      fontSize: 11,
    },
    transactionAmount: {
      fontWeight: '600',
    },
    transactionDescription: {
      marginBottom: Spacing.xs,
      lineHeight: 20,
    },
    transactionFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    fab: {
      position: 'absolute',
      right: Spacing.lg,
      bottom: Spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0px 4px 12px rgba(79, 70, 229, 0.3)',
    },
    // 表单样式
    saveButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.primary,
    },
    formCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
    },
    formTitle: {
      marginBottom: Spacing.lg,
    },
    formField: {
      marginBottom: Spacing.xl,
    },
    fieldLabel: {
      marginBottom: Spacing.sm,
    },
    input: {
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: 16,
      minHeight: 44,
    },
    textArea: {
      minHeight: 80,
      paddingTop: Spacing.md,
      textAlignVertical: 'top',
    },
    statusContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    statusOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
    },
    statusOptionSelected: {
      backgroundColor: theme.primary,
    },
    statusRadio: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: theme.border,
      marginRight: Spacing.sm,
    },
    statusRadioSelected: {
      backgroundColor: '#FFFFFF',
      borderColor: '#FFFFFF',
    },
    statusLabel: {
      fontSize: 14,
    },
    // 支出分类统计样式
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
  });
};

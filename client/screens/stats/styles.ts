import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: Spacing.lg,
      gap: Spacing.lg,
    },
    headerCard: {
      padding: Spacing.xl,
      borderRadius: BorderRadius.lg,
      gap: Spacing.lg,
    },
    headerTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.sm,
    },
    exportButtonText: {
      fontSize: 12,
    },
    monthSelector: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.xl,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.md,
      padding: Spacing.xs,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      borderRadius: BorderRadius.sm,
    },
    tabActive: {
      backgroundColor: theme.primary,
    },
    listContent: {
      gap: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    emptyState: {
      padding: Spacing['3xl'],
      alignItems: 'center',
      borderRadius: BorderRadius.md,
    },
    totalCard: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      gap: Spacing.xs,
    },
    statCard: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
    },
    statContent: {
      flex: 1,
      gap: Spacing.sm,
    },
    statNameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    workersDetail: {
      gap: Spacing.xs,
    },
    workerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    workerName: {
      flex: 1,
    },
    workRecordsDetail: {
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
    workRecordRow: {
      backgroundColor: theme.backgroundTertiary,
      padding: Spacing.sm,
      borderRadius: BorderRadius.sm,
      gap: Spacing.xs,
    },
    workRecordHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    recordDate: {
      flex: 1,
    },
    workRecordProject: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    recordProjectName: {
      flex: 1,
    },
    recordDesc: {
      lineHeight: 16,
      marginTop: Spacing.xs,
    },
    moreText: {
      marginTop: Spacing.xs,
      fontStyle: 'italic',
    },
    statHours: {
      alignItems: 'flex-end',
      gap: Spacing.xs,
    },
  });
};

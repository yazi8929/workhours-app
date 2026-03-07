import { StyleSheet } from 'react-native';
import { Theme } from '@/hooks/useTheme';

export const createStyles = (theme: Theme) => 
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    
    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 16,
      gap: 12,
    },
    
    // 模式切换
    modeSwitch: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 8,
      padding: 4,
      marginTop: 12,
    },
    
    modeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      gap: 6,
    },
    
    modeButtonActive: {
      backgroundColor: theme.primary,
    },
    
    // Header Actions
    headerActions: {
      flexDirection: 'column',
      gap: 12,
      alignItems: 'flex-end',
    },
    
    iconButton: {
      padding: 8,
    },
    
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundSecondary,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    
    // List
    list: {
      flex: 1,
      padding: 16,
    },
    
    // Empty State
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 48,
    },
    
    // Total Card
    totalCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      marginBottom: 16,
      borderRadius: 12,
    },
    
    // 统计分组卡片
    statsGroup: {
      marginBottom: 12,
      borderRadius: 12,
      overflow: 'hidden',
    },
    
    // 统计头部（可点击）
    statsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.backgroundSecondary,
    },
    
    statsHeaderLeft: {
      flex: 1,
      gap: 4,
    },
    
    statsHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    
    // 详细记录区域
    statsDetails: {
      padding: 12,
      gap: 12,
      backgroundColor: theme.backgroundRoot,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    
    // 单条记录
    recordItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 8,
      gap: 12,
    },
    
    recordLeft: {
      flex: 1,
      gap: 4,
    },
    
    recordDesc: {
      marginTop: 4,
      lineHeight: 18,
    },
    
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    
    modalContent: {
      width: '100%',
      maxWidth: 400,
      borderRadius: 16,
      overflow: 'hidden',
    },
    
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    
    modalBody: {
      padding: 16,
    },
    
    dataAction: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      marginBottom: 12,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
    },
    
    dataActionText: {
      marginLeft: 12,
      flex: 1,
    },
  });

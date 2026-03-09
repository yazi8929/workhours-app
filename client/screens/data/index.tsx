import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Share, Platform, Text, Button, Modal } from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { ProjectStorage, TransactionStorage, ExpenseCategoryStorage, ExportUtils, PaymentRecordStorage, InvoiceRecordStorage } from '@/utils/storage';
import { formatDateTime } from '@/utils/helpers';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { CustomAlert } from '@/components/CustomAlert';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';
import { Project, PaymentRecord, InvoiceRecord } from '@/types';

const PROJECTS_KEY = '@project_accounting_projects';
const TRANSACTIONS_KEY = '@project_accounting_transactions';

const DataAction = ({
  icon,
  title,
  description,
  color,
  onPress,
}: {
  icon: string;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.dataCard} onPress={onPress}>
    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
      <FontAwesome6 name={icon as any} size={28} color={color} />
    </View>
    <View style={styles.dataInfo}>
      <ThemedText variant="h4" color={stylesDataTheme.textPrimary} style={styles.dataTitle}>
        {title}
      </ThemedText>
      <ThemedText variant="body" color={stylesDataTheme.textMuted}>
        {description}
      </ThemedText>
    </View>
    <FontAwesome6 name="chevron-right" size={16} color={stylesDataTheme.textMuted} />
  </TouchableOpacity>
);

let stylesDataTheme: Theme;

function createStyles(theme: Theme) {
  stylesDataTheme = theme;
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.lg,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing['5xl'],
      flexGrow: 1,
    },
    section: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      boxShadow: '0px 2px 8px rgba(79, 70, 229, 0.08)',
    },
    sectionTitle: {
      marginBottom: Spacing.md,
    },
    dataCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    dataInfo: {
      flex: 1,
    },
    dataTitle: {
      marginBottom: 2,
    },
    recordItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    recordInfo: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    dangerSection: {
      borderWidth: 1,
      borderColor: theme.error + '30',
    },
    dangerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.error + '10',
      marginBottom: Spacing.sm,
      minHeight: 48,
    },
    dangerButtonText: {
      marginLeft: Spacing.sm,
      fontWeight: '600',
    },
    dangerHint: {
      textAlign: 'center',
    },
    projectSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.md,
    },
    recordSubTitle: {
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
    },
    recordDetail: {
      paddingVertical: Spacing.md,
      borderBottomColor: theme.borderLight,
    },
    recordDetailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
  });
}

const styles = createStyles({} as any);

export default function DataScreen() {
  const { theme, isDark } = useTheme();
  const localStyles = useMemo(() => createStyles(theme), [theme]);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    buttons: {
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }[];
  }>({ title: '', message: '', buttons: [] });

  // 项目记录相关状态
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectPaymentRecords, setProjectPaymentRecords] = useState<PaymentRecord[]>([]);
  const [projectInvoiceRecords, setProjectInvoiceRecords] = useState<InvoiceRecord[]>([]);
  const [projectSelectorVisible, setProjectSelectorVisible] = useState(false);

  const showCustomAlert = (
    title: string,
    message: string,
    buttons: {
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }[]
  ) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  // 加载项目列表
  const loadProjects = async () => {
    const allProjects = await ProjectStorage.getAll();
    setProjects(allProjects);
  };

  // 加载选中项目的记录
  const loadProjectRecords = async (projectId: string | null) => {
    if (!projectId) {
      setProjectPaymentRecords([]);
      setProjectInvoiceRecords([]);
      return;
    }

    const paymentRecords = await PaymentRecordStorage.getByProjectId(projectId);
    const invoiceRecords = await InvoiceRecordStorage.getByProjectId(projectId);

    // 按创建时间倒序排列
    paymentRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    invoiceRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setProjectPaymentRecords(paymentRecords);
    setProjectInvoiceRecords(invoiceRecords);
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setProjectSelectorVisible(false);
  };

  // 当选中的项目改变时，加载对应的记录
  React.useEffect(() => {
    loadProjectRecords(selectedProjectId);
  }, [selectedProjectId]);

  // 每次页面获得焦点时重新加载项目列表
  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const handleExport = async () => {
    try {
      const data = await ExportUtils.exportData();
      const fileName = `project-accounting-${new Date().toISOString().slice(0, 10)}.json`;
      const fileUri = (FileSystem as any).documentDirectory + fileName;

      await (FileSystem as any).writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));

      if (Platform.OS === 'android') {
        const permissions = await (FileSystem as any).StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const directoryUri = permissions.directoryUri;
          const fileUri2 = await (FileSystem as any).StorageAccessFramework.createFileAsync(
            directoryUri,
            fileName,
            'application/json'
          );
          await (FileSystem as any).writeAsStringAsync(fileUri2, JSON.stringify(data, null, 2));
          Alert.alert('导出成功', `文件已保存至：${fileName}`);
        }
      } else {
        await Share.share({
          url: fileUri,
          message: '项目记账数据导出',
        });
      }
    } catch (error) {
      console.error('导出失败:', error);
      Alert.alert('导出失败', '请重试或检查权限设置');
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileContent = await (FileSystem as any).readAsStringAsync(fileUri);
      const data = JSON.parse(fileContent);

      Alert.alert(
        '确认导入',
        '导入将覆盖现有数据，是否继续？',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '导入',
            style: 'destructive',
            onPress: async () => {
              const success = await ExportUtils.importData(data);
              if (success) {
                Alert.alert('导入成功', '数据已成功导入');
              } else {
                Alert.alert('导入失败', '数据格式不正确或导入出错');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('导入失败:', error);
      Alert.alert('导入失败', '请选择有效的 JSON 文件');
    }
  };

  const handleClearCompletedProjects = async () => {
    try {
      // 获取所有项目
      const allProjects = await ProjectStorage.getAll();
      const completedProjects = allProjects.filter(p => p.status === 'completed');

      if (completedProjects.length === 0) {
        showCustomAlert('提示', '没有已完成的项目需要清除', [
          { text: '确定', style: 'default' }
        ]);
        return;
      }

      // 获取所有交易记录
      const allTransactions = await TransactionStorage.getAll();
      const completedProjectIds = completedProjects.map(p => p.id);

      // 删除已完成项目的所有相关记录
      for (const projectId of completedProjectIds) {
        await PaymentRecordStorage.deleteByProjectId(projectId);
        await InvoiceRecordStorage.deleteByProjectId(projectId);
      }

      // 筛选出需要保留的交易记录（不属于已完成项目的）
      const transactionsToKeep = allTransactions.filter(
        t => !completedProjectIds.includes(t.projectId)
      );

      // 筛选出需要保留的项目（非已完成状态）
      const projectsToKeep = allProjects.filter(p => p.status !== 'completed');

      // 更新存储
      await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projectsToKeep));
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactionsToKeep));

      showCustomAlert(
        '清除成功',
        `已清除 ${completedProjects.length} 个已完成项目及其相关支出记录`,
        [{ text: '确定', style: 'default' }]
      );
    } catch (error) {
      console.error('清除已完成项目失败:', error);
      showCustomAlert('清除失败', '请重试', [
        { text: '确定', style: 'default' }
      ]);
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ThemedView level="root" style={localStyles.container}>
        <View style={localStyles.header}>
          <ThemedText variant="h2" color={theme.textPrimary}>数据管理</ThemedText>
        </View>

        <ScrollView contentContainerStyle={localStyles.scrollContent}>
          <ThemedView level="default" style={localStyles.section}>
            <ThemedText variant="h4" color={theme.textSecondary} style={localStyles.sectionTitle}>
              数据操作
            </ThemedText>

            <DataAction
              icon="download"
              title="导出数据"
              description="将所有项目和交易记录导出为 JSON 文件"
              color={theme.primary}
              onPress={handleExport}
            />

            <DataAction
              icon="upload"
              title="导入数据"
              description="从 JSON 文件导入数据（将覆盖现有数据）"
              color={theme.success}
              onPress={handleImport}
            />
          </ThemedView>

          {/* 项目记录详细查询 */}
          <ThemedView level="default" style={localStyles.section}>
            <ThemedText variant="h4" color={theme.textSecondary} style={localStyles.sectionTitle}>
              开票收款记录
            </ThemedText>

            {/* 项目选择器 */}
            <TouchableOpacity
              style={[localStyles.projectSelector, { backgroundColor: theme.backgroundTertiary }]}
              onPress={() => setProjectSelectorVisible(true)}
            >
              <ThemedText variant="body" color={selectedProjectId ? theme.textPrimary : theme.textMuted}>
                {selectedProjectId
                  ? projects.find(p => p.id === selectedProjectId)?.name || '选择项目'
                  : '选择项目查看记录'
                }
              </ThemedText>
              <FontAwesome6 name="chevron-down" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            {/* 收款记录列表 */}
            {selectedProjectId && (
              <>
                <ThemedText variant="caption" color={theme.textSecondary} style={localStyles.recordSubTitle}>
                  收款记录 ({projectPaymentRecords.length})
                </ThemedText>
                {projectPaymentRecords.length > 0 ? (
                  projectPaymentRecords.map((record, index) => (
                    <View key={record.id} style={[localStyles.recordDetail, { borderBottomWidth: index === projectPaymentRecords.length - 1 ? 0 : 1 }]}>
                      <View style={localStyles.recordDetailHeader}>
                        <FontAwesome6 name="wallet" size={16} color={theme.success} />
                        <ThemedText variant="body" color={theme.textPrimary} style={{ fontWeight: '600' }}>
                          ¥{record.amount.toLocaleString()}
                        </ThemedText>
                      </View>
                      <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: 4 }}>
                        {formatDateTime(record.createdAt)}
                      </ThemedText>
                    </View>
                  ))
                ) : (
                  <ThemedText variant="caption" color={theme.textMuted} style={{ paddingVertical: Spacing.md }}>
                    暂无收款记录
                  </ThemedText>
                )}

                {/* 开票记录列表 */}
                <ThemedText variant="caption" color={theme.textSecondary} style={[localStyles.recordSubTitle, { marginTop: Spacing.lg }]}>
                  开票记录 ({projectInvoiceRecords.length})
                </ThemedText>
                {projectInvoiceRecords.length > 0 ? (
                  projectInvoiceRecords.map((record, index) => (
                    <View key={record.id} style={[localStyles.recordDetail, { borderBottomWidth: index === projectInvoiceRecords.length - 1 ? 0 : 1 }]}>
                      <View style={localStyles.recordDetailHeader}>
                        <FontAwesome6 name="file-invoice" size={16} color={theme.error} />
                        <ThemedText variant="body" color={theme.textPrimary} style={{ fontWeight: '600' }}>
                          ¥{record.amount.toLocaleString()}
                        </ThemedText>
                      </View>
                      <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: 4 }}>
                        {formatDateTime(record.createdAt)}
                      </ThemedText>
                    </View>
                  ))
                ) : (
                  <ThemedText variant="caption" color={theme.textMuted} style={{ paddingVertical: Spacing.md }}>
                    暂无开票记录
                  </ThemedText>
                )}
              </>
            )}
          </ThemedView>

          <View style={{ height: Spacing['5xl'] }} />

        {/* 数据清理区域 */}
        <View style={[localStyles.section, localStyles.dangerSection, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText variant="h4" color={theme.textSecondary} style={localStyles.sectionTitle}>
            数据清理
          </ThemedText>

          {/* 安全清空按钮 - 清除已完成项目 */}
          <View style={{ marginBottom: Spacing.md, backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, borderWidth: 2, borderColor: '#4CAF50' }}>
            <Text style={{ fontSize: 14, color: '#2E7D32', marginBottom: 8, fontWeight: 'bold' }}>✅ 安全清空功能</Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#4CAF50',
                paddingVertical: 15,
                paddingHorizontal: 20,
                borderRadius: 8,
                alignItems: 'center',
                minHeight: 50,
                flexDirection: 'row',
                justifyContent: 'center',
              }}
              onPress={handleClearCompletedProjects}
              activeOpacity={0.7}
            >
              <FontAwesome6 name="check" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>清除已完成项目</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: '#2E7D32', marginTop: 8, textAlign: 'center' }}>
              只清除已完成的项目和相关支出，保留进行中和已暂停的项目
            </Text>
          </View>
        </View>
        </ScrollView>
      </ThemedView>

      {/* 自定义 Alert Modal */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />

      {/* 项目选择器 Modal */}
      <Modal visible={projectSelectorVisible} transparent animationType="slide">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setProjectSelectorVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: theme.backgroundDefault, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
                <ThemedText variant="h4" color={theme.textPrimary}>选择项目</ThemedText>
                <TouchableOpacity onPress={() => setProjectSelectorVisible(false)}>
                  <FontAwesome6 name="xmark" size={24} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 400 }}>
                {projects.length > 0 ? (
                  projects.map(project => (
                    <TouchableOpacity
                      key={project.id}
                      style={{
                        paddingVertical: Spacing.md,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.borderLight,
                      }}
                      onPress={() => handleProjectSelect(project.id)}
                    >
                      <ThemedText variant="body" color={selectedProjectId === project.id ? theme.primary : theme.textPrimary}>
                        {project.name}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        已收款: ¥{project.receivedAmount.toLocaleString()} · 已开票: ¥{project.invoiceAmount.toLocaleString()}
                      </ThemedText>
                    </TouchableOpacity>
                  ))
                ) : (
                  <ThemedText variant="body" color={theme.textMuted} style={{ textAlign: 'center', paddingVertical: Spacing.xl }}>
                    暂无项目
                  </ThemedText>
                )}
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

import { StyleSheet } from 'react-native';

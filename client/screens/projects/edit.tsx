import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Project, ProjectStatus, InvoiceStatus } from '@/types';
import { ProjectStatusNames, InvoiceStatusNames } from '@/types';
import { ProjectStorage, PaymentRecordStorage, InvoiceRecordStorage } from '@/utils/storage';
import { formatDate, normalizeDateString } from '@/utils/helpers';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles';

const StatusOption = ({ value, label, status, onPress }: { value: ProjectStatus; label: string; status: ProjectStatus; onPress: (value: ProjectStatus) => void }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity
      style={[styles.statusOption, status === value && styles.statusOptionSelected]}
      onPress={() => onPress(value)}
    >
      <View style={[styles.statusRadio, status === value && styles.statusRadioSelected]} />
      <ThemedText
        variant="body"
        color={status === value ? theme.buttonPrimaryText : theme.textSecondary}
        style={styles.statusLabel}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
};

const InvoiceStatusOption = ({ value, label, status, onPress }: { value: InvoiceStatus; label: string; status: InvoiceStatus; onPress: (value: InvoiceStatus) => void }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity
      style={[styles.statusOption, status === value && styles.statusOptionSelected]}
      onPress={() => onPress(value)}
    >
      <View style={[styles.statusRadio, status === value && styles.statusRadioSelected]} />
      <ThemedText
        variant="body"
        color={status === value ? theme.buttonPrimaryText : theme.textSecondary}
        style={styles.statusLabel}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
};

// 辅助函数：验证日期字符串并返回有效的 Date 对象
// 辅助函数：验证日期字符串格式 (YYYY-MM-DD)
const isValidDateString = (dateString: string | undefined): boolean => {
  if (!dateString) return true; // 空值是有效的
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export default function EditProjectScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: string }>();
  const routerRef = useRef(router);

  console.log('EditProjectScreen - 收到的路由参数 id:', id);

  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [manager, setManager] = useState('');
  const [endDate, setEndDate] = useState('');
  const [settlementAmount, setSettlementAmount] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>('none');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');

  useEffect(() => {
    async function loadProject() {
      if (!id) return;

      console.log('开始加载项目，id:', id);

      const projectData = await ProjectStorage.getById(id);
      console.log('从 storage 获取到的项目数据:', JSON.stringify(projectData, null, 2));

      if (!projectData) {
        alert('项目不存在');
        routerRef.current.back();
        return;
      }

      setProject(projectData);
      setName(projectData.name);
      setDescription(projectData.description ?? '');
      setManager(projectData.manager ?? '');
      setEndDate(projectData.endDate ?? '');
      setSettlementAmount(projectData.settlementAmount?.toString() ?? '');
      setContractAmount(projectData.contractAmount?.toString() ?? '');
      setReceivedAmount(projectData.receivedAmount.toString());
      setInvoiceStatus(projectData.invoiceStatus ?? 'none');
      setInvoiceAmount(projectData.invoiceAmount?.toString() ?? '0');
      setStatus(projectData.status);

      console.log('项目数据已加载到表单状态');
    }
    loadProject();
  }, [id]); // 只依赖 id，移除 router 依赖

  const handleSave = useCallback(async () => {
    console.log('handleSave 被调用');
    console.log('当前 project:', project);
    console.log('当前表单数据:', { name, description, manager, endDate, settlementAmount, contractAmount, receivedAmount, invoiceStatus, invoiceAmount, status });

    if (!project) {
      console.log('project 为空，无法保存');
      return;
    }

    if (!name.trim()) {
      alert('请输入项目名称');
      return;
    }

    const receivedAmountValue = parseFloat(receivedAmount);
    if (isNaN(receivedAmountValue) || receivedAmountValue < 0) {
      alert('请输入有效的已收款金额');
      return;
    }

    const invoiceAmountValue = parseFloat(invoiceAmount);
    if (isNaN(invoiceAmountValue) || invoiceAmountValue < 0) {
      alert('请输入有效的开票金额');
      return;
    }

    // 检查收款金额是否变化
    const receivedAmountChanged = receivedAmountValue !== project.receivedAmount;

    // 检查开票金额是否变化
    const invoiceAmountChanged = invoiceAmountValue !== project.invoiceAmount;

    const updatedProject: Project = {
      ...project,
      name: name.trim(),
      description: description.trim() || undefined,
      manager: manager.trim() || undefined,
      endDate: normalizeDateString(endDate) || undefined,
      contractAmount: contractAmount.trim() ? parseFloat(contractAmount) : undefined,
      receivedAmount: receivedAmountValue,
      settlementAmount: settlementAmount.trim() ? parseFloat(settlementAmount) : undefined,
      invoiceStatus,
      invoiceAmount: invoiceAmountValue,
      status,
      updatedAt: new Date().toISOString(),
    };

    console.log('准备保存项目:', JSON.stringify(updatedProject, null, 2));

    const success = await ProjectStorage.save(updatedProject);
    console.log('保存结果:', success);

    if (success) {
      // 如果收款金额增加，创建新的收款记录
      if (receivedAmountChanged && receivedAmountValue > project.receivedAmount) {
        const paymentAmount = receivedAmountValue - project.receivedAmount;
        await PaymentRecordStorage.save({
          id: `payment-${Date.now()}`,
          projectId: project.id,
          projectName: project.name,
          amount: paymentAmount,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
        console.log('创建收款记录:', paymentAmount);
      }

      // 如果开票金额增加，创建新的开票记录
      if (invoiceAmountChanged && invoiceAmountValue > project.invoiceAmount) {
        const invoiceAmountDiff = invoiceAmountValue - project.invoiceAmount;
        await InvoiceRecordStorage.save({
          id: `invoice-${Date.now()}`,
          projectId: project.id,
          projectName: project.name,
          amount: invoiceAmountDiff,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
        console.log('创建开票记录:', invoiceAmountDiff);
      }

      routerRef.current.back();
    } else {
      alert('保存失败，请重试');
    }
  }, [project, name, description, manager, endDate, settlementAmount, contractAmount, receivedAmount, invoiceStatus, invoiceAmount, status]); // 移除 router 依赖

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

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ThemedView level="root" style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h3" color={theme.textPrimary} style={styles.headerTitle}>
            编辑项目
          </ThemedText>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <ThemedText variant="body" color={theme.buttonPrimaryText}>保存</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 基本信息 */}
          <ThemedView level="default" style={styles.formCard}>
            <ThemedText variant="h4" color={theme.textSecondary} style={styles.formTitle}>
              基本信息
            </ThemedText>

            <View style={styles.formField}>
              <ThemedText variant="body" color={theme.textPrimary} style={styles.fieldLabel}>
                项目名称 <ThemedText style={{ color: theme.error }}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                placeholder="请输入项目名称"
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.formField}>
              <ThemedText variant="body" color={theme.textPrimary} style={styles.fieldLabel}>
                项目描述
              </ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                placeholder="请输入项目描述（可选）"
                placeholderTextColor={theme.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formField}>
              <ThemedText variant="body" color={theme.textPrimary} style={styles.fieldLabel}>
                项目负责人
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                placeholder="请输入负责人姓名"
                placeholderTextColor={theme.textMuted}
                value={manager}
                onChangeText={setManager}
              />
            </View>

            <View style={styles.formField}>
              <ThemedText variant="body" color={theme.textPrimary} style={styles.fieldLabel}>
                项目状态
              </ThemedText>
              <View style={styles.statusContainer}>
                {(Object.keys(ProjectStatusNames) as ProjectStatus[]).map((key) => (
                  <StatusOption 
                    key={key} 
                    value={key} 
                    label={ProjectStatusNames[key]} 
                    status={status}
                    onPress={setStatus}
                  />
                ))}
              </View>
            </View>
          </ThemedView>

          {/* 财务信息 */}
          <ThemedView level="default" style={styles.formCard}>
            <ThemedText variant="h4" color={theme.textSecondary} style={styles.formTitle}>
              财务信息
            </ThemedText>

            <View style={styles.formField}>
              <ThemedText variant="body" color={theme.textPrimary} style={styles.fieldLabel}>
                合同金额（元）
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                placeholder="请输入合同金额"
                placeholderTextColor={theme.textMuted}
                value={contractAmount}
                onChangeText={setContractAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formField}>
              <ThemedText variant="body" color={theme.textPrimary} style={styles.fieldLabel}>
                结算金额（元）
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                placeholder="请输入结算金额"
                placeholderTextColor={theme.textMuted}
                value={settlementAmount}
                onChangeText={setSettlementAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formField}>
              <ThemedText variant="body" color={theme.textPrimary} style={styles.fieldLabel}>
                已收款金额（元）<ThemedText style={{ color: theme.error }}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                placeholder="请输入已收款金额"
                placeholderTextColor={theme.textMuted}
                value={receivedAmount}
                onChangeText={setReceivedAmount}
                keyboardType="decimal-pad"
              />
            </View>
          </ThemedView>

          {/* 开票信息 */}
          <ThemedView level="default" style={styles.formCard}>
            <ThemedText variant="h4" color={theme.textSecondary} style={styles.formTitle}>
              开票信息
            </ThemedText>

            <View style={styles.formField}>
              <ThemedText variant="body" color={theme.textPrimary} style={styles.fieldLabel}>
                开票状态
              </ThemedText>
              <View style={styles.statusContainer}>
                {(Object.keys(InvoiceStatusNames) as InvoiceStatus[]).map((key) => (
                  <InvoiceStatusOption 
                    key={key} 
                    value={key} 
                    label={InvoiceStatusNames[key]} 
                    status={invoiceStatus}
                    onPress={setInvoiceStatus}
                  />
                ))}
              </View>
            </View>

            <View style={styles.formField}>
              <ThemedText variant="body" color={theme.textPrimary} style={styles.fieldLabel}>
                已开票金额（元）
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                placeholder="请输入已开票金额"
                placeholderTextColor={theme.textMuted}
                value={invoiceAmount}
                onChangeText={setInvoiceAmount}
                keyboardType="decimal-pad"
              />
            </View>
          </ThemedView>

          {/* 时间规划 */}
          <ThemedView level="default" style={styles.formCard}>
            <ThemedText variant="h4" color={theme.textSecondary} style={styles.formTitle}>
              时间规划
            </ThemedText>

            <View style={styles.formField}>
              <ThemedText variant="body" color={theme.textPrimary} style={styles.fieldLabel}>
                预计完成日期
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textMuted}
                value={endDate}
                onChangeText={setEndDate}
                maxLength={10}
              />
            </View>
          </ThemedView>

          <View style={{ height: Spacing['2xl'] }} />
        </ScrollView>
      </ThemedView>
    </Screen>
  );
}

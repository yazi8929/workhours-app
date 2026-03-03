import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
  Modal,
  Text,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';
import { projectService, workerService, workLogService, type Project, type Worker, type WorkLog, type WorkerHours } from '@/services/LocalStorage';

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  // 表单状态
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedWorkers, setSelectedWorkers] = useState<Map<string, number>>(new Map());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null);

  // 数据状态
  const [projects, setProjects] = useState<Project[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal 状态
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // 编辑表单状态
  const [editProject, setEditProject] = useState<string>('');
  const [editWorkers, setEditWorkers] = useState<Map<string, number>>(new Map());
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editDescription, setEditDescription] = useState('');

  // 加载项目列表
  const fetchProjects = useCallback(async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('获取项目列表失败:', error);
      Alert.alert('错误', '获取项目列表失败');
    }
  }, []);

  // 加载人员列表
  const fetchWorkers = useCallback(async () => {
    try {
      const data = await workerService.getWorkers();
      setWorkers(data);
    } catch (error) {
      console.error('获取人员列表失败:', error);
      Alert.alert('错误', '获取人员列表失败');
    }
  }, []);

  // 加载工时记录
  const fetchWorkLogs = useCallback(async () => {
    try {
      const data = await workLogService.getWorkLogs();
      setWorkLogs(data);
    } catch (error) {
      console.error('获取工时记录失败:', error);
    }
  }, []);

  // 页面聚焦时加载数据
  useFocusEffect(
    useCallback(() => {
      fetchProjects();
      fetchWorkers();
      fetchWorkLogs();
    }, [fetchProjects, fetchWorkers, fetchWorkLogs])
  );

  // 选择项目
  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId);
    setShowProjectModal(false);
  };

  // 清空表单
  const handleClearForm = useCallback(() => {
    setSelectedProject('');
    setSelectedWorkers(new Map());
    setSelectedDate(new Date());
    setDescription('');
  }, []);

  // 提交工时记录
  const handleSubmit = useCallback(async () => {
    if (!selectedProject) {
      Alert.alert('提示', '请选择项目');
      return;
    }

    if (selectedWorkers.size === 0) {
      Alert.alert('提示', '请至少选择一个人员');
      return;
    }

    if (!description.trim()) {
      Alert.alert('提示', '请填写工作内容');
      return;
    }

    setLoading(true);

    try {
      const project = projects.find(p => p.id === selectedProject);
      const workersArray: WorkerHours[] = Array.from(selectedWorkers.entries()).map(([id, hours]) => ({
        id,
        hours,
      }));

      await workLogService.createWorkLog(
        selectedProject,
        project?.name || '未知',
        selectedDate.toISOString().split('T')[0],
        description,
        workersArray
      );

      Alert.alert('成功', '工时记录已添加');
      handleClearForm();
      fetchWorkLogs();
    } catch (error: any) {
      console.error('提交失败:', error);
      Alert.alert('错误', error.message || '提交失败');
    } finally {
      setLoading(false);
    }
  }, [selectedProject, selectedWorkers, selectedDate, description, projects, fetchWorkLogs, handleClearForm]);

  // 切换人员选择
  const toggleWorker = useCallback((workerId: string) => {
    setSelectedWorkers(prev => {
      const newSelected = new Map(prev);
      if (newSelected.has(workerId)) {
        newSelected.delete(workerId);
      } else {
        newSelected.set(workerId, 1); // 默认1天
      }
      return newSelected;
    });
  }, []);

  // 切换工时数量（0.5天 <-> 1天）
  const toggleWorkerHours = useCallback((workerId: string) => {
    setSelectedWorkers(prev => {
      const newSelected = new Map(prev);
      const currentHours = newSelected.get(workerId) || 1;
      newSelected.set(workerId, currentHours === 1 ? 0.5 : 1);
      return newSelected;
    });
  }, []);

  // 编辑工时记录
  const handleEditWorkLog = useCallback((workLog: WorkLog) => {
    setEditingWorkLog(workLog);
    setEditProject(workLog.projectId);
    setEditWorkers(new Map(workLog.workers.map(w => [w.id, w.hours])));
    setEditDate(new Date(workLog.date));
    setEditDescription(workLog.description);
    setShowEditModal(true);
  }, []);

  // 保存编辑
  const handleSaveEdit = useCallback(async () => {
    if (!editProject) {
      Alert.alert('提示', '请选择项目');
      return;
    }

    if (editWorkers.size === 0) {
      Alert.alert('提示', '请至少选择一个人员');
      return;
    }

    if (!editDescription.trim()) {
      Alert.alert('提示', '请填写工作内容');
      return;
    }

    if (!editingWorkLog) {
      return;
    }

    setLoading(true);

    try {
      const project = projects.find(p => p.id === editProject);
      const workersArray: WorkerHours[] = Array.from(editWorkers.entries()).map(([id, hours]) => ({
        id,
        hours,
      }));

      await workLogService.updateWorkLog(
        editingWorkLog.id,
        editProject,
        project?.name || '未知',
        editDate.toISOString().split('T')[0],
        editDescription,
        workersArray
      );

      Alert.alert('成功', '工时记录已更新');
      setShowEditModal(false);
      setEditingWorkLog(null);
      fetchWorkLogs();
    } catch (error: any) {
      console.error('保存失败:', error);
      Alert.alert('错误', error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  }, [editProject, editWorkers, editDate, editDescription, editingWorkLog, projects, fetchWorkLogs]);

  // 切换编辑表单人员选择
  const toggleEditWorker = useCallback((workerId: string) => {
    setEditWorkers(prev => {
      const newSelected = new Map(prev);
      if (newSelected.has(workerId)) {
        newSelected.delete(workerId);
      } else {
        newSelected.set(workerId, 1); // 默认1天
      }
      return newSelected;
    });
  }, []);

  // 切换编辑表单工时数量（0.5天 <-> 1天）
  const toggleEditWorkerHours = useCallback((workerId: string) => {
    setEditWorkers(prev => {
      const newSelected = new Map(prev);
      const currentHours = newSelected.get(workerId) || 1;
      newSelected.set(workerId, currentHours === 1 ? 0.5 : 1);
      return newSelected;
    });
  }, []);

  // 删除工时记录
  const handleDeleteWorkLog = useCallback((id: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这条工时记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await workLogService.deleteWorkLog(id);
              Alert.alert('成功', '工时记录已删除');
              fetchWorkLogs();
            } catch (error) {
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  }, [fetchWorkLogs]);

  // 获取项目名称
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || '未知项目';
  };

  // 获取人员名称
  const getWorkerNames = (workerList: WorkerHours[]) => {
    return workerList
      .map(w => {
        const worker = workers.find(wk => wk.id === w.id);
        return worker ? `${worker.name}(${w.hours}天)` : '未知';
      })
      .join(', ');
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView level="root" style={styles.header}>
            <ThemedText variant="h3" color={theme.textPrimary}>
              工时统计
            </ThemedText>
          </ThemedView>

          {/* 表单 */}
          <ThemedView level="default" style={styles.formContainer}>
            {/* 项目选择 */}
            <TouchableOpacity
              style={[styles.input, styles.inputWithIcon]}
              onPress={() => setShowProjectModal(true)}
            >
              <FontAwesome6 name="folder" size={20} color={theme.textMuted} />
              <ThemedText
                variant="body"
                color={selectedProject ? theme.textPrimary : theme.textMuted}
                style={styles.inputText}
              >
                {selectedProject ? getProjectName(selectedProject) : '选择项目'}
              </ThemedText>
              <FontAwesome6 name="chevron-right" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            {/* 日期选择 */}
            <TouchableOpacity
              style={[styles.input, styles.inputWithIcon]}
              onPress={() => setShowDatePicker(true)}
            >
              <FontAwesome6 name="calendar" size={20} color={theme.textMuted} />
              <ThemedText
                variant="body"
                color={theme.textPrimary}
                style={styles.inputText}
              >
                {selectedDate.toLocaleDateString('zh-CN')}
              </ThemedText>
              <FontAwesome6 name="chevron-right" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setSelectedDate(date);
                }}
              />
            )}

            {/* 人员选择 */}
            <ThemedView level="tertiary" style={styles.workerSelector}>
              <ThemedText variant="smallMedium" color={theme.textSecondary}>
                选择人员（点击切换工时）
              </ThemedText>
              {workers.map(worker => (
                <TouchableOpacity
                  key={worker.id}
                  style={[
                    styles.workerItem,
                    selectedWorkers.has(worker.id) && styles.workerItemSelected,
                  ]}
                  onPress={() => toggleWorker(worker.id)}
                >
                  <ThemedText
                    variant="body"
                    color={selectedWorkers.has(worker.id) ? theme.primary : theme.textPrimary}
                  >
                    {worker.name}
                  </ThemedText>
                  {selectedWorkers.has(worker.id) && (
                    <TouchableOpacity
                      style={styles.hoursToggle}
                      onPress={() => toggleWorkerHours(worker.id)}
                    >
                      <ThemedText variant="small" color={theme.primary}>
                        {selectedWorkers.get(worker.id)}天
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </ThemedView>

            {/* 工作内容 */}
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="工作内容"
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            {/* 操作按钮 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClearForm}
              >
                <ThemedText variant="smallMedium" color={theme.textMuted}>
                  清空
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>
                  {loading ? '提交中...' : '提交'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>

          {/* 工时记录列表 */}
          <ThemedView level="root" style={styles.section}>
            <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
              最近记录
            </ThemedText>
            {workLogs.map(log => (
              <ThemedView key={log.id} level="default" style={styles.logItem}>
                <View style={styles.logHeader}>
                  <ThemedText variant="small" color={theme.textMuted}>
                    {log.date}
                  </ThemedText>
                  <View style={styles.logActions}>
                    <TouchableOpacity onPress={() => handleEditWorkLog(log)}>
                      <FontAwesome6 name="pen" size={16} color={theme.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteWorkLog(log.id)}>
                      <FontAwesome6 name="trash" size={16} color={theme.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <ThemedText variant="body" color={theme.textPrimary} style={styles.logProject}>
                  {log.projectName}
                </ThemedText>
                <ThemedText variant="small" color={theme.textSecondary} style={styles.logDescription}>
                  {log.description}
                </ThemedText>
                <ThemedText variant="small" color={theme.primary}>
                  {getWorkerNames(log.workers)}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 项目选择 Modal */}
      <Modal visible={showProjectModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProjectModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="h4" color={theme.textPrimary}>
                选择项目
              </ThemedText>
              <TouchableOpacity onPress={() => setShowProjectModal(false)}>
                <FontAwesome6 name="xmark" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {projects.map(project => (
                <TouchableOpacity
                  key={project.id}
                  style={styles.modalItem}
                  onPress={() => handleSelectProject(project.id)}
                >
                  <ThemedText variant="body" color={theme.textPrimary}>
                    {project.name}
                  </ThemedText>
                  {selectedProject === project.id && (
                    <FontAwesome6 name="check" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 编辑 Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="h4" color={theme.textPrimary}>
                编辑工时
              </ThemedText>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <FontAwesome6 name="xmark" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <TouchableOpacity
                style={[styles.input, styles.inputWithIcon]}
                onPress={() => setShowProjectModal(true)}
              >
                <FontAwesome6 name="folder" size={20} color={theme.textMuted} />
                <ThemedText
                  variant="body"
                  color={editProject ? theme.textPrimary : theme.textMuted}
                  style={styles.inputText}
                >
                  {editProject ? getProjectName(editProject) : '选择项目'}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.input, styles.inputWithIcon]}
                onPress={() => setShowDatePicker(true)}
              >
                <FontAwesome6 name="calendar" size={20} color={theme.textMuted} />
                <ThemedText
                  variant="body"
                  color={theme.textPrimary}
                  style={styles.inputText}
                >
                  {editDate.toLocaleDateString('zh-CN')}
                </ThemedText>
              </TouchableOpacity>

              <ThemedView level="tertiary" style={styles.workerSelector}>
                {workers.map(worker => (
                  <TouchableOpacity
                    key={worker.id}
                    style={[
                      styles.workerItem,
                      editWorkers.has(worker.id) && styles.workerItemSelected,
                    ]}
                    onPress={() => toggleEditWorker(worker.id)}
                  >
                    <ThemedText
                      variant="body"
                      color={editWorkers.has(worker.id) ? theme.primary : theme.textPrimary}
                    >
                      {worker.name}
                    </ThemedText>
                    {editWorkers.has(worker.id) && (
                      <TouchableOpacity
                        style={styles.hoursToggle}
                        onPress={() => toggleEditWorkerHours(worker.id)}
                      >
                        <ThemedText variant="small" color={theme.primary}>
                          {editWorkers.get(worker.id)}天
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                ))}
              </ThemedView>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="工作内容"
                placeholderTextColor={theme.textMuted}
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                numberOfLines={3}
              />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <ThemedText variant="smallMedium" color={theme.textMuted}>
                  取消
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton, loading && styles.buttonDisabled]}
                onPress={handleSaveEdit}
                disabled={loading}
              >
                <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>
                  {loading ? '保存中...' : '保存'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

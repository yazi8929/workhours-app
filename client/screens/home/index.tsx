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

interface Project {
  id: string;
  name: string;
}

interface Worker {
  id: string;
  name: string;
}

interface WorkLog {
  id: string;
  projectId: string;
  projectName: string;
  date: string;
  description: string;
  workers: Array<{ id: string; name: string; hours: number }>;
  createdAt: string;
}

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
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/projects`);
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('获取项目列表失败:', error);
      Alert.alert('错误', '获取项目列表失败');
    }
  }, []);

  // 加载人员列表
  const fetchWorkers = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/workers`);
      const data = await response.json();
      setWorkers(data.workers || []);
    } catch (error) {
      console.error('获取人员列表失败:', error);
      Alert.alert('错误', '获取人员列表失败');
    }
  }, []);

  // 加载工时记录
  const fetchWorkLogs = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-logs`);
      const data = await response.json();
      setWorkLogs(data.workLogs || []);
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
      const workersArray = Array.from(selectedWorkers.entries()).map(([id, hours]) => ({
        id,
        hours,
      }));

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          date: selectedDate.toISOString().split('T')[0],
          description,
          workers: workersArray,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '提交失败');
      }

      Alert.alert('成功', '工时记录已添加');
      // 重置表单
      handleClearForm();
      // 刷新列表
      fetchWorkLogs();
    } catch (error: any) {
      console.error('提交失败:', error);
      Alert.alert('错误', error.message || '提交失败');
    } finally {
      setLoading(false);
    }
  }, [selectedProject, selectedWorkers, selectedDate, description, fetchWorkLogs, handleClearForm]);

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
      const workersArray = Array.from(editWorkers.entries()).map(([id, hours]) => ({
        id,
        hours,
      }));

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-logs/${editingWorkLog.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: editProject,
            date: editDate.toISOString().split('T')[0],
            description: editDescription,
            workers: workersArray,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '保存失败');
      }

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
  }, [editProject, editWorkers, editDate, editDescription, editingWorkLog, fetchWorkLogs]);

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

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* 表单区域 */}
          <ThemedView level="default" style={styles.formCard}>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.sectionTitle}>
              记录工时
            </ThemedText>

            {/* 项目选择 */}
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowProjectModal(true)}
            >
              <ThemedText variant="body" color={theme.textPrimary}>
                {selectedProject
                  ? projects.find(p => p.id === selectedProject)?.name
                  : '选择项目'}
              </ThemedText>
              <FontAwesome6 name="chevron-right" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            {/* 人员选择 */}
            <View style={styles.workerSelectorContainer}>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.label}>
                选择人员（点击切换工时）
              </ThemedText>
              <View style={styles.workersGrid}>
                {workers.map(worker => {
                  const isSelected = selectedWorkers.has(worker.id);
                  const hours = selectedWorkers.get(worker.id) || 1;
                  return (
                    <TouchableOpacity
                      key={worker.id}
                      style={[
                        styles.workerChip,
                        isSelected && styles.workerChipSelected,
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          toggleWorkerHours(worker.id);
                        } else {
                          toggleWorker(worker.id);
                        }
                      }}
                    >
                      <ThemedText
                        variant="caption"
                        color={isSelected ? theme.buttonPrimaryText : theme.textPrimary}
                      >
                        {worker.name}
                      </ThemedText>
                      {isSelected && (
                        <ThemedText
                          variant="caption"
                          color={theme.buttonPrimaryText}
                          style={{ marginLeft: 4 }}
                        >
                          ({hours}天)
                        </ThemedText>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 日期选择 */}
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <FontAwesome6 name="calendar" size={20} color={theme.textPrimary} />
              <ThemedText variant="body" color={theme.textPrimary}>
                {selectedDate.toLocaleDateString('zh-CN')}
              </ThemedText>
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

            {/* 工作内容 */}
            <View style={styles.descriptionContainer}>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.label}>
                工作内容
              </ThemedText>
              <TextInput
                style={[styles.textInput, { color: theme.textPrimary }]}
                placeholder="今天做了什么事情？"
                placeholderTextColor={theme.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* 按钮组 */}
            <View style={styles.buttonGroup}>
              {/* 清空按钮 */}
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearForm}
                disabled={loading}
              >
                <ThemedText
                  variant="bodyMedium"
                  color={theme.textMuted}
                >
                  清空
                </ThemedText>
              </TouchableOpacity>

              {/* 提交按钮 */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <ThemedText
                  variant="bodyMedium"
                  color={loading ? theme.textMuted : theme.buttonPrimaryText}
                >
                  {loading ? '提交中...' : '提交'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>

          {/* 工时记录列表 */}
          <ThemedView level="root" style={styles.listContainer}>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.sectionTitle}>
              最近记录
            </ThemedText>
            {workLogs.length === 0 ? (
              <ThemedView level="default" style={styles.emptyState}>
                <ThemedText variant="caption" color={theme.textMuted}>
                  暂无工时记录
                </ThemedText>
              </ThemedView>
            ) : (
              workLogs.map(workLog => (
                <ThemedView key={workLog.id} level="default" style={styles.workLogCard}>
                  <View style={styles.workLogHeader}>
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>
                      {workLog.projectName}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      {workLog.date}
                    </ThemedText>
                  </View>
                  <ThemedText variant="body" color={theme.textSecondary} style={styles.workLogDesc}>
                    {workLog.description}
                  </ThemedText>
                  <View style={styles.workLogFooter}>
                    <View style={styles.workersTags}>
                      {workLog.workers.map(worker => (
                        <View key={worker.id} style={styles.workerTag}>
                          <ThemedText variant="caption" color={theme.textSecondary}>
                            {worker.name} ({worker.hours}天)
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity onPress={() => handleEditWorkLog(workLog)}>
                      <FontAwesome6 name="pen" size={16} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                </ThemedView>
              ))
            )}
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 项目选择 Modal */}
      <Modal visible={showProjectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ThemedView level="default" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="h3" color={theme.textPrimary}>
                选择项目
              </ThemedText>
              <TouchableOpacity onPress={() => setShowProjectModal(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {projects.length === 0 ? (
                <ThemedView level="default" style={styles.emptyState}>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    暂无项目，请先添加项目
                  </ThemedText>
                </ThemedView>
              ) : (
                projects.map(project => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.projectItem,
                      selectedProject === project.id && styles.projectItemSelected,
                    ]}
                    onPress={() => handleSelectProject(project.id)}
                  >
                    <ThemedText
                      variant="body"
                      color={selectedProject === project.id ? theme.buttonPrimaryText : theme.textPrimary}
                    >
                      {project.name}
                    </ThemedText>
                    {selectedProject === project.id && (
                      <FontAwesome6 name="check" size={16} color={theme.buttonPrimaryText} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalFooterButton}
              onPress={() => {
                setShowProjectModal(false);
                router.push('/projects');
              }}
            >
              <FontAwesome6 name="plus" size={16} color={theme.primary} />
              <ThemedText variant="body" color={theme.primary} style={{ marginLeft: Spacing.sm }}>
                添加新项目
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>

      {/* 编辑 Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ThemedView level="default" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="h3" color={theme.textPrimary}>
                编辑工时记录
              </ThemedText>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* 项目选择 */}
              <View style={styles.editFormSection}>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.label}>
                  项目
                </ThemedText>
                <ScrollView style={styles.editProjectList} nestedScrollEnabled>
                  {projects.map(project => (
                    <TouchableOpacity
                      key={project.id}
                      style={[
                        styles.editProjectItem,
                        editProject === project.id && styles.editProjectItemSelected,
                      ]}
                      onPress={() => setEditProject(project.id)}
                    >
                      <ThemedText
                        variant="body"
                        color={editProject === project.id ? theme.buttonPrimaryText : theme.textPrimary}
                      >
                        {project.name}
                      </ThemedText>
                      {editProject === project.id && (
                        <FontAwesome6 name="check" size={16} color={theme.buttonPrimaryText} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* 人员选择 */}
              <View style={styles.editFormSection}>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.label}>
                  人员（点击切换工时）
                </ThemedText>
                <View style={styles.editWorkersGrid}>
                  {workers.map(worker => {
                    const isSelected = editWorkers.has(worker.id);
                    const hours = editWorkers.get(worker.id) || 1;
                    return (
                      <TouchableOpacity
                        key={worker.id}
                        style={[
                          styles.workerChip,
                          isSelected && styles.workerChipSelected,
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            toggleEditWorkerHours(worker.id);
                          } else {
                            toggleEditWorker(worker.id);
                          }
                        }}
                      >
                        <ThemedText
                          variant="caption"
                          color={isSelected ? theme.buttonPrimaryText : theme.textPrimary}
                        >
                          {worker.name}
                        </ThemedText>
                        {isSelected && (
                          <ThemedText
                            variant="caption"
                            color={theme.buttonPrimaryText}
                            style={{ marginLeft: 4 }}
                          >
                            ({hours}天)
                          </ThemedText>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 日期选择 */}
              <View style={styles.editFormSection}>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.label}>
                  日期
                </ThemedText>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setShowDatePicker(true)}
                >
                  <FontAwesome6 name="calendar" size={20} color={theme.textPrimary} />
                  <ThemedText variant="body" color={theme.textPrimary}>
                    {editDate.toLocaleDateString('zh-CN')}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* 工作内容 */}
              <View style={styles.editFormSection}>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.label}>
                  工作内容
                </ThemedText>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  placeholder="工作内容"
                  placeholderTextColor={theme.textMuted}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalSaveButton, loading && styles.submitButtonDisabled]}
              onPress={handleSaveEdit}
              disabled={loading}
            >
              <ThemedText variant="bodyMedium" color={loading ? theme.textMuted : theme.buttonPrimaryText}>
                {loading ? '保存中...' : '保存'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>
    </Screen>
  );
}

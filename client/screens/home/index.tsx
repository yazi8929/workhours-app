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
  TouchableWithoutFeedback,
  Keyboard,
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
import { projectService, workerService, workLogService } from '@/services/LocalStorage';

interface Project {
  id: number;
  name: string;
}

interface Worker {
  id: number;
  name: string;
}

interface WorkLog {
  id: number;
  projectId: number;
  projectName: string;
  workerId: number;
  workerName: string;
  workDate: string;
  hours: number;
  description?: string;
  createdAt: string;
}

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  // 表单状态
  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const [selectedWorkers, setSelectedWorkers] = useState<Map<number, number>>(new Map());
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
  const [editProjectId, setEditProjectId] = useState<number>(0);
  const [editWorkers, setEditWorkers] = useState<Map<number, number>>(new Map());
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editDescription, setEditDescription] = useState('');

  // 加载项目列表
  const fetchProjects = useCallback(async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (error) {
      console.error('获取项目列表失败:', error);
    }
  }, []);

  // 加载人员列表
  const fetchWorkers = useCallback(async () => {
    try {
      const data = await workerService.getAll();
      setWorkers(data);
    } catch (error) {
      console.error('获取人员列表失败:', error);
    }
  }, []);

  // 加载工时记录
  const fetchWorkLogs = useCallback(async () => {
    try {
      const data = await workLogService.getAll();
      setWorkLogs(data);
    } catch (error) {
      console.error('获取工时记录失败:', error);
    }
  }, []);

  // 页面加载时获取数据
  useFocusEffect(
    useCallback(() => {
      fetchProjects();
      fetchWorkers();
      fetchWorkLogs();
    }, [fetchProjects, fetchWorkers, fetchWorkLogs])
  );

  // 选择项目
  const handleSelectProject = (projectId: number) => {
    setSelectedProjectId(projectId);
    setShowProjectModal(false);
  };

  // 清空表单
  const handleClearForm = () => {
    setSelectedProjectId(0);
    setSelectedWorkers(new Map());
    setDescription('');
    setSelectedDate(new Date());
  };

  // 添加工时记录
  const handleAddWorkLog = async () => {
    if (!selectedProjectId) {
      Alert.alert('提示', '请选择项目');
      return;
    }

    if (selectedWorkers.size === 0) {
      Alert.alert('提示', '请选择至少一名人员');
      return;
    }

    setLoading(true);

    try {
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      if (!selectedProject) {
        throw new Error('项目不存在');
      }

      // 为每个选中的工人创建一条记录
      for (const [workerId, hours] of selectedWorkers.entries()) {
        const worker = workers.find(w => w.id === workerId);
        if (worker) {
          await workLogService.create({
            projectId: selectedProjectId,
            projectName: selectedProject.name,
            workerId: workerId,
            workerName: worker.name,
            workDate: selectedDate.toISOString().split('T')[0],
            hours: hours,
            description: description.trim() || undefined,
          });
        }
      }

      Alert.alert('成功', '工时记录已添加');
      handleClearForm();
      fetchWorkLogs();
    } catch (error) {
      console.error('添加工时记录失败:', error);
      Alert.alert('错误', '添加失败');
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑模态框
  const handleEdit = (workLog: WorkLog) => {
    setEditingWorkLog(workLog);
    setEditProjectId(workLog.projectId);
    
    const workerMap = new Map<number, number>();
    workerMap.set(workLog.workerId, workLog.hours);
    setEditWorkers(workerMap);
    
    setEditDate(new Date(workLog.workDate));
    setEditDescription(workLog.description || '');
    setShowEditModal(true);
  };

  // 更新工时记录
  const handleUpdateWorkLog = async () => {
    if (!editingWorkLog) return;

    if (!editProjectId) {
      Alert.alert('提示', '请选择项目');
      return;
    }

    if (editWorkers.size === 0) {
      Alert.alert('提示', '请选择至少一名人员');
      return;
    }

    setLoading(true);

    try {
      const selectedProject = projects.find(p => p.id === editProjectId);
      if (!selectedProject) {
        throw new Error('项目不存在');
      }

      // 获取第一个选中的工人（编辑时只允许一个工人）
      const workerId = editWorkers.keys().next().value;
      const hours = editWorkers.values().next().value;
      const worker = workers.find(w => w.id === workerId);

      if (!worker) {
        throw new Error('人员不存在');
      }

      await workLogService.update(editingWorkLog.id, {
        projectId: editProjectId,
        projectName: selectedProject.name,
        workerId: workerId,
        workerName: worker.name,
        workDate: editDate.toISOString().split('T')[0],
        hours: hours,
        description: editDescription.trim() || undefined,
      });

      Alert.alert('成功', '工时记录已更新');
      setShowEditModal(false);
      setEditingWorkLog(null);
      fetchWorkLogs();
    } catch (error) {
      console.error('更新工时记录失败:', error);
      Alert.alert('错误', '更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除工时记录
  const handleDelete = (workLog: WorkLog) => {
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
              await workLogService.delete(workLog.id);
              Alert.alert('成功', '工时记录已删除');
              fetchWorkLogs();
            } catch (error) {
              console.error('删除工时记录失败:', error);
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  };

  // 切换工人工时
  const toggleWorker = (workerId: number, hours: number) => {
    setSelectedWorkers(prev => {
      const newMap = new Map(prev);
      if (newMap.has(workerId)) {
        newMap.delete(workerId);
      } else {
        newMap.set(workerId, hours);
      }
      return newMap;
    });
  };

  // 更新工人工时
  const updateWorkerHours = (workerId: number, hours: number) => {
    setSelectedWorkers(prev => {
      const newMap = new Map(prev);
      newMap.set(workerId, hours);
      return newMap;
    });
  };

  // 编辑模态框切换工人工时
  const toggleEditWorker = (workerId: number, hours: number) => {
    setEditWorkers(prev => {
      const newMap = new Map(prev);
      newMap.clear(); // 编辑时只允许一个工人
      newMap.set(workerId, hours);
      return newMap;
    });
  };

  // 获取当前日期的记录
  const currentDayLogs = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return workLogs.filter(log => log.workDate === dateStr);
  }, [workLogs, selectedDate]);

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* 头部 */}
          <ThemedView level="default" style={styles.headerCard}>
            <ThemedText variant="h2" color={theme.textPrimary}>
              记录工时
            </ThemedText>
          </ThemedView>

          {/* 项目选择 */}
          <ThemedView level="default" style={styles.formCard}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowProjectModal(true)}
            >
              <FontAwesome6 name="folder" size={16} color={theme.primary} />
              <ThemedText
                variant="bodyMedium"
                color={selectedProjectId ? theme.textPrimary : theme.textMuted}
                style={{ marginLeft: 12 }}
              >
                {selectedProjectId
                  ? projects.find(p => p.id === selectedProjectId)?.name
                  : '选择项目'}
              </ThemedText>
              <FontAwesome6 name="chevron-down" size={14} color={theme.textMuted} />
            </TouchableOpacity>
          </ThemedView>

          {/* 人员选择 */}
          <ThemedView level="default" style={styles.formCard}>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.formLabel}>
              选择人员
            </ThemedText>
            <View style={styles.workerList}>
              {workers.map(worker => (
                <TouchableOpacity
                  key={worker.id}
                  style={[
                    styles.workerItem,
                    selectedWorkers.has(worker.id) && styles.workerItemSelected,
                  ]}
                  onPress={() => toggleWorker(worker.id, 8)}
                >
                  <ThemedText
                    variant="body"
                    color={selectedWorkers.has(worker.id) ? theme.buttonPrimaryText : theme.textPrimary}
                  >
                    {worker.name}
                  </ThemedText>
                  {selectedWorkers.has(worker.id) && (
                    <FontAwesome6 name="check" size={16} color={theme.buttonPrimaryText} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* 工时输入 */}
            {selectedWorkers.size > 0 && (
              <View style={styles.hoursContainer}>
                {Array.from(selectedWorkers.entries()).map(([workerId, hours]) => {
                  const worker = workers.find(w => w.id === workerId);
                  return (
                    <View key={workerId} style={styles.hoursItem}>
                      <ThemedText variant="caption" color={theme.textSecondary}>
                        {worker?.name}
                      </ThemedText>
                      <View style={styles.hoursInput}>
                        <TouchableOpacity
                          style={styles.hoursButton}
                          onPress={() => updateWorkerHours(workerId, Math.max(0.5, hours - 0.5))}
                        >
                          <FontAwesome6 name="minus" size={14} color={theme.primary} />
                        </TouchableOpacity>
                        <ThemedText variant="body" color={theme.textPrimary}>
                          {hours.toFixed(1)}
                        </ThemedText>
                        <TouchableOpacity
                          style={styles.hoursButton}
                          onPress={() => updateWorkerHours(workerId, hours + 0.5)}
                        >
                          <FontAwesome6 name="plus" size={14} color={theme.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ThemedView>

          {/* 日期选择 */}
          <ThemedView level="default" style={styles.formCard}>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.formLabel}>
              工作日期
            </ThemedText>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <FontAwesome6 name="calendar" size={16} color={theme.primary} />
              <ThemedText variant="bodyMedium" color={theme.textPrimary} style={{ marginLeft: 12 }}>
                {selectedDate.toLocaleDateString()}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* 工作描述 */}
          <ThemedView level="default" style={styles.formCard}>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.formLabel}>
              工作描述（可选）
            </ThemedText>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="请输入工作描述"
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
            />
          </ThemedView>

          {/* 提交按钮 */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleAddWorkLog}
            disabled={loading}
          >
            <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText}>
              {loading ? '添加中...' : '添加记录'}
            </ThemedText>
          </TouchableOpacity>

          {/* 当日记录列表 */}
          {currentDayLogs.length > 0 && (
            <ThemedView level="default" style={styles.logsCard}>
              <View style={styles.logsHeader}>
                <ThemedText variant="h3" color={theme.textPrimary}>
                  当日记录
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  {currentDayLogs.length} 条
                </ThemedText>
              </View>

              {currentDayLogs.map(log => (
                <View key={log.id} style={styles.logItem}>
                  <View style={styles.logInfo}>
                    <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                      {log.workerName} - {log.projectName}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      {log.description || '无描述'}
                    </ThemedText>
                  </View>
                  <View style={styles.logActions}>
                    <ThemedText variant="h3" color={theme.primary}>
                      {log.hours}天
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.logEditButton}
                      onPress={() => handleEdit(log)}
                    >
                      <FontAwesome6 name="pen" size={14} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.logDeleteButton}
                      onPress={() => handleDelete(log)}
                    >
                      <FontAwesome6 name="trash" size={14} color={theme.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ThemedView>
          )}
        </ScrollView>

        {/* 项目选择模态框 */}
        <Modal visible={showProjectModal} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setShowProjectModal(false)}>
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

                <ScrollView style={styles.modalList}>
                  {projects.length === 0 ? (
                    <ThemedText variant="caption" color={theme.textMuted} style={styles.modalEmpty}>
                      暂无项目
                    </ThemedText>
                  ) : (
                    projects.map(project => (
                      <TouchableOpacity
                        key={project.id}
                        style={[
                          styles.modalItem,
                          selectedProjectId === project.id && styles.modalItemSelected,
                        ]}
                        onPress={() => handleSelectProject(project.id)}
                      >
                        <ThemedText
                          variant="bodyMedium"
                          color={selectedProjectId === project.id ? theme.buttonPrimaryText : theme.textPrimary}
                        >
                          {project.name}
                        </ThemedText>
                        {selectedProjectId === project.id && (
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
                  <ThemedText variant="body" color={theme.buttonPrimaryText}>
                    + 添加新项目
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* 编辑模态框 */}
        <Modal visible={showEditModal} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View style={styles.modalOverlay}>
                <ThemedView level="default" style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <ThemedText variant="h3" color={theme.textPrimary}>
                      编辑记录
                    </ThemedText>
                    <TouchableOpacity onPress={() => setShowEditModal(false)}>
                      <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.modalList}>
                    {/* 项目选择 */}
                    <ThemedText variant="caption" color={theme.textMuted} style={styles.formLabel}>
                      项目
                    </ThemedText>
                    <View style={styles.workerList}>
                      {projects.map(project => (
                        <TouchableOpacity
                          key={project.id}
                          style={[
                            styles.workerItem,
                            editProjectId === project.id && styles.workerItemSelected,
                          ]}
                          onPress={() => setEditProjectId(project.id)}
                        >
                          <ThemedText
                            variant="body"
                            color={editProjectId === project.id ? theme.buttonPrimaryText : theme.textPrimary}
                          >
                            {project.name}
                          </ThemedText>
                          {editProjectId === project.id && (
                            <FontAwesome6 name="check" size={16} color={theme.buttonPrimaryText} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* 人员选择 */}
                    <ThemedText variant="caption" color={theme.textMuted} style={styles.formLabel}>
                      人员
                    </ThemedText>
                    <View style={styles.workerList}>
                      {workers.map(worker => (
                        <TouchableOpacity
                          key={worker.id}
                          style={[
                            styles.workerItem,
                            editWorkers.has(worker.id) && styles.workerItemSelected,
                          ]}
                          onPress={() => toggleEditWorker(worker.id, 8)}
                        >
                          <ThemedText
                            variant="body"
                            color={editWorkers.has(worker.id) ? theme.buttonPrimaryText : theme.textPrimary}
                          >
                            {worker.name}
                          </ThemedText>
                          {editWorkers.has(worker.id) && (
                            <FontAwesome6 name="check" size={16} color={theme.buttonPrimaryText} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* 工时输入 */}
                    {editWorkers.size > 0 && (
                      <View style={styles.hoursContainer}>
                        {Array.from(editWorkers.entries()).map(([workerId, hours]) => {
                          const worker = workers.find(w => w.id === workerId);
                          return (
                            <View key={workerId} style={styles.hoursItem}>
                              <ThemedText variant="caption" color={theme.textSecondary}>
                                {worker?.name}
                              </ThemedText>
                              <View style={styles.hoursInput}>
                                <TouchableOpacity
                                  style={styles.hoursButton}
                                  onPress={() => {
                                    setEditWorkers(prev => {
                                      const newMap = new Map(prev);
                                      newMap.set(workerId, Math.max(0.5, hours - 0.5));
                                      return newMap;
                                    });
                                  }}
                                >
                                  <FontAwesome6 name="minus" size={14} color={theme.primary} />
                                </TouchableOpacity>
                                <ThemedText variant="body" color={theme.textPrimary}>
                                  {hours.toFixed(1)}
                                </ThemedText>
                                <TouchableOpacity
                                  style={styles.hoursButton}
                                  onPress={() => {
                                    setEditWorkers(prev => {
                                      const newMap = new Map(prev);
                                      newMap.set(workerId, hours + 0.5);
                                      return newMap;
                                    });
                                  }}
                                >
                                  <FontAwesome6 name="plus" size={14} color={theme.primary} />
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* 日期选择 */}
                    <ThemedText variant="caption" color={theme.textMuted} style={styles.formLabel}>
                      日期
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <FontAwesome6 name="calendar" size={16} color={theme.primary} />
                      <ThemedText variant="bodyMedium" color={theme.textPrimary} style={{ marginLeft: 12 }}>
                        {editDate.toLocaleDateString()}
                      </ThemedText>
                    </TouchableOpacity>

                    {/* 工作描述 */}
                    <ThemedText variant="caption" color={theme.textMuted} style={styles.formLabel}>
                      工作描述
                    </ThemedText>
                    <TextInput
                      style={styles.textInput}
                      value={editDescription}
                      onChangeText={setEditDescription}
                      placeholder="请输入工作描述"
                      placeholderTextColor={theme.textMuted}
                      multiline
                      numberOfLines={3}
                    />
                  </ScrollView>

                  <TouchableOpacity
                    style={[styles.modalFooterButton, styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleUpdateWorkLog}
                    disabled={loading}
                  >
                    <ThemedText variant="body" color={theme.buttonPrimaryText}>
                      {loading ? '保存中...' : '保存'}
                    </ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Modal>

        {/* 日期选择器 */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) {
                setSelectedDate(date);
                if (showEditModal) {
                  setEditDate(date);
                }
              }
            }}
          />
        )}
      </View>
    </Screen>
  );
}

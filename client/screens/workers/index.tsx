import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';
import { workerService } from '@/services/LocalStorage';

interface Worker {
  id: number;
  name: string;
  role?: string;
  createdAt: string;
}

export default function WorkersScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [workerName, setWorkerName] = useState('');
  const [workerRole, setWorkerRole] = useState('');
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  // 获取人员列表
  const fetchWorkers = useCallback(async () => {
    try {
      const data = await workerService.getAll();
      setWorkers(data);
    } catch (error: any) {
      console.error('获取人员列表失败:', error);
    }
  }, []);

  // 每次进入页面刷新数据
  useFocusEffect(
    useCallback(() => {
      fetchWorkers();
    }, [fetchWorkers])
  );

  // 编辑人员
  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setWorkerName(worker.name);
    setWorkerRole(worker.role || '');
    setModalVisible(true);
  };

  // 保存人员（新增或更新）
  const handleSave = useCallback(async () => {
    if (!workerName.trim()) {
      Alert.alert('提示', '人员姓名不能为空');
      return;
    }

    setLoading(true);

    try {
      const isEdit = editingWorker !== null;

      if (isEdit) {
        await workerService.update(editingWorker.id, {
          name: workerName.trim(),
          role: workerRole.trim() || undefined,
        });
        Alert.alert('成功', '人员已更新');
      } else {
        await workerService.create({
          name: workerName.trim(),
          role: workerRole.trim() || undefined,
        });
        Alert.alert('成功', '人员已添加');
      }

      setModalVisible(false);
      setEditingWorker(null);
      setWorkerName('');
      setWorkerRole('');
      fetchWorkers();
    } catch (error: any) {
      console.error('保存人员失败:', error);
      Alert.alert('错误', '保存失败');
    } finally {
      setLoading(false);
    }
  }, [workerName, workerRole, editingWorker, fetchWorkers]);

  // 删除人员
  const handleDelete = useCallback((worker: Worker) => {
    Alert.alert(
      '确认删除',
      `确定要删除人员"${worker.name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await workerService.delete(worker.id);
              Alert.alert('成功', '人员已删除');
              fetchWorkers();
            } catch (error: any) {
              console.error('删除人员失败:', error);
              Alert.alert('错误', '删除失败');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [fetchWorkers]);

  // 复制人员列表
  const handleCopy = useCallback(async () => {
    if (workers.length === 0) {
      Alert.alert('提示', '暂无人员数据');
      return;
    }

    let text = '人员列表\n';
    text += `${'─'.repeat(50)}\n`;
    workers.forEach((worker, index) => {
      text += `${index + 1}. ${worker.name}`;
      if (worker.role) {
        text += ` (${worker.role})`;
      }
      text += '\n';
    });
    text += `\n总计：${workers.length} 人`;

    await Clipboard.setStringAsync(text);
    Alert.alert('成功', '人员列表已复制到剪贴板');
  }, [workers]);

  // 打开新增模态框
  const handleAdd = () => {
    setEditingWorker(null);
    setWorkerName('');
    setWorkerRole('');
    setModalVisible(true);
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <View style={styles.container}>
        {/* 头部 */}
        <ThemedView level="default" style={styles.header}>
          <View style={styles.headerTitleRow}>
            <ThemedText variant="h2" color={theme.textPrimary}>
              人员管理
            </ThemedText>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton} onPress={handleCopy}>
                <FontAwesome6 name="copy" size={20} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={handleAdd}>
                <FontAwesome6 name="plus" size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <ThemedText variant="caption" color={theme.textMuted}>
            共 {workers.length} 人
          </ThemedText>
        </ThemedView>

        {/* 人员列表 */}
        <ScrollView contentContainerStyle={styles.listContent}>
          {workers.length === 0 ? (
            <ThemedView level="default" style={styles.emptyState}>
              <FontAwesome6 name="users" size={48} color={theme.textMuted} />
              <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: 16 }}>
                暂无人员
              </ThemedText>
              <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                <FontAwesome6 name="plus" size={16} color={theme.buttonPrimaryText} />
                <ThemedText variant="caption" color={theme.buttonPrimaryText} style={{ marginLeft: 8 }}>
                  添加人员
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : (
            workers.map((worker) => (
              <ThemedView key={worker.id} level="default" style={styles.workerCard}>
                <View style={styles.workerInfo}>
                  <View style={styles.workerNameRow}>
                    <ThemedText variant="bodyMedium" color={theme.textPrimary} style={styles.workerName}>
                      {worker.name}
                    </ThemedText>
                    {worker.role && (
                      <ThemedText variant="caption" color={theme.textMuted} style={styles.workerRole}>
                        {worker.role}
                      </ThemedText>
                    )}
                  </View>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    创建于 {new Date(worker.createdAt).toLocaleDateString()}
                  </ThemedText>
                </View>
                <View style={styles.workerActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(worker)}>
                    <FontAwesome6 name="pen" size={16} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(worker)}
                  >
                    <FontAwesome6 name="trash" size={16} color={theme.error} />
                  </TouchableOpacity>
                </View>
              </ThemedView>
            ))
          )}
        </ScrollView>

        {/* 模态框 */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View style={styles.modalContainer}>
                <ThemedView level="default" style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <ThemedText variant="h3" color={theme.textPrimary}>
                      {editingWorker ? '编辑人员' : '新增人员'}
                    </ThemedText>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    <View style={styles.inputGroup}>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        人员姓名
                      </ThemedText>
                      <TextInput
                        style={styles.input}
                        value={workerName}
                        onChangeText={setWorkerName}
                        placeholder="请输入人员姓名"
                        placeholderTextColor={theme.textMuted}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        职位/角色（可选）
                      </ThemedText>
                      <TextInput
                        style={styles.input}
                        value={workerRole}
                        onChangeText={setWorkerRole}
                        placeholder="请输入职位或角色"
                        placeholderTextColor={theme.textMuted}
                      />
                    </View>
                  </View>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setModalVisible(false)}
                    >
                      <ThemedText variant="body" color={theme.textSecondary}>
                        取消
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.saveButton, loading && styles.saveButtonDisabled]}
                      onPress={handleSave}
                      disabled={loading}
                    >
                      <ThemedText variant="body" color={theme.buttonPrimaryText}>
                        {loading ? '保存中...' : '保存'}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </ThemedView>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </Screen>
  );
}

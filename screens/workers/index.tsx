import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';
import { workerService, type Worker } from '@/services/LocalStorage';

export default function WorkersScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [workerName, setWorkerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

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

  useFocusEffect(
    useCallback(() => {
      fetchWorkers();
    }, [fetchWorkers])
  );

  // 编辑人员
  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setWorkerName(worker.name);
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
      if (editingWorker) {
        await workerService.updateWorker(editingWorker.id, workerName.trim());
        Alert.alert('成功', '人员已更新');
      } else {
        await workerService.createWorker(workerName.trim());
        Alert.alert('成功', '人员已添加');
      }
      setModalVisible(false);
      setEditingWorker(null);
      setWorkerName('');
      fetchWorkers();
    } catch (error: any) {
      console.error('保存人员失败:', error);
      Alert.alert('错误', error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  }, [workerName, editingWorker, fetchWorkers]);

  // 删除人员
  const handleDelete = useCallback(
    (worker: Worker) => {
      Alert.alert(
        '确认删除',
        `确定要删除人员"${worker.name}"吗？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '删除',
            style: 'destructive',
            onPress: async () => {
              try {
                await workerService.deleteWorker(worker.id);
                Alert.alert('成功', '人员已删除');
                fetchWorkers();
              } catch (error) {
                Alert.alert('错误', '删除失败');
              }
            },
          },
        ]
      );
    },
    [fetchWorkers]
  );

  // 复制姓名到剪贴板
  const handleCopy = async (worker: Worker) => {
    await Clipboard.setStringAsync(worker.name);
    Alert.alert('提示', '人员姓名已复制');
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <ThemedText variant="h2" color={theme.textPrimary}>人员管理</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>管理人员信息</ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setEditingWorker(null);
              setWorkerName('');
              setModalVisible(true);
            }}
          >
            <FontAwesome6 name="user-plus" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {workers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="user-slash" size={60} color={theme.textMuted} />
              <ThemedText variant="bodyMedium" color={theme.textMuted} style={styles.emptyText}>
                暂无人员
              </ThemedText>
            </View>
          ) : (
            workers.map((worker) => (
              <ThemedView key={worker.id} level="tertiary" style={styles.workerCard}>
                <View style={styles.workerInfo}>
                  <View style={styles.workerIcon}>
                    <FontAwesome6 name="user" size={20} color={theme.primary} />
                  </View>
                  <ThemedText variant="bodyMedium" color={theme.textPrimary} style={styles.workerName}>
                    {worker.name}
                  </ThemedText>
                </View>
                <View style={styles.workerActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                    onPress={() => handleCopy(worker)}
                  >
                    <FontAwesome6 name="copy" size={16} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.border }]}
                    onPress={() => handleEdit(worker)}
                  >
                    <FontAwesome6 name="pen" size={16} color={theme.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.error }]}
                    onPress={() => handleDelete(worker)}
                  >
                    <FontAwesome6 name="trash" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </ThemedView>
            ))
          )}
        </ScrollView>
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText variant="h3" color={theme.textPrimary}>
                {editingWorker ? '编辑人员' : '新增人员'}
              </ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="xmark" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <ThemedView level="root" style={styles.inputContainer}>
                <ThemedText variant="caption" color={theme.textSecondary} style={styles.inputLabel}>
                  人员姓名
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.textPrimary }]}
                  placeholder="输入人员姓名"
                  placeholderTextColor={theme.textMuted}
                  value={workerName}
                  onChangeText={setWorkerName}
                />
              </ThemedView>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.border }]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText variant="bodyMedium" color={theme.textPrimary}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleSave}
                disabled={loading}
              >
                <ThemedText variant="bodyMedium" color="white">
                  {loading ? '保存中...' : '保存'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

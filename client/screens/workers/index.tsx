import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
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
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [workerName, setWorkerName] = useState('');
  const [role, setRole] = useState('');

  const fetchWorkers = useCallback(async () => {
    try {
      const data = await workerService.getAll();
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

  const handleAdd = () => {
    setEditingWorker(null);
    setWorkerName('');
    setRole('');
    setModalVisible(true);
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setWorkerName(worker.name);
    setRole(worker.role || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!workerName.trim()) {
      Alert.alert('提示', '请输入人员姓名');
      return;
    }

    try {
      if (editingWorker) {
        await workerService.update(editingWorker.id, {
          name: workerName,
          role: role || undefined,
        });
        Alert.alert('成功', '人员已更新');
      } else {
        await workerService.create({
          name: workerName,
          role: role || undefined,
        });
        Alert.alert('成功', '人员已添加');
      }
      setModalVisible(false);
      fetchWorkers();
    } catch (error: any) {
      console.error('保存失败:', error);
      Alert.alert('错误', error.message || '保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert('确认', '确定要删除这个人员吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await workerService.delete(id);
            Alert.alert('成功', '人员已删除');
            fetchWorkers();
          } catch (error: any) {
            console.error('删除失败:', error);
            Alert.alert('错误', error.message || '删除失败');
          }
        },
      },
    ]);
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText variant="h2" color={theme.textPrimary}>
            人员管理
          </ThemedText>
          <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
            <FontAwesome6 name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.list}>
          {workers.length === 0 ? (
            <ThemedView level="default" style={styles.emptyState}>
              <FontAwesome6 name="users" size={48} color={theme.textMuted} />
              <ThemedText variant="body" color={theme.textMuted} style={{ marginTop: 16 }}>
                暂无人员
              </ThemedText>
            </ThemedView>
          ) : (
            workers.map(worker => (
              <ThemedView key={worker.id} level="default" style={styles.workerCard}>
                <View style={styles.workerInfo}>
                  <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                    {worker.name}
                  </ThemedText>
                  {worker.role && (
                    <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: 4 }}>
                      {worker.role}
                    </ThemedText>
                  )}
                </View>
                <View style={styles.workerActions}>
                  <TouchableOpacity onPress={() => handleEdit(worker)} style={styles.iconButton}>
                    <FontAwesome6 name="pen" size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(worker.id)} style={styles.iconButton}>
                    <FontAwesome6 name="trash" size={16} color={theme.error} />
                  </TouchableOpacity>
                </View>
              </ThemedView>
            ))
          )}
        </ScrollView>

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
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
                <ThemedText variant="caption" color={theme.textMuted} style={styles.label}>
                  姓名
                </ThemedText>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  value={workerName}
                  onChangeText={setWorkerName}
                  placeholder="输入姓名"
                  placeholderTextColor={theme.textMuted}
                />

                <ThemedText variant="caption" color={theme.textMuted} style={styles.label}>
                  职位（可选）
                </ThemedText>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  value={role}
                  onChangeText={setRole}
                  placeholder="输入职位"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                    取消
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
                  <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText}>
                    保存
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}

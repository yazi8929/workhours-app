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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';
import { projectService } from '@/services/LocalStorage';

interface Project {
  id: number;
  name: string;
  createdAt: string;
}

export default function ProjectsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // 获取项目列表
  const fetchProjects = useCallback(async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (error: any) {
      console.error('获取项目列表失败:', error);
      Alert.alert('错误', '获取项目列表失败');
    }
  }, []);

  // 每次进入页面刷新数据
  useFocusEffect(
    useCallback(() => {
      fetchProjects();
    }, [fetchProjects])
  );

  // 编辑项目
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setModalVisible(true);
  };

  // 保存项目（新增或更新）
  const handleSave = useCallback(async () => {
    if (!projectName.trim()) {
      Alert.alert('提示', '项目名称不能为空');
      return;
    }

    setLoading(true);

    try {
      const isEdit = editingProject !== null;
      
      if (isEdit && editingProject) {
        await projectService.update(editingProject.id, { name: projectName.trim() });
        Alert.alert('成功', '项目已更新');
      } else {
        await projectService.create({ name: projectName.trim() });
        Alert.alert('成功', '项目已添加');
      }

      setModalVisible(false);
      setEditingProject(null);
      setProjectName('');
      fetchProjects();
    } catch (error: any) {
      console.error('保存项目失败:', error);
      Alert.alert('错误', error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  }, [projectName, editingProject, fetchProjects]);

  // 删除项目
  const handleDelete = useCallback((project: Project) => {
    Alert.alert(
      '确认删除',
      `确定要删除项目"${project.name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await projectService.delete(project.id);
              Alert.alert('成功', '项目已删除');
              fetchProjects();
            } catch (error: any) {
              console.error('删除项目失败:', error);
              Alert.alert('错误', error.message || '删除失败');
            }
          },
        },
      ]
    );
  }, [fetchProjects]);

  // 复制项目名称
  const handleCopy = async (name: string) => {
    await Clipboard.setStringAsync(name);
    Alert.alert('提示', '项目名称已复制');
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <ThemedText variant="h2" color={theme.textPrimary}>项目管理</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>
              共 {projects.length} 个项目
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setEditingProject(null);
              setProjectName('');
              setModalVisible(true);
            }}
          >
            <FontAwesome6 name="plus" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {projects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="folder-open" size={60} color={theme.textMuted} />
              <ThemedText variant="bodyMedium" color={theme.textMuted} style={styles.emptyText}>
                暂无项目
              </ThemedText>
            </View>
          ) : (
            projects.map((project) => (
              <ThemedView key={project.id} level="tertiary" style={styles.projectCard}>
                <View style={styles.projectInfo}>
                  <View style={styles.projectIcon}>
                    <FontAwesome6 name="folder" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.projectName}>
                    <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                      {project.name}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      创建于 {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.projectActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.border }]}
                    onPress={() => handleCopy(project.name)}
                  >
                    <FontAwesome6 name="copy" size={16} color={theme.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                    onPress={() => handleEdit(project)}
                  >
                    <FontAwesome6 name="pen" size={16} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                    onPress={() => handleDelete(project)}
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
                {editingProject ? '编辑项目' : '新增项目'}
              </ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="xmark" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <ThemedView level="root" style={styles.inputContainer}>
                <ThemedText variant="caption" color={theme.textSecondary} style={styles.inputLabel}>
                  项目名称
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.textPrimary }]}
                  placeholder="输入项目名称"
                  placeholderTextColor={theme.textMuted}
                  value={projectName}
                  onChangeText={setProjectName}
                />
              </ThemedView>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                  取消
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSave}
                disabled={loading}
              >
                <ThemedText
                  variant="bodyMedium"
                  color={loading ? theme.textMuted : theme.buttonPrimaryText}
                >
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

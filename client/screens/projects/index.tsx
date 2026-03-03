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
import { projectService, type Project } from '@/services/LocalStorage';

export default function ProjectsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (error) {
      console.error('获取项目列表失败:', error);
      Alert.alert('错误', '获取项目列表失败');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProjects();
    }, [fetchProjects])
  );

  const handleAdd = () => {
    setEditingProject(null);
    setProjectName('');
    setDescription('');
    setModalVisible(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setDescription(project.description || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!projectName.trim()) {
      Alert.alert('提示', '请输入项目名称');
      return;
    }

    try {
      if (editingProject) {
        await projectService.update(editingProject.id, {
          name: projectName,
          description: description || undefined,
        });
        Alert.alert('成功', '项目已更新');
      } else {
        await projectService.create({
          name: projectName,
          description: description || undefined,
        });
        Alert.alert('成功', '项目已添加');
      }
      setModalVisible(false);
      fetchProjects();
    } catch (error: any) {
      console.error('保存失败:', error);
      Alert.alert('错误', error.message || '保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert('确认', '确定要删除这个项目吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await projectService.delete(id);
            Alert.alert('成功', '项目已删除');
            fetchProjects();
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
            项目管理
          </ThemedText>
          <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
            <FontAwesome6 name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.list}>
          {projects.length === 0 ? (
            <ThemedView level="default" style={styles.emptyState}>
              <FontAwesome6 name="folder-open" size={48} color={theme.textMuted} />
              <ThemedText variant="body" color={theme.textMuted} style={{ marginTop: 16 }}>
                暂无项目
              </ThemedText>
            </ThemedView>
          ) : (
            projects.map(project => (
              <ThemedView key={project.id} level="default" style={styles.projectCard}>
                <View style={styles.projectInfo}>
                  <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                    {project.name}
                  </ThemedText>
                  {project.description && (
                    <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: 4 }}>
                      {project.description}
                    </ThemedText>
                  )}
                </View>
                <View style={styles.projectActions}>
                  <TouchableOpacity onPress={() => handleEdit(project)} style={styles.iconButton}>
                    <FontAwesome6 name="pen" size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(project.id)} style={styles.iconButton}>
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
                  {editingProject ? '编辑项目' : '新增项目'}
                </ThemedText>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.label}>
                  项目名称
                </ThemedText>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  value={projectName}
                  onChangeText={setProjectName}
                  placeholder="输入项目名称"
                  placeholderTextColor={theme.textMuted}
                />

                <ThemedText variant="caption" color={theme.textMuted} style={styles.label}>
                  项目描述（可选）
                </ThemedText>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="输入项目描述"
                  placeholderTextColor={theme.textMuted}
                  multiline
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

  );
}

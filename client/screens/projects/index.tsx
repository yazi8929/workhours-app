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
  TouchableWithoutFeedback,   // 👈 这一行
  KeyboardAvoidingView,       // 👈 这一行
  Keyboard,                   // 👈 这一行
} from 'react-native';
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
  description?: string;
  createdAt: string;
}

export default function ProjectsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // 获取项目列表
  const fetchProjects = useCallback(async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (error: any) {
      console.error('获取项目列表失败:', error);
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
    setProjectDescription(project.description || '');
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

      if (isEdit) {
        await projectService.update(editingProject.id, {
          name: projectName.trim(),
          description: projectDescription.trim() || undefined,
        });
        Alert.alert('成功', '项目已更新');
      } else {
        await projectService.create({
          name: projectName.trim(),
          description: projectDescription.trim() || undefined,
        });
        Alert.alert('成功', '项目已添加');
      }

      setModalVisible(false);
      setEditingProject(null);
      setProjectName('');
      setProjectDescription('');
      fetchProjects();
    } catch (error: any) {
      console.error('保存项目失败:', error);
      Alert.alert('错误', '保存失败');
    } finally {
      setLoading(false);
    }
  }, [projectName, projectDescription, editingProject, fetchProjects]);

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
            setLoading(true);
            try {
              await projectService.delete(project.id);
              Alert.alert('成功', '项目已删除');
              fetchProjects();
            } catch (error: any) {
              console.error('删除项目失败:', error);
              Alert.alert('错误', '删除失败');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [fetchProjects]);

  // 复制项目列表
  const handleCopy = useCallback(async () => {
    if (projects.length === 0) {
      Alert.alert('提示', '暂无项目数据');
      return;
    }

    let text = '项目列表\n';
    text += `${'─'.repeat(50)}\n`;
    projects.forEach((project, index) => {
      text += `${index + 1}. ${project.name}`;
      if (project.description) {
        text += ` - ${project.description}`;
      }
      text += '\n';
    });
    text += `\n总计：${projects.length} 个项目`;

    await Clipboard.setStringAsync(text);
    Alert.alert('成功', '项目列表已复制到剪贴板');
  }, [projects]);

  // 打开新增模态框
  const handleAdd = () => {
    setEditingProject(null);
    setProjectName('');
    setProjectDescription('');
    setModalVisible(true);
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <View style={styles.container}>
        {/* 头部 */}
        <ThemedView level="default" style={styles.header}>
          <View style={styles.headerTitleRow}>
            <ThemedText variant="h2" color={theme.textPrimary}>
              项目管理
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
            共 {projects.length} 个项目
          </ThemedText>
        </ThemedView>

        {/* 项目列表 */}
        <ScrollView contentContainerStyle={styles.listContent}>
          {projects.length === 0 ? (
            <ThemedView level="default" style={styles.emptyState}>
              <FontAwesome6 name="folder-open" size={48} color={theme.textMuted} />
              <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: 16 }}>
                暂无项目
              </ThemedText>
              <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                <FontAwesome6 name="plus" size={16} color={theme.buttonPrimaryText} />
                <ThemedText variant="caption" color={theme.buttonPrimaryText} style={{ marginLeft: 8 }}>
                  添加项目
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : (
            projects.map((project) => (
              <ThemedView key={project.id} level="default" style={styles.projectCard}>
                <View style={styles.projectInfo}>
                  <View style={styles.projectNameRow}>
                    <ThemedText variant="bodyMedium" color={theme.textPrimary} style={styles.projectName}>
                      {project.name}
                    </ThemedText>
                    {project.description && (
                      <ThemedText variant="caption" color={theme.textMuted} style={styles.projectDesc}>
                        {project.description}
                      </ThemedText>
                    )}
                  </View>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    创建于 {new Date(project.createdAt).toLocaleDateString()}
                  </ThemedText>
                </View>
                <View style={styles.projectActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(project)}>
                    <FontAwesome6 name="pen" size={16} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(project)}
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
                      {editingProject ? '编辑项目' : '新增项目'}
                    </ThemedText>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    <View style={styles.inputGroup}>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        项目名称
                      </ThemedText>
                      <TextInput
                        style={styles.input}
                        value={projectName}
                        onChangeText={setProjectName}
                        placeholder="请输入项目名称"
                        placeholderTextColor={theme.textMuted}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        项目描述（可选）
                      </ThemedText>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={projectDescription}
                        onChangeText={setProjectDescription}
                        placeholder="请输入项目描述"
                        placeholderTextColor={theme.textMuted}
                        multiline
                        numberOfLines={3}
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

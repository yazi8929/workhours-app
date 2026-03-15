import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Project } from '@/types';
import { ProjectStorage } from '@/utils/storage';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles';
import { ProjectStatusNames } from '@/types';

export default function ProjectsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  const loadProjects = useCallback(async () => {
    const data = await ProjectStorage.getAll();
    // 只显示进行中和已暂停的项目，已完成的项目只在统计页面显示
    const activeProjects = data.filter(p => p.status !== 'completed');
    setProjects(activeProjects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [loadProjects])
  );

  const handleAddProject = () => {
    router.push('/projects/add');
  };

  const handleEditProject = (project: Project) => {
    console.log('编辑项目被点击:', project.id, project.name);
    console.log('准备跳转到编辑页面，参数 id:', project.id);
    router.push('/projects/edit', { id: project.id });
    console.log('路由跳转已调用');
  };

  const renderProjectItem = ({ item }: { item: Project }) => (
    <View style={styles.projectCard}>
      <View style={styles.projectHeader}>
        <TouchableOpacity
          style={styles.projectTitleContainer}
          onPress={() => router.push('/projects/detail', { id: item.id })}
          activeOpacity={0.7}
        >
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.projectName}>
            {item.name}
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted} style={styles.statusText}>
            {ProjectStatusNames[item.status]}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            console.log('编辑按钮被点击:', item.id, item.name);
            handleEditProject(item);
          }}
          style={styles.editButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <FontAwesome6 name="pen-to-square" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/projects/detail', { id: item.id })}
        activeOpacity={0.7}
        style={styles.projectBody}
      >
        {item.description && (
          <ThemedText variant="body" color={theme.textSecondary} style={styles.projectDescription} numberOfLines={2}>
            {item.description}
          </ThemedText>
        )}

        <View style={styles.projectInfo}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <ThemedText variant="caption" color={theme.textMuted}>已收款</ThemedText>
              <ThemedText variant="body" color={theme.success} style={styles.infoValue}>
                {formatCurrency(item.receivedAmount)}
              </ThemedText>
            </View>
            {item.contractAmount && (
              <View style={styles.infoItem}>
                <ThemedText variant="caption" color={theme.textMuted}>合同</ThemedText>
                <ThemedText variant="body" color={theme.primary} style={styles.infoValue}>
                  {formatCurrency(item.contractAmount)}
                </ThemedText>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <ThemedText variant="caption" color={theme.textMuted}>已开票</ThemedText>
              <ThemedText variant="body" color={theme.primary} style={styles.infoValue}>
                {formatCurrency(item.invoiceAmount ?? 0)}
              </ThemedText>
            </View>
            {item.settlementAmount && (
              <View style={styles.infoItem}>
                <ThemedText variant="caption" color={theme.textMuted}>结算</ThemedText>
                <ThemedText variant="body" color={theme.textSecondary} style={styles.infoValue}>
                  {formatCurrency(item.settlementAmount)}
                </ThemedText>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <ThemedText variant="caption" color={theme.textMuted}>负责人</ThemedText>
              <ThemedText variant="body" color={theme.textPrimary} style={styles.infoValue}>
                {item.manager || '-'}
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <ThemedText variant="caption" color={theme.textMuted}>截止</ThemedText>
              <ThemedText variant="body" color={item.endDate && isOverdue(item.endDate) ? theme.error : theme.textPrimary} style={styles.infoValue}>
                {item.endDate ? formatDate(item.endDate) : '-'}
              </ThemedText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.success;
      case 'completed': return theme.primary;
      case 'paused': return theme.textMuted;
      default: return theme.textMuted;
    }
  };

  const isOverdue = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome6 name="folder-open" size={64} color={theme.textMuted} style={styles.emptyIcon} />
      <ThemedText variant="h4" color={theme.textSecondary} style={styles.emptyText}>
        暂无项目
      </ThemedText>
      <ThemedText variant="body" color={theme.textMuted} style={styles.emptyHint}>
        点击右下角按钮创建第一个项目
      </ThemedText>
    </View>
  );

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ThemedView level="root" style={styles.container}>
        <View style={styles.header}>
          <ThemedText variant="h2" color={theme.textPrimary}>项目列表</ThemedText>
          <TouchableOpacity style={styles.addButton} onPress={handleAddProject}>
            <FontAwesome6 name="plus" size={20} color={theme.buttonPrimaryText} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={projects}
          renderItem={renderProjectItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      </ThemedView>
    </Screen>
  );
}

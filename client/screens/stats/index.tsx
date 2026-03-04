import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';
import { workLogService, exportAllData, importAllData, type WorkerHours } from '@/services/LocalStorage';

interface ProjectHours {
  projectId: number;
  projectName: string;
  totalHours: number;
}

export default function StatsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [statsMode, setStatsMode] = useState<'worker' | 'project'>('worker');
  const [workerStats, setWorkerStats] = useState<WorkerHours[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectHours[]>([]);
  const [showDataModal, setShowDataModal] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      
      // 获取按人员统计
      const workers = await workLogService.getMonthlyStats(year, month);
      setWorkerStats(workers);

      // 获取按项目统计
      const logs = await workLogService.getAll();
      const filteredLogs = logs.filter(log => {
        const logDate = new Date(log.workDate);
        return logDate.getFullYear() === year && logDate.getMonth() === month;
      });

      const projectMap = new Map<number, ProjectHours>();

      filteredLogs.forEach(log => {
        const existing = projectMap.get(log.projectId);
        if (existing) {
          existing.totalHours += log.hours;
        } else {
          projectMap.set(log.projectId, {
            projectId: log.projectId,
            projectName: log.projectName,
            totalHours: log.hours,
          });
        }
      });

      const projects = Array.from(projectMap.values()).sort((a, b) => b.totalHours - a.totalHours);
      setProjectStats(projects);
    } catch (error) {
      console.error('获取统计数据失败:', error);
      Alert.alert('错误', '获取统计数据失败');
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleExportData = async () => {
    try {
      const jsonData = await exportAllData();
      
      const fileName = `workhours_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await (FileSystem as any).writeAsStringAsync(fileUri, jsonData);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: '导出数据',
        });
      } else {
        Alert.alert('成功', `数据已导出到: ${fileUri}`);
      }
      setShowDataModal(false);
    } catch (error: any) {
      console.error('导出失败:', error);
      Alert.alert('错误', error.message || '导出失败');
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const jsonData = await (FileSystem as any).readAsStringAsync(fileUri);

      const importResult = await importAllData(jsonData);

      Alert.alert(
        '导入成功',
        `已导入：\n- 项目：${importResult.projectsCount} 个\n- 人员：${importResult.workersCount} 个\n- 工时记录：${importResult.workLogsCount} 条`,
        [
          { text: '确定', onPress: () => {
            setShowDataModal(false);
            fetchStats();
          }}
        ]
      );
    } catch (error: any) {
      console.error('导入失败:', error);
      Alert.alert('错误', error.message || '导入失败');
    }
  };

  const currentStats = statsMode === 'worker' ? workerStats : projectStats;

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <ThemedText variant="h2" color={theme.textPrimary}>
              月度统计
            </ThemedText>
            <View style={styles.modeSwitch}>
              <TouchableOpacity
                style={[styles.modeButton, statsMode === 'worker' && styles.modeButtonActive]}
                onPress={() => setStatsMode('worker')}
              >
                <ThemedText
                  variant="caption"
                  color={statsMode === 'worker' ? theme.buttonPrimaryText : theme.textSecondary}
                >
                  按人员
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, statsMode === 'project' && styles.modeButtonActive]}
                onPress={() => setStatsMode('project')}
              >
                <ThemedText
                  variant="caption"
                  color={statsMode === 'project' ? theme.buttonPrimaryText : theme.textSecondary}
                >
                  按项目
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setShowDataModal(true)} style={styles.iconButton}>
              <FontAwesome6 name="database" size={20} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
              <FontAwesome6 name="calendar" size={16} color={theme.primary} />
              <ThemedText variant="body" color={theme.primary} style={{ marginLeft: 8 }}>
                {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.list}>
          {currentStats.length === 0 ? (
            <ThemedView level="default" style={styles.emptyState}>
              <FontAwesome6 name="chart-simple" size={48} color={theme.textMuted} />
              <ThemedText variant="body" color={theme.textMuted} style={{ marginTop: 16 }}>
                暂无数据
              </ThemedText>
            </ThemedView>
          ) : (
            currentStats.map((item, index) => (
              <ThemedView key={item.projectId || item.workerId} level="default" style={styles.statCard}>
                <View style={styles.statRank}>
                  <ThemedText variant="h3" color={theme.buttonPrimaryText}>
                    #{index + 1}
                  </ThemedText>
                </View>
                <View style={styles.statInfo}>
                  <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                    {item.projectName || (item as WorkerHours).workerName}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    总工时
                  </ThemedText>
                </View>
                <ThemedText variant="h2" color={theme.primary}>
                  {item.totalHours}天
                </ThemedText>
              </ThemedView>
            ))
          )}
        </ScrollView>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) handleDateChange(date);
            }}
          />
        )}

        <Modal visible={showDataModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <ThemedView level="default" style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText variant="h3" color={theme.textPrimary}>
                  数据管理
                </ThemedText>
                <TouchableOpacity onPress={() => setShowDataModal(false)}>
                  <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <TouchableOpacity style={styles.dataAction} onPress={handleExportData}>
                  <FontAwesome6 name="file-export" size={24} color={theme.primary} />
                  <View style={styles.dataActionText}>
                    <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                      导出数据
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      将所有数据导出为 JSON 文件
                    </ThemedText>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.dataAction} onPress={handleImportData}>
                  <FontAwesome6 name="file-import" size={24} color={theme.primary} />
                  <View style={styles.dataActionText}>
                    <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                      导入数据
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      从 JSON 文件导入数据
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              </View>
            </ThemedView>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
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

interface WorkerRecord {
  date: string;
  projectId: string;
  projectName: string;
  description: string;
  hours: number;
}

interface WorkerStatsWithDetails {
  workerId: string;
  workerName: string;
  totalHours: number;
  records: WorkerRecord[];
}

interface ProjectRecord {
  date: string;
  workerId: string;
  workerName: string;
  description: string;
  hours: number;
}

interface ProjectStatsWithDetails {
  projectId: string;
  projectName: string;
  totalHours: number;
  records: ProjectRecord[];
}

export default function StatsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [statsMode, setStatsMode] = useState<'worker' | 'project'>('worker');
  const [workerStats, setWorkerStats] = useState<WorkerStatsWithDetails[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStatsWithDetails[]>([]);
  const [showDataModal, setShowDataModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const fetchStats = useCallback(async () => {
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      
      // 获取按人员详细统计
      const workers = await workLogService.getMonthlyStats(year, month);
      
      // 获取所有工时记录
      const allLogs = await workLogService.getAllWorkLogs();
      
      // 筛选指定月份的记录
      const monthlyLogs = allLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate.getFullYear() === year && logDate.getMonth() === month;
      });
      
      // 按人员分组详细记录
      const workerMap = new Map<string, WorkerStatsWithDetails>();
      
      workers.forEach(worker => {
        const workerRecords = monthlyLogs
          .filter(log => log.workers.some(w => w.id === worker.workerId))
          .flatMap(log => 
            log.workers
              .filter(w => w.id === worker.workerId)
              .map(w => ({
                date: log.date,
                projectId: log.projectId,
                projectName: log.projectName,
                description: log.description,
                hours: w.hours,
              }))
          );
        
        workerMap.set(worker.workerId, {
          workerId: worker.workerId,
          workerName: worker.workerName,
          totalHours: worker.totalHours,
          records: workerRecords,
        });
      });
      
      setWorkerStats(Array.from(workerMap.values()).sort((a, b) => b.totalHours - a.totalHours));

      // 获取按项目详细统计
      const projects = await workLogService.getProjectStats(year, month);
      
      // 按项目分组详细记录
      const projectMap = new Map<string, ProjectStatsWithDetails>();
      
      projects.forEach(project => {
        const projectRecords = monthlyLogs
          .filter(log => log.projectId === project.projectId)
          .flatMap(log => 
            log.workers.map(w => ({
              date: log.date,
              workerId: w.id,
              workerName: w.name,
              description: log.description,
              hours: w.hours,
            }))
          );
        
        projectMap.set(project.projectId, {
          projectId: project.projectId,
          projectName: project.projectName,
          totalHours: project.totalHours,
          records: projectRecords,
        });
      });
      
      setProjectStats(Array.from(projectMap.values()).sort((a, b) => b.totalHours - a.totalHours));
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

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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
  const totalHours = currentStats.reduce((sum, item) => sum + item.totalHours, 0);

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
                <FontAwesome6 
                  name="user" 
                  size={16} 
                  color={statsMode === 'worker' ? theme.buttonPrimaryText : theme.textSecondary}
                  style={{ marginRight: 6 }}
                />
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
                <FontAwesome6 
                  name="folder" 
                  size={16} 
                  color={statsMode === 'project' ? theme.buttonPrimaryText : theme.textSecondary}
                  style={{ marginRight: 6 }}
                />
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
            <>
              {/* 总计 */}
              <ThemedView level="default" style={styles.totalCard}>
                <ThemedText variant="caption" color={theme.textMuted}>
                  {statsMode === 'worker' ? '人员总计' : '项目总计'}
                </ThemedText>
                <ThemedText variant="h2" color={theme.primary}>
                  {totalHours.toFixed(2)} 工作日
                </ThemedText>
              </ThemedView>

              {/* 列表 */}
              {statsMode === 'worker' ? (
                workerStats.map(item => (
                  <ThemedView key={item.workerId} level="default" style={styles.statsGroup}>
                    <TouchableOpacity
                      style={styles.statsHeader}
                      onPress={() => toggleExpand(item.workerId)}
                    >
                      <View style={styles.statsHeaderLeft}>
                        <ThemedText variant="h3" color={theme.textPrimary}>
                          {item.workerName}
                        </ThemedText>
                        <ThemedText variant="caption" color={theme.textMuted}>
                          共 {item.records.length} 条记录
                        </ThemedText>
                      </View>
                      <View style={styles.statsHeaderRight}>
                        <ThemedText variant="h2" color={theme.primary}>
                          {item.totalHours.toFixed(2)} 工作日
                        </ThemedText>
                        <FontAwesome6
                          name={expandedItems.has(item.workerId) ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={theme.textMuted}
                        />
                      </View>
                    </TouchableOpacity>

                    {expandedItems.has(item.workerId) && (
                      <View style={styles.statsDetails}>
                        {item.records.map((record, index) => (
                          <View key={`${record.date}-${index}`} style={styles.recordItem}>
                            <View style={styles.recordLeft}>
                              <ThemedText variant="caption" color={theme.textMuted}>
                                {record.date}
                              </ThemedText>
                              <ThemedText variant="bodySmall" color={theme.textPrimary}>
                                {record.projectName}
                              </ThemedText>
                              <ThemedText variant="bodySmall" color={theme.textSecondary} style={styles.recordDesc}>
                                {record.description}
                              </ThemedText>
                            </View>
                            <ThemedText variant="bodyMedium" color={theme.primary}>
                              {record.hours} 天
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    )}
                  </ThemedView>
                ))
              ) : (
                projectStats.map(item => (
                  <ThemedView key={item.projectId} level="default" style={styles.statsGroup}>
                    <TouchableOpacity
                      style={styles.statsHeader}
                      onPress={() => toggleExpand(item.projectId)}
                    >
                      <View style={styles.statsHeaderLeft}>
                        <ThemedText variant="h3" color={theme.textPrimary}>
                          {item.projectName}
                        </ThemedText>
                        <ThemedText variant="caption" color={theme.textMuted}>
                          共 {item.records.length} 条记录
                        </ThemedText>
                      </View>
                      <View style={styles.statsHeaderRight}>
                        <ThemedText variant="h2" color={theme.primary}>
                          {item.totalHours.toFixed(2)} 工作日
                        </ThemedText>
                        <FontAwesome6
                          name={expandedItems.has(item.projectId) ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={theme.textMuted}
                        />
                      </View>
                    </TouchableOpacity>

                    {expandedItems.has(item.projectId) && (
                      <View style={styles.statsDetails}>
                        {item.records.map((record, index) => (
                          <View key={`${record.date}-${index}`} style={styles.recordItem}>
                            <View style={styles.recordLeft}>
                              <ThemedText variant="caption" color={theme.textMuted}>
                                {record.date}
                              </ThemedText>
                              <ThemedText variant="bodySmall" color={theme.textPrimary}>
                                {record.workerName}
                              </ThemedText>
                              <ThemedText variant="bodySmall" color={theme.textSecondary} style={styles.recordDesc}>
                                {record.description}
                              </ThemedText>
                            </View>
                            <ThemedText variant="bodyMedium" color={theme.primary}>
                              {record.hours} 天
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    )}
                  </ThemedView>
                ))
              )}
            </>
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

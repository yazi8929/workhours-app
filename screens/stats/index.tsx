import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';
import { workLogService, workerService, projectService } from '@/services/LocalStorage';

interface StatItem {
  id: string;
  name: string;
  totalHours: number;
  workers?: Array<{ id: string; name: string; hours: number }>;
  workRecords?: Array<{
    projectId: string;
    projectName: string;
    date: string;
    description: string;
    hours: number;
  }>;
}

export default function StatsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [activeTab, setActiveTab] = useState<'worker' | 'project'>('worker');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workerStats, setWorkerStats] = useState<StatItem[]>([]);
  const [projectStats, setProjectStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载统计数据
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // 获取项目统计数据
      const projectData = await workLogService.getMonthlyStats(year, month);
      setProjectStats(projectData.projectStats);

      // 获取人员统计数据（需要自己计算）
      const allWorkLogs = await workLogService.getWorkLogs();
      const allWorkers = await workerService.getWorkers();

      // 筛选指定年月的记录
      const filteredLogs = allWorkLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate.getFullYear() === year && logDate.getMonth() === month;
      });

      // 按人员分组统计
      const workerMap = new Map<string, StatItem>();

      filteredLogs.forEach(log => {
        log.workers.forEach(w => {
          if (!workerMap.has(w.id)) {
            const worker = allWorkers.find(wk => wk.id === w.id);
            workerMap.set(w.id, {
              id: w.id,
              name: worker?.name || '未知',
              totalHours: 0,
              workRecords: [],
            });
          }
          const stat = workerMap.get(w.id)!;
          stat.totalHours += w.hours;
          if (stat.workRecords) {
            const existingRecord = stat.workRecords.find(r => r.date === log.date);
            if (existingRecord) {
              existingRecord.hours += w.hours;
            } else {
              stat.workRecords.push({
                projectId: log.projectId,
                projectName: log.projectName,
                date: log.date,
                description: log.description,
                hours: w.hours,
              });
            }
          }
        });
      });

      // 按工时排序
      const workerStatsArray = Array.from(workerMap.values()).sort((a, b) => b.totalHours - a.totalHours);
      setWorkerStats(workerStatsArray);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  // 切换月份
  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  // 复制到剪贴板
  const handleExport = useCallback(async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const monthLabel = `${year}年${month}月`;

      let text = '';
      const currentStats = activeTab === 'worker' ? workerStats : projectStats;

      if (activeTab === 'worker') {
        // 按人员统计
        text = `${monthLabel} 人员工作日统计\n\n`;
        text += `序号\t人员姓名\t工作天数\t总工作日\n`;
        text += `${'─'.repeat(50)}\n`;

        currentStats.forEach((item, index) => {
          // 计算工作天数（去重日期）
          const workDays = item.workRecords
            ? new Set(item.workRecords.map(r => r.date)).size
            : 0;

          text += `${index + 1}\t${item.name}\t${workDays}\t${item.totalHours.toFixed(2)}\n`;

          // 添加详细工作内容
          if (item.workRecords && item.workRecords.length > 0) {
            item.workRecords.forEach(record => {
              text += `\t\t${record.date}\t${record.projectName}\t${record.hours.toFixed(2)}天\t${record.description}\n`;
            });
            text += `\n`; // 每个人之间加空行
          }
        });

        text += `${'─'.repeat(50)}\n`;
        text += `总计：${currentStats.length} 人\t${currentStats.reduce((sum, item) => sum + (item.workRecords ? new Set(item.workRecords.map(r => r.date)).size : 0), 0)} 人天\t${currentStats.reduce((sum, item) => sum + item.totalHours, 0).toFixed(2)} 工作日`;
      } else {
        // 按项目统计
        text = `${monthLabel} 项目工作日统计\n\n`;
        text += `序号\t项目名称\t人员姓名\t工作日\n`;
        text += `${'─'.repeat(50)}\n`;
        let globalIndex = 1;
        currentStats.forEach(project => {
          if (project.workers && project.workers.length > 0) {
            project.workers.forEach(worker => {
              text += `${globalIndex}\t${project.name}\t${worker.name}\t${worker.hours.toFixed(2)}\n`;
              globalIndex++;
            });
          } else {
            text += `${globalIndex}\t${project.name}\t无人员\t0\n`;
            globalIndex++;
          }
        });
        text += `\n总计：${currentStats.reduce((sum, item) => sum + item.totalHours, 0).toFixed(2)} 工作日`;
      }

      await Clipboard.setStringAsync(text);
      Alert.alert('成功', '数据已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      Alert.alert('错误', '复制失败');
    }
  }, [activeTab, currentDate, workerStats, projectStats]);

  const monthLabel = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
  const currentStats = activeTab === 'worker' ? workerStats : projectStats;
  const totalHours = currentStats.reduce((sum, item) => sum + item.totalHours, 0);

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <View style={styles.container}>
        {/* 头部 */}
        <ThemedView level="default" style={styles.headerCard}>
          <View style={styles.headerTitleRow}>
            <ThemedText variant="h2" color={theme.textPrimary}>
              月度统计
            </ThemedText>
            <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
              <FontAwesome6 name="clipboard" size={18} color={theme.buttonPrimaryText} />
              <ThemedText variant="caption" color={theme.buttonPrimaryText} style={styles.exportButtonText}>
                复制
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* 月份选择器 */}
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <FontAwesome6 name="chevron-left" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
            <ThemedText variant="bodyMedium" color={theme.textPrimary}>
              {monthLabel}
            </ThemedText>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <FontAwesome6 name="chevron-right" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* Tab 切换 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'worker' && styles.tabActive]}
            onPress={() => setActiveTab('worker')}
          >
            <ThemedText
              variant="body"
              color={activeTab === 'worker' ? theme.buttonPrimaryText : theme.textSecondary}
            >
              按人员统计
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'project' && styles.tabActive]}
            onPress={() => setActiveTab('project')}
          >
            <ThemedText
              variant="body"
              color={activeTab === 'project' ? theme.buttonPrimaryText : theme.textSecondary}
            >
              按项目统计
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* 统计列表 */}
        <ScrollView contentContainerStyle={styles.listContent}>
          {loading ? (
            <ThemedView level="default" style={styles.emptyState}>
              <ThemedText variant="caption" color={theme.textMuted}>
                加载中...
              </ThemedText>
            </ThemedView>
          ) : currentStats.length === 0 ? (
            <ThemedView level="default" style={styles.emptyState}>
              <ThemedText variant="caption" color={theme.textMuted}>
                {monthLabel} 暂无数据
              </ThemedText>
            </ThemedView>
          ) : (
            <>
              {/* 总计 */}
              <ThemedView level="default" style={styles.totalCard}>
                <ThemedText variant="caption" color={theme.textMuted}>
                  {activeTab === 'worker' ? '人员总计' : '项目总计'}
                </ThemedText>
                <ThemedText variant="h2" color={theme.primary}>
                  {totalHours.toFixed(2)} 工作日
                </ThemedText>
              </ThemedView>

              {/* 列表 */}
              {currentStats.map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth() + 1;

                    if (activeTab === 'worker') {
                      router.push('/worker-detail', {
                        workerId: item.id,
                        workerName: item.name,
                        year: year.toString(),
                        month: month.toString(),
                      });
                    } else {
                      router.push('/project-detail', {
                        projectId: item.id,
                        projectName: item.name,
                        year: year.toString(),
                        month: month.toString(),
                      });
                    }
                  }}
                >
                  <ThemedView level="default" style={styles.statCard}>
                    <View style={styles.statContent}>
                      <View style={styles.statNameRow}>
                        <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                          {item.name}
                        </ThemedText>
                        <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
                      </View>

                      {/* 按项目统计时显示人员明细 */}
                      {activeTab === 'project' && item.workers && item.workers.length > 0 && (
                        <View style={styles.workersDetail}>
                          {item.workers.map(worker => (
                            <View key={worker.id} style={styles.workerRow}>
                              <FontAwesome6 name="user" size={12} color={theme.textMuted} />
                              <ThemedText variant="caption" color={theme.textSecondary} style={styles.workerName}>
                                {worker.name}
                              </ThemedText>
                              <ThemedText variant="caption" color={theme.primary}>
                                {worker.hours}天
                              </ThemedText>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* 按人员统计时显示工作记录明细 */}
                      {activeTab === 'worker' && item.workRecords && item.workRecords.length > 0 && (
                        <View style={styles.workRecordsDetail}>
                          {item.workRecords.slice(0, 3).map((record, index) => (
                            <View key={`${record.date}-${index}`} style={styles.workRecordRow}>
                              <View style={styles.workRecordHeader}>
                                <FontAwesome6 name="calendar" size={12} color={theme.textMuted} />
                                <ThemedText variant="caption" color={theme.textSecondary} style={styles.recordDate}>
                                  {record.date}
                                </ThemedText>
                                <ThemedText variant="caption" color={theme.primary}>
                                  {record.hours}天
                                </ThemedText>
                              </View>
                              <View style={styles.workRecordProject}>
                                <FontAwesome6 name="folder" size={12} color={theme.primary} />
                                <ThemedText variant="caption" color={theme.textSecondary} style={styles.recordProjectName}>
                                  {record.projectName}
                                </ThemedText>
                              </View>
                              <ThemedText variant="caption" color={theme.textMuted} style={styles.recordDesc} numberOfLines={2}>
                                {record.description}
                              </ThemedText>
                            </View>
                          ))}
                          {item.workRecords.length > 3 && (
                            <ThemedText variant="caption" color={theme.textMuted} style={styles.moreText}>
                              还有 {item.workRecords.length - 3} 条记录...
                            </ThemedText>
                          )}
                        </View>
                      )}
                    </View>
                    <View style={styles.statHours}>
                      <ThemedText variant="h3" color={theme.primary}>
                        {item.totalHours.toFixed(2)}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        工作日
                      </ThemedText>
                    </View>
                  </ThemedView>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}

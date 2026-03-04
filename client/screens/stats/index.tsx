import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';
import { workLogService, type WorkerHours } from '@/services/LocalStorage';

export default function StatsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stats, setStats] = useState<WorkerHours[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const data = await workLogService.getMonthlyStats(year, month);
      setStats(data);
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

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText variant="h2" color={theme.textPrimary}>
            月度统计
          </ThemedText>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
            <FontAwesome6 name="calendar" size={16} color={theme.primary} />
            <ThemedText variant="body" color={theme.primary} style={{ marginLeft: 8 }}>
              {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.list}>
          {stats.length === 0 ? (
            <ThemedView level="default" style={styles.emptyState}>
              <FontAwesome6 name="chart-simple" size={48} color={theme.textMuted} />
              <ThemedText variant="body" color={theme.textMuted} style={{ marginTop: 16 }}>
                暂无数据
              </ThemedText>
            </ThemedView>
          ) : (
            stats.map((item, index) => (
              <ThemedView key={item.workerId} level="default" style={styles.statCard}>
                <View style={styles.statRank}>
                  <ThemedText variant="h3" color={theme.buttonPrimaryText}>
                    #{index + 1}
                  </ThemedText>
                </View>
                <View style={styles.statInfo}>
                  <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                    {item.workerName}
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
      </View>
    </Screen>
  );
}

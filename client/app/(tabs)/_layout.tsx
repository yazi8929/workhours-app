import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.backgroundDefault,
          borderTopColor: theme.border,
          height: Platform.OS === 'web' ? 60 : 50 + insets.bottom,
          paddingBottom: Platform.OS === 'web' ? 0 : insets.bottom,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarItemStyle: {
          height: Platform.OS === 'web' ? 60 : undefined,
        },
      }}
    >
      {/* 首页 - 数据概览 */}
      <Tabs.Screen
        name="index"
        options={{
          title: '概览',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="chart-simple" size={20} color={color} />
          ),
        }}
      />
      {/* 项目列表 */}
      <Tabs.Screen
        name="projects"
        options={{
          title: '项目',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="folder-open" size={20} color={color} />
          ),
        }}
      />
      {/* 统计分析 */}
      <Tabs.Screen
        name="stats"
        options={{
          title: '统计',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="chart-pie" size={20} color={color} />
          ),
        }}
      />
      {/* 支出记录 */}
      <Tabs.Screen
        name="expenses"
        options={{
          title: '支出',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="wallet" size={20} color={color} />
          ),
        }}
      />
      {/* 数据管理 */}
      <Tabs.Screen
        name="data"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="user" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

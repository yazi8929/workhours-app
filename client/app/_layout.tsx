import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { ColorSchemeProvider } from '@/hooks/useColorScheme';

// 防止启动页自动隐藏
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // 延迟隐藏启动页，确保应用完全加载
    const hideSplash = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('隐藏启动页失败:', e);
      }
    };
    
    hideSplash();
  }, []);

  return (
    <ColorSchemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="projects/detail" />
          <Stack.Screen name="projects/add" />
          <Stack.Screen name="projects/edit" />
          <Stack.Screen name="transactions/add" />
          <Stack.Screen name="expenses/categories" />
          <Stack.Screen name="expenses/add" />
        </Stack>
      </GestureHandlerRootView>
    </ColorSchemeProvider>
  );
}

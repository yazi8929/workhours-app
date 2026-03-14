import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ColorSchemeProvider } from '@/hooks/useColorScheme';

export default function RootLayout() {
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

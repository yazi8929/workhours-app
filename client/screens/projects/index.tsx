import React from 'react';
import { View, Text } from 'react-native';
import { Screen } from '@/components/Screen';

export default function ProjectsScreen() {
  return (
    <Screen backgroundColor="#FFFFFF" statusBarStyle="dark">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 20, color: '#000000', textAlign: 'center' }}>
          项目列表页面
        </Text>
        <Text style={{ fontSize: 16, color: '#666666', marginTop: 20, textAlign: 'center' }}>
          如果你看到这个文字，说明应用已经正常启动了！
        </Text>
      </View>
    </Screen>
  );
}

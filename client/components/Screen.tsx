import React from 'react';
import { Platform, StyleSheet, View, KeyboardAvoidingView, ViewStyle } from 'react-native';
import { useSafeAreaInsets, Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

interface ScreenProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'auto' | 'inverted' | 'light' | 'dark';
  statusBarColor?: string;
  safeAreaEdges?: Edge[];
  style?: ViewStyle;
}

export const Screen = ({
  children,
  backgroundColor = '#fff',
  statusBarStyle = 'dark',
  statusBarColor = 'transparent',
  safeAreaEdges = ['top', 'left', 'right', 'bottom'],
  style,
}: ScreenProps) => {
  const insets = useSafeAreaInsets();
  const hasTop = safeAreaEdges.includes('top');
  const hasBottom = safeAreaEdges.includes('bottom');
  const hasLeft = safeAreaEdges.includes('left');
  const hasRight = safeAreaEdges.includes('right');

  return (
    <View style={{
      flex: 1,
      backgroundColor,
      paddingTop: hasTop ? insets.top : 0,
      paddingLeft: hasLeft ? insets.left : 0,
      paddingRight: hasRight ? insets.right : 0,
      paddingBottom: hasBottom ? insets.bottom : 0,
    }}>
      <StatusBar style={statusBarStyle} backgroundColor={statusBarColor} translucent />
      <KeyboardAvoidingView style={[styles.container, style]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {children}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({ container: { flex: 1 } });

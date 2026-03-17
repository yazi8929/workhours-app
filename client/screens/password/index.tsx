import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { PasswordStorage } from '@/utils/password';
import { createStyles } from './styles';

interface PasswordScreenProps {
  mode: 'set' | 'verify';
  onSuccess: () => void;
}

export default function PasswordScreen({ mode, onSuccess }: PasswordScreenProps) {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 清除错误
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 设置密码
  const handleSetPassword = useCallback(async () => {
    // 清除之前的错误
    setError('');
    
    if (password.length < 4) {
      setError('密码至少需要4位');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    try {
      const success = await PasswordStorage.setPassword(password);
      if (success) {
        onSuccess();
      } else {
        setError('设置密码失败，请重试');
      }
    } catch (e) {
      console.error('Set password error:', e);
      setError('设置密码失败');
    } finally {
      setIsLoading(false);
    }
  }, [password, confirmPassword, onSuccess]);

  // 验证密码
  const handleVerifyPassword = useCallback(async () => {
    setError('');
    
    if (!password) {
      setError('请输入密码');
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await PasswordStorage.verifyPassword(password);
      if (isValid) {
        onSuccess();
      } else {
        setError('密码错误，请重试');
        setPassword('');
      }
    } catch (e) {
      console.error('Verify password error:', e);
      setError('验证失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [password, onSuccess]);

  const handleButtonPress = useCallback(() => {
    if (mode === 'set') {
      handleSetPassword();
    } else {
      handleVerifyPassword();
    }
  }, [mode, handleSetPassword, handleVerifyPassword]);

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ThemedView level="root" style={styles.container}>
        {/* Logo 区域 */}
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { backgroundColor: theme.primary }]}>
            <FontAwesome6 name="lock" size={40} color="#fff" />
          </View>
          <ThemedText variant="h2" color={theme.textPrimary} style={styles.title}>
            联智记帐
          </ThemedText>
          <ThemedText variant="body" color={theme.textSecondary} style={styles.subtitle}>
            {mode === 'set' ? '首次使用，请设置访问密码' : '请输入密码以继续'}
          </ThemedText>
        </View>

        {/* 输入区域 */}
        <View style={styles.inputSection}>
          {mode === 'set' ? (
            <>
              <View style={styles.inputGroup}>
                <ThemedText variant="body" color={theme.textSecondary} style={styles.label}>
                  设置密码
                </ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundTertiary, borderColor: theme.border }]}>
                  <FontAwesome6 name="key" size={18} color={theme.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary }]}
                    placeholder="请输入密码（至少4位）"
                    placeholderTextColor={theme.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    keyboardType="numeric"
                    maxLength={20}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText variant="body" color={theme.textSecondary} style={styles.label}>
                  确认密码
                </ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundTertiary, borderColor: theme.border }]}>
                  <FontAwesome6 name="check-double" size={18} color={theme.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary }]}
                    placeholder="请再次输入密码"
                    placeholderTextColor={theme.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    keyboardType="numeric"
                    maxLength={20}
                    returnKeyType="done"
                    onSubmitEditing={handleButtonPress}
                  />
                </View>
              </View>
            </>
          ) : (
            <View style={styles.inputGroup}>
              <ThemedText variant="body" color={theme.textSecondary} style={styles.label}>
                输入密码
              </ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundTertiary, borderColor: theme.border }]}>
                <FontAwesome6 name="lock" size={18} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder="请输入访问密码"
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={20}
                  returnKeyType="done"
                  onSubmitEditing={handleButtonPress}
                />
              </View>
            </View>
          )}

          {/* 错误提示 */}
          {error ? (
            <View style={styles.errorContainer}>
              <FontAwesome6 name="circle-exclamation" size={14} color={theme.error} />
              <ThemedText variant="body" color={theme.error} style={styles.errorText}>
                {error}
              </ThemedText>
            </View>
          ) : null}
        </View>

        {/* 按钮区域 */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={handleButtonPress}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText}>
              {isLoading ? '处理中...' : (mode === 'set' ? '确认设置' : '进入应用')}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* 提示区域 */}
        <View style={styles.hintSection}>
          <FontAwesome6 name="shield-halved" size={14} color={theme.textMuted} />
          <ThemedText variant="caption" color={theme.textMuted} style={styles.hintText}>
            密码用于保护您的数据安全，请妥善保管
          </ThemedText>
        </View>
      </ThemedView>
    </Screen>
  );
}

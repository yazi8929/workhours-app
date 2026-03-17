import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Keyboard,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { PasswordStorage } from '@/utils/password';

interface PasswordScreenProps {
  mode: 'set' | 'verify';
  onSuccess: () => void;
}

export default function PasswordScreen({ mode, onSuccess }: PasswordScreenProps) {
  const insets = useSafeAreaInsets();

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
  const handleSetPassword = async () => {
    console.log('=== handleSetPassword 开始 ===');
    Keyboard.dismiss();
    setError('');
    
    console.log('密码长度:', password.length);
    console.log('确认密码长度:', confirmPassword.length);
    
    if (password.length < 4) {
      console.log('密码太短');
      setError('密码至少需要4位');
      return;
    }

    if (password !== confirmPassword) {
      console.log('密码不一致');
      setError('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    console.log('开始设置密码...');
    
    try {
      const success = await PasswordStorage.setPassword(password);
      console.log('PasswordStorage.setPassword 返回:', success);
      
      if (success) {
        console.log('密码设置成功，调用 onSuccess');
        Alert.alert('成功', '密码设置成功', [
          { text: '确定', onPress: () => onSuccess() }
        ]);
      } else {
        console.log('密码设置失败');
        setError('设置密码失败，请重试');
      }
    } catch (e) {
      console.error('设置密码异常:', e);
      setError('设置密码失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 验证密码
  const handleVerifyPassword = async () => {
    console.log('=== handleVerifyPassword 开始 ===');
    Keyboard.dismiss();
    setError('');
    
    if (!password) {
      setError('请输入密码');
      return;
    }

    setIsLoading(true);
    console.log('开始验证密码...');
    
    try {
      const isValid = await PasswordStorage.verifyPassword(password);
      console.log('PasswordStorage.verifyPassword 返回:', isValid);
      
      if (isValid) {
        console.log('密码验证成功，调用 onSuccess');
        Alert.alert('成功', '验证成功', [
          { text: '确定', onPress: () => onSuccess() }
        ]);
      } else {
        console.log('密码错误');
        setError('密码错误，请重试');
        setPassword('');
      }
    } catch (e) {
      console.error('验证密码异常:', e);
      setError('验证失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonPress = () => {
    console.log('=== 按钮被点击 ===');
    console.log('当前模式:', mode);
    
    if (isLoading) {
      console.log('正在加载中，忽略点击');
      return;
    }
    
    if (mode === 'set') {
      handleSetPassword();
    } else {
      handleVerifyPassword();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Logo 区域 */}
      <View style={styles.logoSection}>
        <View style={styles.logoContainer}>
          <FontAwesome6 name="lock" size={40} color="#fff" />
        </View>
        <Text style={styles.title}>联智记帐</Text>
        <Text style={styles.subtitle}>
          {mode === 'set' ? '首次使用，请设置访问密码' : '请输入密码以继续'}
        </Text>
      </View>

      {/* 输入区域 */}
      <View style={styles.inputSection}>
        {mode === 'set' ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>设置密码</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="请输入密码（至少4位）"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    console.log('密码输入:', text);
                    setPassword(text);
                  }}
                  secureTextEntry
                  maxLength={20}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>确认密码</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="请再次输入密码"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    console.log('确认密码输入:', text);
                    setConfirmPassword(text);
                  }}
                  secureTextEntry
                  maxLength={20}
                  autoCapitalize="none"
                  returnKeyType="done"
                />
              </View>
            </View>
          </>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>输入密码</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="请输入访问密码"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={(text) => {
                  console.log('密码输入:', text);
                  setPassword(text);
                }}
                secureTextEntry
                maxLength={20}
                autoCapitalize="none"
                returnKeyType="done"
              />
            </View>
          </View>
        )}

        {/* 错误提示 */}
        {error ? (
          <View style={styles.errorContainer}>
            <FontAwesome6 name="circle-exclamation" size={14} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      {/* 按钮 - 使用最简单的方式 */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
          onPress={handleButtonPress}
          disabled={isLoading}
          activeOpacity={0.5}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '处理中...' : (mode === 'set' ? '确认设置' : '进入应用')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 提示 */}
      <View style={[styles.hintSection, { bottom: insets.bottom + 20 }]}>
        <FontAwesome6 name="shield-halved" size={14} color="#9CA3AF" />
        <Text style={styles.hintText}>
          密码用于保护您的数据安全
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  inputSection: {
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    color: '#1F2937',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 8,
  },
  buttonSection: {
    marginTop: 32,
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  hintSection: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
});

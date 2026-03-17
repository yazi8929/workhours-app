import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
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
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirm, setHideConfirm] = useState(true);

  // 清除错误
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 设置密码
  const handleSetPassword = async () => {
    Keyboard.dismiss();
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
  };

  // 验证密码
  const handleVerifyPassword = async () => {
    Keyboard.dismiss();
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
  };

  const handleButtonPress = () => {
    if (mode === 'set') {
      handleSetPassword();
    } else {
      handleVerifyPassword();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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
              {/* 设置密码输入框 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>设置密码</Text>
                <View style={styles.inputWrapper}>
                  <FontAwesome6 name="key" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="请输入密码（至少4位，支持数字和英文）"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={hidePassword}
                    maxLength={20}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    onPress={() => setHidePassword(!hidePassword)}
                    style={styles.eyeButton}
                  >
                    <FontAwesome6 
                      name={hidePassword ? "eye" : "eye-slash"} 
                      size={18} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 确认密码输入框 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>确认密码</Text>
                <View style={styles.inputWrapper}>
                  <FontAwesome6 name="check-double" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="请再次输入密码"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={hideConfirm}
                    maxLength={20}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleButtonPress}
                  />
                  <TouchableOpacity 
                    onPress={() => setHideConfirm(!hideConfirm)}
                    style={styles.eyeButton}
                  >
                    <FontAwesome6 
                      name={hideConfirm ? "eye" : "eye-slash"} 
                      size={18} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            /* 验证密码输入框 */
            <View style={styles.inputGroup}>
              <Text style={styles.label}>输入密码</Text>
              <View style={styles.inputWrapper}>
                <FontAwesome6 name="lock" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="请输入访问密码"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={hidePassword}
                  maxLength={20}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleButtonPress}
                />
                <TouchableOpacity 
                  onPress={() => setHidePassword(!hidePassword)}
                  style={styles.eyeButton}
                >
                  <FontAwesome6 
                    name={hidePassword ? "eye" : "eye-slash"} 
                    size={18} 
                    color="#9CA3AF" 
                  />
                </TouchableOpacity>
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

        {/* 按钮区域 */}
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
          onPress={handleButtonPress}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '处理中...' : (mode === 'set' ? '确认设置' : '进入应用')}
          </Text>
        </TouchableOpacity>

        {/* 提示区域 */}
        <View style={styles.hintSection}>
          <FontAwesome6 name="shield-halved" size={14} color="#9CA3AF" />
          <Text style={styles.hintText}>
            密码用于保护您的数据安全，请妥善保管
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 32,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 48,
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
    marginTop: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    height: '100%',
  },
  eyeButton: {
    padding: 8,
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
  primaryButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 48,
    left: 32,
    right: 32,
  },
  hintText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
    textAlign: 'center',
  },
});

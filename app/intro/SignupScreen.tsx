import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '@/constants/config/api';

const SignupScreen = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: '' }); // Clear the error when the user starts typing
  };

  const validateFields = () => {
    let newErrors = {};
    if (!form.firstName) newErrors.firstName = 'First name is required';
    if (!form.lastName) newErrors.lastName = 'Last name is required';
    if (!form.username) newErrors.username = 'Username is required';
    if (!form.email) newErrors.email = 'Email is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email address';
    if (!form.password) newErrors.password = 'Password is required';
    if (form.password && form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateFields()) return;
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          first_name: form.firstName,
          last_name: form.lastName,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Account created successfully!', [{ text: 'OK', onPress: () => router.replace('/intro/LoginScreen') }]);
        setForm({ firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: '' });
      } else {
        setErrors(data);
        Alert.alert('Error', 'Failed to create account. Please check your inputs.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <Text style={styles.title}>Sign Up</Text>

          {/* First Name Input */}
          <View style={[styles.inputContainer, errors.firstName && styles.errorBackground]}>
            <Ionicons name="person-outline" size={20} color={Colors.light.textSecondary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor={Colors.light.textSecondary}
              value={form.firstName}
              onChangeText={(text) => handleChange('firstName', text)}
            />
          </View>
          {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

          {/* Last Name Input */}
          <View style={[styles.inputContainer, errors.lastName && styles.errorBackground]}>
            <Ionicons name="person-outline" size={20} color={Colors.light.textSecondary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor={Colors.light.textSecondary}
              value={form.lastName}
              onChangeText={(text) => handleChange('lastName', text)}
            />
          </View>
          {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

          {/* Username Input */}
          <View style={[styles.inputContainer, errors.username && styles.errorBackground]}>
            <Ionicons name="person-outline" size={20} color={Colors.light.textSecondary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={Colors.light.textSecondary}
              value={form.username}
              onChangeText={(text) => handleChange('username', text)}
            />
          </View>
          {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

          {/* Email Input */}
          <View style={[styles.inputContainer, errors.email && styles.errorBackground]}>
            <Ionicons name="mail-outline" size={20} color={Colors.light.textSecondary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.light.textSecondary}
              value={form.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Password Input */}
          <View style={[styles.inputContainer, errors.password && styles.errorBackground]}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.light.textSecondary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.light.textSecondary}
              value={form.password}
              onChangeText={(text) => handleChange('password', text)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {/* Confirm Password Input */}
          <View style={[styles.inputContainer, errors.confirmPassword && styles.errorBackground]}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.light.textSecondary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={Colors.light.textSecondary}
              value={form.confirmPassword}
              onChangeText={(text) => handleChange('confirmPassword', text)}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
              <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

          {/* Sign Up Button */}
          <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color={Colors.light.background} /> : <Text style={styles.buttonText}>Sign Up</Text>}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.light.textPrimary, marginBottom: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderColor: Colors.light.textSecondary,
  },
  errorBackground: {
    backgroundColor: '#FFEBEE', // Light red background for error
  },
  icon: { marginRight: 10 },
  input: { flex: 1, color: Colors.light.textPrimary },
  eyeIcon: { marginLeft: 10 },
  button: { backgroundColor: Colors.light.primary, width: '100%', height: 56, justifyContent: 'center', alignItems: 'center', borderRadius: 40, marginTop: 10 },
  buttonText: { color: Colors.light.background, fontWeight: '600', fontSize: 16 },
  errorText: { color: 'red', fontSize: 12, marginBottom: 10, alignSelf: 'flex-start' },
});

export default SignupScreen;
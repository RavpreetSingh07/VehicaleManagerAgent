import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const login = async () => {
    if (!email || !password) {
      Alert.alert(
        'Missing details',
        'Please enter your email and password.'
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Login failed', error.message);
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#000000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>VMA</Text>

        <Text style={styles.title}>Welcome Back</Text>

        <Text style={styles.subtitle}>
          Login to your Vehicle Manager
        </Text>

        <Text style={styles.label}>Email</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#555555"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Password</Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter your password"
            placeholderTextColor="#555555"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />

          <Pressable
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeText}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.button}
          onPress={login}
        >
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/auth/signup')}
        >
          <Text style={styles.signupText}>
            New to VMA? Create an account
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#000000',
    padding: 25,
    justifyContent: 'center',
  },

  logo: {
    fontSize: 52,
    fontWeight: '900',
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 3,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    color: '#FFFFFF',
  },

  subtitle: {
    fontSize: 16,
    color: '#777777',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 35,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    marginTop: 15,
  },

  input: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 14,
    paddingLeft: 16,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },

  eyeText: {
    paddingHorizontal: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  button: {
    backgroundColor: '#FFFFFF',
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 30,
  },

  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
  },

  signupText: {
    textAlign: 'center',
    marginTop: 25,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
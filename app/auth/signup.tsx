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

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const signup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert(
        'Missing details',
        'Please fill in all the fields.'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Password mismatch',
        'The passwords do not match.'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Password too short',
        'Password must be at least 6 characters.'
      );
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert('Signup failed', error.message);
      return;
    }

    Alert.alert(
      'Account created',
      'Your account has been created successfully.',
      [
        {
          text: 'Continue',
          onPress: () => router.replace('/auth/login'),
        },
      ]
    );
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

        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.subtitle}>
          Create your Vehicle Manager account
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
            placeholder="Create a password"
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

        <Text style={styles.label}>Confirm Password</Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter password again"
            placeholderTextColor="#555555"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />

          <Pressable
            onPress={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
          >
            <Text style={styles.eyeText}>
              {showConfirmPassword ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.button}
          onPress={signup}
        >
          <Text style={styles.buttonText}>
            Create Account
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace('/auth/login')}
        >
          <Text style={styles.loginText}>
            Already have an account? Login
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
    marginBottom: 25,
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

  loginText: {
    textAlign: 'center',
    marginTop: 25,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
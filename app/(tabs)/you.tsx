import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { authenticateWithBiometrics } from '../../lib/biometric';
import { supabase } from '../../lib/supabase';

export default function YouScreen() {
  const [email, setEmail] = useState('');
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);

  useEffect(() => {
    loadUser();
    loadFaceIdSetting();
  }, []);

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setEmail(user.email ?? '');
    }
  };

  const loadFaceIdSetting = async () => {
    const value = await AsyncStorage.getItem(
      'faceIdEnabled'
    );

    setFaceIdEnabled(value === 'true');
  };

  const toggleFaceId = async (value: boolean) => {
    if (value) {
      const authenticated =
        await authenticateWithBiometrics();

      if (!authenticated) {
        Alert.alert(
          'Face ID not enabled',
          'Face ID authentication was not completed.'
        );
        return;
      }
    }

    setFaceIdEnabled(value);

    await AsyncStorage.setItem(
      'faceIdEnabled',
      value ? 'true' : 'false'
    );
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem('faceIdEnabled');

    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You</Text>

      <View style={styles.profileCard}>
        <Text style={styles.profileTitle}>
          Account
        </Text>

        <Text style={styles.email}>
          {email}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Security
      </Text>

      <View style={styles.settingRow}>
        <View>
          <Text style={styles.settingTitle}>
            Face ID
          </Text>

          <Text style={styles.settingSubtitle}>
            Use Face ID to unlock VMA
          </Text>
        </View>

        <Switch
          value={faceIdEnabled}
          onValueChange={toggleFaceId}
          trackColor={{
            false: '#292929',
            true: '#FFFFFF',
          }}
          thumbColor={
            faceIdEnabled ? '#000000' : '#777777'
          }
        />
      </View>

      <Text style={styles.sectionTitle}>
        Account
      </Text>

      <Pressable style={styles.option}>
        <Text style={styles.optionText}>
          Change Password
        </Text>
      </Pressable>

      <Pressable
        style={styles.logoutButton}
        onPress={logout}
      >
        <Text style={styles.logoutText}>
          Log Out
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 25,
    paddingTop: 70,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 30,
  },

  profileCard: {
    backgroundColor: '#111111',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#292929',
  },

  profileTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },

  email: {
    fontSize: 16,
    color: '#777777',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 30,
    marginBottom: 12,
  },

  settingRow: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#292929',
  },

  settingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  settingSubtitle: {
    fontSize: 14,
    color: '#777777',
    marginTop: 4,
  },

  option: {
    backgroundColor: '#111111',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#292929',
  },

  optionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  logoutButton: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 35,
  },

  logoutText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '800',
  },
});
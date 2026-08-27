import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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

export default function AddVehicleScreen() {
  const [vehicleName, setVehicleName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [currentKm, setCurrentKm] = useState('');
  const [lastServiceDate, setLastServiceDate] = useState('');
  const [lastServiceKm, setLastServiceKm] = useState('');

  const [saving, setSaving] = useState(false);

  const saveVehicle = async () => {
    if (!vehicleName || !registrationNumber) {
      Alert.alert(
        'Missing details',
        'Please enter vehicle name and registration number.'
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          'Not logged in',
          'Please login first.'
        );
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('vehicles')
        .insert({
          user_id: user.id,
          vehicle_name: vehicleName,
          registration_number: registrationNumber,
          registration_date:
            registrationDate || null,
          current_km: currentKm
            ? Number(currentKm)
            : null,
          last_service_date:
            lastServiceDate || null,
          last_service_km: lastServiceKm
            ? Number(lastServiceKm)
            : null,
        });

      if (error) {
        Alert.alert(
          'Save failed',
          error.message
        );
        setSaving(false);
        return;
      }

      Alert.alert(
        'Success',
        'Vehicle saved successfully.'
      );

      router.replace('/(tabs)');
    } catch (error) {
      console.log(
        'Save vehicle error:',
        error
      );

      Alert.alert(
        'Error',
        'Something went wrong while saving the vehicle.'
      );
    }

    setSaving(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backArrow}>
              ‹
            </Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            Add Vehicle
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* INTRO */}

        <Text style={styles.title}>
          Your Vehicle
        </Text>

        <Text style={styles.subtitle}>
          Add your vehicle details to start
          managing everything with VMA.
        </Text>

        {/* FORM */}

        <View style={styles.formCard}>

          {/* VEHICLE */}

          <Text style={styles.sectionLabel}>
            VEHICLE DETAILS
          </Text>

          <Text style={styles.label}>
            VEHICLE NAME / MODEL
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Maruti Brezza"
            placeholderTextColor="#555555"
            value={vehicleName}
            onChangeText={setVehicleName}
          />

          <Text style={styles.label}>
            REGISTRATION NUMBER
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. PB07AB1234"
            placeholderTextColor="#555555"
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>
            REGISTRATION DATE
          </Text>

          <TextInput
            style={styles.input}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#555555"
            value={registrationDate}
            onChangeText={setRegistrationDate}
          />

          {/* USAGE */}

          <Text style={styles.sectionLabel}>
            VEHICLE USAGE
          </Text>

          <Text style={styles.label}>
            CURRENT KILOMETRES
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. 45000"
            placeholderTextColor="#555555"
            value={currentKm}
            onChangeText={setCurrentKm}
            keyboardType="numeric"
          />

          {/* SERVICE */}

          <Text style={styles.sectionLabel}>
            LAST SERVICE
          </Text>

          <Text style={styles.label}>
            LAST SERVICE DATE
          </Text>

          <TextInput
            style={styles.input}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#555555"
            value={lastServiceDate}
            onChangeText={setLastServiceDate}
          />

          <Text style={styles.label}>
            LAST SERVICE KILOMETRES
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. 40000"
            placeholderTextColor="#555555"
            value={lastServiceKm}
            onChangeText={setLastServiceKm}
            keyboardType="numeric"
          />

          {/* SAVE */}

          <Pressable
            style={[
              styles.button,
              saving && styles.buttonDisabled,
            ]}
            onPress={saveVehicle}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator
                color="#000000"
              />
            ) : (
              <>
                <Text style={styles.buttonText}>
                  Save Vehicle
                </Text>

                <Text style={styles.buttonArrow}>
                  →
                </Text>
              </>
            )}
          </Pressable>

        </View>

        {/* INFO */}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            VMA VEHICLE TRACKING
          </Text>

          <Text style={styles.infoText}>
            Your vehicle details help VMA
            calculate mileage, track servicing
            and manage your vehicle records.
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },

  container: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 60,
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: {
    color: '#FFFFFF',
    fontSize: 32,
    marginTop: -4,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  headerSpacer: {
    width: 42,
  },

  /* INTRO */

  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },

  subtitle: {
    color: '#777777',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 25,
  },

  /* FORM */

  formCard: {
    backgroundColor: '#111111',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#292929',
  },

  sectionLabel: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 5,
    marginBottom: 2,
  },

  label: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 20,
    marginBottom: 8,
  },

  input: {
    height: 52,
    backgroundColor: '#191919',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#292929',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
  },

  /* SAVE BUTTON */

  button: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 28,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },

  buttonArrow: {
    color: '#000000',
    fontSize: 24,
  },

  /* INFO */

  infoCard: {
    backgroundColor: '#0D0D0D',
    borderRadius: 22,
    padding: 20,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#222222',
  },

  infoTitle: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },

  infoText: {
    color: '#777777',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
});
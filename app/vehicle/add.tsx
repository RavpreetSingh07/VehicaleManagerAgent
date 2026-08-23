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
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function AddVehicleScreen() {
  const [vehicleName, setVehicleName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [currentKm, setCurrentKm] = useState('');
  const [lastServiceDate, setLastServiceDate] = useState('');
  const [lastServiceKm, setLastServiceKm] = useState('');

  const saveVehicle = async () => {
    if (!vehicleName || !registrationNumber) {
      Alert.alert(
        'Missing details',
        'Please enter vehicle name and registration number.'
      );
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Not logged in', 'Please login first.');
      return;
    }

    const { error } = await supabase
      .from('vehicles')
      .insert({
        user_id: user.id,
        vehicle_name: vehicleName,
        registration_number: registrationNumber,
        registration_date: registrationDate || null,
        current_km: currentKm ? Number(currentKm) : null,
        last_service_date: lastServiceDate || null,
        last_service_km: lastServiceKm
          ? Number(lastServiceKm)
          : null,
      });

    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }

    Alert.alert('Success', 'Vehicle saved successfully.');

    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Add Vehicle</Text>

        <Text style={styles.label}>Vehicle Name / Model</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Maruti Brezza"
          value={vehicleName}
          onChangeText={setVehicleName}
        />

        <Text style={styles.label}>Registration Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. PB07AB1234"
          value={registrationNumber}
          onChangeText={setRegistrationNumber}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Registration Date</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/YYYY"
          value={registrationDate}
          onChangeText={setRegistrationDate}
        />

        <Text style={styles.label}>Current Kilometres</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 45000"
          value={currentKm}
          onChangeText={setCurrentKm}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Last Service Date</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/YYYY"
          value={lastServiceDate}
          onChangeText={setLastServiceDate}
        />

        <Text style={styles.label}>Last Service Kilometres</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 40000"
          value={lastServiceKm}
          onChangeText={setLastServiceKm}
          keyboardType="numeric"
        />

        <Pressable style={styles.button} onPress={saveVehicle}>
          <Text style={styles.buttonText}>Save Vehicle</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    backgroundColor: '#F2F2F2',
    flexGrow: 1,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },

  button: {
    backgroundColor: '#333333',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
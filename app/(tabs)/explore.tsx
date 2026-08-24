import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';

export default function FuelScreen() {
  const [previousKm, setPreviousKm] = useState('');
  const [currentKm, setCurrentKm] = useState('');
  const [fuelLitres, setFuelLitres] = useState('');
  const [fuelCost, setFuelCost] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const previous = Number(previousKm);
  const current = Number(currentKm);
  const litres = Number(fuelLitres);
  const cost = Number(fuelCost);

  const distance =
    current > previous && previous > 0
      ? current - previous
      : 0;

  const mileage =
    distance > 0 && litres > 0
      ? distance / litres
      : 0;

  const costPerKm =
    distance > 0 && cost > 0
      ? cost / distance
      : 0;

  const saveFuelEntry = async () => {
    setMessage('');

    if (!previous || !current || !litres || !cost) {
      setMessage('Please fill in all fields.');
      return;
    }

    if (current <= previous) {
      setMessage('Current KM must be greater than previous KM.');
      return;
    }

    if (litres <= 0 || cost <= 0) {
      setMessage('Fuel and cost must be greater than 0.');
      return;
    }

    setSaving(true);

    try {
      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage('Please log in again.');
        setSaving(false);
        return;
      }

      // Get the user's latest vehicle
      const { data: vehicle, error: vehicleError } =
        await supabase
          .from('vehicles')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

      if (vehicleError) {
        console.log('Vehicle error:', vehicleError.message);
        setMessage('Could not find your vehicle.');
        setSaving(false);
        return;
      }

      if (!vehicle) {
        setMessage('No vehicle found. Add a vehicle first.');
        setSaving(false);
        return;
      }

      // Save fuel entry
      const { error } = await supabase
        .from('fuel_entries')
        .insert({
          vehicle_id: vehicle.id,
          user_id: user.id,
          previous_km: previous,
          current_km: current,
          fuel_litres: litres,
          fuel_cost: cost,
        });

      if (error) {
        console.log('Fuel save error:', error);
        setMessage(`Save failed: ${error.message}`);
        setSaving(false);
        return;
      }

      setMessage('✓ Fuel entry saved');

      // Clear the form
      setPreviousKm('');
      setCurrentKm('');
      setFuelLitres('');
      setFuelCost('');
    } catch (error) {
      console.log('Unexpected error:', error);
      setMessage('Something went wrong.');
    }

    setSaving(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>VMA</Text>

            <Text style={styles.connected}>
              CONNECTED
            </Text>
          </View>

          <View style={styles.fuelIcon}>
            <Text style={styles.fuelIconText}>⛽</Text>
          </View>
        </View>

        <Text style={styles.title}>
          Fuel & Mileage
        </Text>

        <Text style={styles.subtitle}>
          Track your fuel usage and discover
          how efficiently your vehicle is running.
        </Text>

        {/* RESULT */}

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>
            CURRENT MILEAGE
          </Text>

          <Text style={styles.mileage}>
            {mileage > 0
              ? mileage.toFixed(2)
              : '--'}
          </Text>

          <Text style={styles.mileageUnit}>
            KM / L
          </Text>

          <View style={styles.resultDivider} />

          <View style={styles.resultRow}>
            <View>
              <Text style={styles.smallLabel}>
                DISTANCE
              </Text>

              <Text style={styles.smallValue}>
                {distance > 0
                  ? `${distance.toLocaleString()} km`
                  : '--'}
              </Text>
            </View>

            <View>
              <Text style={styles.smallLabel}>
                COST / KM
              </Text>

              <Text style={styles.smallValue}>
                {costPerKm > 0
                  ? `₹${costPerKm.toFixed(2)}`
                  : '--'}
              </Text>
            </View>
          </View>
        </View>

        {/* FORM */}

        <Text style={styles.sectionTitle}>
          New Fuel Entry
        </Text>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              PREVIOUS KM
            </Text>

            <TextInput
              value={previousKm}
              onChangeText={setPreviousKm}
              placeholder="e.g. 10000"
              placeholderTextColor="#555"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              CURRENT KM
            </Text>

            <TextInput
              value={currentKm}
              onChangeText={setCurrentKm}
              placeholder="e.g. 10500"
              placeholderTextColor="#555"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              FUEL FILLED
            </Text>

            <View style={styles.inputWithUnit}>
              <TextInput
                value={fuelLitres}
                onChangeText={setFuelLitres}
                placeholder="e.g. 40"
                placeholderTextColor="#555"
                keyboardType="decimal-pad"
                style={styles.inputUnit}
              />

              <Text style={styles.unit}>
                L
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              FUEL COST
            </Text>

            <View style={styles.inputWithUnit}>
              <Text style={styles.rupee}>
                ₹
              </Text>

              <TextInput
                value={fuelCost}
                onChangeText={setFuelCost}
                placeholder="e.g. 4000"
                placeholderTextColor="#555"
                keyboardType="decimal-pad"
                style={styles.inputUnit}
              />
            </View>
          </View>

          {/* SAVE BUTTON */}

          <Pressable
            style={[
              styles.calculateButton,
              saving && styles.buttonDisabled,
            ]}
            onPress={saveFuelEntry}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <>
                <Text style={styles.calculateText}>
                  Save Fuel Entry
                </Text>

                <Text style={styles.arrow}>
                  →
                </Text>
              </>
            )}
          </Pressable>

          {/* MESSAGE */}

          {message !== '' && (
            <Text
              style={[
                styles.message,
                message.startsWith('✓')
                  ? styles.success
                  : styles.error,
              ]}
            >
              {message}
            </Text>
          )}
        </View>

        {/* EXAMPLE */}

        <View style={styles.exampleCard}>
          <Text style={styles.exampleLabel}>
            HOW VMA CALCULATES
          </Text>

          <Text style={styles.exampleTitle}>
            Distance ÷ Fuel = Mileage
          </Text>

          <Text style={styles.exampleText}>
            Example: 500 km ÷ 40 L = 12.50 km/L
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 50,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  brand: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 3,
  },

  connected: {
    color: '#777777',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 4,
    marginTop: -2,
  },

  fuelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fuelIconText: {
    fontSize: 21,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 35,
  },

  subtitle: {
    color: '#777777',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 25,
  },

  resultCard: {
    backgroundColor: '#111111',
    borderRadius: 28,
    padding: 25,
    borderWidth: 1,
    borderColor: '#292929',
  },

  resultLabel: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
  },

  mileage: {
    color: '#FFFFFF',
    fontSize: 58,
    fontWeight: '900',
    marginTop: 8,
  },

  mileageUnit: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: -5,
  },

  resultDivider: {
    height: 1,
    backgroundColor: '#292929',
    marginVertical: 23,
  },

  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  smallLabel: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },

  smallValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    marginTop: 30,
    marginBottom: 15,
  },

  formCard: {
    backgroundColor: '#111111',
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: '#292929',
  },

  inputGroup: {
    marginBottom: 17,
  },

  inputLabel: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
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

  inputWithUnit: {
    height: 52,
    backgroundColor: '#191919',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#292929',
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputUnit: {
    flex: 1,
    height: 52,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
  },

  unit: {
    color: '#777777',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 16,
  },

  rupee: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 16,
  },

  calculateButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 5,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  calculateText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },

  arrow: {
    color: '#000000',
    fontSize: 24,
  },

  message: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 15,
  },

  success: {
    color: '#FFFFFF',
  },

  error: {
    color: '#AAAAAA',
  },

  exampleCard: {
    backgroundColor: '#0D0D0D',
    borderRadius: 22,
    padding: 20,
    marginTop: 25,
    borderWidth: 1,
    borderColor: '#222222',
  },

  exampleLabel: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },

  exampleTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },

  exampleText: {
    color: '#777777',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 20,
  },
});
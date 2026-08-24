import { useEffect, useState } from 'react';
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

type FuelEntry = {
  id: string;
  previous_km: number;
  current_km: number;
  fuel_litres: number;
  fuel_cost: number;
  distance_km: number;
  mileage: number;
  cost_per_km: number;
  created_at: string;
};

export default function FuelScreen() {
  const [previousKm, setPreviousKm] = useState('');
  const [currentKm, setCurrentKm] = useState('');
  const [fuelLitres, setFuelLitres] = useState('');
  const [fuelCost, setFuelCost] = useState('');

  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
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

  // --------------------------------
  // LOAD FUEL HISTORY
  // --------------------------------

  const loadFuelHistory = async () => {
    setLoadingHistory(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoadingHistory(false);
        return;
      }

      const { data, error } = await supabase
        .from('fuel_entries')
        .select(
          'id, previous_km, current_km, fuel_litres, fuel_cost, distance_km, mileage, cost_per_km, created_at'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('History error:', error.message);
      } else {
        setEntries((data || []) as FuelEntry[]);
      }
    } catch (error) {
      console.log('History error:', error);
    }

    setLoadingHistory(false);
  };

  useEffect(() => {
    loadFuelHistory();
  }, []);

  // --------------------------------
  // SAVE FUEL ENTRY
  // --------------------------------

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
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage('Please log in again.');
        setSaving(false);
        return;
      }

      const { data: vehicle, error: vehicleError } =
        await supabase
          .from('vehicles')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

      if (vehicleError || !vehicle) {
        setMessage('No vehicle found.');
        setSaving(false);
        return;
      }

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
        console.log('Fuel save error:', error.message);
        setMessage(`Save failed: ${error.message}`);
        setSaving(false);
        return;
      }

      setMessage('✓ Fuel entry saved');

      setPreviousKm('');
      setCurrentKm('');
      setFuelLitres('');
      setFuelCost('');

      // Reload history and statistics
      await loadFuelHistory();
    } catch (error) {
      console.log('Save error:', error);
      setMessage('Something went wrong.');
    }

    setSaving(false);
  };

  // --------------------------------
  // STATISTICS
  // --------------------------------

  const totalFuel = entries.reduce(
    (sum, entry) => sum + Number(entry.fuel_litres),
    0
  );

  const totalCost = entries.reduce(
    (sum, entry) => sum + Number(entry.fuel_cost),
    0
  );

  const totalDistance = entries.reduce(
    (sum, entry) => sum + Number(entry.distance_km),
    0
  );

  const averageMileage =
    totalFuel > 0
      ? totalDistance / totalFuel
      : 0;

  const averageCostPerKm =
    totalDistance > 0
      ? totalCost / totalDistance
      : 0;

  const bestMileage =
    entries.length > 0
      ? Math.max(
          ...entries.map((entry) => Number(entry.mileage))
        )
      : 0;

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

        {/* CURRENT CALCULATION */}

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

        {/* STATISTICS */}

        <Text style={styles.sectionTitle}>
          Fuel Statistics
        </Text>

        <View style={styles.statsGrid}>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              AVERAGE
            </Text>

            <Text style={styles.statValue}>
              {averageMileage > 0
                ? averageMileage.toFixed(2)
                : '--'}
            </Text>

            <Text style={styles.statUnit}>
              KM / L
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              TOTAL FUEL
            </Text>

            <Text style={styles.statValue}>
              {totalFuel > 0
                ? totalFuel.toFixed(1)
                : '--'}
            </Text>

            <Text style={styles.statUnit}>
              LITRES
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              TOTAL SPENT
            </Text>

            <Text style={styles.statValueSmall}>
              {totalCost > 0
                ? `₹${totalCost.toFixed(0)}`
                : '--'}
            </Text>

            <Text style={styles.statUnit}>
              FUEL COST
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              COST / KM
            </Text>

            <Text style={styles.statValueSmall}>
              {averageCostPerKm > 0
                ? `₹${averageCostPerKm.toFixed(2)}`
                : '--'}
            </Text>

            <Text style={styles.statUnit}>
              AVERAGE
            </Text>
          </View>

        </View>

        {/* NEW ENTRY */}

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

          <Pressable
            style={[
              styles.saveButton,
              saving && styles.buttonDisabled,
            ]}
            onPress={saveFuelEntry}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.saveText}>
                  Save Fuel Entry
                </Text>

                <Text style={styles.arrow}>
                  →
                </Text>
              </>
            )}
          </Pressable>

          {message !== '' && (
            <Text style={styles.message}>
              {message}
            </Text>
          )}

        </View>

        {/* FUEL HISTORY */}

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>
            Fuel History
          </Text>

          {entries.length > 0 && (
            <Text style={styles.entryCount}>
              {entries.length} {entries.length === 1 ? 'ENTRY' : 'ENTRIES'}
            </Text>
          )}
        </View>

        {loadingHistory ? (
          <View style={styles.loadingHistory}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No fuel history yet
            </Text>

            <Text style={styles.emptyText}>
              Your saved fuel entries will appear here.
            </Text>
          </View>
        ) : (
          entries.map((entry) => (
            <View
              key={entry.id}
              style={styles.historyCard}
            >
              <View style={styles.historyTop}>
                <View>
                  <Text style={styles.historyKm}>
                    {Number(entry.current_km).toLocaleString()} km
                  </Text>

                  <Text style={styles.historyDate}>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <Text style={styles.historyCost}>
                  ₹{Number(entry.fuel_cost).toFixed(0)}
                </Text>
              </View>

              <View style={styles.historyDivider} />

              <View style={styles.historyStats}>

                <View>
                  <Text style={styles.historyLabel}>
                    FUEL
                  </Text>

                  <Text style={styles.historyValue}>
                    {Number(entry.fuel_litres).toFixed(1)} L
                  </Text>
                </View>

                <View>
                  <Text style={styles.historyLabel}>
                    DISTANCE
                  </Text>

                  <Text style={styles.historyValue}>
                    {Number(entry.distance_km).toLocaleString()} km
                  </Text>
                </View>

                <View>
                  <Text style={styles.historyLabel}>
                    MILEAGE
                  </Text>

                  <Text style={styles.historyValue}>
                    {Number(entry.mileage).toFixed(2)} km/L
                  </Text>
                </View>

              </View>

              <Text style={styles.historyCostKm}>
                ₹{Number(entry.cost_per_km).toFixed(2)} / km
              </Text>
            </View>
          ))
        )}

        {/* CALCULATION INFO */}

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
    paddingBottom: 60,
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

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  statCard: {
    width: '48%',
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#292929',
  },

  statLabel: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },

  statValue: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 8,
  },

  statValueSmall: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 10,
  },

  statUnit: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 3,
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

  saveButton: {
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

  saveText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },

  arrow: {
    color: '#000000',
    fontSize: 24,
  },

  message: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 15,
  },

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  entryCount: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 30,
    marginBottom: 15,
  },

  loadingHistory: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: '#292929',
  },

  emptyCard: {
    backgroundColor: '#111111',
    borderRadius: 22,
    padding: 25,
    borderWidth: 1,
    borderColor: '#292929',
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  emptyText: {
    color: '#666666',
    fontSize: 14,
    marginTop: 7,
  },

  historyCard: {
    backgroundColor: '#111111',
    borderRadius: 22,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#292929',
  },

  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  historyKm: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  historyDate: {
    color: '#666666',
    fontSize: 12,
    marginTop: 4,
  },

  historyCost: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  historyDivider: {
    height: 1,
    backgroundColor: '#292929',
    marginVertical: 18,
  },

  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  historyLabel: {
    color: '#666666',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  historyValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 5,
  },

  historyCostKm: {
    color: '#777777',
    fontSize: 12,
    marginTop: 15,
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
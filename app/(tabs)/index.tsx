import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadVehicle = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.log('Vehicle loading error:', error.message);
    }

    setVehicle(data || null);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadVehicle();
    }, [])
  );

  /*
   * CALCULATION FUNCTIONS
   * These are ready for when we connect
   * fuel/service records to the dashboard.
   */

  const calculateMileage = (
    previousKm: number,
    currentKm: number,
    fuelUsed: number
  ) => {
    if (fuelUsed <= 0 || currentKm <= previousKm) {
      return 0;
    }

    const distance = currentKm - previousKm;

    return distance / fuelUsed;
  };

  const calculateTotalExpense = (
    fuel: number,
    service: number,
    repairs: number
  ) => {
    return fuel + service + repairs;
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>VMA</Text>
            <Text style={styles.connected}>CONNECTED</Text>
          </View>

          <Pressable style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>♧</Text>
          </Pressable>
        </View>

        <Text style={styles.greeting}>Good morning 👋</Text>

        <Text style={styles.welcomeText}>
          Everything about your vehicle,
          {'\n'}in one place.
        </Text>

        {/* VEHICLE CARD */}

        {vehicle ? (
          <Pressable
            style={styles.vehicleCard}
            onPress={() => router.push('/vehicle/details')}
          >
            <View style={styles.vehicleGlow} />

            <View style={styles.vehicleTop}>
              <View>
                <Text style={styles.vehicleLabel}>YOUR VEHICLE</Text>

                <Text style={styles.vehicleName}>
                  {vehicle.vehicle_name}
                </Text>

                <Text style={styles.registration}>
                  {vehicle.registration_number}
                </Text>
              </View>

              <View style={styles.arrowCircle}>
                <Text style={styles.arrow}>›</Text>
              </View>
            </View>

            <View style={styles.vehicleBottom}>
              <View>
                <Text style={styles.kmValue}>
                  {vehicle.current_km ?? '-'}
                </Text>

                <Text style={styles.kmLabel}>
                  CURRENT KM
                </Text>
              </View>

              <View style={styles.vehicleStatus}>
                <View style={styles.statusDot} />

                <Text style={styles.statusText}>
                  Active
                </Text>
              </View>
            </View>
          </Pressable>
        ) : (
          <Pressable
            style={styles.emptyCard}
            onPress={() => router.push('/vehicle/add')}
          >
            <Text style={styles.emptyIcon}>＋</Text>

            <Text style={styles.emptyTitle}>
              Add your vehicle
            </Text>

            <Text style={styles.emptyText}>
              Start managing your vehicle with VMA.
            </Text>
          </Pressable>
        )}

        {/* QUICK INFORMATION */}

        {vehicle && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Vehicle Overview
              </Text>

              <Text style={styles.sectionSmall}>
                LIVE
              </Text>
            </View>

            <View style={styles.grid}>
              {/* SERVICE */}

              <Pressable
                style={styles.infoCard}
                onPress={() => router.push('/vehicle/details')}
              >
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>🔧</Text>
                </View>

                <Text style={styles.infoTitle}>
                  Service
                </Text>

                <Text style={styles.infoValue}>
                  Track
                </Text>

                <Text style={styles.infoSub}>
                  Maintenance
                </Text>
              </Pressable>

              {/* FUEL */}

              <Pressable
                style={styles.infoCard}
                onPress={() => router.push('/vehicle/details')}
              >
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>⛽</Text>
                </View>

                <Text style={styles.infoTitle}>
                  Fuel
                </Text>

                <Text style={styles.infoValue}>
                  Mileage
                </Text>

                <Text style={styles.infoSub}>
                  Coming soon
                </Text>
              </Pressable>

              {/* DOCUMENTS */}

              <Pressable
                style={styles.infoCard}
                onPress={() => router.push('/vehicle/details')}
              >
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>📄</Text>
                </View>

                <Text style={styles.infoTitle}>
                  Documents
                </Text>

                <Text style={styles.infoValue}>
                  Manage
                </Text>

                <Text style={styles.infoSub}>
                  RC • PUC • Insurance
                </Text>
              </Pressable>

              {/* EXPENSES */}

              <Pressable
                style={styles.infoCard}
                onPress={() => router.push('/vehicle/details')}
              >
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>₹</Text>
                </View>

                <Text style={styles.infoTitle}>
                  Expenses
                </Text>

                <Text style={styles.infoValue}>
                  Track
                </Text>

                <Text style={styles.infoSub}>
                  Fuel • Service • Repairs
                </Text>
              </Pressable>
            </View>

            {/* QUICK ACTIONS */}

            <Text style={styles.sectionTitle}>
              Quick Actions
            </Text>

            <Pressable
              style={styles.addButton}
              onPress={() => router.push('/vehicle/add')}
            >
              <View style={styles.plusCircle}>
                <Text style={styles.plus}>+</Text>
              </View>

              <View style={styles.addButtonText}>
                <Text style={styles.addTitle}>
                  Add Vehicle
                </Text>

                <Text style={styles.addSub}>
                  Add another vehicle to VMA
                </Text>
              </View>

              <Text style={styles.addArrow}>
                ›
              </Text>
            </Pressable>
          </>
        )}

        {/* CALCULATION PREVIEW */}

        {vehicle && (
          <View style={styles.calculationCard}>
            <Text style={styles.calculationLabel}>
              VMA SMART TRACKING
            </Text>

            <Text style={styles.calculationTitle}>
              Your vehicle data will become
              useful insights.
            </Text>

            <View style={styles.calculationRow}>
              <View>
                <Text style={styles.calculationNumber}>
                  {vehicle.current_km ?? 0}
                </Text>

                <Text style={styles.calculationUnit}>
                  KM tracked
                </Text>
              </View>

              <View style={styles.calculationDivider} />

              <View>
                <Text style={styles.calculationNumber}>
                  —
                </Text>

                <Text style={styles.calculationUnit}>
                  km/L mileage
                </Text>
              </View>

              <View style={styles.calculationDivider} />

              <View>
                <Text style={styles.calculationNumber}>
                  —
                </Text>

                <Text style={styles.calculationUnit}>
                  total expense
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------ */
/* STYLES */
/* ------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  loading: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 65,
    paddingBottom: 50,
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brand: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 3,
  },

  connected: {
    color: '#888',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 5,
    marginTop: -3,
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#292929',
  },

  notificationIcon: {
    color: '#FFFFFF',
    fontSize: 22,
  },

  greeting: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '700',
    marginTop: 35,
  },

  welcomeText: {
    color: '#777',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 7,
    marginBottom: 25,
  },

  /* VEHICLE CARD */

  vehicleCard: {
    height: 245,
    borderRadius: 28,
    backgroundColor: '#111111',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#292929',
    padding: 24,
    justifyContent: 'space-between',
  },

  vehicleGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    right: -80,
    bottom: -100,
    backgroundColor: '#202020',
    opacity: 0.8,
  },

  vehicleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  vehicleLabel: {
    color: '#777',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },

  vehicleName: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    marginTop: 7,
  },

  registration: {
    color: '#999',
    fontSize: 15,
    marginTop: 4,
  },

  arrowCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrow: {
    color: '#111',
    fontSize: 28,
    marginTop: -3,
  },

  vehicleBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  kmValue: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
  },

  kmLabel: {
    color: '#777',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: -2,
  },

  vehicleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#191919',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 7,
  },

  statusText: {
    color: '#AAA',
    fontSize: 12,
  },

  /* EMPTY STATE */

  emptyCard: {
    backgroundColor: '#111',
    borderRadius: 28,
    padding: 30,
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
  },

  emptyIcon: {
    color: '#FFF',
    fontSize: 40,
  },

  emptyTitle: {
    color: '#FFF',
    fontSize: 23,
    fontWeight: '800',
    marginTop: 10,
  },

  emptyText: {
    color: '#777',
    fontSize: 14,
    marginTop: 7,
    textAlign: 'center',
  },

  /* SECTIONS */

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 15,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    marginTop: 30,
    marginBottom: 15,
  },

  sectionSmall: {
    color: '#777',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },

  /* INFORMATION GRID */

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  infoCard: {
    width: '48%',
    backgroundColor: '#111111',
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    minHeight: 155,
    borderWidth: 1,
    borderColor: '#242424',
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  icon: {
    fontSize: 18,
  },

  infoTitle: {
    color: '#777',
    fontSize: 12,
  },

  infoValue: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    marginTop: 4,
  },

  infoSub: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },

  /* ADD BUTTON */

  addButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  plusCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  plus: {
    color: '#FFFFFF',
    fontSize: 25,
    marginTop: -2,
  },

  addButtonText: {
    flex: 1,
    marginLeft: 13,
  },

  addTitle: {
    color: '#111',
    fontSize: 16,
    fontWeight: '800',
  },

  addSub: {
    color: '#777',
    fontSize: 11,
    marginTop: 3,
  },

  addArrow: {
    color: '#111',
    fontSize: 27,
    marginRight: 5,
  },

  /* CALCULATIONS */

  calculationCard: {
    backgroundColor: '#111111',
    borderRadius: 25,
    padding: 22,
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#292929',
  },

  calculationLabel: {
    color: '#777',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },

  calculationTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 27,
    marginTop: 9,
  },

  calculationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
  },

  calculationNumber: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },

  calculationUnit: {
    color: '#666',
    fontSize: 9,
    marginTop: 3,
  },

  calculationDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#333',
  },
});
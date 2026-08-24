import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';
import {
  calculateNextServiceKm,
  calculateRemainingServiceKm,
} from '../../lib/vehicleCalculations';

export default function VehicleDetailsScreen() {
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadVehicle = async () => {
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
      console.log('Details error:', error.message);
    }

    setVehicle(data);
    setLoading(false);
  };

  useEffect(() => {
    loadVehicle();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No Vehicle Found</Text>

        <Pressable
          style={styles.button}
          onPress={() => router.push('/vehicle/add')}
        >
          <Text style={styles.buttonText}>+ Add Vehicle</Text>
        </Pressable>
      </View>
    );
  }

  const currentKm = Number(vehicle.current_km) || 0;
  const lastServiceKm = Number(vehicle.last_service_km) || 0;

  // Current default service interval
  const serviceInterval = 5000;

  const nextServiceKm =
    lastServiceKm > 0
      ? calculateNextServiceKm(
          lastServiceKm,
          serviceInterval
        )
      : 0;

  const remainingServiceKm =
    nextServiceKm > 0
      ? calculateRemainingServiceKm(
          currentKm,
          nextServiceKm
        )
      : 0;

  const serviceDue = remainingServiceKm === 0 && nextServiceKm > 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <Pressable
          style={styles.backCircle}
          onPress={() => router.back()}
        >
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          Vehicle
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* VEHICLE HERO */}

      <View style={styles.heroCard}>
        <Text style={styles.smallLabel}>
          YOUR VEHICLE
        </Text>

        <Text style={styles.vehicleName}>
          {vehicle.vehicle_name}
        </Text>

        <Text style={styles.registration}>
          {vehicle.registration_number}
        </Text>

        <View style={styles.heroDivider} />

        <Text style={styles.kmNumber}>
          {currentKm.toLocaleString()}
        </Text>

        <Text style={styles.kmLabel}>
          CURRENT KM
        </Text>
      </View>

      {/* VEHICLE INFORMATION */}

      <Text style={styles.sectionTitle}>
        Vehicle Information
      </Text>

      <View style={styles.infoGrid}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>
            Registration
          </Text>

          <Text style={styles.infoValue}>
            {vehicle.registration_date || '-'}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>
            Current KM
          </Text>

          <Text style={styles.infoValue}>
            {currentKm.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* SERVICE */}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Service
        </Text>

        <Text
          style={[
            styles.status,
            serviceDue && styles.statusDue,
          ]}
        >
          {serviceDue ? 'DUE' : 'ON TRACK'}
        </Text>
      </View>

      <View style={styles.serviceCard}>
        <View style={styles.serviceTop}>
          <View>
            <Text style={styles.infoLabel}>
              LAST SERVICE
            </Text>

            <Text style={styles.serviceValue}>
              {lastServiceKm > 0
                ? `${lastServiceKm.toLocaleString()} km`
                : '-'}
            </Text>
          </View>

          <View style={styles.serviceIcon}>
            <Text style={styles.iconText}>🔧</Text>
          </View>
        </View>

        <View style={styles.serviceDivider} />

        <View style={styles.serviceRow}>
          <View>
            <Text style={styles.infoLabel}>
              NEXT SERVICE
            </Text>

            <Text style={styles.serviceValue}>
              {nextServiceKm > 0
                ? `${nextServiceKm.toLocaleString()} km`
                : '-'}
            </Text>
          </View>

          <View style={styles.remainingBox}>
            <Text style={styles.remainingNumber}>
              {remainingServiceKm > 0
                ? remainingServiceKm.toLocaleString()
                : '0'}
            </Text>

            <Text style={styles.remainingLabel}>
              KM LEFT
            </Text>
          </View>
        </View>

        {nextServiceKm > 0 && (
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progress,
                {
                  width: `${Math.min(
                    Math.max(
                      ((serviceInterval -
                        remainingServiceKm) /
                        serviceInterval) *
                        100,
                      0
                    ),
                    100
                  )}%`,
                },
              ]}
            />
          </View>
        )}

        <Text style={styles.lastServiceDate}>
          Last service date:{' '}
          {vehicle.last_service_date || '-'}
        </Text>
      </View>

      {/* ACTIONS */}

      <Text style={styles.sectionTitle}>
        Quick Actions
      </Text>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.actionCard}
          onPress={() => router.push('/vehicle/add')}
        >
          <Text style={styles.actionIcon}>✎</Text>

          <Text style={styles.actionTitle}>
            Update
          </Text>

          <Text style={styles.actionSubtitle}>
            Vehicle details
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionCard}
          onPress={() => router.back()}
        >
          <Text style={styles.actionIcon}>⌂</Text>

          <Text style={styles.actionTitle}>
            Home
          </Text>

          <Text style={styles.actionSubtitle}>
            Dashboard
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },

  content: {
    padding: 24,
    paddingTop: 55,
    paddingBottom: 50,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },

  backCircle: {
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
    fontWeight: '300',
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

  heroCard: {
    backgroundColor: '#111111',
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: '#292929',
    minHeight: 250,
    justifyContent: 'center',
  },

  smallLabel: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 4,
  },

  vehicleName: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 12,
    textTransform: 'uppercase',
  },

  registration: {
    color: '#777777',
    fontSize: 17,
    marginTop: 6,
  },

  heroDivider: {
    height: 1,
    backgroundColor: '#292929',
    marginVertical: 25,
  },

  kmNumber: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900',
  },

  kmLabel: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    marginTop: 2,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    marginTop: 32,
    marginBottom: 16,
  },

  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },

  infoCard: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#292929',
    minHeight: 105,
    justifyContent: 'center',
  },

  infoLabel: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },

  infoValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 8,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionHeaderTitle: {
    color: '#FFFFFF',
  },

  status: {
    color: '#FFFFFF',
    backgroundColor: '#191919',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  statusDue: {
    backgroundColor: '#2A2A2A',
  },

  serviceCard: {
    backgroundColor: '#111111',
    borderRadius: 24,
    padding: 23,
    borderWidth: 1,
    borderColor: '#292929',
  },

  serviceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#1B1B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconText: {
    fontSize: 23,
  },

  serviceValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },

  serviceDivider: {
    height: 1,
    backgroundColor: '#292929',
    marginVertical: 22,
  },

  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  remainingBox: {
    alignItems: 'flex-end',
  },

  remainingNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  remainingLabel: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 2,
  },

  progressBackground: {
    height: 5,
    backgroundColor: '#252525',
    borderRadius: 5,
    marginTop: 25,
    overflow: 'hidden',
  },

  progress: {
    height: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
  },

  lastServiceDate: {
    color: '#666666',
    fontSize: 13,
    marginTop: 16,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },

  actionCard: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#292929',
  },

  actionIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    marginBottom: 15,
  },

  actionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  actionSubtitle: {
    color: '#666666',
    fontSize: 12,
    marginTop: 5,
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 25,
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    marginBottom: 20,
  },

  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 17,
    paddingHorizontal: 40,
    borderRadius: 15,
  },

  buttonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '800',
  },
});
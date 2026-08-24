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
  const [fuelEntries, setFuelEntries] = useState<any[]>([]);
  const [serviceEntries, setServiceEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/auth/login');
        return;
      }

      // VEHICLE

      const { data: vehicleData, error: vehicleError } =
        await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

      if (vehicleError) {
        console.log(
          'Vehicle loading error:',
          vehicleError.message
        );
      }

      setVehicle(vehicleData || null);

      // FUEL

      const { data: fuelData, error: fuelError } =
        await supabase
          .from('fuel_entries')
          .select(
            'id, fuel_litres, fuel_cost, distance_km, mileage, created_at'
          )
          .eq('user_id', user.id)
          .order('created_at', {
            ascending: false,
          });

      if (fuelError) {
        console.log(
          'Fuel loading error:',
          fuelError.message
        );
      }

      setFuelEntries(fuelData || []);

      // SERVICE

      const { data: serviceData, error: serviceError } =
        await supabase
          .from('service_entries')
          .select(
            'id, service_date, service_km, service_type, service_cost'
          )
          .eq('user_id', user.id)
          .order('service_date', {
            ascending: false,
          });

      if (serviceError) {
        console.log(
          'Service loading error:',
          serviceError.message
        );
      }

      setServiceEntries(serviceData || []);
    } catch (error) {
      console.log('Dashboard error:', error);
    }

    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  // FUEL CALCULATIONS

  const totalFuel = fuelEntries.reduce(
    (sum, entry) =>
      sum + Number(entry.fuel_litres || 0),
    0
  );

  const totalFuelCost = fuelEntries.reduce(
    (sum, entry) =>
      sum + Number(entry.fuel_cost || 0),
    0
  );

  const totalDistance = fuelEntries.reduce(
    (sum, entry) =>
      sum + Number(entry.distance_km || 0),
    0
  );

  const averageMileage =
    totalFuel > 0
      ? totalDistance / totalFuel
      : 0;

  // SERVICE CALCULATIONS

  const totalServiceCost = serviceEntries.reduce(
    (sum, entry) =>
      sum + Number(entry.service_cost || 0),
    0
  );

  const totalExpense =
    totalFuelCost + totalServiceCost;

  const lastService =
    serviceEntries.length > 0
      ? serviceEntries[0]
      : null;

  const currentKm =
    Number(vehicle?.current_km) || 0;

  const lastServiceKm =
    Number(vehicle?.last_service_km) || 0;

  const serviceInterval = 5000;

  const nextServiceKm =
    lastServiceKm > 0
      ? lastServiceKm + serviceInterval
      : 0;

  const remainingServiceKm =
    nextServiceKm > 0
      ? Math.max(nextServiceKm - currentKm, 0)
      : 0;

  // LOADING

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#FFFFFF"
        />
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
            <Text style={styles.brand}>
              VMA
            </Text>

            <Text style={styles.connected}>
              CONNECTED
            </Text>
          </View>

          {/* ORIGINAL WHITE DOT */}

          <View style={styles.statusCircle}>
            <View style={styles.statusDot} />
          </View>
        </View>

        {/* GREETING */}

        <Text style={styles.greeting}>
          Good morning 👋
        </Text>

        <Text style={styles.welcomeText}>
          Everything about your vehicle,
          {'\n'}in one place.
        </Text>

        {/* VEHICLE CARD */}

        {vehicle ? (
          <Pressable
            style={styles.vehicleCard}
            onPress={() =>
              router.push('/vehicle/details')
            }
          >
            <View style={styles.vehicleGlow} />

            <View style={styles.vehicleTop}>
              <View>
                <Text style={styles.vehicleLabel}>
                  YOUR VEHICLE
                </Text>

                <Text style={styles.vehicleName}>
                  {vehicle.vehicle_name}
                </Text>

                <Text style={styles.registration}>
                  {vehicle.registration_number}
                </Text>
              </View>

              <View style={styles.arrowCircle}>
                <Text style={styles.arrow}>
                  ›
                </Text>
              </View>
            </View>

            <View style={styles.vehicleBottom}>
              <View>
                <Text style={styles.kmValue}>
                  {currentKm
                    ? currentKm.toLocaleString()
                    : '--'}
                </Text>

                <Text style={styles.kmLabel}>
                  CURRENT KM
                </Text>
              </View>

              <View style={styles.vehicleStatus}>
                <View style={styles.activeDot} />

                <Text style={styles.statusText}>
                  Active
                </Text>
              </View>
            </View>
          </Pressable>
        ) : (
          <Pressable
            style={styles.emptyCard}
            onPress={() =>
              router.push('/vehicle/add')
            }
          >
            <Text style={styles.emptyIcon}>
              ＋
            </Text>

            <Text style={styles.emptyTitle}>
              Add your vehicle
            </Text>

            <Text style={styles.emptyText}>
              Start managing your vehicle
              with VMA.
            </Text>
          </Pressable>
        )}

        {vehicle && (
          <>
            {/* VEHICLE OVERVIEW */}

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
                onPress={() =>
                  router.push(
                    '/vehicle/details'
                  )
                }
              >
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>
                    🔧
                  </Text>
                </View>

                <Text style={styles.infoTitle}>
                  Service
                </Text>

                <Text style={styles.infoValue}>
                  {nextServiceKm > 0
                    ? `${remainingServiceKm.toLocaleString()} km`
                    : 'Not set'}
                </Text>

                <Text style={styles.infoSub}>
                  {nextServiceKm > 0
                    ? 'until next service'
                    : 'Add service record'}
                </Text>
              </Pressable>

              {/* FUEL */}

              <Pressable
                style={styles.infoCard}
                onPress={() =>
                  router.push('/explore')
                }
              >
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>
                    ⛽
                  </Text>
                </View>

                <Text style={styles.infoTitle}>
                  Fuel
                </Text>

                <Text style={styles.infoValue}>
                  {averageMileage > 0
                    ? `${averageMileage.toFixed(2)} km/L`
                    : 'No data'}
                </Text>

                <Text style={styles.infoSub}>
                  Average mileage
                </Text>
              </Pressable>

              {/* DOCUMENTS */}

              <Pressable
                style={styles.infoCard}
                onPress={() =>
                  router.push(
                    '/vehicle/documents'
                  )
                }
              >
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>
                    📄
                  </Text>
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
                onPress={() =>
                  router.push('/explore')
                }
              >
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>
                    ₹
                  </Text>
                </View>

                <Text style={styles.infoTitle}>
                  Expenses
                </Text>

                <Text style={styles.infoValue}>
                  {totalExpense > 0
                    ? `₹${totalExpense.toLocaleString(
                        'en-IN'
                      )}`
                    : '₹0'}
                </Text>

                <Text style={styles.infoSub}>
                  Fuel + Service
                </Text>
              </Pressable>

            </View>

            {/* SMART TRACKING */}

            <View style={styles.calculationCard}>
              <Text style={styles.calculationLabel}>
                VMA SMART TRACKING
              </Text>

              <Text style={styles.calculationTitle}>
                Your vehicle data,
                {'\n'}turned into insights.
              </Text>

              <View style={styles.calculationRow}>

                <View style={styles.statBlock}>
                  <Text style={styles.calculationNumber}>
                    {currentKm
                      ? currentKm.toLocaleString()
                      : '--'}
                  </Text>

                  <Text style={styles.calculationUnit}>
                    KM TRACKED
                  </Text>
                </View>

                <View style={styles.calculationDivider} />

                <View style={styles.statBlock}>
                  <Text style={styles.calculationNumber}>
                    {averageMileage > 0
                      ? averageMileage.toFixed(1)
                      : '--'}
                  </Text>

                  <Text style={styles.calculationUnit}>
                    KM/L
                  </Text>
                </View>

                <View style={styles.calculationDivider} />

                <View style={styles.statBlock}>
                  <Text style={styles.calculationNumber}>
                    {totalExpense > 0
                      ? `₹${(
                          totalExpense / 1000
                        ).toFixed(1)}K`
                      : '--'}
                  </Text>

                  <Text style={styles.calculationUnit}>
                    EXPENSE
                  </Text>
                </View>

              </View>
            </View>

            {/* RECENT ACTIVITY */}

            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>
                Recent Activity
              </Text>
            </View>

            {lastService ? (
              <View style={styles.activityCard}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityEmoji}>
                    🔧
                  </Text>
                </View>

                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>
                    {lastService.service_type}
                  </Text>

                  <Text style={styles.activitySub}>
                    {Number(
                      lastService.service_km
                    ).toLocaleString()} km
                  </Text>
                </View>

                <Text style={styles.activityCost}>
                  ₹
                  {Number(
                    lastService.service_cost
                  ).toLocaleString('en-IN')}
                </Text>
              </View>
            ) : (
              <View style={styles.noActivity}>
                <Text style={styles.noActivityText}>
                  No service activity yet.
                </Text>
              </View>
            )}

            {/* QUICK ACTION */}

            <Text style={styles.sectionTitle}>
              Quick Actions
            </Text>

            <Pressable
              style={styles.addButton}
              onPress={() =>
                router.push('/vehicle/add')
              }
            >
              <View style={styles.plusCircle}>
                <Text style={styles.plus}>
                  +
                </Text>
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

      </ScrollView>
    </View>
  );
}

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

  statusCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#292929',
  },

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
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

  activeDot: {
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
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },

  infoSub: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },

  /* SMART TRACKING */

  calculationCard: {
    backgroundColor: '#111111',
    borderRadius: 25,
    padding: 22,
    marginTop: 18,
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

  statBlock: {
    flex: 1,
    alignItems: 'center',
  },

  calculationNumber: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },

  calculationUnit: {
    color: '#666',
    fontSize: 8,
    marginTop: 4,
    textAlign: 'center',
  },

  calculationDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#333',
  },

  /* RECENT ACTIVITY */

  recentHeader: {
    marginTop: 5,
  },

  activityCard: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: '#292929',
    flexDirection: 'row',
    alignItems: 'center',
  },

  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityEmoji: {
    fontSize: 20,
  },

  activityInfo: {
    flex: 1,
    marginLeft: 13,
  },

  activityTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  activitySub: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },

  activityCost: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  noActivity: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#292929',
  },

  noActivityText: {
    color: '#666',
    fontSize: 13,
  },

  /* QUICK ACTION */

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
});
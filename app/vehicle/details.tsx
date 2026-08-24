import { router } from 'expo-router';
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

import { supabase } from '../../lib/supabase';
import {
  calculateNextServiceKm,
  calculateRemainingServiceKm,
} from '../../lib/vehicleCalculations';

type ServiceEntry = {
  id: string;
  service_date: string;
  service_km: number;
  service_type: string;
  service_cost: number;
  notes: string | null;
};

export default function VehicleDetailsScreen() {
  const [vehicle, setVehicle] = useState<any>(null);
  const [services, setServices] = useState<ServiceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);

  const [showAddService, setShowAddService] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [message, setMessage] = useState('');

  const [serviceDate, setServiceDate] = useState('');
  const [serviceKm, setServiceKm] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [serviceCost, setServiceCost] = useState('');
  const [notes, setNotes] = useState('');

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

  const loadServices = async () => {
    setLoadingServices(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadingServices(false);
      return;
    }

    const { data, error } = await supabase
      .from('service_entries')
      .select(
        'id, service_date, service_km, service_type, service_cost, notes'
      )
      .eq('user_id', user.id)
      .order('service_date', { ascending: false });

    if (error) {
      console.log('Service history error:', error.message);
    } else {
      setServices((data || []) as ServiceEntry[]);
    }

    setLoadingServices(false);
  };

  useEffect(() => {
    loadVehicle();
    loadServices();
  }, []);

  const saveService = async () => {
    setMessage('');

    if (!serviceKm || !serviceType || !serviceCost) {
      setMessage('Please fill in service KM, type and cost.');
      return;
    }

    const km = Number(serviceKm);
    const cost = Number(serviceCost);

    if (km <= 0) {
      setMessage('Service KM must be greater than 0.');
      return;
    }

    if (cost < 0) {
      setMessage('Service cost cannot be negative.');
      return;
    }

    setSavingService(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage('Please log in again.');
        setSavingService(false);
        return;
      }

      if (!vehicle) {
        setMessage('No vehicle found.');
        setSavingService(false);
        return;
      }

      const finalServiceDate =
        serviceDate ||
        new Date().toISOString().split('T')[0];

      // 1. Save service history
      const { error: serviceError } = await supabase
        .from('service_entries')
        .insert({
          vehicle_id: vehicle.id,
          user_id: user.id,
          service_date: finalServiceDate,
          service_km: km,
          service_type: serviceType,
          service_cost: cost,
          notes: notes || null,
        });

      if (serviceError) {
        console.log(
          'Service save error:',
          serviceError.message
        );

        setMessage(
          `Save failed: ${serviceError.message}`
        );

        setSavingService(false);
        return;
      }

      // 2. Update vehicle's latest service information
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({
          last_service_km: km,
          last_service_date: finalServiceDate,
        })
        .eq('id', vehicle.id)
        .eq('user_id', user.id);

      if (vehicleError) {
        console.log(
          'Vehicle update error:',
          vehicleError.message
        );

        setMessage(
          `Service saved, but vehicle update failed: ${vehicleError.message}`
        );

        setSavingService(false);
        return;
      }

      // 3. Update vehicle shown on screen immediately
      setVehicle({
        ...vehicle,
        last_service_km: km,
        last_service_date: finalServiceDate,
      });

      // 4. Clear form
      setServiceDate('');
      setServiceKm('');
      setServiceType('');
      setServiceCost('');
      setNotes('');

      setShowAddService(false);

      // 5. Refresh service history
      await loadServices();

      setMessage('✓ Service saved and vehicle updated');
    } catch (error) {
      console.log('Service error:', error);
      setMessage('Something went wrong.');
    }

    setSavingService(false);
  };

  const currentKm = Number(vehicle?.current_km) || 0;
  const lastServiceKm = Number(vehicle?.last_service_km) || 0;

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

  const serviceDue =
    remainingServiceKm === 0 && nextServiceKm > 0;

  const totalServiceCost = services.reduce(
    (sum, service) =>
      sum + Number(service.service_cost),
    0
  );

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

  if (!vehicle) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>
          No vehicle found
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => router.push('/vehicle/add')}
        >
          <Text style={styles.buttonText}>
            Add Vehicle
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            style={styles.backCircle}
            onPress={() => router.back()}
          >
            <Text style={styles.backArrow}>
              ‹
            </Text>
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

        {/* SERVICE STATUS */}

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
            {serviceDue
              ? 'DUE'
              : 'ON TRACK'}
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
              <Text style={styles.iconText}>
                🔧
              </Text>
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

        {/* SERVICE RECORDS */}

        <View style={styles.addServiceHeader}>
          <Text style={styles.sectionTitle}>
            Service Records
          </Text>

          <Pressable
            style={styles.addButton}
            onPress={() => {
              setMessage('');
              setShowAddService(
                !showAddService
              );
            }}
          >
            <Text style={styles.addButtonText}>
              {showAddService
                ? 'Close'
                : '+ Add'}
            </Text>
          </Pressable>
        </View>

        {/* ADD SERVICE FORM */}

        {showAddService && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              New Service
            </Text>

            <Text style={styles.inputLabel}>
              SERVICE DATE
            </Text>

            <TextInput
              value={serviceDate}
              onChangeText={setServiceDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#555"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>
              SERVICE KM
            </Text>

            <TextInput
              value={serviceKm}
              onChangeText={setServiceKm}
              placeholder="e.g. 15000"
              placeholderTextColor="#555"
              keyboardType="numeric"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>
              SERVICE TYPE
            </Text>

            <TextInput
              value={serviceType}
              onChangeText={setServiceType}
              placeholder="e.g. Regular Service"
              placeholderTextColor="#555"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>
              SERVICE COST
            </Text>

            <View style={styles.costInput}>
              <Text style={styles.rupee}>
                ₹
              </Text>

              <TextInput
                value={serviceCost}
                onChangeText={setServiceCost}
                placeholder="e.g. 4500"
                placeholderTextColor="#555"
                keyboardType="decimal-pad"
                style={styles.costTextInput}
              />
            </View>

            <Text style={styles.inputLabel}>
              NOTES
            </Text>

            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes"
              placeholderTextColor="#555"
              multiline
              style={[
                styles.input,
                styles.notesInput,
              ]}
            />

            <Pressable
              style={styles.saveButton}
              onPress={saveService}
              disabled={savingService}
            >
              {savingService ? (
                <ActivityIndicator
                  color="#000000"
                />
              ) : (
                <Text style={styles.saveButtonText}>
                  Save Service
                </Text>
              )}
            </Pressable>

            {message !== '' && (
              <Text style={styles.message}>
                {message}
              </Text>
            )}
          </View>
        )}

        {/* SERVICE STATS */}

        <View style={styles.statsCard}>
          <View>
            <Text style={styles.statsLabel}>
              TOTAL SERVICES
            </Text>

            <Text style={styles.statsValue}>
              {services.length}
            </Text>
          </View>

          <View style={styles.statsRight}>
            <Text style={styles.statsLabel}>
              TOTAL SPENT
            </Text>

            <Text style={styles.statsValue}>
              ₹{totalServiceCost.toFixed(0)}
            </Text>
          </View>
        </View>

        {/* SERVICE HISTORY */}

        {loadingServices ? (
          <View style={styles.loadingHistory}>
            <ActivityIndicator
              color="#FFFFFF"
            />
          </View>
        ) : services.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text
              style={styles.emptyHistoryTitle}
            >
              No service history yet
            </Text>

            <Text
              style={styles.emptyHistoryText}
            >
              Your saved services will appear here.
            </Text>
          </View>
        ) : (
          services.map((service) => (
            <View
              key={service.id}
              style={styles.historyCard}
            >
              <View style={styles.historyTop}>
                <View>
                  <Text
                    style={styles.historyType}
                  >
                    {service.service_type}
                  </Text>

                  <Text
                    style={styles.historyDate}
                  >
                    {service.service_date}
                  </Text>
                </View>

                <Text
                  style={styles.historyCost}
                >
                  ₹
                  {Number(
                    service.service_cost
                  ).toFixed(0)}
                </Text>
              </View>

              <View
                style={styles.historyDivider}
              />

              <Text style={styles.historyKm}>
                {Number(
                  service.service_km
                ).toLocaleString()} km
              </Text>

              {service.notes && (
                <Text
                  style={styles.historyNotes}
                >
                  {service.notes}
                </Text>
              )}
            </View>
          ))
        )}

        {/* QUICK ACTIONS */}

        <Text style={styles.sectionTitle}>
          Quick Actions
        </Text>

        <View style={styles.actionRow}>
          <Pressable
            style={styles.actionCard}
            onPress={() =>
              router.push('/vehicle/add')
            }
          >
            <Text style={styles.actionIcon}>
              ✎
            </Text>

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
            <Text style={styles.actionIcon}>
              ⌂
            </Text>

            <Text style={styles.actionTitle}>
              Home
            </Text>

            <Text style={styles.actionSubtitle}>
              Dashboard
            </Text>
          </Pressable>
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

  addServiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  addButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
    marginTop: 15,
  },

  addButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
  },

  formCard: {
    backgroundColor: '#111111',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#292929',
  },

  formTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },

  inputLabel: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 12,
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

  notesInput: {
    height: 90,
    paddingTop: 15,
    textAlignVertical: 'top',
  },

  costInput: {
    height: 52,
    backgroundColor: '#191919',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#292929',
    flexDirection: 'row',
    alignItems: 'center',
  },

  rupee: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 16,
  },

  costTextInput: {
    flex: 1,
    height: 52,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 16,
  },

  saveButton: {
    height: 55,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },

  message: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
  },

  statsCard: {
    backgroundColor: '#111111',
    borderRadius: 22,
    padding: 20,
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#292929',
  },

  statsRight: {
    alignItems: 'flex-end',
  },

  statsLabel: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },

  statsValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 7,
  },

  loadingHistory: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: '#292929',
  },

  emptyHistory: {
    backgroundColor: '#111111',
    borderRadius: 22,
    padding: 25,
    borderWidth: 1,
    borderColor: '#292929',
  },

  emptyHistoryTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  emptyHistoryText: {
    color: '#666666',
    fontSize: 13,
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

  historyType: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
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
    marginVertical: 16,
  },

  historyKm: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  historyNotes: {
    color: '#777777',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
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
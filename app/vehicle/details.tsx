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
        <ActivityIndicator size="large" />
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
          <Text style={styles.buttonText}>Add Vehicle</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.container}>

        <Text style={styles.title}>Vehicle Details</Text>

        <View style={styles.card}>

          <Text style={styles.vehicleName}>
            {vehicle.vehicle_name}
          </Text>

          <Text style={styles.registration}>
            {vehicle.registration_number}
          </Text>

          <View style={styles.line} />

          <Text style={styles.label}>
            Registration Date
          </Text>

          <Text style={styles.value}>
            {vehicle.registration_date || '-'}
          </Text>

          <Text style={styles.label}>
            Current Kilometres
          </Text>

          <Text style={styles.value}>
            {vehicle.current_km ?? '-'} km
          </Text>

          <Text style={styles.label}>
            Last Service Date
          </Text>

          <Text style={styles.value}>
            {vehicle.last_service_date || '-'}
          </Text>

          <Text style={styles.label}>
            Last Service Kilometres
          </Text>

          <Text style={styles.value}>
            {vehicle.last_service_km ?? '-'} km
          </Text>

        </View>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Back</Text>
        </Pressable>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },

  container: {
    padding: 25,
    paddingTop: 60,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111',
    marginBottom: 30,
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 30,
    borderWidth: 1,
    borderColor: '#DDD',
  },

  vehicleName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },

  registration: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
  },

  line: {
    height: 1,
    backgroundColor: '#DDD',
    marginVertical: 25,
  },

  label: {
    fontSize: 16,
    color: '#777',
    marginTop: 20,
  },

  value: {
    fontSize: 19,
    fontWeight: '600',
    color: '#111',
    marginTop: 5,
  },

  backButton: {
    backgroundColor: '#333',
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },

  backText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    padding: 25,
  },

  emptyTitle: {
    fontSize: 25,
    fontWeight: '700',
    marginBottom: 20,
  },

  button: {
    backgroundColor: '#333',
    padding: 17,
    paddingHorizontal: 40,
    borderRadius: 14,
  },

  buttonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
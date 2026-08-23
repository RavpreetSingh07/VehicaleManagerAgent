import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
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

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>VMA</Text>

      <Text style={styles.title}>Vehicle Manager</Text>

      <Text style={styles.subtitle}>
        Keep your vehicle information organized.
      </Text>

      {vehicle ? (
        <Pressable
          onPress={() => router.push('/vehicle/details')}
        >
          <ImageBackground
            source={require('')}
            style={styles.card}
            imageStyle={styles.cardImage}
            resizeMode="cover"
          >
            <View style={styles.cardContent}>
              <Text style={styles.vehicleName}>
                {vehicle.vehicle_name}
              </Text>

              <Text style={styles.registration}>
                {vehicle.registration_number}
              </Text>

              <Text style={styles.km}>
                {vehicle.current_km ?? '-'} km
              </Text>

              <Text style={styles.details}>
                Tap to view details →
              </Text>
            </View>
          </ImageBackground>
        </Pressable>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No vehicle added
          </Text>

          <Text style={styles.emptyText}>
            Add your vehicle to start managing it.
          </Text>
        </View>
      )}

      <Pressable
        style={styles.button}
        onPress={() => router.push('/vehicle/add')}
      >
        <Text style={styles.buttonText}>
          + Add Vehicle
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    padding: 25,
    paddingTop: 70,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    fontSize: 52,
    fontWeight: '800',
    textAlign: 'center',
    color: '#111',
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111',
    marginTop: 5,
  },

  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 35,
  },

  card: {
    height: 230,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },

  cardImage: {
    borderRadius: 25,
  },

  cardContent: {
    flex: 1,
    justifyContent: 'center',
    width: '55%',
    paddingLeft: 25,
    paddingRight: 10,
  },

  vehicleName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
  },

  registration: {
    fontSize: 16,
    color: '#444',
    marginTop: 5,
  },

  km: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 18,
  },

  details: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginTop: 18,
  },

  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 30,
    borderWidth: 1,
    borderColor: '#DDD',
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
  },

  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },

  button: {
    backgroundColor: '#333',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 35,
  },

  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
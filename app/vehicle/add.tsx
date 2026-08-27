import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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

type VehicleModel = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  variant: string | null;
};

export default function AddVehicleScreen() {
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedModel, setSelectedModel] =
    useState<VehicleModel | null>(null);

  const [showModels, setShowModels] = useState(false);

  const [registrationNumber, setRegistrationNumber] =
    useState('');

  const [registrationDate, setRegistrationDate] =
    useState('');

  const [currentKm, setCurrentKm] =
    useState('');

  const [lastServiceDate, setLastServiceDate] =
    useState('');

  const [lastServiceKm, setLastServiceKm] =
    useState('');

  // --------------------------------
  // LOAD VEHICLE MODELS
  // --------------------------------

  const loadVehicleModels = async () => {
    setLoadingModels(true);

    try {
      const { data, error } = await supabase
        .from('vehicle_models')
        .select(
          'id, brand, model, year, variant'
        )
        .order('brand', {
          ascending: true,
        })
        .order('model', {
          ascending: true,
        })
        .order('year', {
          ascending: false,
        });

      if (error) {
        console.log(
          'Vehicle models error:',
          error.message
        );

        Alert.alert(
          'Unable to load cars',
          error.message
        );
      } else {
        setModels(
          (data || []) as VehicleModel[]
        );
      }
    } catch (error) {
      console.log(
        'Vehicle models error:',
        error
      );

      Alert.alert(
        'Error',
        'Could not load vehicle models.'
      );
    }

    setLoadingModels(false);
  };

  useEffect(() => {
    loadVehicleModels();
  }, []);

  // --------------------------------
  // SAVE VEHICLE
  // --------------------------------

  const saveVehicle = async () => {
    if (!selectedModel) {
      Alert.alert(
        'Select vehicle',
        'Please select your vehicle model.'
      );
      return;
    }

    if (!registrationNumber.trim()) {
      Alert.alert(
        'Missing details',
        'Please enter the registration number.'
      );
      return;
    }

    // DATE VALIDATION

    if (
      registrationDate.trim() &&
      !/^\d{4}-\d{2}-\d{2}$/.test(
        registrationDate.trim()
      )
    ) {
      Alert.alert(
        'Invalid registration date',
        'Please use YYYY-MM-DD format.\nExample: 2026-09-15'
      );
      return;
    }

    if (
      lastServiceDate.trim() &&
      !/^\d{4}-\d{2}-\d{2}$/.test(
        lastServiceDate.trim()
      )
    ) {
      Alert.alert(
        'Invalid service date',
        'Please use YYYY-MM-DD format.\nExample: 2026-09-15'
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

      const vehicleName =
        `${selectedModel.brand} ${selectedModel.model}`;

      // --------------------------------
      // SAVE VEHICLE
      // --------------------------------

      const { error } = await supabase
        .from('vehicles')
        .insert({
          user_id: user.id,

          vehicle_model_id:
            selectedModel.id,

          vehicle_name:
            vehicleName,

          registration_number:
            registrationNumber
              .trim()
              .toUpperCase(),

          // Supabase DATE format:
          // YYYY-MM-DD

          registration_date:
            registrationDate.trim() ||
            null,

          current_km:
            currentKm.trim()
              ? Number(currentKm)
              : null,

          last_service_date:
            lastServiceDate.trim() ||
            null,

          last_service_km:
            lastServiceKm.trim()
              ? Number(lastServiceKm)
              : null,

          // No custom image when vehicle is
          // first created.
          // The default image comes from
          // vehicle_models.image_path.

          custom_image_path: null,
        });

      if (error) {
        console.log(
          'Vehicle save error:',
          error.message
        );

        Alert.alert(
          'Save failed',
          error.message
        );

        setSaving(false);
        return;
      }

      // --------------------------------
      // SUCCESS
      // --------------------------------

      Alert.alert(
        'Success',
        `${vehicleName} added successfully.`,
        [
          {
            text: 'OK',
            onPress: () =>
              router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.log(
        'Save vehicle error:',
        error
      );

      Alert.alert(
        'Save failed',
        'Something went wrong while saving the vehicle.'
      );
    }

    setSaving(false);
  };

  // --------------------------------
  // LOADING
  // --------------------------------

  if (loadingModels) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#FFFFFF"
        />

        <Text style={styles.loadingText}>
          Loading vehicles...
        </Text>
      </View>
    );
  }

  // --------------------------------
  // SCREEN
  // --------------------------------

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
        contentContainerStyle={
          styles.container
        }
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

        {/* TITLE */}

        <Text style={styles.title}>
          Your Vehicle
        </Text>

        <Text style={styles.subtitle}>
          Select your vehicle and add its
          personal information.
        </Text>

        {/* VEHICLE MODEL */}

        <Text style={styles.sectionLabel}>
          VEHICLE MODEL
        </Text>

        <Pressable
          style={[
            styles.selector,
            showModels &&
              styles.selectorActive,
          ]}
          onPress={() =>
            setShowModels(!showModels)
          }
        >
          <View style={styles.selectorInfo}>
            <Text
              style={
                selectedModel
                  ? styles.selectedText
                  : styles.placeholderText
              }
            >
              {selectedModel
                ? `${selectedModel.brand} ${selectedModel.model}`
                : 'Select your vehicle'}
            </Text>

            {selectedModel && (
              <Text style={styles.selectedSubtext}>
                {selectedModel.year
                  ? `${selectedModel.year}`
                  : ''}
                {selectedModel.variant
                  ? ` • ${selectedModel.variant}`
                  : ''}
              </Text>
            )}
          </View>

          <Text style={styles.selectorArrow}>
            {showModels ? '⌃' : '⌄'}
          </Text>
        </Pressable>

        {/* MODEL LIST */}

        {showModels && (
          <View style={styles.modelList}>
            {models.length === 0 ? (
              <View style={styles.noModels}>
                <Text style={styles.noModelsText}>
                  No vehicle models available.
                </Text>
              </View>
            ) : (
              models.map((item) => {
                const isSelected =
                  selectedModel?.id ===
                  item.id;

                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.modelItem,
                      isSelected &&
                        styles.modelItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedModel(item);
                      setShowModels(false);
                    }}
                  >
                    <View style={styles.modelInfo}>
                      <Text
                        style={
                          styles.modelBrand
                        }
                      >
                        {item.brand}
                      </Text>

                      <Text
                        style={
                          styles.modelName
                        }
                      >
                        {item.model}
                      </Text>

                      <Text
                        style={
                          styles.modelVariant
                        }
                      >
                        {item.year
                          ? item.year
                          : ''}
                        {item.variant
                          ? ` • ${item.variant}`
                          : ''}
                      </Text>
                    </View>

                    {isSelected && (
                      <Text
                        style={
                          styles.checkmark
                        }
                      >
                        ✓
                      </Text>
                    )}
                  </Pressable>
                );
              })
            )}
          </View>
        )}

        {/* SELECTED VEHICLE PREVIEW */}

        {selectedModel && (
          <View style={styles.selectedCard}>
            <Text style={styles.selectedCardLabel}>
              SELECTED VEHICLE
            </Text>

            <Text style={styles.selectedCardTitle}>
              {selectedModel.brand}{' '}
              {selectedModel.model}
            </Text>

            <Text style={styles.selectedCardVariant}>
              {selectedModel.year || ''}
              {selectedModel.variant
                ? ` • ${selectedModel.variant}`
                : ''}
            </Text>

            <Text style={styles.selectedCardInfo}>
              VMA will automatically use this
              vehicle's specifications and
              default image.
            </Text>

            {/* IMAGE STATUS */}

            <Text style={styles.imageAvailable}>
              ✓ Default vehicle image available
            </Text>
          </View>
        )}

        {/* REGISTRATION NUMBER */}

        <Text style={styles.sectionLabel}>
          REGISTRATION NUMBER
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. PB07AB1234"
          placeholderTextColor="#555555"
          value={registrationNumber}
          onChangeText={
            setRegistrationNumber
          }
          autoCapitalize="characters"
        />

        {/* REGISTRATION DATE */}

        <Text style={styles.sectionLabel}>
          REGISTRATION DATE
        </Text>

        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#555555"
          value={registrationDate}
          onChangeText={
            setRegistrationDate
          }
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />

        {/* CURRENT KM */}

        <Text style={styles.sectionLabel}>
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

        {/* LAST SERVICE DATE */}

        <Text style={styles.sectionLabel}>
          LAST SERVICE DATE
        </Text>

        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#555555"
          value={lastServiceDate}
          onChangeText={
            setLastServiceDate
          }
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />

        {/* LAST SERVICE KM */}

        <Text style={styles.sectionLabel}>
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
            styles.saveButton,
            saving &&
              styles.saveButtonDisabled,
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
              <Text style={styles.saveText}>
                Save Vehicle
              </Text>

              <Text style={styles.saveArrow}>
                →
              </Text>
            </>
          )}
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },

  loading: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#666666',
    fontSize: 13,
    marginTop: 12,
  },

  container: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 60,
    backgroundColor: '#000000',
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

  /* TITLE */

  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },

  subtitle: {
    color: '#777777',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 25,
  },

  /* LABEL */

  sectionLabel: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 20,
    marginBottom: 8,
  },

  /* SELECTOR */

  selector: {
    minHeight: 62,
    backgroundColor: '#191919',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292929',
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectorActive: {
    borderColor: '#555555',
  },

  selectorInfo: {
    flex: 1,
  },

  placeholderText: {
    color: '#666666',
    fontSize: 16,
  },

  selectedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  selectedSubtext: {
    color: '#777777',
    fontSize: 12,
    marginTop: 4,
  },

  selectorArrow: {
    color: '#FFFFFF',
    fontSize: 22,
    marginLeft: 10,
  },

  /* MODEL LIST */

  modelList: {
    backgroundColor: '#111111',
    borderRadius: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#292929',
    overflow: 'hidden',
  },

  modelItem: {
    minHeight: 75,
    paddingHorizontal: 17,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
  },

  modelItemSelected: {
    backgroundColor: '#1D1D1D',
  },

  modelInfo: {
    flex: 1,
  },

  modelBrand: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '700',
  },

  modelName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },

  modelVariant: {
    color: '#666666',
    fontSize: 11,
    marginTop: 3,
  },

  checkmark: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 10,
  },

  noModels: {
    padding: 20,
  },

  noModelsText: {
    color: '#666666',
    textAlign: 'center',
  },

  /* SELECTED CARD */

  selectedCard: {
    backgroundColor: '#111111',
    borderRadius: 22,
    padding: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#292929',
  },

  selectedCardLabel: {
    color: '#666666',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2,
  },

  selectedCardTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 7,
  },

  selectedCardVariant: {
    color: '#888888',
    fontSize: 13,
    marginTop: 4,
  },

  selectedCardInfo: {
    color: '#666666',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 13,
  },

  imageAvailable: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 13,
  },

  /* INPUT */

  input: {
    height: 54,
    backgroundColor: '#191919',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#292929',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
  },

  /* SAVE */

  saveButton: {
    height: 57,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 30,
    marginBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },

  saveArrow: {
    color: '#000000',
    fontSize: 24,
  },
});
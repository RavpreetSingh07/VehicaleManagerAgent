import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import {
  useVehicle,
} from '@/context/VehicleContext';

import { supabase } from '@/lib/supabase';

import {
  calculateNextServiceKm,
  calculateRemainingServiceKm,
} from '@/lib/vehicleCalculations';

type ServiceEntry = {
  id: string;
  vehicle_id: string;
  service_date: string;
  service_km: number;
  service_type: string;
  service_cost: number;
  notes: string | null;
};

type VehicleModel = Record<string, any> | null;

export default function VehicleDetailsScreen() {
  // --------------------------------
  // GLOBAL VEHICLE CONTEXT
  // --------------------------------

  const {
    selectedVehicle,
    loadingVehicles,
    refreshVehicles,
  } = useVehicle();

  // --------------------------------
  // MODEL / SPECIFICATION DATA
  // --------------------------------

  const [vehicleModel, setVehicleModel] =
    useState<VehicleModel>(null);

  const [vehicleImage, setVehicleImage] =
    useState<string | null>(null);

  const [loadingModel, setLoadingModel] =
    useState(true);

  // --------------------------------
  // SERVICE DATA
  // --------------------------------

  const [services, setServices] =
    useState<ServiceEntry[]>([]);

  const [loadingServices, setLoadingServices] =
    useState(true);

  // --------------------------------
  // SERVICE FORM
  // --------------------------------

  const [showAddService, setShowAddService] =
    useState(false);

  const [savingService, setSavingService] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [serviceDate, setServiceDate] =
    useState('');

  const [serviceKm, setServiceKm] =
    useState('');

  const [serviceType, setServiceType] =
    useState('');

  const [serviceCost, setServiceCost] =
    useState('');

  const [notes, setNotes] =
    useState('');

  // --------------------------------
  // LOAD MODEL + IMAGE
  // --------------------------------

  const loadVehicleModel = async () => {
    setLoadingModel(true);

    try {
      setVehicleModel(null);
      setVehicleImage(null);

      if (!selectedVehicle?.vehicle_model_id) {
        return;
      }

      // --------------------------------
      // LOAD VEHICLE MODEL
      // --------------------------------

      const {
        data,
        error,
      } = await supabase
        .from('vehicle_models')
        .select('*')
        .eq(
          'id',
          selectedVehicle.vehicle_model_id
        )
        .maybeSingle();

      if (error) {
        console.log(
          'Vehicle model error:',
          error.message
        );
      } else {
        setVehicleModel(
          (data || null) as VehicleModel
        );

        // --------------------------------
        // DEFAULT MODEL IMAGE
        // --------------------------------

        if (data?.image_path) {
          const {
            data: imageData,
          } = supabase.storage
            .from('vehicle-models')
            .getPublicUrl(
              data.image_path
            );

          if (
            imageData?.publicUrl
          ) {
            setVehicleImage(
              imageData.publicUrl
            );
          }
        }
      }

      // --------------------------------
      // CUSTOM IMAGE OVERRIDES MODEL IMAGE
      // --------------------------------

      if (
        selectedVehicle.custom_image_path
      ) {
        const {
          data: customImage,
        } = supabase.storage
          .from('vehicle-models')
          .getPublicUrl(
            selectedVehicle.custom_image_path
          );

        if (
          customImage?.publicUrl
        ) {
          setVehicleImage(
            customImage.publicUrl
          );
        }
      }
    } catch (error) {
      console.log(
        'Vehicle model loading error:',
        error
      );
    } finally {
      setLoadingModel(false);
    }
  };

  // --------------------------------
  // LOAD SERVICES
  // --------------------------------

  const loadServices = async () => {
    setLoadingServices(true);

    try {
      if (!selectedVehicle?.id) {
        setServices([]);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/auth/login');
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from('service_entries')
        .select(
          'id, vehicle_id, service_date, service_km, service_type, service_cost, notes'
        )
        .eq(
          'user_id',
          user.id
        )
        .eq(
          'vehicle_id',
          selectedVehicle.id
        )
        .order('service_date', {
          ascending: false,
        });

      if (error) {
        console.log(
          'Service history error:',
          error.message
        );

        setServices([]);
        return;
      }

      setServices(
        (data || []) as ServiceEntry[]
      );
    } catch (error) {
      console.log(
        'Service history error:',
        error
      );

      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  // --------------------------------
  // LOAD EVERYTHING WHEN VEHICLE CHANGES
  // --------------------------------

  useEffect(() => {
    if (!selectedVehicle) {
      setVehicleModel(null);
      setVehicleImage(null);
      setServices([]);
      return;
    }

    loadVehicleModel();
    loadServices();
  }, [selectedVehicle?.id]);

  // --------------------------------
  // SPEC HELPER
  // --------------------------------

  const getSpec = (
    ...keys: string[]
  ) => {
    for (const key of keys) {
      const value =
        vehicleModel?.[key];

      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ''
      ) {
        return value;
      }
    }

    return null;
  };

  // --------------------------------
  // MODEL VALUES
  // --------------------------------

  const modelMake = getSpec(
    'make',
    'manufacturer',
    'brand'
  );

  const modelName = getSpec(
    'model',
    'model_name'
  );

  const modelVariant = getSpec(
    'variant',
    'trim',
    'variant_name'
  );

  const modelYear = getSpec(
    'year',
    'model_year'
  );

  const vehicleType = getSpec(
    'vehicle_type',
    'type'
  );

  const bodyType = getSpec(
    'body_type',
    'body'
  );

  const fuelType = getSpec(
    'fuel_type',
    'fuel'
  );

  const engineCc = getSpec(
    'engine_cc',
    'engine_displacement',
    'displacement'
  );

  const cylinders = getSpec(
    'cylinders',
    'cylinder_count'
  );

  const power = getSpec(
    'power',
    'max_power',
    'power_ps',
    'bhp'
  );

  const torque = getSpec(
    'torque',
    'max_torque'
  );

  const transmission = getSpec(
    'transmission',
    'gearbox'
  );

  const drivetrain = getSpec(
    'drivetrain',
    'drive_type'
  );

  const seating = getSpec(
    'seating_capacity',
    'seats',
    'seating'
  );

  const doors = getSpec(
    'doors',
    'number_of_doors'
  );

  const fuelTank = getSpec(
    'fuel_tank_capacity',
    'fuel_capacity',
    'tank_capacity'
  );

  const mileage = getSpec(
    'mileage',
    'claimed_mileage',
    'fuel_economy',
    'economy'
  );

  const kerbWeight = getSpec(
    'kerb_weight',
    'curb_weight',
    'weight'
  );

  const length = getSpec(
    'length',
    'length_mm'
  );

  const width = getSpec(
    'width',
    'width_mm'
  );

  const height = getSpec(
    'height',
    'height_mm'
  );

  const bootCapacity = getSpec(
    'boot_capacity',
    'boot_space',
    'cargo_capacity'
  );

  const tyreSize = getSpec(
    'tyre_size',
    'tire_size',
    'tyre_sizes',
    'tire_sizes'
  );

  const batteryCapacity = getSpec(
    'battery_capacity',
    'battery_kwh'
  );

  const electricRange = getSpec(
    'range',
    'electric_range',
    'range_km'
  );

  const chargingInfo = getSpec(
    'charging_info',
    'charging',
    'charge_time'
  );

  const hasEngineSpecs =
    engineCc ||
    cylinders ||
    power ||
    torque ||
    transmission ||
    drivetrain;

  const hasPracticalSpecs =
    seating ||
    doors ||
    fuelTank ||
    mileage ||
    kerbWeight;

  const hasDimensionSpecs =
    length ||
    width ||
    height ||
    bootCapacity ||
    tyreSize;

  const hasEvSpecs =
    batteryCapacity ||
    electricRange ||
    chargingInfo;

  // --------------------------------
  // SAVE SERVICE
  // --------------------------------

  const saveService = async () => {
    setMessage('');

    if (
      !serviceKm ||
      !serviceType ||
      !serviceCost
    ) {
      setMessage(
        'Please fill in service KM, type and cost.'
      );
      return;
    }

    const km =
      Number(serviceKm);

    const cost =
      Number(serviceCost);

    if (km <= 0) {
      setMessage(
        'Service KM must be greater than 0.'
      );
      return;
    }

    if (cost < 0) {
      setMessage(
        'Service cost cannot be negative.'
      );
      return;
    }

    if (!selectedVehicle?.id) {
      setMessage(
        'Please select a vehicle first.'
      );
      return;
    }

    setSavingService(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(
          'Please log in again.'
        );
        return;
      }

      const finalServiceDate =
        serviceDate ||
        new Date()
          .toISOString()
          .split('T')[0];

      // --------------------------------
      // SAVE SERVICE FOR SELECTED VEHICLE
      // --------------------------------

      const {
        error: serviceError,
      } = await supabase
        .from('service_entries')
        .insert({
          vehicle_id:
            selectedVehicle.id,

          user_id:
            user.id,

          service_date:
            finalServiceDate,

          service_km:
            km,

          service_type:
            serviceType,

          service_cost:
            cost,

          notes:
            notes || null,
        });

      if (serviceError) {
        console.log(
          'Service save error:',
          serviceError.message
        );

        setMessage(
          `Save failed: ${serviceError.message}`
        );

        return;
      }

      // --------------------------------
      // UPDATE SELECTED VEHICLE
      // --------------------------------

      const {
        error: vehicleError,
      } = await supabase
        .from('vehicles')
        .update({
          last_service_km:
            km,

          last_service_date:
            finalServiceDate,
        })
        .eq(
          'id',
          selectedVehicle.id
        )
        .eq(
          'user_id',
          user.id
        );

      if (vehicleError) {
        console.log(
          'Vehicle update error:',
          vehicleError.message
        );

        setMessage(
          `Service saved, but vehicle update failed: ${vehicleError.message}`
        );

        return;
      }

      // --------------------------------
      // CLEAR FORM
      // --------------------------------

      setServiceDate('');
      setServiceKm('');
      setServiceType('');
      setServiceCost('');
      setNotes('');

      setShowAddService(false);

      // --------------------------------
      // REFRESH CONTEXT + SERVICE DATA
      // --------------------------------

      await refreshVehicles();
      await loadServices();

      setMessage(
        '✓ Service saved and vehicle updated'
      );
    } catch (error) {
      console.log(
        'Service error:',
        error
      );

      setMessage(
        'Something went wrong.'
      );
    } finally {
      setSavingService(false);
    }
  };

  // --------------------------------
  // CALCULATIONS
  // --------------------------------

  const currentKm =
    Number(
      selectedVehicle?.current_km
    ) || 0;

  const lastServiceKm =
    Number(
      selectedVehicle?.last_service_km
    ) || 0;

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
    remainingServiceKm === 0 &&
    nextServiceKm > 0;

  const totalServiceCost =
    services.reduce(
      (sum, service) =>
        sum +
        Number(
          service.service_cost || 0
        ),
      0
    );

  // --------------------------------
  // LOADING
  // --------------------------------

  if (
    loadingVehicles ||
    loadingModel
  ) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#FFFFFF"
        />
      </View>
    );
  }

  // --------------------------------
  // NO VEHICLE
  // --------------------------------

  if (!selectedVehicle) {
    return (
      <View style={styles.empty}>
        <Text
          style={styles.emptyTitle}
        >
          No vehicle selected
        </Text>

        <Pressable
          style={styles.button}
          onPress={() =>
            router.push(
              '/vehicle/add'
            )
          }
        >
          <Text
            style={styles.buttonText}
          >
            Add Vehicle
          </Text>
        </Pressable>
      </View>
    );
  }

  // --------------------------------
  // DISPLAY NAME
  // --------------------------------

  const displayVehicleName =
    modelMake &&
    modelName
      ? `${modelMake} ${modelName}`
      : selectedVehicle.vehicle_name;

  const displayVariant =
    modelVariant ||
    null;

  // --------------------------------
  // SCREEN
  // --------------------------------

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
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* -------------------------------- */}
        {/* HEADER */}
        {/* -------------------------------- */}

        <View style={styles.header}>
          <Pressable
            style={
              styles.backCircle
            }
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.backArrow
              }
            >
              ‹
            </Text>
          </Pressable>

          <Text
            style={
              styles.headerTitle
            }
          >
            Vehicle
          </Text>

          <View
            style={
              styles.headerSpacer
            }
          />
        </View>

        {/* -------------------------------- */}
        {/* VEHICLE HERO */}
        {/* -------------------------------- */}

        <View
          style={styles.heroCard}
        >
          {vehicleImage ? (
            <ImageBackground
              source={{
                uri: vehicleImage,
              }}
              style={
                styles.heroImage
              }
              imageStyle={
                styles.heroImageStyle
              }
            >
              <View
                style={
                  styles.heroOverlay
                }
              />

              <View
                style={
                  styles.heroContent
                }
              >
                <Text
                  style={
                    styles.smallLabel
                  }
                >
                  YOUR VEHICLE
                </Text>

                <Text
                  style={
                    styles.vehicleName
                  }
                  numberOfLines={2}
                >
                  {displayVehicleName}
                </Text>

                {displayVariant && (
                  <Text
                    style={
                      styles.variantText
                    }
                  >
                    {displayVariant}
                    {modelYear
                      ? ` • ${modelYear}`
                      : ''}
                  </Text>
                )}

                <Text
                  style={
                    styles.registration
                  }
                >
                  {
                    selectedVehicle.registration_number
                  }
                </Text>

                <View
                  style={
                    styles.heroDivider
                  }
                />

                <Text
                  style={
                    styles.kmNumber
                  }
                >
                  {currentKm.toLocaleString()}
                </Text>

                <Text
                  style={
                    styles.kmLabel
                  }
                >
                  CURRENT KM
                </Text>
              </View>
            </ImageBackground>
          ) : (
            <View
              style={
                styles.heroFallback
              }
            >
              <Text
                style={
                  styles.smallLabel
                }
              >
                YOUR VEHICLE
              </Text>

              <Text
                style={
                  styles.vehicleName
                }
                numberOfLines={2}
              >
                {displayVehicleName}
              </Text>

              {displayVariant && (
                <Text
                  style={
                    styles.variantText
                  }
                >
                  {displayVariant}
                  {modelYear
                    ? ` • ${modelYear}`
                    : ''}
                </Text>
              )}

              <Text
                style={
                  styles.registration
                }
              >
                {
                  selectedVehicle.registration_number
                }
              </Text>

              <View
                style={
                  styles.heroDivider
                }
              />

              <Text
                style={
                  styles.kmNumber
                }
              >
                {currentKm.toLocaleString()}
              </Text>

              <Text
                style={
                  styles.kmLabel
                }
              >
                CURRENT KM
              </Text>
            </View>
          )}
        </View>

        {/* -------------------------------- */}
        {/* VEHICLE INFORMATION */}
        {/* -------------------------------- */}

        <Text
          style={styles.sectionTitle}
        >
          Vehicle Information
        </Text>

        <View
          style={styles.infoGrid}
        >
          <View
            style={styles.infoCard}
          >
            <Text
              style={styles.infoLabel}
            >
              REGISTRATION
            </Text>

            <Text
              style={styles.infoValue}
            >
              {
                selectedVehicle.registration_number ||
                '-'
              }
            </Text>
          </View>

          <View
            style={styles.infoCard}
          >
            <Text
              style={styles.infoLabel}
            >
              REGISTRATION DATE
            </Text>

            <Text
              style={styles.infoValue}
            >
              {
                selectedVehicle.registration_date ||
                '-'
              }
            </Text>
          </View>
        </View>

        {/* -------------------------------- */}
        {/* MODEL SUMMARY */}
        {/* -------------------------------- */}

        {(vehicleType ||
          bodyType ||
          modelYear) && (
          <View
            style={styles.infoGrid}
          >
            {vehicleType && (
              <View
                style={
                  styles.infoCard
                }
              >
                <Text
                  style={
                    styles.infoLabel
                  }
                >
                  VEHICLE TYPE
                </Text>

                <Text
                  style={
                    styles.infoValue
                  }
                >
                  {String(
                    vehicleType
                  )}
                </Text>
              </View>
            )}

            {bodyType && (
              <View
                style={
                  styles.infoCard
                }
              >
                <Text
                  style={
                    styles.infoLabel
                  }
                >
                  BODY TYPE
                </Text>

                <Text
                  style={
                    styles.infoValue
                  }
                >
                  {String(
                    bodyType
                  )}
                </Text>
              </View>
            )}

            {modelYear && (
              <View
                style={
                  styles.infoCard
                }
              >
                <Text
                  style={
                    styles.infoLabel
                  }
                >
                  MODEL YEAR
                </Text>

                <Text
                  style={
                    styles.infoValue
                  }
                >
                  {String(
                    modelYear
                  )}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* -------------------------------- */}
        {/* VEHICLE SPECIFICATIONS */}
        {/* -------------------------------- */}

        {vehicleModel && (
          <>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Vehicle Specifications
            </Text>

            {/* ENGINE / POWER */}

            {hasEngineSpecs && (
              <View
                style={
                  styles.specSection
                }
              >
                <Text
                  style={
                    styles.specSectionTitle
                  }
                >
                  ENGINE & PERFORMANCE
                </Text>

                <View
                  style={
                    styles.specGrid
                  }
                >
                  {engineCc && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        ENGINE
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          engineCc
                        )}{' '}
                        cc
                      </Text>
                    </View>
                  )}

                  {cylinders && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        CYLINDERS
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          cylinders
                        )}
                      </Text>
                    </View>
                  )}

                  {power && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        POWER
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          power
                        )}
                      </Text>
                    </View>
                  )}

                  {torque && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        TORQUE
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          torque
                        )}
                      </Text>
                    </View>
                  )}

                  {transmission && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        TRANSMISSION
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          transmission
                        )}
                      </Text>
                    </View>
                  )}

                  {drivetrain && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        DRIVETRAIN
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          drivetrain
                        )}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* FUEL */}

            {(fuelType ||
              fuelTank ||
              mileage) && (
              <View
                style={
                  styles.specSection
                }
              >
                <Text
                  style={
                    styles.specSectionTitle
                  }
                >
                  FUEL & ECONOMY
                </Text>

                <View
                  style={
                    styles.specGrid
                  }
                >
                  {fuelType && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        FUEL TYPE
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          fuelType
                        )}
                      </Text>
                    </View>
                  )}

                  {mileage && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        MILEAGE
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          mileage
                        )}
                      </Text>
                    </View>
                  )}

                  {fuelTank && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        FUEL TANK
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          fuelTank
                        )}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* PRACTICAL */}

            {hasPracticalSpecs && (
              <View
                style={
                  styles.specSection
                }
              >
                <Text
                  style={
                    styles.specSectionTitle
                  }
                >
                  PRACTICAL
                </Text>

                <View
                  style={
                    styles.specGrid
                  }
                >
                  {seating && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        SEATING
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          seating
                        )}
                      </Text>
                    </View>
                  )}

                  {doors && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        DOORS
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          doors
                        )}
                      </Text>
                    </View>
                  )}

                  {kerbWeight && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        KERB WEIGHT
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          kerbWeight
                        )}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* DIMENSIONS */}

            {hasDimensionSpecs && (
              <View
                style={
                  styles.specSection
                }
              >
                <Text
                  style={
                    styles.specSectionTitle
                  }
                >
                  DIMENSIONS
                </Text>

                <View
                  style={
                    styles.specGrid
                  }
                >
                  {length && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        LENGTH
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          length
                        )}
                      </Text>
                    </View>
                  )}

                  {width && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        WIDTH
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          width
                        )}
                      </Text>
                    </View>
                  )}

                  {height && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        HEIGHT
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          height
                        )}
                      </Text>
                    </View>
                  )}

                  {bootCapacity && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        BOOT / CARGO
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          bootCapacity
                        )}
                      </Text>
                    </View>
                  )}

                  {tyreSize && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        TYRES
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          tyreSize
                        )}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* EV */}

            {hasEvSpecs && (
              <View
                style={
                  styles.specSection
                }
              >
                <Text
                  style={
                    styles.specSectionTitle
                  }
                >
                  ELECTRIC / EV
                </Text>

                <View
                  style={
                    styles.specGrid
                  }
                >
                  {batteryCapacity && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        BATTERY
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          batteryCapacity
                        )}
                      </Text>
                    </View>
                  )}

                  {electricRange && (
                    <View
                      style={
                        styles.specCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        RANGE
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          electricRange
                        )}
                      </Text>
                    </View>
                  )}

                  {chargingInfo && (
                    <View
                      style={
                        styles.specWideCard
                      }
                    >
                      <Text
                        style={
                          styles.specLabel
                        }
                      >
                        CHARGING
                      </Text>

                      <Text
                        style={
                          styles.specValue
                        }
                      >
                        {String(
                          chargingInfo
                        )}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </>
        )}

        {/* -------------------------------- */}
        {/* NO SPECS YET */}
        {/* -------------------------------- */}

        {!vehicleModel && (
          <View
            style={
              styles.noSpecsCard
            }
          >
            <Text
              style={
                styles.noSpecsTitle
              }
            >
              Vehicle specifications
            </Text>

            <Text
              style={
                styles.noSpecsText
              }
            >
              Specifications will appear here
              once this vehicle is connected
              to the VMA vehicle catalogue.
            </Text>
          </View>
        )}

        {/* -------------------------------- */}
        {/* SERVICE STATUS */}
        {/* -------------------------------- */}

        <View
          style={styles.sectionHeader}
        >
          <Text
            style={styles.sectionTitle}
          >
            Service
          </Text>

          <Text
            style={[
              styles.status,
              serviceDue &&
                styles.statusDue,
            ]}
          >
            {serviceDue
              ? 'DUE'
              : 'ON TRACK'}
          </Text>
        </View>

        <View
          style={styles.serviceCard}
        >
          <View
            style={styles.serviceTop}
          >
            <View>
              <Text
                style={styles.infoLabel}
              >
                LAST SERVICE
              </Text>

              <Text
                style={
                  styles.serviceValue
                }
              >
                {lastServiceKm > 0
                  ? `${lastServiceKm.toLocaleString()} km`
                  : '-'}
              </Text>
            </View>

            <View
              style={
                styles.serviceIcon
              }
            >
              <Text
                style={
                  styles.iconText
                }
              >
                🔧
              </Text>
            </View>
          </View>

          <View
            style={
              styles.serviceDivider
            }
          />

          <View
            style={
              styles.serviceRow
            }
          >
            <View>
              <Text
                style={
                  styles.infoLabel
                }
              >
                NEXT SERVICE
              </Text>

              <Text
                style={
                  styles.serviceValue
                }
              >
                {nextServiceKm > 0
                  ? `${nextServiceKm.toLocaleString()} km`
                  : '-'}
              </Text>
            </View>

            <View
              style={
                styles.remainingBox
              }
            >
              <Text
                style={
                  styles.remainingNumber
                }
              >
                {remainingServiceKm >
                0
                  ? remainingServiceKm.toLocaleString()
                  : '0'}
              </Text>

              <Text
                style={
                  styles.remainingLabel
                }
              >
                KM LEFT
              </Text>
            </View>
          </View>

          {nextServiceKm > 0 && (
            <View
              style={
                styles.progressBackground
              }
            >
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

          <Text
            style={
              styles.lastServiceDate
            }
          >
            Last service date:{' '}
            {
              selectedVehicle.last_service_date ||
              '-'
            }
          </Text>
        </View>

        {/* -------------------------------- */}
        {/* SERVICE RECORDS */}
        {/* -------------------------------- */}

        <View
          style={
            styles.addServiceHeader
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Service Records
          </Text>

          <Pressable
            style={
              styles.addButton
            }
            onPress={() => {
              setMessage('');

              setShowAddService(
                !showAddService
              );
            }}
          >
            <Text
              style={
                styles.addButtonText
              }
            >
              {showAddService
                ? 'Close'
                : '+ Add'}
            </Text>
          </Pressable>
        </View>

        {/* ADD SERVICE FORM */}

        {showAddService && (
          <View
            style={styles.formCard}
          >
            <Text
              style={styles.formTitle}
            >
              New Service
            </Text>

            <Text
              style={styles.inputLabel}
            >
              SERVICE DATE
            </Text>

            <TextInput
              value={serviceDate}
              onChangeText={
                setServiceDate
              }
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#555"
              style={styles.input}
            />

            <Text
              style={styles.inputLabel}
            >
              SERVICE KM
            </Text>

            <TextInput
              value={serviceKm}
              onChangeText={
                setServiceKm
              }
              placeholder="e.g. 15000"
              placeholderTextColor="#555"
              keyboardType="numeric"
              style={styles.input}
            />

            <Text
              style={styles.inputLabel}
            >
              SERVICE TYPE
            </Text>

            <TextInput
              value={serviceType}
              onChangeText={
                setServiceType
              }
              placeholder="e.g. Regular Service"
              placeholderTextColor="#555"
              style={styles.input}
            />

            <Text
              style={styles.inputLabel}
            >
              SERVICE COST
            </Text>

            <View
              style={
                styles.costInput
              }
            >
              <Text
                style={styles.rupee}
              >
                ₹
              </Text>

              <TextInput
                value={serviceCost}
                onChangeText={
                  setServiceCost
                }
                placeholder="e.g. 4500"
                placeholderTextColor="#555"
                keyboardType="decimal-pad"
                style={
                  styles.costTextInput
                }
              />
            </View>

            <Text
              style={styles.inputLabel}
            >
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
              style={[
                styles.saveButton,
                savingService &&
                  styles.buttonDisabled,
              ]}
              onPress={
                saveService
              }
              disabled={
                savingService
              }
            >
              {savingService ? (
                <ActivityIndicator
                  color="#000000"
                />
              ) : (
                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Save Service
                </Text>
              )}
            </Pressable>

            {message !== '' && (
              <Text
                style={
                  styles.message
                }
              >
                {message}
              </Text>
            )}
          </View>
        )}

        {/* -------------------------------- */}
        {/* SERVICE STATS */}
        {/* -------------------------------- */}

        <View
          style={styles.statsCard}
        >
          <View>
            <Text
              style={styles.statsLabel}
            >
              TOTAL SERVICES
            </Text>

            <Text
              style={styles.statsValue}
            >
              {services.length}
            </Text>
          </View>

          <View
            style={styles.statsRight}
          >
            <Text
              style={styles.statsLabel}
            >
              TOTAL SPENT
            </Text>

            <Text
              style={styles.statsValue}
            >
              ₹
              {totalServiceCost.toFixed(
                0
              )}
            </Text>
          </View>
        </View>

        {/* -------------------------------- */}
        {/* SERVICE HISTORY */}
        {/* -------------------------------- */}

        {loadingServices ? (
          <View
            style={
              styles.loadingHistory
            }
          >
            <ActivityIndicator
              color="#FFFFFF"
            />
          </View>
        ) : services.length ===
          0 ? (
          <View
            style={
              styles.emptyHistory
            }
          >
            <Text
              style={
                styles.emptyHistoryTitle
              }
            >
              No service history yet
            </Text>

            <Text
              style={
                styles.emptyHistoryText
              }
            >
              Your saved services for{' '}
              {
                selectedVehicle.vehicle_name
              } will appear here.
            </Text>
          </View>
        ) : (
          services.map(
            (service) => (
              <View
                key={service.id}
                style={
                  styles.historyCard
                }
              >
                <View
                  style={
                    styles.historyTop
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.historyType
                      }
                    >
                      {
                        service.service_type
                      }
                    </Text>

                    <Text
                      style={
                        styles.historyDate
                      }
                    >
                      {
                        service.service_date
                      }
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.historyCost
                    }
                  >
                    ₹
                    {Number(
                      service.service_cost
                    ).toFixed(0)}
                  </Text>
                </View>

                <View
                  style={
                    styles.historyDivider
                  }
                />

                <Text
                  style={
                    styles.historyKm
                  }
                >
                  {Number(
                    service.service_km
                  ).toLocaleString()}{' '}
                  km
                </Text>

                {service.notes && (
                  <Text
                    style={
                      styles.historyNotes
                    }
                  >
                    {service.notes}
                  </Text>
                )}
              </View>
            )
          )
        )}

        {/* -------------------------------- */}
        {/* QUICK ACTIONS */}
        {/* -------------------------------- */}

        <Text
          style={styles.sectionTitle}
        >
          Quick Actions
        </Text>

        <View
          style={styles.actionRow}
        >
          <Pressable
            style={styles.actionCard}
            onPress={() =>
              router.push(
                '/vehicle/add'
              )
            }
          >
            <Text
              style={
                styles.actionIcon
              }
            >
              ✎
            </Text>

            <Text
              style={
                styles.actionTitle
              }
            >
              Update
            </Text>

            <Text
              style={
                styles.actionSubtitle
              }
            >
              Vehicle details
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.actionIcon
              }
            >
              ⌂
            </Text>

            <Text
              style={
                styles.actionTitle
              }
            >
              Home
            </Text>

            <Text
              style={
                styles.actionSubtitle
              }
            >
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

  // --------------------------------
  // HEADER
  // --------------------------------

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
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

  // --------------------------------
  // HERO
  // --------------------------------

  heroCard: {
    height: 350,
    borderRadius: 28,
    backgroundColor: '#111111',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#292929',
  },

  heroImage: {
    flex: 1,
  },

  heroImageStyle: {
    resizeMode: 'cover',
  },

  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      'rgba(0,0,0,0.42)',
  },

  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 25,
  },

  heroFallback: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 28,
  },

  smallLabel: {
    color: '#D0D0D0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
  },

  vehicleName: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
    marginTop: 8,
    textShadowColor:
      'rgba(0,0,0,0.8)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 4,
  },

  variantText: {
    color: '#D0D0D0',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },

  registration: {
    color: '#D0D0D0',
    fontSize: 15,
    marginTop: 5,
  },

  heroDivider: {
    height: 1,
    backgroundColor:
      'rgba(255,255,255,0.18)',
    marginVertical: 20,
  },

  kmNumber: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '900',
  },

  kmLabel: {
    color: '#D0D0D0',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 1,
  },

  // --------------------------------
  // SECTION
  // --------------------------------

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    marginTop: 32,
    marginBottom: 16,
  },

  // --------------------------------
  // BASIC INFO
  // --------------------------------

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  infoCard: {
    flex: 1,
    minWidth: '46%',
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
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },

  infoValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },

  // --------------------------------
  // SPECIFICATIONS
  // --------------------------------

  specSection: {
    marginBottom: 3,
  },

  specSectionTitle: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
  },

  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  specCard: {
    width: '48%',
    backgroundColor: '#111111',
    borderRadius: 18,
    padding: 17,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#292929',
    minHeight: 90,
    justifyContent: 'center',
  },

  specWideCard: {
    width: '100%',
    backgroundColor: '#111111',
    borderRadius: 18,
    padding: 17,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#292929',
    minHeight: 90,
    justifyContent: 'center',
  },

  specLabel: {
    color: '#666666',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  specValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },

  noSpecsCard: {
    backgroundColor: '#0D0D0D',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222222',
  },

  noSpecsTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  noSpecsText: {
    color: '#666666',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  // --------------------------------
  // SERVICE
  // --------------------------------

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

  // --------------------------------
  // SERVICE RECORDS
  // --------------------------------

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

  // --------------------------------
  // SERVICE FORM
  // --------------------------------

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

  buttonDisabled: {
    opacity: 0.6,
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

  // --------------------------------
  // SERVICE STATS
  // --------------------------------

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

  // --------------------------------
  // QUICK ACTIONS
  // --------------------------------

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

  // --------------------------------
  // EMPTY
  // --------------------------------

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
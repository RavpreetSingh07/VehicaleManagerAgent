import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';

type Vehicle = {
  id: string;
  vehicle_model_id: string | null;
  vehicle_name: string;
  registration_number: string;
  registration_date: string | null;
  current_km: number | null;
  last_service_date: string | null;
  last_service_km: number | null;
  custom_image_path: string | null;
  created_at: string;
};

type FuelEntry = {
  id: string;
  vehicle_id: string | null;
  fuel_litres: number | null;
  fuel_cost: number | null;
  distance_km: number | null;
  mileage: number | null;
  created_at: string;
};

type ServiceEntry = {
  id: string;
  vehicle_id: string | null;
  service_date: string;
  service_km: number | null;
  service_type: string;
  service_cost: number | null;
};

export default function HomeScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] =
    useState<Vehicle | null>(null);

  const [fuelEntries, setFuelEntries] =
    useState<FuelEntry[]>([]);

  const [serviceEntries, setServiceEntries] =
    useState<ServiceEntry[]>([]);

  const [vehicleImage, setVehicleImage] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  // --------------------------------
  // TIME BASED GREETING
  // --------------------------------

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return 'Good morning 👋';
    }

    if (hour >= 12 && hour < 17) {
      return 'Good afternoon 👋';
    }

    if (hour >= 17 && hour < 21) {
      return 'Good evening 👋';
    }

    return 'Good night 🌙';
  };

  // --------------------------------
  // LOAD VEHICLE IMAGE
  // --------------------------------

  const loadVehicleImage = async (
    vehicle: Vehicle
  ) => {
    try {
      // CUSTOM IMAGE FIRST

      if (vehicle.custom_image_path) {
        const {
          data: customImage,
        } = supabase.storage
          .from('vehicle-models')
          .getPublicUrl(
            vehicle.custom_image_path
          );

        if (customImage?.publicUrl) {
          setVehicleImage(
            customImage.publicUrl
          );
          return;
        }
      }

      // DEFAULT VEHICLE MODEL IMAGE

      if (!vehicle.vehicle_model_id) {
        setVehicleImage(null);
        return;
      }

      const {
        data: modelData,
        error: modelError,
      } = await supabase
        .from('vehicle_models')
        .select('image_path')
        .eq(
          'id',
          vehicle.vehicle_model_id
        )
        .maybeSingle();

      if (modelError) {
        console.log(
          'Vehicle image model error:',
          modelError.message
        );

        setVehicleImage(null);
        return;
      }

      if (modelData?.image_path) {
        const {
          data: imageData,
        } = supabase.storage
          .from('vehicle-models')
          .getPublicUrl(
            modelData.image_path
          );

        const publicUrl =
          imageData?.publicUrl || null;

        console.log(
          'Vehicle image URL:',
          publicUrl
        );

        setVehicleImage(publicUrl);
      } else {
        console.log(
          'No image_path found for vehicle model'
        );

        setVehicleImage(null);
      }
    } catch (error) {
      console.log(
        'Vehicle image error:',
        error
      );

      setVehicleImage(null);
    }
  };

  // --------------------------------
  // LOAD SELECTED VEHICLE DATA
  // --------------------------------

  const loadVehicleData = async (
    vehicle: Vehicle
  ) => {
    setSelectedVehicle(vehicle);

    // Clear old image immediately
    setVehicleImage(null);

    await loadVehicleImage(vehicle);

    // --------------------------------
    // FUEL FOR THIS VEHICLE ONLY
    // --------------------------------

    const {
      data: fuelData,
      error: fuelError,
    } = await supabase
      .from('fuel_entries')
      .select(
        'id, vehicle_id, fuel_litres, fuel_cost, distance_km, mileage, created_at'
      )
      .eq(
        'vehicle_id',
        vehicle.id
      )
      .order('created_at', {
        ascending: false,
      });

    if (fuelError) {
      console.log(
        'Fuel loading error:',
        fuelError.message
      );
    }

    setFuelEntries(
      (fuelData || []) as FuelEntry[]
    );

    // --------------------------------
    // SERVICE FOR THIS VEHICLE ONLY
    // --------------------------------

    const {
      data: serviceData,
      error: serviceError,
    } = await supabase
      .from('service_entries')
      .select(
        'id, vehicle_id, service_date, service_km, service_type, service_cost'
      )
      .eq(
        'vehicle_id',
        vehicle.id
      )
      .order('service_date', {
        ascending: false,
      });

    if (serviceError) {
      console.log(
        'Service loading error:',
        serviceError.message
      );
    }

    setServiceEntries(
      (serviceData || []) as ServiceEntry[]
    );
  };

  // --------------------------------
  // LOAD DASHBOARD
  // --------------------------------

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

      // LOAD ALL VEHICLES

      const {
        data: vehicleData,
        error: vehicleError,
      } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: false,
        });

      if (vehicleError) {
        console.log(
          'Vehicle loading error:',
          vehicleError.message
        );
      }

      const loadedVehicles =
        (vehicleData || []) as Vehicle[];

      setVehicles(loadedVehicles);

      // NO VEHICLES

      if (loadedVehicles.length === 0) {
        setSelectedVehicle(null);
        setFuelEntries([]);
        setServiceEntries([]);
        setVehicleImage(null);
        setLoading(false);
        return;
      }

      // SELECT NEWEST VEHICLE BY DEFAULT

      const firstVehicle =
        loadedVehicles[0];

      await loadVehicleData(
        firstVehicle
      );
    } catch (error) {
      console.log(
        'Dashboard error:',
        error
      );
    }

    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  // --------------------------------
  // SWITCH VEHICLE
  // --------------------------------

  const switchVehicle = async (
    vehicle: Vehicle
  ) => {
    if (
      selectedVehicle?.id === vehicle.id
    ) {
      return;
    }

    await loadVehicleData(vehicle);
  };

  // --------------------------------
  // FUEL CALCULATIONS
  // --------------------------------

  const totalFuel =
    fuelEntries.reduce(
      (sum, entry) =>
        sum +
        Number(
          entry.fuel_litres || 0
        ),
      0
    );

  const totalFuelCost =
    fuelEntries.reduce(
      (sum, entry) =>
        sum +
        Number(
          entry.fuel_cost || 0
        ),
      0
    );

  const totalDistance =
    fuelEntries.reduce(
      (sum, entry) =>
        sum +
        Number(
          entry.distance_km || 0
        ),
      0
    );

  const averageMileage =
    totalFuel > 0
      ? totalDistance / totalFuel
      : 0;

  // --------------------------------
  // SERVICE CALCULATIONS
  // --------------------------------

  const totalServiceCost =
    serviceEntries.reduce(
      (sum, entry) =>
        sum +
        Number(
          entry.service_cost || 0
        ),
      0
    );

  const totalExpense =
    totalFuelCost +
    totalServiceCost;

  const lastService =
    serviceEntries.length > 0
      ? serviceEntries[0]
      : null;

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
      ? lastServiceKm +
        serviceInterval
      : 0;

  const remainingServiceKm =
    nextServiceKm > 0
      ? Math.max(
          nextServiceKm -
            currentKm,
          0
        )
      : 0;

  // --------------------------------
  // LOADING
  // --------------------------------

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

  // --------------------------------
  // SCREEN
  // --------------------------------

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/* HEADER */}

        <View style={styles.header}>
          <Image
            source={require('../../assets/images/vma-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <View
            style={styles.statusCircle}
          >
            <View
              style={styles.statusDot}
            />
          </View>
        </View>

        {/* GREETING */}

        <Text style={styles.greeting}>
          {getGreeting()}
        </Text>

        <Text
          style={styles.welcomeText}
        >
          Everything about your vehicle,
          {'\n'}in one place.
        </Text>

        {/* -------------------------------- */}
        {/* VEHICLE SWITCHER */}
        {/* -------------------------------- */}

        {vehicles.length > 1 && (
          <>
            <View
              style={
                styles.vehicleSwitcherHeader
              }
            >
              <Text
                style={
                  styles.vehicleSwitcherTitle
                }
              >
                YOUR VEHICLES
              </Text>

              <Text
                style={
                  styles.vehicleSwitcherCount
                }
              >
                {vehicles.length}{' '}
                VEHICLES
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.vehicleSwitcher
              }
            >
              {vehicles.map(
                (item) => {
                  const isSelected =
                    selectedVehicle?.id ===
                    item.id;

                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.vehiclePill,
                        isSelected &&
                          styles.vehiclePillSelected,
                      ]}
                      onPress={() =>
                        switchVehicle(
                          item
                        )
                      }
                    >
                      <View
                        style={
                          styles.vehiclePillInfo
                        }
                      >
                        <Text
                          numberOfLines={
                            1
                          }
                          style={[
                            styles.vehiclePillName,
                            isSelected &&
                              styles.vehiclePillNameSelected,
                          ]}
                        >
                          {
                            item.vehicle_name
                          }
                        </Text>

                        <Text
                          style={[
                            styles.vehiclePillRegistration,
                            isSelected &&
                              styles.vehiclePillRegistrationSelected,
                          ]}
                        >
                          {
                            item.registration_number
                          }
                        </Text>
                      </View>

                      {isSelected && (
                        <Text
                          style={
                            styles.vehiclePillCheck
                          }
                        >
                          ✓
                        </Text>
                      )}
                    </Pressable>
                  );
                }
              )}
            </ScrollView>
          </>
        )}

        {/* -------------------------------- */}
        {/* VEHICLE CARD */}
        {/* -------------------------------- */}

        {selectedVehicle ? (
          <Pressable
            style={styles.vehicleCard}
            onPress={() =>
              router.push(
                '/vehicle/details'
              )
            }
          >

            {/* CAR IMAGE */}

            {vehicleImage ? (
              <ImageBackground
                source={{
                  uri: vehicleImage,
                }}
                style={
                  styles.vehicleBackground
                }
                imageStyle={
                  styles.vehicleBackgroundImage
                }
              >
                <View
                  style={
                    styles.vehicleImageOverlay
                  }
                />
              </ImageBackground>
            ) : (
              <View
                style={
                  styles.vehicleFallbackBackground
                }
              />
            )}

            {/* DARK GLOW */}

            <View
              style={styles.vehicleGlow}
            />

            {/* VEHICLE TOP */}

            <View
              style={
                styles.vehicleTop
              }
            >
              <View
                style={
                  styles.vehicleTextArea
                }
              >
                <Text
                  style={
                    styles.vehicleLabel
                  }
                >
                  YOUR VEHICLE
                </Text>

                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={
                    styles.vehicleName
                  }
                >
                  {
                    selectedVehicle.vehicle_name
                  }
                </Text>

                <Text
                  style={
                    styles.registration
                  }
                >
                  {
                    selectedVehicle.registration_number
                  }
                </Text>
              </View>

              <View
                style={
                  styles.arrowCircle
                }
              >
                <Text
                  style={styles.arrow}
                >
                  ›
                </Text>
              </View>
            </View>

            {/* VEHICLE BOTTOM */}

            <View
              style={
                styles.vehicleBottom
              }
            >
              <View>
                <Text
                  style={styles.kmValue}
                >
                  {currentKm
                    ? currentKm.toLocaleString()
                    : '--'}
                </Text>

                <Text
                  style={styles.kmLabel}
                >
                  CURRENT KM
                </Text>
              </View>

              <View
                style={
                  styles.vehicleStatus
                }
              >
                <View
                  style={
                    styles.activeDot
                  }
                />

                <Text
                  style={
                    styles.statusText
                  }
                >
                  Active
                </Text>
              </View>
            </View>
          </Pressable>
        ) : (
          <Pressable
            style={styles.emptyCard}
            onPress={() =>
              router.push(
                '/vehicle/add'
              )
            }
          >
            <Text
              style={
                styles.emptyIcon
              }
            >
              ＋
            </Text>

            <Text
              style={
                styles.emptyTitle
              }
            >
              Add your vehicle
            </Text>

            <Text
              style={styles.emptyText}
            >
              Start managing your vehicle
              with VMA.
            </Text>
          </Pressable>
        )}

        {/* -------------------------------- */}
        {/* VEHICLE OVERVIEW */}
        {/* -------------------------------- */}

        {selectedVehicle && (
          <>
            <View
              style={
                styles.sectionHeader
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Vehicle Overview
              </Text>

              <Text
                style={
                  styles.sectionSmall
                }
              >
                LIVE
              </Text>
            </View>

            <View
              style={styles.grid}
            >

              {/* SERVICE */}

              <Pressable
                style={
                  styles.infoCard
                }
                onPress={() =>
                  router.push(
                    '/vehicle/details'
                  )
                }
              >
                <View
                  style={
                    styles.iconBox
                  }
                >
                  <Text
                    style={styles.icon}
                  >
                    🔧
                  </Text>
                </View>

                <Text
                  style={
                    styles.infoTitle
                  }
                >
                  Service
                </Text>

                <Text
                  style={
                    styles.infoValue
                  }
                >
                  {nextServiceKm >
                  0
                    ? `${remainingServiceKm.toLocaleString()} km`
                    : 'Not set'}
                </Text>

                <Text
                  style={
                    styles.infoSub
                  }
                >
                  {nextServiceKm >
                  0
                    ? 'until next service'
                    : 'Add service record'}
                </Text>
              </Pressable>

              {/* FUEL */}

              <Pressable
                style={
                  styles.infoCard
                }
                onPress={() =>
                  router.push(
                    '/explore'
                  )
                }
              >
                <View
                  style={
                    styles.iconBox
                  }
                >
                  <Text
                    style={styles.icon}
                  >
                    ⛽
                  </Text>
                </View>

                <Text
                  style={
                    styles.infoTitle
                  }
                >
                  Fuel
                </Text>

                <Text
                  style={
                    styles.infoValue
                  }
                >
                  {averageMileage >
                  0
                    ? `${averageMileage.toFixed(2)} km/L`
                    : 'No data'}
                </Text>

                <Text
                  style={
                    styles.infoSub
                  }
                >
                  Average mileage
                </Text>
              </Pressable>

              {/* DOCUMENTS */}

              <Pressable
                style={
                  styles.infoCard
                }
                onPress={() =>
                  router.push(
                    '/vehicle/documents'
                  )
                }
              >
                <View
                  style={
                    styles.iconBox
                  }
                >
                  <Text
                    style={styles.icon}
                  >
                    📄
                  </Text>
                </View>

                <Text
                  style={
                    styles.infoTitle
                  }
                >
                  Documents
                </Text>

                <Text
                  style={
                    styles.infoValue
                  }
                >
                  Manage
                </Text>

                <Text
                  style={
                    styles.infoSub
                  }
                >
                  RC • PUC • Insurance
                </Text>
              </Pressable>

              {/* EXPENSES */}

              <Pressable
                style={
                  styles.infoCard
                }
                onPress={() =>
                  router.push(
                    '/explore'
                  )
                }
              >
                <View
                  style={
                    styles.iconBox
                  }
                >
                  <Text
                    style={styles.icon}
                  >
                    ₹
                  </Text>
                </View>

                <Text
                  style={
                    styles.infoTitle
                  }
                >
                  Expenses
                </Text>

                <Text
                  style={
                    styles.infoValue
                  }
                >
                  {totalExpense >
                  0
                    ? `₹${totalExpense.toLocaleString(
                        'en-IN'
                      )}`
                    : '₹0'}
                </Text>

                <Text
                  style={
                    styles.infoSub
                  }
                >
                  Fuel + Service
                </Text>
              </Pressable>
            </View>

            {/* -------------------------------- */}
            {/* SMART TRACKING */}
            {/* -------------------------------- */}

            <View
              style={
                styles.calculationCard
              }
            >
              <Text
                style={
                  styles.calculationLabel
                }
              >
                VMA SMART TRACKING
              </Text>

              <Text
                style={
                  styles.calculationTitle
                }
              >
                Your vehicle data,
                {'\n'}turned into insights.
              </Text>

              <View
                style={
                  styles.calculationRow
                }
              >
                <View
                  style={
                    styles.statBlock
                  }
                >
                  <Text
                    style={
                      styles.calculationNumber
                    }
                  >
                    {currentKm
                      ? currentKm.toLocaleString()
                      : '--'}
                  </Text>

                  <Text
                    style={
                      styles.calculationUnit
                    }
                  >
                    KM TRACKED
                  </Text>
                </View>

                <View
                  style={
                    styles.calculationDivider
                  }
                />

                <View
                  style={
                    styles.statBlock
                  }
                >
                  <Text
                    style={
                      styles.calculationNumber
                    }
                  >
                    {averageMileage >
                    0
                      ? averageMileage.toFixed(
                          1
                        )
                      : '--'}
                  </Text>

                  <Text
                    style={
                      styles.calculationUnit
                    }
                  >
                    KM/L
                  </Text>
                </View>

                <View
                  style={
                    styles.calculationDivider
                  }
                />

                <View
                  style={
                    styles.statBlock
                  }
                >
                  <Text
                    style={
                      styles.calculationNumber
                    }
                  >
                    {totalExpense >
                    0
                      ? `₹${(
                          totalExpense /
                          1000
                        ).toFixed(1)}K`
                      : '--'}
                  </Text>

                  <Text
                    style={
                      styles.calculationUnit
                    }
                  >
                    EXPENSE
                  </Text>
                </View>
              </View>
            </View>

            {/* -------------------------------- */}
            {/* RECENT ACTIVITY */}
            {/* -------------------------------- */}

            <View
              style={
                styles.recentHeader
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Recent Activity
              </Text>
            </View>

            {lastService ? (
              <View
                style={
                  styles.activityCard
                }
              >
                <View
                  style={
                    styles.activityIcon
                  }
                >
                  <Text
                    style={
                      styles.activityEmoji
                    }
                  >
                    🔧
                  </Text>
                </View>

                <View
                  style={
                    styles.activityInfo
                  }
                >
                  <Text
                    style={
                      styles.activityTitle
                    }
                  >
                    {
                      lastService.service_type
                    }
                  </Text>

                  <Text
                    style={
                      styles.activitySub
                    }
                  >
                    {Number(
                      lastService.service_km ||
                        0
                    ).toLocaleString()}{' '}
                    km
                  </Text>
                </View>

                <Text
                  style={
                    styles.activityCost
                  }
                >
                  ₹
                  {Number(
                    lastService.service_cost ||
                      0
                  ).toLocaleString(
                    'en-IN'
                  )}
                </Text>
              </View>
            ) : (
              <View
                style={
                  styles.noActivity
                }
              >
                <Text
                  style={
                    styles.noActivityText
                  }
                >
                  No service activity yet.
                </Text>
              </View>
            )}

            {/* -------------------------------- */}
            {/* QUICK ACTION */}
            {/* -------------------------------- */}

            <Text
              style={
                styles.sectionTitle
              }
            >
              Quick Actions
            </Text>

            <Pressable
              style={
                styles.addButton
              }
              onPress={() =>
                router.push(
                  '/vehicle/add'
                )
              }
            >
              <View
                style={
                  styles.plusCircle
                }
              >
                <Text
                  style={styles.plus}
                >
                  +
                </Text>
              </View>

              <View
                style={
                  styles.addButtonText
                }
              >
                <Text
                  style={
                    styles.addTitle
                  }
                >
                  Add Vehicle
                </Text>

                <Text
                  style={
                    styles.addSub
                  }
                >
                  Add another vehicle to VMA
                </Text>
              </View>

              <Text
                style={
                  styles.addArrow
                }
              >
                ›
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* -------------------------------- */}
      {/* FLOATING VMA AI BUTTON */}
      {/* -------------------------------- */}

      <Pressable
        style={styles.aiFloatingButton}
        onPress={() => router.push('/ai')}
      >
        <Text
          style={styles.aiFloatingIcon}
        >
          ✦
        </Text>

        <View>
          <Text
            style={styles.aiFloatingTitle}
          >
            VMA AI
          </Text>

          <Text
            style={
              styles.aiFloatingSubtitle
            }
          >
            Ask anything
          </Text>
        </View>
      </Pressable>
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
    paddingBottom: 130,
  },

  // --------------------------------
  // HEADER
  // --------------------------------

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logo: {
    width: 150,
    height: 55,
    marginLeft: -30,
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

  // --------------------------------
  // GREETING
  // --------------------------------

  greeting: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '700',
    marginTop: 35,
  },

  welcomeText: {
    color: '#777777',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 7,
    marginBottom: 25,
  },

  // --------------------------------
  // VEHICLE SWITCHER
  // --------------------------------

  vehicleSwitcherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  vehicleSwitcherTitle: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },

  vehicleSwitcherCount: {
    color: '#555555',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  vehicleSwitcher: {
    paddingBottom: 15,
    gap: 10,
  },

  vehiclePill: {
    minWidth: 170,
    maxWidth: 220,
    minHeight: 58,
    backgroundColor: '#111111',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#292929',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  vehiclePillSelected: {
    backgroundColor: '#1C1C1C',
    borderColor: '#555555',
  },

  vehiclePillInfo: {
    flex: 1,
  },

  vehiclePillName: {
    color: '#AAAAAA',
    fontSize: 13,
    fontWeight: '700',
  },

  vehiclePillNameSelected: {
    color: '#FFFFFF',
  },

  vehiclePillRegistration: {
    color: '#666666',
    fontSize: 10,
    marginTop: 3,
  },

  vehiclePillRegistrationSelected: {
    color: '#888888',
  },

  vehiclePillCheck: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },

  // --------------------------------
  // VEHICLE CARD
  // --------------------------------

  vehicleCard: {
    height: 245,
    borderRadius: 28,
    backgroundColor: '#111111',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#292929',
    padding: 24,
    justifyContent: 'space-between',
    position: 'relative',
  },

  vehicleBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },

  vehicleBackgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  vehicleImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.20)',
  },

  vehicleFallbackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#111111',
    zIndex: 0,
  },

  vehicleGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    right: -80,
    bottom: -100,
    backgroundColor: '#202020',
    opacity: 0.25,
    zIndex: 1,
  },

  vehicleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },

  vehicleTextArea: {
    flex: 1,
    paddingRight: 10,
  },

  vehicleLabel: {
    color: '#E0E0E0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },

  vehicleName: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    marginTop: 7,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 4,
  },

  registration: {
    color: '#D0D0D0',
    fontSize: 15,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 3,
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
    color: '#111111',
    fontSize: 28,
    marginTop: -3,
  },

  vehicleBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 2,
  },

  kmValue: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 4,
  },

  kmLabel: {
    color: '#D0D0D0',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: -2,
  },

  vehicleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,10,0.85)',
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
    color: '#FFFFFF',
    fontSize: 12,
  },

  // --------------------------------
  // EMPTY STATE
  // --------------------------------

  emptyCard: {
    backgroundColor: '#111111',
    borderRadius: 28,
    padding: 30,
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
  },

  emptyIcon: {
    color: '#FFFFFF',
    fontSize: 40,
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    marginTop: 10,
  },

  emptyText: {
    color: '#777777',
    fontSize: 14,
    marginTop: 7,
    textAlign: 'center',
  },

  // --------------------------------
  // SECTIONS
  // --------------------------------

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
    color: '#777777',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },

  // --------------------------------
  // INFORMATION GRID
  // --------------------------------

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
    color: '#777777',
    fontSize: 12,
  },

  infoValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },

  infoSub: {
    color: '#666666',
    fontSize: 11,
    marginTop: 4,
  },

  // --------------------------------
  // SMART TRACKING
  // --------------------------------

  calculationCard: {
    backgroundColor: '#111111',
    borderRadius: 25,
    padding: 22,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#292929',
  },

  calculationLabel: {
    color: '#777777',
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
    color: '#666666',
    fontSize: 8,
    marginTop: 4,
    textAlign: 'center',
  },

  calculationDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#333333',
  },

  // --------------------------------
  // RECENT ACTIVITY
  // --------------------------------

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
    color: '#666666',
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
    color: '#666666',
    fontSize: 13,
  },

  // --------------------------------
  // QUICK ACTION
  // --------------------------------

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
    backgroundColor: '#111111',
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
    color: '#111111',
    fontSize: 16,
    fontWeight: '800',
  },

  addSub: {
    color: '#777777',
    fontSize: 11,
    marginTop: 3,
  },

  addArrow: {
    color: '#111111',
    fontSize: 27,
    marginRight: 5,
  },

  // --------------------------------
  // FLOATING VMA AI
  // --------------------------------

  aiFloatingButton: {
    position: 'absolute',
    right: 18,
    bottom: 85,
    height: 58,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },

  aiFloatingIcon: {
    color: '#000000',
    fontSize: 22,
    fontWeight: '900',
    marginRight: 10,
  },

  aiFloatingTitle: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },

  aiFloatingSubtitle: {
    color: '#777777',
    fontSize: 9,
    marginTop: 2,
  },
});
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

import { supabase } from '@/lib/supabase';

export type Vehicle = {
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

type VehicleContextType = {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  selectedVehicleId: string | null;
  loadingVehicles: boolean;
  switchVehicle: (vehicle: Vehicle) => void;
  refreshVehicles: () => Promise<void>;
};

const VehicleContext =
  createContext<VehicleContextType | undefined>(
    undefined
  );

export function VehicleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [vehicles, setVehicles] = useState<
    Vehicle[]
  >([]);

  const [selectedVehicleId, setSelectedVehicleId] =
    useState<string | null>(null);

  const [loadingVehicles, setLoadingVehicles] =
    useState(true);

  const refreshVehicles = async () => {
    setLoadingVehicles(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setVehicles([]);
        setSelectedVehicleId(null);
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        console.log(
          'Vehicle context error:',
          error.message
        );
        return;
      }

      const loadedVehicles =
        (data || []) as Vehicle[];

      setVehicles(loadedVehicles);

      // Keep current selection if the vehicle
      // still exists.
      if (
        selectedVehicleId &&
        loadedVehicles.some(
          (vehicle) =>
            vehicle.id === selectedVehicleId
        )
      ) {
        return;
      }

      // Otherwise select newest vehicle.
      setSelectedVehicleId(
        loadedVehicles.length > 0
          ? loadedVehicles[0].id
          : null
      );
    } catch (error) {
      console.log(
        'Vehicle context error:',
        error
      );
    } finally {
      setLoadingVehicles(false);
    }
  };

  useEffect(() => {
    refreshVehicles();
  }, []);

  const switchVehicle = (
    vehicle: Vehicle
  ) => {
    setSelectedVehicleId(vehicle.id);
  };

  const selectedVehicle =
    vehicles.find(
      (vehicle) =>
        vehicle.id === selectedVehicleId
    ) || null;

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        selectedVehicle,
        selectedVehicleId,
        loadingVehicles,
        switchVehicle,
        refreshVehicles,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicle() {
  const context =
    useContext(VehicleContext);

  if (!context) {
    throw new Error(
      'useVehicle must be used inside VehicleProvider'
    );
  }

  return context;
}
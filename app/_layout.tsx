import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { VehicleProvider } from '@/context/VehicleContext';
import { registerForPushNotificationsAsync } from '@/lib/notifications';

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <ThemeProvider value={DarkTheme}>
      <VehicleProvider>
        <Stack
          initialRouteName="welcome"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="welcome" />

          <Stack.Screen name="auth/login" />

          <Stack.Screen name="auth/signup" />

          <Stack.Screen name="(tabs)" />

          

          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              title: 'Modal',
            }}
          />
        </Stack>

        <StatusBar style="light" />
      </VehicleProvider>
    </ThemeProvider>
  );
}
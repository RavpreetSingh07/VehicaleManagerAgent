import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
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

        <Stack.Screen name="vehicle" />

        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            title: 'Modal',
          }}
        />
      </Stack>

      <StatusBar style="light" />
    </ThemeProvider>
  );
}
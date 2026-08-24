import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:
          Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      {/* HOME */}

      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="house.fill"
              color={color}
            />
          ),
        }}
      />

      {/* FUEL */}

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Fuel',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="drop.fill"
              color={color}
            />
          ),
        }}
      />

      {/* YOU */}

      <Tabs.Screen
        name="you"
        options={{
          title: 'You',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="person.fill"
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
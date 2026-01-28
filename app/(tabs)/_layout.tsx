import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: React.ComponentProps<typeof MaterialIcons>['name'];

          if (route.name === 'index') {
            iconName = 'home';
          } else if (route.name === 'my-sessions') {
            iconName = 'calendar-today';
          } else if (route.name === 'workouts') {
            iconName = 'list';
          } else if (route.name === 'profile') {
            iconName = 'person';
          } else {
            iconName = 'help-outline';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0B0B0B',
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: 70,
        },
        tabBarActiveTintColor: '#2081FF',
        tabBarInactiveTintColor: '#808080',
        tabBarLabelStyle: { fontSize: 11 },
        tabBarButton: HapticTab,
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="my-sessions" options={{ title: 'Mes séances' }} />
      <Tabs.Screen name="workouts" options={{ title: 'Workouts' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { useBaby } from '../context/BabyContext';

import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import FeedingScreen from '../screens/FeedingScreen';
import GrowthScreen from '../screens/GrowthScreen';
import VaccinationScreen from '../screens/VaccinationScreen';
import DoctorAccessScreen from '../screens/DoctorAccessScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabIcon = ({ emoji, label, focused }) => (
  <View style={tabStyles.iconWrap}>
    <Text style={[tabStyles.emoji, focused && tabStyles.emojiActive]}>{emoji}</Text>
    <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
  </View>
);

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: Colors.border },
        headerTitleStyle: { fontWeight: '700', color: Colors.textPrimary, fontSize: 17 },
        tabBarStyle: { backgroundColor: Colors.tabBar, borderTopColor: Colors.border, height: 70, paddingBottom: 10 },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Baby Growth', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="Feeding"
        component={FeedingScreen}
        options={{ title: 'Feeding Log', tabBarIcon: ({ focused }) => <TabIcon emoji="🍼" label="Feeding" focused={focused} /> }}
      />
      <Tab.Screen
        name="Growth"
        component={GrowthScreen}
        options={{ title: 'Growth', tabBarIcon: ({ focused }) => <TabIcon emoji="📈" label="Growth" focused={focused} /> }}
      />
      <Tab.Screen
        name="Vaccination"
        component={VaccinationScreen}
        options={{ title: 'Vaccines', tabBarIcon: ({ focused }) => <TabIcon emoji="💉" label="Vaccines" focused={focused} /> }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: 'Reports', tabBarIcon: ({ focused }) => <TabIcon emoji="📄" label="Reports" focused={focused} /> }}
      />
      <Tab.Screen
        name="DoctorAccess"
        component={DoctorAccessScreen}
        options={{ title: 'Doctor Access', tabBarIcon: ({ focused }) => <TabIcon emoji="👨‍⚕️" label="Doctor" focused={focused} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings', tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" label="Settings" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { baby, loading } = useBaby();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <Text style={{ fontSize: 48 }}>👶</Text>
        <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!baby ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: 'center', paddingTop: 4 },
  emoji: { fontSize: 22, opacity: 0.5 },
  emojiActive: { opacity: 1 },
  label: { fontSize: 10, color: Colors.tabBarInactive, marginTop: 2 },
  labelActive: { color: Colors.tabBarActive, fontWeight: '600' },
});

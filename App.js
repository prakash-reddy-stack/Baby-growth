import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { BabyProvider } from './src/context/BabyContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <BabyProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </BabyProvider>
  );
}

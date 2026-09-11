import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import SetupScreen from '@/screens/SetupScreen';
import PrepareScreen from '@/screens/PrepareScreen';
import WorkScreen from '@/screens/WorkScreen';
import RestScreen from '@/screens/RestScreen';
import ExercisesScreen from '@/screens/ExercisesScreen';
import { useWorkoutCues } from '@/audio/useWorkoutCues';

export type RootStackParamList = {
  Setup: undefined;
  Exercises: undefined;
  Prepare: undefined;
  Work: undefined;
  Rest: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // Mounted exactly once, for the app's whole lifetime — see the doc
  // comment on useWorkoutCues for why this can't live in RuntimeScreen.
  useWorkoutCues();

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Setup"
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          <Stack.Screen name="Setup" component={SetupScreen} />
          <Stack.Screen name="Exercises" component={ExercisesScreen} />
          <Stack.Screen name="Prepare" component={PrepareScreen} />
          <Stack.Screen name="Work" component={WorkScreen} />
          <Stack.Screen name="Rest" component={RestScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

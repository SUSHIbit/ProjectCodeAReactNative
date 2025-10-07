import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  AuthScreen,
  HomeScreen,
  QuizScreen,
  ResultScreen,
  AttemptsHistoryScreen,
} from '../screens';
import { useAuthStore } from '../stores/authStore';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { View, StyleSheet } from 'react-native';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Quiz: { pdfId: string };
  Result: { attemptId: string };
  AttemptsHistory: { pdfId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, loading, checkSession } = useAuthStore();

  useEffect(() => {
    // Check for existing session on app launch
    checkSession();
  }, [checkSession]);

  // Show loading spinner while checking session
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  const isAuthenticated = !!user;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'MCQ Generator' }}
            />
            <Stack.Screen
              name="Quiz"
              component={QuizScreen}
              options={{
                title: 'Quiz',
                headerLeft: () => null, // Disable back button
                gestureEnabled: false, // Disable swipe back gesture
              }}
            />
            <Stack.Screen
              name="Result"
              component={ResultScreen}
              options={{
                title: 'Quiz Results',
                headerLeft: () => null, // Disable back button
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="AttemptsHistory"
              component={AttemptsHistoryScreen}
              options={{ title: 'Quiz History' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
});

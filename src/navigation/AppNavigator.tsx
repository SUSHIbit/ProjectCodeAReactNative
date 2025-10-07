import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  AuthScreen,
  HomeScreen,
  QuizScreen,
  ResultScreen,
  AttemptsHistoryScreen,
} from '../screens';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Quiz: { pdfId: string };
  Result: { attemptId: string };
  AttemptsHistory: { pdfId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  // TODO: In Phase 2, check authentication state and conditionally render Auth/Main screens
  const isAuthenticated = false; // This will be replaced with actual auth state

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

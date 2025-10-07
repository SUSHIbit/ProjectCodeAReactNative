import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/Button';

export const HomeScreen: React.FC = () => {
  const { user, signOut, loading } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>PDF upload will be implemented in Phase 4</Text>
        {user && (
          <Text style={styles.email}>Logged in as: {user.email}</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          loading={loading}
          disabled={loading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 10,
  },
  email: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 8,
  },
  footer: {
    paddingBottom: 20,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const AuthScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth Screen</Text>
      <Text style={styles.subtitle}>Authentication will be implemented in Phase 2</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 20,
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
  },
});

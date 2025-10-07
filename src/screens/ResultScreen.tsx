import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ResultScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Result Screen</Text>
      <Text style={styles.subtitle}>Results will be implemented in Phase 8</Text>
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

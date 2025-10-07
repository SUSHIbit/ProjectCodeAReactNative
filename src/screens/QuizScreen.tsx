import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const QuizScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quiz Screen</Text>
      <Text style={styles.subtitle}>Quiz mode will be implemented in Phase 7</Text>
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

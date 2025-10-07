import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  children: React.ReactNode;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  questionNumber,
  totalQuestions,
  question,
  children,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.questionCounter}>
          Question {questionNumber}/{totalQuestions}
        </Text>
      </View>
      <Text style={styles.questionText}>{question}</Text>
      <View style={styles.optionsContainer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 16,
  },
  questionCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 26,
    marginBottom: 20,
  },
  optionsContainer: {
    marginTop: 10,
  },
});

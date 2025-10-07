import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useQuizStore } from '../stores/quizStore';
import { usePdfStore } from '../stores/pdfStore';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';

type ResultScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Result'>;

export const ResultScreen: React.FC = () => {
  const navigation = useNavigation<ResultScreenNavigationProp>();
  const { quizResult, loading } = useQuizStore();
  const { currentPdf } = usePdfStore();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  if (!quizResult) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No results available</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.navigate('Home')}
          style={styles.errorButton}
        />
      </View>
    );
  }

  const { score, total_questions, percentage, answers } = quizResult;

  const getScoreColor = (percent: number): string => {
    if (percent >= 80) return '#34C759';
    if (percent >= 60) return '#FF9500';
    return '#FF3B30';
  };

  const handleViewHistory = () => {
    if (!currentPdf) {
      return;
    }
    navigation.navigate('AttemptsHistory', { pdfId: currentPdf.id });
  };

  const handleBackToHome = () => {
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Your Score</Text>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scorePercentage, { color: getScoreColor(percentage) }]}>
              {percentage}%
            </Text>
            <Text style={styles.scoreText}>
              {score}/{total_questions}
            </Text>
          </View>
          <Text style={styles.scoreMessage}>
            {percentage >= 80 ? 'Excellent Work!' : percentage >= 60 ? 'Good Job!' : 'Keep Practicing!'}
          </Text>
        </View>

        {/* Answers Section */}
        <View style={styles.answersSection}>
          <Text style={styles.answersTitle}>Detailed Answers</Text>

          {answers.map((answer, index) => {
            const isCorrect = answer.is_correct;
            return (
              <View key={answer.question_id} style={styles.answerCard}>
                {/* Question Number and Status */}
                <View style={styles.answerHeader}>
                  <Text style={styles.questionNumber}>Question {index + 1}</Text>
                  <View style={[styles.statusBadge, isCorrect ? styles.correctBadge : styles.incorrectBadge]}>
                    <Text style={styles.statusText}>{isCorrect ? '✓ Correct' : '✗ Incorrect'}</Text>
                  </View>
                </View>

                {/* Question Text */}
                <Text style={styles.questionText}>{answer.question}</Text>

                {/* Your Answer */}
                <View style={styles.answerRow}>
                  <Text style={styles.answerLabel}>Your Answer:</Text>
                  <View style={[styles.answerBadge, isCorrect ? styles.correctAnswerBadge : styles.wrongAnswerBadge]}>
                    <Text style={[styles.answerBadgeText, isCorrect ? styles.correctAnswerText : styles.wrongAnswerText]}>
                      {answer.selected_answer}
                    </Text>
                  </View>
                </View>

                {/* Correct Answer (always shown) */}
                {!isCorrect && (
                  <View style={styles.answerRow}>
                    <Text style={styles.answerLabel}>Correct Answer:</Text>
                    <View style={styles.correctAnswerBadge}>
                      <Text style={styles.correctAnswerText}>{answer.correct_answer}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="View All Attempts"
          onPress={handleViewHistory}
          variant="secondary"
          style={styles.button}
        />
        <Button
          title="Back to Home"
          onPress={handleBackToHome}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  scoreTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scorePercentage: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '500',
  },
  scoreMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  answersSection: {
    marginBottom: 20,
  },
  answersTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  answerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  correctBadge: {
    backgroundColor: '#E8F5E9',
  },
  incorrectBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
    marginBottom: 12,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  answerLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
    fontWeight: '500',
  },
  answerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  correctAnswerBadge: {
    backgroundColor: '#E8F5E9',
  },
  wrongAnswerBadge: {
    backgroundColor: '#FFEBEE',
  },
  answerBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  correctAnswerText: {
    color: '#2E7D32',
  },
  wrongAnswerText: {
    color: '#C62828',
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  button: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    marginTop: 12,
  },
});

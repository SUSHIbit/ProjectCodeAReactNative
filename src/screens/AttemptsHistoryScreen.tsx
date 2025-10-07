import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useQuizStore } from '../stores/quizStore';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { formatDate } from '../utils/formatters';
import type { QuizAttempt } from '../types';

type AttemptsHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AttemptsHistory'>;
type AttemptsHistoryScreenRouteProp = RouteProp<RootStackParamList, 'AttemptsHistory'>;

export const AttemptsHistoryScreen: React.FC = () => {
  const navigation = useNavigation<AttemptsHistoryScreenNavigationProp>();
  const route = useRoute<AttemptsHistoryScreenRouteProp>();
  const { pdfId } = route.params;

  const { attempts, loading, error, fetchAttempts } = useQuizStore();
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    fetchAttempts(pdfId);
  }, [pdfId, fetchAttempts]);

  const handleViewAttempt = (attempt: QuizAttempt) => {
    setSelectedAttempt(attempt);
  };

  const handleBackToList = () => {
    setSelectedAttempt(null);
  };

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 80) return '#34C759';
    if (percentage >= 60) return '#FF9500';
    return '#FF3B30';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>Loading quiz history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message={error} />
        <Button
          title="Try Again"
          onPress={() => fetchAttempts(pdfId)}
          style={styles.errorButton}
        />
      </View>
    );
  }

  // Show detailed view of selected attempt
  if (selectedAttempt) {
    const percentage = Math.round((selectedAttempt.score / selectedAttempt.total_questions) * 100);

    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Score Card */}
          <View style={styles.scoreCard}>
            <Text style={styles.attemptDate}>{formatDate(selectedAttempt.completed_at)}</Text>
            <View style={styles.scoreCircle}>
              <Text style={[styles.scorePercentage, { color: getScoreColor(percentage) }]}>
                {percentage}%
              </Text>
              <Text style={styles.scoreText}>
                {selectedAttempt.score}/{selectedAttempt.total_questions}
              </Text>
            </View>
          </View>

          {/* Detailed Answers */}
          <View style={styles.answersSection}>
            <Text style={styles.answersTitle}>Detailed Answers</Text>

            {selectedAttempt.answers.map((answer, index) => {
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

                  {/* Correct Answer (shown if incorrect) */}
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

        {/* Back Button */}
        <View style={styles.buttonContainer}>
          <Button title="Back to History" onPress={handleBackToList} />
        </View>
      </View>
    );
  }

  // Show list of attempts
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {attempts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No quiz attempts yet</Text>
            <Text style={styles.emptySubtext}>Complete a quiz to see your history here</Text>
          </View>
        ) : (
          <>
            <Text style={styles.headerText}>
              Total Attempts: {attempts.length}
            </Text>

            {attempts.map((attempt) => {
              const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
              const scoreColor = getScoreColor(percentage);

              return (
                <TouchableOpacity
                  key={attempt.id}
                  style={styles.attemptCard}
                  onPress={() => handleViewAttempt(attempt)}
                  activeOpacity={0.7}
                >
                  <View style={styles.attemptCardHeader}>
                    <View>
                      <Text style={styles.attemptCardDate}>{formatDate(attempt.completed_at)}</Text>
                      <Text style={styles.attemptCardScore}>
                        Score: {attempt.score}/{attempt.total_questions}
                      </Text>
                    </View>
                    <View style={[styles.percentageCircle, { borderColor: scoreColor }]}>
                      <Text style={[styles.percentageText, { color: scoreColor }]}>
                        {percentage}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${percentage}%`, backgroundColor: scoreColor },
                      ]}
                    />
                  </View>

                  <Text style={styles.viewDetailsText}>Tap to view details →</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          title="Back to Home"
          onPress={() => navigation.navigate('Home')}
          variant="secondary"
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
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  attemptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  attemptCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attemptCardDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  attemptCardScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  percentageCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    fontWeight: '500',
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
  attemptDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
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
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  errorButton: {
    marginTop: 20,
  },
});

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useQuizStore } from '../stores/quizStore';
import { validateQuizAnswers } from '../utils/validation';
import { MCQOption } from '../components/MCQOption';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

type QuizScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Quiz'>;
type QuizScreenRouteProp = RouteProp<RootStackParamList, 'Quiz'>;

export const QuizScreen: React.FC = () => {
  const navigation = useNavigation<QuizScreenNavigationProp>();
  const route = useRoute<QuizScreenRouteProp>();
  const { pdfId } = route.params;

  const {
    mcqs,
    currentQuestionIndex,
    userAnswers,
    loading,
    error,
    fetchMcqs,
    selectAnswer,
    nextQuestion,
    submitQuiz,
    resetQuiz,
  } = useQuizStore();

  useEffect(() => {
    // Fetch MCQs when component mounts
    fetchMcqs(pdfId);

    // Show confirmation dialog when user tries to go back
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (e.data.action.type === 'GO_BACK') {
        // Prevent default behavior
        e.preventDefault();

        // Show confirmation dialog
        Alert.alert(
          'Exit Quiz?',
          'Are you sure you want to exit? Your progress will be lost.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => {} },
            {
              text: 'Exit',
              style: 'destructive',
              onPress: () => {
                resetQuiz();
                navigation.dispatch(e.data.action);
              },
            },
          ]
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [pdfId, fetchMcqs, navigation, resetQuiz]);

  const currentQuestion = mcqs[currentQuestionIndex];
  const currentAnswer = currentQuestion ? userAnswers[currentQuestion.id] : undefined;
  const isLastQuestion = currentQuestionIndex === mcqs.length - 1;
  const hasAnswered = currentAnswer !== undefined;

  const handleSelectAnswer = (answer: string) => {
    if (currentQuestion) {
      selectAnswer(currentQuestion.id, answer);
    }
  };

  const handleNext = () => {
    if (!hasAnswered) {
      Alert.alert('Please select an answer', 'You must select an answer before continuing.');
      return;
    }

    if (isLastQuestion) {
      // Show confirmation before submitting
      Alert.alert(
        'Submit Quiz?',
        'Are you sure you want to submit your answers?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            style: 'default',
            onPress: handleSubmit,
          },
        ]
      );
    } else {
      nextQuestion();
    }
  };

  const handleSubmit = async () => {
    // Validate all questions are answered
    const validation = validateQuizAnswers(userAnswers, mcqs.length);
    if (!validation.valid) {
      Alert.alert('Incomplete Quiz', validation.message || 'Please answer all questions before submitting.');
      return;
    }

    await submitQuiz(pdfId);
    // Navigate to result screen after successful submission
    if (!error) {
      navigation.replace('Result', { attemptId: 'latest' });
    }
  };

  if (loading && mcqs.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message={error} />
        <Button
          title="Go Back"
          onPress={() => {
            resetQuiz();
            navigation.goBack();
          }}
          style={styles.errorButton}
        />
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No questions available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Question Counter */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            Question {currentQuestionIndex + 1}/{mcqs.length}
          </Text>
        </View>

        {/* Question Text */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionNumber}>Q{currentQuestionIndex + 1}</Text>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <MCQOption
            option="A"
            text={currentQuestion.option_a}
            selected={currentAnswer === 'A'}
            onSelect={() => handleSelectAnswer('A')}
          />
          <MCQOption
            option="B"
            text={currentQuestion.option_b}
            selected={currentAnswer === 'B'}
            onSelect={() => handleSelectAnswer('B')}
          />
          <MCQOption
            option="C"
            text={currentQuestion.option_c}
            selected={currentAnswer === 'C'}
            onSelect={() => handleSelectAnswer('C')}
          />
          <MCQOption
            option="D"
            text={currentQuestion.option_d}
            selected={currentAnswer === 'D'}
            onSelect={() => handleSelectAnswer('D')}
          />
        </View>
      </ScrollView>

      {/* Next/Finish Button */}
      <View style={styles.buttonContainer}>
        <Button
          title={isLastQuestion ? 'Finish Quiz' : 'Next'}
          onPress={handleNext}
          disabled={!hasAnswered || loading}
          loading={loading && isLastQuestion}
          variant={isLastQuestion ? 'success' : 'primary'}
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
  counterContainer: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  questionContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 26,
  },
  optionsContainer: {
    marginBottom: 20,
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
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 20,
  },
});

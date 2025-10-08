import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { getUserFriendlyError } from '../utils/errorHandler';
import type { MCQ, QuizResult, QuizAttempt, QuizAnswer } from '../types';

interface QuizStore {
  mcqs: MCQ[];
  currentQuestionIndex: number;
  userAnswers: Record<string, string>;
  quizResult: QuizResult | null;
  attempts: QuizAttempt[];
  loading: boolean;
  error: string | null;
  fetchMcqs: (pdfId: string) => Promise<void>;
  selectAnswer: (questionId: string, answer: string) => void;
  nextQuestion: () => void;
  submitQuiz: (pdfId: string) => Promise<void>;
  fetchAttempts: (pdfId: string) => Promise<void>;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  mcqs: [],
  currentQuestionIndex: 0,
  userAnswers: {},
  quizResult: null,
  attempts: [],
  loading: false,
  error: null,

  fetchMcqs: async (pdfId: string) => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase
        .from('mcqs')
        .select('*')
        .eq('pdf_id', pdfId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error('Failed to load questions. Please try again.');
      }

      if (!data || data.length === 0) {
        throw new Error('No questions found. Please generate MCQs first.');
      }

      set({
        mcqs: data,
        loading: false,
        currentQuestionIndex: 0,
        userAnswers: {},
        quizResult: null,
      });
    } catch (error: any) {
      set({
        error: getUserFriendlyError(error, 'loading questions'),
        loading: false,
      });
    }
  },

  selectAnswer: (questionId: string, answer: string) => {
    const { userAnswers } = get();
    set({
      userAnswers: {
        ...userAnswers,
        [questionId]: answer,
      },
    });
  },

  nextQuestion: () => {
    const { currentQuestionIndex, mcqs } = get();
    if (currentQuestionIndex < mcqs.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  submitQuiz: async (pdfId: string) => {
    try {
      // Prevent double submission
      const { loading } = get();
      if (loading) {
        console.log('Quiz submission already in progress');
        return;
      }

      set({ loading: true, error: null });

      const { mcqs, userAnswers } = get();

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be logged in to submit quiz.');
      }

      // Calculate score and prepare answers
      const answers: QuizAnswer[] = mcqs.map((mcq) => {
        const selectedAnswer = userAnswers[mcq.id] as 'A' | 'B' | 'C' | 'D';
        const isCorrect = selectedAnswer === mcq.correct_answer;

        return {
          question_id: mcq.id,
          question: mcq.question,
          selected_answer: selectedAnswer,
          correct_answer: mcq.correct_answer,
          is_correct: isCorrect,
        };
      });

      const score = answers.filter((a) => a.is_correct).length;
      const totalQuestions = mcqs.length;
      const percentage = Math.round((score / totalQuestions) * 100);

      // Save quiz attempt to database
      const { error: insertError } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          pdf_id: pdfId,
          score,
          total_questions: totalQuestions,
          answers,
        });

      if (insertError) {
        throw new Error('Failed to save quiz results. Please try again.');
      }

      // Set quiz result
      const result: QuizResult = {
        score,
        total_questions: totalQuestions,
        percentage,
        answers,
      };

      set({
        quizResult: result,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: getUserFriendlyError(error, 'submitting quiz'),
        loading: false,
      });
    }
  },

  fetchAttempts: async (pdfId: string) => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('pdf_id', pdfId)
        .order('completed_at', { ascending: false });

      if (error) {
        throw new Error('Failed to load quiz history. Please try again.');
      }

      set({
        attempts: data || [],
        loading: false,
      });
    } catch (error: any) {
      set({
        error: getUserFriendlyError(error, 'loading quiz history'),
        loading: false,
      });
    }
  },

  resetQuiz: () => set({
    mcqs: [],
    currentQuestionIndex: 0,
    userAnswers: {},
    quizResult: null,
    attempts: [],
    loading: false,
    error: null,
  }),
}));

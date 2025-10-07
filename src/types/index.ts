// User & Auth Types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

// PDF Types
export interface PDF {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
  processed: boolean;
}

// MCQ Types
export interface MCQ {
  id: string;
  pdf_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  created_at: string;
}

// Quiz Types
export interface QuizAnswer {
  question_id: string;
  question: string;
  selected_answer: 'A' | 'B' | 'C' | 'D';
  correct_answer: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
}

export interface QuizResult {
  score: number;
  total_questions: number;
  percentage: number;
  answers: QuizAnswer[];
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  pdf_id: string;
  score: number;
  total_questions: number;
  answers: QuizAnswer[];
  completed_at: string;
}

// Document Picker Types
export interface DocumentPickerAsset {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export interface DocumentPickerResult {
  type: 'success' | 'cancel';
  assets?: DocumentPickerAsset[];
}

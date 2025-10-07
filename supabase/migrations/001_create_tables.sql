-- Phase 3: Database Setup
-- Create tables for PDFs, MCQs, and Quiz Attempts

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: pdfs
-- Stores information about uploaded PDF files
CREATE TABLE pdfs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

-- Table: mcqs
-- Stores generated multiple choice questions from PDFs
CREATE TABLE mcqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pdf_id UUID REFERENCES pdfs(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: quiz_attempts
-- Stores user quiz attempts and their results
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pdf_id UUID REFERENCES pdfs(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  answers JSONB NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_pdfs_user_id ON pdfs(user_id);
CREATE INDEX idx_pdfs_processed ON pdfs(processed);
CREATE INDEX idx_mcqs_pdf_id ON mcqs(pdf_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_pdf_id ON quiz_attempts(pdf_id);
CREATE INDEX idx_quiz_attempts_completed_at ON quiz_attempts(completed_at DESC);

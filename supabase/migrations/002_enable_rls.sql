-- Phase 3: Database Setup
-- Enable Row Level Security (RLS) on all tables

-- Enable RLS on pdfs table
ALTER TABLE pdfs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on mcqs table
ALTER TABLE mcqs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on quiz_attempts table
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pdfs table
-- Users can only read their own PDFs
CREATE POLICY "Users can view their own PDFs"
  ON pdfs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own PDFs
CREATE POLICY "Users can upload their own PDFs"
  ON pdfs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own PDFs
CREATE POLICY "Users can update their own PDFs"
  ON pdfs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own PDFs
CREATE POLICY "Users can delete their own PDFs"
  ON pdfs
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for mcqs table
-- Users can only read MCQs from their own PDFs
CREATE POLICY "Users can view MCQs from their own PDFs"
  ON mcqs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pdfs
      WHERE pdfs.id = mcqs.pdf_id
      AND pdfs.user_id = auth.uid()
    )
  );

-- Only service role can insert MCQs (via Edge Function)
-- But we also allow users to insert for testing purposes
CREATE POLICY "Users can insert MCQs for their own PDFs"
  ON mcqs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pdfs
      WHERE pdfs.id = mcqs.pdf_id
      AND pdfs.user_id = auth.uid()
    )
  );

-- Users can delete MCQs from their own PDFs
CREATE POLICY "Users can delete MCQs from their own PDFs"
  ON mcqs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pdfs
      WHERE pdfs.id = mcqs.pdf_id
      AND pdfs.user_id = auth.uid()
    )
  );

-- RLS Policies for quiz_attempts table
-- Users can only read their own quiz attempts
CREATE POLICY "Users can view their own quiz attempts"
  ON quiz_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own quiz attempts
CREATE POLICY "Users can insert their own quiz attempts"
  ON quiz_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own quiz attempts
CREATE POLICY "Users can delete their own quiz attempts"
  ON quiz_attempts
  FOR DELETE
  USING (auth.uid() = user_id);

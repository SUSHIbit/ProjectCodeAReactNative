-- Phase 3: Database Setup
-- Helper queries for testing database permissions

-- Test query 1: Insert a test PDF record
-- Run this after authentication to test INSERT policy
-- Example:
-- INSERT INTO pdfs (user_id, file_name, file_path, file_size)
-- VALUES (auth.uid(), 'test.pdf', 'user_id/test.pdf', 1024);

-- Test query 2: Select your PDFs
-- Should return only PDFs belonging to authenticated user
-- SELECT * FROM pdfs WHERE user_id = auth.uid();

-- Test query 3: Insert test MCQs
-- Example:
-- INSERT INTO mcqs (pdf_id, question, option_a, option_b, option_c, option_d, correct_answer)
-- VALUES (
--   'your-pdf-id',
--   'What is 2+2?',
--   '3',
--   '4',
--   '5',
--   '6',
--   'B'
-- );

-- Test query 4: Select MCQs for your PDFs
-- Should return only MCQs from PDFs you own
-- SELECT m.* FROM mcqs m
-- JOIN pdfs p ON m.pdf_id = p.id
-- WHERE p.user_id = auth.uid();

-- Test query 5: Insert a quiz attempt
-- Example:
-- INSERT INTO quiz_attempts (user_id, pdf_id, score, total_questions, answers)
-- VALUES (
--   auth.uid(),
--   'your-pdf-id',
--   8,
--   10,
--   '[{"question_id":"q1","selected_answer":"A","correct_answer":"A","is_correct":true}]'::jsonb
-- );

-- Test query 6: Select your quiz attempts
-- Should return only your attempts
-- SELECT * FROM quiz_attempts WHERE user_id = auth.uid();

-- Clean up test data (optional)
-- DELETE FROM quiz_attempts WHERE user_id = auth.uid();
-- DELETE FROM mcqs WHERE pdf_id IN (SELECT id FROM pdfs WHERE user_id = auth.uid());
-- DELETE FROM pdfs WHERE user_id = auth.uid();

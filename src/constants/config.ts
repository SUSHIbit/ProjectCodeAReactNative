// App Configuration Constants

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const ALLOWED_FILE_TYPES = ['application/pdf'];

// Quiz
export const QUESTIONS_PER_QUIZ = 10;

// Supabase
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Storage
export const STORAGE_BUCKET_NAME = 'pdfs';

// Edge Functions
export const EDGE_FUNCTION_URL = {
  GENERATE_MCQS: 'generate-mcqs',
};

// Error Messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds 10MB limit. Please choose a smaller PDF.',
  PDF_PARSE_ERROR: 'Unable to read PDF file. Please ensure it\'s a valid, readable PDF document.',
  OPENAI_ERROR: 'Failed to generate questions. Please try again later.',
  NETWORK_ERROR: 'Connection failed. Please check your internet connection.',
  EMPTY_PDF: 'No text found in PDF. Please upload a PDF with readable text content.',
  AUTH_ERROR: 'Authentication failed. Please check your credentials.',
  UPLOAD_ERROR: 'Failed to upload file. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
};

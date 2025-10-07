import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../constants/config';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  return { valid: true };
};

export const validateFileSize = (size: number | undefined): { valid: boolean; message?: string } => {
  if (!size) {
    return { valid: false, message: 'Unable to determine file size' };
  }

  if (size > MAX_FILE_SIZE) {
    return { valid: false, message: 'File size exceeds 10MB limit. Please choose a smaller PDF.' };
  }

  return { valid: true };
};

export const validateFileType = (mimeType: string | undefined): { valid: boolean; message?: string } => {
  if (!mimeType) {
    return { valid: false, message: 'Unable to determine file type' };
  }

  if (!ALLOWED_FILE_TYPES.includes(mimeType)) {
    return { valid: false, message: 'Only PDF files are allowed' };
  }

  return { valid: true };
};

export const validateFileName = (fileName: string | undefined): { valid: boolean; message?: string } => {
  if (!fileName) {
    return { valid: false, message: 'Invalid file name' };
  }

  // Check for empty or whitespace-only names
  if (fileName.trim().length === 0) {
    return { valid: false, message: 'File name cannot be empty' };
  }

  // Check for very long file names (max 255 characters)
  if (fileName.length > 255) {
    return { valid: false, message: 'File name is too long' };
  }

  // Check for invalid characters in file name
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  if (invalidChars.test(fileName)) {
    return { valid: false, message: 'File name contains invalid characters' };
  }

  return { valid: true };
};

export const validateQuizAnswers = (
  answers: Record<string, string>,
  totalQuestions: number
): { valid: boolean; message?: string } => {
  const answeredCount = Object.keys(answers).length;

  if (answeredCount === 0) {
    return { valid: false, message: 'No answers provided. Please answer at least one question.' };
  }

  if (answeredCount < totalQuestions) {
    return {
      valid: false,
      message: `Please answer all questions. ${answeredCount}/${totalQuestions} answered.`,
    };
  }

  // Validate answer values are valid options
  for (const answer of Object.values(answers)) {
    if (!['A', 'B', 'C', 'D'].includes(answer)) {
      return { valid: false, message: 'Invalid answer detected. Please select a valid option.' };
    }
  }

  return { valid: true };
};

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

/**
 * Enhanced error handling utilities
 */

export const isNetworkError = (error: any): boolean => {
  const errorString = error?.message?.toLowerCase() || '';
  const errorName = error?.name?.toLowerCase() || '';

  return (
    errorString.includes('network') ||
    errorString.includes('connection') ||
    errorString.includes('timeout') ||
    errorString.includes('offline') ||
    errorString.includes('failed to fetch') ||
    errorName === 'networkerror' ||
    errorName === 'timeouterror'
  );
};

export const isAuthError = (error: any): boolean => {
  const errorString = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toLowerCase() || '';

  return (
    errorString.includes('unauthorized') ||
    errorString.includes('authentication') ||
    errorString.includes('invalid credentials') ||
    errorString.includes('invalid login') ||
    errorCode === 'auth/invalid-credential' ||
    errorCode === 'auth/user-not-found'
  );
};

export const isServerError = (error: any): boolean => {
  const errorString = error?.message?.toLowerCase() || '';
  const statusCode = error?.status || error?.statusCode;

  return (
    statusCode >= 500 ||
    errorString.includes('server error') ||
    errorString.includes('internal server') ||
    errorString.includes('service unavailable')
  );
};

export const getUserFriendlyError = (error: any, context?: string): string => {
  // Network errors
  if (isNetworkError(error)) {
    return 'Connection failed. Please check your internet connection and try again.';
  }

  // Authentication errors
  if (isAuthError(error)) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }

  // Server errors
  if (isServerError(error)) {
    return 'Server is temporarily unavailable. Please try again later.';
  }

  // Supabase-specific errors
  if (error?.code === 'PGRST116') {
    return 'No data found. Please try again.';
  }

  // Context-specific errors
  if (context === 'pdf_upload') {
    if (error?.message?.includes('size')) {
      return 'File size exceeds 10MB limit. Please choose a smaller PDF.';
    }
    if (error?.message?.includes('type')) {
      return 'Please select a valid PDF file.';
    }
  }

  if (context === 'pdf_generation') {
    if (error?.message?.includes('No text found')) {
      return 'No text found in PDF. Please upload a PDF with readable text content.';
    }
    if (error?.message?.includes('Unable to read')) {
      return 'Unable to read PDF file. Please ensure it\'s a valid, readable PDF document.';
    }
  }

  // Default to the error message if it exists and is user-friendly
  if (error?.message && error.message.length < 200) {
    return error.message;
  }

  // Generic fallback
  return context
    ? `An error occurred during ${context}. Please try again.`
    : 'An unexpected error occurred. Please try again.';
};

export const shouldRetry = (error: any, attemptCount: number = 0): boolean => {
  const maxRetries = 3;

  if (attemptCount >= maxRetries) {
    return false;
  }

  // Retry on network errors
  if (isNetworkError(error)) {
    return true;
  }

  // Retry on server errors
  if (isServerError(error)) {
    return true;
  }

  // Don't retry on client errors (4xx)
  const statusCode = error?.status || error?.statusCode;
  if (statusCode >= 400 && statusCode < 500) {
    return false;
  }

  return false;
};

export const getRetryDelay = (attemptCount: number): number => {
  // Exponential backoff: 1s, 2s, 4s
  return Math.min(1000 * Math.pow(2, attemptCount), 4000);
};

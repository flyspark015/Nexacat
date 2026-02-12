/**
 * Error handling utilities for FlySpark
 * Centralized error handling and user-friendly error messages
 */

import { FirebaseError } from 'firebase/app';
import { toast } from 'sonner';

export interface AppError {
  code: string;
  message: string;
  originalError?: Error;
}

/**
 * Firebase Auth Error Messages
 */
const authErrorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'This email is already registered. Please login instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
  'auth/weak-password': 'Password is too weak. Please use a stronger password.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'No account found with this email. Please register first.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid email or password. Please try again.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
  'auth/unauthorized-domain': 'This domain is not authorized. Please contact support.',
  'auth/invalid-api-key': 'Invalid API configuration. Please contact support.',
  'auth/app-deleted': 'Application error. Please contact support.',
  'auth/expired-action-code': 'This link has expired. Please request a new one.',
  'auth/invalid-action-code': 'Invalid or expired link. Please request a new one.',
};

/**
 * Firestore Error Messages
 */
const firestoreErrorMessages: Record<string, string> = {
  'permission-denied': 'You do not have permission to perform this action.',
  'not-found': 'The requested data was not found.',
  'already-exists': 'This data already exists.',
  'failed-precondition': 'Operation failed. Please try again.',
  'aborted': 'Operation was aborted. Please try again.',
  'out-of-range': 'Invalid data range.',
  'unauthenticated': 'Please login to continue.',
  'resource-exhausted': 'Too many requests. Please try again later.',
  'cancelled': 'Operation was cancelled.',
  'data-loss': 'Data error occurred. Please contact support.',
  'unknown': 'An unknown error occurred. Please try again.',
  'invalid-argument': 'Invalid data provided. Please check your input.',
  'deadline-exceeded': 'Request timeout. Please try again.',
  'unavailable': 'Service temporarily unavailable. Please try again.',
};

/**
 * Storage Error Messages
 */
const storageErrorMessages: Record<string, string> = {
  'storage/unknown': 'An unknown error occurred during upload.',
  'storage/object-not-found': 'File not found.',
  'storage/bucket-not-found': 'Storage bucket not found.',
  'storage/project-not-found': 'Project not found.',
  'storage/quota-exceeded': 'Storage quota exceeded.',
  'storage/unauthenticated': 'Please login to upload files.',
  'storage/unauthorized': 'You do not have permission to upload files.',
  'storage/retry-limit-exceeded': 'Upload failed after multiple attempts.',
  'storage/invalid-checksum': 'File upload verification failed.',
  'storage/canceled': 'Upload was cancelled.',
  'storage/invalid-event-name': 'Invalid upload event.',
  'storage/invalid-url': 'Invalid file URL.',
  'storage/invalid-argument': 'Invalid file or arguments.',
  'storage/no-default-bucket': 'No storage bucket configured.',
  'storage/cannot-slice-blob': 'File upload error occurred.',
  'storage/server-file-wrong-size': 'File size mismatch during upload.',
};

/**
 * Get user-friendly error message from Firebase error
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return 'An unknown error occurred.';
  }

  // Handle Firebase errors
  if (error instanceof FirebaseError) {
    // Check auth errors
    if (error.code in authErrorMessages) {
      return authErrorMessages[error.code];
    }

    // Check Firestore errors
    if (error.code in firestoreErrorMessages) {
      return firestoreErrorMessages[error.code];
    }

    // Check Storage errors
    if (error.code in storageErrorMessages) {
      return storageErrorMessages[error.code];
    }

    // Return original message if no mapping found
    return error.message || 'An error occurred. Please try again.';
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Fallback for unknown error types
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Log error to console in development
 */
export function logError(error: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
  }
}

/**
 * Show error toast notification
 */
export function showErrorToast(error: unknown, context?: string): void {
  const message = getErrorMessage(error);
  toast.error(message);
  logError(error, context);
}

/**
 * Show success toast notification
 */
export function showSuccessToast(message: string): void {
  toast.success(message);
}

/**
 * Handle async operation with error handling
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  options: {
    successMessage?: string;
    errorContext?: string;
    onSuccess?: (result: T) => void;
    onError?: (error: unknown) => void;
  } = {}
): Promise<{ success: boolean; data?: T; error?: unknown }> {
  try {
    const result = await operation();
    
    if (options.successMessage) {
      showSuccessToast(options.successMessage);
    }
    
    if (options.onSuccess) {
      options.onSuccess(result);
    }
    
    return { success: true, data: result };
  } catch (error) {
    showErrorToast(error, options.errorContext);
    
    if (options.onError) {
      options.onError(error);
    }
    
    return { success: false, error };
  }
}

/**
 * Create custom application error
 */
export function createAppError(code: string, message: string): AppError {
  return {
    code,
    message,
  };
}

/**
 * Check if error is a specific Firebase error code
 */
export function isFirebaseError(error: unknown, code: string): boolean {
  return error instanceof FirebaseError && error.code === code;
}

/**
 * Check if error is permission denied
 */
export function isPermissionDenied(error: unknown): boolean {
  return isFirebaseError(error, 'permission-denied');
}

/**
 * Check if error is unauthenticated
 */
export function isUnauthenticated(error: unknown): boolean {
  return (
    isFirebaseError(error, 'unauthenticated') ||
    isFirebaseError(error, 'auth/user-not-found')
  );
}

/**
 * Check if error is network related
 */
export function isNetworkError(error: unknown): boolean {
  return (
    isFirebaseError(error, 'auth/network-request-failed') ||
    isFirebaseError(error, 'unavailable')
  );
}

/**
 * Format validation errors as string
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) {
    return '';
  }
  
  if (errors.length === 1) {
    return errors[0];
  }
  
  return `• ${errors.join('\n• ')}`;
}

/**
 * Handle form submission errors
 */
export function handleFormError(error: unknown, fieldName?: string): void {
  const message = getErrorMessage(error);
  const formattedMessage = fieldName
    ? `${fieldName}: ${message}`
    : message;
  
  toast.error(formattedMessage);
  logError(error, `Form${fieldName ? ` - ${fieldName}` : ''}`);
}

/**
 * Retry operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on permission or auth errors
      if (isPermissionDenied(error) || isUnauthenticated(error)) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    logError(error, 'JSON Parse');
    return fallback;
  }
}

/**
 * Safe localStorage operations
 */
export const safeStorage = {
  get<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? safeJsonParse(item, fallback) : fallback;
    } catch (error) {
      logError(error, `Storage Get - ${key}`);
      return fallback;
    }
  },
  
  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logError(error, `Storage Set - ${key}`);
      return false;
    }
  },
  
  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      logError(error, `Storage Remove - ${key}`);
      return false;
    }
  },
  
  clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      logError(error, 'Storage Clear');
      return false;
    }
  },
};

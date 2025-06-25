import { toast } from "@/hooks/use-toast";

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * User-friendly error messages for common scenarios
 */
const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: "Can't connect to the server. Please check your internet connection.",
  TIMEOUT: "The request took too long. Please try again.",
  
  // Auth errors
  UNAUTHORIZED: "You need to log in to do that.",
  FORBIDDEN: "You don't have permission to do that.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  
  // Data errors
  NOT_FOUND: "We couldn't find what you're looking for.",
  VALIDATION_ERROR: "Please check your input and try again.",
  
  // Save errors
  SAVE_FAILED: "Failed to save your changes. Please try again.",
  LOAD_FAILED: "Failed to load data. Please refresh the page.",
  
  // Purchase errors
  INSUFFICIENT_FUNDS: "You don't have enough coins for this purchase.",
  PURCHASE_FAILED: "Purchase failed. Please try again.",
  
  // Generic
  UNKNOWN_ERROR: "Something went wrong. Please try again.",
  TRY_AGAIN_LATER: "Something went wrong. Please try again later.",
} as const;

/**
 * Get a user-friendly error message based on the error
 */
export function getUserFriendlyError(error: unknown): string {
  // Handle different error types
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('fetch failed') || error.message.includes('NetworkError')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    // Check for timeout
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return ERROR_MESSAGES.TIMEOUT;
    }
    
    // Return the error message if it seems user-friendly
    if (error.message.length < 100 && !error.message.includes('Error:')) {
      return error.message;
    }
  }
  
  // Handle API response errors
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as any).status;
    
    switch (status) {
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 422:
      case 400:
        return ERROR_MESSAGES.VALIDATION_ERROR;
      case 500:
      case 502:
      case 503:
        return ERROR_MESSAGES.TRY_AGAIN_LATER;
    }
  }
  
  // Default message
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Log error for debugging (only in development)
 */
export function logError(error: unknown, context?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` in ${context}` : ''}]:`, error);
  }
}

/**
 * Show error toast to user
 */
export function showErrorToast(error: unknown, context?: string) {
  const message = getUserFriendlyError(error);
  toast({
    title: "Error",
    description: message,
    variant: "destructive",
  });
  logError(error, context);
}

/**
 * Handle async operations with error handling
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  options?: {
    context?: string;
    showToast?: boolean;
    fallback?: T;
    onError?: (error: unknown) => void;
  }
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    const { context, showToast = true, fallback, onError } = options || {};
    
    if (showToast) {
      showErrorToast(error, context);
    } else {
      logError(error, context);
    }
    
    if (onError) {
      onError(error);
    }
    
    return fallback;
  }
}

/**
 * React Query error handler
 */
export function handleQueryError(error: unknown, context?: string) {
  // Only show toast for non-network errors (network errors shown by ConnectionBanner)
  const message = getUserFriendlyError(error);
  if (!message.includes('connect to the server')) {
    showErrorToast(error, context);
  } else {
    logError(error, context);
  }
}

/**
 * Create a safe event handler that catches errors
 */
export function safeHandler<T extends (...args: any[]) => any>(
  handler: T,
  context?: string
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = handler(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          showErrorToast(error, context);
        });
      }
      
      return result;
    } catch (error) {
      showErrorToast(error, context);
    }
  }) as T;
}

/**
 * Retry utility for flaky operations
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    delay?: number;
    shouldRetry?: (error: unknown) => boolean;
  }
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, shouldRetry } = options || {};
  
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
}

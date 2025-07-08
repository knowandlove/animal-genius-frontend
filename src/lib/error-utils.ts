// Client-side error utilities
// WebSocket error handling has been removed - will be re-implemented on different server

export function getErrorMessage(code?: string, defaultMessage?: string): string {
  if (!code) return defaultMessage || 'An error occurred';
  
  return defaultMessage || 'An error occurred';
}

export function isRetryableError(code?: string): boolean {
  // Placeholder for future implementation
  return false;
}

export function isAuthError(code?: string): boolean {
  // Placeholder for future implementation  
  return false;
}

export function isGameError(code?: string): boolean {
  // Placeholder for future implementation
  return false;
}
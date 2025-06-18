// Client-side error utilities
import { WSErrorCode } from '@shared/error-codes';

// User-friendly error messages for specific error codes
const userFriendlyMessages: Partial<Record<WSErrorCode, string>> = {
  [WSErrorCode.CONNECTION_RATE_LIMITED]: 'Please slow down! You\'re submitting answers too quickly.',
  [WSErrorCode.GAME_CODE_INVALID]: 'Invalid game code. Please check and try again.',
  [WSErrorCode.GAME_ALREADY_STARTED]: 'This game has already started. Ask your teacher for a new code.',
  [WSErrorCode.GAME_FULL]: 'This game is full. Please ask your teacher for help.',
  [WSErrorCode.PLAYER_NAME_DUPLICATE]: 'Someone already has that name. Please choose a different one.',
  [WSErrorCode.PLAYER_ALREADY_ANSWERED]: 'You\'ve already answered this question!',
  [WSErrorCode.AUTH_UNAUTHORIZED_ORIGIN]: 'Connection blocked for security reasons. Please refresh the page.',
  [WSErrorCode.CONNECTION_NOT_IN_GAME]: 'You\'re not in a game. Please join a game first.',
  [WSErrorCode.ANSWER_TOO_LATE]: 'Time\'s up! Your answer was submitted too late.',
  [WSErrorCode.PLAYER_KICKED]: 'You have been removed from the game.',
};

export function getErrorMessage(code?: WSErrorCode, defaultMessage?: string): string {
  if (!code) return defaultMessage || 'An error occurred';
  
  return userFriendlyMessages[code] || defaultMessage || 'An error occurred';
}

export function isRetryableError(code?: WSErrorCode): boolean {
  if (!code) return false;
  
  // These errors might resolve with a retry
  const retryableErrors = [
    WSErrorCode.SERVER_ERROR,
    WSErrorCode.CONNECTION_INVALID_STATE,
  ];
  
  return retryableErrors.includes(code);
}

export function isAuthError(code?: WSErrorCode): boolean {
  if (!code) return false;
  
  return code.startsWith('WS_AUTH_');
}

export function isGameError(code?: WSErrorCode): boolean {
  if (!code) return false;
  
  return code.startsWith('WS_GAME_');
}
import { useCallback } from 'react';
import { useAuth } from './useAuth';

const STORAGE_PREFIX = 'lastAccessedClassId_';

/**
 * Custom hook to manage the last accessed class for a teacher
 * Stores the class ID in localStorage and provides methods to get/set/clear it
 */
export function useLastAccessedClass() {
  const { user } = useAuth();

  /**
   * Get the storage key for the current user
   */
  const getStorageKey = useCallback(() => {
    if (!user?.id) return null;
    return `${STORAGE_PREFIX}${user.id}`;
  }, [user?.id]);

  /**
   * Save the last accessed class ID
   */
  const saveLastAccessedClass = useCallback((classId: string) => {
    const key = getStorageKey();
    if (key) {
      try {
        localStorage.setItem(key, classId);
        // Also save timestamp for potential future features
        localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
      } catch (error) {
        console.error('Failed to save last accessed class:', error);
      }
    }
  }, [getStorageKey]);

  /**
   * Get the last accessed class ID
   */
  const getLastAccessedClass = useCallback((): string | null => {
    const key = getStorageKey();
    if (!key) return null;
    
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to get last accessed class:', error);
      return null;
    }
  }, [getStorageKey]);

  /**
   * Clear the last accessed class (useful for logout or when class is deleted)
   */
  const clearLastAccessedClass = useCallback(() => {
    const key = getStorageKey();
    if (key) {
      try {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_timestamp`);
      } catch (error) {
        console.error('Failed to clear last accessed class:', error);
      }
    }
  }, [getStorageKey]);

  /**
   * Get the last accessed class path if it exists
   */
  const getLastAccessedClassPath = useCallback((): string | null => {
    const classId = getLastAccessedClass();
    if (classId) {
      return `/class/${classId}/dashboard`;
    }
    return null;
  }, [getLastAccessedClass]);

  return {
    saveLastAccessedClass,
    getLastAccessedClass,
    clearLastAccessedClass,
    getLastAccessedClassPath,
  };
}
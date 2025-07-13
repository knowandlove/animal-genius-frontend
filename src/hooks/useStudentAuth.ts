import { useState, useEffect, useCallback } from 'react';
import { 
  getCurrentAuthState, 
  loginWithPassportCode,
  getStudentProfile,
  logoutStudent,
  type AuthState,
  type StudentProfile
} from '../lib/passport-auth';

export function useStudentAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => getCurrentAuthState());
  const [isLoading, setIsLoading] = useState(false);

  // Listen for auth state changes (from other tabs or logout)
  useEffect(() => {
    const handleAuthChange = (event: CustomEvent) => {
      setAuthState(event.detail);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'studentPassportCode' || event.key === 'studentProfile') {
        setAuthState(getCurrentAuthState());
      }
    };

    window.addEventListener('studentAuthChanged', handleAuthChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('studentAuthChanged', handleAuthChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Refresh student profile from server
  const refreshProfile = useCallback(async (): Promise<StudentProfile | null> => {
    if (!authState.isAuthenticated) {
      return null;
    }

    setIsLoading(true);
    try {
      const profile = await getStudentProfile();
      if (profile) {
        setAuthState(prev => ({
          ...prev,
          student: profile
        }));
      }
      return profile;
    } catch (error) {
      console.error('Failed to refresh student profile:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [authState.isAuthenticated]);

  // Login with passport code
  const login = useCallback(async (passportCode: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setAuthState(prev => ({ ...prev, error: undefined }));

    try {
      const result = await loginWithPassportCode(passportCode);
      
      if (result.isAuthenticated && result.student) {
        setAuthState(result);
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('studentAuthChanged', { 
          detail: result 
        }));
        
        return { success: true };
      } else {
        setAuthState(result);
        return { 
          success: false, 
          error: result.error || 'Login failed' 
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState({ 
        isAuthenticated: false, 
        error: errorMessage 
      });
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    logoutStudent();
    setAuthState({ isAuthenticated: false });
  }, []);

  // Check if passport code is valid format
  const isValidPassportFormat = useCallback((code: string): boolean => {
    return /^[A-Z]{3}-[A-Z0-9]{3}$/.test(code);
  }, []);

  return {
    // Auth state
    isAuthenticated: authState.isAuthenticated,
    student: authState.student,
    error: authState.error,
    isLoading,

    // Actions
    login,
    logout,
    refreshProfile,

    // Utilities
    isValidPassportFormat,
    passportCode: authState.student?.passportCode || localStorage.getItem('studentPassportCode')
  };
}
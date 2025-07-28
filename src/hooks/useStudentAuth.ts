import { useState, useEffect, useCallback } from 'react';
import { 
  getStoredPassportCode,
  storePassportCode,
  logoutStudent,
  getPassportAuthHeaders,
  type StudentData
} from '../lib/passport-auth';
import { apiRequest } from '../lib/queryClient';

interface AuthState {
  isAuthenticated: boolean;
  student: StudentData | null;
  passportCode: string | null;
  error?: string;
}

interface StudentProfile extends StudentData {
  // Additional profile fields if needed
}

function getCurrentAuthState(): AuthState {
  const passportCode = getStoredPassportCode();
  // TODO: Retrieve student data from localStorage or make an API call
  return {
    isAuthenticated: !!passportCode,
    student: null,
    passportCode
  };
}

async function getStudentProfile(): Promise<StudentProfile | null> {
  try {
    const response = await apiRequest('GET', '/api/student/profile', undefined, {
      headers: getPassportAuthHeaders()
    });
    return response as StudentProfile;
  } catch (error) {
    console.error('Failed to get student profile:', error);
    return null;
  }
}

async function loginWithPassportCode(passportCode: string): Promise<AuthState> {
  try {
    const response = await apiRequest('POST', '/api/student-passport/validate', {
      passportCode
    });
    
    if (response.valid) {
      storePassportCode(passportCode);
      return {
        isAuthenticated: true,
        student: response.student,
        passportCode
      };
    }
    
    return {
      isAuthenticated: false,
      student: null,
      passportCode: null
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

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
        setAuthState((prev: AuthState) => ({
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
    setAuthState((prev: AuthState) => ({ ...prev, error: undefined }));

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
          error: 'Login failed' 
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState({ 
        isAuthenticated: false, 
        student: null,
        passportCode: null,
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
    setAuthState({ 
      isAuthenticated: false,
      student: null,
      passportCode: null
    });
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
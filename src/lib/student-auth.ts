// Student authentication utilities
import { apiRequest } from './queryClient';

export interface AuthState {
  isAuthenticated: boolean;
  studentName?: string;
  passportCode?: string;
}

export async function authenticateStudent(passportCode: string, classCode?: string): Promise<AuthState> {
  try {
    // Use class-scoped endpoint if classCode is provided
    const endpoint = classCode 
      ? `/api/class/${classCode}/authenticate` 
      : '/api/room/authenticate';
      
    const response = await apiRequest('POST', endpoint, { passportCode });
    return {
      isAuthenticated: true,
      studentName: response.studentName,
      passportCode
    };
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}

export async function checkSession(): Promise<AuthState> {
  try {
    const response = await apiRequest('GET', '/api/room/check-session');
    return {
      isAuthenticated: response.authenticated,
      studentName: response.studentName,
      passportCode: response.passportCode
    };
  } catch (error) {
    // No valid session
    return { isAuthenticated: false };
  }
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('POST', '/api/room/logout');
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

// Check if error is authentication related
export function isAuthError(error: any): boolean {
  return error?.status === 401 || error?.message?.includes('401');
}

// Check if error is permission related
export function isPermissionError(error: any): boolean {
  return error?.status === 403 || error?.message?.includes('403');
}
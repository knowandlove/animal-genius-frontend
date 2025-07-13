/**
 * Passport-based authentication system for students
 */

const PASSPORT_STORAGE_KEY = 'student_passport_code';
const STUDENT_DATA_KEY = 'student_data';

export interface StudentData {
  id: string;
  name: string;
  animalType: string;
  geniusType?: string;
  classId: string;
  passportCode: string;
  schoolYear?: string;
}

/**
 * Store passport code in localStorage
 */
export function storePassportCode(passportCode: string): void {
  localStorage.setItem(PASSPORT_STORAGE_KEY, passportCode.toUpperCase());
}

/**
 * Get stored passport code
 */
export function getStoredPassportCode(): string | null {
  return localStorage.getItem(PASSPORT_STORAGE_KEY);
}

/**
 * Clear stored passport code
 */
export function clearPassportCode(): void {
  localStorage.removeItem(PASSPORT_STORAGE_KEY);
  localStorage.removeItem(STUDENT_DATA_KEY);
}

/**
 * Logout student (alias for clearPassportCode)
 */
export function logoutStudent(): void {
  clearPassportCode();
  // Dispatch auth change event for other components
  window.dispatchEvent(new CustomEvent('student-auth-change', {
    detail: { isAuthenticated: false }
  }));
}

/**
 * Store student data after successful login
 */
export function storeStudentData(data: StudentData): void {
  localStorage.setItem(STUDENT_DATA_KEY, JSON.stringify(data));
}

/**
 * Get stored student data
 */
export function getStoredStudentData(): StudentData | null {
  const data = localStorage.getItem(STUDENT_DATA_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Check if student is authenticated (has passport code)
 */
export function isStudentAuthenticated(): boolean {
  return !!getStoredPassportCode();
}

/**
 * Get authentication headers for API requests
 */
export function getPassportAuthHeaders(): Record<string, string> {
  const passportCode = getStoredPassportCode();
  if (!passportCode) {
    return {};
  }
  
  return {
    'X-Passport-Code': passportCode,
  };
}

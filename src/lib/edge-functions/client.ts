import { supabase } from '../supabase';

// Edge Function base URL - will be set from environment variable
const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

export interface EdgeFunctionOptions {
  headers?: Record<string, string>;
}

/**
 * Call a Supabase Edge Function
 */
export async function callEdgeFunction<T = any>(
  functionName: string,
  body?: any,
  options?: EdgeFunctionOptions
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
    headers: options?.headers,
  });

  if (error) {
    console.error(`Edge function error (${functionName}):`, error);
    throw new Error(error.message || `Failed to call ${functionName}`);
  }

  return data as T;
}

/**
 * Quiz submission types
 */
export interface QuizSubmitRequest {
  classCode: string;
  firstName: string;
  lastInitial: string;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
}

export interface QuizSubmitResponse {
  success: boolean;
  passportCode: string;
  animalType: string;
  firstName: string;
  message: string;
  studentId?: string;
}

/**
 * Submit a quiz through the Edge Function
 */
export async function submitQuiz(data: QuizSubmitRequest): Promise<QuizSubmitResponse> {
  return callEdgeFunction<QuizSubmitResponse>('quiz-submit', data);
}

/**
 * Student login types
 */
export interface StudentLoginRequest {
  passportCode: string;
}

export interface StudentLoginResponse {
  success: boolean;
  student: {
    id: string;
    name: string;
    classId: string;
    animalType: string;
    geniusType?: string;
    schoolYear?: string;
  };
  message?: string;
}

/**
 * Authenticate a student with their passport code
 */
export async function studentLogin(passportCode: string): Promise<StudentLoginResponse> {
  return callEdgeFunction<StudentLoginResponse>('student-login', {
    passportCode: passportCode.toUpperCase(), // Ensure uppercase
  });
}

/**
 * Check quiz eligibility
 */
export interface QuizEligibilityRequest {
  classCode: string;
}

export interface QuizEligibilityResponse {
  eligible: boolean;
  className?: string;
  message: string;
}

export async function checkQuizEligibility(classCode: string): Promise<QuizEligibilityResponse> {
  return callEdgeFunction<QuizEligibilityResponse>('quiz-check-eligibility', {
    classCode,
  });
}

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
  console.log(`Calling edge function ${functionName} with body:`, body);
  
  const response = await supabase.functions.invoke(functionName, {
    body,
    headers: options?.headers,
  });

  console.log(`Edge function ${functionName} response:`, response);

  if (response.error) {
    console.error(`Edge function error (${functionName}):`, response.error);
    // Try to parse error details from the response
    if (response.error.message === 'Edge Function returned a non-2xx status code') {
      // Try to get actual error from data
      if (response.data && typeof response.data === 'object') {
        const errorMessage = response.data.error || response.data.message || response.data.debug;
        if (errorMessage) {
          console.error(`Actual error from Edge Function:`, errorMessage);
          throw new Error(errorMessage);
        }
      }
    }
    throw new Error(response.error.message || `Failed to call ${functionName}`);
  }

  const data = response.data;

  // Check if the response contains an error (Edge Functions can return errors in data)
  if (data && typeof data === 'object' && 'error' in data) {
    console.error(`Edge function returned error:`, data.error);
    throw new Error(data.error || `Edge function ${functionName} returned an error`);
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
  mbtiType?: string;
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
  firstName: string;
  lastInitial: string;
}

export interface QuizEligibilityResponse {
  eligible: boolean;
  className?: string;
  message: string;
  reason?: string;
  suggestion?: string;
  classInfo?: {
    name: string;
    currentStudents: number;
    maxStudents: number | string;
  };
}

export async function checkQuizEligibility(
  classCode: string, 
  firstName?: string, 
  lastInitial?: string
): Promise<QuizEligibilityResponse> {
  return callEdgeFunction<QuizEligibilityResponse>('quiz-check-eligibility', {
    classCode,
    firstName: firstName || '',
    lastInitial: lastInitial || '',
  });
}

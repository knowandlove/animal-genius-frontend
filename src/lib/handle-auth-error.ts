import { toast } from "@/hooks/use-toast";
import { QueryClient } from "@tanstack/react-query";

// Global state to track if we're already handling an auth error
let isHandlingAuthError = false;

export interface AuthErrorOptions {
  queryClient?: QueryClient;
  showToast?: boolean;
  redirectToLogin?: boolean;
  customMessage?: string;
}

export function handleAuthError(
  error: any,
  options: AuthErrorOptions = {}
) {
  const {
    queryClient,
    showToast = true,
    redirectToLogin = true,
    customMessage
  } = options;

  // Check if this is a JWT/auth related error
  const isAuthError = 
    error?.status === 401 ||
    error?.status === 403 ||
    error?.message?.toLowerCase().includes('token') ||
    error?.message?.toLowerCase().includes('expired') ||
    error?.message?.toLowerCase().includes('invalid') ||
    error?.message?.toLowerCase().includes('unauthorized');

  if (!isAuthError || isHandlingAuthError) {
    return false;
  }

  // Set flag to prevent multiple handlers
  isHandlingAuthError = true;

  // Clear all auth data
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  
  // Clear React Query cache to reset all loading states
  if (queryClient) {
    queryClient.clear();
    queryClient.cancelQueries();
  }

  // Show user-friendly message
  if (showToast) {
    toast({
      title: "Session Expired",
      description: customMessage || "Your session has expired. Please log in again to continue.",
      variant: "destructive",
      duration: 5000,
    });
  }

  // Store message for login page
  localStorage.setItem(
    "authExpiredMessage", 
    customMessage || "Your session has expired. Please log in again."
  );

  // Redirect to login after a brief delay
  if (redirectToLogin) {
    setTimeout(() => {
      window.location.href = '/login';
      // Reset flag after redirect
      isHandlingAuthError = false;
    }, 1000);
  } else {
    // Reset flag if not redirecting
    setTimeout(() => {
      isHandlingAuthError = false;
    }, 2000);
  }

  return true;
}

// Hook to use in components
export function useAuthErrorHandler(queryClient?: QueryClient) {
  return (error: any) => handleAuthError(error, { queryClient });
}
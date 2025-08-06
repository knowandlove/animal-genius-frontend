import { ReactNode, useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';

interface AuthAwareLoadingWrapperProps {
  isLoading: boolean;
  error?: any;
  children: ReactNode;
  loadingMessage?: string;
  minLoadingTime?: number; // Minimum time to show loading state
}

export function AuthAwareLoadingWrapper({
  isLoading,
  error,
  children,
  loadingMessage = "Loading...",
  minLoadingTime = 500
}: AuthAwareLoadingWrapperProps) {
  const [showLoading, setShowLoading] = useState(isLoading);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
    } else {
      // Ensure minimum loading time to prevent flicker
      const elapsed = Date.now() - startTime;
      const remaining = minLoadingTime - elapsed;
      
      if (remaining > 0) {
        setTimeout(() => setShowLoading(false), remaining);
      } else {
        setShowLoading(false);
      }
    }
  }, [isLoading, startTime, minLoadingTime]);

  // If there's an auth error, don't show loading indefinitely
  useEffect(() => {
    if (error) {
      const isAuthError = 
        error?.status === 401 ||
        error?.status === 403 ||
        error?.message?.toLowerCase().includes('token') ||
        error?.message?.toLowerCase().includes('expired');
      
      if (isAuthError) {
        // Force hide loading for auth errors
        setShowLoading(false);
      }
    }
  }, [error]);

  if (showLoading && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <LoadingSpinner size="lg" />
        {loadingMessage && <p className="text-gray-600">{loadingMessage}</p>}
      </div>
    );
  }

  return <>{children}</>;
}
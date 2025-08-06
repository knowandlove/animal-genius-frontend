import { ReactNode, useEffect } from 'react';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { handleAuthError } from '@/lib/handle-auth-error';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  useEffect(() => {
    // Check if this is an auth error
    const isAuthError = handleAuthError(error, { queryClient });
    
    // If it's not an auth error, log it
    if (!isAuthError) {
      console.error('Non-auth error in AuthErrorBoundary:', error);
    }
  }, [error]);

  // If it's an auth error, the handleAuthError will redirect
  // Show a fallback for non-auth errors
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-gray-600">
              We encountered an error while loading this content.
            </p>
            <Button onClick={resetErrorBoundary} variant="default">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AuthErrorBoundary({ children, fallback }: AuthErrorBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      FallbackComponent={fallback ? () => <>{fallback}</> : ErrorFallback}
      onReset={reset}
    >
      {children}
    </ErrorBoundary>
  );
}
import React from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  className?: string;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({ 
  className, 
  message = 'Loading...', 
  size = 'md' 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8', className)}>
      <Loader2 className={cn('animate-spin text-primary mb-4', sizeClasses[size])} />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  error?: unknown;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ 
  error, 
  message, 
  onRetry, 
  className 
}: ErrorStateProps) {
  // Determine the error message to show
  const errorMessage = message || (error instanceof Error ? error.message : 'Something went wrong');

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
      <p className="text-gray-600 mb-4 max-w-md">{errorMessage}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  title = 'No data found', 
  message = 'There is nothing to display here.',
  icon,
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4 max-w-md">{message}</p>
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Composite component for handling all states
interface DataStateProps {
  isLoading?: boolean;
  error?: unknown;
  isEmpty?: boolean;
  loadingMessage?: string;
  errorMessage?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function DataState({
  isLoading,
  error,
  isEmpty,
  loadingMessage,
  errorMessage,
  emptyTitle,
  emptyMessage,
  onRetry,
  className,
  children,
}: DataStateProps) {
  if (isLoading) {
    return <LoadingState message={loadingMessage} className={className} />;
  }

  if (error) {
    return <ErrorState error={error} message={errorMessage} onRetry={onRetry} className={className} />;
  }

  if (isEmpty) {
    return <EmptyState title={emptyTitle} message={emptyMessage} className={className} />;
  }

  return <>{children}</>;
}

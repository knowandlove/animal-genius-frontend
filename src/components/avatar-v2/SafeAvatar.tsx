import React from 'react';
import ErrorBoundary from '@/components/error-boundary';
import LayeredAvatarDB from './LayeredAvatarDB';
import LayeredAvatarRoom from './LayeredAvatarRoom';
import { Skeleton } from '@/components/ui/skeleton';

interface SafeAvatarProps {
  type: 'db' | 'room';
  animalType: string;
  width?: number;
  height?: number;
  items?: {
    hat?: string;
    glasses?: string;
    accessory?: string;
  };
  onClick?: () => void;
  className?: string;
  animated?: boolean;
  animalScale?: number;
}

// Fallback component for when avatar fails to load
function AvatarFallback({ width = 300, height = 300 }: { width?: number; height?: number }) {
  return (
    <div 
      className="flex items-center justify-center bg-gray-100 rounded-lg"
      style={{ width, height }}
    >
      <div className="text-center">
        <div className="text-4xl mb-2">🐾</div>
        <p className="text-sm text-muted-foreground">Avatar unavailable</p>
      </div>
    </div>
  );
}

// Loading skeleton for avatars
function AvatarSkeleton({ width = 300, height = 300 }: { width?: number; height?: number }) {
  return <Skeleton className="rounded-lg" style={{ width, height }} />;
}

// Safe wrapper for avatar components
export function SafeAvatar({ type, ...props }: SafeAvatarProps) {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate a brief loading state
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <AvatarSkeleton width={props.width} height={props.height} />;
  }

  return (
    <ErrorBoundary 
      fallback={<AvatarFallback width={props.width} height={props.height} />}
      onError={(error) => {
        // Could send to error tracking service here
        console.error('Avatar component error:', error);
      }}
    >
      {type === 'db' ? (
        <LayeredAvatarDB {...props} />
      ) : (
        <LayeredAvatarRoom {...props} />
      )}
    </ErrorBoundary>
  );
}

// Export convenience components
export function SafeLayeredAvatarDB(props: Omit<SafeAvatarProps, 'type'>) {
  return <SafeAvatar type="db" {...props} />;
}

export function SafeLayeredAvatarRoom(props: Omit<SafeAvatarProps, 'type'>) {
  return <SafeAvatar type="room" {...props} />;
}

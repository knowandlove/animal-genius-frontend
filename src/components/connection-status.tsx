import { useWebSocketStatus, ConnectionStatus } from '@/hooks/use-websocket-status';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ConnectionStatusProps {
  className?: string;
  variant?: 'badge' | 'banner' | 'inline';
  showWhenConnected?: boolean;
}

export function ConnectionStatusIndicator({ 
  className, 
  variant = 'badge',
  showWhenConnected = false 
}: ConnectionStatusProps) {
  const { status, message, isOnline } = useWebSocketStatus();
  
  // Hide when connected (unless showWhenConnected is true)
  if (status === 'connected' && !showWhenConnected) {
    return null;
  }
  
  const getStatusColor = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'disconnected':
      default:
        return 'bg-gray-500';
    }
  };
  
  const getIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4" />;
      case 'connecting':
      case 'reconnecting':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'disconnected':
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };
  
  if (variant === 'badge') {
    return (
      <AnimatePresence>
        {(status !== 'connected' || showWhenConnected) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Badge 
              variant="outline" 
              className={cn(
                "flex items-center gap-2 transition-colors",
                getStatusColor(status),
                "text-white border-transparent",
                className
              )}
            >
              {getIcon()}
              <span className="text-xs font-medium">{message}</span>
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
  
  if (variant === 'banner') {
    return (
      <AnimatePresence>
        {(status !== 'connected' || showWhenConnected) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className={cn(
              "px-4 py-2 text-white text-sm font-medium",
              "flex items-center justify-center gap-2",
              getStatusColor(status),
              className
            )}>
              {getIcon()}
              <span>{message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
  
  // Inline variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "w-2 h-2 rounded-full animate-pulse",
        getStatusColor(status)
      )} />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
}

// Floating connection status for game pages
export function FloatingConnectionStatus() {
  const { status } = useWebSocketStatus();
  
  // Only show when not connected
  if (status === 'connected') {
    return null;
  }
  
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
    >
      <Card className="px-4 py-2 bg-white/95 backdrop-blur-sm shadow-lg border-white/20">
        <ConnectionStatusIndicator variant="inline" />
      </Card>
    </motion.div>
  );
}
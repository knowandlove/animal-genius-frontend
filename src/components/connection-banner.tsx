import { useWebSocketStatus } from '@/hooks/use-websocket-status';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ConnectionBanner() {
  const { status, message, isOnline } = useWebSocketStatus();
  
  // Only show when there's a connection issue
  if (status === 'connected') {
    return null;
  }
  
  const getVariant = () => {
    if (!isOnline || status === 'disconnected') return 'destructive';
    if (status === 'error') return 'destructive';
    return 'default'; // connecting, reconnecting
  };
  
  const getIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    
    switch (status) {
      case 'connecting':
      case 'reconnecting':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'disconnected':
      default:
        return <WifiOff className="h-4 w-4" />;
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Alert variant={getVariant()} className="rounded-none border-x-0 border-t-0">
          <div className="flex items-center gap-2">
            {getIcon()}
            <AlertDescription className="font-medium">
              {message}
            </AlertDescription>
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
}
import { useState, useEffect } from 'react';
import { gameWebSocket } from '@/lib/websocket';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

interface WebSocketStatus {
  status: ConnectionStatus;
  message: string;
  isOnline: boolean;
}

export function useWebSocketStatus(): WebSocketStatus {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    // Monitor WebSocket connection state
    const checkConnection = () => {
      if (!gameWebSocket.isConnected()) {
        setStatus('disconnected');
        return;
      }
      
      // Check actual WebSocket state
      const readyState = gameWebSocket.getReadyState();
      switch (readyState) {
        case WebSocket.CONNECTING:
          setStatus('connecting');
          break;
        case WebSocket.OPEN:
          setStatus('connected');
          break;
        case WebSocket.CLOSING:
        case WebSocket.CLOSED:
          setStatus('disconnected');
          break;
      }
    };
    
    // Check initially
    checkConnection();
    
    // Set up event listeners
    const handleConnect = () => setStatus('connected');
    const handleDisconnect = () => setStatus('disconnected');
    const handleReconnecting = () => setStatus('reconnecting');
    const handleError = () => setStatus('error');
    
    // Listen to WebSocket events
    gameWebSocket.on('connected', handleConnect);
    gameWebSocket.on('disconnected', handleDisconnect);
    gameWebSocket.on('reconnecting', handleReconnecting);
    gameWebSocket.on('error', handleError);
    
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      if (status === 'disconnected') {
        setStatus('reconnecting');
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setStatus('disconnected');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Poll connection state
    const interval = setInterval(checkConnection, 1000);
    
    return () => {
      gameWebSocket.off('connected', handleConnect);
      gameWebSocket.off('disconnected', handleDisconnect);
      gameWebSocket.off('reconnecting', handleReconnecting);
      gameWebSocket.off('error', handleError);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [status]);
  
  // Generate user-friendly message
  const getMessage = (): string => {
    if (!isOnline) {
      return 'No internet connection';
    }
    
    switch (status) {
      case 'connecting':
        return 'Connecting to game server...';
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'error':
        return 'Connection error';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };
  
  return {
    status,
    message: getMessage(),
    isOnline
  };
}
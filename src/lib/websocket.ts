// WebSocket connection helper for the game system
import { WSMessage } from '@shared/game-types';

export class GameWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private connectionUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isAuthenticated = false;
  private pendingAuth: { gameCode: string; playerName: string } | null = null;

  constructor() {
    // Determine WebSocket URL based on environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    // WebSocket runs on same port as HTTP server (8080 in this case)
    this.connectionUrl = `${protocol}//${host}/ws/game`;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          resolve();
          return;
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('Attempting WebSocket connection to:', this.connectionUrl);
        }
        this.ws = new WebSocket(this.connectionUrl);

        this.ws.onopen = () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('WebSocket connected successfully');
          }
          this.reconnectAttempts = 0;
          this.emit('connected', {});
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            if (process.env.NODE_ENV === 'development') {
              console.log('📨 Received WebSocket message:', message.type, message.data);
            }
            
            // Mark as authenticated when we successfully join a game
            if (message.type === 'joined-game') {
              this.isAuthenticated = true;
              this.pendingAuth = null;
              if (process.env.NODE_ENV === 'development') {
                console.log('🔐 WebSocket authenticated successfully');
              }
            }
            
            const handler = this.messageHandlers.get(message.type);
            if (handler) {
              if (process.env.NODE_ENV === 'development') {
                console.log('📨 Calling handler for:', message.type);
              }
              handler(message.data);
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.warn('📨 No handler registered for message type:', message.type);
              }
            }
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Failed to parse WebSocket message:', error);
            }
          }
        };

        this.ws.onerror = (error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('WebSocket error:', error);
            console.error('Connection URL was:', this.connectionUrl);
          }
          reject(error);
        };

        this.ws.onclose = (event) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason);
          }
          this.isAuthenticated = false;
          this.emit('disconnected', {});
          
          // Only attempt reconnect if it wasn't a deliberate close
          if (event.code !== 1000) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Max reconnection attempts reached');
      }
      this.emit('error', { message: 'Unable to reconnect to server' });
      return;
    }
    
    this.emit('reconnecting', { attempt: this.reconnectAttempts + 1 });

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    if (process.env.NODE_ENV === 'development') {
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect().then(() => {
        // Re-authenticate after reconnection if we have pending auth data
        if (this.pendingAuth) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔐 Re-authenticating after reconnection');
          }
          this.send('join-game', this.pendingAuth);
        }
      }).catch(error => {
        if (process.env.NODE_ENV === 'development') {
          console.error(error);
        }
      });
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.messageHandlers.clear();
  }

  send(type: string, data: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      if (process.env.NODE_ENV === 'development') {
        console.error('📤 WebSocket not connected. State:', this.ws?.readyState);
        console.error('📤 Attempted to send:', type, data);
      }
      return false;
    }

    // For critical game actions, ensure we're authenticated
    if (type === 'submit-answer' && !this.isAuthenticated) {
      if (process.env.NODE_ENV === 'development') {
        console.error('📤 Cannot submit answer - not authenticated');
      }
      
      // Try to re-authenticate if we have pending auth data
      if (this.pendingAuth) {
        this.send('join-game', this.pendingAuth);
      }
      return false;
    }

    try {
      const message: WSMessage = { type, data };
      if (process.env.NODE_ENV === 'development') {
        console.log('📤 Sending WebSocket message:', type, data);
      }
      this.ws.send(JSON.stringify(message));
      
      // Store authentication data for potential reconnection
      if (type === 'join-game') {
        this.pendingAuth = data;
      }
      
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('📤 Failed to send WebSocket message:', error);
      }
      return false;
    }
  }

  on(type: string, handler: (data: any) => void) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Registering handler for:', type);
    }
    this.messageHandlers.set(type, handler);
  }

  off(type: string, handler?: (data: any) => void) {
    if (handler) {
      const currentHandler = this.messageHandlers.get(type);
      if (currentHandler === handler) {
        this.messageHandlers.delete(type);
      }
    } else {
      this.messageHandlers.delete(type);
    }
  }
  
  private emit(type: string, data: any) {
    const handler = this.messageHandlers.get(type);
    if (handler) {
      handler(data);
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
  
  getReadyState(): number {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }
}

// Export singleton instance
export const gameWebSocket = new GameWebSocket();
import type { 
  Player, 
  GameQuestion,
  WSMessage,
  PlayerJoinedData,
  GameStartedData,
  QuestionResultData,
  AnimalType,
  GameStatus
} from '@shared/game-types';

class GameSocketService {
  private socket: WebSocket | null = null;
  private gameId: string | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  connect(gameId: string): void {
    if (this.socket?.readyState === WebSocket.OPEN && this.gameId === gameId) {
      return;
    }

    this.disconnect();
    this.gameId = gameId;

    // Get the WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.DEV ? 'localhost:5000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/game`;

    try {
      this.socket = new WebSocket(wsUrl);
      this.setupEventListeners();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to create WebSocket connection:', error);
      }
      this.emit('socket:error', 'Failed to connect to game server');
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Connected to game server');
      }
      this.reconnectAttempts = 0;
      this.emit('socket:connected');
    };

    this.socket.onclose = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Disconnected from game server');
      }
      this.emit('socket:disconnected');
      this.attemptReconnect();
    };

    this.socket.onerror = (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('WebSocket error:', error);
      }
      this.emit('socket:error', 'Connection error');
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to parse message:', error);
        }
      }
    };
  }

  private handleMessage(message: WSMessage): void {
    switch (message.type) {
      case 'game-created':
      case 'joined-game':
        this.emit('game:state', message.data);
        break;
      case 'player-joined':
        this.emit('game:playerJoined', message.data as PlayerJoinedData);
        break;
      case 'player-left':
        this.emit('game:playerLeft', message.data);
        break;
      case 'game-started':
        this.emit('game:started', message.data as GameStartedData);
        break;
      case 'next-question':
        this.emit('game:question', message.data);
        break;
      case 'show-answer':
        this.emit('game:answerResult', message.data as QuestionResultData);
        break;
      case 'game-ended':
        this.emit('game:ended', message.data);
        break;
      case 'animal-selected':
        this.emit('animal:selected', message.data);
        break;
      case 'avatar-customized':
        this.emit('avatar:customized', message.data);
        break;
      case 'answer-submitted':
        this.emit('answer:submitted', message.data);
        break;
      case 'timer-update':
        this.emit('timer:update', message.data);
        break;
      case 'error':
        this.emit('socket:error', message.data);
        break;
      default:
        if (process.env.NODE_ENV === 'development') {
          console.warn('Unknown message type:', message.type);
        }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Max reconnection attempts reached');
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    this.reconnectTimeout = setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      }
      if (this.gameId) {
        this.connect(this.gameId);
      }
    }, delay);
  }

  private send(message: WSMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.error('WebSocket is not connected');
      }
      this.emit('socket:error', 'Not connected to game server');
    }
  }

  joinGame(playerName: string, gameCode: string): void {
    this.send({
      type: 'join-game',
      data: { playerName, gameCode }
    });
  }

  selectAnimal(animal: AnimalType): void {
    this.send({
      type: 'select-animal',
      data: { animal }
    });
  }

  customizeAvatar(customization: any): void {
    this.send({
      type: 'customize-avatar',
      data: { customization }
    });
  }

  startGame(): void {
    this.send({
      type: 'start-game',
      data: {}
    });
  }

  submitAnswer(answer: string, timeRemaining: number = 0): void {
    this.send({
      type: 'submit-answer',
      data: { answer, timeRemaining }
    });
  }

  nextQuestion(): void {
    this.send({
      type: 'next-question',
      data: {}
    });
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.gameId = null;
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const gameSocket = new GameSocketService();
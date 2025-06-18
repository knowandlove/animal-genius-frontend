import { useEffect, useState, useCallback } from 'react';
import { gameSocket } from '@/services/gameSocket';
import type { GameState, GamePlayer, GameQuestion } from '@shared/game-types';

interface UseGameSocketOptions {
  gameId: string;
  playerName?: string;
  onStateChange?: (state: GameState) => void;
  onPlayerJoined?: (player: GamePlayer) => void;
  onPlayerLeft?: (playerId: string) => void;
  onGameStarted?: () => void;
  onQuestion?: (question: GameQuestion) => void;
  onAnswerResult?: (result: any) => void;
  onGameEnded?: (results: any) => void;
  onError?: (error: string) => void;
}

export function useGameSocket({
  gameId,
  playerName,
  onStateChange,
  onPlayerJoined,
  onPlayerLeft,
  onGameStarted,
  onQuestion,
  onAnswerResult,
  onGameEnded,
  onError,
}: UseGameSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    gameSocket.connect(gameId);

    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    const handleError = (error: string) => onError?.(error);

    const handleStateChange = (state: GameState) => {
      setGameState(state);
      onStateChange?.(state);
    };

    gameSocket.on('socket:connected', handleConnected);
    gameSocket.on('socket:disconnected', handleDisconnected);
    gameSocket.on('socket:error', handleError);
    gameSocket.on('game:state', handleStateChange);

    if (onPlayerJoined) {
      gameSocket.on('game:playerJoined', onPlayerJoined);
    }
    if (onPlayerLeft) {
      gameSocket.on('game:playerLeft', onPlayerLeft);
    }
    if (onGameStarted) {
      gameSocket.on('game:started', onGameStarted);
    }
    if (onQuestion) {
      gameSocket.on('game:question', onQuestion);
    }
    if (onAnswerResult) {
      gameSocket.on('game:answerResult', onAnswerResult);
    }
    if (onGameEnded) {
      gameSocket.on('game:ended', onGameEnded);
    }

    // Join the game after connecting if playerName is provided
    if (playerName && isConnected) {
      const gameCode = sessionStorage.getItem('gameCode');
      if (gameCode) {
        gameSocket.joinGame(playerName, gameCode);
      }
    }

    return () => {
      gameSocket.off('socket:connected', handleConnected);
      gameSocket.off('socket:disconnected', handleDisconnected);
      gameSocket.off('socket:error', handleError);
      gameSocket.off('game:state', handleStateChange);
      
      if (onPlayerJoined) {
        gameSocket.off('game:playerJoined', onPlayerJoined);
      }
      if (onPlayerLeft) {
        gameSocket.off('game:playerLeft', onPlayerLeft);
      }
      if (onGameStarted) {
        gameSocket.off('game:started', onGameStarted);
      }
      if (onQuestion) {
        gameSocket.off('game:question', onQuestion);
      }
      if (onAnswerResult) {
        gameSocket.off('game:answerResult', onAnswerResult);
      }
      if (onGameEnded) {
        gameSocket.off('game:ended', onGameEnded);
      }
      
      gameSocket.disconnect();
    };
  }, [gameId, playerName, isConnected]);

  const joinGame = useCallback((playerName: string, gameCode: string) => {
    gameSocket.joinGame(playerName, gameCode);
  }, []);

  const selectAnimal = useCallback((animal: any) => {
    gameSocket.selectAnimal(animal);
  }, []);

  const customizeAvatar = useCallback((avatar: any) => {
    gameSocket.customizeAvatar(avatar);
  }, []);

  const startGame = useCallback(() => {
    gameSocket.startGame();
  }, []);

  const submitAnswer = useCallback((answer: string, timeRemaining: number = 0) => {
    gameSocket.submitAnswer(answer, timeRemaining);
  }, []);

  const nextQuestion = useCallback(() => {
    gameSocket.nextQuestion();
  }, []);

  return {
    isConnected,
    gameState,
    joinGame,
    selectAnimal,
    customizeAvatar,
    startGame,
    submitAnswer,
    nextQuestion,
  };
}
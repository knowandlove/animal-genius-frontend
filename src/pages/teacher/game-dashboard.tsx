import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimalAvatar } from '@/components/game/AnimalAvatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { gameWebSocket } from '@/lib/websocket';
import { Player, GameQuestion, AnimalType } from '@shared/game-types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  SkipForward, 
  Users, 
  Trophy, 
  Timer,
  Copy,
  CheckCircle,
  XCircle,
  BarChart
} from 'lucide-react';
import { ConnectionStatusIndicator } from '@/components/connection-status';

export default function TeacherGameDashboard() {
  const { gameId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [isConnected, setIsConnected] = useState(false);
  const [gameStatus, setGameStatus] = useState<'lobby' | 'playing' | 'finished'>('lobby');
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any>(null);

  // Fetch game info
  const { data: gameInfo } = useQuery({
    queryKey: [`/api/games/${gameId}`],
    queryFn: () => apiRequest('GET', `/api/games/${gameId}`),
    refetchInterval: gameStatus === 'lobby' ? 2000 : false, // Poll in lobby
  });

  useEffect(() => {
    connectToGame();

    return () => {
      gameWebSocket.disconnect();
    };
  }, [gameId]);

  const connectToGame = async () => {
    try {
      // Disconnect any existing connection first
      gameWebSocket.disconnect();
      
      await gameWebSocket.connect();
      
      // Authenticate as teacher
      const wsTicket = sessionStorage.getItem('wsTicket');
      const wsTicketGameId = sessionStorage.getItem('wsTicketGameId');
      
      if (wsTicket && wsTicketGameId === gameId) {
        gameWebSocket.send('authenticate', { ticket: wsTicket });
        // After authentication, connect to the game as teacher
        gameWebSocket.send('teacher-create-game', { gameId: gameId });
      } else {
        throw new Error('No valid authentication ticket');
      }
      
      setIsConnected(true);

      // Set up event handlers
      gameWebSocket.on('players-sync', (data) => {
        // Sync all players when connecting
        const syncedPlayers = new Map<string, Player>();
        data.players.forEach((player: Player) => {
          syncedPlayers.set(player.id, player);
        });
        setPlayers(syncedPlayers);
      });

      gameWebSocket.on('player-joined', (data) => {
        const newPlayer = data.player;
        setPlayers(prev => {
          const updated = new Map(prev);
          updated.set(newPlayer.id, newPlayer);
          return updated;
        });
        
        toast({
          title: `${newPlayer.name} joined!`,
          description: `Total players: ${data.totalPlayers}`,
        });
      });

      gameWebSocket.on('player-updated', (data) => {
        setPlayers(prev => {
          const updated = new Map(prev);
          const player = updated.get(data.playerId);
          if (player) {
            player.animal = data.animal;
            updated.set(data.playerId, player);
          }
          return updated;
        });
      });

      gameWebSocket.on('player-ready', (data) => {
        toast({
          title: "Player Ready",
          description: `A player is ready to start`,
        });
      });

      gameWebSocket.on('player-answered', (data) => {
        setAnsweredCount(data.answeredCount);
      });

      gameWebSocket.on('player-disconnected', (data) => {
        setPlayers(prev => {
          const updated = new Map(prev);
          const player = updated.get(data.playerId);
          if (player) {
            player.connected = false;
            updated.set(data.playerId, player);
          }
          return updated;
        });
      });

      gameWebSocket.on('timer-update', (data) => {
        setTimeRemaining(data.timeRemaining);
      });

      gameWebSocket.on('authenticated', (data) => {
        console.log('🎮 Teacher authenticated successfully');
      });

      gameWebSocket.on('game-created', (data) => {
        console.log('🎮 Game created successfully:', data);
        // Game is now ready for players to join
      });

      gameWebSocket.on('game-started', (data) => {
        console.log('🎮 Teacher received game-started confirmation:', data);
        setCurrentQuestion(data.firstQuestion);
        setQuestionNumber(data.questionNumber);
        setTotalQuestions(data.totalQuestions);
        setAnsweredCount(0);
        setShowingAnswer(false);
      });

      gameWebSocket.on('show-answer', (data) => {
        setLeaderboard(data.leaderboard);
      });

      gameWebSocket.on('next-question', (data) => {
        setCurrentQuestion(data.question);
        setQuestionNumber(data.questionNumber);
        setAnsweredCount(0);
        setShowingAnswer(false);
      });

      gameWebSocket.on('game-ended', (data) => {
        setGameStatus('finished');
        setLeaderboard(data.finalLeaderboard);
      });
      
      gameWebSocket.on('error', (data) => {
        // Handle both old format (data.message) and new format (data.code, data.message)
        const errorMessage = data.message || 'An error occurred';
        const errorCode = data.code;
        
        toast({
          title: errorCode ? `Error (${errorCode})` : "Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Log detailed error for debugging
        console.error('Teacher dashboard error:', { code: errorCode, message: errorMessage, details: data.details });
      });

      // Connect to game using existing ticket variables from earlier in the function
      if (wsTicket && wsTicketGameId === gameId) {
        // Authenticate first
        console.log('🎮 Teacher authenticating with WebSocket ticket');
        gameWebSocket.send('authenticate', { ticket: wsTicket });
        
        // Wait a bit for authentication to complete
        setTimeout(() => {
          console.log('🎮 Teacher connecting to game:', gameId);
          gameWebSocket.send('teacher-create-game', { gameId });
        }, 100);
        
        // Clear ticket after use
        sessionStorage.removeItem('wsTicket');
        sessionStorage.removeItem('wsTicketGameId');
      } else {
        // Fallback - try without authentication (will fail on server if auth required)
        console.log('🎮 Teacher connecting to game without ticket:', gameId);
        gameWebSocket.send('teacher-create-game', { gameId });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to game server",
        variant: "destructive",
      });
    }
  };

  const handleStartGame = () => {
    if (players.size === 0) {
      toast({
        title: "No Players",
        description: "Wait for students to join before starting",
        variant: "destructive",
      });
      return;
    }

    if (!gameWebSocket.isConnected()) {
      toast({
        title: "Connection Error",
        description: "Not connected to game server",
        variant: "destructive",
      });
      return;
    }

    console.log('🎮 Teacher starting game...');
    console.log('🎮 Current players count:', players.size);
    console.log('🎮 Game ID:', gameId);
    console.log('🎮 WebSocket connection state:', gameWebSocket.isConnected());
    
    gameWebSocket.send('start-game', {});
    setGameStatus('playing');
  };

  const handleShowAnswer = () => {
    gameWebSocket.send('show-answer', {});
    setShowingAnswer(true);
  };

  const handleNextQuestion = () => {
    gameWebSocket.send('next-question', {});
    setShowingAnswer(false);
    setAnsweredCount(0);
  };

  const handleEndGame = () => {
    if (!gameWebSocket.isConnected()) {
      toast({
        title: "Connection Error",
        description: "Not connected to game server",
        variant: "destructive",
      });
      return;
    }
    
    gameWebSocket.send('end-game', {});
    setGameStatus('finished');
  };

  const handleKickPlayer = (playerId: string) => {
    gameWebSocket.send('kick-player', { playerId });
  };

  const copyGameCode = () => {
    if (gameInfo?.game?.code) {
      navigator.clipboard.writeText(gameInfo.game.code);
      toast({
        title: "Copied!",
        description: "Game code copied to clipboard",
      });
    }
  };

  // Group players by team
  const getTeams = () => {
    const teams = new Map<AnimalType, Player[]>();
    players.forEach(player => {
      const team = teams.get(player.animal) || [];
      team.push(player);
      teams.set(player.animal, team);
    });
    return teams;
  };

  if (!isConnected || !gameInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">Setting up game...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen game-bg p-4">
      <div className="max-w-7xl mx-auto">
        {/* Connection Status */}
        <div className="flex justify-end mb-4">
          <ConnectionStatusIndicator showWhenConnected={true} />
        </div>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">Game Control Center</h1>
            <p className="text-muted-foreground">
              {gameStatus === 'lobby' && 'Waiting for players to join'}
              {gameStatus === 'playing' && `Question ${questionNumber} of ${totalQuestions}`}
              {gameStatus === 'finished' && 'Game Complete!'}
            </p>
          </div>
          
          {/* Game Code */}
          <Card className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Game Code</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-mono font-bold">{gameInfo.game.code}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyGameCode}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {gameStatus === 'lobby' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Players List */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Players ({players.size})
                  </h2>
                  <Badge variant={players.size > 0 ? "default" : "secondary"}>
                    {players.size > 0 ? 'Ready to start' : 'Waiting for players'}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  {gameInfo.game.settings.mode === 'team' ? (
                    // Team view
                    Array.from(getTeams().entries()).map(([animal, teamPlayers]) => (
                      <div key={animal} className="border rounded-lg p-4">
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <AnimalAvatar animal={animal} size="sm" />
                          Team {animal} ({teamPlayers.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {teamPlayers.map(player => (
                            <div key={player.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AnimalAvatar 
                                  animal={player.animal}
                                  customization={player.avatar}
                                  size="sm"
                                />
                                <span className="text-sm">{player.name.length > 20 ? player.name.substring(0, 20) + '...' : player.name}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleKickPlayer(player.id)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    // Individual view
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Array.from(players.values()).map(player => (
                        <div key={player.id} className="flex items-center justify-between border rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <AnimalAvatar 
                              animal={player.animal}
                              customization={player.avatar}
                              size="sm"
                            />
                            <span className="text-sm">{player.name}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleKickPlayer(player.id)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Game Controls */}
            <div>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Game Settings</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Mode</p>
                    <p className="font-medium capitalize">{gameInfo.game.settings.mode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Questions</p>
                    <p className="font-medium">{gameInfo.game.settings.questionCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time per Question</p>
                    <p className="font-medium">{gameInfo.game.settings.timePerQuestion}s</p>
                  </div>
                </div>

                <Button
                  className="w-full mt-6 shadow-lg hover:shadow-primary/30 transition-all"
                  size="lg"
                  onClick={handleStartGame}
                  disabled={players.size === 0}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Game
                </Button>
              </Card>
            </div>
          </div>
        )}

        {gameStatus === 'playing' && currentQuestion && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Question Display */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <Badge className="mb-2">Question {questionNumber} of {totalQuestions}</Badge>
                    <h2 className="text-2xl font-semibold">{currentQuestion.question}</h2>
                  </div>
                  <div className="text-center">
                    <Timer className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{timeRemaining}s</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {Object.entries(currentQuestion.options).map(([key, value]) => (
                    <Card
                      key={key}
                      className={`p-4 ${
                        showingAnswer && key === currentQuestion.correctAnswer
                          ? 'border-accent bg-accent/10'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{key}</Badge>
                        <p>{value}</p>
                        {showingAnswer && key === currentQuestion.correctAnswer && (
                          <CheckCircle className="w-5 h-5 text-accent ml-auto" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    {answeredCount} of {players.size} players answered
                  </p>
                  
                  <div className="flex gap-3">
                    {!showingAnswer ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setTimeRemaining(0)}
                        >
                          Skip Timer
                        </Button>
                        <Button onClick={handleShowAnswer}>
                          Show Answer
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleNextQuestion}>
                        <SkipForward className="w-4 h-4 mr-2" />
                        Next Question
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Live Leaderboard */}
            <div>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Leaderboard
                </h2>
                
                {leaderboard && (
                  <div className="space-y-2">
                    {gameInfo.game.settings.mode === 'team' && leaderboard.teams ? (
                      // Team leaderboard
                      leaderboard.teams.slice(0, 5).map((team: any) => (
                        <div key={team.animal} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{team.rank}</Badge>
                            <AnimalAvatar animal={team.animal} size="sm" />
                            <span className="text-sm font-medium">{team.animal}</span>
                          </div>
                          <span className="font-bold">{team.score}</span>
                        </div>
                      ))
                    ) : (
                      // Individual leaderboard
                      leaderboard.players.slice(0, 5).map((entry: any) => (
                        <div key={entry.player.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{entry.rank}</Badge>
                            <AnimalAvatar 
                              animal={entry.player.animal} 
                              customization={entry.player.avatar}
                              size="sm" 
                            />
                            <span className="text-sm font-medium">{entry.player.name.length > 15 ? entry.player.name.substring(0, 15) + '...' : entry.player.name}</span>
                          </div>
                          <span className="font-bold">{entry.player.score}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>

              <Card className="p-4 mt-4">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleEndGame}
                >
                  End Game Early
                </Button>
              </Card>
            </div>
          </div>
        )}

        {gameStatus === 'finished' && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Game Complete!</h2>
              <p className="text-muted-foreground">Final Results</p>
            </div>

            {leaderboard && (
              <div className="max-w-2xl mx-auto">
                {gameInfo.game.settings.mode === 'team' && leaderboard.teams ? (
                  // Team results
                  <div className="space-y-4">
                    {leaderboard.teams.map((team: any, index: number) => (
                      <Card
                        key={team.animal}
                        className={`p-4 ${index === 0 ? 'border-yellow-500 bg-yellow-500/10' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant={index === 0 ? 'default' : 'outline'}
                              className={index === 0 ? 'bg-yellow-500' : ''}
                            >
                              {team.rank}
                            </Badge>
                            <AnimalAvatar animal={team.animal} size="md" />
                            <div>
                              <p className="font-semibold">Team {team.animal}</p>
                              <p className="text-sm text-muted-foreground">
                                {team.players?.length || 0} players
                              </p>
                            </div>
                          </div>
                          <p className="text-2xl font-bold">{team.score}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  // Individual results
                  <div className="space-y-3">
                    {leaderboard.players.map((entry: any, index: number) => (
                      <Card
                        key={entry.player.id}
                        className={`p-4 ${index === 0 ? 'border-yellow-500 bg-yellow-500/10' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant={index === 0 ? 'default' : 'outline'}
                              className={index === 0 ? 'bg-yellow-500' : ''}
                            >
                              {entry.rank}
                            </Badge>
                            <AnimalAvatar 
                              animal={entry.player.animal} 
                              customization={entry.player.avatar}
                              size="md" 
                            />
                            <p className="font-semibold">{entry.player.name.length > 20 ? entry.player.name.substring(0, 20) + '...' : entry.player.name}</p>
                          </div>
                          <p className="text-2xl font-bold">{entry.player.score}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4 mt-8 max-w-md mx-auto">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/teacher/dashboard')}
              >
                Back to Dashboard
              </Button>
              <Button
                className="flex-1"
                onClick={() => navigate('/teacher/game/create')}
              >
                New Game
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
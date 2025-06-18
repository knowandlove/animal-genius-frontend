import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimalAvatar } from '@/components/game/AnimalAvatar';
import { CountdownTimer } from '@/components/game/CountdownTimer';
import { QuestionProgress } from '@/components/game/QuestionProgress';
import { useToast } from '@/hooks/use-toast';
import { gameWebSocket } from '@/lib/websocket';
import { 
  GameQuestion, 
  Player, 
  AnimalType,
  QuestionResultData,
  getAnimalGenius 
} from '@shared/game-types';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Trophy, Zap, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getErrorMessage } from '@/lib/error-utils';
import { ConnectionStatusIndicator } from '@/components/connection-status';

export default function GamePlay() {
  const { gameId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Game state
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [rank, setRank] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any>(null);

  useEffect(() => {
    // Get player info from session
    const playerName = sessionStorage.getItem('playerName');
    const playerId = sessionStorage.getItem('playerId');
    
    console.log('🎮 Student useEffect - playerName:', playerName, 'playerId:', playerId, 'gameId:', gameId);
    
    if (!playerName || !gameId) {
      console.log('🎮 Student missing data, redirecting to join');
      navigate('/game/join');
      return;
    }

    // Set up WebSocket handlers IMMEDIATELY - don't wait
    console.log('🎮 Student setting up game handlers IMMEDIATELY');
    setupGameHandlers();

    // Check if we have stored game-started data from the lobby
    const storedGameData = sessionStorage.getItem('gameStartedData');
    if (storedGameData) {
      console.log('🎮 Student found stored game-started data, processing...');
      try {
        const gameStartedData = JSON.parse(storedGameData);
        console.log('🎮 Student processing stored game data:', gameStartedData);
        
        // Process the game-started data as if we just received it
        setCurrentQuestion(gameStartedData.firstQuestion);
        setQuestionNumber(gameStartedData.questionNumber);
        setTotalQuestions(gameStartedData.totalQuestions);
        setTimeRemaining(20);
        resetQuestionState();
        
        // Clear the stored data so it doesn't interfere later
        sessionStorage.removeItem('gameStartedData');
      } catch (error) {
        console.error('🎮 Student failed to parse stored game data:', error);
      }
    }

    // Ensure WebSocket connection and player context
    const ensureConnection = async () => {
      if (!gameWebSocket.isConnected()) {
        console.log('🎮 Student WebSocket not connected, attempting to reconnect...');
        await gameWebSocket.connect();
      }
      
      // Always rejoin to ensure player context is set on the server
      const gameCode = sessionStorage.getItem('gameCode');
      if (gameCode && playerName) {
        console.log('🎮 Ensuring player context with rejoin - code:', gameCode, 'name:', playerName);
        gameWebSocket.send('join-game', { gameCode, playerName });
        
        // Wait a moment for the server to process the join
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    };
    
    ensureConnection().catch(error => {
      console.error('🎮 Failed to ensure WebSocket connection:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to game server",
        variant: "destructive",
      });
    });

    return () => {
      // Don't clean up handlers on unmount - keep them for the session
      // This prevents missing events during navigation
      console.log('🎮 Student component unmounting - keeping handlers active');
    };
  }, [gameId, navigate]);

  const setupGameHandlers = () => {
    gameWebSocket.on('game-started', (data) => {
      console.log('🎮 Student received game-started:', data);
      console.log('🎮 Student gameId:', gameId);
      console.log('🎮 Student playerId:', sessionStorage.getItem('playerId'));
      console.log('🎮 Student WebSocket connected:', gameWebSocket.isConnected());
      setCurrentQuestion(data.firstQuestion);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setTimeRemaining(20);
      resetQuestionState();
    });

    gameWebSocket.on('timer-update', (data) => {
      setTimeRemaining(data.timeRemaining);
    });

    gameWebSocket.on('show-answer', (data: QuestionResultData) => {
      setShowResult(true);
      setCorrectAnswer(data.correctAnswer);
      
      // Find player's result
      const playerResult = data.playerResults.find(r => r.playerId === sessionStorage.getItem('playerId'));
      if (playerResult) {
        setIsCorrect(playerResult.correct);
        setScore(playerResult.newScore);
        
        // Celebrate correct answer
        if (playerResult.correct) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 }
          });
        }
      }

      // Update rank
      const playerRank = data.leaderboard.players.find(p => p.player.id === sessionStorage.getItem('playerId'));
      if (playerRank) {
        setRank(playerRank.rank);
      }

      setLeaderboard(data.leaderboard);
    });

    gameWebSocket.on('next-question', (data) => {
      setCurrentQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTimeRemaining(20);
      resetQuestionState();
    });

    gameWebSocket.on('game-ended', (data) => {
      setGameEnded(true);
      setLeaderboard(data.finalLeaderboard);
      
      // Big celebration for top 3
      const finalRank = data.finalLeaderboard.players.find(
        (p: any) => p.player.id === sessionStorage.getItem('playerId')
      )?.rank;
      
      if (finalRank && finalRank <= 3) {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 }
        });
      }
    });

    gameWebSocket.on('answer-submitted', (data) => {
      // Confirmation that answer was received
      console.log('✅ Answer submission confirmed:', data);
      if (data.points > 0) {
        toast({
          title: "Answer Submitted!",
          description: `+${data.points} points`,
        });
      } else {
        toast({
          title: "Answer Submitted",
          description: "Answer received",
        });
      }
    });

    gameWebSocket.on('error', (data) => {
      // Handle both old format (data.message) and new format (data.code, data.message)
      const errorCode = data.code;
      const errorMessage = getErrorMessage(errorCode, data.message);
      
      toast({
        title: "Oops!",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Log detailed error for debugging
      console.error('Game error:', { code: errorCode, message: data.message, details: data.details });
      
      // Special handling for certain errors
      if (errorCode === 'WS_PLAYER_KICKED') {
        setTimeout(() => navigate('/game/join'), 2000);
      }
    });
  };

  const resetQuestionState = () => {
    setSelectedAnswer(null);
    setHasAnswered(false);
    setShowResult(false);
    setIsCorrect(false);
    setCorrectAnswer(null);
  };

  const handleAnswerSelect = (answer: string) => {
    if (hasAnswered || showResult) return;
    
    console.log('🎯 Student selecting answer:', answer, 'for question:', currentQuestion?.id);
    console.log('🎯 WebSocket connected:', gameWebSocket.isConnected());
    console.log('🎯 Player info:', {
      playerId: sessionStorage.getItem('playerId'),
      playerName: sessionStorage.getItem('playerName'),
      gameCode: sessionStorage.getItem('gameCode'),
      gameId: gameId
    });
    console.log('🎯 Time remaining:', timeRemaining);
    
    setSelectedAnswer(answer);
    setHasAnswered(true);
    
    // Submit answer
    const answerData = {
      questionId: currentQuestion.id,
      answer,
      timeRemaining
    };
    
    console.log('🎯 Sending answer data:', answerData);
    
    if (!gameWebSocket.isConnected()) {
      console.error('🎯 WebSocket not connected, cannot submit answer');
      toast({
        title: "Connection Error",
        description: "Cannot submit answer - connection lost. Please try again.",
        variant: "destructive",
      });
      setHasAnswered(false); // Allow retry
      return;
    }
    
    const messageSent = gameWebSocket.send('submit-answer', answerData);
    if (!messageSent) {
      console.error('🎯 Failed to send answer');
      toast({
        title: "Send Failed",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive",
      });
      setHasAnswered(false); // Allow retry
      return;
    }
  };

  const getAnswerColor = (option: string) => {
    if (!showResult) {
      return selectedAnswer === option ? 'border-primary bg-primary/20' : '';
    }
    
    if (option === correctAnswer) {
      return 'border-green-500 bg-green-500/20';
    }
    
    if (selectedAnswer === option && !isCorrect) {
      return 'border-red-500 bg-red-500/20';
    }
    
    return '';
  };

  if (gameEnded) {
    return (
      <div className="min-h-screen game-bg p-4 flex items-center justify-center">
        <Card className="p-8 max-w-2xl w-full game-surface border-purple-500/20">
          <div className="text-center">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4 drop-shadow-glow" />
            <h1 className="text-4xl font-bold mb-2 text-white">Game Over!</h1>
            <p className="text-xl text-gray-400 mb-8">
              Final Score: <span className="font-bold text-yellow-500">{score}</span>
            </p>
            
            {leaderboard && (
              <div className="space-y-4 mb-8">
                <h2 className="text-2xl font-semibold text-white">Final Rankings</h2>
                <div className="space-y-2 max-w-md mx-auto">
                  {leaderboard.players.slice(0, 10).map((entry: any, index: number) => (
                    <Card
                      key={entry.player.id}
                      className={`p-3 ${
                        entry.player.id === sessionStorage.getItem('playerId')
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={index < 3 ? 'default' : 'outline'}
                            className={index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-white/10 text-white border-white/20'}
                          >
                            {entry.rank}
                          </Badge>
                          <AnimalAvatar 
                            animal={entry.player.animal}
                            customization={entry.player.avatar}
                            size="sm"
                          />
                          <span className="font-medium text-white">{entry.player.name.length > 15 ? entry.player.name.substring(0, 15) + '...' : entry.player.name}</span>
                        </div>
                        <span className="font-bold text-yellow-500">{entry.player.score}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate('/game/join')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Play Again
              </Button>
              <Button onClick={() => navigate('/')} className="game-primary-btn">
                Back to Home
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center game-bg">
        <Card className="p-8 game-surface border-white/10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-white">Waiting for game to start...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 relative overflow-hidden game-bg">
      {/* Gaming background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full blur-xl" style={{
          background: `radial-gradient(circle, hsl(var(--game-primary))/0.3 0%, transparent 70%)`
        }}></div>
        <div className="absolute top-1/4 right-20 w-24 h-24 rounded-full blur-lg" style={{
          background: `radial-gradient(circle, hsl(var(--game-secondary))/0.2 0%, transparent 70%)`
        }}></div>
        <div className="absolute bottom-1/3 left-1/4 w-20 h-20 rounded-full blur-lg" style={{
          background: `radial-gradient(circle, hsl(var(--game-accent))/0.15 0%, transparent 70%)`
        }}></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 rounded-full blur-xl" style={{
          background: `radial-gradient(circle, hsl(var(--game-success))/0.1 0%, transparent 70%)`
        }}></div>
      </div>
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Connection Status */}
        <div className="absolute top-0 right-0 z-20">
          <ConnectionStatusIndicator className="bg-black/50 backdrop-blur-sm" />
        </div>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <Badge variant="outline" className="mb-2 bg-white/10 text-white border-white/20">
              Question {questionNumber} of {totalQuestions}
            </Badge>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-xl text-white">Score: {score}</span>
              {rank > 0 && (
                <Badge variant="secondary" className="bg-white/10 text-white">Rank #{rank}</Badge>
              )}
            </div>
          </div>
          
          <CountdownTimer
            timeRemaining={timeRemaining}
            maxTime={20}
            size="lg"
          />
        </div>

        {/* Progress Indicator */}
        <QuestionProgress 
          current={questionNumber} 
          total={totalQuestions} 
          className="mb-6"
        />

        {/* Question Card */}
        <Card className="p-8 mb-6 game-surface border-white/10">
          <h2 className="text-3xl font-bold mb-8 text-center text-white">
            {currentQuestion.question}
          </h2>

          {/* Answer Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(currentQuestion.options).map(([key, value]) => (
              <motion.div
                key={key}
                whileHover={!hasAnswered ? { scale: 1.02 } : {}}
                whileTap={!hasAnswered ? { scale: 0.98 } : {}}
              >
                <Card
                  className={`p-6 cursor-pointer transition-all border-white/20 game-surface ${
                    hasAnswered ? 'cursor-not-allowed' : 'hover:shadow-lg hover:border-white/40'
                  } ${getAnswerColor(key)}`}
                  onClick={() => handleAnswerSelect(key)}
                >
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant="outline" 
                      className="text-lg px-3 py-1 bg-white/10 text-white border-white/20"
                    >
                      {key}
                    </Badge>
                    <p className="text-lg flex-1 text-white">{value}</p>
                    
                    {showResult && (
                      <>
                        {key === correctAnswer && (
                          <CheckCircle className="w-6 h-6 game-success" />
                        )}
                        {selectedAnswer === key && !isCorrect && (
                          <XCircle className="w-6 h-6 text-red-500" />
                        )}
                      </>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Answer Status */}
          {hasAnswered && !showResult && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-6"
            >
              <div className="animate-pulse">
                <p className="text-green-400 font-semibold text-lg">
                  ✅ Answer submitted! Waiting for results...
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Selected: <span className="font-bold text-white">{selectedAnswer}</span>
                </p>
              </div>
            </motion.div>
          )}

          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-6"
            >
              {isCorrect ? (
                <div className="game-success">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-2xl font-bold">Correct!</p>
                </div>
              ) : (
                <div className="text-red-500">
                  <XCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-2xl font-bold">Wrong Answer</p>
                  <p className="text-gray-400">
                    The correct answer was {correctAnswer}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </Card>

        {/* Quick Leaderboard */}
        {showResult && leaderboard && (
          <Card className="p-4 game-surface border-white/10">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-white">
              <Trophy className="w-5 h-5" />
              Top Players
            </h3>
            <div className="flex gap-4 overflow-x-auto">
              {leaderboard.players.slice(0, 5).map((entry: any) => (
                <div 
                  key={entry.player.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    entry.player.id === sessionStorage.getItem('playerId')
                      ? 'bg-primary/20 border border-primary/30'
                      : 'bg-white/10 border border-white/20'
                  }`}
                >
                  <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/20">
                    {entry.rank}
                  </Badge>
                  <AnimalAvatar
                    animal={entry.player.animal}
                    customization={entry.player.avatar}
                    size="sm"
                  />
                  <div className="text-sm">
                    <p className="font-medium text-white">{entry.player.name.length > 10 ? entry.player.name.substring(0, 10) + '...' : entry.player.name}</p>
                    <p className="text-gray-300">{entry.player.score}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Gamepad2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GameJoin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gameCode.trim() || !playerName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both game code and your name",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    
    try {
      // Check if game exists
      const response = await apiRequest('GET', `/api/games/code/${gameCode.toUpperCase()}`);
      
      if (response.status === 'playing') {
        toast({
          title: "Game In Progress",
          description: "This game has already started",
          variant: "destructive",
        });
        return;
      }

      // Store player info and navigate to lobby
      sessionStorage.setItem('gameCode', gameCode.toUpperCase());
      sessionStorage.setItem('playerName', playerName);
      sessionStorage.setItem('gameId', response.gameId);
      
      navigate(`/game/${response.gameId}/lobby`);
    } catch (error: any) {
      toast({
        title: "Invalid Game Code",
        description: "Please check the code and try again",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 game-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-xl game-surface border-purple-500/20">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/20 rounded-full mb-4"
            >
              <Gamepad2 className="w-10 h-10 text-purple-500" />
            </motion.div>
            <h1 className="text-3xl font-bold mb-2 text-white">Join Game</h1>
            <p className="text-gray-400">
              Enter the game code from your teacher
            </p>
          </div>

          <form onSubmit={handleJoinGame} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="gameCode" className="text-white">Game Code</Label>
              <Input
                id="gameCode"
                type="text"
                placeholder="ABC123"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest game-surface border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500"
                autoComplete="off"
                autoFocus
              />
              <p className="text-xs text-gray-500 text-center">
                6-character code from your teacher
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="playerName" className="text-white">Your Name</Label>
              <Input
                id="playerName"
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                className="text-xl game-surface border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full hover:shadow-lg hover:shadow-primary/30 transition-all"
              disabled={isChecking || !gameCode.trim() || !playerName.trim()}
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Checking Game...
                </>
              ) : (
                'Join Game'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have a game code?
            </p>
            <p className="text-sm text-gray-500">
              Ask your teacher to start a new game
            </p>
          </div>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-gray-400"
          >
            ← Back to Home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
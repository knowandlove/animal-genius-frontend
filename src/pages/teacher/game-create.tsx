import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Gamepad2, Users, Trophy } from 'lucide-react';

export default function GameCreate() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [gameMode, setGameMode] = useState<'team' | 'individual'>('team');
  const [questionCount, setQuestionCount] = useState([16]);

  const createGameMutation = useMutation({
    mutationFn: async (data: { mode: string; questionCount: number }) => {
      return apiRequest('POST', '/api/games/create', data);
    },
    onSuccess: (data) => {
      // Store WebSocket ticket if provided
      if (data.wsTicket) {
        sessionStorage.setItem('wsTicket', data.wsTicket);
        sessionStorage.setItem('wsTicketGameId', data.gameId);
      }
      
      toast({
        title: "Game Created!",
        description: `Game code: ${data.gameCode}`,
      });
      navigate(`/teacher/game/${data.gameId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create game",
        variant: "destructive",
      });
    },
  });

  const handleCreateGame = () => {
    createGameMutation.mutate({
      mode: gameMode,
      questionCount: questionCount[0],
    });
  };

  return (
    <div className="min-h-screen game-bg p-6">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3 text-white">
            <Gamepad2 className="w-10 h-10 text-purple-400" />
            Create Quiz Game
          </h1>
          <p className="text-gray-400">
            Set up a live quiz game for your students to play together
          </p>
        </div>

        <Card className="p-6 space-y-6 game-surface border-purple-500/20">
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-semibold mb-3 block text-white">Game Mode</Label>
            <RadioGroup value={gameMode} onValueChange={(value) => setGameMode(value as 'team' | 'individual')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 cursor-pointer hover:border-purple-500 transition-colors bg-slate-800/50 border-purple-500/30" 
                      onClick={() => setGameMode('team')}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <RadioGroupItem value="team" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-5 h-5 text-purple-400" />
                        <span className="font-semibold text-white">Team Mode</span>
                      </div>
                      <p className="text-sm text-gray-400">
                        Students with the same animal compete together as a team. 
                        Great for building collaboration!
                      </p>
                    </div>
                  </label>
                </Card>

                <Card className="p-4 cursor-pointer hover:border-purple-500 transition-colors bg-slate-800/50 border-purple-500/30"
                      onClick={() => setGameMode('individual')}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <RadioGroupItem value="individual" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-5 h-5 text-purple-400" />
                        <span className="font-semibold text-white">Individual Mode</span>
                      </div>
                      <p className="text-sm text-gray-400">
                        Every student plays for themselves. 
                        Perfect for individual assessment!
                      </p>
                    </div>
                  </label>
                </Card>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-lg font-semibold text-white">Number of Questions</Label>
            <div className="px-2">
              <Slider
                value={questionCount}
                onValueChange={setQuestionCount}
                min={5}
                max={25}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-2">
                <span>5 questions</span>
                <span className="font-semibold text-lg text-white">{questionCount[0]} questions</span>
                <span>25 questions</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Each question has a 20-second timer
            </p>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => navigate('/teacher/dashboard')}
            className="flex-1 bg-slate-700/50 border-purple-500/30 text-white hover:bg-slate-600/50 hover:text-white hover:border-purple-500/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateGame}
            disabled={createGameMutation.isPending}
            className="flex-1 game-primary-btn"
          >
            {createGameMutation.isPending ? 'Creating...' : 'Create Game'}
          </Button>
        </div>
        </Card>

        <Card className="mt-6 p-6 game-surface border-purple-500/20">
          <h3 className="font-semibold mb-2 text-white">How it works:</h3>
          <ol className="space-y-2 text-sm text-gray-300">
            <li>1. Create your game with your preferred settings</li>
            <li>2. Share the 6-character game code with your students</li>
            <li>3. Students join at <span className="font-mono bg-slate-800 px-1 rounded text-purple-300">/game/join</span></li>
            <li>4. Students pick their animal avatar and customize it</li>
            <li>5. Start the game when everyone has joined</li>
            <li>6. Control the pace as students answer animal facts questions</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
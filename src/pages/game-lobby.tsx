import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimalAvatar } from '@/components/game/AnimalAvatar';
import { AvatarCustomizer } from '@/components/game/AvatarCustomizer';
import { useToast } from '@/hooks/use-toast';
import { gameWebSocket } from '@/lib/websocket';
import { AnimalType, AvatarCustomization, Player } from '@shared/game-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Sparkles, ArrowRight } from 'lucide-react';
import { ConnectionStatusIndicator } from '@/components/connection-status';

const ANIMALS: AnimalType[] = [
  'Meerkat', 'Panda', 'Owl', 'Beaver', 
  'Elephant', 'Otter', 'Parrot', 'Border Collie'
];

export default function GameLobby() {
  const { gameId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [playerName, setPlayerName] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalType | null>(null);
  const [avatarCustomization, setAvatarCustomization] = useState<AvatarCustomization>({});
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [gameMode, setGameMode] = useState<'team' | 'individual'>('team');

  useEffect(() => {
    // Get player info from session storage
    const storedName = sessionStorage.getItem('playerName');
    const storedCode = sessionStorage.getItem('gameCode');
    
    if (!storedName || !storedCode) {
      navigate('/game/join');
      return;
    }
    
    setPlayerName(storedName);

    // Connect to WebSocket
    connectToGame(storedCode, storedName);

    return () => {
      gameWebSocket.disconnect();
    };
  }, [gameId, navigate]);

  const connectToGame = async (gameCode: string, name: string) => {
    try {
      // Disconnect any existing connection first
      gameWebSocket.disconnect();
      
      await gameWebSocket.connect();
      setIsConnected(true);

      // Set up event handlers BEFORE sending join message
      gameWebSocket.on('joined-game', (data) => {
        console.log('🎮 Lobby: joined-game event received:', data);
        setGameMode(data.gameSettings.mode);
        // Store playerId for later use
        sessionStorage.setItem('playerId', data.playerId);
        console.log('🎮 Lobby: stored playerId:', data.playerId);
      });

      gameWebSocket.on('players-sync', (data) => {
        // Sync existing players when joining
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
          description: `Playing as ${newPlayer.animal}`,
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

      gameWebSocket.on('player-avatar-updated', (data) => {
        setPlayers(prev => {
          const updated = new Map(prev);
          const player = updated.get(data.playerId);
          if (player) {
            player.avatar = data.customization;
            updated.set(data.playerId, player);
          }
          return updated;
        });
      });

      // Add missing handlers for animal selection and avatar customization responses
      gameWebSocket.on('animal-selected', (data) => {
        console.log('Animal selection confirmed:', data);
        setSelectedAnimal(data.animal);
      });

      gameWebSocket.on('avatar-customized', (data) => {
        console.log('Avatar customization confirmed:', data);
        setAvatarCustomization(data.customization);
      });

      gameWebSocket.on('game-started', (data) => {
        console.log('🎮 Lobby received game-started, storing data and navigating:', data);
        // Store the game-started data so the game-play page can access it
        sessionStorage.setItem('gameStartedData', JSON.stringify(data));
        navigate(`/game/${gameId}/play`);
      });

      gameWebSocket.on('kicked', (data) => {
        toast({
          title: "Removed from game",
          description: data.reason,
          variant: "destructive",
        });
        navigate('/game/join');
      });

      gameWebSocket.on('player-left', (data) => {
        setPlayers(prev => {
          const updated = new Map(prev);
          updated.delete(data.playerId);
          return updated;
        });
      });

      gameWebSocket.on('error', (data) => {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      });

      // Store game code for potential reconnections
      sessionStorage.setItem('gameCode', gameCode);
      
      // Join the game
      gameWebSocket.send('join-game', { gameCode, playerName: name });
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to game",
        variant: "destructive",
      });
      navigate('/game/join');
    }
  };

  const handleSelectAnimal = (animal: AnimalType) => {
    setSelectedAnimal(animal);
    gameWebSocket.send('select-animal', { animal });
    setShowCustomizer(true);
  };

  const handleSaveAvatar = (customization: AvatarCustomization) => {
    setAvatarCustomization(customization);
    gameWebSocket.send('customize-avatar', { customization });
    gameWebSocket.send('player-ready', {});
    setShowCustomizer(false);
    
    toast({
      title: "Avatar Saved!",
      description: "Waiting for game to start...",
    });
  };

  // Group players by animal for team mode
  const getTeams = () => {
    const teams = new Map<AnimalType, Player[]>();
    players.forEach(player => {
      const team = teams.get(player.animal) || [];
      team.push(player);
      teams.set(player.animal, team);
    });
    return teams;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center game-bg">
        <Card className="p-8 game-surface border-purple-500/20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-lg text-white">Connecting to game...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 game-bg">
      <div className="max-w-7xl mx-auto">
        {/* Connection Status */}
        <div className="flex justify-end mb-4">
          <ConnectionStatusIndicator />
        </div>
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white">Game Lobby</h1>
          <p className="text-gray-300">
            {selectedAnimal ? 'Customize your avatar' : 'Choose your animal'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Users className="w-5 h-5" />
            <span className="font-medium text-white">{players.size} players in lobby</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Animal Selection / Customization */}
          <div className="lg:col-span-2">
            <Card className="p-6 game-surface border-white/10">
              {!showCustomizer ? (
                <>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Choose Your Animal
                  </h2>
                  <div className="grid grid-cols-4 gap-4">
                    {ANIMALS.map((animal) => (
                      <motion.div
                        key={animal}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card
                          className={`p-4 cursor-pointer transition-all border-white/20 game-surface ${
                            selectedAnimal === animal 
                              ? 'border-primary shadow-lg bg-primary/20' 
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => handleSelectAnimal(animal)}
                        >
                          <AnimalAvatar animal={animal} size="md" />
                          <p className="text-center mt-2 text-sm font-medium text-white">
                            {animal}
                          </p>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : selectedAnimal && (
                <AvatarCustomizer
                  animal={selectedAnimal}
                  initialCustomization={avatarCustomization}
                  onSave={handleSaveAvatar}
                  onCancel={() => setShowCustomizer(false)}
                />
              )}
            </Card>
          </div>

          {/* Players List */}
          <div>
            <Card className="p-6 game-surface border-white/10">
              <h2 className="text-xl font-semibold mb-4 text-white">
                {gameMode === 'team' ? 'Teams' : 'Players'}
              </h2>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {gameMode === 'team' ? (
                  // Team view
                  Array.from(getTeams().entries()).map(([animal, teamPlayers]) => (
                    <div key={animal} className="space-y-2">
                      <h3 className="font-medium text-sm text-gray-300">
                        Team {animal} ({teamPlayers.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {teamPlayers.map(player => (
                          <div key={player.id} className="flex items-center gap-2">
                            <AnimalAvatar 
                              animal={player.animal}
                              customization={player.avatar}
                              size="sm"
                            />
                            <span className="text-sm truncate text-white">{player.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Individual view
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from(players.values()).map(player => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2"
                      >
                        <AnimalAvatar 
                          animal={player.animal}
                          customization={player.avatar}
                          size="sm"
                        />
                        <span className="text-sm truncate text-white">{player.name}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {selectedAnimal && !showCustomizer && (
                <div className="mt-6">
                  <Button
                    className="w-full bg-white/10 border-white/20 text-white"
                    disabled
                  >
                    Waiting for teacher to start...
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-6 p-4 game-surface border-white/10">
          <div className="flex items-start gap-3">
            <ArrowRight className="w-5 h-5 mt-0.5 text-purple-400" />
            <div>
              <p className="font-medium text-white">How to play:</p>
              <ol className="text-sm text-gray-300 mt-1 space-y-1">
                <li>1. Choose your animal avatar</li>
                <li>2. Customize it with accessories</li>
                <li>3. Wait for your teacher to start the game</li>
                <li>4. Answer questions as fast as you can!</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
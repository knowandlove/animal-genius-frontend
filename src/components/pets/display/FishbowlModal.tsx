import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, Utensils, Gamepad2, Coins, Trophy } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { StudentPet } from '@/types/pet';
import FishBowl from '@/components/pets/animations/FishBowl';
import RiveBubbleGame from '@/components/pets/games/fish/RiveBubbleGame';

interface FishbowlModalProps {
  open: boolean;
  onClose: () => void;
  pet: StudentPet;
  canInteract: boolean;
  balance: number;
  passportCode: string;
  classId?: string;
}

export default function FishbowlModal({
  open,
  onClose,
  pet,
  canInteract,
  balance,
  passportCode,
  classId
}: FishbowlModalProps) {
  const queryClient = useQueryClient();
  const [interactionMessage, setInteractionMessage] = useState<string | null>(null);
  const [showGame, setShowGame] = useState(false);
  const [happinessBonus, setHappinessBonus] = useState<number | null>(null);
  
  // Calculate current stats
  const stats = pet.calculatedStats || { hunger: pet.hunger, happiness: pet.happiness };
  
  // Interaction mutation
  const interactMutation = useMutation({
    mutationFn: async (type: 'feed' | 'play') => {
      return apiRequest('POST', `/api/pets/${pet.id}/interact`, {
        interactionType: type,
      });
    },
    onSuccess: (data, type) => {
      // Show success message
      const messages = {
        feed: '🐟 Your fish enjoyed the food!',
        play: '🎾 Your fish is happy you played!'
      };
      
      setInteractionMessage(messages[type]);
      setTimeout(() => setInteractionMessage(null), 3000);
      
      // Refresh data
      queryClient.invalidateQueries({ 
        queryKey: [`/api/room-page-data/${passportCode}`] 
      });
    },
    onError: (error: any) => {
      setInteractionMessage(`❌ ${error.message || 'Failed to interact'}`);
      setTimeout(() => setInteractionMessage(null), 3000);
    }
  });

  // Show happiness bonus message after game completes
  useEffect(() => {
    if (happinessBonus !== null && !showGame) {
      const timer = setTimeout(() => {
        setHappinessBonus(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [happinessBonus, showGame]);

  // If showing the game, render a lightweight overlay instead of Dialog
  if (open && showGame) {
    return createPortal(
      <AnimatePresence>
        <motion.div 
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 9999 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            style={{ zIndex: -1 }}
            onClick={() => setShowGame(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Game Container */}
          <motion.div 
            className="relative z-10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowGame(false)}
              className="absolute top-0 right-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all z-20"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            
            {/* Game without background container */}
            <RiveBubbleGame 
              passportCode={passportCode}
              classId={classId}
              onGameComplete={(score) => {
                // Award happiness based on score
                if (score > 0) {
                  const bonus = Math.min(20, Math.floor(score / 5));
                  setHappinessBonus(bonus);
                  interactMutation.mutate('play');
                }
                setShowGame(false);
              }}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        
        <div className="grid grid-cols-2 gap-6 pt-4">
          {/* Left side - Interaction Panel */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <h2 className="text-2xl font-bold">{pet.customName}</h2>
              <p className="text-sm text-muted-foreground">
                Your aquatic friend
              </p>
            </div>
          
            {/* Stats */}
            <Card className="p-4 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-orange-500" />
                    Hunger
                  </span>
                  <span className="font-medium">{Math.round(stats.hunger)}%</span>
                </div>
                <Progress 
                  value={stats.hunger} 
                  className="h-2"
                  indicatorClassName={stats.hunger > 70 ? "bg-green-500" : stats.hunger > 30 ? "bg-yellow-500" : "bg-red-500"}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-pink-500" />
                    Happiness
                  </span>
                  <span className="font-medium">{Math.round(stats.happiness)}%</span>
                </div>
                <Progress 
                  value={stats.happiness} 
                  className="h-2"
                  indicatorClassName={stats.happiness > 70 ? "bg-pink-500" : stats.happiness > 30 ? "bg-yellow-500" : "bg-gray-500"}
                />
              </div>
            </Card>
            
            {/* Interaction Buttons */}
            <div className="flex gap-3">
              <Button
                className="flex-1"
                disabled={!canInteract || balance < 5 || interactMutation.isPending}
                onClick={() => interactMutation.mutate('feed')}
              >
                <Utensils className="w-4 h-4 mr-2" />
                Feed Fish
                <span className="ml-2 flex items-center gap-1 text-xs">
                  <Coins className="w-3 h-3" />5
                </span>
              </Button>
              
              <Button
                className="flex-1"
                variant="outline"
                disabled={!canInteract || interactMutation.isPending}
                onClick={() => setShowGame(true)}
              >
                <Gamepad2 className="w-4 h-4 mr-2" />
                Play with Fish
              </Button>
            </div>
            
            {/* Messages */}
            <AnimatePresence>
              {(interactionMessage || happinessBonus !== null) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center"
                >
                  <p className="text-sm font-medium">
                    {happinessBonus !== null 
                      ? `🎉 Your fish gained ${happinessBonus} happiness from playing!`
                      : interactionMessage
                    }
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Right side - Zoomed Fishbowl */}
          <div className="relative bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl p-8 flex items-center justify-center">
            {/* Rive fish animation */}
            <div className="scale-150">
              <FishBowl 
                happiness={stats.happiness} 
                hunger={stats.hunger} 
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, Utensils, Gamepad2, Coins } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { StudentPet } from '@/types/pet';
import FishBowl from '@/components/pets/FishBowl';

interface FishbowlModalProps {
  open: boolean;
  onClose: () => void;
  pet: StudentPet;
  canInteract: boolean;
  balance: number;
  passportCode: string;
}

export default function FishbowlModal({
  open,
  onClose,
  pet,
  canInteract,
  balance,
  passportCode
}: FishbowlModalProps) {
  const queryClient = useQueryClient();
  const [interactionMessage, setInteractionMessage] = useState<string | null>(null);
  
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
                onClick={() => interactMutation.mutate('play')}
              >
                <Gamepad2 className="w-4 h-4 mr-2" />
                Play with Fish
              </Button>
            </div>
            
            {/* Messages */}
            <AnimatePresence>
              {interactionMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center"
                >
                  <p className="text-sm font-medium">{interactionMessage}</p>
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
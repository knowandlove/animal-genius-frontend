import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useRoomStore } from '@/stores/roomStore';
import type { StudentPet, PetInteractionType } from '@/types/pet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Heart, Pizza, Gamepad2, Hand, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PetCarePanelProps {
  pet: StudentPet;
  passportCode: string;
  isOpen: boolean;
  onToggle: () => void;
}

export default function PetCarePanel({ pet, passportCode, isOpen, onToggle }: PetCarePanelProps) {
  const queryClient = useQueryClient();
  const [interactionMessage, setInteractionMessage] = React.useState<string | null>(null);
  
  const updatePetStats = useRoomStore((state) => state.updatePetStats);

  // Pet interaction mutation
  const interactMutation = useMutation({
    mutationFn: async (type: PetInteractionType) => {
      return apiRequest('POST', `/api/pets/${pet.id}/interact`, {
        interactionType: type,
      });
    },
    onSuccess: (data, type) => {
      // Update local pet stats
      if (data.newStats) {
        updatePetStats(data.newStats);
      }
      
      // Show interaction feedback
      const messages = {
        feed: '🍕 Yum! Your pet is less hungry!',
        play: '🎮 Your pet had fun playing!',
        pet: '💖 Your pet feels loved!'
      };
      setInteractionMessage(messages[type]);
      setTimeout(() => setInteractionMessage(null), 3000);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/room-page-data/${passportCode}`] });
    },
    onError: (error: any) => {
      setInteractionMessage(`❌ ${error.message || 'Failed to interact with pet'}`);
      setTimeout(() => setInteractionMessage(null), 3000);
    }
  });

  const stats = pet.calculatedStats || { hunger: pet.hunger, happiness: pet.happiness };

  return (
    <>
      {/* Collapsed Tab */}
      <motion.button
        className="fixed left-0 top-1/2 -translate-y-1/2 w-4 h-16 flex items-center justify-center hover:w-5 transition-all rounded-r-lg shadow-md z-40 text-white"
        style={{
          backgroundColor: '#ea580c', // orange-600
          opacity: 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#c2410c'; // orange-700
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ea580c'; // orange-600
        }}
        onClick={onToggle}
        animate={{ x: isOpen ? -300 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <ChevronRight className="w-3 h-3" />
      </motion.button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed left-0 top-1/2 -translate-y-1/2 z-50"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="bg-white rounded-r-lg shadow-xl p-4 w-72 relative">
              {/* Close Button */}
              <button
                onClick={onToggle}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center pb-3 border-b border-gray-200">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">🐾</span>
                  <h3 className="text-xl font-bold text-gray-800">Pet Care</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">{pet.customName}</p>
              </div>
              
              {/* Stats */}
              <div className="space-y-3 mt-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pizza className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Hunger</span>
                    </div>
                    <span className="text-sm font-bold">{Math.round(stats.hunger)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stats.hunger}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-500" />
                      <span className="text-sm font-medium">Happiness</span>
                    </div>
                    <span className="text-sm font-bold">{Math.round(stats.happiness)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stats.happiness}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Interaction Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => interactMutation.mutate('feed')}
                  disabled={interactMutation.isPending}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Pizza className="w-4 h-4" />
                  <span className="text-xs">Feed</span>
                  <Badge variant="secondary" className="text-[10px] px-1">
                    <Coins className="w-2 h-2" />5
                  </Badge>
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => interactMutation.mutate('play')}
                  disabled={interactMutation.isPending}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span className="text-xs">Play</span>
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => interactMutation.mutate('pet')}
                  disabled={interactMutation.isPending}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Hand className="w-4 h-4" />
                  <span className="text-xs">Pet</span>
                </Button>
              </div>

              {/* Interaction Message */}
              <AnimatePresence>
                {interactionMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-3 text-center"
                  >
                    <p className="text-sm font-medium text-gray-700 bg-gray-100 rounded-full px-3 py-1">
                      {interactionMessage}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
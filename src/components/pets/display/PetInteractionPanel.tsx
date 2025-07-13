import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  Utensils, 
  Gamepad2, 
  Hand,
  Coins,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import type { StudentPet } from '@/types/pet';
import { cn } from '@/lib/utils';

interface PetInteractionPanelProps {
  pet: StudentPet;
  canInteract: boolean;
  balance: number;
  passportCode: string;
}

export default function PetInteractionPanel({ 
  pet, 
  canInteract, 
  balance,
  passportCode 
}: PetInteractionPanelProps) {
  const queryClient = useQueryClient();
  const [activeInteraction, setActiveInteraction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Calculate current stats
  const stats = pet.calculatedStats || { hunger: pet.hunger, happiness: pet.happiness };
  
  // Determine pet mood
  const getMood = () => {
    const avg = (stats.hunger + stats.happiness) / 2;
    if (avg >= 80) return { text: 'Ecstatic', color: 'text-green-600', emoji: '😍' };
    if (avg >= 60) return { text: 'Happy', color: 'text-green-500', emoji: '😊' };
    if (avg >= 40) return { text: 'Content', color: 'text-yellow-500', emoji: '😐' };
    if (avg >= 20) return { text: 'Sad', color: 'text-orange-500', emoji: '😢' };
    return { text: 'Depressed', color: 'text-red-500', emoji: '😭' };
  };

  const mood = getMood();

  // Interaction mutation
  const interactMutation = useMutation({
    mutationFn: async ({ 
      interactionType 
    }: { 
      interactionType: 'feed' | 'play' | 'pet' 
    }) => {
      return apiRequest('POST', `/api/pets/${pet.id}/interact`, {
        interactionType,
      });
    },
    onMutate: ({ interactionType }) => {
      setActiveInteraction(interactionType);
    },
    onSuccess: (data, { interactionType }) => {
      // Update local stats optimistically
      if (data.newStats) {
        // The parent will handle updating the pet state
        queryClient.invalidateQueries({ 
          queryKey: [`/api/room-page-data/${passportCode}`] 
        });
      }
      
      // Show success message
      const messages = {
        feed: `🍖 ${pet.customName} enjoyed the meal!`,
        play: `🎾 ${pet.customName} had fun playing!`,
        pet: `💕 ${pet.customName} loves the attention!`
      };
      
      setMessage(messages[interactionType]);
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any, { interactionType }) => {
      const errorMessage = error.message || 'Interaction failed';
      setMessage(`❌ ${errorMessage}`);
      setTimeout(() => setMessage(null), 3000);
    },
    onSettled: () => {
      setActiveInteraction(null);
    }
  });

  const StatBar = ({ 
    label, 
    value, 
    icon, 
    color 
  }: { 
    label: string; 
    value: number; 
    icon: React.ReactNode;
    color: string;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-medium">{Math.round(value)}%</span>
      </div>
      <Progress 
        value={value} 
        className="h-2"
        indicatorClassName={cn(
          "transition-all",
          color
        )}
      />
    </div>
  );

  const InteractionButton = ({ 
    type, 
    icon, 
    label, 
    cost, 
    disabled 
  }: { 
    type: 'feed' | 'play' | 'pet';
    icon: React.ReactNode;
    label: string;
    cost: number;
    disabled?: boolean;
  }) => (
    <Button
      size="sm"
      variant="outline"
      disabled={!canInteract || disabled || balance < cost || interactMutation.isPending}
      onClick={() => interactMutation.mutate({ interactionType: type })}
      className={cn(
        "flex-1 h-auto py-2 px-3 flex flex-col items-center gap-1",
        activeInteraction === type && "ring-2 ring-primary"
      )}
    >
      <motion.div
        animate={activeInteraction === type ? {
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0]
        } : {}}
        transition={{ duration: 0.5 }}
      >
        {icon}
      </motion.div>
      <span className="text-xs">{label}</span>
      {cost > 0 && (
        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
          <Coins className="w-3 h-3" />
          {cost}
        </span>
      )}
    </Button>
  );

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4 space-y-4">
        {/* Pet Name and Mood */}
        <div className="text-center space-y-1">
          <h3 className="font-semibold text-lg">{pet.customName}</h3>
          <div className={cn("flex items-center justify-center gap-2", mood.color)}>
            <span className="text-2xl">{mood.emoji}</span>
            <span className="text-sm font-medium">{mood.text}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <StatBar 
            label="Hunger" 
            value={stats.hunger} 
            icon={<Utensils className="w-4 h-4" />}
            color={stats.hunger > 70 ? "bg-green-500" : stats.hunger > 30 ? "bg-yellow-500" : "bg-red-500"}
          />
          <StatBar 
            label="Happiness" 
            value={stats.happiness} 
            icon={<Heart className="w-4 h-4" />}
            color={stats.happiness > 70 ? "bg-pink-500" : stats.happiness > 30 ? "bg-yellow-500" : "bg-gray-500"}
          />
        </div>

        {/* Interaction Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <InteractionButton 
            type="feed"
            icon={<Utensils className="w-5 h-5" />}
            label="Feed"
            cost={5}
            disabled={stats.hunger > 90}
          />
          <InteractionButton 
            type="play"
            icon={<Gamepad2 className="w-5 h-5" />}
            label="Play"
            cost={0}
            disabled={false}
          />
          <InteractionButton 
            type="pet"
            icon={<Hand className="w-5 h-5" />}
            label="Pet"
            cost={0}
            disabled={false}
          />
        </div>

        {/* Messages */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center"
            >
              <p className="text-sm font-medium flex items-center justify-center gap-1">
                {message.includes('❌') ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                )}
                {message}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Balance Warning */}
        {balance < 5 && canInteract && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
            <p className="text-xs text-orange-700 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Low balance! You need coins to feed {pet.customName}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
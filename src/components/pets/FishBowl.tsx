import React, { useEffect } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

interface FishBowlProps {
  happiness?: number;
  hunger?: number;
}

export default function FishBowl({ happiness = 80, hunger = 80 }: FishBowlProps) {
  const fishUrl = 'https://zqyvfnbwpagguutzdvpy.supabase.co/storage/v1/object/public/store-items/pets/fish.riv';
  
  const { rive, RiveComponent } = useRive({
    src: fishUrl,
    stateMachines: 'FishController',
    autoplay: true,
  });

  // Get the happiness input from your state machine
  const happinessInput = useStateMachineInput(rive, 'FishController', 'happiness');

  // Update happiness when it changes
  useEffect(() => {
    if (happinessInput) {
      happinessInput.value = happiness;
    }
  }, [happiness, happinessInput]);

  return (
    <div className="relative inline-block">
      <div className="w-48 h-48">
        <RiveComponent className="w-full h-full" />
      </div>
    </div>
  );
}

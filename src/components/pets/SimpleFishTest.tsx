import React from 'react';
import { useRive } from '@rive-app/react-canvas';

interface SimpleFishTestProps {
  happiness?: number;
  hunger?: number;
}

export default function SimpleFishTest({ happiness = 80, hunger = 80 }: SimpleFishTestProps) {
  const fishUrl = 'https://zqyvfnbwpagguutzdvpy.supabase.co/storage/v1/object/public/store-items/pets/fish.riv';
  
  const { RiveComponent } = useRive({
    src: fishUrl,
    animations: 'idle', // Use animation directly, not state machine
    autoplay: true,
    onLoad: () => {
      console.log('✅ Fish animation loaded and playing!');
    }
  });

  return (
    <div className="relative w-48 h-48 bg-blue-100 rounded-full overflow-hidden shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-200/20" />
      <div className="absolute inset-4">
        <RiveComponent />
      </div>
      <div className="absolute top-2 left-2 w-12 h-20 bg-white/20 rounded-full blur-xl" />
    </div>
  );
}

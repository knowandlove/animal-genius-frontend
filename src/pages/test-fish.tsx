import React, { useState } from 'react';
import FishBowl from '@/components/pets/FishBowl';
import SimpleFishTest from '@/components/pets/SimpleFishTest';
import { Slider } from '@/components/ui/slider';

export default function TestFish() {
  const [happiness, setHappiness] = useState(80);
  const [hunger, setHunger] = useState(80);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Fish Test Page</h1>
        
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* State Machine Version */}
          <div>
            <h2 className="text-lg font-semibold mb-4">With State Machine</h2>
            <div className="flex justify-center">
              <FishBowl happiness={happiness} hunger={hunger} />
            </div>
          </div>
          
          {/* Direct Animation Version */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Direct Animation</h2>
            <div className="flex justify-center">
              <SimpleFishTest happiness={happiness} hunger={hunger} />
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Fish Stats</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Happiness: {happiness}
              </label>
              <Slider
                value={[happiness]}
                onValueChange={([value]) => setHappiness(value)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Hunger: {hunger}
              </label>
              <Slider
                value={[hunger]}
                onValueChange={([value]) => setHunger(value)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Simple avatar component without Phaser for now
function SimpleAvatar({ animalType, items }: { animalType: string; items: any }) {
  const [bouncing, setBouncing] = useState(false);

  const handleClick = () => {
    setBouncing(true);
    setTimeout(() => setBouncing(false), 600);
  };

  const animalEmojis: Record<string, string> = {
    beaver: '🦫',
    dolphin: '🐬',
    elephant: '🐘',
    owl: '🦉',
    cheetah: '🐆',
    otter: '🦦',
    parrot: '🦜',
    'border collie': '🐕',
  };

  return (
    <div 
      className={`relative flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 rounded-lg border-2 border-gray-300 cursor-pointer transition-transform ${bouncing ? 'animate-bounce' : ''}`}
      style={{ width: 400, height: 400 }}
      onClick={handleClick}
    >
      <div className="text-center">
        <div className="text-8xl mb-4">
          {animalEmojis[animalType] || '🐾'}
        </div>
        <div className="text-lg font-medium text-gray-700 mb-2">
          {animalType.charAt(0).toUpperCase() + animalType.slice(1)}
        </div>
        <div className="flex flex-col gap-1">
          {items.hat && <div className="text-sm">🎩 {items.hat}</div>}
          {items.glasses && <div className="text-sm">👓 {items.glasses}</div>}
          {items.accessory && <div className="text-sm">🎀 {items.accessory}</div>}
        </div>
      </div>
    </div>
  );
}

export default function AvatarTestSimple() {
  const [equipped, setEquipped] = useState({
    hat: '',
    glasses: '',
    accessory: ''
  });

  const toggleItem = (slot: string, item: string) => {
    setEquipped(prev => ({
      ...prev,
      [slot]: prev[slot as keyof typeof prev] === item ? '' : item
    }));
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Avatar Customizer (Simple Version)</h1>
      
      <div className="grid grid-cols-2 gap-8">
        {/* Avatar Display */}
        <Card>
          <CardHeader>
            <CardTitle>Your Avatar</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <SimpleAvatar animalType="beaver" items={equipped} />
          </CardContent>
        </Card>

        {/* Item Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Customize</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Hats */}
              <div>
                <h3 className="font-bold mb-2">Hats</h3>
                <div className="flex gap-2">
                  <Button
                    variant={equipped.hat === 'Wizard Hat' ? 'default' : 'outline'}
                    onClick={() => toggleItem('hat', 'Wizard Hat')}
                  >
                    Wizard Hat
                  </Button>
                  <Button
                    variant={equipped.hat === 'Crown' ? 'default' : 'outline'}
                    onClick={() => toggleItem('hat', 'Crown')}
                  >
                    Crown
                  </Button>
                  <Button
                    variant={equipped.hat === 'Cap' ? 'default' : 'outline'}
                    onClick={() => toggleItem('hat', 'Cap')}
                  >
                    Cap
                  </Button>
                </div>
              </div>

              {/* Glasses */}
              <div>
                <h3 className="font-bold mb-2">Glasses</h3>
                <div className="flex gap-2">
                  <Button
                    variant={equipped.glasses === 'Smart Glasses' ? 'default' : 'outline'}
                    onClick={() => toggleItem('glasses', 'Smart Glasses')}
                  >
                    Smart Glasses
                  </Button>
                  <Button
                    variant={equipped.glasses === 'Sunglasses' ? 'default' : 'outline'}
                    onClick={() => toggleItem('glasses', 'Sunglasses')}
                  >
                    Sunglasses
                  </Button>
                </div>
              </div>

              {/* Accessories */}
              <div>
                <h3 className="font-bold mb-2">Accessories</h3>
                <div className="flex gap-2">
                  <Button
                    variant={equipped.accessory === 'Bow Tie' ? 'default' : 'outline'}
                    onClick={() => toggleItem('accessory', 'Bow Tie')}
                  >
                    Bow Tie
                  </Button>
                  <Button
                    variant={equipped.accessory === 'Necklace' ? 'default' : 'outline'}
                    onClick={() => toggleItem('accessory', 'Necklace')}
                  >
                    Necklace
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-100 rounded">
              <p className="text-sm font-semibold text-yellow-800 mb-2">
                ⚠️ Simple Version (No Phaser)
              </p>
              <p className="text-sm text-yellow-700">
                This is a simplified version without Phaser to avoid crashes. 
                We'll work on getting the full PNG-based system working once the app is stable!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

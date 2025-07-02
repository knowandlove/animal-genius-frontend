import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import LayeredAvatar from '@/components/avatar-v2/LayeredAvatar';

// Store items - updated to match your actual images
const storeItems = {
  hats: [
    { id: 'explorer', name: 'Explorer Hat', price: 100, rarity: 'Common' },
    { id: 'safari', name: 'Safari Hat', price: 150, rarity: 'Uncommon' },
  ],
  glasses: [
    { id: 'greenblinds', name: 'Green Shades', price: 75, rarity: 'Common' },
    { id: 'hearts', name: 'Heart Glasses', price: 150, rarity: 'Uncommon' },
  ],
  accessories: [
    { id: 'bow_tie', name: 'Fancy Bow Tie', price: 100, rarity: 'Common' },
    { id: 'necklace', name: 'Gold Necklace', price: 300, rarity: 'Uncommon' },
  ],
};

const animals = [
  'beaver', 'panda', 'elephant', 'owl', 
  'meerkat', 'otter', 'parrot', 'border collie'
];

export default function AvatarTestV2() {
  const [selectedAnimal, setSelectedAnimal] = useState('beaver');
  const [equipped, setEquipped] = useState<Record<string, string>>({
    hat: '',
    glasses: '',
    accessory: ''
  });

  const toggleItem = (slot: string, itemId: string) => {
    setEquipped(prev => ({
      ...prev,
      [slot]: prev[slot] === itemId ? '' : itemId
    }));
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'bg-gray-100 text-gray-800';
      case 'Uncommon': return 'bg-green-100 text-green-800';
      case 'Rare': return 'bg-blue-100 text-blue-800';
      case 'Epic': return 'bg-purple-100 text-purple-800';
      case 'Legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Avatar System V2</h1>
        <p className="text-gray-600">Lightweight CSS-based avatar system - no heavy game engines!</p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Avatar Display */}
        <Card>
          <CardHeader>
            <CardTitle>Your Avatar</CardTitle>
            <CardDescription>Click your avatar to make it bounce!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-6">
              {/* Avatar */}
              <LayeredAvatar
                animalType={selectedAnimal}
                items={equipped}
                width={350}
                height={350}
              />
              
              {/* Animal Selector */}
              <div className="w-full">
                <h3 className="text-sm font-medium mb-3">Choose Your Animal</h3>
                <div className="grid grid-cols-4 gap-2">
                  {animals.map(animal => (
                    <Button
                      key={animal}
                      variant={selectedAnimal === animal ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedAnimal(animal)}
                      className="capitalize"
                    >
                      {animal}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Item Store */}
        <Card>
          <CardHeader>
            <CardTitle>Customize Your Look</CardTitle>
            <CardDescription>Choose items to equip on your avatar</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hats" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="hats">Hats</TabsTrigger>
                <TabsTrigger value="glasses">Glasses</TabsTrigger>
                <TabsTrigger value="accessories">Accessories</TabsTrigger>
              </TabsList>
              
              <TabsContent value="hats" className="space-y-3">
                {storeItems.hats.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors",
                      equipped.hat === item.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                    )}
                    onClick={() => toggleItem('hat', item.id)}
                  >
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">{item.price} coins</span>
                        <Badge variant="secondary" className={getRarityColor(item.rarity)}>
                          {item.rarity}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant={equipped.hat === item.id ? 'default' : 'outline'}
                      size="sm"
                    >
                      {equipped.hat === item.id ? 'Equipped' : 'Equip'}
                    </Button>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="glasses" className="space-y-3">
                {storeItems.glasses.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors",
                      equipped.glasses === item.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                    )}
                    onClick={() => toggleItem('glasses', item.id)}
                  >
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">{item.price} coins</span>
                        <Badge variant="secondary" className={getRarityColor(item.rarity)}>
                          {item.rarity}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant={equipped.glasses === item.id ? 'default' : 'outline'}
                      size="sm"
                    >
                      {equipped.glasses === item.id ? 'Equipped' : 'Equip'}
                    </Button>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="accessories" className="space-y-3">
                {storeItems.accessories.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors",
                      equipped.accessory === item.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                    )}
                    onClick={() => toggleItem('accessory', item.id)}
                  >
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">{item.price} coins</span>
                        <Badge variant="secondary" className={getRarityColor(item.rarity)}>
                          {item.rarity}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant={equipped.accessory === item.id ? 'default' : 'outline'}
                      size="sm"
                    >
                      {equipped.accessory === item.id ? 'Equipped' : 'Equip'}
                    </Button>
                  </div>
                ))}
              </TabsContent>
            </Tabs>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">✨ CSS-Based System</h4>
              <p className="text-sm text-green-700">
                This version uses lightweight CSS positioning instead of a game engine. 
                Much better performance and no crashes!
              </p>
              <p className="text-sm text-green-700 mt-2">
                Next steps: Add PNG images for each animal and item to replace the emoji placeholders.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function (should import from utils but adding here for simplicity)
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

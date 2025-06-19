import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ANIMAL_CONFIGS } from '@/config/animal-sizing';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download, RefreshCw } from 'lucide-react';

// The 8 animals
const ANIMALS = [
  { id: 'meerkat', name: 'Meerkat', emoji: '🦫' },
  { id: 'panda', name: 'Panda', emoji: '🐼' },
  { id: 'owl', name: 'Owl', emoji: '🦉' },
  { id: 'beaver', name: 'Beaver', emoji: '🦫' },
  { id: 'elephant', name: 'Elephant', emoji: '🐘' },
  { id: 'otter', name: 'Otter', emoji: '🦦' },
  { id: 'parrot', name: 'Parrot', emoji: '🦜' },
  { id: 'border-collie', name: 'Border Collie', emoji: '🐕' }
];

export default function AnimalSizer() {
  const [selectedAnimal, setSelectedAnimal] = useState('meerkat');
  const [configs, setConfigs] = useState(ANIMAL_CONFIGS);
  const [showComparison, setShowComparison] = useState(false);

  const currentConfig = configs[selectedAnimal] || {
    displayName: selectedAnimal,
    baseScale: 1.0,
    itemScale: 1.0,
    anchors: {
      hat: { x: 50, y: 20 },
      glasses: { x: 50, y: 35 },
      accessory: { x: 50, y: 60 }
    }
  };

  const updateConfig = (field: string, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [selectedAnimal]: {
        ...prev[selectedAnimal],
        [field]: value
      }
    }));
  };

  const exportConfig = () => {
    const configString = `export const ANIMAL_CONFIGS = ${JSON.stringify(configs, null, 2)};`;
    navigator.clipboard.writeText(configString);
    alert('Configuration copied to clipboard!');
  };

  const resetToDefaults = () => {
    if (confirm('Reset all configurations to defaults?')) {
      setConfigs(ANIMAL_CONFIGS);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">Animal Size Configuration</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Configure how each animal displays and scales items
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={resetToDefaults} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset All
                </Button>
                <Button onClick={exportConfig}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Config
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Animal Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Animal Selector */}
              <Tabs value={selectedAnimal} onValueChange={setSelectedAnimal}>
                <TabsList className="grid grid-cols-4 gap-1">
                  {ANIMALS.map(animal => (
                    <TabsTrigger 
                      key={animal.id} 
                      value={animal.id}
                      className="data-[state=active]:bg-purple-100"
                    >
                      <span className="text-lg">{animal.emoji}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="space-y-4">
                {/* Base Scale */}
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Base Scale (Animal Size)</Label>
                    <Input
                      type="number"
                      value={currentConfig.baseScale.toFixed(2)}
                      onChange={(e) => updateConfig('baseScale', parseFloat(e.target.value) || 1)}
                      className="w-20 h-8 text-sm"
                      step={0.05}
                      min={0.5}
                      max={2.0}
                    />
                  </div>
                  <Slider
                    value={[currentConfig.baseScale * 100]}
                    onValueChange={([v]) => updateConfig('baseScale', v / 100)}
                    min={50}
                    max={200}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Scales the animal to fit the standard container
                  </p>
                </div>

                {/* Item Scale */}
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Item Scale (Accessory Size)</Label>
                    <Input
                      type="number"
                      value={currentConfig.itemScale.toFixed(2)}
                      onChange={(e) => updateConfig('itemScale', parseFloat(e.target.value) || 1)}
                      className="w-20 h-8 text-sm"
                      step={0.05}
                    />
                  </div>
                  <Slider
                    value={[currentConfig.itemScale * 100]}
                    onValueChange={([v]) => updateConfig('itemScale', v / 100)}
                    min={50}
                    max={150}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Adjusts item sizes relative to this animal
                  </p>
                </div>
              </div>

              {/* Size Comparison Toggle */}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => setShowComparison(!showComparison)}
                  variant="outline"
                  className="w-full"
                >
                  {showComparison ? 'Hide' : 'Show'} Size Comparison
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {!showComparison ? (
                /* Single Animal Preview */
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-8 min-h-[400px] flex items-center justify-center">
                  <div className="relative" style={{ width: 300, height: 300 }}>
                    <div 
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        transform: `scale(${currentConfig.baseScale})`,
                      }}
                    >
                      <img
                        src={`/avatars/animals/${selectedAnimal === 'border-collie' ? 'collie' : selectedAnimal}.png`}
                        alt={selectedAnimal}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          // Fallback to emoji
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const emoji = document.createElement('div');
                          emoji.textContent = ANIMALS.find(a => a.id === selectedAnimal)?.emoji || '🐾';
                          emoji.className = 'text-8xl';
                          target.parentElement?.appendChild(emoji);
                        }}
                      />
                    </div>
                    
                    {/* Sample hat to show item scaling */}
                    <div
                      className="absolute"
                      style={{
                        top: '20%',
                        left: '50%',
                        transform: `translate(-50%, -50%) scale(${currentConfig.itemScale})`,
                        opacity: 0.7,
                      }}
                    >
                      <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        HAT
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Size Comparison View */
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-4 min-h-[400px]">
                  <div className="grid grid-cols-4 gap-2">
                    {ANIMALS.map(animal => {
                      const config = configs[animal.id] || { baseScale: 1, itemScale: 1 };
                      return (
                        <div key={animal.id} className="text-center">
                          <div 
                            className="relative bg-white rounded-lg p-2 h-24 flex items-center justify-center"
                            style={{ overflow: 'hidden' }}
                          >
                            <div
                              style={{
                                transform: `scale(${config.baseScale * 0.5})`, // Smaller for grid
                              }}
                            >
                              <span className="text-4xl">{animal.emoji}</span>
                            </div>
                          </div>
                          <p className="text-xs mt-1">{animal.name}</p>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {config.baseScale.toFixed(2)}x
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Info Panel */}
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <h4 className="font-semibold mb-2">Quick Guide:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• <strong>Base Scale:</strong> Makes the animal bigger/smaller in the container</li>
                  <li>• <strong>Item Scale:</strong> Makes accessories bigger/smaller on this animal</li>
                  <li>• Smaller animals (meerkat) need smaller accessories</li>
                  <li>• Larger animals (elephant) need bigger accessories</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Size Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Size Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Small Animals</h4>
                <p className="text-sm text-green-700">Meerkat, Otter</p>
                <div className="mt-2 space-y-1 text-xs">
                  <div>Base Scale: 1.1-1.2</div>
                  <div>Item Scale: 0.8-0.85</div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Medium Animals</h4>
                <p className="text-sm text-blue-700">Owl, Beaver, Parrot, Border Collie</p>
                <div className="mt-2 space-y-1 text-xs">
                  <div>Base Scale: 0.95-1.05</div>
                  <div>Item Scale: 0.9-1.0</div>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">Large Animals</h4>
                <p className="text-sm text-purple-700">Panda, Elephant</p>
                <div className="mt-2 space-y-1 text-xs">
                  <div>Base Scale: 0.85-0.95</div>
                  <div>Item Scale: 1.1-1.2</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

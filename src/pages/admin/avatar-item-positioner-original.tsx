import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LayeredAvatar from '@/components/avatar-v2/LayeredAvatar';
import { STORE_CATALOG } from '@shared/currency-types';
import { Save, Copy, RotateCw, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';

// The 8 animals in our system
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

// Filter only avatar items (no room furniture)
const AVATAR_ITEMS = STORE_CATALOG.filter(item => 
  item.type === 'avatar_hat' || item.type === 'avatar_accessory'
);

type PositionData = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

export default function AvatarItemPositioner() {
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedAnimal, setSelectedAnimal] = useState<string>('meerkat');
  const [positions, setPositions] = useState<Record<string, Record<string, PositionData>>>({});
  const [currentPosition, setCurrentPosition] = useState<PositionData>({
    x: 50, // Changed to percentage (50% = center)
    y: 50, // Changed to percentage (50% = center)
    scale: 0.5, // Changed to match LayeredAvatar scale
    rotation: 0
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showExport, setShowExport] = useState(false);

  // Load positions from backend when component mounts
  useEffect(() => {
    loadPositions();
  }, []);

  // Update current position when item or animal changes
  useEffect(() => {
    if (selectedItem && selectedAnimal) {
      const savedPosition = positions[selectedItem]?.[selectedAnimal];
      if (savedPosition) {
        setCurrentPosition(savedPosition);
      } else {
        // Reset to defaults
        setCurrentPosition({ x: 50, y: 50, scale: 0.5, rotation: 0 });
      }
    }
  }, [selectedItem, selectedAnimal, positions]);

  const loadPositions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/item-positions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      // Convert to our format
      const positionMap: Record<string, Record<string, PositionData>> = {};
      data.forEach((pos: any) => {
        if (!positionMap[pos.item_id]) {
          positionMap[pos.item_id] = {};
        }
        positionMap[pos.item_id][pos.animal_type] = {
          x: pos.position_x || 50, // Default to center
          y: pos.position_y || 50, // Default to center
          scale: (pos.scale || 50) / 100, // Convert from percentage
          rotation: pos.rotation || 0
        };
      });
      setPositions(positionMap);
    } catch (error) {
      console.error('Failed to load positions:', error);
    }
  };

  const saveCurrentPosition = async () => {
    if (!selectedItem || !selectedAnimal) return;
    
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('authToken');
      await fetch('/api/admin/item-positions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          item_id: selectedItem,
          animal_type: selectedAnimal,
          position_x: currentPosition.x,
          position_y: currentPosition.y,
          scale: Math.round(currentPosition.scale * 100), // Convert to percentage
          rotation: currentPosition.rotation
        })
      });
      
      // Update local state
      setPositions(prev => ({
        ...prev,
        [selectedItem]: {
          ...prev[selectedItem],
          [selectedAnimal]: currentPosition
        }
      }));
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save position:', error);
    }
  };

  const copyToAllAnimals = async () => {
    if (!selectedItem || !selectedAnimal) return;
    
    // Copy current position to all other animals
    const updates = ANIMALS
      .filter(a => a.id !== selectedAnimal)
      .map(animal => ({
        animal: animal.id,
        position: currentPosition
      }));

    // Update local state immediately
    const newPositions = { ...positions };
    if (!newPositions[selectedItem]) {
      newPositions[selectedItem] = {};
    }
    updates.forEach(({ animal, position }) => {
      newPositions[selectedItem][animal] = position;
    });
    setPositions(newPositions);

    // Save all positions to backend
    for (const { animal, position } of updates) {
      try {
        const token = localStorage.getItem('authToken');
        await fetch('/api/admin/item-positions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            item_id: selectedItem,
            animal_type: animal,
            position_x: position.x,
            position_y: position.y,
            scale: Math.round(position.scale * 100),
            rotation: position.rotation
          })
        });
      } catch (error) {
        console.error(`Failed to save position for ${animal}:`, error);
      }
    }
    
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const exportPositions = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      positions: positions
    };
    setShowExport(true);
  };

  const getProgress = () => {
    let configured = 0;
    let total = AVATAR_ITEMS.length * ANIMALS.length;
    
    AVATAR_ITEMS.forEach(item => {
      ANIMALS.forEach(animal => {
        if (positions[item.id]?.[animal.id]) {
          configured++;
        }
      });
    });
    
    return { configured, total, percentage: Math.round((configured / total) * 100) };
  };

  const progress = getProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">Avatar Item Positioner</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Position store items perfectly on each animal
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">
                  {progress.configured} / {progress.total}
                </div>
                <div className="text-sm text-muted-foreground">
                  {progress.percentage}% Complete
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Positioning Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Item Selector */}
              <div>
                <Label>Select Item</Label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose an item to position" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVATAR_ITEMS.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex items-center gap-2">
                          <span>{item.name}</span>
                          {positions[item.id] && (
                            <Badge variant="secondary" className="text-xs">
                              {Object.keys(positions[item.id]).length}/{ANIMALS.length}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Animal Selector */}
              <div>
                <Label>Select Animal</Label>
                <Select value={selectedAnimal} onValueChange={setSelectedAnimal}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANIMALS.map(animal => (
                      <SelectItem key={animal.id} value={animal.id}>
                        <div className="flex items-center gap-2">
                          <span>{animal.emoji}</span>
                          <span>{animal.name}</span>
                          {positions[selectedItem]?.[animal.id] && (
                            <Badge variant="secondary" className="ml-2">✓</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Position Sliders */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Horizontal Position</Label>
                    <span className="text-sm text-muted-foreground">{currentPosition.x}%</span>
                  </div>
                  <Slider
                    value={[currentPosition.x]}
                    onValueChange={([x]) => setCurrentPosition(prev => ({ ...prev, x }))}
                    min={0}
                    max={100}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Vertical Position</Label>
                    <span className="text-sm text-muted-foreground">{currentPosition.y}%</span>
                  </div>
                  <Slider
                    value={[currentPosition.y]}
                    onValueChange={([y]) => setCurrentPosition(prev => ({ ...prev, y }))}
                    min={0}
                    max={100}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Scale</Label>
                    <span className="text-sm text-muted-foreground">{currentPosition.scale.toFixed(2)}x</span>
                  </div>
                  <Slider
                    value={[currentPosition.scale * 100]}
                    onValueChange={([scale]) => setCurrentPosition(prev => ({ ...prev, scale: scale / 100 }))}
                    min={10}
                    max={150}
                    step={5}
                    className="cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Rotation</Label>
                    <span className="text-sm text-muted-foreground">{currentPosition.rotation}°</span>
                  </div>
                  <Slider
                    value={[currentPosition.rotation]}
                    onValueChange={([rotation]) => setCurrentPosition(prev => ({ ...prev, rotation }))}
                    min={-180}
                    max={180}
                    step={5}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  onClick={saveCurrentPosition} 
                  disabled={!selectedItem || saveStatus === 'saving'}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveStatus === 'saving' ? 'Saving...' : 
                   saveStatus === 'saved' ? 'Saved!' : 'Save Position'}
                </Button>
                
                <Button 
                  onClick={copyToAllAnimals}
                  variant="outline"
                  disabled={!selectedItem}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to All Animals
                </Button>
                
                <Button
                  onClick={() => setCurrentPosition({ x: 50, y: 50, scale: 0.5, rotation: 0 })}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  Reset Position
                </Button>
              </div>

              <Button
                onClick={exportPositions}
                variant="secondary"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Export All Positions
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-12 min-h-[400px] flex items-center justify-center relative overflow-visible">
                <AnimatePresence mode="wait">
                  {selectedItem && selectedAnimal ? (
                    <div className="relative" style={{ width: 300, height: 300 }}>
                      {/* Base animal */}
                      <LayeredAvatar
                        animalType={selectedAnimal}
                        items={{}}
                        width={300}
                        height={300}
                        animated={false}
                      />
                      
                      {/* Item with custom positioning */}
                      <motion.div
                        key={`${selectedItem}-${selectedAnimal}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute"
                        style={{
                          top: `${currentPosition.y}%`,
                          left: `${currentPosition.x}%`,
                          transform: `
                            translate(-50%, -50%) 
                            scale(${currentPosition.scale}) 
                            rotate(${currentPosition.rotation}deg)
                          `,
                          transformOrigin: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        <img
                          src={`/avatars/items/${
                            AVATAR_ITEMS.find(i => i.id === selectedItem)?.type.includes('hat') 
                              ? 'hats' 
                              : 'accessories'
                          }/${selectedItem}.png`}
                          alt=""
                          className="block"
                          onError={(e) => {
                            // Fallback to placeholder
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2NjYyIgLz48dGV4dCB4PSI1MCIgeT0iNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                          }}
                        />
                      </motion.div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <div className="text-6xl mb-4">🎯</div>
                      <p>Select an item and animal to start positioning</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Quick Animal Switcher */}
              {selectedItem && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {ANIMALS.map(animal => (
                    <Button
                      key={animal.id}
                      size="sm"
                      variant={selectedAnimal === animal.id ? 'default' : 'outline'}
                      onClick={() => setSelectedAnimal(animal.id)}
                      className="relative"
                    >
                      {animal.emoji}
                      {positions[selectedItem]?.[animal.id] && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Export Modal */}
        {showExport && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Export Positions</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowExport(false)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={JSON.stringify(positions, null, 2)}
                readOnly
                className="font-mono text-xs h-64"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(positions, null, 2));
                  alert('Copied to clipboard!');
                }}
                className="mt-4"
              >
                Copy to Clipboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

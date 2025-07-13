import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import LayeredAvatarFixed from '@/components/avatar-v2/LayeredAvatarFixed';
import { getItemFolder } from '@shared/currency-types';
import { ANIMAL_CONFIGS, getItemScaleForAnimal } from '@/config/animal-sizing';
import { Save, Copy, RotateCw, Download, Upload, Move, FileJson } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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

type PositionData = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

type StoreItem = {
  id: string;
  name: string;
  itemType: string;
  cost: number;
  description?: string;
  rarity?: string;
};

export default function AvatarItemPositioner() {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedAnimal, setSelectedAnimal] = useState<string>('meerkat');
  const [positions, setPositions] = useState<Record<string, Record<string, PositionData>>>({});
  const [currentPosition, setCurrentPosition] = useState<PositionData>({
    x: 50,
    y: 50,
    scale: 0.5,
    rotation: 0
  });
  const [selectedItemData, setSelectedItemData] = useState<StoreItem | null>(null);
  
  // Fetch store items from database
  const { data: storeItems = [], isLoading: itemsLoading, error: itemsError } = useQuery({
    queryKey: ['/api/store/admin/items'],
    queryFn: () => apiRequest('GET', '/api/store/admin/items'),
  });
  
  // Debug logging
  console.log('Store items loaded:', storeItems);
  console.log('Items loading:', itemsLoading);
  console.log('Items error:', itemsError);
  
  // Filter only avatar items (no room furniture)
  const AVATAR_ITEMS = storeItems.filter((item: StoreItem) => 
    item.itemType === 'avatar_hat' || item.itemType === 'avatar_accessory'
  );
  
  console.log('Filtered avatar items:', AVATAR_ITEMS);
  
  // Update item in positioning tool
  const handleItemPositionChange = (position: PositionData) => {
    setCurrentPosition(position);
  };
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showExport, setShowExport] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [showBatchUpdate, setShowBatchUpdate] = useState(false);
  const [batchUpdateData, setBatchUpdateData] = useState('');
  const [batchUpdateStatus, setBatchUpdateStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [isDragging, setIsDragging] = useState(false);

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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/item-positions`, {
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
          x: pos.position_x || 50,
          y: pos.position_y || 50,
          scale: (pos.scale || 50) / 100,
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
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/item-positions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          item_type: selectedItemData?.itemType || selectedItem,
          animal_type: selectedAnimal,
          x_position: currentPosition.x,
          y_position: currentPosition.y,
          scale: Math.round(currentPosition.scale * 100),
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
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/item-positions`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            item_type: selectedItemData?.itemType || selectedItem,
            animal_type: animal,
            x_position: position.x,
            y_position: position.y,
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
    // Filter out any undefined entries and map item IDs to item types
    const cleanedPositions = Object.entries(positions).reduce((acc, [itemId, animalPositions]) => {
      if (itemId && itemId !== 'undefined') {
        // Find the item to get its type code
        const item = AVATAR_ITEMS.find(i => i.id === itemId);
        const itemTypeCode = item?.itemType || itemId;
        
        const cleanedAnimalPositions = Object.entries(animalPositions).reduce((animalAcc, [animalType, position]) => {
          if (animalType && animalType !== 'undefined') {
            animalAcc[animalType] = position;
          }
          return animalAcc;
        }, {} as Record<string, PositionData>);
        
        if (Object.keys(cleanedAnimalPositions).length > 0) {
          acc[itemTypeCode] = cleanedAnimalPositions;
        }
      }
      return acc;
    }, {} as Record<string, Record<string, PositionData>>);
    
    const exportData = {
      timestamp: new Date().toISOString(),
      positions: cleanedPositions
    };
    setExportData(exportData);
    setShowExport(true);
  };

  const processBatchUpdate = async () => {
    setBatchUpdateStatus('processing');
    try {
      // Parse the JSON data
      const updateData = JSON.parse(batchUpdateData);
      const token = localStorage.getItem('authToken');
      let successCount = 0;
      let errorCount = 0;

      // Process each item
      for (const [itemId, animalPositions] of Object.entries(updateData)) {
        if (itemId === 'undefined') continue; // Skip invalid entries
        
        for (const [animalType, position] of Object.entries(animalPositions as any)) {
          if (animalType === 'undefined') continue; // Skip invalid entries
          
          try {
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/item-positions`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                item_type: itemId,
                animal_type: animalType,
                x_position: (position as any).x,
                y_position: (position as any).y,
                scale: Math.round((position as any).scale * 100),
                rotation: (position as any).rotation
              })
            });
            successCount++;
          } catch (error) {
            console.error(`Failed to update ${itemId} for ${animalType}:`, error);
            errorCount++;
          }
        }
      }

      // Reload positions
      await loadPositions();
      
      setBatchUpdateStatus('complete');
      toast({
        title: "Batch Update Complete",
        description: `Successfully updated ${successCount} positions${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });
      
      // Close modal after success
      setTimeout(() => {
        setShowBatchUpdate(false);
        setBatchUpdateData('');
        setBatchUpdateStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Batch update error:', error);
      setBatchUpdateStatus('error');
      toast({
        title: "Update Failed",
        description: "Invalid JSON format or server error",
        variant: "destructive",
      });
    }
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

  // Handle drag and drop with object-contain awareness
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedItem || !selectedAnimal) return;
    
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    
    // Calculate the actual image bounds within the container (for object-contain)
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    const aspectRatio = 1; // Assuming square avatars
    
    let imageWidth = containerWidth;
    let imageHeight = containerHeight;
    let offsetX = 0;
    let offsetY = 0;
    
    if (containerWidth / containerHeight > aspectRatio) {
      // Container wider than image
      imageWidth = containerHeight * aspectRatio;
      offsetX = (containerWidth - imageWidth) / 2;
    } else {
      // Container taller than image
      imageHeight = containerWidth / aspectRatio;
      offsetY = (containerHeight - imageHeight) / 2;
    }
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = currentPosition.x;
    const startPosY = currentPosition.y;
    
    setIsDragging(true);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      // Convert pixel movement to percentage of the actual image size
      const newX = Math.max(0, Math.min(100, startPosX + (deltaX / imageWidth) * 100));
      const newY = Math.max(0, Math.min(100, startPosY + (deltaY / imageHeight) * 100));
      
      setCurrentPosition(prev => ({ ...prev, x: newX, y: newY }));
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  if (itemsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <Card className="p-8">
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-4" />
            <p className="text-lg">Loading store items...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
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
                <div className="w-32 h-2 bg-gray-200 rounded-full mt-2">
                  <div 
                    className="h-full bg-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Positioning Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Item Selector */}
              <div>
                <Label>Select Item</Label>
                <Select value={selectedItem} onValueChange={(value) => {
                  setSelectedItem(value);
                  const item = AVATAR_ITEMS.find(i => i.id === value);
                  setSelectedItemData(item || null);
                }}>
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

              {/* Position Sliders with Input Fields */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Horizontal Position (X)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={Math.round(currentPosition.x)}
                        onChange={(e) => setCurrentPosition(prev => ({ 
                          ...prev, 
                          x: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) 
                        }))}
                        className="w-16 h-8 text-sm"
                        min={0}
                        max={100}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
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
                    <Label>Vertical Position (Y)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={Math.round(currentPosition.y)}
                        onChange={(e) => setCurrentPosition(prev => ({ 
                          ...prev, 
                          y: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) 
                        }))}
                        className="w-16 h-8 text-sm"
                        min={0}
                        max={100}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
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
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={currentPosition.scale.toFixed(2)}
                        onChange={(e) => setCurrentPosition(prev => ({ 
                          ...prev, 
                          scale: Math.max(0.1, Math.min(1.5, parseFloat(e.target.value) || 0.5)) 
                        }))}
                        className="w-16 h-8 text-sm"
                        min={0.1}
                        max={1.5}
                        step={0.05}
                      />
                      <span className="text-sm text-muted-foreground">x</span>
                    </div>
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
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={currentPosition.rotation}
                        onChange={(e) => setCurrentPosition(prev => ({ 
                          ...prev, 
                          rotation: Math.max(-180, Math.min(180, parseInt(e.target.value) || 0)) 
                        }))}
                        className="w-16 h-8 text-sm"
                        min={-180}
                        max={180}
                      />
                      <span className="text-sm text-muted-foreground">°</span>
                    </div>
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

              {/* Quick Tips */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                <p className="font-semibold mb-1">💡 Quick Tips:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Click and drag on the preview to position items</li>
                  <li>• Use sliders for fine adjustments</li>
                  <li>• Copy to all animals when an item works for everyone</li>
                  <li>• Save frequently to preserve your work</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={exportPositions}
                  variant="secondary"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                
                <Button
                  onClick={() => setShowBatchUpdate(true)}
                  variant="secondary"
                  className="flex-1"
                >
                  <FileJson className="w-4 h-4 mr-2" />
                  Batch Update
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Live Preview</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Move className="w-3 h-3" />
                    Drag item to position
                  </Badge>
                  <Badge variant="secondary">
                    Room size: 250px
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Main positioning view */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Positioning View (600px)</h4>
                  <div 
                    className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-8 flex items-center justify-center relative"
                    style={{ 
                      minHeight: '700px',
                      overflow: 'visible',
                      cursor: isDragging ? 'grabbing' : 'default'
                    }}
                  >
                <AnimatePresence mode="wait">
                  {selectedItem && selectedAnimal ? (
                    <div 
                      className="relative" 
                      style={{ 
                        width: 600, 
                        height: 600,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {/* Base animal - full size in container */}
                      <div 
                        className="absolute inset-0"
                        onMouseDown={handleMouseDown}
                        style={{ cursor: selectedItem ? 'move' : 'default' }}
                      >
                        {/* <LayeredAvatarFixed
                          animalType={selectedAnimal}
                          selectedItem={selectedItem}
                          selectedItemImageUrl={(selectedItemData as any)?.thumbnailUrl || (selectedItemData as any)?.imageUrl}
                          itemPosition={currentPosition}
                          width={600}
                          height={600}
                          animated={false}
                        /> */}
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p>Component not available</p>
                        </div>
                      </div>

                      {/* Grid overlay for positioning help */}
                      {isDragging && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-1/2 left-0 right-0 h-px bg-purple-300 opacity-50" />
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-purple-300 opacity-50" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <div className="text-6xl mb-4">🎯</div>
                      <p>Select an item and animal to start positioning</p>
                    </div>
                  )}
                </AnimatePresence>
                  </div>
                </div>
                
                {/* Room size preview */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Room Preview (250px - actual size)</h4>
                  <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-lg p-4 flex items-center justify-center">
                    <div style={{ width: '250px', height: '250px', position: 'relative' }}>
                      {selectedItem && selectedAnimal && (
                        <LayeredAvatarFixed
                          animalType={selectedAnimal}
                          selectedItem={selectedItem}
                          selectedItemImageUrl={(selectedItemData as any)?.thumbnailUrl || (selectedItemData as any)?.imageUrl}
                          itemPosition={currentPosition}
                          width={250}
                          height={250}
                          animated={false}
                        />
                      )}
                    </div>
                  </div>
                </div>
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
        {showExport && exportData && (
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
                value={JSON.stringify(exportData.positions, null, 2)}
                readOnly
                className="font-mono text-xs h-64"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(exportData.positions, null, 2));
                  toast({
                    title: "Copied!",
                    description: "Position data copied to clipboard",
                  });
                }}
                className="mt-4"
              >
                Copy to Clipboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Batch Update Modal */}
        {showBatchUpdate && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Batch Update Positions</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowBatchUpdate(false);
                    setBatchUpdateData('');
                    setBatchUpdateStatus('idle');
                  }}
                  disabled={batchUpdateStatus === 'processing'}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Paste your position data JSON:</Label>
                  <Textarea
                    value={batchUpdateData}
                    onChange={(e) => setBatchUpdateData(e.target.value)}
                    placeholder='Example:
{
  "explorer": {
    "parrot": { "x": 51, "y": 13, "scale": 0.3, "rotation": 20 }
  }
}'
                    className="font-mono text-xs h-64 mt-2"
                    disabled={batchUpdateStatus === 'processing'}
                  />
                </div>
                
                {batchUpdateStatus === 'error' && (
                  <div className="text-red-600 text-sm">
                    Error: Invalid JSON format. Please check your data.
                  </div>
                )}
                
                {batchUpdateStatus === 'complete' && (
                  <div className="text-green-600 text-sm">
                    ✅ Update complete! Positions have been saved.
                  </div>
                )}
                
                <Button
                  onClick={processBatchUpdate}
                  disabled={!batchUpdateData.trim() || batchUpdateStatus === 'processing'}
                  className="w-full"
                >
                  {batchUpdateStatus === 'processing' ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Update Positions
                    </>
                  )}
                </Button>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Format: {`{ "itemId": { "animalType": { "x": 50, "y": 50, "scale": 0.5, "rotation": 0 } } }`}</p>
                  <p>• Item IDs: explorer, safari, greenblinds, hearts, bow_tie, necklace</p>
                  <p>• Animal types: meerkat, panda, owl, beaver, elephant, otter, parrot, border-collie</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Progress Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Positioning Progress Matrix</CardTitle>
            <CardDescription>
              Green = Positioned, Yellow = Default position, Red = Not positioned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2">Item</th>
                    {ANIMALS.map(animal => (
                      <th key={animal.id} className="text-center p-2">
                        <div className="flex flex-col items-center">
                          <span className="text-lg">{animal.emoji}</span>
                          <span className="text-xs">{animal.name.split(' ')[0]}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AVATAR_ITEMS.map(item => (
                    <tr key={item.id} className="border-t">
                      <td className="p-2 font-medium">{item.name}</td>
                      {ANIMALS.map(animal => {
                        const hasPosition = positions[item.id]?.[animal.id];
                        return (
                          <td key={animal.id} className="p-2 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              className={cn(
                                "w-8 h-8 p-0",
                                hasPosition ? "bg-green-100 hover:bg-green-200" : "bg-red-100 hover:bg-red-200"
                              )}
                              onClick={() => {
                                setSelectedItem(item.id);
                                setSelectedAnimal(animal.id);
                              }}
                            >
                              {hasPosition ? "✓" : "×"}
                            </Button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

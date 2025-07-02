import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NormalizedAvatar from '@/components/avatar-v2/NormalizedAvatar';
import { Save, Copy, RotateCw, Download, Upload, Move, FileJson } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { DEFAULT_ANCHORS } from '@/utils/normalized-positioning';

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

type NormalizedPositionData = {
  x: number; // 0-1
  y: number; // 0-1
  scale: number; // 0-2
  rotation: number; // -180 to 180
  anchorX: number; // 0-1
  anchorY: number; // 0-1
};

type StoreItem = {
  id: string;
  name: string;
  itemType: string;
  cost: number;
  description?: string;
  rarity?: string;
  imageUrl?: string;
};

export default function AvatarItemPositionerNormalized() {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedAnimal, setSelectedAnimal] = useState<string>('meerkat');
  const [positions, setPositions] = useState<Record<string, Record<string, NormalizedPositionData>>>({});
  const [currentPosition, setCurrentPosition] = useState<NormalizedPositionData>({
    x: 0.5,
    y: 0.5,
    scale: 0.3,
    rotation: 0,
    anchorX: 0.5,
    anchorY: 0.5
  });
  const [selectedItemData, setSelectedItemData] = useState<StoreItem | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showExport, setShowExport] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [showBatchUpdate, setShowBatchUpdate] = useState(false);
  const [batchUpdateData, setBatchUpdateData] = useState('');
  const [batchUpdateStatus, setBatchUpdateStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  
  // Fetch store items from database
  const { data: storeItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/store/admin/items'],
    queryFn: () => apiRequest('GET', '/api/store/admin/items'),
  });
  
  // Filter only avatar items
  const AVATAR_ITEMS = storeItems.filter((item: StoreItem) => 
    item.itemType === 'avatar_hat' || item.itemType === 'avatar_glasses' || item.itemType === 'avatar_accessory'
  );
  
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
        // Reset to defaults with appropriate anchor
        const itemType = selectedItemData?.itemType;
        const defaultAnchors = 
          itemType === 'avatar_hat' ? DEFAULT_ANCHORS.hat :
          itemType === 'avatar_glasses' ? DEFAULT_ANCHORS.glasses :
          DEFAULT_ANCHORS.accessory;
          
        setCurrentPosition({ 
          x: 0.5, 
          y: itemType === 'avatar_hat' ? 0.2 : itemType === 'avatar_glasses' ? 0.35 : 0.5,
          scale: 0.3, 
          rotation: 0,
          anchorX: defaultAnchors.x,
          anchorY: defaultAnchors.y
        });
      }
    }
  }, [selectedItem, selectedAnimal, positions, selectedItemData]);

  const loadPositions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/item-positions-normalized`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      // Convert to our format - ensure all values are numbers
      const positionMap: Record<string, Record<string, NormalizedPositionData>> = {};
      data.forEach((pos: any) => {
        if (!positionMap[pos.item_id]) {
          positionMap[pos.item_id] = {};
        }
        positionMap[pos.item_id][pos.animal_type] = {
          x: parseFloat(pos.position_x) || 0.5,
          y: parseFloat(pos.position_y) || 0.5,
          scale: parseFloat(pos.scale) || 0.3,
          rotation: parseInt(pos.rotation) || 0,
          anchorX: parseFloat(pos.anchor_x) || 0.5,
          anchorY: parseFloat(pos.anchor_y) || 0.5
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
      
      // Log the position being saved (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('Saving position:', {
          item: selectedItemData?.name,
          animal: selectedAnimal,
          position: currentPosition
        });
      }
      
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/item-positions-normalized`, {
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
          scale: currentPosition.scale,
          rotation: currentPosition.rotation,
          anchor_x: currentPosition.anchorX,
          anchor_y: currentPosition.anchorY
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
      
      toast({
        title: "Position Saved",
        description: "Item position has been saved successfully.",
      });
    } catch (error) {
      console.error('Failed to save position:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save position. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyToAllAnimals = async () => {
    if (!selectedItem || !selectedAnimal) return;
    
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/item-positions-normalized/copy-all`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          item_id: selectedItem,
          source_animal: selectedAnimal,
          position_x: currentPosition.x,
          position_y: currentPosition.y,
          scale: currentPosition.scale,
          rotation: currentPosition.rotation,
          anchor_x: currentPosition.anchorX,
          anchor_y: currentPosition.anchorY
        })
      });
      
      // Update local state
      const newPositions = { ...positions };
      if (!newPositions[selectedItem]) {
        newPositions[selectedItem] = {};
      }
      ANIMALS.forEach(animal => {
        if (animal.id !== selectedAnimal) {
          newPositions[selectedItem][animal.id] = { ...currentPosition };
        }
      });
      setPositions(newPositions);
      
      toast({
        title: "Copied to All Animals",
        description: "Position has been copied to all animals successfully.",
      });
    } catch (error) {
      console.error('Failed to copy positions:', error);
    }
  };

  const handleItemDrag = (position: { x: number; y: number }) => {
    setCurrentPosition(prev => ({ ...prev, x: position.x, y: position.y }));
  };

  const exportPositions = () => {
    const exportFormat: Record<string, Record<string, any>> = {};
    
    // Convert normalized positions to export format
    Object.entries(positions).forEach(([itemId, animalPositions]) => {
      const item = AVATAR_ITEMS.find(i => i.id === itemId);
      if (item) {
        exportFormat[item.name] = {};
        Object.entries(animalPositions).forEach(([animalType, pos]) => {
          exportFormat[item.name][animalType] = {
            x: pos.x,
            y: pos.y,
            scale: pos.scale,
            rotation: pos.rotation,
            anchorX: pos.anchorX,
            anchorY: pos.anchorY
          };
        });
      }
    });
    
    setExportData({ positions: exportFormat });
    setShowExport(true);
  };

  const processBatchUpdate = async () => {
    setBatchUpdateStatus('processing');
    
    try {
      const data = JSON.parse(batchUpdateData);
      const token = localStorage.getItem('authToken');
      const positionsToUpdate = [];
      
      // Build array of all positions to update
      for (const [itemName, animalPositions] of Object.entries(data)) {
        const item = AVATAR_ITEMS.find(i => i.name === itemName);
        if (!item) continue;
        
        for (const [animalType, pos] of Object.entries(animalPositions as any)) {
          positionsToUpdate.push({
            item_id: item.id,
            animal_type: animalType,
            position_x: pos.x,
            position_y: pos.y,
            scale: pos.scale,
            rotation: pos.rotation || 0,
            anchor_x: pos.anchorX || 0.5,
            anchor_y: pos.anchorY || 0.5
          });
        }
      }
      
      // Send single batch request
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/item-positions-normalized/batch`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ positions: positionsToUpdate })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to batch update: ${response.statusText}`);
      }
      
      // Reload positions
      await loadPositions();
      setBatchUpdateStatus('complete');
      
      toast({
        title: "Batch Update Complete",
        description: `Successfully updated ${positionsToUpdate.length} positions.`,
      });
      
      setTimeout(() => {
        setShowBatchUpdate(false);
        setBatchUpdateData('');
        setBatchUpdateStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Batch update error:', error);
      setBatchUpdateStatus('error');
      toast({
        title: "Batch Update Failed",
        description: error.message || "Failed to update positions",
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
                <CardTitle className="text-3xl">Avatar Item Positioner (Normalized)</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Position store items with the new normalized coordinate system
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

              {/* Position Controls */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>X Position (0-1)</Label>
                    <Input
                      type="number"
                      value={(typeof currentPosition.x === 'number' ? currentPosition.x : 0.5).toFixed(3)}
                      onChange={(e) => setCurrentPosition(prev => ({ 
                        ...prev, 
                        x: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)) 
                      }))}
                      className="w-20 h-8 text-sm"
                      min={0}
                      max={1}
                      step={0.01}
                    />
                  </div>
                  <Slider
                    value={[(typeof currentPosition.x === 'number' ? currentPosition.x : 0.5) * 100]}
                    onValueChange={([x]) => setCurrentPosition(prev => ({ ...prev, x: x / 100 }))}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Y Position (0-1)</Label>
                    <Input
                      type="number"
                      value={(typeof currentPosition.y === 'number' ? currentPosition.y : 0.5).toFixed(3)}
                      onChange={(e) => setCurrentPosition(prev => ({ 
                        ...prev, 
                        y: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)) 
                      }))}
                      className="w-20 h-8 text-sm"
                      min={0}
                      max={1}
                      step={0.01}
                    />
                  </div>
                  <Slider
                    value={[(typeof currentPosition.y === 'number' ? currentPosition.y : 0.5) * 100]}
                    onValueChange={([y]) => setCurrentPosition(prev => ({ ...prev, y: y / 100 }))}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Scale</Label>
                    <Input
                      type="number"
                      value={(typeof currentPosition.scale === 'number' ? currentPosition.scale : 0.3).toFixed(2)}
                      onChange={(e) => setCurrentPosition(prev => ({ 
                        ...prev, 
                        scale: Math.max(0.1, Math.min(2, parseFloat(e.target.value) || 0.5)) 
                      }))}
                      className="w-20 h-8 text-sm"
                      min={0.1}
                      max={2}
                      step={0.05}
                    />
                  </div>
                  <Slider
                    value={[(typeof currentPosition.scale === 'number' ? currentPosition.scale : 0.3) * 100]}
                    onValueChange={([scale]) => setCurrentPosition(prev => ({ ...prev, scale: scale / 100 }))}
                    min={10}
                    max={200}
                    step={5}
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
                    value={[typeof currentPosition.rotation === 'number' ? currentPosition.rotation : 0]}
                    onValueChange={([rotation]) => setCurrentPosition(prev => ({ ...prev, rotation }))}
                    min={-180}
                    max={180}
                    step={5}
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
                  onClick={() => setCurrentPosition({ 
                    x: 0.5, y: 0.5, scale: 0.3, rotation: 0,
                    anchorX: 0.5, anchorY: 0.5
                  })}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  Reset Position
                </Button>
              </div>

              {/* Export/Import Section */}
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={exportPositions}
                  variant="secondary"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export All
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
                <Badge variant="outline" className="flex items-center gap-1">
                  <Move className="w-3 h-3" />
                  Drag item to position
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Single room-sized preview */}
              <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-xl p-8 flex items-center justify-center">
                <div className="text-center">
                  <h4 className="text-sm font-medium mb-4">Room Preview (Actual Size)</h4>
                  <AnimatePresence mode="wait">
                    {selectedItem && selectedAnimal ? (
                      <NormalizedAvatar
                        animalType={selectedAnimal}
                        width={250}
                        height={250}
                        selectedItem={selectedItem}
                        selectedItemImageUrl={selectedItemData?.imageUrl}
                        itemPosition={currentPosition}
                        onItemDrag={handleItemDrag}
                        animated={false}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <div className="text-6xl mb-4">🎯</div>
                        <p>Select an item and animal to start positioning</p>
                      </div>
                    )}
                  </AnimatePresence>
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
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Export All Positions</CardTitle>
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
          <Card className="mt-6">
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
  "Viking Hat": {
    "panda": { "x": 0.5, "y": 0.2, "scale": 0.3, "rotation": 0 }
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
                    'Apply Batch Update'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import LayeredAvatar from '@/components/avatar-v2/LayeredAvatar';
import { STORE_CATALOG } from '@shared/currency-types';
import { Check, Copy, RotateCw, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// The 8 animals in our system
const ANIMALS = [
  'meerkat', 'panda', 'owl', 'beaver', 
  'elephant', 'otter', 'parrot', 'border-collie'
] as const;

type AnimalType = typeof ANIMALS[number];
type PositionData = {
  position_x: number;
  position_y: number;
  scale: number;
  rotation: number;
};

export default function ItemPositionMatrix() {
  // State for the matrix view
  const [positions, setPositions] = useState<Record<string, Record<string, PositionData>>>({});
  const [selectedCell, setSelectedCell] = useState<{ itemId: string; animal: AnimalType } | null>(null);
  const [copySource, setCopySource] = useState<AnimalType | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [filter, setFilter] = useState<'all' | 'configured' | 'pending'>('all');

  // Current position being edited
  const [currentPosition, setCurrentPosition] = useState<PositionData>({
    position_x: 0,
    position_y: 0,
    scale: 1,
    rotation: 0
  });

  // Load all positions from backend
  useEffect(() => {
    fetchAllPositions();
  }, []);

  const fetchAllPositions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/item-positions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      // Convert array to nested object for easy lookup
      const positionMap: Record<string, Record<string, PositionData>> = {};
      data.forEach((pos: any) => {
        if (!positionMap[pos.item_id]) {
          positionMap[pos.item_id] = {};
        }
        positionMap[pos.item_id][pos.animal_type] = {
          position_x: pos.position_x,
          position_y: pos.position_y,
          scale: pos.scale,
          rotation: pos.rotation
        };
      });
      setPositions(positionMap);
    } catch (error) {
      console.error('Failed to load positions:', error);
    }
  };

  // Save position for current selection
  const savePosition = async () => {
    if (!selectedCell) return;
    
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
          item_id: selectedCell.itemId,
          animal_type: selectedCell.animal,
          ...currentPosition
        })
      });
      
      // Update local state
      setPositions(prev => ({
        ...prev,
        [selectedCell.itemId]: {
          ...prev[selectedCell.itemId],
          [selectedCell.animal]: currentPosition
        }
      }));
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save position:', error);
    }
  };

  // Copy position from another animal
  const copyFromAnimal = (sourceAnimal: AnimalType) => {
    if (!selectedCell || !positions[selectedCell.itemId]?.[sourceAnimal]) return;
    
    const sourcePosition = positions[selectedCell.itemId][sourceAnimal];
    setCurrentPosition(sourcePosition);
    setCopySource(sourceAnimal);
  };

  // Calculate progress
  const totalCombinations = STORE_CATALOG.length * ANIMALS.length;
  const configuredCount = Object.values(positions).reduce(
    (sum, itemPositions) => sum + Object.keys(itemPositions).length, 
    0
  );
  const progress = (configuredCount / totalCombinations) * 100;

  // Filter items based on configuration status
  const filteredItems = STORE_CATALOG.filter(item => {
    if (filter === 'all') return true;
    const itemPositions = positions[item.id] || {};
    const isConfigured = Object.keys(itemPositions).length === ANIMALS.length;
    return filter === 'configured' ? isConfigured : !isConfigured;
  });

  // Get status for a cell
  const getCellStatus = (itemId: string, animal: AnimalType) => {
    return positions[itemId]?.[animal] ? 'configured' : 'pending';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Item Position Matrix</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Configure how items appear on each animal
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {configuredCount} / {totalCombinations}
                </div>
                <Progress value={progress} className="w-32 mt-2" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <Label>Show:</Label>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All Items
            </Button>
            <Button
              variant={filter === 'configured' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('configured')}
            >
              Configured ✓
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending
            </Button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-[200px_1fr] gap-6">
          {/* Matrix View */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="sticky top-0 bg-white border-b p-4">
                <h3 className="font-semibold">Items × Animals</h3>
              </div>
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Item</th>
                      {ANIMALS.map(animal => (
                        <th key={animal} className="p-2 text-center w-20">
                          <div className="text-xs">{animal}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2 font-medium text-sm">{item.name}</td>
                        {ANIMALS.map(animal => {
                          const status = getCellStatus(item.id, animal);
                          const isSelected = selectedCell?.itemId === item.id && 
                                           selectedCell?.animal === animal;
                          
                          return (
                            <td key={animal} className="p-1">
                              <button
                                onClick={() => {
                                  setSelectedCell({ itemId: item.id, animal });
                                  const existingPos = positions[item.id]?.[animal];
                                  setCurrentPosition(existingPos || {
                                    position_x: 0,
                                    position_y: 0,
                                    scale: 1,
                                    rotation: 0
                                  });
                                  setCopySource(null);
                                }}
                                className={cn(
                                  "w-full h-8 rounded flex items-center justify-center transition-all",
                                  status === 'configured' 
                                    ? "bg-green-100 hover:bg-green-200" 
                                    : "bg-gray-100 hover:bg-gray-200",
                                  isSelected && "ring-2 ring-blue-500"
                                )}
                              >
                                {status === 'configured' ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                )}
                              </button>
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

          {/* Editor Panel */}
          {selectedCell ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {STORE_CATALOG.find(i => i.id === selectedCell.itemId)?.name}
                    </CardTitle>
                    <p className="text-muted-foreground capitalize">
                      on {selectedCell.animal}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {copySource && (
                      <Badge variant="secondary">
                        Copied from {copySource}
                      </Badge>
                    )}
                    {saveStatus === 'saved' && (
                      <Badge className="bg-green-500">Saved!</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preview */}
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-8 flex items-center justify-center">
                  <div 
                    style={{
                      transform: `
                        translateX(${currentPosition.position_x}px) 
                        translateY(${currentPosition.position_y}px) 
                        scale(${currentPosition.scale}) 
                        rotate(${currentPosition.rotation}deg)
                      `
                    }}
                  >
                    {/* <LayeredAvatar
                      animalType={selectedCell.animal}
                      items={{
                        [STORE_CATALOG.find(i => i.id === selectedCell.itemId)?.type || '']: selectedCell.itemId
                      }}
                      width={200}
                      height={200}
                    /> */}
                    <div className="text-gray-500 text-center">
                      <p>Component not available</p>
                    </div>
                  </div>
                </div>

                {/* Copy From */}
                <div>
                  <Label>Copy position from:</Label>
                  <Select onValueChange={(value) => copyFromAnimal(value as AnimalType)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select an animal to copy from" />
                    </SelectTrigger>
                    <SelectContent>
                      {ANIMALS.filter(a => a !== selectedCell.animal).map(animal => (
                        <SelectItem key={animal} value={animal} disabled={!positions[selectedCell.itemId]?.[animal]}>
                          {animal} {positions[selectedCell.itemId]?.[animal] ? '✓' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Position Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>X Position</Label>
                    <Input
                      type="number"
                      value={currentPosition.position_x}
                      onChange={(e) => setCurrentPosition(prev => ({
                        ...prev,
                        position_x: parseFloat(e.target.value) || 0
                      }))}
                      step="1"
                    />
                  </div>
                  <div>
                    <Label>Y Position</Label>
                    <Input
                      type="number"
                      value={currentPosition.position_y}
                      onChange={(e) => setCurrentPosition(prev => ({
                        ...prev,
                        position_y: parseFloat(e.target.value) || 0
                      }))}
                      step="1"
                    />
                  </div>
                  <div>
                    <Label>Scale</Label>
                    <Input
                      type="number"
                      value={currentPosition.scale}
                      onChange={(e) => setCurrentPosition(prev => ({
                        ...prev,
                        scale: parseFloat(e.target.value) || 1
                      }))}
                      step="0.1"
                      min="0.1"
                      max="3"
                    />
                  </div>
                  <div>
                    <Label>Rotation</Label>
                    <Input
                      type="number"
                      value={currentPosition.rotation}
                      onChange={(e) => setCurrentPosition(prev => ({
                        ...prev,
                        rotation: parseFloat(e.target.value) || 0
                      }))}
                      step="5"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPosition({
                      position_x: 0,
                      position_y: 0,
                      scale: 1,
                      rotation: 0
                    })}
                  >
                    <RotateCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    onClick={savePosition}
                    disabled={saveStatus === 'saving'}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveStatus === 'saving' ? 'Saving...' : 'Save Position'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-[600px]">
              <div className="text-center text-muted-foreground">
                <div className="text-6xl mb-4">📐</div>
                <p>Select a cell from the matrix to start positioning</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

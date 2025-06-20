import { motion } from 'framer-motion';
import { Package, Sparkles, Sofa, Palette, Home, AlertCircle, Paintbrush, Box } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIslandStore, ROOM_ITEM_LIMIT } from '@/stores/islandStore';
import { cn } from '@/lib/utils';
import DraggableItemSticker from './drag-drop/DraggableItemSticker';

export default function RoomDecoratorView() {
  const inventory = useIslandStore((state) => state.inventory);
  const draftRoom = useIslandStore((state) => state.draftRoom);
  const selectInventoryItem = useIslandStore((state) => state.selectInventoryItem);
  const selectedItem = useIslandStore((state) => state.inventory.selectedItem);
  const updateRoomColors = useIslandStore((state) => state.updateRoomColors);
  const updateRoomPatterns = useIslandStore((state) => state.updateRoomPatterns);

  // Filter inventory for room items only
  const roomItems = inventory.items.filter(item => 
    item.type === 'room_decoration' || item.type === 'room_furniture'
  );

  // Categorize items
  const furnitureItems = roomItems.filter(item => 
    item.type === 'room_furniture' || 
    ['chair', 'table', 'sofa', 'desk', 'bed'].some(keyword => item.id.includes(keyword))
  );
  
  const objectItems = roomItems.filter(item => 
    !furnitureItems.includes(item) // Everything else that's not furniture
  );
  
  // Find selected item details
  const selectedItemDetails = roomItems.find(i => i.id === selectedItem);

  const getRarityBadge = (item: any) => {
    if (item.rarity === 'rare') {
      return <Badge className="absolute top-1 right-1 text-xs px-1 bg-purple-500">★</Badge>;
    }
    if (item.rarity === 'legendary') {
      return <Badge className="absolute top-1 right-1 text-xs px-1 bg-yellow-500">⭐</Badge>;
    }
    return null;
  };

  const renderItemGrid = (items: any[], categoryType: string) => {
    // Create a 4x5 grid (20 slots total)
    const GRID_SIZE = 20;
    const gridItems = [];
    
    // Fill with actual items
    for (let i = 0; i < GRID_SIZE; i++) {
      if (i < items.length) {
        gridItems.push(
          <DraggableItemSticker
            key={items[i].id}
            item={items[i]}
            isSelected={selectedItem === items[i].id}
            onClick={() => selectInventoryItem(
              selectedItem === items[i].id ? undefined : items[i].id
            )}
          />
        );
      } else {
        // Empty slot
        gridItems.push(
          <div
            key={`empty-${categoryType}-${i}`}
            className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center"
          >
            <span className="text-gray-300 text-xs">Empty</span>
          </div>
        );
      }
    }
    
    return gridItems;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Instructions / Item Details */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-blue-700" />
            <span className="text-sm font-semibold text-blue-900">
              Room Items: {draftRoom.placedItems.length} / {ROOM_ITEM_LIMIT}
            </span>
          </div>
          {draftRoom.placedItems.length >= ROOM_ITEM_LIMIT && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              Room Full!
            </Badge>
          )}
          {draftRoom.placedItems.length >= ROOM_ITEM_LIMIT - 5 && 
           draftRoom.placedItems.length < ROOM_ITEM_LIMIT && (
            <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
              Almost Full
            </Badge>
          )}
        </div>
        {selectedItemDetails ? (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-sm text-blue-900">{selectedItemDetails.name}</h4>
                <p className="text-xs text-blue-800 mt-1">
                  {selectedItemDetails.description}
                </p>
              </div>
              <div className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                selectedItemDetails.rarity === 'rare' ? 'bg-purple-100 text-purple-700' :
                selectedItemDetails.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              )}>
                {selectedItemDetails.rarity === 'legendary' && <Sparkles className="w-3 h-3" />}
                {selectedItemDetails.rarity || 'common'}
              </div>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              <strong>Tip:</strong> Drag to room or click again to place!
            </p>
          </div>
        ) : (
          <p className="text-sm text-blue-800">
            <strong>How to decorate:</strong> Click an item to select it, then drag to place in your room.
          </p>
        )}
      </div>

      {/* Tabs for different categories */}
      <Tabs defaultValue="furniture" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="furniture" className="flex items-center gap-1">
            <Sofa className="w-4 h-4" />
            <span className="hidden sm:inline">Furniture</span>
          </TabsTrigger>
          <TabsTrigger value="objects" className="flex items-center gap-1">
            <Box className="w-4 h-4" />
            <span className="hidden sm:inline">Objects</span>
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-1">
            <Paintbrush className="w-4 h-4" />
            <span className="hidden sm:inline">Colors</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="furniture" className="mt-0">
            <div className="grid grid-cols-4 gap-2">
              {renderItemGrid(furnitureItems, 'furniture')}
            </div>
          </TabsContent>

          <TabsContent value="objects" className="mt-0">
            <div className="grid grid-cols-4 gap-2">
              {renderItemGrid(objectItems, 'objects')}
            </div>
          </TabsContent>

          <TabsContent value="colors" className="mt-0">
            <div className="space-y-4">
              {/* Wall Color */}
              <div>
                <label className="text-sm font-medium mb-2 block">Wall Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={draftRoom.wallColor || '#f5ddd9'}
                    onChange={(e) => updateRoomColors(e.target.value, undefined)}
                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="text-xs text-gray-600 mb-1">Current color</div>
                    <div className="font-mono text-sm">{draftRoom.wallColor || '#f5ddd9'}</div>
                  </div>
                </div>
              </div>

              {/* Floor Color */}
              <div>
                <label className="text-sm font-medium mb-2 block">Floor Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={draftRoom.floorColor || '#d4875f'}
                    onChange={(e) => updateRoomColors(undefined, e.target.value)}
                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="text-xs text-gray-600 mb-1">Current color</div>
                    <div className="font-mono text-sm">{draftRoom.floorColor || '#d4875f'}</div>
                  </div>
                </div>
              </div>

              {/* Preset Color Combos */}
              <div className="mt-6">
                <label className="text-sm font-medium mb-2 block">Quick Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateRoomColors('#f5ddd9', '#d4875f')}
                    className="p-2 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors"
                  >
                    <div className="flex h-12">
                      <div className="flex-1 bg-[#f5ddd9] rounded-l"></div>
                      <div className="flex-1 bg-[#d4875f] rounded-r"></div>
                    </div>
                    <span className="text-xs mt-1 block">Warm & Cozy</span>
                  </button>
                  
                  <button
                    onClick={() => updateRoomColors('#e8f4f8', '#a8c5d6')}
                    className="p-2 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors"
                  >
                    <div className="flex h-12">
                      <div className="flex-1 bg-[#e8f4f8] rounded-l"></div>
                      <div className="flex-1 bg-[#a8c5d6] rounded-r"></div>
                    </div>
                    <span className="text-xs mt-1 block">Ocean Blue</span>
                  </button>
                  
                  <button
                    onClick={() => updateRoomColors('#f5e6ff', '#d4a6ff')}
                    className="p-2 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors"
                  >
                    <div className="flex h-12">
                      <div className="flex-1 bg-[#f5e6ff] rounded-l"></div>
                      <div className="flex-1 bg-[#d4a6ff] rounded-r"></div>
                    </div>
                    <span className="text-xs mt-1 block">Purple Dream</span>
                  </button>
                  
                  <button
                    onClick={() => updateRoomColors('#e8ffe8', '#a6d4a6')}
                    className="p-2 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors"
                  >
                    <div className="flex h-12">
                      <div className="flex-1 bg-[#e8ffe8] rounded-l"></div>
                      <div className="flex-1 bg-[#a6d4a6] rounded-r"></div>
                    </div>
                    <span className="text-xs mt-1 block">Forest Green</span>
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

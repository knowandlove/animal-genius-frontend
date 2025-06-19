import { motion } from 'framer-motion';
import { Package, Sparkles, Sofa, Palette, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIslandStore } from '@/stores/islandStore';
import { cn } from '@/lib/utils';
import DraggableItemSticker from './drag-drop/DraggableItemSticker';

export default function RoomDecoratorView() {
  const inventory = useIslandStore((state) => state.inventory);
  const draftRoom = useIslandStore((state) => state.draftRoom);
  const selectInventoryItem = useIslandStore((state) => state.selectInventoryItem);
  const selectedItem = useIslandStore((state) => state.inventory.selectedItem);

  // Filter inventory for room items only
  const roomItems = inventory.items.filter(item => 
    item.type === 'room_decoration' || item.type === 'room_furniture'
  );

  // Categorize items
  const furnitureItems = roomItems.filter(item => 
    item.type === 'room_furniture' || 
    ['chair', 'table', 'lamp', 'clock'].some(keyword => item.id.includes(keyword))
  );
  
  const wallItems = roomItems.filter(item => 
    ['poster', 'picture', 'painting', 'wall'].some(keyword => item.id.includes(keyword))
  );
  
  const floorItems = roomItems.filter(item => 
    ['rug', 'carpet', 'mat', 'fuzzy'].some(keyword => item.id.includes(keyword)) ||
    ['plant', 'potted'].some(keyword => item.id.includes(keyword))
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
          <TabsTrigger value="walls" className="flex items-center gap-1">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Walls</span>
          </TabsTrigger>
          <TabsTrigger value="floors" className="flex items-center gap-1">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Floors</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="furniture" className="mt-0">
            <div className="grid grid-cols-4 gap-2">
              {renderItemGrid(furnitureItems, 'furniture')}
            </div>
          </TabsContent>

          <TabsContent value="walls" className="mt-0">
            <div className="grid grid-cols-4 gap-2">
              {renderItemGrid(wallItems, 'walls')}
            </div>
          </TabsContent>

          <TabsContent value="floors" className="mt-0">
            <div className="grid grid-cols-4 gap-2">
              {renderItemGrid(floorItems, 'floors')}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

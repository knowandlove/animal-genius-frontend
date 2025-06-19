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
  
  console.log('Inventory items:', inventory.items);
  console.log('Room items:', roomItems);

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

  const getRarityBadge = (item: any) => {
    if (item.rarity === 'rare') {
      return <Badge className="absolute top-1 right-1 text-xs px-1 bg-purple-500">★</Badge>;
    }
    if (item.rarity === 'legendary') {
      return <Badge className="absolute top-1 right-1 text-xs px-1 bg-yellow-500">⭐</Badge>;
    }
    return null;
  };

  const renderItemGrid = (items: any[]) => {
    if (items.length === 0) {
      return (
        <div className="col-span-4 text-center py-8">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-muted-foreground">
            No items in this category yet
          </p>
        </div>
      );
    }

    return items.map((item) => (
      <DraggableItemSticker
        key={item.id}
        item={item}
        isSelected={selectedItem === item.id}
        onClick={() => selectInventoryItem(
          selectedItem === item.id ? undefined : item.id
        )}
      />
    ));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          <strong>How to decorate:</strong> Drag items from below and drop them in your room. 
          Click placed items to remove them.
        </p>
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
            <div className="grid grid-cols-2 gap-2">
              {renderItemGrid(furnitureItems)}
            </div>
          </TabsContent>

          <TabsContent value="walls" className="mt-0">
            <div className="grid grid-cols-2 gap-2">
              {renderItemGrid(wallItems)}
            </div>
          </TabsContent>

          <TabsContent value="floors" className="mt-0">
            <div className="grid grid-cols-2 gap-2">
              {renderItemGrid(floorItems)}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Selected Item Details */}
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary/20 rounded-lg p-3 mt-4"
        >
          {(() => {
            const item = roomItems.find(i => i.id === selectedItem);
            if (!item) return null;
            
            return (
              <>
                <h4 className="font-semibold text-sm">{item.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                    item.rarity === 'rare' ? 'bg-purple-100 text-purple-700' :
                    item.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  )}>
                    {item.rarity === 'legendary' && <Sparkles className="w-3 h-3" />}
                    {item.rarity || 'common'}
                  </div>
                  {item.quantity && item.quantity > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      {item.quantity}x owned
                    </Badge>
                  )}
                </div>
              </>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}

import { motion } from 'framer-motion';
import { Package, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useIslandStore } from '@/stores/islandStore';
import { cn } from '@/lib/utils';
import DraggableItem from './drag-drop/DraggableItem';

export default function RoomDecoratorView() {
  const inventory = useIslandStore((state) => state.inventory);
  const draftRoom = useIslandStore((state) => state.draftRoom);
  const selectInventoryItem = useIslandStore((state) => state.selectInventoryItem);
  const selectedItem = useIslandStore((state) => state.inventory.selectedItem);

  // Filter inventory for room items only
  const roomItems = inventory.items.filter(item => 
    item.type === 'room_decoration' || item.type === 'room_furniture'
  );

  // Group by rarity
  const itemsByRarity = {
    common: roomItems.filter(item => item.rarity === 'common'),
    rare: roomItems.filter(item => item.rarity === 'rare'),
    legendary: roomItems.filter(item => item.rarity === 'legendary'),
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'rare': return 'border-purple-400 bg-purple-50';
      case 'legendary': return 'border-yellow-400 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>How to decorate:</strong> Drag items from below and drop them in your room. 
          Click placed items to remove them.
        </p>
      </div>

      {/* Inventory Items */}
      {roomItems.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-3" />
          <p className="text-muted-foreground">
            No room decorations owned yet.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Visit the store to buy furniture!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(['common', 'rare', 'legendary'] as const).map((rarity) => {
            const items = itemsByRarity[rarity];
            if (items.length === 0) return null;

            return (
              <div key={rarity}>
                <h3 className="font-semibold text-sm uppercase text-gray-600 mb-2 flex items-center gap-2">
                  {rarity === 'legendary' && <Sparkles className="w-4 h-4 text-yellow-500" />}
                  {rarity} Items
                  <Badge variant="secondary" className="text-xs">
                    {items.length}
                  </Badge>
                </h3>
                
                <div className="grid grid-cols-2 gap-2">
                  {items.map((item) => (
                    <DraggableItem
                      key={item.id}
                      item={item}
                      isSelected={selectedItem === item.id}
                      onClick={() => selectInventoryItem(
                        selectedItem === item.id ? undefined : item.id
                      )}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                <div className={cn(
                  "inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs",
                  getRarityColor(item.rarity || 'common')
                )}>
                  {item.rarity === 'legendary' && <Sparkles className="w-3 h-3" />}
                  {item.rarity || 'common'}
                </div>
              </>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}
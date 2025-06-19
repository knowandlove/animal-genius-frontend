import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { InventoryItem } from '@/stores/islandStore';
import { useIslandStore } from '@/stores/islandStore';

interface DraggableItemStickerProps {
  item: InventoryItem;
  isSelected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export default function DraggableItemSticker({ 
  item, 
  isSelected, 
  disabled, 
  onClick 
}: DraggableItemStickerProps) {
  const startDragging = useIslandStore((state) => state.startDragging);
  const stopDragging = useIslandStore((state) => state.stopDragging);
  const placeItem = useIslandStore((state) => state.placeItem);
  const inventoryMode = useIslandStore((state) => state.ui.inventoryMode);
  
  // Determine if this item can be placed in the room
  const canBePlaced = item.type === 'room_furniture' || item.type === 'room_decoration';
  
  console.log('Item:', item.id, 'Type:', item.type, 'Can be placed:', canBePlaced);

  const handleDragStart = (e: React.DragEvent) => {
    console.log('DragStart triggered for:', item.id);
    console.log('Can be placed:', canBePlaced);
    console.log('Disabled:', disabled);
    
    if (!canBePlaced || disabled) {
      e.preventDefault();
      console.log('Drag prevented');
      return;
    }
    
    // Set drag data
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', item.id);
    
    // Create a custom drag image
    const dragImage = new Image();
    dragImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E';
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Start dragging in store
    startDragging({
      itemId: item.id,
      fromInventory: true,
    });
    
    console.log('Drag started successfully');
  };
  
  const handleDragEnd = () => {
    stopDragging();
  };
  
  const handleClick = (e: React.MouseEvent) => {
    onClick();
    
    // If item is selected and we're in room mode, place it in center of room
    if (isSelected && inventoryMode === 'room' && canBePlaced) {
      console.log('Placing item via click:', item.id);
      // Place in center of room
      placeItem(item.id, 50, 50);
      
      // Check the store state after placing
      setTimeout(() => {
        const state = useIslandStore.getState();
        console.log('Draft room after placement:', state.draftRoom.placedItems);
        console.log('Inventory after placement:', state.inventory.items);
      }, 100);
    }
  };

  const getItemIcon = (item: InventoryItem) => {
    // Convert underscores to check for keywords
    const normalizedId = item.id.replace(/_/g, '');
    
    if (normalizedId.includes('chair') || item.id === 'cozy_chair' || item.id === 'gaming_chair') return '🪑';
    if (normalizedId.includes('table') || item.id === 'wooden_table') return '🪵';
    if (normalizedId.includes('lamp') || item.id === 'floor_lamp') return '💡';
    if (normalizedId.includes('plant') || item.id === 'potted_plant') return '🪴';
    if (normalizedId.includes('poster')) return '🖼️';
    if (normalizedId.includes('rug') || item.id === 'rug_circle') return '🟫';
    if (normalizedId.includes('clock') || item.id === 'wall_clock') return '🕐';
    if (normalizedId.includes('bookshelf')) return '📚';
    if (normalizedId.includes('bean') || item.id === 'bean_bag') return '🛋️';
    if (normalizedId.includes('treasure') || item.id === 'treasure_chest') return '💎';
    if (item.type.includes('furniture')) return '🪑';
    if (item.type.includes('decoration')) return '🪴';
    if (item.type.includes('hat')) return '🎩';
    if (item.type.includes('glasses')) return '👓';
    return '📦';
  };

  return (
    <div
      className={cn(
        "relative p-3 border rounded-lg transition-all select-none group",
        "hover:border-primary hover:shadow-md",
        isSelected && "border-primary bg-primary/5 ring-2 ring-primary/20",
        !canBePlaced && disabled && "opacity-50",
        canBePlaced && !disabled && "cursor-grab active:cursor-grabbing hover:transform hover:scale-105"
      )}
      onClick={handleClick}
      draggable={canBePlaced && !disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Click to place hint */}
      {canBePlaced && !disabled && isSelected && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
          Click again to place!
        </div>
      )}
      
      {/* Item Icon/Preview */}
      <div className="aspect-square bg-gray-100 rounded mb-1 flex items-center justify-center pointer-events-none">
        <span className="text-2xl">
          {getItemIcon(item)}
        </span>
      </div>

      {/* Item Name */}
      <p className="text-xs font-medium truncate">{item.name}</p>

      {/* Quantity Badge */}
      {item.quantity && item.quantity > 1 && (
        <Badge variant="secondary" className="absolute top-1 right-1 text-xs px-1">
          {item.quantity}x
        </Badge>
      )}

      {/* Rarity Badge */}
      {item.rarity && item.rarity !== 'common' && (
        <Badge 
          variant={item.rarity === 'rare' ? 'default' : 'destructive'}
          className="absolute bottom-1 right-1 text-xs px-1 py-0"
        >
          {item.rarity === 'rare' ? '★' : '⭐'}
        </Badge>
      )}

      {/* Drag Indicator */}
      {canBePlaced && !disabled && (
        <div className="absolute top-1 left-1 opacity-0 hover:opacity-30 transition-opacity">
          <div className="flex flex-col gap-0.5">
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
            </div>
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

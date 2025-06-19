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

  const handleDragStart = (e: React.DragEvent) => {
    if (!canBePlaced || disabled) {
      e.preventDefault();
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
  };
  
  const handleDragEnd = () => {
    stopDragging();
  };
  
  const handleClick = (e: React.MouseEvent) => {
    onClick();
    
    // If item is selected and we're in room mode, place it in center of room
    if (isSelected && inventoryMode === 'room' && canBePlaced) {
      // Add some randomization so items don't stack
      const randomOffset = () => Math.random() * 20 - 10; // -10 to +10
      const x = 50 + randomOffset();
      const y = 50 + randomOffset();
      placeItem(item.id, x, y);
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
        "relative p-2 border rounded-lg transition-all select-none group",
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
      {/* Item Icon/Preview */}
      <div className="aspect-square bg-gray-100 rounded flex items-center justify-center pointer-events-none">
        <span className="text-2xl">
          {getItemIcon(item)}
        </span>
      </div>

      {/* Item Name */}
      <p className="text-xs font-medium truncate mt-1">{item.name}</p>

      {/* Quantity Badge */}
      {item.quantity && item.quantity > 1 && (
        <Badge variant="secondary" className="absolute top-1 right-1 text-xs px-1 scale-75">
          {item.quantity}x
        </Badge>
      )}

      {/* Rarity Badge */}
      {item.rarity && item.rarity !== 'common' && (
        <Badge 
          variant={item.rarity === 'rare' ? 'default' : 'destructive'}
          className="absolute bottom-1 right-1 text-xs px-1 py-0 scale-75"
        >
          {item.rarity === 'rare' ? '★' : '⭐'}
        </Badge>
      )}
    </div>
  );
}

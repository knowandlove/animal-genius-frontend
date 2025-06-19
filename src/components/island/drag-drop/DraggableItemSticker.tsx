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
  
  // Determine if this item can be placed in the room
  const canBePlaced = item.type.includes('furniture') || item.type.includes('decoration');

  const handleDragStart = (e: React.DragEvent) => {
    if (!canBePlaced || disabled) {
      e.preventDefault();
      return;
    }
    
    // Set drag data
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', item.id);
    
    // Start dragging in store
    startDragging({
      itemId: item.id,
      fromInventory: true,
    });
  };
  
  const handleDragEnd = () => {
    stopDragging();
  };

  const getItemIcon = (item: InventoryItem) => {
    if (item.id.includes('chair')) return '🪑';
    if (item.id.includes('table')) return '🪵';
    if (item.id.includes('lamp')) return '💡';
    if (item.id.includes('plant') || item.id.includes('potted')) return '🪴';
    if (item.id.includes('poster')) return '🖼️';
    if (item.id.includes('rug') || item.id.includes('fuzzy')) return '🟫';
    if (item.id.includes('clock')) return '🕐';
    if (item.type.includes('furniture')) return '🪑';
    if (item.type.includes('decoration')) return '🪴';
    if (item.type.includes('hat')) return '🎩';
    if (item.type.includes('glasses')) return '👓';
    return '📦';
  };

  return (
    <div
      className={cn(
        "relative p-3 border rounded-lg transition-all select-none",
        "hover:border-primary hover:shadow-md",
        isSelected && "border-primary bg-primary/5",
        !canBePlaced && disabled && "opacity-50",
        canBePlaced && !disabled && "cursor-grab active:cursor-grabbing"
      )}
      onClick={onClick}
      draggable={canBePlaced && !disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
          {item.quantity}
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

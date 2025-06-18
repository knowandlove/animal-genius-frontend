import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { InventoryItem } from '@/stores/islandStore';

interface DraggableItemProps {
  item: InventoryItem;
  isSelected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export default function DraggableItem({ item, isSelected, disabled, onClick }: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `inventory-${item.id}`,
    disabled: disabled,
    data: {
      type: 'inventory-item',
      item,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  // Determine if this item can be placed in the room
  const canBePlaced = item.type.includes('furniture') || item.type.includes('decoration');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative p-3 border rounded-lg transition-all select-none",
        "hover:border-primary hover:shadow-md",
        isSelected && "border-primary bg-primary/5",
        !canBePlaced && disabled && "opacity-50",
        isDragging && "cursor-grabbing z-50",
        !isDragging && canBePlaced && !disabled && "cursor-grab"
      )}
      onClick={onClick}
      {...(canBePlaced && !disabled ? listeners : {})}
      {...(canBePlaced && !disabled ? attributes : {})}
    >
      {/* Item Icon/Preview */}
      <div className="aspect-square bg-gray-100 rounded mb-1 flex items-center justify-center">
        {/* TODO: Replace with actual item icons */}
        <span className="text-2xl">
          {item.type.includes('furniture') ? '🪑' : 
           item.type.includes('decoration') ? '🪴' : 
           item.type.includes('hat') ? '🎩' : 
           item.type.includes('glasses') ? '👓' : '📦'}
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
        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-1 h-1 bg-gray-400 rounded-full mb-0.5" />
          <div className="w-1 h-1 bg-gray-400 rounded-full mb-0.5" />
          <div className="w-1 h-1 bg-gray-400 rounded-full" />
        </div>
      )}
    </div>
  );
}

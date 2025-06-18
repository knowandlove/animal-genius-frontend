import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { Hotspot } from '@/stores/islandStore';

interface DroppableHotspotProps {
  hotspot: Hotspot;
  isHighlighted: boolean;
  isOccupied: boolean;
  showGrid: boolean;
  children?: React.ReactNode;
}

export default function DroppableHotspot({ 
  hotspot, 
  isHighlighted, 
  isOccupied,
  showGrid,
  children 
}: DroppableHotspotProps) {
  const {
    isOver,
    setNodeRef,
  } = useDroppable({
    id: `hotspot-${hotspot.x}-${hotspot.y}`,
    disabled: isOccupied,
    data: {
      type: 'hotspot',
      hotspot,
    },
  });

  // Calculate pixel position (125px per grid cell, 50px offset)
  const position = {
    left: `${hotspot.x * 125 + 50}px`,
    top: `${hotspot.y * 125 + 50}px`,
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute w-[125px] h-[125px] transition-all duration-200",
        // Grid visibility
        showGrid && "border border-dashed border-white/30",
        // Hover states
        showGrid && !isOccupied && "hover:bg-green-400/20",
        // Highlight states
        isHighlighted && !isOccupied && "bg-green-400/30 animate-pulse",
        // Drag over state
        isOver && !isOccupied && "bg-green-500/40 scale-105",
        // Occupied state
        isOccupied && showGrid && "cursor-not-allowed bg-red-400/10"
      )}
      style={position}
    >
      {/* Visual feedback when dragging over */}
      {isOver && !isOccupied && (
        <div className="absolute inset-2 border-2 border-green-500 rounded-lg animate-pulse" />
      )}
      
      {/* Grid coordinates (debug/tutorial) */}
      {showGrid && (
        <div className="absolute top-1 left-1 text-xs text-white/50 select-none">
          {hotspot.x},{hotspot.y}
        </div>
      )}
      
      {/* Placed items */}
      {children}
    </div>
  );
}

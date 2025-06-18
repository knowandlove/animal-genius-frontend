import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragMoveEvent,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  DragOverlay,
  closestCenter,
  MeasuringStrategy,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useIslandStore } from '@/stores/islandStore';
import DragPreview from './DragPreview';

// Measuring configuration for better performance
const measuringConfig = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

interface DragDropContextProps {
  children: React.ReactNode;
}

export default function DragDropContext({ children }: DragDropContextProps) {
  const {
    ui,
    startDragging,
    stopDragging,
    highlightHotspots,
    placeItem,
    inventory,
  } = useIslandStore();

  // Custom sensors with activation constraints - MUST be inside component
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8, // 8px movement required to start drag
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250, // 250ms hold required on touch
      tolerance: 5, // 5px movement tolerance
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    // Extract item data from the draggable id
    const [source, itemId] = active.id.toString().split('-');
    
    if (source === 'inventory') {
      startDragging({
        itemId,
        fromInventory: true,
      });
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { over } = event;
    
    // Highlight hotspots when dragging over them
    if (over && over.id.toString().startsWith('hotspot-')) {
      const hotspotId = over.id.toString().replace('hotspot-', '');
      highlightHotspots([hotspotId]);
    } else {
      highlightHotspots([]);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && over.id.toString().startsWith('hotspot-')) {
      // Extract grid coordinates from hotspot id
      const [, x, y] = over.id.toString().split('-').map(Number);
      
      if (!isNaN(x) && !isNaN(y) && ui.draggedItem) {
        // Place the item at the grid position
        placeItem(ui.draggedItem.itemId, x, y);
      }
    }
    
    // Clean up drag state
    stopDragging();
    highlightHotspots([]);
  };

  const handleDragCancel = () => {
    stopDragging();
    highlightHotspots([]);
  };

  // Get the dragged item for preview
  const draggedItem = ui.draggedItem
    ? inventory.items.find(item => item.id === ui.draggedItem.itemId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuringConfig}
      modifiers={[restrictToWindowEdges]}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {draggedItem ? <DragPreview item={draggedItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

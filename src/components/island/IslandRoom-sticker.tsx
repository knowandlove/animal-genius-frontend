import { useRef, useState } from 'react';
import { useIslandStore, ROOM_ITEM_LIMIT } from '@/stores/islandStore';
import { cn } from '@/lib/utils';
import { AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { getAssetUrl } from '@/utils/cloud-assets';
import { useStoreItems } from '@/contexts/StoreDataContext';

interface DragState {
  itemId: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  currentX?: number;
  currentY?: number;
}

export default function IslandRoomSticker() {
  const roomRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const [dropPreview, setDropPreview] = useState<{ x: number; y: number } | null>(null);
  
  // Get store items for image lookup
  const storeItems = useStoreItems();
  
  const { 
    room, 
    ui,
    removeItem,
    moveItem,
    draftRoom,
    startDragging,
    stopDragging,
  } = useIslandStore();
  
  // Use draft state when in edit mode
  const isEditingRoom = ui.inventoryMode === 'room';
  const displayRoom = isEditingRoom ? { ...room, placedItems: draftRoom.placedItems } : room;

  // Sort items by z-index for proper layering
  const sortedItems = [...displayRoom.placedItems].sort((a, b) => 
    (a.zIndex || 0) - (b.zIndex || 0)
  );

  // Get item data from store catalog
  const getItemData = (itemId: string) => {
    const item = storeItems?.find((item: any) => item.id === itemId);
    return item || null;
  };

  const handleItemMouseDown = (e: React.MouseEvent, item: any, displayX: number, displayY: number) => {
    if (!isEditingRoom || !roomRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = roomRef.current.getBoundingClientRect();
    // Use the actual displayed position, not the stored position
    const itemX = (displayX / 100) * rect.width;
    const itemY = (displayY / 100) * rect.height;
    const offsetX = e.clientX - rect.left - itemX;
    const offsetY = e.clientY - rect.top - itemY;
    
    setDragState({
      itemId: item.id,
      startX: e.clientX,
      startY: e.clientY,
      offsetX,
      offsetY,
    });
    
    setShowTrash(true);
    
    // Start dragging in store
    startDragging({
      itemId: item.itemId,
      fromInventory: false,
      originalPosition: { x: displayX, y: displayY }
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState || !roomRef.current) return;
    
    const rect = roomRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - dragState.offsetX) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragState.offsetY) / rect.height) * 100;
    
    // Constrain to room bounds
    const constrainedX = Math.max(5, Math.min(95, x));
    const constrainedY = Math.max(5, Math.min(95, y));
    
    // Update drag state with current position for preview
    setDragState(prev => prev ? { ...prev, currentX: constrainedX, currentY: constrainedY } : null);
    
    moveItem(dragState.itemId, constrainedX, constrainedY);
    
    // Check if over trash
    const trashRect = document.getElementById('trash-zone')?.getBoundingClientRect();
    if (trashRect) {
      const overTrashArea = 
        e.clientX >= trashRect.left && 
        e.clientX <= trashRect.right && 
        e.clientY >= trashRect.top && 
        e.clientY <= trashRect.bottom;
      setOverTrash(overTrashArea);
    }
  };

  const handleMouseUp = () => {
    if (dragState && overTrash) {
      // Remove the item if dropped on trash
      removeItem(dragState.itemId);
    }
    
    setDragState(null);
    setShowTrash(false);
    setOverTrash(false);
    stopDragging();
  };

  // Handle drag from inventory
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropPreview(null); // Clear preview
    
    if (!roomRef.current || !ui.draggedItem?.fromInventory) return;
    
    const rect = roomRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Place the item from inventory
    const { placeItem } = useIslandStore.getState();
    placeItem(ui.draggedItem.itemId, x, y);
    
    stopDragging();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    // Show drop preview when dragging from inventory
    if (roomRef.current && ui.draggedItem?.fromInventory) {
      const rect = roomRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setDropPreview({ x, y });
    }
  };
  
  const handleDragLeave = () => {
    setDropPreview(null);
  };

  const getItemIcon = (itemId: string) => {
    // Convert to lowercase and normalize
    const normalizedId = itemId.toLowerCase().replace(/[_-]/g, '');
    
    // Check for specific items first
    if (itemId === 'cozy_chair' || itemId === 'gaming_chair') return '🪑';
    if (itemId === 'wooden_table') return '🪵';
    if (itemId === 'floor_lamp') return '💡';
    if (itemId === 'potted_plant' || itemId === 'floor_plant') return '🪴';
    if (itemId === 'wall_clock') return '🕐';
    if (itemId === 'bean_bag') return '🛋️';
    if (itemId === 'treasure_chest') return '💎';
    if (itemId === 'rug_circle') return '🟫';
    
    // Then check for keywords
    if (normalizedId.includes('chair')) return '🪑';
    if (normalizedId.includes('table') || normalizedId.includes('desk')) return '🪵';
    if (normalizedId.includes('lamp') || normalizedId.includes('light')) return '💡';
    if (normalizedId.includes('plant') || normalizedId.includes('flower')) return '🪴';
    if (normalizedId.includes('poster') || normalizedId.includes('picture')) return '🖼️';
    if (normalizedId.includes('rug') || normalizedId.includes('carpet')) return '🟫';
    if (normalizedId.includes('clock') || normalizedId.includes('time')) return '🕐';
    if (normalizedId.includes('book') || normalizedId.includes('shelf')) return '📚';
    if (normalizedId.includes('bean') || normalizedId.includes('sofa') || normalizedId.includes('couch')) return '🛋️';
    if (normalizedId.includes('treasure') || normalizedId.includes('chest') || normalizedId.includes('box')) return '💎';
    if (normalizedId.includes('bed')) return '🛏️';
    if (normalizedId.includes('mirror')) return '🪞';
    if (normalizedId.includes('window')) return '🪟';
    if (normalizedId.includes('door')) return '🚪';
    
    // Debug: Log unmatched items
    console.log('No icon match for item:', itemId);
    return '📦';
  };

  // Scale items based on Y position to create depth
  const getScaleFromY = (yPercent: number): number => {
    // Items at top (y=0) are smaller, items at bottom (y=100) are larger
    // This creates a sense of depth in the room
    const minScale = 0.6;  // Smallest size at the back
    const maxScale = 1.2;  // Largest size at the front
    return minScale + (yPercent / 100) * (maxScale - minScale);
  };



  return (
    <div className="w-full h-full flex justify-center items-center">
      <div
        className="relative overflow-hidden rounded-lg shadow-inner bg-gray-100 w-full h-full"
      >
      <div 
        ref={roomRef}
        className="absolute inset-0 w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Room Background - Customizable */}
        <div className="absolute inset-0 z-0">
          {/* Wall */}
          <div 
            className="absolute inset-0 h-[70%]"
            style={{
              backgroundColor: displayRoom.wallColor || '#f5ddd9',
              backgroundImage: displayRoom.wallPattern ? `url(/patterns/${displayRoom.wallPattern})` : 'none',
              backgroundSize: displayRoom.wallPattern ? '100px 100px' : 'auto',
            }}
          />
          {/* Floor */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-[30%]"
            style={{
              backgroundColor: displayRoom.floorColor || '#d4875f',
              backgroundImage: displayRoom.floorPattern ? `url(/patterns/${displayRoom.floorPattern})` : 'none',
              backgroundSize: displayRoom.floorPattern ? '100px 100px' : 'auto',
            }}
          />
        </div>
        
        {/* Room Item Counter - Show when editing */}
        {isEditingRoom && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg z-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {displayRoom.placedItems.length}/{ROOM_ITEM_LIMIT} items
              </span>
              {displayRoom.placedItems.length >= ROOM_ITEM_LIMIT && (
                <span className="text-xs text-yellow-300">(Room Full!)</span>
              )}
            </div>
            {displayRoom.placedItems.length > ROOM_ITEM_LIMIT * 0.8 && displayRoom.placedItems.length < ROOM_ITEM_LIMIT && (
              <span className="text-xs text-yellow-300 block mt-1">
                Almost full - {ROOM_ITEM_LIMIT - displayRoom.placedItems.length} spots left
              </span>
            )}
          </div>
        )}

        {/* Room Structure - Shelves and Baseboard */}
        <img 
          src={getAssetUrl('/rooms/shelves-and-trim.png')} 
          alt="Room shelves"
          className="absolute inset-0 w-full h-full z-5 pointer-events-none"
          style={{ objectFit: 'cover' }}
        />

        {/* Drop Preview (when dragging from inventory) */}
        {dropPreview && ui.draggedItem?.fromInventory && (() => {
          const itemData = getItemData(ui.draggedItem.itemId);
          return (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${dropPreview.x}%`,
                top: `${dropPreview.y}%`,
                transform: `translate(-50%, -50%) scale(${getScaleFromY(dropPreview.y)})`,
                zIndex: Math.floor(dropPreview.y * 10),
                opacity: 0.5
              }}
            >
              {itemData?.imageUrl ? (
                <div className="relative" style={{ width: '10vw', maxWidth: '120px', height: '10vw', maxHeight: '120px' }}>
                  <img
                    src={itemData.imageUrl}
                    alt={itemData.name}
                    className="opacity-75"
                    style={{ 
                      filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))',
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              ) : (
                <div className="bg-blue-200/50 backdrop-blur rounded-lg p-3 border-2 border-blue-400 border-dashed shadow-lg">
                  <span className="text-3xl block">
                    {getItemIcon(ui.draggedItem.itemId)}
                  </span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Placed Items */}
        <div className="absolute inset-0 z-10">
        {sortedItems.map((item, index) => {
          // Handle both old grid system (0-3) and new percentage system (0-100)
          const isOldGrid = item.x <= 3 && item.y <= 3;
          const xPos = isOldGrid ? (item.x / 3) * 80 + 10 : item.x;
          const yPos = isOldGrid ? (item.y / 3) * 80 + 10 : item.y;
          
          const scale = getScaleFromY(yPos);
          const itemData = getItemData(item.itemId);
          
          return (
            <div
              key={item.id}
              className="absolute cursor-move transition-transform"
              style={{
                left: `${xPos}%`,
                top: `${yPos}%`,
                transform: `translate(-50%, -50%) scale(${dragState?.itemId === item.id ? scale * 1.1 : scale})`,
                zIndex: Math.floor(yPos * 10),
                opacity: dragState?.itemId === item.id ? 0.6 : 1
              }}
              onMouseDown={(e) => handleItemMouseDown(e, item, xPos, yPos)}
            >
              {/* Item Visual */}
              {itemData?.imageUrl ? (
                <div className="relative" style={{ width: '10vw', maxWidth: '120px', height: '10vw', maxHeight: '120px' }}>
                  <img
                    src={itemData.imageUrl}
                    alt={itemData.name}
                    style={{ 
                      filter: dragState?.itemId === item.id ? 'brightness(0.8)' : 'none',
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="bg-white/90 backdrop-blur rounded-lg p-3 select-none border-2 border-gray-200 shadow-lg">
                  <span className="text-3xl block">
                    {getItemIcon(item.itemId)}
                  </span>
                </div>
              )}
              
              {/* Item label */}
              {isEditingRoom && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-black/70 text-white px-2 py-1 rounded whitespace-nowrap">
                  {itemData?.name || item.itemId}
                </div>
              )}
            </div>
          );
        })}
        </div>

        {/* Trash Zone - Centered below avatar */}
        <AnimatePresence>
        {showTrash && (
          <div
            id="trash-zone"
            className="absolute left-1/2 bottom-[8%] transform -translate-x-1/2 z-50 transition-all duration-200"
            style={{
              transform: showTrash ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0)',
              opacity: showTrash ? 1 : 0
            }}
          >
            <div className={cn(
              "bg-red-500 text-white rounded-full shadow-lg transition-all",
              "w-16 h-16 flex items-center justify-center",
              overTrash ? "bg-red-600 scale-125 shadow-2xl" : ""
            )}>
              <Trash2 className="w-8 h-8" />
            </div>
          </div>
        )}
        </AnimatePresence>

      </div>
    </div>
    </div>
  );
}

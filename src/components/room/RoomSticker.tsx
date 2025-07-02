import { useRef, useState, useEffect } from 'react';
import { useRoomStore, ROOM_ITEM_LIMIT } from '@/stores/roomStore';
import { cn } from '@/lib/utils';
import LayeredAvatarRoom from '@/components/avatar-v2/LayeredAvatarRoom';
import { AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { getAssetUrl } from '@/utils/cloud-assets';

interface DragState {
  itemId: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  currentX?: number;
  currentY?: number;
}

export default function RoomSticker() {
  const roomRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const [dropPreview, setDropPreview] = useState<{ x: number; y: number } | null>(null);
  
  const { 
    avatar, 
    room, 
    ui,
    inventory,
    removeItem,
    moveItem,
    placeItem,
    draftAvatar,
    draftRoom,
    startDragging,
    stopDragging,
    stopArranging,
  } = useRoomStore();
  
  // Listen for placeItemCenter event from room decorator
  useEffect(() => {
    const handlePlaceItemCenter = (event: CustomEvent) => {
      const { itemId } = event.detail;
      // Place item in center of room (50%, 50%)
      placeItem(itemId, 50, 50);
    };
    
    window.addEventListener('placeItemCenter', handlePlaceItemCenter as EventListener);
    return () => {
      window.removeEventListener('placeItemCenter', handlePlaceItemCenter as EventListener);
    };
  }, [placeItem]);
  
  // Use draft states when in edit modes
  const isEditingAvatar = ui.inventoryMode === 'avatar';
  const isEditingRoom = ui.inventoryMode === 'room';
  const displayAvatar = isEditingAvatar ? { ...avatar, equipped: draftAvatar.equipped } : avatar;
  const displayRoom = isEditingRoom ? { ...room, placedItems: draftRoom.placedItems } : room;

  // Sort items by z-index for proper layering
  const sortedItems = [...displayRoom.placedItems].sort((a, b) => 
    (a.zIndex || 0) - (b.zIndex || 0)
  );

  // Get item details from inventory
  const getItemDetails = (itemId: string) => {
    return inventory.items.find(item => item.id === itemId);
  };

  const handleItemMouseDown = (e: React.MouseEvent, item: any, displayX: number, displayY: number) => {
    if (!isEditingRoom || !roomRef.current || !ui.isArranging) return;
    
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
    const { placeItem } = useRoomStore.getState();
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
    // Convert underscores to check for keywords
    const normalizedId = itemId.replace(/_/g, '');
    
    if (normalizedId.includes('chair') || itemId === 'cozy_chair' || itemId === 'gaming_chair') return '🪑';
    if (normalizedId.includes('table') || itemId === 'wooden_table') return '🪵';
    if (normalizedId.includes('lamp') || itemId === 'floor_lamp') return '💡';
    if (normalizedId.includes('plant') || itemId === 'potted_plant') return '🪴';
    if (normalizedId.includes('poster')) return '🖼️';
    if (normalizedId.includes('rug') || itemId === 'rug_circle') return '🟫';
    if (normalizedId.includes('clock') || itemId === 'wall_clock') return '🕐';
    if (normalizedId.includes('bookshelf')) return '📚';
    if (normalizedId.includes('bean') || itemId === 'bean_bag') return '🛋️';
    if (normalizedId.includes('treasure') || itemId === 'treasure_chest') return '💎';
    if (normalizedId.includes('fuzzy')) return '🟫';
    return '📦';
  };

  // Dynamic scaling based on Y position (perspective effect)
  const getScaleFromY = (yPercent: number): number => {
    // Scale from 0.4 at top (y=0) to 1.0 at bottom (y=100)
    const minScale = 0.4;
    const maxScale = 1.0;
    const scale = minScale + (yPercent / 100) * (maxScale - minScale);
    return scale;
  };



  return (
    <>
      <div
        className="relative w-full h-full overflow-hidden rounded-lg shadow-inner bg-gray-100"
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
        
        {/* Room Structure - Shelves and Baseboard */}
        <img 
          src={getAssetUrl('/rooms/shelves-and-trim.png')} 
          alt="Room shelves"
          className="absolute inset-0 w-full h-full z-5 pointer-events-none"
          style={{ objectFit: 'cover' }}
        />

        {/* Drop Preview (when dragging from inventory) */}
        {dropPreview && ui.draggedItem?.fromInventory && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${dropPreview.x}%`,
            top: `${dropPreview.y}%`,
            transform: `translate(-50%, -50%) scale(${getScaleFromY(dropPreview.y)})`,
            zIndex: Math.floor(dropPreview.y * 10),
            opacity: 0.7
          }}
        >
          {(() => {
            const previewItem = getItemDetails(ui.draggedItem.itemId);
            return previewItem?.imageUrl ? (
              <img 
                src={previewItem.imageUrl} 
                alt={previewItem.name || ui.draggedItem.itemId}
                className="opacity-70"
                style={{
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '200px',
                  maxHeight: '200px',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                }}
              />
            ) : (
              <div 
                className="bg-white/80 backdrop-blur rounded-lg border-2 border-blue-400 border-dashed shadow-lg flex items-center justify-center"
                style={{
                  width: '80px',
                  height: '80px'
                }}
              >
                <span className="text-3xl">{getItemIcon(ui.draggedItem.itemId)}</span>
              </div>
            );
          })()}
        </div>
        )}

        {/* Placed Items */}
        <div className="absolute inset-0 z-10">
        {sortedItems.map((item, index) => {
          // Handle both old grid system (0-3) and new percentage system (0-100)
          const isOldGrid = item.x <= 3 && item.y <= 3;
          const xPos = isOldGrid ? (item.x / 3) * 80 + 10 : item.x;
          const yPos = isOldGrid ? (item.y / 3) * 80 + 10 : item.y;
          
          const scale = getScaleFromY(yPos);
          const itemDetails = getItemDetails(item.itemId);
          
          return (
            <div
              key={item.id}
              className={cn(
                "absolute transition-transform",
                ui.isArranging ? "cursor-move hover:scale-105" : "cursor-default"
              )}
              style={{
                left: `${xPos}%`,
                top: `${yPos}%`,
                transform: `translate(-50%, -50%) scale(${dragState?.itemId === item.id ? scale * 1.1 : scale})`,
                zIndex: Math.floor(yPos * 10),
                opacity: dragState?.itemId === item.id ? 0.6 : 1
              }}
              onMouseDown={(e) => handleItemMouseDown(e, item, xPos, yPos)}
            >
              {/* Draggable indicator when arranging */}
              {ui.isArranging && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap animate-bounce">
                  ✋ Drag to move
                </div>
              )}
              
              {/* Item Visual */}
              {itemDetails?.imageUrl ? (
                <img 
                  src={itemDetails.imageUrl} 
                  alt={itemDetails.name || item.itemId}
                  className="select-none"
                  style={{
                    width: 'auto',
                    height: 'auto',
                    maxWidth: '200px',
                    maxHeight: '200px',
                    filter: ui.isArranging ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' : 'none'
                  }}
                  draggable={false}
                />
              ) : (
                <div 
                  className="bg-white/90 backdrop-blur rounded-lg select-none border-2 border-gray-200 shadow-lg flex items-center justify-center"
                  style={{
                    width: '80px',
                    height: '80px'
                  }}
                >
                  <span className="text-3xl">{getItemIcon(item.itemId)}</span>
                </div>
              )}
              
              {/* Item label */}
              {isEditingRoom && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-black/70 text-white px-2 py-1 rounded whitespace-nowrap">
                  {itemDetails?.name || item.itemId}
                </div>
              )}
            </div>
          );
        })}
        </div>

        {!isEditingRoom && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${displayAvatar.position.x}%`,
                top: `${displayAvatar.position.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: Math.floor((displayAvatar.position.y) * 10), // Dynamic z-index
              }}
            >
              <LayeredAvatarRoom
                animalType={displayAvatar.type}
                items={displayAvatar.equipped}
                width={504}
                height={504}
                animated={displayAvatar.animation !== 'idle'}
              />
            </div>
          )}

        {/* Trash Zone */}
        <AnimatePresence>
        {showTrash && (
          <div
            id="trash-zone"
            className="absolute bottom-4 right-4 z-50 transition-all duration-200"
            style={{
              transform: showTrash ? 'scale(1)' : 'scale(0)',
              opacity: showTrash ? 1 : 0
            }}
          >
            <div className={cn(
              "bg-red-500 text-white rounded-full p-4 shadow-lg transition-all",
              overTrash ? "bg-red-600 scale-110" : ""
            )}>
              <Trash2 className="w-8 h-8" />
            </div>
            <p className="text-xs text-center mt-1 text-white bg-black/50 rounded px-2 py-1">
              Drop to delete
            </p>
          </div>
        )}
        </AnimatePresence>

        {/* Decorative Elements */}
        {!isEditingRoom && !isEditingAvatar && (
          <>
            {/* Sparkle effects */}
            <div className="absolute top-10 right-10 animate-pulse">
              <span className="text-2xl">✨</span>
            </div>
            <div className="absolute bottom-20 left-20 animate-pulse animation-delay-1000">
              <span className="text-xl">🌟</span>
            </div>
          </>
        )}
      </div>
    </div>
    
    {/* Save Button - Shows when arranging */}
    {ui.isArranging && (
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={() => stopArranging()}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg transition-all hover:scale-105 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save Room Layout
        </button>
      </div>
    )}
    </>
  );
}

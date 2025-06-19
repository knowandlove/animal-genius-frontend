import { useRef, useState } from 'react';
import { useIslandStore, ROOM_ITEM_LIMIT } from '@/stores/islandStore';
import { cn } from '@/lib/utils';
import LayeredAvatarDB from '@/components/avatar-v2/LayeredAvatarDB';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';

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
  
  const { 
    avatar, 
    room, 
    ui,
    removeItem,
    moveItem,
    draftAvatar,
    draftRoom,
    startDragging,
    stopDragging,
  } = useIslandStore();
  
  // Use draft states when in edit modes
  const isEditingAvatar = ui.inventoryMode === 'avatar';
  const isEditingRoom = ui.inventoryMode === 'room';
  const displayAvatar = isEditingAvatar ? { ...avatar, equipped: draftAvatar.equipped } : avatar;
  const displayRoom = isEditingRoom ? { ...room, placedItems: draftRoom.placedItems } : room;

  // Sort items by z-index for proper layering
  const sortedItems = [...displayRoom.placedItems].sort((a, b) => 
    (a.zIndex || 0) - (b.zIndex || 0)
  );

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

  // No scaling - all items same size
  const getScaleFromY = (yPercent: number): number => {
    return 1; // Always return scale of 1
  };



  return (
    <motion.div
      className="relative w-full overflow-hidden rounded-lg shadow-inner bg-gray-100"
      initial={{ scale: 1.2 }}
      animate={{ scale: isEditingRoom ? 0.85 : 1 }}
      transition={{ duration: 0.3 }}
      style={{ aspectRatio: '16/9' }} // Widescreen aspect ratio for rooms
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
        {/* Room Background */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundColor: '#f5f5f5', // Neutral gray background
            backgroundImage: room.theme !== 'blank' ? `url(/rooms/${room.theme}-room.jpg)` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
        </div>

        {/* Instructions (visible in room editing mode) */}
      {isEditingRoom && (
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm z-50">
          <p className="font-semibold mb-1">🏠 Room Decoration Mode</p>
          <p className="text-xs opacity-90">Drag items from inventory to place anywhere</p>
          <p className="text-xs opacity-90">Drag placed items to move them</p>
          <p className="text-xs opacity-90">Drag to trash can to delete</p>
          <div className="mt-2 pt-2 border-t border-white/20">
            <p className="text-xs font-semibold">
              Items placed: {sortedItems.length} / {ROOM_ITEM_LIMIT}
              {sortedItems.length >= ROOM_ITEM_LIMIT - 5 && (
                <span className="text-yellow-300 ml-1">(Almost full!)</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Drop Preview (when dragging from inventory) */}
      {dropPreview && ui.draggedItem?.fromInventory && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            left: `${dropPreview.x}%`,
            top: `${dropPreview.y}%`,
            transform: `translate(-50%, -50%) scale(${getScaleFromY(dropPreview.y)})`,
            zIndex: Math.floor(dropPreview.y * 10),
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
        >
          <div 
            className="bg-blue-200/50 backdrop-blur rounded-lg p-3 border-2 border-blue-400 border-dashed shadow-lg"
          >
            <span className="text-3xl block">
              {getItemIcon(ui.draggedItem.itemId)}
            </span>
          </div>
        </motion.div>
      )}

      {/* Placed Items */}
      <div className="absolute inset-0 z-10">
        {sortedItems.map((item, index) => {
          // Handle both old grid system (0-3) and new percentage system (0-100)
          const isOldGrid = item.x <= 3 && item.y <= 3;
          const xPos = isOldGrid ? (item.x / 3) * 80 + 10 : item.x;
          const yPos = isOldGrid ? (item.y / 3) * 80 + 10 : item.y;
          
          const scale = getScaleFromY(yPos);
          
          return (
            <motion.div
              key={item.id}
              className="absolute cursor-move transition-transform"
              style={{
                left: `${xPos}%`,
                top: `${yPos}%`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                zIndex: Math.floor(yPos * 10), // Z-index based on Y position with more granularity
              }}
              whileHover={{ scale: scale * 1.05 }}
              whileDrag={{ scale: scale * 1.1, opacity: 0.8 }}
              onMouseDown={(e) => handleItemMouseDown(e, item, xPos, yPos)}
              animate={{
                scale: dragState?.itemId === item.id ? scale * 1.1 : scale,
                opacity: dragState?.itemId === item.id ? 0.6 : 1,
              }}
            >
              {/* Item Visual */}
              <div 
                className="bg-white/90 backdrop-blur rounded-lg p-3 select-none border-2 border-gray-200 shadow-lg"
              >
                <span className="text-3xl block">
                  {getItemIcon(item.itemId)}
                </span>
              </div>
              
              {/* Item label */}
              {isEditingRoom && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-black/70 text-white px-2 py-1 rounded whitespace-nowrap">
                  {item.itemId}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

          {!isEditingRoom && (
            <motion.div
              className="absolute pointer-events-none"
              style={{
                left: `${displayAvatar.position.x}%`,
                top: `${displayAvatar.position.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: Math.floor((displayAvatar.position.y) * 10), // Dynamic z-index
              }}
              animate={{
                x: [0, 0, 0],
                y: displayAvatar.animation === 'idle' ? [0, -5, 0] : 0
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <LayeredAvatarDB
                animalType={displayAvatar.type}
                items={displayAvatar.equipped}
                width={504}
                height={504}
                animated={displayAvatar.animation !== 'idle'}
              />
            </motion.div>
          )}

      {/* Trash Zone */}
      <AnimatePresence>
        {showTrash && (
          <motion.div
            id="trash-zone"
            className="absolute bottom-4 right-4 z-50"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
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
          </motion.div>
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
    </motion.div>
  );
}

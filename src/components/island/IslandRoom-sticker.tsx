import { useRef, useState } from 'react';
import { useIslandStore } from '@/stores/islandStore';
import { cn } from '@/lib/utils';
import LayeredAvatar from '@/components/avatar-v2/LayeredAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface DragState {
  itemId: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

export default function IslandRoomSticker() {
  const roomRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  
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

  const handleItemMouseDown = (e: React.MouseEvent, item: any) => {
    if (!isEditingRoom || !roomRef.current) return;
    
    const rect = roomRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const offsetX = startX - rect.left - (item.x / 100) * rect.width;
    const offsetY = startY - rect.top - (item.y / 100) * rect.height;
    
    setDragState({
      itemId: item.id,
      startX,
      startY,
      offsetX,
      offsetY,
    });
    
    setShowTrash(true);
    
    // Start dragging in store
    startDragging({
      itemId: item.itemId,
      fromInventory: false,
      originalPosition: { x: item.x, y: item.y }
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
    if (!roomRef.current || !ui.draggedItem?.fromInventory) return;
    
    const rect = roomRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Place the item from inventory
    // Note: placeItem function in store will handle inventory removal
    const { placeItem } = useIslandStore.getState();
    placeItem(ui.draggedItem.itemId, x, y);
    
    stopDragging();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getItemIcon = (itemId: string) => {
    if (itemId.includes('chair')) return '🪑';
    if (itemId.includes('table')) return '🪵';
    if (itemId.includes('lamp')) return '💡';
    if (itemId.includes('plant')) return '🪴';
    if (itemId.includes('poster')) return '🖼️';
    if (itemId.includes('rug')) return '🟫';
    if (itemId.includes('clock')) return '🕐';
    if (itemId.includes('potted')) return '🪴';
    if (itemId.includes('fuzzy')) return '🟫';
    return '📦';
  };

  return (
    <div 
      ref={roomRef}
      className="relative w-full h-[600px] overflow-hidden rounded-lg shadow-inner"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Room Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(/rooms/${room.theme}-room.jpg)`,
          backgroundColor: '#8B6F47' // Fallback wood color
        }}
      />

      {/* Instructions (visible in room editing mode) */}
      {isEditingRoom && (
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm z-50">
          <p className="font-semibold mb-1">🏠 Room Decoration Mode</p>
          <p className="text-xs opacity-90">Drag items from inventory to place anywhere</p>
          <p className="text-xs opacity-90">Drag placed items to move them</p>
          <p className="text-xs opacity-90">Drag to trash can to delete</p>
        </div>
      )}

      {/* Placed Items */}
      {sortedItems.map((item) => (
        <motion.div
          key={item.id}
          className={cn(
            "absolute cursor-move",
            isEditingRoom && "hover:brightness-110 transition-all",
            dragState?.itemId === item.id && "cursor-grabbing"
          )}
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            transform: `translate(-50%, -50%)`,
            zIndex: item.zIndex || Math.floor(item.y),
          }}
          onMouseDown={(e) => handleItemMouseDown(e, item)}
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ 
            opacity: 1, 
            rotate: 0,
            filter: dragState?.itemId === item.id ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' : 'none'
          }}
          exit={{ scale: 0, opacity: 0, rotate: 180 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20
          }}
          whileHover={isEditingRoom ? { 
            scale: 1.05,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
          } : {}}
        >
          {/* Item Visual */}
          <div className="bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg select-none">
            <span className="text-4xl">
              {getItemIcon(item.itemId)}
            </span>
          </div>
          
          {/* Hover indicator */}
          {isEditingRoom && !dragState && (
            <motion.div 
              className="absolute inset-0 rounded-lg border-2 border-blue-400 opacity-0"
              whileHover={{ opacity: 1 }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            />
          )}
        </motion.div>
      ))}

      {/* Avatar (hidden in room editing mode) */}
      {!isEditingRoom && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            left: `${displayAvatar.position.x}px`,
            top: `${displayAvatar.position.y}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: Math.floor((displayAvatar.position.y / 600) * 100), // Dynamic z-index
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
          <LayeredAvatar
            animalType={displayAvatar.type}
            items={displayAvatar.equipped}
            width={420}
            height={420}
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
  );
}

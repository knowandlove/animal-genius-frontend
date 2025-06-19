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

  // Calculate scale based on Y position for depth effect
  const getScaleFromY = (yPercent: number): number => {
    // Y ranges from 0 (top) to 100 (bottom)
    // Scale from 0.6 (top) to 1.2 (bottom)
    const minScale = 0.6;
    const maxScale = 1.2;
    return minScale + (yPercent / 100) * (maxScale - minScale);
  };

  // Calculate shadow based on Y position for depth effect
  const getShadowFromY = (yPercent: number): string => {
    // Smaller, sharper shadows at top (far away)
    // Larger, softer shadows at bottom (close)
    const blur = 4 + (yPercent / 100) * 16; // 4px to 20px
    const spread = 1 + (yPercent / 100) * 3; // 1px to 4px
    const opacity = 0.1 + (yPercent / 100) * 0.2; // 0.1 to 0.3
    return `0 ${spread}px ${blur}px rgba(0, 0, 0, ${opacity})`;
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
      onDragLeave={handleDragLeave}
    >
      {/* Room Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundColor: '#8B6F47', // Wood color
          backgroundImage: `url(/rooms/${room.theme}-room.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Floor gradient for depth */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.1) 100%)',
          }}
        />
        {/* Perspective grid overlay for depth visualization (only in edit mode) */}
        {isEditingRoom && (
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Horizontal lines that get closer together towards the top (horizon) */}
            {[...Array(10)].map((_, i) => {
              // Exponential spacing for perspective effect
              const y = Math.pow(i / 9, 1.5) * 100;
              return (
                <line
                  key={`h-${i}`}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="white"
                  strokeWidth="0.2"
                />
              );
            })}
            {/* Vertical lines that converge towards center */}
            {[...Array(11)].map((_, i) => {
              const x = (i / 10) * 100;
              // Lines converge to a vanishing point at top center
              const topX = 50 + (x - 50) * 0.3;
              return (
                <line
                  key={`v-${i}`}
                  x1={x}
                  y1="100"
                  x2={topX}
                  y2="0"
                  stroke="white"
                  strokeWidth="0.2"
                />
              );
            })}
          </svg>
        )}
      </div>

      {/* Instructions (visible in room editing mode) */}
      {isEditingRoom && (
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm z-50">
          <p className="font-semibold mb-1">🏠 Room Decoration Mode</p>
          <p className="text-xs opacity-90">Drag items from inventory to place anywhere</p>
          <p className="text-xs opacity-90">Items scale with depth (higher = smaller)</p>
          <p className="text-xs opacity-90">Drag placed items to move them</p>
          <p className="text-xs opacity-90">Drag to trash can to delete</p>
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
            className="bg-blue-200/50 backdrop-blur rounded-lg p-3 border-2 border-blue-400 border-dashed"
            style={{ 
              boxShadow: getShadowFromY(dropPreview.y),
            }}
          >
            <span className="text-3xl block" style={{ fontSize: `${2 * getScaleFromY(dropPreview.y)}rem` }}>
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
              onMouseDown={(e) => handleItemMouseDown(e, item)}
              animate={{
                scale: dragState?.itemId === item.id ? scale * 1.1 : scale,
                opacity: dragState?.itemId === item.id ? 0.6 : 1,
              }}
            >
              {/* Item Visual */}
              <div 
                className="bg-white/90 backdrop-blur rounded-lg p-3 select-none border-2 border-gray-200"
                style={{ 
                  boxShadow: getShadowFromY(yPos),
                }}
              >
                <span className="text-3xl block" style={{ fontSize: `${2 * scale}rem` }}>
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

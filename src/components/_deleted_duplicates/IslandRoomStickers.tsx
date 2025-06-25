import { useState, useRef, useCallback } from 'react';
import { useIslandStore } from '@/stores/islandStore';
import { cn } from '@/lib/utils';
import LayeredAvatar from '@/components/avatar-v2/LayeredAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';

// Types for our sticker system
interface StickerItem {
  id: string;
  itemId: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  scale: number; // calculated based on y position
  zIndex: number; // calculated based on y position
}

interface DragState {
  item: StickerItem | null;
  offsetX: number;
  offsetY: number;
}

export default function IslandRoomStickers() {
  const { avatar, ui } = useIslandStore();
  
  // State for placed stickers
  const [placedStickers, setPlacedStickers] = useState<StickerItem[]>([]);
  const [dragState, setDragState] = useState<DragState>({ item: null, offsetX: 0, offsetY: 0 });
  const [showTrash, setShowTrash] = useState(false);
  const [trashHover, setTrashHover] = useState(false);
  
  const roomRef = useRef<HTMLDivElement>(null);

  // Calculate scale based on Y position (creates depth illusion)
  const calculateScale = (yPercent: number): number => {
    const minScale = 0.6; // Items at top of room
    const maxScale = 1.2; // Items at bottom of room
    return minScale + (yPercent / 100) * (maxScale - minScale);
  };

  // Calculate z-index based on Y position (items lower appear in front)
  const calculateZIndex = (yPercent: number): number => {
    return Math.round(yPercent * 100);
  };

  // Handle dropping a new item from inventory
  const handleNewItemDrop = useCallback((e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    if (!roomRef.current) return;

    const rect = roomRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Ensure item stays within bounds
    const boundedX = Math.max(5, Math.min(95, x));
    const boundedY = Math.max(5, Math.min(95, y));

    const newSticker: StickerItem = {
      id: `sticker-${Date.now()}`,
      itemId,
      x: boundedX,
      y: boundedY,
      scale: calculateScale(boundedY),
      zIndex: calculateZIndex(boundedY)
    };

    setPlacedStickers(prev => [...prev, newSticker]);
  }, []);

  // Handle dragging an existing sticker
  const handleStickerMouseDown = (sticker: StickerItem, e: React.MouseEvent) => {
    if (ui.mode !== 'placing') return;
    
    const rect = roomRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragState({
      item: sticker,
      offsetX: e.clientX - (rect.left + (sticker.x / 100) * rect.width),
      offsetY: e.clientY - (rect.top + (sticker.y / 100) * rect.height)
    });
    setShowTrash(true);
  };

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.item || !roomRef.current) return;

    const rect = roomRef.current.getBoundingClientRect();
    const x = ((e.clientX - dragState.offsetX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - dragState.offsetY - rect.top) / rect.height) * 100;

    // Update sticker position with bounds checking
    const boundedX = Math.max(5, Math.min(95, x));
    const boundedY = Math.max(5, Math.min(95, y));

    setPlacedStickers(prev => prev.map(s => 
      s.id === dragState.item!.id 
        ? {
            ...s,
            x: boundedX,
            y: boundedY,
            scale: calculateScale(boundedY),
            zIndex: calculateZIndex(boundedY)
          }
        : s
    ));

    // Check if over trash
    const trashZone = document.getElementById('trash-zone');
    if (trashZone) {
      const trashRect = trashZone.getBoundingClientRect();
      const overTrash = e.clientX >= trashRect.left && 
                       e.clientX <= trashRect.right && 
                       e.clientY >= trashRect.top && 
                       e.clientY <= trashRect.bottom;
      setTrashHover(overTrash);
    }
  }, [dragState]);

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    if (dragState.item && trashHover) {
      // Remove item if dropped on trash
      setPlacedStickers(prev => prev.filter(s => s.id !== dragState.item!.id));
    }
    setDragState({ item: null, offsetX: 0, offsetY: 0 });
    setShowTrash(false);
    setTrashHover(false);
  }, [dragState.item, trashHover]);

  // Set up global mouse listeners
  React.useEffect(() => {
    if (dragState.item) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.item, handleMouseMove, handleMouseUp]);

  // Handle drag over for the room
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded-lg shadow-inner">
      {/* Room Background */}
      <div 
        ref={roomRef}
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(/rooms/wood-room.jpg)`,
          backgroundColor: '#8B6F47'
        }}
        onDragOver={handleDragOver}
        onDrop={(e) => {
          e.preventDefault();
          const itemId = e.dataTransfer.getData('text/plain');
          if (itemId && itemId.startsWith('inventory-')) {
            handleNewItemDrop(e, itemId.replace('inventory-', ''));
          }
        }}
      >
        {/* Placed Stickers */}
        <AnimatePresence>
          {placedStickers.map((sticker) => (
            <motion.div
              key={sticker.id}
              className={cn(
                "absolute cursor-move select-none",
                dragState.item?.id === sticker.id && "opacity-80",
                ui.mode !== 'placing' && "cursor-default"
              )}
              style={{
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                transform: `translate(-50%, -50%) scale(${sticker.scale})`,
                zIndex: sticker.zIndex
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: sticker.scale, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              onMouseDown={(e) => handleStickerMouseDown(sticker, e)}
              whileHover={ui.mode === 'placing' ? { scale: sticker.scale * 1.1 } : {}}
              drag={false} // We handle dragging manually
            >
              <div className="bg-white rounded-lg p-3 shadow-lg">
                <div className="text-2xl">{getItemEmoji(sticker.itemId)}</div>
                <div className="text-xs text-center mt-1">{sticker.itemId}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Avatar (always on rug) */}
        <motion.div
          className="absolute"
          style={{
            left: '50%',
            top: '70%',
            transform: 'translate(-50%, -50%)',
            zIndex: calculateZIndex(70)
          }}
          animate={{
            y: [0, -5, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <LayeredAvatar
            animalType={avatar.type}
            items={avatar.equipped}
            width={150}
            height={150}
            animated={true}
          />
        </motion.div>
      </div>

      {/* Trash Zone */}
      <AnimatePresence>
        {showTrash && (
          <motion.div
            id="trash-zone"
            className={cn(
              "absolute bottom-4 left-1/2 transform -translate-x-1/2",
              "w-20 h-20 rounded-full flex items-center justify-center",
              "transition-all duration-200",
              trashHover ? "bg-red-500 scale-110" : "bg-gray-700"
            )}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <Trash2 className={cn(
              "w-10 h-10",
              trashHover ? "text-white" : "text-gray-300"
            )} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Indicator */}
      {ui.mode === 'placing' && (
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          🎨 Sticker Mode - Drag items anywhere!
        </div>
      )}
    </div>
  );
}

// Helper function to get emoji for items (temporary - replace with actual images)
function getItemEmoji(itemId: string): string {
  const emojiMap: Record<string, string> = {
    'cozy_chair': '🪑',
    'wooden_table': '🪵',
    'bookshelf': '📚',
    'floor_lamp': '💡',
    'bean_bag': '🛋️',
    'potted_plant': '🪴',
    'wall_clock': '🕐',
    'rug_circle': '🟢',
    'gaming_chair': '🎮',
    'treasure_chest': '📦',
    // Add more as needed
  };
  return emojiMap[itemId] || '📦';
}

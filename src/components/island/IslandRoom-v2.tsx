import { useIslandStore } from '@/stores/islandStore';
import { cn } from '@/lib/utils';
import LayeredAvatar from '@/components/avatar-v2/LayeredAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import DroppableHotspot from './drag-drop/DroppableHotspot';

export default function IslandRoom() {
  const { 
    avatar, 
    room, 
    ui,
    removeItem,
    draftAvatar,
    draftRoom,
  } = useIslandStore();
  
  // Use draft states when in edit modes
  const isEditingAvatar = ui.inventoryMode === 'avatar';
  const isEditingRoom = ui.inventoryMode === 'room';
  const displayAvatar = isEditingAvatar ? { ...avatar, equipped: draftAvatar.equipped } : avatar;
  const displayRoom = isEditingRoom ? { ...room, placedItems: draftRoom.placedItems } : room;

  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded-lg shadow-inner">
      {/* Room Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(/rooms/${room.theme}-room.jpg)`,
          backgroundColor: '#8B6F47' // Fallback wood color
        }}
      />

      {/* Grid Overlay (visible in room editing mode) */}
      {isEditingRoom && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
            <p className="font-semibold mb-1">🏠 Room Decoration Mode</p>
            <p className="text-xs opacity-90">Drag items from inventory to place them</p>
            <p className="text-xs opacity-90">Click placed items to remove them</p>
          </div>
        </div>
      )}

      {/* Hotspots with Placed Items */}
      <div className="absolute inset-0">
        {displayRoom.hotspots.map((hotspot) => {
          const isHighlighted = ui.highlightedHotspots.includes(hotspot.id);
          const placedItem = displayRoom.placedItems.find(
            item => item.x === hotspot.x && item.y === hotspot.y
          );

          return (
            <DroppableHotspot
              key={hotspot.id}
              hotspot={hotspot}
              isHighlighted={isHighlighted}
              isOccupied={!!placedItem}
              showGrid={isEditingRoom}
            >
              {/* Placed Item */}
              {placedItem && (
                <AnimatePresence>
                  <motion.div
                    key={placedItem.id}
                    initial={{ scale: 0, opacity: 0, rotate: -180 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0, rotate: 180 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 260,
                      damping: 20
                    }}
                    className={cn(
                      "absolute inset-2 flex items-center justify-center",
                      isEditingRoom && "hover:scale-110 cursor-pointer transition-transform"
                    )}
                    onClick={() => isEditingRoom && removeItem(placedItem.id)}
                    whileHover={isEditingRoom ? { scale: 1.05 } : {}}
                    whileTap={isEditingRoom ? { scale: 0.95 } : {}}
                  >
                    <div className="relative">
                      {/* Item Visual */}
                      <div className="bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg">
                        <span className="text-3xl">
                          {placedItem.itemId.includes('chair') ? '🪑' :
                           placedItem.itemId.includes('table') ? '🪵' :
                           placedItem.itemId.includes('lamp') ? '💡' :
                           placedItem.itemId.includes('plant') ? '🪴' :
                           placedItem.itemId.includes('poster') ? '🖼️' :
                           placedItem.itemId.includes('rug') ? '🟫' : '📦'}
                        </span>
                      </div>
                      
                      {/* Remove indicator on hover */}
                      {isEditingRoom && (
                        <motion.div 
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md"
                          initial={{ scale: 0 }}
                          whileHover={{ scale: 1 }}
                        >
                          ×
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </DroppableHotspot>
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
            transform: 'translate(-50%, -50%)'
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
            width={150}
            height={150}
            animated={displayAvatar.animation !== 'idle'}
          />
        </motion.div>
      )}

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

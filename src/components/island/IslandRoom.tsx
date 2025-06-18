import { useIslandStore } from '@/stores/islandStore';
import { cn } from '@/lib/utils';
import LayeredAvatar from '@/components/avatar-v2/LayeredAvatar';
import { motion, AnimatePresence } from 'framer-motion';

export default function IslandRoom() {
  const { 
    avatar, 
    room, 
    ui,
    placeItem,
    removeItem,
    highlightHotspots,
    stopDragging
  } = useIslandStore();

  // Convert grid coordinates to pixel positions
  const gridToPixels = (x: number, y: number) => ({
    x: x * 125 + 50, // 125px per grid cell, offset by 50px
    y: y * 125 + 50
  });

  // Handle drop on hotspot
  const handleHotspotDrop = (hotspot: any, e: React.DragEvent) => {
    e.preventDefault();
    if (ui.draggedItem) {
      placeItem(ui.draggedItem.itemId, hotspot.x, hotspot.y);
      stopDragging();
    }
  };

  // Handle drag over hotspot
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded-lg shadow-inner">
      {/* Room Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(/rooms/${room.theme}-room.jpg)`,
          backgroundColor: '#8B6F47' // Fallback
        }}
      />

      {/* Grid Overlay (visible in placing mode) */}
      {ui.mode === 'placing' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="grid grid-cols-4 grid-rows-4 w-[500px] h-[500px] mx-auto mt-[50px] gap-0">
            {Array.from({ length: 16 }).map((_, i) => (
              <div 
                key={i}
                className="border border-dashed border-white/30"
              />
            ))}
          </div>
        </div>
      )}

      {/* Hotspots */}
      <div className="absolute inset-0">
        {room.hotspots.map((hotspot) => {
          const pos = gridToPixels(hotspot.x, hotspot.y);
          const isHighlighted = ui.highlightedHotspots.includes(hotspot.id);
          const occupied = room.placedItems.some(
            item => item.x === hotspot.x && item.y === hotspot.y
          );

          return (
            <div
              key={hotspot.id}
              className={cn(
                "absolute w-[125px] h-[125px] transition-all duration-200",
                ui.mode === 'placing' && !occupied && "hover:bg-green-400/20",
                isHighlighted && !occupied && "bg-green-400/30 animate-pulse",
                occupied && ui.mode === 'placing' && "cursor-not-allowed"
              )}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
              }}
              onDrop={(e) => !occupied && handleHotspotDrop(hotspot, e)}
              onDragOver={!occupied ? handleDragOver : undefined}
              onDragEnter={() => !occupied && ui.mode === 'placing' && highlightHotspots([hotspot.id])}
              onDragLeave={() => highlightHotspots([])}
            />
          );
        })}
      </div>

      {/* Placed Items */}
      <AnimatePresence>
        {room.placedItems.map((item) => {
          const pos = gridToPixels(item.x, item.y);
          return (
            <motion.div
              key={item.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={cn(
                "absolute w-[100px] h-[100px] flex items-center justify-center",
                ui.mode === 'placing' && "hover:ring-2 hover:ring-red-400 cursor-pointer"
              )}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
              }}
              onClick={() => ui.mode === 'placing' && removeItem(item.id)}
              whileHover={ui.mode === 'placing' ? { scale: 1.1 } : {}}
            >
              <div className="bg-gray-300 rounded-lg p-4 shadow-lg">
                <span className="text-xs">{item.itemId}</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Avatar */}
      <motion.div
        className="absolute"
        style={{
          left: `${avatar.position.x}px`,
          top: `${avatar.position.y}px`,
          transform: 'translate(-50%, -50%)'
        }}
        animate={{
          x: [0, 0, 0],
          y: avatar.animation === 'idle' ? [0, -5, 0] : 0
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
          animated={avatar.animation !== 'idle'}
        />
      </motion.div>

      {/* Mode Indicator */}
      {ui.mode !== 'normal' && (
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {ui.mode === 'placing' && "🏠 Placement Mode"}
          {ui.mode === 'customizing' && "👔 Customization Mode"}
        </div>
      )}
    </div>
  );
}

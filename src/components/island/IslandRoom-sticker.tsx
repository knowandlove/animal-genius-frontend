import { useRef, useState, useMemo, memo, useCallback } from 'react';
import { useIslandStore, ROOM_ITEM_LIMIT } from '@/stores/islandStore';
import { cn } from '@/lib/utils';
import { AnimatePresence } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
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

// Memoized room item component to prevent unnecessary re-renders
const RoomItem = memo(({ 
  item, 
  xPos, 
  yPos, 
  scale, 
  itemData, 
  isEditingRoom,
  isDragging,
  isHovered,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onDelete
}: {
  item: any;
  xPos: number;
  yPos: number;
  scale: number;
  itemData: any;
  isEditingRoom: boolean;
  isDragging: boolean;
  isHovered: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDelete: () => void;
}) => {
  // Pre-calculate styles to avoid inline calculations
  const itemStyle = useMemo(() => ({
    left: `${xPos}%`,
    top: `${yPos}%`,
    transform: `translate(-50%, -50%) scale(${isDragging ? scale * 1.1 : scale})`,
    zIndex: Math.floor(yPos * 10),
    opacity: isDragging ? 0.6 : 1,
    // Use will-change for items that might be animated
    willChange: isEditingRoom ? 'transform, opacity' : 'auto'
  }), [xPos, yPos, scale, isDragging, isEditingRoom]);

  const imageStyle = useMemo(() => ({
    filter: isDragging ? 'brightness(0.8)' : 'none',
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const
  }), [isDragging]);

  return (
    <div
      className="absolute cursor-move transition-transform group"
      style={itemStyle}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Delete Button - Shows on hover when editing */}
      {isEditingRoom && isHovered && !isDragging && (
        <button
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg transition-all hover:scale-110 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete item"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      {/* Item Visual */}
      {itemData?.imageUrl ? (
        <div className="relative" style={{ width: '10vw', maxWidth: '120px', height: '10vw', maxHeight: '120px' }}>
          <img
            src={itemData.imageUrl}
            alt={itemData.name}
            style={imageStyle}
            draggable={false}
            loading="lazy" // Add lazy loading for performance
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
});

RoomItem.displayName = 'RoomItem';

// Move getItemIcon outside component to prevent recreation
const getItemIcon = (itemId: string) => {
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
  
  return '📦';
};

// Scale calculation function
const getScaleFromY = (yPercent: number): number => {
  const minScale = 0.6;
  const maxScale = 1.2;
  return minScale + (yPercent / 100) * (maxScale - minScale);
};

export default function IslandRoomSticker() {
  const roomRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const [dropPreview, setDropPreview] = useState<{ x: number; y: number } | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  
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

  // Memoize sorted items to prevent recalculation
  const sortedItems = useMemo(() => 
    [...displayRoom.placedItems].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)),
    [displayRoom.placedItems]
  );

  // Memoize item data lookup
  const getItemData = useCallback((itemId: string) => {
    return storeItems?.find((item: any) => item.id === itemId) || null;
  }, [storeItems]);

  // Optimize event handlers with useCallback
  const handleItemMouseDown = useCallback((e: React.MouseEvent, item: any, displayX: number, displayY: number) => {
    if (!isEditingRoom || !roomRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = roomRef.current.getBoundingClientRect();
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
    
    startDragging({
      itemId: item.itemId,
      fromInventory: false,
      originalPosition: { x: displayX, y: displayY }
    });
  }, [isEditingRoom, startDragging]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState || !roomRef.current) return;
    
    const rect = roomRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - dragState.offsetX) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragState.offsetY) / rect.height) * 100;
    
    const constrainedX = Math.max(5, Math.min(95, x));
    const constrainedY = Math.max(5, Math.min(95, y));
    
    setDragState(prev => prev ? { ...prev, currentX: constrainedX, currentY: constrainedY } : null);
    
    moveItem(dragState.itemId, constrainedX, constrainedY);
    
    // Optimize trash detection
    const trashRect = document.getElementById('trash-zone')?.getBoundingClientRect();
    if (trashRect) {
      const overTrashArea = 
        e.clientX >= trashRect.left && 
        e.clientX <= trashRect.right && 
        e.clientY >= trashRect.top && 
        e.clientY <= trashRect.bottom;
      setOverTrash(overTrashArea);
    }
  }, [dragState, moveItem]);

  const handleMouseUp = useCallback(() => {
    if (dragState && overTrash) {
      removeItem(dragState.itemId);
    }
    
    setDragState(null);
    setShowTrash(false);
    setOverTrash(false);
    stopDragging();
  }, [dragState, overTrash, removeItem, stopDragging]);

  // Memoize room background styles
  const wallStyle = useMemo(() => ({
    backgroundColor: displayRoom.wallColor || '#f5ddd9',
    backgroundImage: displayRoom.wallPattern ? `url(/patterns/${displayRoom.wallPattern})` : 'none',
    backgroundSize: displayRoom.wallPattern ? '100px 100px' : 'auto',
  }), [displayRoom.wallColor, displayRoom.wallPattern]);

  const floorStyle = useMemo(() => ({
    backgroundColor: displayRoom.floorColor || '#d4875f',
    backgroundImage: displayRoom.floorPattern ? `url(/patterns/${displayRoom.floorPattern})` : 'none',
    backgroundSize: displayRoom.floorPattern ? '100px 100px' : 'auto',
  }), [displayRoom.floorColor, displayRoom.floorPattern]);

  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="relative overflow-hidden rounded-lg shadow-inner bg-gray-100 w-full h-full">
        <div 
          ref={roomRef}
          className="absolute inset-0 w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDrop={(e) => {
            e.preventDefault();
            setDropPreview(null);
            
            if (!roomRef.current || !ui.draggedItem?.fromInventory) return;
            
            const rect = roomRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            const { placeItem } = useIslandStore.getState();
            placeItem(ui.draggedItem.itemId, x, y);
            
            stopDragging();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            
            if (roomRef.current && ui.draggedItem?.fromInventory) {
              const rect = roomRef.current.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setDropPreview({ x, y });
            }
          }}
          onDragLeave={() => setDropPreview(null)}
        >
          {/* Room Background */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 h-[70%]" style={wallStyle} />
            <div className="absolute bottom-0 left-0 right-0 h-[30%]" style={floorStyle} />
          </div>
          
          {/* Room Structure */}
          <img 
            src={getAssetUrl('/rooms/shelves-and-trim.png')} 
            alt="Room shelves"
            className="absolute inset-0 w-full h-full z-5 pointer-events-none"
            style={{ objectFit: 'cover' }}
            loading="eager" // Load immediately as it's part of the room structure
          />

          {/* Placed Items - Optimized rendering */}
          <div className="absolute inset-0 z-10">
            {sortedItems.map((item) => {
              const isOldGrid = item.x <= 3 && item.y <= 3;
              const xPos = isOldGrid ? (item.x / 3) * 80 + 10 : item.x;
              const yPos = isOldGrid ? (item.y / 3) * 80 + 10 : item.y;
              const scale = getScaleFromY(yPos);
              const itemData = getItemData(item.itemId);
              
              return (
                <RoomItem
                  key={item.id}
                  item={item}
                  xPos={xPos}
                  yPos={yPos}
                  scale={scale}
                  itemData={itemData}
                  isEditingRoom={isEditingRoom}
                  isDragging={dragState?.itemId === item.id}
                  isHovered={hoveredItemId === item.id}
                  onMouseDown={(e) => handleItemMouseDown(e, item, xPos, yPos)}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                  onDelete={() => removeItem(item.id)}
                />
              );
            })}
          </div>

          {/* Drop Preview */}
          {dropPreview && ui.draggedItem?.fromInventory && (() => {
            const itemData = getItemData(ui.draggedItem.itemId);
            const previewScale = getScaleFromY(dropPreview.y);
            
            return (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${dropPreview.x}%`,
                  top: `${dropPreview.y}%`,
                  transform: `translate(-50%, -50%) scale(${previewScale})`,
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

          {/* Trash Zone */}
          <AnimatePresence>
            {showTrash && (
              <div
                id="trash-zone"
                className="absolute left-4 bottom-4 z-50 transition-all duration-200"
                style={{
                  transform: showTrash ? 'scale(1)' : 'scale(0)',
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

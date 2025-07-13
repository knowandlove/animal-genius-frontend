import { useRef, useState, useEffect } from 'react';
import { useRoomStore, ROOM_ITEM_LIMIT } from '@/stores/roomStore';
import { cn } from '@/lib/utils';
import { AnimatePresence } from 'framer-motion';
import { Trash2, Loader2, Check } from 'lucide-react';
import { getAssetUrl } from '@/utils/cloud-assets';
import FishbowlPlaceholder from './FishbowlPlaceholder';
import FishbowlModal from '@/components/pets/display/FishbowlModal';
import FishBowl from '@/components/pets/animations/FishBowl';

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
  const [fishbowlModalOpen, setFishbowlModalOpen] = useState(false);
  const [selectedFishbowl, setSelectedFishbowl] = useState<any>(null);
  
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
    canEdit,
    passportCode,
    pet,
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
  const displayRoom = isEditingRoom 
    ? { 
        ...room, 
        placedItems: draftRoom.placedItems,
        wallColor: draftRoom.wallColor,
        floorColor: draftRoom.floorColor,
        wallPattern: draftRoom.wallPattern,
        floorPattern: draftRoom.floorPattern,
        wall: draftRoom.wall,
        floor: draftRoom.floor
      } 
    : room;
  

  // Sort items by z-index for proper layering
  const sortedItems = [...displayRoom.placedItems].sort((a, b) => 
    (a.zIndex || 0) - (b.zIndex || 0)
  );

  // Get item details from inventory
  const getItemDetails = (itemId: string) => {
    return inventory.items.find(item => item.id === itemId);
  };

  const handleItemMouseDown = (e: React.MouseEvent, item: any, displayX: number, displayY: number) => {
    // Get item details to check if this is a fishbowl
    const itemDetails = getItemDetails(item.itemId);
    
    // Check if this is a fishbowl click (not in edit mode)
    if (itemDetails?.name === 'Fish Bowl' && !ui.isArranging) {
      e.preventDefault();
      e.stopPropagation();
      
      // Use the actual pet data if available
      if (pet) {
        setSelectedFishbowl(pet);
        setFishbowlModalOpen(true);
      } else {
        // Fallback for demo/testing
        const mockPet = {
          id: 'mock-pet-id',
          customName: 'Goldie',
          hunger: 75,
          happiness: 85,
          calculatedStats: { hunger: 75, happiness: 85 },
          pet: {
            species: 'goldfish',
            baseStats: {
              hungerDecayRate: 2,
              happinessDecayRate: 3
            }
          }
        };
        setSelectedFishbowl(mockPet);
        setFishbowlModalOpen(true);
      }
      return;
    }
    
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
              backgroundColor: (() => {
                // Check for new format first
                if (displayRoom.wall?.type === 'pattern') {
                  // Don't set backgroundColor when using patterns
                  return undefined;
                }
                if (displayRoom.wall?.type === 'color' && displayRoom.wall?.value) {
                  return displayRoom.wall.value;
                }
                // Fall back to old format
                if (displayRoom.wallPattern) {
                  return undefined; // Don't set backgroundColor when using old patterns
                }
                return displayRoom.wallColor || '#f5ddd9';
              })(),
              backgroundImage: (() => {
                // Check for new pattern format with type
                if (displayRoom.wall?.type === 'pattern') {
                  if (displayRoom.wall.patternType === 'image' && displayRoom.wall.patternValue) {
                    return `url(${displayRoom.wall.patternValue})`;
                  }
                  // CSS patterns are handled by data-pattern attribute - don't set backgroundImage
                  return undefined;
                }
                // Fall back to old format
                return displayRoom.wallPattern ? `url(/patterns/${displayRoom.wallPattern})` : undefined;
              })(),
              backgroundSize: (() => {
                // Apply background size for image patterns
                if (displayRoom.wall?.type === 'pattern' && displayRoom.wall?.patternType === 'image') {
                  return '256px 256px'; // Standard tile size for images
                }
                // Old format patterns
                if (displayRoom.wallPattern) {
                  return '100px 100px';
                }
                return 'auto';
              })(),
              backgroundRepeat: 'repeat',
            }}
            data-pattern={(() => {
              // Apply data-pattern attribute for CSS patterns
              if (displayRoom.wall?.type === 'pattern' && displayRoom.wall?.patternType === 'css') {
                return displayRoom.wall.value; // This contains the pattern code for CSS patterns
              }
              return undefined;
            })()}
          />
          {/* Floor */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-[30%]"
            style={{
              backgroundColor: (() => {
                // Check for new format first
                if (displayRoom.floor?.type === 'pattern') {
                  // Don't set backgroundColor when using patterns
                  return undefined;
                }
                if (displayRoom.floor?.type === 'color' && displayRoom.floor?.value) {
                  return displayRoom.floor.value;
                }
                // Fall back to old format
                if (displayRoom.floorPattern) {
                  return undefined; // Don't set backgroundColor when using old patterns
                }
                return displayRoom.floorColor || '#d4875f';
              })(),
              backgroundImage: (() => {
                // Check for new pattern format with type
                if (displayRoom.floor?.type === 'pattern') {
                  if (displayRoom.floor.patternType === 'image' && displayRoom.floor.patternValue) {
                    return `url(${displayRoom.floor.patternValue})`;
                  }
                  // CSS patterns are handled by data-pattern attribute - don't set backgroundImage
                  return undefined;
                }
                // Fall back to old format
                return displayRoom.floorPattern ? `url(/patterns/${displayRoom.floorPattern})` : undefined;
              })(),
              backgroundSize: (() => {
                // Apply background size for image patterns
                if (displayRoom.floor?.type === 'pattern' && displayRoom.floor?.patternType === 'image') {
                  return '256px 256px'; // Standard tile size for images
                }
                // Old format patterns
                if (displayRoom.floorPattern) {
                  return '100px 100px';
                }
                return 'auto';
              })(),
              backgroundRepeat: 'repeat',
            }}
            data-pattern={(() => {
              // Apply data-pattern attribute for CSS patterns
              if (displayRoom.floor?.type === 'pattern' && displayRoom.floor?.patternType === 'css') {
                return displayRoom.floor.value; // This contains the pattern code for CSS patterns
              }
              return undefined;
            })()}
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
              {itemDetails?.name === 'Fish Bowl' ? (
                <div className={cn(
                  "cursor-pointer transition-transform",
                  !ui.isArranging && "hover:scale-105"
                )}>
                  <div style={{ width: '120px', height: '120px' }}>
                    <FishBowl 
                      happiness={pet?.calculatedStats?.happiness || 80} 
                      hunger={pet?.calculatedStats?.hunger || 80}
                    />
                  </div>
                </div>
              ) : itemDetails?.imageUrl ? (
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

        {/* Removed decorative sparkle elements */}
      </div>
    </div>
    
    {/* Save Button removed - now in StudentRoom.tsx */}
    
    {/* Save Status Indicator */}
    {ui.isSaving && (
      <div className="absolute top-4 right-4 z-50 bg-white/90 backdrop-blur rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Saving...</span>
      </div>
    )}
    
    {/* Save Error */}
    {ui.saveError && (
      <div className="absolute top-4 right-4 z-50 bg-red-100 border border-red-300 rounded-lg px-3 py-2 shadow-lg">
        <span className="text-sm font-medium text-red-800">{ui.saveError}</span>
      </div>
    )}
    
    {/* Recently Saved Indicator */}
    {ui.lastSaved && !ui.isSaving && !ui.saveError && (
      <div className="absolute top-4 right-4 z-50 animate-fade-in-out">
        <div className="bg-green-100 border border-green-300 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Saved!</span>
        </div>
      </div>
    )}
    
    {/* Fishbowl Modal */}
    {fishbowlModalOpen && selectedFishbowl && (
      <FishbowlModal
        open={fishbowlModalOpen}
        onClose={() => {
          setFishbowlModalOpen(false);
          setSelectedFishbowl(null);
        }}
        pet={selectedFishbowl}
        canInteract={canEdit}
        balance={(avatar as any)?.currencyBalance || 0}
        passportCode={passportCode || ''}
        classId={useRoomStore.getState().classId}
      />
    )}
    </>
  );
}

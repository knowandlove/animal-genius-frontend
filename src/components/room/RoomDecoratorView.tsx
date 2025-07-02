import { motion } from 'framer-motion';
import { Package, Sparkles, Sofa, Palette, Home, AlertCircle, Paintbrush, Box } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRoomStore, ROOM_ITEM_LIMIT } from '@/stores/roomStore';
import { cn } from '@/lib/utils';
import { getAssetUrl } from '@/utils/cloud-assets';
import { createPortal } from 'react-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from 'react';

export default function RoomDecoratorView() {
  const inventory = useRoomStore((state) => state.inventory);
  const draftRoom = useRoomStore((state) => state.draftRoom);
  const selectInventoryItem = useRoomStore((state) => state.selectInventoryItem);
  const selectedItem = useRoomStore((state) => state.inventory.selectedItem);
  const updateRoomColors = useRoomStore((state) => state.updateRoomColors);
  const updateRoomPatterns = useRoomStore((state) => state.updateRoomPatterns);
  const startDragging = useRoomStore((state) => state.startDragging);
  const stopDragging = useRoomStore((state) => state.stopDragging);
  const startArranging = useRoomStore((state) => state.startArranging);
  
  // State for hovered item
  const [hoveredItem, setHoveredItem] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  // Filter inventory for room items only
  const roomItems = inventory.items.filter(item => 
    item.type === 'room_decoration' || item.type === 'room_furniture'
  );

  // Categorize items
  const furnitureItems = roomItems.filter(item => 
    item.type === 'room_furniture' || 
    ['chair', 'table', 'sofa', 'desk', 'bed'].some(keyword => item.id.includes(keyword))
  );
  
  const objectItems = roomItems.filter(item => 
    !furnitureItems.includes(item) // Everything else that's not furniture
  );


  const handleDragStart = (e: React.DragEvent, item: any) => {
    // Create a smaller drag image
    const dragImage = document.createElement('div');
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.width = '60px';
    dragImage.style.height = '60px';
    dragImage.style.opacity = '0.8';
    dragImage.style.background = 'white';
    dragImage.style.borderRadius = '8px';
    dragImage.style.padding = '8px';
    dragImage.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    dragImage.style.display = 'flex';
    dragImage.style.alignItems = 'center';
    dragImage.style.justifyContent = 'center';
    dragImage.innerHTML = `<span style="font-size: 28px;">${getItemIcon(item)}</span>`;
    
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 30, 30);
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    // Start dragging in the store
    startDragging({
      itemId: item.id,
      fromInventory: true,
      originalPosition: undefined
    });
  };

  const handleDragEnd = () => {
    stopDragging();
  };

  const getItemIcon = (item: any) => {
    const itemId = item.id;
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

  const renderItemGrid = (items: any[], categoryType: string) => {
    // Create a 4x5 grid (20 slots total)
    const GRID_SIZE = 20;
    const gridItems = [];
    
    // Fill with actual items
    for (let i = 0; i < GRID_SIZE; i++) {
      if (i < items.length) {
        const item = items[i];
        const isPlaced = draftRoom.placedItems.some(p => p.itemId === item.id);
        
        gridItems.push(
          <motion.button
            key={item.id}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "aspect-square p-2 rounded-lg transition-all flex items-center justify-center relative group",
              "bg-white hover:bg-gray-50",
              // Border style based on rarity and placed state
              isPlaced ? "border-4" : "border-2",
              // Border color based on rarity
              item.rarity === 'legendary' ? "border-orange-500" :
              item.rarity === 'epic' ? "border-purple-500" :
              item.rarity === 'rare' ? "border-blue-500" :
              "border-green-500",
              // Additional styling for placed items
              isPlaced && "shadow-lg scale-105"
            )}
            onClick={() => {
              // Auto-place/remove on click
              if (!isPlaced && draftRoom.placedItems.length < ROOM_ITEM_LIMIT) {
                // Trigger placement
                startDragging({
                  itemId: item.id,
                  fromInventory: true,
                  originalPosition: undefined
                });
                // Start arranging mode
                startArranging();
                // Simulate drop in center of room
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('placeItemCenter', { detail: { itemId: item.id } }));
                  stopDragging();
                }, 10);
              }
            }}
            draggable={!isPlaced}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onMouseEnter={(e) => {
              if (process.env.NODE_ENV === 'development') {
                console.log('Hovering room item:', item);
              }
              setHoveredItem(item);
              const rect = e.currentTarget.getBoundingClientRect();
              setHoverPosition({ 
                x: Math.max(280, rect.left),
                y: rect.top 
              });
            }}
            onMouseLeave={() => {
              if (process.env.NODE_ENV === 'development') {
                console.log('Mouse left room item');
              }
              setHoveredItem(null);
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-12 h-12 object-contain transition-transform group-hover:scale-110"
                  draggable={false}
                />
              ) : (
                <div className="text-2xl transition-transform group-hover:scale-110">{getItemIcon(item)}</div>
              )}
            </div>
            {isPlaced && (
              <div className="absolute -top-2 -right-2 bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">
                ✓
              </div>
            )}
          </motion.button>
        );
      } else {
        // Empty slot
        gridItems.push(
          <div
            key={`empty-${categoryType}-${i}`}
            className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center"
          >
            <span className="text-gray-300 text-xs">Empty</span>
          </div>
        );
      }
    }
    
    return gridItems;
  };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Tabs for different categories */}
        <Tabs defaultValue="furniture" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="furniture" className="flex items-center justify-center p-2">
                  <Sofa className="w-5 h-5" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Furniture - Large items like chairs, tables, and sofas</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="objects" className="flex items-center justify-center p-2">
                  <Box className="w-5 h-5" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Objects - Decorative items, plants, and accessories</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="colors" className="flex items-center justify-center p-2">
                  <Paintbrush className="w-5 h-5" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Colors - Customize wall and floor colors</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="furniture" className="mt-0">
            <div className="grid grid-cols-4 gap-2 mt-4 p-2">
              {renderItemGrid(furnitureItems, 'furniture')}
            </div>
          </TabsContent>

          <TabsContent value="objects" className="mt-0">
            <div className="grid grid-cols-4 gap-2 mt-4 p-2">
              {renderItemGrid(objectItems, 'objects')}
            </div>
          </TabsContent>

          <TabsContent value="colors" className="mt-0">
            <div className="space-y-4">
              {/* Wall Color */}
              <div>
                <label className="text-sm font-medium mb-2 block">Wall Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={draftRoom.wallColor || '#f5ddd9'}
                    onChange={(e) => updateRoomColors(e.target.value, undefined)}
                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="text-xs text-gray-600 mb-1">Current color</div>
                    <div className="font-mono text-sm">{draftRoom.wallColor || '#f5ddd9'}</div>
                  </div>
                </div>
              </div>

              {/* Floor Color */}
              <div>
                <label className="text-sm font-medium mb-2 block">Floor Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={draftRoom.floorColor || '#d4875f'}
                    onChange={(e) => updateRoomColors(undefined, e.target.value)}
                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="text-xs text-gray-600 mb-1">Current color</div>
                    <div className="font-mono text-sm">{draftRoom.floorColor || '#d4875f'}</div>
                  </div>
                </div>
              </div>

              {/* Preset Color Combos */}
              <div className="mt-6">
                <label className="text-sm font-medium mb-2 block">Quick Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateRoomColors('#f5ddd9', '#d4875f')}
                    className="p-2 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors"
                  >
                    <div className="flex h-12">
                      <div className="flex-1 bg-[#f5ddd9] rounded-l"></div>
                      <div className="flex-1 bg-[#d4875f] rounded-r"></div>
                    </div>
                    <span className="text-xs mt-1 block">Warm & Cozy</span>
                  </button>
                  
                  <button
                    onClick={() => updateRoomColors('#e8f4f8', '#a8c5d6')}
                    className="p-2 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors"
                  >
                    <div className="flex h-12">
                      <div className="flex-1 bg-[#e8f4f8] rounded-l"></div>
                      <div className="flex-1 bg-[#a8c5d6] rounded-r"></div>
                    </div>
                    <span className="text-xs mt-1 block">Ocean Blue</span>
                  </button>
                  
                  <button
                    onClick={() => updateRoomColors('#f5e6ff', '#d4a6ff')}
                    className="p-2 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors"
                  >
                    <div className="flex h-12">
                      <div className="flex-1 bg-[#f5e6ff] rounded-l"></div>
                      <div className="flex-1 bg-[#d4a6ff] rounded-r"></div>
                    </div>
                    <span className="text-xs mt-1 block">Purple Dream</span>
                  </button>
                  
                  <button
                    onClick={() => updateRoomColors('#e8ffe8', '#a6d4a6')}
                    className="p-2 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors"
                  >
                    <div className="flex h-12">
                      <div className="flex-1 bg-[#e8ffe8] rounded-l"></div>
                      <div className="flex-1 bg-[#a6d4a6] rounded-r"></div>
                    </div>
                    <span className="text-xs mt-1 block">Forest Green</span>
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Item Info Box - Rendered as Portal */}
      {hoveredItem && createPortal(
        <div
          className={cn(
            "fixed z-[9999] bg-white rounded-lg shadow-2xl border-2 p-4 w-64 pointer-events-none",
            hoveredItem.rarity === 'common' || !hoveredItem.rarity ? "border-green-500" :
            hoveredItem.rarity === 'rare' ? "border-blue-500" :
            hoveredItem.rarity === 'epic' ? "border-purple-500" :
            hoveredItem.rarity === 'legendary' ? "border-orange-500" :
            "border-gray-200"
          )}
          style={{
            left: `${Math.max(10, hoverPosition.x - 280)}px`,
            top: `${Math.min(window.innerHeight - 200, hoverPosition.y)}px`,
          }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{hoveredItem.name}</h3>
              {hoveredItem.rarity && (
                <Badge 
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    hoveredItem.rarity === 'common' && "bg-green-500 text-white",
                    hoveredItem.rarity === 'rare' && "bg-blue-500 text-white",
                    hoveredItem.rarity === 'epic' && "bg-purple-500 text-white",
                    hoveredItem.rarity === 'legendary' && "bg-orange-500 text-white"
                  )}
                >
                  {hoveredItem.rarity === 'legendary' ? '⭐ Legendary' : 
                   hoveredItem.rarity === 'epic' ? '💎 Epic' :
                   hoveredItem.rarity === 'rare' ? '★ Rare' : 
                   '• Common'}
                </Badge>
              )}
            </div>
            {hoveredItem.description && (
              <p className="text-sm text-gray-600">{hoveredItem.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Type:</span>
              <span className="text-gray-700 capitalize">
                {hoveredItem.type?.replace(/_/g, ' ') || 'Unknown'}
              </span>
            </div>
            {hoveredItem.cost > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Cost:</span>
                <span className="text-yellow-600 font-semibold">{hoveredItem.cost} coins</span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
    </TooltipProvider>
  );
}

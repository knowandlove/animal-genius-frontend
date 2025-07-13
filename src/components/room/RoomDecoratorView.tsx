import { motion } from 'framer-motion';
import { Package, Sparkles, Sofa, Palette, Home, AlertCircle, Paintbrush, Box, Fish } from 'lucide-react';
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
import { useState, useEffect } from 'react';
import SurfaceCustomizer, { type SurfaceValue } from './SurfaceCustomizer';
import type { Pattern } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export default function RoomDecoratorView() {
  const inventory = useRoomStore((state) => state.inventory);
  const room = useRoomStore((state) => state.room);
  const draftRoom = useRoomStore((state) => state.draftRoom);
  const selectInventoryItem = useRoomStore((state) => state.selectInventoryItem);
  const selectedItem = useRoomStore((state) => state.inventory.selectedItem);
  const updateRoomColors = useRoomStore((state) => state.updateRoomColors);
  const updateRoomPatterns = useRoomStore((state) => state.updateRoomPatterns);
  const startDragging = useRoomStore((state) => state.startDragging);
  const stopDragging = useRoomStore((state) => state.stopDragging);
  const startArranging = useRoomStore((state) => state.startArranging);
  const passportCode = useRoomStore((state) => state.passportCode);
  
  // State for hovered item
  const [hoveredItem, setHoveredItem] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  
  // State for owned patterns
  const [ownedPatterns, setOwnedPatterns] = useState<Pattern[]>([]);
  const [patternsLoading, setPatternsLoading] = useState(true);
  
  // Fetch owned patterns on mount
  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        setPatternsLoading(true);
        // Include passport code for teacher access
        const endpoint = passportCode 
          ? `/api/patterns/student/inventory/patterns?passportCode=${passportCode}`
          : '/api/patterns/student/inventory/patterns';
        const response = await apiRequest('GET', endpoint);
        
        
        // The API returns { success: true, data: [...] }
        const patterns = response.data || [];
        // Transform the pattern objects to match expected format
        const transformedPatterns = patterns.map((item: any) => ({
          id: item.pattern.id,
          code: item.pattern.code,
          name: item.pattern.name,
          description: item.pattern.description,
          surfaceType: item.pattern.surfaceType,
          patternType: item.pattern.patternType,
          patternValue: item.pattern.patternValue,
          theme: item.pattern.theme,
          thumbnailUrl: item.pattern.thumbnailUrl,
          isActive: item.pattern.isActive,
          // Include item data for reference
          itemId: item.item.id,
          cost: item.item.cost,
          rarity: item.item.rarity,
          imageUrl: item.item.imageUrl,
        }));
        setOwnedPatterns(transformedPatterns);
      } catch (error) {
        console.error('Error fetching patterns:', error);
        // Set empty array on error to prevent undefined issues
        setOwnedPatterns([]);
      } finally {
        setPatternsLoading(false);
      }
    };
    
    fetchPatterns();
  }, [passportCode]);

  // Filter inventory for room items and pets
  const roomItems = inventory.items.filter(item => 
    item.type === 'room_decoration' || item.type === 'room_furniture' || item.type === 'pets'
  );

  // Categorize items
  const furnitureItems = roomItems.filter(item => 
    item.type === 'room_furniture' && item.name !== 'Fish Bowl' // Exclude fishbowl from furniture
  );
  
  const objectItems = roomItems.filter(item => 
    item.type === 'room_decoration'
  );
  
  const petItems = roomItems.filter(item => 
    item.type === 'pets' || item.name === 'Fish Bowl' // Include fishbowl in pets
  );
  
  // Handler for surface updates
  const handleSurfaceUpdate = (surface: 'wall' | 'floor', newValue: SurfaceValue) => {
    if (newValue.type === 'color') {
      // Update color and set proper wall/floor object
      if (surface === 'wall') {
        updateRoomColors(newValue.value, undefined);
        updateRoomPatterns({ type: 'color' as const, value: newValue.value }, undefined); // Set wall as color type
      } else {
        updateRoomColors(undefined, newValue.value);
        updateRoomPatterns(undefined, { type: 'color' as const, value: newValue.value }); // Set floor as color type
      }
    } else if (newValue.type === 'pattern') {
      // Update pattern with full data
      // Handle both data structures (patternData and direct properties)
      const patternType = newValue.patternData?.patternType || newValue.patternType;
      const patternValue = newValue.patternData?.patternValue || newValue.patternValue;
      
      if (!patternType || !patternValue) {
        console.error('Missing pattern data:', newValue);
        return;
      }
      
      const patternInfo = {
        type: 'pattern' as const,
        value: newValue.value, // pattern ID (which is the pattern code like 'wallpaper_stripes_01')
        patternType: patternType as 'css' | 'image',
        patternValue: patternValue
      };
      
      if (surface === 'wall') {
        updateRoomPatterns(patternInfo, undefined);
      } else {
        updateRoomPatterns(undefined, patternInfo);
      }
    }
  };
  
  // Get current surface values for the customizers
  const getCurrentSurfaceValue = (surface: 'wall' | 'floor'): SurfaceValue => {
    if (surface === 'wall') {
      if (draftRoom.wall?.type === 'pattern') {
        return { type: 'pattern', value: draftRoom.wall.value };
      } else if (draftRoom.wallPattern) {
        return { type: 'pattern', value: draftRoom.wallPattern };
      }
      return { type: 'color', value: draftRoom.wallColor || '#f5ddd9' };
    } else {
      if (draftRoom.floor?.type === 'pattern') {
        return { type: 'pattern', value: draftRoom.floor.value };
      } else if (draftRoom.floorPattern) {
        return { type: 'pattern', value: draftRoom.floorPattern };
      }
      return { type: 'color', value: draftRoom.floorColor || '#d4875f' };
    }
  };


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
              setHoveredItem(item);
              const rect = e.currentTarget.getBoundingClientRect();
              setHoverPosition({ 
                x: Math.max(280, rect.left),
                y: rect.top 
              });
            }}
            onMouseLeave={() => {
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
        {/* Help text when items are placed */}
        {draftRoom.placedItems.length > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-3 py-2">
            <p className="text-xs text-blue-700 flex items-center gap-1">
              <span className="text-sm">💡</span>
              Placed items can be dragged to reposition them in your room
            </p>
          </div>
        )}
        
        {/* Tabs for different categories */}
        <Tabs defaultValue="furniture" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mb-4">
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
                <TabsTrigger value="pets" className="flex items-center justify-center p-2">
                  <Fish className="w-5 h-5" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pets - Your aquatic friends</p>
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

          <TabsContent value="pets" className="mt-0">
            <div className="grid grid-cols-4 gap-2 mt-4 p-2">
              {renderItemGrid(petItems, 'pets')}
            </div>
          </TabsContent>

          <TabsContent value="colors" className="mt-0">
            <div className="space-y-6 p-2">
              {patternsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading patterns...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Wall Surface Customizer */}
                  <SurfaceCustomizer
                    surface="wall"
                    currentValue={getCurrentSurfaceValue('wall')}
                    ownedPatterns={ownedPatterns}
                    onUpdate={(newValue) => handleSurfaceUpdate('wall', newValue)}
                  />
                  
                  {/* Floor Surface Customizer */}
                  <SurfaceCustomizer
                    surface="floor"
                    currentValue={getCurrentSurfaceValue('floor')}
                    ownedPatterns={ownedPatterns}
                    onUpdate={(newValue) => handleSurfaceUpdate('floor', newValue)}
                  />
                </>
              )}
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

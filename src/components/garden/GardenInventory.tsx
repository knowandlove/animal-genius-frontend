import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sprout, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiRequest } from '@/lib/queryClient';
import { getPassportAuthHeaders } from '@/lib/passport-auth';
import { useGardenStore } from '@/stores/gardenStore';

interface SeedItem {
  inventoryId: string;
  storeItemId: string;
  seedType: string;
  name: string;
  emoji: string;
  growthHours: number;
  quantity: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  description?: string;
  cost?: number;
}

interface GardenInventoryProps {
  inventory?: any[];
  onClose: () => void;
  onSelectSeed: (seedId: string) => void;
}

export default function GardenInventory({ 
  inventory, 
  onClose, 
  onSelectSeed 
}: GardenInventoryProps) {
  const [seeds, setSeeds] = useState<SeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<SeedItem | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const startDragging = useGardenStore((state) => state.startDragging);
  const stopDragging = useGardenStore((state) => state.stopDragging);

  useEffect(() => {
    loadSeeds();
  }, []);

  const loadSeeds = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('GET', '/api/garden/available-seeds', undefined, {
        headers: getPassportAuthHeaders()
      });
      
      if (response.seeds) {
        setSeeds(response.seeds);
      }
    } catch (error) {
      console.error('Failed to load seeds:', error);
      // Provide mock data for testing
      setSeeds([
        {
          inventoryId: '1',
          storeItemId: '1',
          seedType: 'tomato',
          name: 'Tomato Seeds',
          emoji: '🍅',
          growthHours: 24,
          quantity: 5,
          rarity: 'common',
          description: 'Quick-growing tomatoes perfect for beginners',
          cost: 10
        },
        {
          inventoryId: '2',
          storeItemId: '2',
          seedType: 'strawberry',
          name: 'Strawberry Seeds',
          emoji: '🍓',
          growthHours: 48,
          quantity: 3,
          rarity: 'rare',
          description: 'Sweet strawberries that take time to grow',
          cost: 25
        },
        {
          inventoryId: '3',
          storeItemId: '3',
          seedType: 'lettuce',
          name: 'Lettuce Seeds',
          emoji: '🥬',
          growthHours: 24,
          quantity: 4,
          rarity: 'common',
          description: 'Fresh lettuce for healthy salads',
          cost: 15
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, seed: SeedItem) => {
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
    dragImage.innerHTML = `<span style="font-size: 28px;">${seed.emoji}</span>`;
    
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 30, 30);
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    // Start dragging in the store
    startDragging({
      seedType: seed.seedType,
      seedName: seed.name,
      fromInventory: true
    });
  };

  const handleDragEnd = () => {
    stopDragging();
  };

  const renderSeedGrid = () => {
    // Create a 4x5 grid (20 slots total)
    const GRID_SIZE = 20;
    const gridItems = [];
    
    // Fill with actual seeds
    for (let i = 0; i < GRID_SIZE; i++) {
      if (i < seeds.length) {
        const seed = seeds[i];
        const isPlanted = false; // TODO: Track if seed is currently planted
        
        gridItems.push(
          <button
            key={seed.inventoryId}
            className={cn(
              "aspect-square p-2 rounded-lg transition-all flex items-center justify-center relative group transform active:scale-95",
              "bg-white hover:bg-gray-50",
              // Border style based on rarity
              "border-2",
              // Border color based on rarity
              seed.rarity === 'legendary' ? "border-orange-500" :
              seed.rarity === 'epic' ? "border-purple-500" :
              seed.rarity === 'rare' ? "border-blue-500" :
              "border-green-500"
            )}
            onClick={() => onSelectSeed(seed.seedType)}
            draggable={seed.quantity > 0}
            onDragStart={(e) => handleDragStart(e, seed)}
            onDragEnd={handleDragEnd}
            onMouseEnter={(e) => {
              setHoveredItem(seed);
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
              <div className="text-3xl transition-transform group-hover:scale-110">{seed.emoji}</div>
            </div>
            {seed.quantity > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-green-600 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white px-1">
                {seed.quantity}
              </div>
            )}
            {seed.quantity === 0 && (
              <div className="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-lg" />
            )}
          </button>
        );
      } else {
        // Empty slot
        gridItems.push(
          <div
            key={`empty-seed-${i}`}
            className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center"
          >
            <Package className="w-6 h-6 text-gray-300" />
          </div>
        );
      }
    }
    
    return gridItems;
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full sm:w-80 bg-white shadow-2xl z-50 overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-green-50">
            <div className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-bold">Seed Inventory</h2>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="rounded-full hover:bg-green-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Seed Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-green-600" />
                <p className="text-gray-500">Loading seeds...</p>
              </div>
            ) : seeds.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Sprout className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No seeds in inventory</p>
                <p className="text-sm mt-1">Visit the store to buy seeds!</p>
              </div>
            ) : (
              <>
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-700 flex items-center gap-1">
                    <span className="text-sm">💡</span>
                    Drag seeds onto garden plots to plant them
                  </p>
                </div>
                
                {/* Grid Layout */}
                <div className="grid grid-cols-4 gap-2">
                  {renderSeedGrid()}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <p className="text-sm text-gray-600 text-center">
              {seeds.filter(s => s.quantity > 0).length} seed types available
            </p>
          </div>
        </div>

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
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Growth time:</span>
                  <span className="text-gray-700">{hoveredItem.growthHours} hours</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Quantity:</span>
                  <span className="text-gray-700 font-semibold">{hoveredItem.quantity}</span>
                </div>
                {hoveredItem.cost && hoveredItem.cost > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Cost:</span>
                    <span className="text-yellow-600 font-semibold">{hoveredItem.cost} coins</span>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </motion.div>
    </TooltipProvider>
  );
}
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRoomStore } from '@/stores/roomStore';
import { cn } from '@/lib/utils';
import { Sparkles, HardHat, Glasses, Gem } from 'lucide-react';
import { useStoreItems } from '@/contexts/StoreDataContext';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AvatarCustomizerView() {
  const inventory = useRoomStore((state) => state.inventory);
  const draftAvatar = useRoomStore((state) => state.draftAvatar);
  const updateDraftAvatar = useRoomStore((state) => state.updateDraftAvatar);
  const storeItems = useStoreItems(); // Get store items to access image URLs
  
  // State for hovered item
  const [hoveredItem, setHoveredItem] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  // Filter inventory for avatar items only
  const avatarItems = inventory.items.filter(item => 
    item.type.startsWith('avatar')
  );

  // Categorize items
  const categorizedItems = {
    hat: avatarItems.filter(item => item.type === 'avatar_hat'),
    glasses: avatarItems.filter(item => 
      item.id.includes('blind') || item.id.includes('heart') || item.id.includes('glass')
    ),
    accessory: avatarItems.filter(item => 
      item.type === 'avatar_accessory' && 
      !item.id.includes('blind') && !item.id.includes('heart') && !item.id.includes('glass')
    )
  };

  const handleItemClick = (slot: string, itemId: string, item: any) => {
    // Auto-equip on click
    const currentItem = draftAvatar.equipped[slot as keyof typeof draftAvatar.equipped];
    updateDraftAvatar(slot, currentItem === itemId ? null : itemId);
  };

  // Removed equip/remove handlers - now using auto-equip on click

  const getItemImage = (itemId: string) => {
    const storeItem = storeItems?.find(item => item.id === itemId);
    return storeItem?.imageUrl || null;
  };

  const getItemEmoji = (itemId: string) => {
    // More specific emojis based on item ID
    if (itemId.includes('top_hat')) return '🎩';
    if (itemId.includes('baseball')) return '🧢';
    if (itemId.includes('party')) return '🥳';
    if (itemId.includes('crown')) return '👑';
    if (itemId.includes('hat')) return '🎩';
    if (itemId.includes('sunglasses')) return '🕶️';
    if (itemId.includes('heart')) return '😍';
    if (itemId.includes('blind') || itemId.includes('glass')) return '👓';
    if (itemId.includes('bowtie')) return '🎀';
    if (itemId.includes('scarf')) return '🧣';
    if (itemId.includes('necklace')) return '📿';
    return '💎';
  };


  const renderItemGrid = (items: any[], slot: string) => {
    // Create a 4x5 grid (20 slots total)
    const GRID_SIZE = 20;
    const gridItems = [];
    const equippedItem = draftAvatar.equipped[slot as keyof typeof draftAvatar.equipped];
    
    // Fill with actual items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isEquipped = equippedItem === item.id;
      
      gridItems.push(
        <motion.button
          key={item.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleItemClick(slot, item.id, item)}
          onMouseEnter={(e) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Hovering item:', item);
            }
            setHoveredItem(item);
            const rect = e.currentTarget.getBoundingClientRect();
            // Position tooltip to the left of the item
            setHoverPosition({ 
              x: Math.max(280, rect.left), // Ensure tooltip doesn't go off-screen 
              y: rect.top 
            });
          }}
          onMouseLeave={() => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Mouse left item');
            }
            setHoveredItem(null);
          }}
          className={cn(
            "aspect-square p-2 rounded-lg transition-all flex flex-col items-center justify-center relative group",
            "bg-white hover:bg-gray-50",
            // Border style based on rarity and equipped state
            isEquipped ? "border-4" : "border-2",
            // Border color based on rarity
            item.rarity === 'legendary' ? "border-orange-500" :
            item.rarity === 'epic' ? "border-purple-500" :
            item.rarity === 'rare' ? "border-blue-500" :
            "border-green-500",
            // Additional styling for equipped items
            isEquipped && "shadow-lg scale-105"
          )}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
            {/* Show actual image if available, fallback to emoji */}
            {getItemImage(item.id) ? (
              <img 
                src={getItemImage(item.id)!} 
                alt={item.name}
                className="w-12 h-12 object-contain transition-transform group-hover:scale-110"
              />
            ) : (
              <div className="text-2xl transition-transform group-hover:scale-110">{getItemEmoji(item.id)}</div>
            )}
          </div>
          {isEquipped && (
            <div className="absolute -top-2 -right-2 bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">
              ✓
            </div>
          )}
        </motion.button>
      );
    }
    
    // Fill remaining slots with empty placeholders
    for (let i = items.length; i < GRID_SIZE; i++) {
      gridItems.push(
        <div
          key={`empty-${slot}-${i}`}
          className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center"
        >
          <span className="text-gray-300 text-xs">Empty</span>
        </div>
      );
    }
    
    return gridItems;
  };

  // Check which slots have equipped items for tab badges
  const equippedSlots = {
    hat: !!draftAvatar.equipped.hat,
    glasses: !!draftAvatar.equipped.glasses,
    accessory: !!draftAvatar.equipped.accessory
  };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Tabs for different categories */}
        <Tabs defaultValue="hat" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="hat" className="flex items-center justify-center p-2 relative">
                  <HardHat className="w-5 h-5" />
                  {equippedSlots.hat && (
                    <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                      •
                    </div>
                  )}
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Hats - Headwear and top accessories</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="glasses" className="flex items-center justify-center p-2 relative">
                  <Glasses className="w-5 h-5" />
                  {equippedSlots.glasses && (
                    <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                      •
                    </div>
                  )}
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Glasses - Eyewear and face accessories</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="accessory" className="flex items-center justify-center p-2 relative">
                  <Gem className="w-5 h-5" />
                  {equippedSlots.accessory && (
                    <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                      •
                    </div>
                  )}
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Accessories - Necklaces, bows, and other items</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="hat" className="mt-0">
            <div className="grid grid-cols-4 gap-2 mt-4 p-2">
              {renderItemGrid(categorizedItems.hat, 'hat')}
            </div>
          </TabsContent>

          <TabsContent value="glasses" className="mt-0">
            <div className="grid grid-cols-4 gap-2 mt-4 p-2">
              {renderItemGrid(categorizedItems.glasses, 'glasses')}
            </div>
          </TabsContent>

          <TabsContent value="accessory" className="mt-0">
            <div className="grid grid-cols-4 gap-2 mt-4 p-2">
              {renderItemGrid(categorizedItems.accessory, 'accessory')}
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
            top: `${hoverPosition.y}px`,
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
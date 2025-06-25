import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIslandStore } from '@/stores/islandStore';
import { cn } from '@/lib/utils';
import { Sparkles, HardHat, Glasses, Gem, Wand2, Home, ShoppingBag } from 'lucide-react';
import { useStoreItems } from '@/contexts/StoreDataContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AvatarCustomizerViewProps {
  selectedPreviewItem: {
    id: string;
    slot: string;
    item: any;
  } | null;
  setSelectedPreviewItem: (item: {
    id: string;
    slot: string;
    item: any;
  } | null) => void;
}

export default function AvatarCustomizerView({ 
  selectedPreviewItem, 
  setSelectedPreviewItem 
}: AvatarCustomizerViewProps) {
  const inventory = useIslandStore((state) => state.inventory);
  const draftAvatar = useIslandStore((state) => state.draftAvatar);
  const updateDraftAvatar = useIslandStore((state) => state.updateDraftAvatar);
  const storeItems = useStoreItems(); // Get store items to access image URLs
  const setInventoryMode = useIslandStore((state) => state.setInventoryMode);
  const closeInventory = useIslandStore((state) => state.closeInventory);
  const editingMode = useIslandStore((state) => state.ui.editingMode);
  const exitEditingMode = useIslandStore((state) => state.exitEditingMode);
  const openStoreModal = useIslandStore((state) => state.openStoreModal);
  const [currentTab, setCurrentTab] = useState('hat');

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
    const currentItem = draftAvatar.equipped[slot as keyof typeof draftAvatar.equipped];
    
    // If clicking the same item that's equipped, unequip it
    if (currentItem === itemId) {
      updateDraftAvatar(slot, null);
      setSelectedPreviewItem(null);
    } else {
      // Otherwise, equip the new item immediately
      updateDraftAvatar(slot, itemId);
      setSelectedPreviewItem({ id: itemId, slot, item });
    }
  };

  const handleEquip = () => {
    if (!selectedPreviewItem) return;
    
    const { slot, id } = selectedPreviewItem;
    // If clicking the same item that's equipped, unequip it
    const currentItem = draftAvatar.equipped[slot as keyof typeof draftAvatar.equipped];
    updateDraftAvatar(slot, currentItem === id ? null : id);
    
    // Clear preview after equipping
    setSelectedPreviewItem(null);
  };

  const handleRemove = () => {
    if (!selectedPreviewItem) return;
    
    const { slot } = selectedPreviewItem;
    const equippedItem = draftAvatar.equipped[slot as keyof typeof draftAvatar.equipped];
    
    // Only remove if there's actually something equipped in this slot
    if (equippedItem) {
      updateDraftAvatar(slot, null);
      // Don't clear selectedPreviewItem so user can immediately equip something else
    }
  };

  // Listen for equip and remove events from parent
  useEffect(() => {
    const handleEquipEvent = () => {
      handleEquip();
    };
    
    const handleRemoveEvent = () => {
      handleRemove();
    };
    
    window.addEventListener('equip-item', handleEquipEvent);
    window.addEventListener('remove-item', handleRemoveEvent);
    return () => {
      window.removeEventListener('equip-item', handleEquipEvent);
      window.removeEventListener('remove-item', handleRemoveEvent);
    };
  }, [selectedPreviewItem]);

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

  const getRarityBadge = (item: any) => {
    if (item.rarity === 'rare') {
      return <Badge className="absolute top-1 right-1 text-xs px-1 bg-purple-500">★</Badge>;
    }
    if (item.rarity === 'legendary') {
      return <Badge className="absolute top-1 right-1 text-xs px-1 bg-yellow-500">⭐</Badge>;
    }
    return null;
  };

  const renderItemGrid = (items: any[], slot: string) => {
    // Create a 3x5 grid (15 slots total)
    const GRID_SIZE = 15;
    const gridItems = [];
    const equippedItem = draftAvatar.equipped[slot as keyof typeof draftAvatar.equipped];
    
    // Fill with actual items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isEquipped = equippedItem === item.id;
      
      gridItems.push(
        <TooltipProvider key={item.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleItemClick(slot, item.id, item)}
                className={cn(
                  "w-16 h-16 p-2 rounded-lg border-2 transition-all flex items-center justify-center relative overflow-hidden group",
                  isEquipped
                    ? "border-purple-500 bg-purple-50 shadow-md ring-2 ring-purple-500 ring-inset"
                    : selectedPreviewItem?.id === item.id
                    ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-500 ring-inset"
                    : "border-gray-200 hover:border-purple-300 bg-white"
                )}
              >
                {getRarityBadge(item)}
                {/* Show actual image if available, fallback to emoji */}
                {getItemImage(item.id) ? (
                  <img 
                    src={getItemImage(item.id)!} 
                    alt={item.name}
                    className="w-full h-full object-contain transition-transform group-hover:scale-110"
                  />
                ) : (
                  <div className="text-lg transition-transform group-hover:scale-110">{getItemEmoji(item.id)}</div>
                )}
                {isEquipped && (
                  <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold z-10">
                    ✓
                  </div>
                )}
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[200px]">
              <div className="space-y-1">
                <p className="font-semibold text-sm">{item.name}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                )}
                {item.rarity && (
                  <p className="text-xs">
                    <span className={cn(
                      "inline-flex items-center gap-1",
                      item.rarity === 'legendary' && 'text-yellow-600',
                      item.rarity === 'rare' && 'text-purple-600'
                    )}>
                      {item.rarity === 'legendary' && <Sparkles className="w-3 h-3" />}
                      {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
                    </span>
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    // Fill remaining slots with empty placeholders
    for (let i = items.length; i < GRID_SIZE; i++) {
      gridItems.push(
        <div
          key={`empty-${slot}-${i}`}
          className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center"
        >
          <span className="text-gray-300 text-[10px]">Empty</span>
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
    <div className="h-full flex flex-col">
      {/* Mode Switcher Buttons */}
      <div className="flex justify-center gap-2 mb-4 overflow-visible">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Currently in avatar mode, so just close the panel
                  closeInventory();
                }}
                className="w-10 h-10 bg-purple-700 text-white rounded-full shadow flex items-center justify-center cursor-pointer relative z-10"
              >
                <Wand2 className="w-5 h-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Customize Avatar (Current)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setInventoryMode('room')}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow flex items-center justify-center transition-colors relative z-10"
              >
                <Home className="w-5 h-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Decorate Room</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  closeInventory();
                  openStoreModal();
                }}
                className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-full shadow flex items-center justify-center transition-colors relative z-10"
              >
                <ShoppingBag className="w-5 h-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visit Store</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Tabs for different categories */}
      <Tabs defaultValue="hat" className="flex-1 flex flex-col" onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-3 mb-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="hat" className="relative data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
                  <HardHat className="w-4 h-4" />
                  {equippedSlots.hat && (
                    <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px]">
                      •
                    </div>
                  )}
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Hats</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="glasses" className="relative data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
                  <Glasses className="w-4 h-4" />
                  {equippedSlots.glasses && (
                    <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px]">
                      •
                    </div>
                  )}
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Glasses</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="accessory" className="relative data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
                  <Gem className="w-4 h-4" />
                  {equippedSlots.accessory && (
                    <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px]">
                      •
                    </div>
                  )}
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Accessories</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TabsList>
        
        {/* Current Tab Indicator */}
        <div className="text-center mb-3">
          <span className="text-sm text-purple-600 font-medium">
            {currentTab === 'hat' && 'Hats'}
            {currentTab === 'glasses' && 'Glasses'}
            {currentTab === 'accessory' && 'Accessories'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-visible px-1">
          <TabsContent value="hat" className="mt-0 overflow-visible">
            {categorizedItems.hat.length === 0 && !draftAvatar.equipped.hat ? (
              <div className="text-center py-8 text-gray-500">
                <HardHat className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No hats owned yet!</p>
                <p className="text-xs mt-1">Visit the store to get some.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 p-2">
                {renderItemGrid(categorizedItems.hat, 'hat')}
              </div>
            )}
          </TabsContent>

          <TabsContent value="glasses" className="mt-0 overflow-visible">
            {categorizedItems.glasses.length === 0 && !draftAvatar.equipped.glasses ? (
              <div className="text-center py-8 text-gray-500">
                <Glasses className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No glasses owned yet!</p>
                <p className="text-xs mt-1">Visit the store to get some.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 p-2">
                {renderItemGrid(categorizedItems.glasses, 'glasses')}
              </div>
            )}
          </TabsContent>

          <TabsContent value="accessory" className="mt-0 overflow-visible">
            {categorizedItems.accessory.length === 0 && !draftAvatar.equipped.accessory ? (
              <div className="text-center py-8 text-gray-500">
                <Gem className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No accessories owned yet!</p>
                <p className="text-xs mt-1">Visit the store to get some.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 p-2">
                {renderItemGrid(categorizedItems.accessory, 'accessory')}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
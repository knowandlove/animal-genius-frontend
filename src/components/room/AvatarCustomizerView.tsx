import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useRoomStore } from '@/stores/roomStore';
import { cn } from '@/lib/utils';
import { Sparkles, HardHat, Glasses, Gem, Palette } from 'lucide-react';
import { useStoreItems } from '@/contexts/StoreDataContext';
import { useEffect, useState, useRef, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ANIMAL_COLOR_PALETTES, getDefaultColors } from '@/config/animal-color-palettes';
import { CustomizerSkeleton } from '@/components/skeletons/AvatarSkeleton';

interface AvatarCustomizerViewProps {
  isMobile?: boolean;
  storeCatalog?: any[];
  onColorChange?: (colors: { primaryColor: string; secondaryColor: string }) => void;
  animalType?: string;
}

function AvatarCustomizerViewInner({ 
  isMobile = false, 
  storeCatalog,
  onColorChange,
  animalType = 'meerkat'
}: AvatarCustomizerViewProps) {
  const inventory = useRoomStore((state) => state.inventory);
  const draftAvatar = useRoomStore((state) => state.draftAvatar);
  const updateDraftAvatar = useRoomStore((state) => state.updateDraftAvatar);
  const storeItems = useStoreItems(); // Get store items to access image URLs
  
  // State for current tab
  const [activeTab, setActiveTab] = useState('hat');
  
  // State for hovered item
  const [showAutoSaveInfo, setShowAutoSaveInfo] = useState(false); // Disabled auto-save messages
  
  // Get current colors from room store's avatar state
  const avatarColors = useRoomStore((state) => state.avatar.colors);
  const animalDefaults = getDefaultColors(animalType);
  const defaultColors = {
    primaryColor: animalDefaults.primaryColor,
    secondaryColor: animalDefaults.secondaryColor,
    hasCustomized: false
  };
  const [tempColors, setTempColors] = useState(() => avatarColors || defaultColors);
  
  // Sync tempColors when avatarColors changes (e.g., when customizer opens with saved colors)
  useEffect(() => {
    if (avatarColors) {
      setTempColors(avatarColors);
    }
  }, [avatarColors]);
  
  const handleColorChange = (newColors: typeof tempColors) => {
    setTempColors(newColors);
    
    // Update room store's avatar colors immediately for instant visual feedback
    useRoomStore.getState().setAvatarColors({ ...newColors, hasCustomized: true });
    
    // Call onColorChange immediately for instant feedback
    onColorChange?.(newColors);
  };

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
          title={`${item.name} - ${item.rarity || 'common'}`}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleItemClick(slot, item.id, item)}
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

  // Tab info for dynamic header
  const tabInfo = {
    hat: {
      title: "Hats & Headwear",
      description: "Choose from your collection of headwear"
    },
    glasses: {
      title: "Glasses & Eyewear", 
      description: "Select stylish glasses"
    },
    accessory: {
      title: "Accessories",
      description: "Pick necklaces, bows, and other decorative items"
    },
    colors: {
      title: "Avatar Colors",
      description: "Customize your avatar's primary and secondary colors"
    }
  };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        
        {/* Dynamic Header */}
        <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">
            {tabInfo[activeTab as keyof typeof tabInfo].title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {tabInfo[activeTab as keyof typeof tabInfo].description}
          </p>
        </div>
        
        {/* Custom Tab Navigation */}
        <div className="grid grid-cols-4 gap-1 p-1 mb-4 bg-gray-100 rounded-lg flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveTab('hat')}
                className={cn(
                  "flex items-center justify-center p-3 rounded-md relative transition-all",
                  activeTab === 'hat' 
                    ? "bg-gray-700 text-white shadow-md" 
                    : "bg-transparent text-gray-600 hover:bg-gray-200"
                )}
              >
                <HardHat className="w-5 h-5" />
                {equippedSlots.hat && (
                  <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                    •
                  </div>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Hats - Headwear and top accessories</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveTab('glasses')}
                className={cn(
                  "flex items-center justify-center p-3 rounded-md relative transition-all",
                  activeTab === 'glasses' 
                    ? "bg-gray-700 text-white shadow-md" 
                    : "bg-transparent text-gray-600 hover:bg-gray-200"
                )}
              >
                <Glasses className="w-5 h-5" />
                {equippedSlots.glasses && (
                  <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                    •
                  </div>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Glasses - Eyewear and face accessories</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveTab('accessory')}
                className={cn(
                  "flex items-center justify-center p-3 rounded-md relative transition-all",
                  activeTab === 'accessory' 
                    ? "bg-gray-700 text-white shadow-md" 
                    : "bg-transparent text-gray-600 hover:bg-gray-200"
                )}
              >
                <Gem className="w-5 h-5" />
                {equippedSlots.accessory && (
                  <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                    •
                  </div>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Accessories - Necklaces, bows, and other items</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveTab('colors')}
                className={cn(
                  "flex items-center justify-center p-3 rounded-md relative transition-all",
                  activeTab === 'colors' 
                    ? "bg-gray-700 text-white shadow-md" 
                    : "bg-transparent text-gray-600 hover:bg-gray-200"
                )}
              >
                <Palette className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Colors - Customize your avatar colors</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Tab Content with fixed height */}
        <div className="bg-white rounded-lg" style={{ height: '500px' }}>
          <div className="h-full relative">
            {activeTab === 'hat' && (
              <div className="absolute inset-0 grid grid-cols-4 gap-2 p-4 overflow-y-auto">
                {renderItemGrid(categorizedItems.hat, 'hat')}
              </div>
            )}

            {activeTab === 'glasses' && (
              <div className="absolute inset-0 grid grid-cols-4 gap-2 p-4 overflow-y-auto">
                {renderItemGrid(categorizedItems.glasses, 'glasses')}
              </div>
            )}

            {activeTab === 'accessory' && (
              <div className="absolute inset-0 grid grid-cols-4 gap-2 p-4 overflow-y-auto">
                {renderItemGrid(categorizedItems.accessory, 'accessory')}
              </div>
            )}

            {activeTab === 'colors' && (
              <div className="absolute inset-0 grid grid-cols-4 gap-2 p-4 overflow-y-auto">
                <div className="col-span-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Primary Color</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {(() => {
                        const normalizedType = animalType.toLowerCase().replace(/\s+/g, '-');
                        const palette = ANIMAL_COLOR_PALETTES[normalizedType] || ANIMAL_COLOR_PALETTES.meerkat;
                        return palette.primary.map((colorOption) => (
                          <Tooltip key={colorOption.value}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => {
                                  const newColors = { ...tempColors, primaryColor: colorOption.value };
                                  handleColorChange(newColors);
                                }}
                                className={cn(
                                  "aspect-square p-2 rounded-lg transition-all flex items-center justify-center",
                                  "bg-white hover:bg-gray-50",
                                  tempColors.primaryColor === colorOption.value 
                                    ? "border-4 border-teal-500 shadow-lg scale-105"
                                    : "border-2 border-gray-300 hover:border-gray-400"
                                )}
                              >
                                <div 
                                  className="w-full h-full rounded-md"
                                  style={{ backgroundColor: colorOption.value }}
                                />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{colorOption.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        ));
                      })()}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Secondary Color</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {(() => {
                        const normalizedType = animalType.toLowerCase().replace(/\s+/g, '-');
                        const palette = ANIMAL_COLOR_PALETTES[normalizedType] || ANIMAL_COLOR_PALETTES.meerkat;
                        return palette.secondary.map((colorOption) => (
                          <Tooltip key={colorOption.value}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => {
                                  const newColors = { ...tempColors, secondaryColor: colorOption.value };
                                  handleColorChange(newColors);
                                }}
                                className={cn(
                                  "aspect-square p-2 rounded-lg transition-all flex items-center justify-center",
                                  "bg-white hover:bg-gray-50",
                                  tempColors.secondaryColor === colorOption.value
                                    ? "border-4 border-teal-500 shadow-lg scale-105"
                                    : "border-2 border-gray-300 hover:border-gray-400"
                                )}
                              >
                                <div 
                                  className="w-full h-full rounded-md"
                                  style={{ backgroundColor: colorOption.value }}
                                />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{colorOption.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function AvatarCustomizerView(props: AvatarCustomizerViewProps) {
  return (
    <Suspense fallback={<CustomizerSkeleton />}>
      <AvatarCustomizerViewInner {...props} />
    </Suspense>
  );
}
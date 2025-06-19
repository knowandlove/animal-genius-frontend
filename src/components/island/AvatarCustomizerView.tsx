import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIslandStore } from '@/stores/islandStore';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export default function AvatarCustomizerView() {
  const inventory = useIslandStore((state) => state.inventory);
  const draftAvatar = useIslandStore((state) => state.draftAvatar);
  const updateDraftAvatar = useIslandStore((state) => state.updateDraftAvatar);

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

  const handleEquip = (slot: string, itemId: string) => {
    // If clicking the same item, unequip it
    const currentItem = draftAvatar.equipped[slot as keyof typeof draftAvatar.equipped];
    updateDraftAvatar(slot, currentItem === itemId ? null : itemId);
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
    // Create a 4x5 grid (20 slots total)
    const GRID_SIZE = 20;
    const gridItems = [];
    const equippedItem = draftAvatar.equipped[slot as keyof typeof draftAvatar.equipped];
    
    // Add "Remove" button first if something is equipped
    if (equippedItem) {
      gridItems.push(
        <motion.button
          key={`remove-${slot}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => updateDraftAvatar(slot, null)}
          className="aspect-square p-3 rounded-lg border-2 border-red-200 hover:border-red-300 bg-red-50 flex flex-col items-center justify-center relative"
        >
          <div className="text-2xl mb-1">❌</div>
          <div className="text-xs font-medium">Remove</div>
        </motion.button>
      );
    }
    
    // Fill with actual items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isEquipped = equippedItem === item.id;
      
      gridItems.push(
        <motion.button
          key={item.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleEquip(slot, item.id)}
          className={cn(
            "aspect-square p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center relative",
            isEquipped
              ? "border-purple-500 bg-purple-50 shadow-md"
              : "border-gray-200 hover:border-purple-300 bg-white"
          )}
        >
          {getRarityBadge(item)}
          <div className="text-2xl mb-1">{getItemEmoji(item.id)}</div>
          <div className="text-xs font-medium truncate max-w-full px-1">
            {item.name.replace('Avatar ', '').replace('Accessory', '').trim()}
          </div>
          {isEquipped && (
            <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              ✓
            </div>
          )}
        </motion.button>
      );
    }
    
    // Fill remaining slots with empty placeholders
    const startIndex = equippedItem ? items.length + 1 : items.length;
    for (let i = startIndex; i < GRID_SIZE; i++) {
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
    <div className="h-full flex flex-col">
      {/* Instructions */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-purple-800">
          <strong>Customize your avatar:</strong> Click items to equip them. Click again to remove.
        </p>
      </div>

      {/* Tabs for different categories */}
      <Tabs defaultValue="hat" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="hat" className="flex items-center gap-1 relative">
            <span className="text-lg">🎩</span>
            <span className="hidden sm:inline">Hats</span>
            {equippedSlots.hat && (
              <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                •
              </div>
            )}
          </TabsTrigger>
          <TabsTrigger value="glasses" className="flex items-center gap-1 relative">
            <span className="text-lg">👓</span>
            <span className="hidden sm:inline">Glasses</span>
            {equippedSlots.glasses && (
              <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                •
              </div>
            )}
          </TabsTrigger>
          <TabsTrigger value="accessory" className="flex items-center gap-1 relative">
            <span className="text-lg">💎</span>
            <span className="hidden sm:inline">Accessories</span>
            {equippedSlots.accessory && (
              <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                •
              </div>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="hat" className="mt-0">
            {categorizedItems.hat.length === 0 && !draftAvatar.equipped.hat ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎩</div>
                <p className="text-sm">No hats owned yet!</p>
                <p className="text-xs mt-1">Visit the store to get some.</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {renderItemGrid(categorizedItems.hat, 'hat')}
              </div>
            )}
          </TabsContent>

          <TabsContent value="glasses" className="mt-0">
            {categorizedItems.glasses.length === 0 && !draftAvatar.equipped.glasses ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">👓</div>
                <p className="text-sm">No glasses owned yet!</p>
                <p className="text-xs mt-1">Visit the store to get some.</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {renderItemGrid(categorizedItems.glasses, 'glasses')}
              </div>
            )}
          </TabsContent>

          <TabsContent value="accessory" className="mt-0">
            {categorizedItems.accessory.length === 0 && !draftAvatar.equipped.accessory ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💎</div>
                <p className="text-sm">No accessories owned yet!</p>
                <p className="text-xs mt-1">Visit the store to get some.</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {renderItemGrid(categorizedItems.accessory, 'accessory')}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
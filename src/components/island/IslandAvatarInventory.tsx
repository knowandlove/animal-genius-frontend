import { useState } from 'react';
import { useIslandStore } from '@/stores/islandStore';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { HardHat, Glasses, Gem, Save, RotateCcw } from 'lucide-react';
import { useStoreItems } from '@/contexts/StoreDataContext';
import { getItemById } from '@shared/currency-types';

export default function IslandAvatarInventory() {
  const [selectedTab, setSelectedTab] = useState('hat');
  
  const { 
    inventory,
    draftAvatar,
    avatar,
    updateDraftAvatar,
    saveDraftChanges,
    discardDraftChanges,
    ui,
  } = useIslandStore();
  
  const storeItems = useStoreItems();
  
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
  
  // Check if there are changes to save
  const hasChanges = JSON.stringify(avatar.equipped) !== JSON.stringify(draftAvatar.equipped);
  
  const handleItemClick = (slot: string, itemId: string) => {
    // If clicking the same item that's equipped, unequip it
    const currentItem = draftAvatar.equipped[slot as keyof typeof draftAvatar.equipped];
    updateDraftAvatar(slot, currentItem === itemId ? null : itemId);
  };
  
  const handleSave = async () => {
    await saveDraftChanges();
  };
  
  const handleDiscard = () => {
    discardDraftChanges();
  };
  
  const getItemImage = (itemId: string) => {
    const storeItem = storeItems?.find(item => item.id === itemId);
    return storeItem?.imageUrl || null;
  };
  
  const getItemEmoji = (itemId: string) => {
    if (itemId.includes('explorer') || itemId.includes('safari')) return '🎩';
    if (itemId.includes('party')) return '🥳';
    if (itemId.includes('crown')) return '👑';
    if (itemId.includes('sunglasses') || itemId.includes('greenblinds')) return '🕶️';
    if (itemId.includes('heart')) return '😍';
    if (itemId.includes('blind') || itemId.includes('glass')) return '👓';
    if (itemId.includes('bowtie') || itemId.includes('bow_tie')) return '🎀';
    if (itemId.includes('scarf')) return '🧣';
    if (itemId.includes('necklace')) return '📿';
    return '💎';
  };
  
  // Check which slots have equipped items
  const equippedSlots = {
    hat: !!draftAvatar.equipped.hat,
    glasses: !!draftAvatar.equipped.glasses,
    accessory: !!draftAvatar.equipped.accessory
  };
  
  const renderItemGrid = (items: any[], slot: string) => {
    const equippedItem = draftAvatar.equipped[slot as keyof typeof draftAvatar.equipped];
    
    if (items.length === 0 && !equippedItem) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">
            {slot === 'hat' ? '🎩' : slot === 'glasses' ? '🕶️' : '💎'}
          </div>
          <p className="text-sm">No {slot}s owned yet!</p>
          <p className="text-xs mt-1">Visit the store to get some.</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const isEquipped = equippedItem === item.id;
          const itemInfo = getItemById(item.id) || item;
          
          return (
            <Button
              key={item.id}
              variant={isEquipped ? "default" : "outline"}
              className={cn(
                "h-auto p-3 flex flex-col items-center gap-2 relative",
                isEquipped && "ring-2 ring-purple-500"
              )}
              onClick={() => handleItemClick(slot, item.id)}
            >
              {/* Item Image or Emoji */}
              {getItemImage(item.id) ? (
                <img 
                  src={getItemImage(item.id)!} 
                  alt={itemInfo.name}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <div className="text-2xl">{getItemEmoji(item.id)}</div>
              )}
              
              {/* Item Name */}
              <span className="text-xs font-medium text-center line-clamp-2">
                {itemInfo.name.replace('Avatar ', '').trim()}
              </span>
              
              {/* Rarity Badge */}
              {itemInfo.rarity && itemInfo.rarity !== 'common' && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "absolute top-1 right-1 text-xs px-1",
                    itemInfo.rarity === 'legendary' && 'bg-yellow-500',
                    itemInfo.rarity === 'rare' && 'bg-purple-500'
                  )}
                >
                  {itemInfo.rarity === 'legendary' ? '⭐' : '★'}
                </Badge>
              )}
              
              {/* Equipped Indicator */}
              {isEquipped && (
                <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
              )}
            </Button>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="h-full flex flex-col p-4">
      {/* Header with Save/Discard */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Avatar Items</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDiscard}
            disabled={!hasChanges || ui.isSaving}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || ui.isSaving}
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-purple-800">
          Click items to equip them on your avatar. Click again to remove.
        </p>
      </div>
      
      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hat" className="flex items-center gap-1 relative">
            <HardHat className="w-4 h-4" />
            <span className="hidden sm:inline">Hats</span>
            {equippedSlots.hat && (
              <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                •
              </div>
            )}
          </TabsTrigger>
          <TabsTrigger value="glasses" className="flex items-center gap-1 relative">
            <Glasses className="w-4 h-4" />
            <span className="hidden sm:inline">Glasses</span>
            {equippedSlots.glasses && (
              <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                •
              </div>
            )}
          </TabsTrigger>
          <TabsTrigger value="accessory" className="flex items-center gap-1 relative">
            <Gem className="w-4 h-4" />
            <span className="hidden sm:inline">Access.</span>
            {equippedSlots.accessory && (
              <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                •
              </div>
            )}
          </TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-y-auto mt-4">
          <TabsContent value="hat" className="mt-0">
            {renderItemGrid(categorizedItems.hat, 'hat')}
          </TabsContent>
          
          <TabsContent value="glasses" className="mt-0">
            {renderItemGrid(categorizedItems.glasses, 'glasses')}
          </TabsContent>
          
          <TabsContent value="accessory" className="mt-0">
            {renderItemGrid(categorizedItems.accessory, 'accessory')}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

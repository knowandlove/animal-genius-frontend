import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import LayeredAvatar from '@/components/avatar-v2/LayeredAvatar';
import { useIslandStore } from '@/stores/islandStore';
import { cn } from '@/lib/utils';

export default function AvatarCustomizerView() {
  const avatar = useIslandStore((state) => state.avatar);
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
    accessory: avatarItems.filter(item => item.type === 'avatar_accessory')
  };

  const handleEquip = (slot: string, itemId: string) => {
    // If clicking the same item, unequip it
    const currentItem = draftAvatar.equipped[slot as keyof typeof draftAvatar.equipped];
    updateDraftAvatar(slot, currentItem === itemId ? null : itemId);
  };

  const getItemEmoji = (itemId: string) => {
    if (itemId.includes('hat')) return '🎩';
    if (itemId.includes('glass') || itemId.includes('blind')) return '👓';
    return '💎';
  };

  return (
    <div className="space-y-6">
      {/* Avatar Preview */}
      <div className="flex justify-center">
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6">
          <LayeredAvatar
            animalType={avatar.type}
            items={draftAvatar.equipped}
            width={200}
            height={200}
            animated={true}
          />
        </div>
      </div>

      {/* Item Categories */}
      <div className="space-y-4">
        {(['hat', 'glasses', 'accessory'] as const).map((slot) => (
          <div key={slot}>
            <h3 className="font-semibold text-sm uppercase text-gray-600 mb-2 flex items-center gap-2">
              {slot === 'hat' && '🎩'}
              {slot === 'glasses' && '👓'}
              {slot === 'accessory' && '💎'}
              {slot}s
              {draftAvatar.equipped[slot] && (
                <Badge variant="secondary" className="text-xs">
                  Equipped
                </Badge>
              )}
            </h3>
            
            {categorizedItems[slot].length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No {slot}s owned yet. Visit the store!
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {categorizedItems[slot].map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEquip(slot, item.id)}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-center",
                      draftAvatar.equipped[slot] === item.id
                        ? "border-purple-500 bg-purple-50 shadow-md"
                        : "border-gray-200 hover:border-purple-300 bg-white"
                    )}
                  >
                    <div className="text-2xl mb-1">{getItemEmoji(item.id)}</div>
                    <div className="text-xs font-medium truncate">{item.name}</div>
                  </motion.button>
                ))}
                {draftAvatar.equipped[slot] && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => updateDraftAvatar(slot, null)}
                    className="p-3 rounded-lg border-2 border-red-200 hover:border-red-300 bg-red-50"
                  >
                    <div className="text-2xl mb-1">❌</div>
                    <div className="text-xs font-medium">Remove</div>
                  </motion.button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Sparkles } from 'lucide-react';
import LayeredAvatarRoom from '@/components/avatar-v2/LayeredAvatarRoom';
import { motion, AnimatePresence } from 'framer-motion';

interface AvatarCustomizerProps {
  animalType: string;
  ownedItems: string[];
  equippedItems: {
    hat?: string;
    glasses?: string;
    accessory?: string;
  };
  onEquip: (slot: string, itemId: string | null) => void;
  onClose: () => void;
}

export default function AvatarCustomizer({
  animalType,
  ownedItems,
  equippedItems,
  onEquip,
  onClose
}: AvatarCustomizerProps) {
  const [localEquipped, setLocalEquipped] = useState(equippedItems);

  // Categorize owned items
  const categorizedItems = {
    hat: ownedItems.filter(id => id.includes('explorer') || id.includes('safari')),
    glasses: ownedItems.filter(id => id.includes('blind') || id.includes('heart') || id.includes('glass')),
    accessory: ownedItems.filter(id => id.includes('bow') || id.includes('necklace'))
  };

  const handleEquipLocal = (slot: string, itemId: string | null) => {
    const newEquipped = { ...localEquipped };
    if (itemId === null || itemId === localEquipped[slot as keyof typeof localEquipped]) {
      // Unequip
      delete newEquipped[slot as keyof typeof newEquipped];
    } else {
      // Equip
      newEquipped[slot as keyof typeof newEquipped] = itemId;
    }
    setLocalEquipped(newEquipped);
    onEquip(slot, itemId === localEquipped[slot as keyof typeof localEquipped] ? null : itemId);
  };

  const getItemName = (itemId: string) => {
    if (itemId.includes('explorer')) return 'Explorer Hat';
    if (itemId.includes('safari')) return 'Safari Hat';
    if (itemId.includes('greenblinds')) return 'Green Blinds';
    if (itemId.includes('hearts')) return 'Heart Glasses';
    if (itemId.includes('bow')) return 'Bow Tie';
    if (itemId.includes('necklace')) return 'Sparkle Necklace';
    return itemId;
  };

  const getItemEmoji = (itemId: string) => {
    if (itemId.includes('hat')) return '🎩';
    if (itemId.includes('glass') || itemId.includes('blind')) return '👓';
    if (itemId.includes('bow') || itemId.includes('necklace')) return '💎';
    return '📦';
  };

  return (
    <Card className="fixed inset-0 z-50 m-4 lg:m-auto lg:max-w-4xl lg:max-h-[90vh] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Sparkles className="w-6 h-6" />
          Customize Your Avatar
        </CardTitle>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent className="h-full overflow-auto pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8 mb-4">
              <LayeredAvatarRoom
                animalType={animalType}
                items={localEquipped}
                width={350}
                height={350}
                animated={true}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Click items below to equip/unequip them
            </p>
          </div>

          {/* Equipment Slots */}
          <div className="space-y-4">
            {(['hat', 'glasses', 'accessory'] as const).map((slot) => (
              <div key={slot} className="space-y-2">
                <h3 className="font-semibold capitalize flex items-center gap-2">
                  {slot === 'hat' && '🎩'}
                  {slot === 'glasses' && '👓'}
                  {slot === 'accessory' && '💎'}
                  {slot}
                  {localEquipped[slot] && (
                    <Badge variant="secondary" className="text-xs">
                      Equipped
                    </Badge>
                  )}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {categorizedItems[slot].length === 0 ? (
                    <p className="text-sm text-muted-foreground col-span-2">
                      No {slot} items owned yet. Visit the store!
                    </p>
                  ) : (
                    <>
                      {categorizedItems[slot].map((itemId) => (
                        <motion.button
                          key={itemId}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEquipLocal(slot, itemId)}
                          className={`
                            p-3 rounded-lg border-2 transition-all
                            ${localEquipped[slot] === itemId 
                              ? 'border-purple-500 bg-purple-50' 
                              : 'border-gray-200 hover:border-purple-300 bg-white'
                            }
                          `}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl">{getItemEmoji(itemId)}</span>
                            <span className="text-xs font-medium">
                              {getItemName(itemId)}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                      {localEquipped[slot] && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEquipLocal(slot, null)}
                          className="p-3 rounded-lg border-2 border-red-200 hover:border-red-300 bg-red-50"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl">❌</span>
                            <span className="text-xs font-medium text-red-600">
                              Remove
                            </span>
                          </div>
                        </motion.button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
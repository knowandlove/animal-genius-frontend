import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HardHat, Glasses, Gem, Sofa, Package, Palette, Sparkles, Coins, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { usePetCatalog } from '@/hooks/usePets';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useRoomStore } from '@/stores/roomStore';
import { LoadingSpinner } from '@/components/loading-spinner';

interface StoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeStatus: any;
  storeCatalog: any[];
  availableBalance: number;
  onPurchaseClick: (item: any) => void;
}

export default function StoreModal({
  open,
  onOpenChange,
  storeStatus,
  storeCatalog,
  availableBalance,
  onPurchaseClick
}: StoreModalProps) {
  const [activeTab, setActiveTab] = useState('pets');
  const queryClient = useQueryClient();
  const pet = useRoomStore((state) => state.pet);
  const passportCode = useRoomStore((state) => state.passportCode);
  
  // Fetch pet catalog
  const { data: petCatalog, isLoading: petsLoading } = usePetCatalog();
  
  // Pet purchase mutation
  const purchasePetMutation = useMutation({
    mutationFn: async ({ petId, petName }: { petId: string; petName: string }) => {
      console.log('Purchasing pet:', { petId, customName: petName });
      return apiRequest('POST', '/api/pets/purchase', { 
        petId,
        customName: petName 
      });
    },
    onSuccess: (data) => {
      // Update local pet state
      useRoomStore.getState().setPet(data.pet);
      
      // Refresh room data
      queryClient.invalidateQueries({ queryKey: [`/api/room-page-data/${passportCode}`] });
      
      // Show success message
      alert(`🎉 Congratulations! You've adopted ${data.pet.customName}!`);
    },
    onError: (error: any) => {
      console.error('Pet purchase error:', error);
      const errorMessage = error.details ? 
        `${error.message}: ${JSON.stringify(error.details)}` : 
        (error.message || 'Failed to purchase pet');
      alert(`❌ ${errorMessage}`);
    }
  });

  // Ensure storeCatalog is an array
  const catalog = Array.isArray(storeCatalog) ? storeCatalog : [];
  
  // Categorize items by type
  const categorizedItems = {
    hats: catalog.filter(item => item.type === 'avatar_hat'),
    glasses: catalog.filter(item => 
      item.type === 'avatar_accessory' && 
      (item.name?.toLowerCase().includes('glass') || 
       item.name?.toLowerCase().includes('blind') || 
       item.name?.toLowerCase().includes('heart') ||
       item.name?.toLowerCase().includes('shade'))
    ),
    accessories: catalog.filter(item => 
      item.type === 'avatar_accessory' && 
      !item.name?.toLowerCase().includes('glass') && 
      !item.name?.toLowerCase().includes('blind') && 
      !item.name?.toLowerCase().includes('heart') &&
      !item.name?.toLowerCase().includes('shade')
    ),
    furniture: catalog.filter(item => item.type === 'room_furniture'),
    objects: catalog.filter(item => item.type === 'room_decoration'),
    wallpaper: catalog.filter(item => item.type === 'room_wallpaper'),
    flooring: catalog.filter(item => item.type === 'room_flooring')
  };

  const getItemEmoji = (item: any) => {
    // Item-specific emojis based on name
    const name = item.name?.toLowerCase() || '';
    if (name.includes('wizard')) return '🧙';
    if (name.includes('cowboy')) return '🤠';
    if (name.includes('crown')) return '👑';
    if (name.includes('pirate')) return '🏴‍☠️';
    if (name.includes('party')) return '🎉';
    if (name.includes('sunglasses') || name.includes('shades')) return '🕶️';
    if (name.includes('heart')) return '😍';
    if (name.includes('blind') || name.includes('glass')) return '👓';
    if (name.includes('scarf')) return '🧣';
    if (name.includes('cape')) return '🦸';
    if (name.includes('desk')) return '📚';
    if (name.includes('fridge')) return '🧊';
    if (name.includes('easel')) return '🎨';
    if (name.includes('lamp')) return '💡';
    if (name.includes('plant') || name.includes('succulent')) return '🪴';
    if (name.includes('clock')) return '🕐';
    if (name.includes('globe')) return '🌍';
    
    // Type-based fallbacks
    if (item.type === 'avatar_hat') return '🎩';
    if (item.type === 'room_furniture') return '🪑';
    if (item.type === 'room_decoration') return '🖼️';
    if (item.type === 'room_wallpaper') return '🎨';
    if (item.type === 'room_flooring') return '🟫';
    return '💎';
  };
  
  const getPetEmoji = (species: string) => {
    const s = species.toLowerCase();
    if (s.includes('cat')) return '🐱';
    if (s.includes('dog')) return '🐶';
    if (s.includes('dragon')) return '🐲';
    if (s.includes('unicorn')) return '🦄';
    if (s.includes('bird')) return '🦜';
    if (s.includes('fish')) return '🐠';
    return '🐾';
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-yellow-500';
      case 'rare': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  const renderPetGrid = () => {
    if (petsLoading) {
      return (
        <div className="text-center py-12">
          <LoadingSpinner />
          <p className="text-sm mt-4">Loading available pets...</p>
        </div>
      );
    }
    
    if (pet) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">{getPetEmoji(pet.pet?.species || '')}</div>
          <h3 className="text-lg font-semibold mb-2">You already have a pet!</h3>
          <p className="text-sm text-muted-foreground">
            {pet.customName} is waiting for you in your room.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Multiple pets coming in a future update!
          </p>
        </div>
      );
    }
    
    if (!petCatalog || petCatalog.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No pets available yet!</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-2 gap-4">
        {petCatalog.map((pet) => (
          <motion.div
            key={pet.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card className={cn(
              "transition-all cursor-pointer",
              availableBalance >= pet.cost 
                ? 'hover:border-purple-300 hover:shadow-md' 
                : 'opacity-60'
            )}>
              <CardContent className="p-4">
                <div className="relative">
                  {/* Rarity badge */}
                  {pet.rarity !== 'common' && (
                    <Badge className={cn(
                      "absolute -top-2 -right-2 text-xs px-2",
                      getRarityColor(pet.rarity)
                    )}>
                      {pet.rarity === 'legendary' ? '⭐ Legendary' : '★ Rare'}
                    </Badge>
                  )}
                  
                  {/* Pet display */}
                  <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {pet.assetUrl ? (
                      <img 
                        src={pet.assetUrl} 
                        alt={pet.name}
                        className="w-full h-full object-contain p-4"
                      />
                    ) : (
                      <span className="text-6xl">{getPetEmoji(pet.species)}</span>
                    )}
                  </div>
                  
                  {/* Pet info */}
                  <h4 className="font-semibold text-lg mb-1">{pet.name}</h4>
                  <p className="text-xs text-muted-foreground mb-1">Species: {pet.species}</p>
                  <p className="text-sm text-muted-foreground mb-3">{pet.description}</p>
                  
                  {/* Stats preview */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span>Hunger decay:</span>
                      <span className="font-medium">{pet.baseStats.hungerDecayRate}/hour</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Happiness decay:</span>
                      <span className="font-medium">{pet.baseStats.happinessDecayRate}/hour</span>
                    </div>
                  </div>
                  
                  {/* Price and action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-600" />
                      <span className="font-semibold">{pet.cost}</span>
                    </div>
                    
                    <Button
                      size="sm"
                      disabled={availableBalance < pet.cost || purchasePetMutation.isPending}
                      variant={availableBalance >= pet.cost ? 'default' : 'secondary'}
                      onClick={() => {
                        const petName = prompt(`What would you like to name your ${pet.name}?`, pet.name);
                        if (petName && petName.trim()) {
                          purchasePetMutation.mutate({ 
                            petId: pet.id, 
                            petName: petName.trim() 
                          });
                        }
                      }}
                    >
                      {purchasePetMutation.isPending ? (
                        <><LoadingSpinner className="w-3 h-3 mr-1" /> Adopting...</>
                      ) : availableBalance >= pet.cost ? (
                        'Adopt'
                      ) : (
                        'Need Coins'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderItemGrid = (items: any[], emptyMessage: string) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card className={cn(
              "transition-all cursor-pointer",
              availableBalance >= item.cost 
                ? 'hover:border-purple-300 hover:shadow-md' 
                : 'opacity-60'
            )}>
              <CardContent className="p-3">
                <div className="relative">
                  {/* Rarity badge */}
                  {item.rarity !== 'common' && (
                    <Badge className={cn(
                      "absolute -top-1 -right-1 text-xs px-1",
                      getRarityColor(item.rarity)
                    )}>
                      {item.rarity === 'legendary' ? '⭐' : '★'}
                    </Badge>
                  )}
                  
                  {/* Item display */}
                  <div className="aspect-square bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // Fallback to emoji if image fails
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.insertAdjacentHTML(
                            'beforeend',
                            `<span class="text-3xl">${getItemEmoji(item)}</span>`
                          );
                        }}
                      />
                    ) : (
                      <span className="text-3xl">{getItemEmoji(item)}</span>
                    )}
                  </div>
                  
                  {/* Item info */}
                  <h4 className="font-medium text-sm truncate mb-1">{item.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2 h-8">
                    {item.description}
                  </p>
                  
                  {/* Price and action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-yellow-600" />
                      <span className="text-sm font-semibold">{item.cost}</span>
                    </div>
                    
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      disabled={availableBalance < item.cost}
                      variant={availableBalance >= item.cost ? 'default' : 'secondary'}
                      onClick={() => onPurchaseClick(item)}
                    >
                      {availableBalance >= item.cost ? 'Buy Now' : 'Need Coins'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Room Store
          </DialogTitle>
          <DialogDescription asChild>
            <div>
              {storeStatus?.isOpen ? (
                <span className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Open</Badge>
                  {storeStatus.message}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800">Closed</Badge>
                  Store is currently closed
                </span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        
        {storeStatus?.isOpen && storeCatalog && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-6 py-4">
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="pets" className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span className="hidden lg:inline">Pets</span>
                </TabsTrigger>
                <TabsTrigger value="hats" className="flex items-center gap-1">
                  <HardHat className="w-4 h-4" />
                  <span className="hidden lg:inline">Hats</span>
                </TabsTrigger>
                <TabsTrigger value="glasses" className="flex items-center gap-1">
                  <Glasses className="w-4 h-4" />
                  <span className="hidden lg:inline">Glasses</span>
                </TabsTrigger>
                <TabsTrigger value="accessories" className="flex items-center gap-1">
                  <Gem className="w-4 h-4" />
                  <span className="hidden lg:inline">Access.</span>
                </TabsTrigger>
                <TabsTrigger value="furniture" className="flex items-center gap-1">
                  <Sofa className="w-4 h-4" />
                  <span className="hidden lg:inline">Furniture</span>
                </TabsTrigger>
                <TabsTrigger value="objects" className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span className="hidden lg:inline">Objects</span>
                </TabsTrigger>
                <TabsTrigger value="wallpaper" className="flex items-center gap-1">
                  <Palette className="w-4 h-4" />
                  <span className="hidden lg:inline">Walls</span>
                </TabsTrigger>
                <TabsTrigger value="flooring" className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gradient-to-b from-amber-600 to-amber-800 rounded-sm" />
                  <span className="hidden lg:inline">Floors</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 px-6 pb-6">
              <TabsContent value="pets" className="mt-0">
                {renderPetGrid()}
              </TabsContent>
              
              <TabsContent value="hats" className="mt-0">
                {renderItemGrid(categorizedItems.hats, "No hats available in the store yet!")}
              </TabsContent>
              
              <TabsContent value="glasses" className="mt-0">
                {renderItemGrid(categorizedItems.glasses, "No glasses available in the store yet!")}
              </TabsContent>
              
              <TabsContent value="accessories" className="mt-0">
                {renderItemGrid(categorizedItems.accessories, "No accessories available in the store yet!")}
              </TabsContent>
              
              <TabsContent value="furniture" className="mt-0">
                {renderItemGrid(categorizedItems.furniture, "No furniture available in the store yet!")}
              </TabsContent>
              
              <TabsContent value="objects" className="mt-0">
                {renderItemGrid(categorizedItems.objects, "No decorative objects available in the store yet!")}
              </TabsContent>
              
              <TabsContent value="wallpaper" className="mt-0">
                {categorizedItems.wallpaper.length > 0 ? (
                  renderItemGrid(categorizedItems.wallpaper, "")
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Palette className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm mb-2">Wallpaper patterns coming soon!</p>
                    <p className="text-xs text-muted-foreground">
                      Use the room editor to change wall colors for now.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="flooring" className="mt-0">
                {categorizedItems.flooring.length > 0 ? (
                  renderItemGrid(categorizedItems.flooring, "")
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-b from-amber-200 to-amber-400 rounded" />
                    <p className="text-sm mb-2">Flooring patterns coming soon!</p>
                    <p className="text-xs text-muted-foreground">
                      Use the room editor to change floor colors for now.
                    </p>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HardHat, Glasses, Gem, Sofa, Package, Palette, Sparkles, Coins, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { usePetCatalog } from '@/hooks/usePets';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useRoomStore } from '@/stores/roomStore';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useToast } from '@/hooks/use-toast';

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
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [showPetNameDialog, setShowPetNameDialog] = useState(false);
  const [selectedPetForAdoption, setSelectedPetForAdoption] = useState<any>(null);
  const [petNameInput, setPetNameInput] = useState('');
  const [petNameError, setPetNameError] = useState('');
  const queryClient = useQueryClient();
  const pet = useRoomStore((state) => state.pet);
  const passportCode = useRoomStore((state) => state.passportCode);
  const { toast } = useToast();
  
  // Pet name validation regex - alphanumeric, spaces, hyphens, apostrophes
  const petNameRegex = /^[a-zA-Z0-9\s'-]{1,20}$/;
  
  const validatePetName = (name: string): string => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return 'Pet name cannot be empty';
    }
    
    if (trimmedName.length > 20) {
      return 'Pet name cannot exceed 20 characters';
    }
    
    if (!petNameRegex.test(trimmedName)) {
      return 'Only letters, numbers, spaces, hyphens, and apostrophes are allowed';
    }
    
    return ''; // No error
  };
  
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
      toast({
        title: "🎉 Congratulations!",
        description: `You've adopted ${data.pet.customName}!`,
      });
    },
    onError: (error: any) => {
      console.error('Pet purchase error:', error);
      const errorMessage = error.details ? 
        `${error.message}: ${JSON.stringify(error.details)}` : 
        (error.message || 'Failed to purchase pet');
      toast({
        title: "Purchase Failed",
        description: errorMessage,
        variant: "destructive",
      });
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

  // Component for handling image loading and errors
  const ItemImage = ({ item }: { item: any }) => {
    const itemId = item.id;
    const hasError = imageLoadErrors[itemId];
    const isLoading = imageLoading[itemId] !== false; // Default to loading
    
    // Use thumbnail for grid display (faster loading)
    const imageUrl = item.thumbnailUrl || item.imageUrl;
    
    return (
      <div className="aspect-square bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
        {/* Loading state */}
        {isLoading && !hasError && imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <LoadingSpinner className="w-6 h-6" />
          </div>
        )}
        
        {/* Show image if we have URL and no error */}
        {imageUrl && !hasError && (
          <img 
            src={imageUrl} 
            alt={item.name}
            className={cn(
              "object-contain",
              // Special sizing for fish bowl
              item.name === 'Fish Bowl' ? "w-3/4 h-3/4" : "w-full h-full"
            )}
            onLoad={() => {
              setImageLoading(prev => ({ ...prev, [itemId]: false }));
            }}
            onError={() => {
              setImageLoadErrors(prev => ({ ...prev, [itemId]: true }));
              setImageLoading(prev => ({ ...prev, [itemId]: false }));
            }}
            loading="lazy"
          />
        )}
        
        {/* Fallback to emoji if no image or error */}
        {(!imageUrl || hasError) && !isLoading && (
          <span className="text-3xl">{getItemEmoji(item)}</span>
        )}
        
        {/* Show RIVE badge if it's an animation */}
        {item.assetType === 'rive' && item.thumbnailUrl && !hasError && (
          <div className="absolute top-1 left-1 bg-purple-600 text-white text-xs px-1 rounded">
            RIVE
          </div>
        )}
      </div>
    );
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
                  <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden p-2">
                    {pet.species === 'goldfish' ? (
                      // Special handling for fish - use the thumbnail
                      <img 
                        src="https://zqyvfnbwpagguutzdvpy.supabase.co/storage/v1/object/public/store-items/pets/fishpreview.png" 
                        alt={pet.name}
                        className="w-full h-full object-contain"
                      />
                    ) : pet.assetUrl && !pet.assetUrl.endsWith('.riv') ? (
                      // Regular images
                      <img 
                        src={pet.assetUrl} 
                        alt={pet.name}
                        className="w-full h-full object-contain p-4"
                      />
                    ) : (
                      // Fallback to emoji for Rive files or no URL
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
                        setSelectedPetForAdoption(pet);
                        setPetNameInput(pet.name);
                        setShowPetNameDialog(true);
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
                  
                  {/* Item display - using our new ItemImage component */}
                  <ItemImage item={item} />
                  
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

  // Preload images when store catalog loads
  useEffect(() => {
    if (storeCatalog && storeCatalog.length > 0) {
      const preloadImages = (items: any[]) => {
        items.forEach(item => {
          if (item.thumbnailUrl || item.imageUrl) {
            const img = new Image();
            img.src = item.thumbnailUrl || item.imageUrl;
          }
        });
      };
      preloadImages(storeCatalog);
    }
  }, [storeCatalog]);

  return (
    <>
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

    {/* Pet Naming Dialog */}
    <Dialog open={showPetNameDialog} onOpenChange={setShowPetNameDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Name Your New Pet!</DialogTitle>
          <DialogDescription>
            What would you like to name your {selectedPetForAdoption?.name}?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="pet-name">Pet Name</Label>
          <Input
            id="pet-name"
            value={petNameInput}
            onChange={(e) => {
              const value = e.target.value;
              setPetNameInput(value);
              // Validate on change
              const error = validatePetName(value);
              setPetNameError(error);
            }}
            placeholder="Enter a name for your pet"
            maxLength={20}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const error = validatePetName(petNameInput);
                if (!error && petNameInput.trim()) {
                  purchasePetMutation.mutate({
                    petId: selectedPetForAdoption.id,
                    petName: petNameInput.trim()
                  });
                  setShowPetNameDialog(false);
                }
              }
            }}
            className={petNameError ? 'border-red-500' : ''}
          />
          {petNameError ? (
            <p className="text-sm text-red-500 mt-2">{petNameError}</p>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">
              Letters, numbers, spaces, hyphens, and apostrophes only
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowPetNameDialog(false);
              setPetNameError('');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              const error = validatePetName(petNameInput);
              if (error) {
                setPetNameError(error);
                return;
              }
              
              purchasePetMutation.mutate({
                petId: selectedPetForAdoption.id,
                petName: petNameInput.trim()
              });
              setShowPetNameDialog(false);
              setPetNameError('');
            }}
            disabled={!!petNameError || !petNameInput.trim() || purchasePetMutation.isPending}
          >
            {purchasePetMutation.isPending ? (
              <><LoadingSpinner className="w-4 h-4 mr-2" /> Adopting...</>
            ) : (
              'Adopt Pet'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

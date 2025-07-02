import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import LayeredAvatar from "@/components/avatar-v2/LayeredAvatar";
import { Coins, Home, ShoppingBag, Package, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { StudentIsland } from "@shared/currency-types";
import { getItemById } from "@shared/currency-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function StudentIsland() {
  const { passportCode } = useParams();
  const queryClient = useQueryClient();
  const [showInventory, setShowInventory] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch student island data
  const { data: islandData, isLoading, error } = useQuery({
    queryKey: [`/api/island/${passportCode}`],
    queryFn: () => apiRequest('GET', `/api/island/${passportCode}`),
    enabled: !!passportCode,
  });

  // Fetch store status
  const { data: storeStatus } = useQuery({
    queryKey: [`/api/island/${passportCode}/store`],
    queryFn: () => apiRequest('GET', `/api/island/${passportCode}/store`),
    enabled: !!passportCode,
  });

  // Fetch store catalog
  const { data: storeCatalog } = useQuery({
    queryKey: ['/api/store/catalog'],
    queryFn: () => apiRequest('GET', '/api/store/catalog'),
  });

  // Fetch purchase requests
  const { data: purchaseRequests } = useQuery({
    queryKey: [`/api/island/${passportCode}/purchases`],
    queryFn: () => apiRequest('GET', `/api/island/${passportCode}/purchases`),
    enabled: !!passportCode,
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: (itemId: string) => 
      apiRequest('POST', `/api/island/${passportCode}/purchase`, { itemId }),
    onSuccess: (data) => {
      setPurchaseMessage({ type: 'success', message: data.message });
      setShowPurchaseDialog(false);
      queryClient.invalidateQueries({ queryKey: [`/api/island/${passportCode}/purchases`] });
      setTimeout(() => setPurchaseMessage(null), 5000);
    },
    onError: (error: any) => {
      setPurchaseMessage({ 
        type: 'error', 
        message: error.message || 'Failed to submit purchase request' 
      });
      setShowPurchaseDialog(false);
      setTimeout(() => setPurchaseMessage(null), 5000);
    },
  });

  // Equip mutation
  const equipMutation = useMutation({
    mutationFn: ({ slot, itemId }: { slot: string; itemId: string | null }) => 
      apiRequest('POST', `/api/island/${passportCode}/equip`, { slot, itemId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/island/${passportCode}`] });
    },
    onError: (error: any) => {
      setPurchaseMessage({ 
        type: 'error', 
        message: error.message || 'Failed to equip item' 
      });
      setTimeout(() => setPurchaseMessage(null), 3000);
    },
  });

  const handleEquipItem = (slot: string, itemId: string | null) => {
    equipMutation.mutate({ slot, itemId });
  };

  const handlePurchaseClick = (item: any) => {
    setSelectedItem(item);
    setShowPurchaseDialog(true);
  };

  const confirmPurchase = () => {
    if (selectedItem) {
      purchaseMutation.mutate(selectedItem.id);
    }
  };

  // Calculate available balance (total - pending)
  const totalPendingCost = useMemo(() => {
    if (!purchaseRequests) return 0;
    return purchaseRequests
      .filter((req: any) => req.status === 'pending')
      .reduce((sum: number, req: any) => sum + req.cost, 0);
  }, [purchaseRequests]);
  
  const availableBalance = (islandData?.currencyBalance || 0) - totalPendingCost;

  // Check if item has pending request
  const hasPendingRequest = (itemId: string) => {
    return purchaseRequests?.some(
      (req: any) => req.itemId === itemId && req.status === 'pending'
    );
  };

  // Categorize owned items
  const categorizedItems = useMemo(() => {
    if (!islandData?.avatarData?.owned) return { hats: [], glasses: [], accessories: [] };
    
    const items = {
      hats: [] as any[],
      glasses: [] as any[],
      accessories: [] as any[]
    };
    
    islandData.avatarData.owned.forEach((itemId: string) => {
      const item = getItemById(itemId);
      if (!item) return;
      
      if (item.type === 'avatar_hat') {
        items.hats.push({ ...item, id: itemId });
      } else if (itemId.includes('blind') || itemId.includes('heart') || itemId.includes('glass')) {
        items.glasses.push({ ...item, id: itemId });
      } else if (item.type === 'avatar_accessory') {
        items.accessories.push({ ...item, id: itemId });
      }
    });
    
    return items;
  }, [islandData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="p-8">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-lg">Loading your island...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !islandData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <div className="text-4xl mb-4">🏝️</div>
            <h2 className="text-xl font-bold mb-2">Island Not Found</h2>
            <p className="text-muted-foreground mb-4">
              We couldn't find an island with passport code: <span className="font-mono">{passportCode}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Double-check your passport code or ask your teacher for help.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const island = islandData as StudentIsland;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Room Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/backgrounds/wooden-room.jpg')`,
          backgroundColor: '#8B6F47' // Fallback brown color
        }}
      >
        {/* Gradient overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Header Bar */}
        <div className="bg-black/50 backdrop-blur-sm p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">
                {island.studentName}'s {island.animalType} Den
              </h1>
              <Badge variant="secondary" className="text-sm">
                {island.className}
              </Badge>
            </div>
            <div className="flex items-center gap-2 bg-yellow-600/90 rounded-full px-4 py-2">
              <Coins className="w-5 h-5 text-yellow-200" />
              <span className="font-bold text-lg text-white">{island.currencyBalance}</span>
              {totalPendingCost > 0 && (
                <span className="text-xs text-yellow-200">({availableBalance} available)</span>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {purchaseMessage && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50">
            <Alert className={cn(
              "border-2 shadow-lg",
              purchaseMessage.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            )}>
              <AlertDescription className="flex items-center gap-2">
                {purchaseMessage.type === 'success' ? (
                  <Sparkles className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-red-600" />
                )}
                {purchaseMessage.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Main Avatar Display */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative">
            <LayeredAvatar
              animalType={island.animalType}
              items={island.avatarData?.equipped || {}}
              width={400}
              height={400}
              animated={true}
              className="drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="bg-black/60 backdrop-blur-sm p-4">
          <div className="container mx-auto flex justify-center gap-4">
            <Button
              size="lg"
              onClick={() => setShowInventory(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Package className="w-5 h-5" />
              Inventory
              {categorizedItems.hats.length + categorizedItems.glasses.length + categorizedItems.accessories.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {categorizedItems.hats.length + categorizedItems.glasses.length + categorizedItems.accessories.length}
                </Badge>
              )}
            </Button>
            <Button
              size="lg"
              onClick={() => setShowStore(true)}
              disabled={!storeStatus?.isOpen}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
            >
              <ShoppingBag className="w-5 h-5" />
              Store
              {storeStatus?.isOpen ? (
                <Badge variant="secondary" className="ml-1 bg-green-400 text-green-900">Open</Badge>
              ) : (
                <Badge variant="secondary" className="ml-1 bg-red-400 text-red-900">Closed</Badge>
              )}
            </Button>
            <Button
              size="lg"
              disabled
              className="flex items-center gap-2 bg-gray-600 cursor-not-allowed"
            >
              <Home className="w-5 h-5" />
              Room
              <Badge variant="secondary" className="ml-1">Coming Soon</Badge>
            </Button>
          </div>
        </div>
      </div>

      {/* Inventory Modal */}
      <Dialog open={showInventory} onOpenChange={setShowInventory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl">Inventory</DialogTitle>
            <DialogDescription>
              Manage your avatar items and room decorations
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="avatar" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="avatar">Avatar Items</TabsTrigger>
              <TabsTrigger value="room" disabled>Room Items (Coming Soon)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="avatar" className="space-y-6 max-h-[50vh] overflow-y-auto">
              {/* Hats */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-2xl">🎩</span> Hats
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {categorizedItems.hats.length > 0 ? (
                    categorizedItems.hats.map((item) => {
                      const isEquipped = island.avatarData?.equipped?.hat === item.id;
                      return (
                        <Card 
                          key={item.id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-lg",
                            isEquipped && "ring-2 ring-green-500 bg-green-50",
                            equipMutation.isPending && "opacity-50 cursor-wait"
                          )}
                          onClick={() => !equipMutation.isPending && handleEquipItem('hat', isEquipped ? null : item.id)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-3xl">🎩</span>
                            </div>
                            <h4 className="font-semibold text-sm">{item.name}</h4>
                            <Badge variant={item.rarity === 'rare' ? 'default' : 'outline'} className="mt-1 text-xs">
                              {item.rarity}
                            </Badge>
                            {isEquipped && (
                              <Badge variant="secondary" className="mt-2 bg-green-100">
                                Equipped
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground col-span-full text-center py-8">
                      No hats owned yet. Visit the store to buy some!
                    </p>
                  )}
                </div>
              </div>

              {/* Glasses */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-2xl">🕶️</span> Glasses
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {categorizedItems.glasses.length > 0 ? (
                    categorizedItems.glasses.map((item) => {
                      const isEquipped = island.avatarData?.equipped?.glasses === item.id;
                      return (
                        <Card 
                          key={item.id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-lg",
                            isEquipped && "ring-2 ring-green-500 bg-green-50",
                            equipMutation.isPending && "opacity-50 cursor-wait"
                          )}
                          onClick={() => !equipMutation.isPending && handleEquipItem('glasses', isEquipped ? null : item.id)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-3xl">🕶️</span>
                            </div>
                            <h4 className="font-semibold text-sm">{item.name}</h4>
                            <Badge variant={item.rarity === 'rare' ? 'default' : 'outline'} className="mt-1 text-xs">
                              {item.rarity}
                            </Badge>
                            {isEquipped && (
                              <Badge variant="secondary" className="mt-2 bg-green-100">
                                Equipped
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground col-span-full text-center py-8">
                      No glasses owned yet. Visit the store to buy some!
                    </p>
                  )}
                </div>
              </div>

              {/* Accessories */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-2xl">💎</span> Accessories
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {categorizedItems.accessories.length > 0 ? (
                    categorizedItems.accessories.map((item) => {
                      const isEquipped = island.avatarData?.equipped?.accessory === item.id;
                      return (
                        <Card 
                          key={item.id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-lg",
                            isEquipped && "ring-2 ring-green-500 bg-green-50",
                            equipMutation.isPending && "opacity-50 cursor-wait"
                          )}
                          onClick={() => !equipMutation.isPending && handleEquipItem('accessory', isEquipped ? null : item.id)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-3xl">💎</span>
                            </div>
                            <h4 className="font-semibold text-sm">{item.name}</h4>
                            <Badge variant={item.rarity === 'rare' ? 'default' : 'outline'} className="mt-1 text-xs">
                              {item.rarity}
                            </Badge>
                            {isEquipped && (
                              <Badge variant="secondary" className="mt-2 bg-green-100">
                                Equipped
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground col-span-full text-center py-8">
                      No accessories owned yet. Visit the store to buy some!
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="room">
              <div className="text-center py-12 text-muted-foreground">
                <Home className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Room decoration coming soon!</p>
                <p className="text-sm mt-2">You'll be able to customize your den with furniture and decorations.</p>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Store Modal */}
      <Dialog open={showStore} onOpenChange={setShowStore}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl">Store</DialogTitle>
            <DialogDescription>
              {storeStatus?.isOpen ? storeStatus.message : "Store is currently closed"}
            </DialogDescription>
          </DialogHeader>
          
          {storeStatus?.isOpen && storeCatalog && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 max-h-[60vh] overflow-y-auto">
              {storeCatalog.filter((item: any) => item.type.startsWith('avatar')).map((item: any) => (
                <Card key={item.id} className={cn(
                  "transition-all hover:shadow-md",
                  availableBalance >= item.cost ? 'border-green-200' : 'border-gray-200 opacity-75'
                )}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{item.name}</h4>
                      <Badge variant={item.rarity === 'rare' ? 'default' : 'outline'}>
                        {item.rarity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 h-10">
                      {item.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-yellow-600" />
                        <span className="font-semibold">{item.cost}</span>
                      </div>
                      {hasPendingRequest(item.id) ? (
                        <Badge variant="outline" className="text-xs">
                          Pending Approval
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          disabled={availableBalance < item.cost}
                          variant={availableBalance >= item.cost ? 'default' : 'secondary'}
                          onClick={() => handlePurchaseClick(item)}
                        >
                          {availableBalance >= item.cost ? 'Buy' : 'Need More Coins'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              Are you sure you want to buy this item?
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{selectedItem.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                </div>
                <Badge variant={selectedItem.rarity === 'rare' ? 'default' : 'outline'}>
                  {selectedItem.rarity}
                </Badge>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-lg">{selectedItem.cost} coins</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Available: {availableBalance} coins
                  {totalPendingCost > 0 && (
                    <span className="text-xs"> ({totalPendingCost} pending)</span>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmPurchase} 
              disabled={purchaseMutation.isPending}
            >
              {purchaseMutation.isPending ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Submitting...
                </>
              ) : (
                'Confirm Purchase'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useMemo, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import LayeredAvatar from "@/components/avatar-v2/LayeredAvatar";
import { Coins, Home, ShoppingBag, Package, Sparkles, X, Wand2 } from "lucide-react";
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
import { useIslandStore } from "@/stores/islandStore";
import IslandRoom from "@/components/island/IslandRoom-v2";
import IslandInventory from "@/components/island/IslandInventory-v2";
import DragDropContext from "@/components/island/drag-drop/DragDropContext";

export default function StudentIsland() {
  const { passportCode } = useParams();
  const queryClient = useQueryClient();
  const [showInventory, setShowInventory] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Island store
  const { 
    ui, 
    setUIMode, 
    initializeFromServerData
  } = useIslandStore();

  // Fetch student island data
  const { data: islandData, isLoading, error } = useQuery({
    queryKey: [`/api/island/${passportCode}`],
    queryFn: () => apiRequest('GET', `/api/island/${passportCode}`),
    enabled: !!passportCode,
  });

  // Initialize island store when data loads
  useEffect(() => {
    if (islandData) {
      initializeFromServerData(islandData);
    }
  }, [islandData, initializeFromServerData]);

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
    <>
      <DragDropContext>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {island.studentName}'s Island
                </h1>
                <Badge variant="secondary" className="text-sm">
                  {island.animalType} • {island.className}
                </Badge>
              </div>
              <div className="flex items-center gap-2 bg-yellow-100 rounded-full px-4 py-2">
                <Coins className="w-5 h-5 text-yellow-600" />
                <span className="font-bold text-lg">{island.currencyBalance}</span>
                {totalPendingCost > 0 && (
                  <span className="text-xs text-yellow-700">({availableBalance} available)</span>
                )}
              </div>
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

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Room Display */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Your Room</CardTitle>
                    <Button
                      size="sm"
                      variant={ui.mode === 'placing' ? 'default' : 'outline'}
                      onClick={() => setUIMode(ui.mode === 'placing' ? 'normal' : 'placing')}
                      className="flex items-center gap-2"
                    >
                      <Wand2 className="w-4 h-4" />
                      {ui.mode === 'placing' ? 'Done Decorating' : 'Decorate Room'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <IslandRoom />
                </CardContent>
              </Card>
            </div>

            {/* Inventory Sidebar */}
            <div className="lg:col-span-1">
              <IslandInventory />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-center gap-4">
            <Button
              size="lg"
              onClick={() => setShowStore(true)}
              disabled={!storeStatus?.isOpen}
              className="flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Visit Store
              {storeStatus?.isOpen ? (
                <Badge variant="secondary" className="ml-1 bg-green-400 text-green-900">Open</Badge>
              ) : (
                <Badge variant="secondary" className="ml-1 bg-red-400 text-red-900">Closed</Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Store Modal */}
        <Dialog open={showStore} onOpenChange={setShowStore}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-2xl">Island Store</DialogTitle>
              <DialogDescription>
                {storeStatus?.isOpen ? storeStatus.message : "Store is currently closed"}
              </DialogDescription>
            </DialogHeader>
            
            {storeStatus?.isOpen && storeCatalog && (
              <Tabs defaultValue="avatar" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="avatar">Avatar Items</TabsTrigger>
                  <TabsTrigger value="decorations">Room Decorations</TabsTrigger>
                </TabsList>
                
                <TabsContent value="avatar" className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto">
                    {storeCatalog.filter((item) => item.type.startsWith('avatar')).map((item) => (
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
                          <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-3 flex items-center justify-center">
                            <span className="text-4xl">
                              {item.type.includes('hat') ? '🎩' : 
                               item.type.includes('glasses') ? '👓' : '💎'}
                            </span>
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
                </TabsContent>
                
                <TabsContent value="decorations" className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto">
                    {storeCatalog.filter((item) => item.type === 'room_decoration').map((item) => (
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
                          <div className="aspect-square bg-gradient-to-br from-green-100 to-yellow-100 rounded-lg mb-3 flex items-center justify-center">
                            <span className="text-4xl">🪴</span>
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
                </TabsContent>
              </Tabs>
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
      </DragDropContext>
    </>
  );
}

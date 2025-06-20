import { useState, useMemo, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import LayeredAvatarDB from "@/components/avatar-v2/LayeredAvatarDB";
import LayeredAvatarRoom from "@/components/avatar-v2/LayeredAvatarRoom";
import { Coins, Home, ShoppingBag, Package, Sparkles, X, Wand2, Shirt } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { StudentIsland } from "@shared/currency-types";
import { useOwnedItems } from "@/hooks/useOwnedItems";
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
import { useIslandStore, ROOM_ITEM_LIMIT } from "@/stores/islandStore";
import IslandRoomSticker from "@/components/island/IslandRoom-sticker";
import WelcomeAnimation from "@/components/island/WelcomeAnimation";
import EditorControls from "@/components/island/EditorControls";
import UnifiedInventoryPanel from "@/components/island/UnifiedInventoryPanel";
import { AnimatePresence, motion } from "framer-motion";
import StoreModal from "@/components/island/StoreModal";

export default function StudentIsland() {
  const { passportCode } = useParams();
  const queryClient = useQueryClient();
  const [showStore, setShowStore] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // Island store
  const initializeFromServerData = useIslandStore((state) => state.initializeFromServerData);
  const setAvatarEquipment = useIslandStore((state) => state.setAvatarEquipment);
  const inventoryMode = useIslandStore((state) => state.ui.inventoryMode);
  const draftAvatar = useIslandStore((state) => state.draftAvatar);
  const draftRoom = useIslandStore((state) => state.draftRoom);

  // Fetch student island data
  const { data: islandData, isLoading, error } = useQuery({
    queryKey: [`/api/island/${passportCode}`],
    queryFn: () => apiRequest('GET', `/api/island/${passportCode}`),
    enabled: !!passportCode,
  });
  
  // Fetch details for owned items
  const { data: ownedItemDetails } = useOwnedItems(islandData?.avatarData?.owned);

  // Initialize island store when data loads
  useEffect(() => {
    if (islandData && ownedItemDetails) {
      // Convert owned items to inventory format
      const inventoryItems = ownedItemDetails.map((item: any) => ({
        ...item,
        quantity: 1,
        obtainedAt: new Date()
      }));
      
      initializeFromServerData({
        ...islandData,
        inventoryItems
      });
      
      // Check if this is first visit
      const hasBeenWelcomed = localStorage.getItem(`island-welcomed-${passportCode}`);
      if (!hasBeenWelcomed) {
        setShowWelcome(true);
      }
    }
  }, [islandData, ownedItemDetails, passportCode, initializeFromServerData]);

  // Fetch store status
  const { data: storeStatus } = useQuery({
    queryKey: [`/api/island/${passportCode}/store`],
    queryFn: () => apiRequest('GET', `/api/island/${passportCode}/store`),
    enabled: !!passportCode,
  });

  // Fetch store catalog (using non-paginated endpoint for now)
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
      setPurchaseMessage({ 
        type: 'success', 
        message: 'Avatar updated!' 
      });
      setTimeout(() => setPurchaseMessage(null), 3000);
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

  // Categorize owned items based on actual item data from DB
  const categorizedItems = useMemo(() => {
    if (!ownedItemDetails) return { hats: [], glasses: [], accessories: [] };
    
    const items = {
      hats: [] as any[],
      glasses: [] as any[],
      accessories: [] as any[]
    };
    
    ownedItemDetails.forEach((item: any) => {
      if (item.itemType === 'avatar_hat') {
        items.hats.push(item);
      } else if (item.itemType === 'avatar_accessory') {
        // Check if it's glasses based on name pattern
        if (item.name?.toLowerCase().includes('glass') || 
            item.name?.toLowerCase().includes('blind') || 
            item.name?.toLowerCase().includes('shade') ||
            item.id?.includes('heart')) {
          items.glasses.push(item);
        } else {
          items.accessories.push(item);
        }
      }
    });
    
    return items;
  }, [ownedItemDetails]);

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
      <AnimatePresence>
        {showWelcome && islandData && (
          <WelcomeAnimation
            studentName={islandData.studentName}
            animalType={islandData.animalType}
            passportCode={islandData.passportCode}
            onComplete={() => {
              setShowWelcome(false);
              localStorage.setItem(`island-welcomed-${passportCode}`, 'true');
            }}
          />
        )}
      </AnimatePresence>
      
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
            {/* Room Display - scales when inventory is open */}
            <div className={cn(
              "transition-all duration-300",
              inventoryMode ? "lg:col-span-2" : "lg:col-span-3"
            )}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Your Island</CardTitle>
                      {inventoryMode === 'room' && (
                        <p className="text-sm text-muted-foreground mt-1">
                          🏠 Room Decoration Mode - Items placed: {draftRoom.placedItems.length}/{ROOM_ITEM_LIMIT}
                        </p>
                      )}
                    </div>
                    <EditorControls />
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Show avatar preview in avatar mode, room in all other modes */}
                  {inventoryMode === 'avatar' ? (
                    <div className="flex items-center justify-center h-[600px] bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 1, y: 30 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <LayeredAvatarRoom
                          animalType={island.animalType}
                          items={draftAvatar.equipped}
                          width={400}
                          height={400}
                          animated={true}
                        />
                      </motion.div>
                    </div>
                  ) : (
                    <IslandRoomSticker />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Inventory Sidebar - only visible when a mode is active */}
            <AnimatePresence>
              {inventoryMode && (
                <motion.div
                  className="lg:col-span-1"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3 }}
                >
                  <UnifiedInventoryPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-center">
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
        <StoreModal
          open={showStore}
          onOpenChange={setShowStore}
          storeStatus={storeStatus}
          storeCatalog={storeCatalog || []}
          availableBalance={availableBalance}
          hasPendingRequest={hasPendingRequest}
          onPurchaseClick={handlePurchaseClick}
        />

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
    </>
  );
}

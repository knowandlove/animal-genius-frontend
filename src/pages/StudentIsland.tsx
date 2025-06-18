import { useState, useMemo, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Coins, Home, ShoppingBag, Package, Sparkles, X, Save, Wand2, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { StudentIsland, StoreItem, PurchaseStatus } from "@shared/currency-types";
import type { PurchaseRequest } from "@shared/schema";
import { getItemById, STORE_CATALOG } from "@shared/currency-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InventoryModal, type CategorizedItems } from "@/components/modals/InventoryModal";
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
import IslandRoom from "@/components/island/IslandRoom";
import IslandInventory from "@/components/island/IslandInventory";
import PassportKey from "@/components/island/PassportKey";
import WelcomeAnimation from "@/components/island/WelcomeAnimation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence } from "framer-motion";

// Interface for store status response
interface StoreStatus {
  isOpen: boolean;
  message: string;
  opensAt?: string;
  closesAt?: string;
}

// Interface for consolidated page data
interface IslandPageData {
  island: StudentIsland;
  wallet?: {
    total: number;
    pending: number;
    available: number;
  };
  storeStatus: StoreStatus;
  storeCatalog: StoreItem[];
  purchaseRequests: PurchaseRequest[];
}

export default function StudentIsland() {
  const { passportCode } = useParams();
  const queryClient = useQueryClient();
  const [showInventory, setShowInventory] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Zustand store
  const { 
    initializeFromServerData, 
    setBalance, 
    addToInventory,
    ui,
    setUIMode,
    saveToServer
  } = useIslandStore();

  // Fetch all student island page data in one request
  const { data: pageData, isLoading, error } = useQuery<IslandPageData>({
    queryKey: [`/api/island-page-data/${passportCode}`],
    queryFn: () => apiRequest('GET', `/api/island-page-data/${passportCode}`),
    enabled: !!passportCode,
  });

  // Extract data from consolidated response
  const islandData = pageData?.island;
  const storeStatus = pageData?.storeStatus;
  const storeCatalog = pageData?.storeCatalog;
  const purchaseRequests = pageData?.purchaseRequests;
  
  // Initialize Zustand store with server data
  useEffect(() => {
    if (islandData && passportCode) {
      // Build inventory from owned items
      const inventoryItems = islandData.avatarData?.owned?.map((itemId: string) => {
        const item = getItemById(itemId);
        return item ? { ...item, quantity: 1 } : null;
      }).filter(Boolean) || [];
      
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
  }, [islandData, passportCode, initializeFromServerData]);

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: (itemId: string) => 
      apiRequest('POST', `/api/island/${passportCode}/purchase`, { itemId }),
    onSuccess: (data) => {
      setPurchaseMessage({ type: 'success', message: data.message });
      setShowPurchaseDialog(false);
      queryClient.invalidateQueries({ queryKey: [`/api/island-page-data/${passportCode}`] });
      
      // Add item to inventory if it's an instant purchase (future feature)
      // For now, all purchases go through approval
      
      setTimeout(() => setPurchaseMessage(null), 5000);
    },
    onError: (error: Error) => {
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
      queryClient.invalidateQueries({ queryKey: [`/api/island-page-data/${passportCode}`] });
    },
    onError: (error: Error) => {
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

  const handlePurchaseClick = (item: StoreItem) => {
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
      .filter((req) => req.status === 'pending')
      .reduce((sum, req) => sum + req.cost, 0);
  }, [purchaseRequests]);
  
  const availableBalance = (islandData?.currencyBalance || 0) - totalPendingCost;

  // Check if item has pending request
  const hasPendingRequest = (itemId: string) => {
    return purchaseRequests?.some(
      (req) => req.itemId === itemId && req.status === 'pending'
    );
  };

  // Categorize owned items
  const categorizedItems = useMemo<CategorizedItems>(() => {
    if (!islandData?.avatarData?.owned) return { hats: [], glasses: [], accessories: [] };
    
    const items: CategorizedItems = {
      hats: [],
      glasses: [],
      accessories: []
    };
    
    islandData.avatarData.owned.forEach((itemId: string) => {
      const item = getItemById(itemId);
      if (!item) return;
      
      if (item.type === 'avatar_hat') {
        items.hats.push({ ...item, id: itemId });
      } else if (item.type === 'avatar_accessory' && (itemId.includes('blind') || itemId.includes('heart') || itemId.includes('glass'))) {
        // These are glasses items that are categorized as accessories in the store
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

  // Performance monitoring in development
  if (process.env.NODE_ENV === 'development') {
    const equippedCount = Object.values(islandData.avatarData?.equipped || {}).filter(Boolean).length;
    const ownedCount = islandData.avatarData?.owned?.length || 0;
    console.log(`[Performance] Student Island - Equipped: ${equippedCount} items, Owned: ${ownedCount} items`);
  }

  return (
    <>
      <AnimatePresence>
        {showWelcome && islandData && (
          <WelcomeAnimation
            studentName={islandData.studentName}
            animalType={islandData.animalType}
            passportCode={islandData.passportCode}
            onComplete={() => setShowWelcome(false)}
          />
        )}
      </AnimatePresence>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold">
                    {islandData.studentName}'s {islandData.animalType} Den
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-sm">
                      {islandData.className}
                    </Badge>
                    <PassportKey 
                      passportCode={islandData.passportCode} 
                      showAnimation={!localStorage.getItem(`island-welcomed-${passportCode}`)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 bg-yellow-100 rounded-lg px-4 py-2">
                  <Coins className="w-5 h-5 text-yellow-600" />
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {pageData?.wallet ? pageData.wallet.available : availableBalance} coins
                    </div>
                    {(pageData?.wallet?.pending || totalPendingCost) > 0 && (
                      <div className="text-xs text-gray-600">
                        {pageData?.wallet?.pending || totalPendingCost} pending
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Available to spend
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        {purchaseMessage && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50">
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

        {/* Room Container - Now uses our new IslandRoom component */}
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="w-5 h-5" />
                Your Cozy Den
              </CardTitle>
              <div className="flex items-center gap-2">
                {ui.lastSaved && (
                  <span className="text-xs text-muted-foreground">
                    Last saved: {new Date(ui.lastSaved).toLocaleTimeString()}
                  </span>
                )}
                {ui.isSaving && (
                  <Badge variant="secondary" className="text-xs">
                    <Save className="w-3 h-3 mr-1 animate-pulse" />
                    Saving...
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <IslandRoom />
          </CardContent>
        </Card>

        {/* Inventory Panel - Shows when in placing mode */}
        {ui.mode === 'placing' && (
          <div className="mb-6">
            <IslandInventory />
          </div>
        )}

        {/* Action Buttons */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                onClick={() => setShowOrders(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <ShoppingBag className="w-5 h-5" />
                My Orders
                {purchaseRequests && purchaseRequests.filter(r => r.status === 'pending').length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-yellow-400 text-yellow-900">
                    {purchaseRequests.filter(r => r.status === 'pending').length}
                  </Badge>
                )}
              </Button>
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
                onClick={() => setUIMode(ui.mode === 'placing' ? 'normal' : 'placing')}
                variant={ui.mode === 'placing' ? 'default' : 'outline'}
                className="flex items-center gap-2"
              >
                <Wand2 className="w-5 h-5" />
                {ui.mode === 'placing' ? 'Exit' : 'Decorate'} Room
                {ui.mode === 'placing' && (
                  <Badge variant="secondary" className="ml-1">Active</Badge>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Modal */}
      <InventoryModal
        isOpen={showInventory}
        onOpenChange={setShowInventory}
        categorizedItems={categorizedItems}
        equippedItems={islandData.avatarData?.equipped || {}}
        onEquipItem={handleEquipItem}
        isEquipPending={equipMutation.isPending}
      />

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
            <Tabs defaultValue="avatar" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="avatar">Avatar Items</TabsTrigger>
                <TabsTrigger value="furniture">Furniture</TabsTrigger>
                <TabsTrigger value="decorations">Decorations</TabsTrigger>
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
              
              <TabsContent value="furniture" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto">
                  {storeCatalog.filter((item) => item.type === 'room_furniture').map((item) => (
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
                        <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg mb-3 flex items-center justify-center">
                          <span className="text-4xl">🪑</span>
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

      {/* My Orders Modal */}
      <Dialog open={showOrders} onOpenChange={setShowOrders}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">My Orders</DialogTitle>
                <DialogDescription>
                  Track your purchase requests and see what's been approved
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/island-page-data/${passportCode}`] })}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[60vh] space-y-3 mt-4">
            {purchaseRequests && purchaseRequests.length > 0 ? (
              <>
                <div className="text-sm text-muted-foreground text-center pb-2 border-b">
                  Your requests are sent to your teacher for approval. Please check back later for updates.
                </div>
                {purchaseRequests.map((request) => {
                  const item = getItemById(request.itemId);
                  return (
                    <Card key={request.id} className={cn(
                      "p-4",
                      request.status === 'approved' && "border-green-200 bg-green-50",
                      request.status === 'denied' && "border-red-200 bg-red-50",
                      request.status === 'pending' && "border-yellow-200 bg-yellow-50"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            request.status === 'approved' && "bg-green-200",
                            request.status === 'denied' && "bg-red-200",
                            request.status === 'pending' && "bg-yellow-200"
                          )}>
                            {request.status === 'approved' && <CheckCircle className="w-5 h-5 text-green-600" />}
                            {request.status === 'denied' && <XCircle className="w-5 h-5 text-red-600" />}
                            {request.status === 'pending' && <Clock className="w-5 h-5 text-yellow-600" />}
                          </div>
                          <div>
                            <h4 className="font-semibold">{item?.name || 'Unknown Item'}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={request.status === 'approved' ? 'default' : request.status === 'denied' ? 'destructive' : 'secondary'}>
                                {request.status === 'approved' && 'Approved'}
                                {request.status === 'denied' && 'Denied'}
                                {request.status === 'pending' && 'Pending'}
                              </Badge>
                              <p className="text-sm text-muted-foreground">
                                {request.status === 'pending' && 'Waiting for teacher'}
                                {request.status === 'approved' && 'Check your inventory!'}
                                {request.status === 'denied' && 'Request was denied'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <Coins className="w-4 h-4 text-yellow-600" />
                            <span className="font-semibold">{request.cost}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-lg text-muted-foreground">No orders yet!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Visit the store to buy cool items for your island
                </p>
              </div>
            )}
          </div>
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
    </>
  );
}

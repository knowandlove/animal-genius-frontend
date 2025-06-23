import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Coins, ShoppingBag, Sparkles, X, Wand2, Home } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { AnimatePresence, motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";

// Import new components
import MainRoomView from "@/components/island/MainRoomView";
import InventoryPanel from "@/components/island/InventoryPanel";
import WelcomeAnimation from "@/components/island/WelcomeAnimation";
import StoreModal from "@/components/island/StoreModal";

interface StoreItem {
  id: string;
  name: string;
  type: string;
  cost: number;
  description?: string;
  rarity?: string;
  imageUrl?: string;
}

interface PageData {
  island: {
    id: number;
    passportCode: string;
    studentName: string;
    gradeLevel: string;
    animalType: string;
    personalityType: string;
    animalGenius: string;
    learningStyle: string;
    currencyBalance: number;
    avatarData: any;
    roomData: any;
    className: string;
    classId: number;
    completedAt: string;
  };
  wallet: {
    total: number;
    pending: number;
    available: number;
  };
  storeStatus: {
    isOpen: boolean;
    message: string;
    classId: number;
    className: string;
  };
  storeCatalog: StoreItem[];
  purchaseRequests: any[];
}

export default function StudentIsland() {
  const { passportCode } = useParams();
  const queryClient = useQueryClient();
  const [showStore, setShowStore] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // Island store
  const initializeFromServerData = useIslandStore((state) => state.initializeFromServerData);
  const isInventoryOpen = useIslandStore((state) => state.ui.isInventoryOpen);
  const editingMode = useIslandStore((state) => state.ui.editingMode);

  // Check if we're on mobile
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Listen for store open event (triggered after handling unsaved changes)
  useEffect(() => {
    const handleOpenStore = () => {
      setShowStore(true);
    };
    
    window.addEventListener('openStore', handleOpenStore);
    return () => window.removeEventListener('openStore', handleOpenStore);
  }, []);

  // Fetch all island data in one request
  const { data: pageData, isLoading, error } = useQuery<PageData>({
    queryKey: [`/api/island-page-data/${passportCode}`],
    queryFn: () => apiRequest('GET', `/api/island-page-data/${passportCode}`),
    enabled: !!passportCode,
  });

  // Initialize island store when data loads
  useEffect(() => {
    if (pageData) {
      const { island, storeCatalog, purchaseRequests } = pageData;
      
      // Create a map of store items for quick lookup
      const itemMap = new Map<string, StoreItem>();
      storeCatalog.forEach(item => {
        itemMap.set(item.id, item);
      });
      
      // Convert owned items to inventory format using the store catalog
      const inventoryItems: any[] = [];
      if (island.avatarData?.owned) {
        island.avatarData.owned.forEach((itemId: string) => {
          const item = itemMap.get(itemId);
          if (item) {
            inventoryItems.push({
              ...item,
              quantity: 1,
              obtainedAt: new Date()
            });
          }
        });
      }
      
      // Add approved purchase requests that aren't in owned yet (in case of sync issues)
      const approvedItems = purchaseRequests
        .filter(req => req.status === 'approved')
        .map(req => req.itemId);
      
      approvedItems.forEach(itemId => {
        if (!island.avatarData?.owned?.includes(itemId)) {
          const item = itemMap.get(itemId);
          if (item && !inventoryItems.find(i => i.id === itemId)) {
            inventoryItems.push({
              ...item,
              quantity: 1,
              obtainedAt: new Date()
            });
          }
        }
      });
      
      initializeFromServerData({
        ...island,
        inventoryItems
      });
      
      // Check if this is first visit
      const hasBeenWelcomed = localStorage.getItem(`island-welcomed-${passportCode}`);
      if (!hasBeenWelcomed) {
        setShowWelcome(true);
      }
    }
  }, [pageData, passportCode, initializeFromServerData]);

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: (itemId: string) => 
      apiRequest('POST', `/api/island/${passportCode}/purchase`, { itemId }),
    onSuccess: (data) => {
      setPurchaseMessage({ type: 'success', message: data.message });
      setShowPurchaseDialog(false);
      queryClient.invalidateQueries({ queryKey: [`/api/island-page-data/${passportCode}`] });
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

  const handlePurchaseClick = (item: StoreItem) => {
    setSelectedItem(item);
    setShowPurchaseDialog(true);
  };

  const confirmPurchase = () => {
    if (selectedItem) {
      purchaseMutation.mutate(selectedItem.id);
    }
  };

  // Check if item has pending request
  const hasPendingRequest = (itemId: string) => {
    return pageData?.purchaseRequests?.some(
      (req: any) => req.itemId === itemId && req.status === 'pending'
    );
  };

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

  if (error || !pageData) {
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

  const { island, wallet, storeStatus, storeCatalog } = pageData;

  return (
    <>
      {/* Welcome Animation */}
      <AnimatePresence>
        {showWelcome && island && (
          <WelcomeAnimation
            studentName={island.studentName}
            animalType={island.animalType}
            passportCode={island.passportCode}
            onComplete={() => {
              setShowWelcome(false);
              localStorage.setItem(`island-welcomed-${passportCode}`, 'true');
            }}
          />
        )}
      </AnimatePresence>
      
      <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" id="island-container">
        {/* Fixed Header */}
        <div className="absolute top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {island.studentName}'s Island
                </h1>
                <Badge variant="secondary" className="text-xs sm:text-sm hidden sm:inline-flex">
                  {island.animalType} • {island.className}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Messages */}
        <AnimatePresence>
          {purchaseMessage && (
            <motion.div
              className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Room View - Centered */}
        <MainRoomView 
          island={island}
          storeCatalog={storeCatalog}
          passportCode={passportCode}
        />

        {/* Bottom Left Info - Coins and Room Items */}
        <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 z-30">
          <div className="space-y-2">
            {/* Coin Balance */}
            <div className="flex items-center gap-2 bg-yellow-100 rounded-full px-3 py-1.5 shadow-md">
              <Coins className="w-4 h-4 text-yellow-600" />
              <span className="font-bold text-sm">{wallet.total}</span>
              {wallet.pending > 0 && (
                <span className="text-xs text-yellow-700">({wallet.available} available)</span>
              )}
            </div>
            
            {/* Room Items Count - Only show when room inventory is open */}
            {isInventoryOpen && editingMode === 'room' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2 bg-blue-100 rounded-full px-3 py-1.5 shadow-md"
              >
                <Home className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-sm">
                  {useIslandStore.getState().draftRoom.placedItems.length} / {ROOM_ITEM_LIMIT}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Action Buttons - Under the Room */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Customize Avatar Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const store = useIslandStore.getState();
                if (store.ui.isInventoryOpen && store.ui.editingMode === 'avatar') {
                  // If avatar panel is open, close it
                  store.closeInventory();
                } else {
                  // Open avatar panel (will handle unsaved changes if needed)
                  store.openInventory('avatar');
                }
              }}
              className={cn(
                "w-12 h-12 sm:w-16 sm:h-16 rounded-full shadow-lg flex items-center justify-center transition-colors",
                isInventoryOpen && editingMode === 'avatar'
                  ? "bg-purple-700 text-white ring-4 ring-purple-400"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              )}
              title="Customize Avatar"
            >
              <Wand2 className="w-5 h-5 sm:w-7 sm:h-7" />
            </motion.button>

            {/* Decorate Room Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const store = useIslandStore.getState();
                if (store.ui.isInventoryOpen && store.ui.editingMode === 'room') {
                  // If room panel is open, close it
                  store.closeInventory();
                } else {
                  // Open room panel (will handle unsaved changes if needed)
                  store.openInventory('room');
                }
              }}
              className={cn(
                "w-12 h-12 sm:w-16 sm:h-16 rounded-full shadow-lg flex items-center justify-center transition-colors",
                isInventoryOpen && editingMode === 'room'
                  ? "bg-blue-700 text-white ring-4 ring-blue-400"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
              title="Decorate Room"
            >
              <Home className="w-5 h-5 sm:w-7 sm:h-7" />
            </motion.button>

            {/* Store Button */}
            <motion.button
              whileHover={{ scale: storeStatus?.isOpen ? 1.1 : 1 }}
              whileTap={{ scale: storeStatus?.isOpen ? 0.95 : 1 }}
              onClick={() => {
                if (!storeStatus?.isOpen) return;
                
                const store = useIslandStore.getState();
                
                // Exit editing mode if active
                if (store.ui.editingMode) {
                  store.closeInventory();
                  useIslandStore.setState((state) => ({
                    ui: {
                      ...state.ui,
                      editingMode: null,
                      inventoryMode: null,
                    },
                  }));
                }
                setShowStore(true);
              }}
              className={cn(
                "w-12 h-12 sm:w-16 sm:h-16 rounded-full shadow-lg flex items-center justify-center transition-colors relative",
                storeStatus?.isOpen 
                  ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer" 
                  : "bg-gray-400 text-gray-600 cursor-not-allowed"
              )}
              title={storeStatus?.isOpen ? "Visit Store" : "Store Closed"}
              disabled={!storeStatus?.isOpen}
            >
              <ShoppingBag className="w-5 h-5 sm:w-7 sm:h-7" />
              {!storeStatus?.isOpen && (
                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold">
                  ✕
                </div>
              )}
            </motion.button>
          </div>
        </div>

        {/* Inventory Panel Overlay */}
        <AnimatePresence>
          {isInventoryOpen && (
            <InventoryPanel
              editingMode={editingMode}
              isMobile={isMobile}
              storeCatalog={storeCatalog}
            />
          )}
        </AnimatePresence>

        {/* Store Modal */}
        <StoreModal
          open={showStore}
          onOpenChange={setShowStore}
          storeStatus={storeStatus}
          storeCatalog={storeCatalog}
          availableBalance={wallet.available}
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
                    {selectedItem.rarity || 'common'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-lg">{selectedItem.cost} coins</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Available: {wallet.available} coins
                    {wallet.pending > 0 && (
                      <span className="text-xs"> ({wallet.pending} pending)</span>
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

import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Coins, ShoppingBag, Sparkles, X, Wand2, Home, User } from "lucide-react";
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
import LayeredAvatarRoom from "@/components/avatar-v2/LayeredAvatarRoom";
import WelcomeAnimation from "@/components/island/WelcomeAnimation";
import StoreModal from "@/components/island/StoreModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'avatar' | 'room'>('avatar');

  // Island store
  const initializeFromServerData = useIslandStore((state) => state.initializeFromServerData);

  // Check if we're on mobile
  const isMobile = useMediaQuery("(max-width: 768px)");
  
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

  // Equip mutation
  const equipMutation = useMutation({
    mutationFn: ({ slot, itemId }: { slot: string; itemId: string | null }) => 
      apiRequest('POST', `/api/island/${passportCode}/equip`, { slot, itemId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/island-page-data/${passportCode}`] });
    },
    onError: (error: any) => {
      setPurchaseMessage({ 
        type: 'error', 
        message: error.message || 'Failed to equip item' 
      });
      setTimeout(() => setPurchaseMessage(null), 3000);
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

  // Handle item click (auto equip/remove)
  const handleItemClick = (slot: string, itemId: string) => {
    const currentlyEquipped = pageData?.island?.avatarData?.equipped?.[slot];
    if (currentlyEquipped === itemId) {
      // Remove if already equipped
      equipMutation.mutate({ slot, itemId: null });
    } else {
      // Equip the item
      equipMutation.mutate({ slot, itemId });
    }
  };

  // Get categorized items
  const getCategorizedItems = () => {
    const items = { hats: [], glasses: [], accessories: [] } as any;
    
    if (!pageData?.island?.avatarData?.owned) return items;
    
    pageData.island.avatarData.owned.forEach((itemId: string) => {
      const item = pageData.storeCatalog.find(i => i.id === itemId);
      if (!item) return;
      
      if (item.type === 'avatar_hat') {
        items.hats.push(item);
      } else if (item.type === 'avatar_accessory' && (itemId.includes('blind') || itemId.includes('heart') || itemId.includes('glass'))) {
        items.glasses.push(item);
      } else if (item.type === 'avatar_accessory') {
        items.accessories.push(item);
      }
    });
    
    return items;
  };

  // Handle sidebar button clicks
  const handleSidebarAction = (action: 'avatar' | 'room' | 'store') => {
    if (action === 'store') {
      setShowStore(true);
      setSidebarOpen(false);
    } else {
      setSidebarMode(action);
      setSidebarOpen(true);
    }
  };

  // Handle bottom button clicks
  const handleBottomButtonClick = (action: 'avatar' | 'room' | 'store') => {
    if (action === 'store') {
      setShowStore(true);
    } else {
      setSidebarMode(action);
      setSidebarOpen(prev => !prev || sidebarMode !== action);
    }
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
  const categorizedItems = getCategorizedItems();
  const avatarSize = isMobile ? 200 : 300;

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
      
      <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
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

        {/* Main Room Area */}
        <div className="absolute inset-0 flex items-center justify-center p-4 pt-20">
          <div className="relative w-full max-w-3xl sm:max-w-4xl">
            <div className={cn(
              "relative w-full aspect-[5/3] bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 overflow-hidden transition-all duration-300",
              sidebarOpen && !isMobile ? "mr-80" : ""
            )}>
              {/* Room Background */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(/images/rooms/cozy-room.jpg)`,
                  backgroundColor: '#f3e5d0'
                }}
              />
              
              {/* Avatar - Moved up 10% (was top: 70%, now top: 60%) */}
              <div 
                className="absolute"
                style={{ 
                  top: '60%', // Changed from 70% to 60% to move up
                  left: '50%',
                  width: `${avatarSize}px`, 
                  height: `${avatarSize}px`,
                  marginLeft: `-${avatarSize / 2}px`,
                  marginTop: `-${avatarSize / 2}px`,
                  pointerEvents: 'none',
                  zIndex: 500
                }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-full h-full"
                >
                  <LayeredAvatarRoom
                    animalType={island.animalType}
                    items={island.avatarData?.equipped || {}}
                    width={avatarSize}
                    height={avatarSize}
                    animated={true}
                    storeCatalog={storeCatalog}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Left Info - Coins */}
        <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 z-30">
          <div className="flex items-center gap-2 bg-yellow-100 rounded-full px-3 py-1.5 shadow-md">
            <Coins className="w-4 h-4 text-yellow-600" />
            <span className="font-bold text-sm">{wallet.total}</span>
            {wallet.pending > 0 && (
              <span className="text-xs text-yellow-700">({wallet.available} available)</span>
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
              onClick={() => handleBottomButtonClick('avatar')}
              className={cn(
                "w-12 h-12 sm:w-16 sm:h-16 rounded-full shadow-lg flex items-center justify-center transition-colors",
                sidebarOpen && sidebarMode === 'avatar'
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
              onClick={() => handleBottomButtonClick('room')}
              className={cn(
                "w-12 h-12 sm:w-16 sm:h-16 rounded-full shadow-lg flex items-center justify-center transition-colors",
                sidebarOpen && sidebarMode === 'room'
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
              onClick={() => handleBottomButtonClick('store')}
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

        {/* Sidebar Panel */}
        <AnimatePresence>
          {sidebarOpen && !isMobile && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-40"
            >
              {/* Tab on the side */}
              <motion.div
                className={cn(
                  "absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full rounded-l-lg px-2 py-4 cursor-pointer shadow-lg",
                  sidebarMode === 'avatar' ? "bg-purple-600" : "bg-blue-600"
                )}
                onClick={() => setSidebarOpen(false)}
                whileHover={{ x: -2 }}
              >
                <X className="w-4 h-4 text-white" />
              </motion.div>

              {/* Sidebar Header */}
              <div className={cn(
                "p-4 text-white",
                sidebarMode === 'avatar' ? "bg-purple-600" : "bg-blue-600"
              )}>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">
                    {sidebarMode === 'avatar' ? 'Customize Avatar' : 'Decorate Room'}
                  </h3>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 hover:bg-white/20 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant={sidebarMode === 'avatar' ? 'default' : 'outline'}
                    onClick={() => handleSidebarAction('avatar')}
                    className="text-xs"
                  >
                    <User className="w-4 h-4" />
                    Avatar
                  </Button>
                  <Button
                    size="sm"
                    variant={sidebarMode === 'room' ? 'default' : 'outline'}
                    onClick={() => handleSidebarAction('room')}
                    className="text-xs"
                  >
                    <Home className="w-4 h-4" />
                    Room
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSidebarAction('store')}
                    className="text-xs"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Store
                  </Button>
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="p-4 overflow-y-auto h-[calc(100%-8rem)]">
                {sidebarMode === 'avatar' ? (
                  <Tabs defaultValue="hats" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="hats">Hats</TabsTrigger>
                      <TabsTrigger value="glasses">Glasses</TabsTrigger>
                      <TabsTrigger value="accessories">Accessories</TabsTrigger>
                    </TabsList>

                    <TabsContent value="hats" className="mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        {categorizedItems.hats.map((item: any) => {
                          const isEquipped = island.avatarData?.equipped?.hat === item.id;
                          return (
                            <Card 
                              key={item.id}
                              className={cn(
                                "cursor-pointer transition-all hover:shadow-lg",
                                isEquipped && "ring-2 ring-green-500 bg-green-50"
                              )}
                              onClick={() => handleItemClick('hat', item.id)}
                            >
                              <CardContent className="p-3 text-center">
                                <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <span className="text-2xl">🎩</span>
                                </div>
                                <h4 className="font-medium text-xs">{item.name}</h4>
                                {isEquipped && (
                                  <Badge variant="secondary" className="mt-1 text-xs">
                                    Equipped
                                  </Badge>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </TabsContent>

                    <TabsContent value="glasses" className="mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        {categorizedItems.glasses.map((item: any) => {
                          const isEquipped = island.avatarData?.equipped?.glasses === item.id;
                          return (
                            <Card 
                              key={item.id}
                              className={cn(
                                "cursor-pointer transition-all hover:shadow-lg",
                                isEquipped && "ring-2 ring-green-500 bg-green-50"
                              )}
                              onClick={() => handleItemClick('glasses', item.id)}
                            >
                              <CardContent className="p-3 text-center">
                                <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <span className="text-2xl">🕶️</span>
                                </div>
                                <h4 className="font-medium text-xs">{item.name}</h4>
                                {isEquipped && (
                                  <Badge variant="secondary" className="mt-1 text-xs">
                                    Equipped
                                  </Badge>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </TabsContent>

                    <TabsContent value="accessories" className="mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        {categorizedItems.accessories.map((item: any) => {
                          const isEquipped = island.avatarData?.equipped?.accessory === item.id;
                          return (
                            <Card 
                              key={item.id}
                              className={cn(
                                "cursor-pointer transition-all hover:shadow-lg",
                                isEquipped && "ring-2 ring-green-500 bg-green-50"
                              )}
                              onClick={() => handleItemClick('accessory', item.id)}
                            >
                              <CardContent className="p-3 text-center">
                                <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <span className="text-2xl">💎</span>
                                </div>
                                <h4 className="font-medium text-xs">{item.name}</h4>
                                {isEquipped && (
                                  <Badge variant="secondary" className="mt-1 text-xs">
                                    Equipped
                                  </Badge>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Home className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Room decoration coming soon!</p>
                    <p className="text-sm mt-2">You'll be able to customize your den with furniture and decorations.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && isMobile && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-30"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed bottom-0 left-0 right-0 h-[70vh] bg-white rounded-t-2xl shadow-2xl z-40"
              >
                {/* Mobile Header */}
                <div className={cn(
                  "p-4 text-white rounded-t-2xl",
                  sidebarMode === 'avatar' ? "bg-purple-600" : "bg-blue-600"
                )}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">
                      {sidebarMode === 'avatar' ? 'Customize Avatar' : 'Decorate Room'}
                    </h3>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1 hover:bg-white/20 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="p-4 bg-gray-50 border-b">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      variant={sidebarMode === 'avatar' ? 'default' : 'outline'}
                      onClick={() => setSidebarMode('avatar')}
                      className="text-xs"
                    >
                      <User className="w-4 h-4" />
                      Avatar
                    </Button>
                    <Button
                      size="sm"
                      variant={sidebarMode === 'room' ? 'default' : 'outline'}
                      onClick={() => setSidebarMode('room')}
                      className="text-xs"
                    >
                      <Home className="w-4 h-4" />
                      Room
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSidebarOpen(false);
                        setShowStore(true);
                      }}
                      className="text-xs"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Store
                    </Button>
                  </div>
                </div>

                {/* Mobile Content */}
                <div className="p-4 overflow-y-auto h-[calc(100%-10rem)]">
                  {sidebarMode === 'avatar' ? (
                    <Tabs defaultValue="hats" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="hats">Hats</TabsTrigger>
                        <TabsTrigger value="glasses">Glasses</TabsTrigger>
                        <TabsTrigger value="accessories">Access.</TabsTrigger>
                      </TabsList>

                      <TabsContent value="hats" className="mt-4">
                        <div className="grid grid-cols-3 gap-2">
                          {categorizedItems.hats.map((item: any) => {
                            const isEquipped = island.avatarData?.equipped?.hat === item.id;
                            return (
                              <Card 
                                key={item.id}
                                className={cn(
                                  "cursor-pointer transition-all",
                                  isEquipped && "ring-2 ring-green-500 bg-green-50"
                                )}
                                onClick={() => handleItemClick('hat', item.id)}
                              >
                                <CardContent className="p-2 text-center">
                                  <div className="w-10 h-10 mx-auto mb-1 bg-gray-100 rounded flex items-center justify-center">
                                    <span className="text-xl">🎩</span>
                                  </div>
                                  <h4 className="font-medium text-[10px]">{item.name}</h4>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </TabsContent>

                      <TabsContent value="glasses" className="mt-4">
                        <div className="grid grid-cols-3 gap-2">
                          {categorizedItems.glasses.map((item: any) => {
                            const isEquipped = island.avatarData?.equipped?.glasses === item.id;
                            return (
                              <Card 
                                key={item.id}
                                className={cn(
                                  "cursor-pointer transition-all",
                                  isEquipped && "ring-2 ring-green-500 bg-green-50"
                                )}
                                onClick={() => handleItemClick('glasses', item.id)}
                              >
                                <CardContent className="p-2 text-center">
                                  <div className="w-10 h-10 mx-auto mb-1 bg-gray-100 rounded flex items-center justify-center">
                                    <span className="text-xl">🕶️</span>
                                  </div>
                                  <h4 className="font-medium text-[10px]">{item.name}</h4>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </TabsContent>

                      <TabsContent value="accessories" className="mt-4">
                        <div className="grid grid-cols-3 gap-2">
                          {categorizedItems.accessories.map((item: any) => {
                            const isEquipped = island.avatarData?.equipped?.accessory === item.id;
                            return (
                              <Card 
                                key={item.id}
                                className={cn(
                                  "cursor-pointer transition-all",
                                  isEquipped && "ring-2 ring-green-500 bg-green-50"
                                )}
                                onClick={() => handleItemClick('accessory', item.id)}
                              >
                                <CardContent className="p-2 text-center">
                                  <div className="w-10 h-10 mx-auto mb-1 bg-gray-100 rounded flex items-center justify-center">
                                    <span className="text-xl">💎</span>
                                  </div>
                                  <h4 className="font-medium text-[10px]">{item.name}</h4>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Home className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Room decoration coming soon!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
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
                {purchaseMutation.isPending ? 'Submitting...' : 'Confirm Purchase'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

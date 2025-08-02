import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Coins, ShoppingBag, Sparkles, X, Wand2, Home, Users } from "lucide-react";
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
import { useRoomStore, ROOM_ITEM_LIMIT } from "@/stores/roomStore";
import { AnimatePresence, motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { authenticateStudent, checkSession, isAuthError, isPermissionError } from "@/lib/student-auth";
import { storePassportCode, getPassportAuthHeaders } from "@/lib/passport-auth";
import { useStoreData } from "@/contexts/StoreDataContext";

// Import new components
import MainRoomView from "@/components/room/MainRoomView";
import InventoryPanel from "@/components/room/InventoryPanel";
import WelcomeAnimation from "@/components/room/WelcomeAnimation";
import StoreModal from "@/components/room/StoreModal";
import CollapsedInventoryTab from "@/components/room/CollapsedInventoryTab";
import PassportCodeDialog from "@/components/room/PassportCodeDialog";
import AccessDeniedMessage from "@/components/room/AccessDeniedMessage";
import RoomSettingsButton from "@/components/room/RoomSettingsButton";
import { SaveStatusIndicator } from "@/components/room/SaveStatusIndicator";
import RoomViewers from "@/components/room/RoomViewers";
import { useRoomViewers } from "@/hooks/useRoomViewers";
import { v4 as uuidv4 } from 'uuid';
import CharacterCreationModal from '@/components/avatar/CharacterCreationModal';
import FirstTimeAvatarCustomization from '@/components/avatar/FirstTimeAvatarCustomization';

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
  room: {
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
    classId: string;
    classCode?: string;
    completedAt: string;
    roomVisibility?: string;
  };
  wallet: {
    total: number;
  };
  storeStatus: {
    isOpen: boolean;
    message: string;
    classId: string;
    className: string;
  };
  storeCatalog: StoreItem[];
  access?: {
    canView: boolean;
    canEdit: boolean;
    isOwner: boolean;
    isTeacher: boolean;
  };
}

export default function StudentRoom() {
  const { passportCode } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showStore, setShowStore] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [accessDeniedReason, setAccessDeniedReason] = useState<'private' | 'invite_only' | 'different_class' | 'unknown' | null>(null);
  const [authenticatedViewerName, setAuthenticatedViewerName] = useState<string | null>(null);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [showFirstTimeCustomization, setShowFirstTimeCustomization] = useState(false);
  
  // Viewer tracking
  const [viewerId] = useState(() => {
    // Try to get existing viewer ID from sessionStorage or create a new one
    const existingId = sessionStorage.getItem('viewer-id');
    if (existingId) return existingId;
    
    const newId = uuidv4();
    sessionStorage.setItem('viewer-id', newId);
    return newId;
  });

  // Room store
  const initializeFromServerData = useRoomStore((state) => state.initializeFromServerData);
  const isInventoryOpen = useRoomStore((state) => state.ui.isInventoryOpen);
  const editingMode = useRoomStore((state) => state.ui.editingMode);
  const isArranging = useRoomStore((state) => state.ui.isArranging);

  // Get store data context for refresh
  const { refetchPositions } = useStoreData();

  // Check if we're on mobile
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Check for authenticated session on mount
  useEffect(() => {
    checkSession().then(session => {
      if (session.isAuthenticated && session.studentName) {
        setAuthenticatedViewerName(session.studentName);
      }
    });
  }, []);
  
  // Listen for store open event (triggered after handling unsaved changes)
  useEffect(() => {
    const handleOpenStore = () => {
      setShowStore(true);
    };
    
    window.addEventListener('openStore', handleOpenStore);
    return () => window.removeEventListener('openStore', handleOpenStore);
  }, []);

  // Add keyboard shortcut to refresh positions (for debugging)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Press 'R' while holding Shift to refresh positions
      if (e.shiftKey && e.key === 'R') {
        e.preventDefault();
        refetchPositions();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [refetchPositions]);

  // Fetch all room data in one request
  const { data: pageData, isLoading, error, refetch } = useQuery<PageData>({
    queryKey: [`/api/room-page-data/${passportCode}`],
    queryFn: async () => {
      try {
        return await apiRequest('GET', `/api/room-page-data/${passportCode}`, undefined, {
          headers: getPassportAuthHeaders()
        });
      } catch (err: any) {
        
        // Handle authentication errors
        if (isAuthError(err)) {
          setShowAuthDialog(true);
          throw err;
        }
        // Handle permission errors
        if (isPermissionError(err)) {
          const errorMessage = err.message || '';
          if (errorMessage.includes('private')) {
            setAccessDeniedReason('private');
          } else if (errorMessage.includes('invite')) {
            setAccessDeniedReason('invite_only');
          } else if (errorMessage.includes('different class')) {
            setAccessDeniedReason('different_class');
          } else {
            setAccessDeniedReason('unknown');
          }
        }
        throw err;
      }
    },
    enabled: !!passportCode,
    retry: false, // Don't auto-retry auth errors
  });

  // Initialize room viewer tracking - must be called before any conditional returns
  const { viewers } = useRoomViewers({
    passportCode: passportCode || '',
    viewerId,
    viewerName: authenticatedViewerName || 'Anonymous',
    enabled: !!pageData && !!passportCode
  });

  // Initialize room store when data loads
  useEffect(() => {
    if (pageData) {
      console.log('StudentRoom - pageData received:', pageData);
      const { room, storeCatalog, access, pet } = pageData as any;
      
      console.log('StudentRoom - Extracted pet data:', {
        pet,
        hasPosition: !!pet?.position,
        position: pet?.position,
        assetUrl: pet?.pet?.assetUrl,
        petName: pet?.customName
      });
      
      // Create a map of store items for quick lookup
      const itemMap = new Map<string, StoreItem>();
      if (storeCatalog && Array.isArray(storeCatalog)) {
        storeCatalog.forEach(item => {
          itemMap.set(item.id, item);
        });
      }
      
      // Use inventory items from the room data (already properly formatted from backend)
      const inventoryItems = (room as any).inventoryItems || [];
      
      // If we have the old format, convert it (for backwards compatibility)
      if (!inventoryItems.length && room.avatarData?.owned) {
        room.avatarData.owned.forEach((itemId: string) => {
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
      
      console.log('StudentRoom - Initializing with pet data:', pet);
      
      initializeFromServerData({
        ...room,
        passportCode: passportCode || room.passportCode, // Ensure passport code is passed
        inventoryItems,
        canEdit: access?.canEdit || false, // Pass edit permission to store
        pet // Pass pet data to store
      });
      
      // Check if this is first visit
      const hasBeenWelcomed = localStorage.getItem(`room-welcomed-${passportCode}`);
      if (!hasBeenWelcomed) {
        setShowWelcome(true);
      }
      
      // Check if avatar colors have been customized (only for owner)
      if (access?.isOwner && !room.avatarData?.colors?.hasCustomized) {
        // Show full-screen customization for first-time visitors
        setShowFirstTimeCustomization(true);
      }
    }
  }, [pageData, passportCode, initializeFromServerData]);

  // Avatar color save mutation
  const saveAvatarColorsMutation = useMutation({
    mutationFn: (colors: { primaryColor: string; secondaryColor: string }) => 
      apiRequest('POST', `/api/room/${passportCode}/avatar-colors`, colors, {
        headers: getPassportAuthHeaders()
      }),
    onSuccess: () => {
      // Update local state
      queryClient.invalidateQueries({ queryKey: [`/api/room-page-data/${passportCode}`] });
      setShowCharacterCreation(false);
      setShowFirstTimeCustomization(false);
    },
    onError: (error: any) => {
      console.error('Failed to save avatar colors:', error);
      // Still close the modal - they can try again later
      setShowCharacterCreation(false);
      setShowFirstTimeCustomization(false);
    },
  });

  // Direct purchase mutation (no approval needed)
  const purchaseMutation = useMutation({
    mutationFn: (itemId: string) => 
      apiRequest('POST', `/api/store-direct/purchase`, { 
        passportCode: passportCode!,
        itemId 
      }, {
        headers: getPassportAuthHeaders()
      }),
    onSuccess: (data) => {
      // Update local balance immediately
      queryClient.setQueryData([`/api/room-page-data/${passportCode}`], (old: any) => {
        if (old) {
          return {
            ...old,
            room: {
              ...old.room,
              currencyBalance: data.newBalance
            },
            wallet: {
              total: data.newBalance
            }
          };
        }
        return old;
      });
      
      setPurchaseMessage({ 
        type: 'success', 
        message: `Purchased ${data.item.name}! Your new balance is ${data.newBalance} coins.` 
      });
      setShowPurchaseDialog(false);
      
      // Refresh data to get updated inventory
      queryClient.invalidateQueries({ queryKey: [`/api/room-page-data/${passportCode}`] });
      setTimeout(() => setPurchaseMessage(null), 5000);
    },
    onError: (error: any) => {
      setPurchaseMessage({ 
        type: 'error', 
        message: error.message || 'Failed to complete purchase' 
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


  // Debug logging - must be before any conditional returns
  useEffect(() => {
  }, [isLoading, error, showAuthDialog, accessDeniedReason, pageData]);

  const handleAuthenticate = async (code: string) => {
    try {
      setAuthError(null);
      const authResult = await authenticateStudent(code);
      
      // Store passport code for API requests
      storePassportCode(code);
      
      // Set the authenticated viewer name
      if (authResult.studentName) {
        setAuthenticatedViewerName(authResult.studentName);
      }
      
      // Small delay to ensure cookie is set before refetching
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refetch room data after successful authentication
      await refetch();
      setShowAuthDialog(false);
    } catch (err: any) {
      setAuthError(err.message || 'Invalid passport code');
    }
  };

  if (accessDeniedReason) {
    return <AccessDeniedMessage reason={accessDeniedReason} studentName={pageData?.room?.studentName} />;
  }

  // Show loading only while actually loading (not when there's an error)
  if (isLoading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="p-8">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-lg">Loading room...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Handle non-auth errors (like 404)
  if (error && !isAuthError(error) && !showAuthDialog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <div className="text-4xl mb-4">🏝️</div>
            <h2 className="text-xl font-bold mb-2">Room Not Found</h2>
            <p className="text-muted-foreground mb-4">
              We couldn't find a room with passport code: <span className="font-mono">{passportCode}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Double-check your passport code or ask your teacher for help.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Check if pageData is loaded
  if (!pageData && !showAuthDialog && !isLoading) {
    // If we're here with no data, no auth dialog, and not loading, show error
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <div className="text-4xl mb-4">🏝️</div>
            <h2 className="text-xl font-bold mb-2">Unable to Load Room</h2>
            <p className="text-muted-foreground">
              Please refresh the page and try again.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Show auth dialog if needed (even without pageData)
  if (showAuthDialog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <PassportCodeDialog
          open={showAuthDialog}
          onSuccess={() => setShowAuthDialog(false)}
          passportCode={passportCode || ''}
          error={authError}
          onSubmit={handleAuthenticate}
        />
      </div>
    );
  }

  // Show loading while fetching data after auth
  if (!pageData && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="p-8">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-lg">Loading your room...</p>
          </div>
        </Card>
      </div>
    );
  }

  // If no pageData at this point, something went wrong
  if (!pageData) {
    return null;
  }

  const { room, wallet, storeStatus, storeCatalog = [], access } = pageData;
  const canEdit = access?.canEdit ?? false; // Default to false for security

  // Show full-screen avatar customization for first-time visitors
  if (showFirstTimeCustomization && room) {
    return (
      <FirstTimeAvatarCustomization
        animalType={room.animalType}
        studentName={room.studentName}
        onComplete={(colors) => {
          saveAvatarColorsMutation.mutate(colors);
        }}
      />
    );
  }

  return (
    <>
      {/* Character Creation Modal */}
      {showCharacterCreation && room && (
        <CharacterCreationModal
          animalType={room.animalType}
          onComplete={(colors) => {
            saveAvatarColorsMutation.mutate(colors);
          }}
          onClose={() => setShowCharacterCreation(false)}
        />
      )}

      {/* Welcome Animation */}
      <AnimatePresence>
        {showWelcome && room && (
          <WelcomeAnimation
            studentName={room.studentName}
            animalType={room.animalType}
            passportCode={room.passportCode}
            onComplete={() => {
              setShowWelcome(false);
              localStorage.setItem(`room-welcomed-${passportCode}`, 'true');
            }}
          />
        )}
      </AnimatePresence>
      
      <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" id="room-container">
        {/* Fixed Header */}
        <div className="absolute top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {canEdit ? `${room.studentName}'s Room` : `Visiting ${room.studentName}'s Room`}
                </h1>
                <Badge variant="secondary" className="text-xs sm:text-sm hidden sm:inline-flex">
                  {room.animalType} • {room.className}
                </Badge>
                {!canEdit && (
                  <Badge variant="outline" className="text-xs sm:text-sm">
                    👀 View Only
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Navigate to public class island if we have the class code
                  if (room.classCode) {
                    setLocation(`/class/${room.classCode}`);
                  } else {
                    // Fallback to authenticated class island
                    setLocation('/class-island');
                  }
                }}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Class Island</span>
                <span className="sm:hidden">🏝️</span>
              </Button>
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
          room={room}
          storeCatalog={storeCatalog}
          passportCode={passportCode || ''}
        />

        {/* Save Status Indicator */}
        {canEdit && <SaveStatusIndicator />}
        
        {/* Room Viewers */}
        <RoomViewers viewers={viewers} className="absolute top-20 left-4" />
        
        {/* Visitor Mode Indicator */}
        {!canEdit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-20"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-md flex items-center gap-2">
              <span className="text-sm text-gray-600">👀 You're visiting this room</span>
            </div>
          </motion.div>
        )}

        {/* Bottom Right Info - Coins and Room Items - Only show for owners */}
        {canEdit && (
          <div className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 z-30">
            <div className="space-y-2 items-end flex flex-col">
              {/* Coin Balance */}
              <div className="flex items-center gap-2 bg-yellow-100 rounded-full px-3 py-1.5 shadow-md">
                <Coins className="w-4 h-4 text-yellow-600" />
                <span className="font-bold text-sm">{wallet.total}</span>
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
                    {useRoomStore.getState().draftRoom.placedItems.length} / {ROOM_ITEM_LIMIT}
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons - Under the Room */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Save Layout Button - Shows when arranging room */}
            {canEdit && isArranging && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => useRoomStore.getState().stopArranging()}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full shadow-lg transition-all flex items-center gap-2"
                title="Save Room Layout"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm sm:text-base">Save Layout</span>
              </motion.button>
            )}
            
            {/* Customize Avatar Button - Only show if can edit */}
            {canEdit && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const store = useRoomStore.getState();
                  if (store.ui.isInventoryOpen && store.ui.editingMode === 'avatar') {
                    // If avatar panel is open, just set isInventoryOpen to false
                    // This will trigger the smooth animation
                    useRoomStore.setState((state) => ({
                      ui: {
                        ...state.ui,
                        isInventoryOpen: false,
                      },
                    }));
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
            )}

            {/* Decorate Room Button - Only show if can edit */}
            {canEdit && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const store = useRoomStore.getState();
                  if (store.ui.isInventoryOpen && store.ui.editingMode === 'room') {
                    // If room panel is open, just set isInventoryOpen to false
                    // This will trigger the smooth animation
                    useRoomStore.setState((state) => ({
                      ui: {
                        ...state.ui,
                        isInventoryOpen: false,
                      },
                    }));
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
            )}

            {/* Store Button - Only show if can edit */}
            {canEdit && (
              <motion.button
                whileHover={{ scale: storeStatus?.isOpen ? 1.1 : 1 }}
                whileTap={{ scale: storeStatus?.isOpen ? 0.95 : 1 }}
                onClick={() => {
                  if (!storeStatus?.isOpen) return;
                  
                  const store = useRoomStore.getState();
                  
                  // Exit editing mode if active
                  if (store.ui.editingMode) {
                    store.closeInventory();
                    useRoomStore.setState((state) => ({
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
            )}

            {/* Settings Button - Only show if owner */}
            {access?.isOwner && (
              <RoomSettingsButton 
                passportCode={passportCode || ''}
                currentVisibility={room.roomVisibility}
                canEdit={true}
              />
            )}
          </div>
        </div>

        {/* Always show inventory panel on desktop - but only for owners */}
        {!isMobile && canEdit && (
          <InventoryPanel
            editingMode={editingMode}
            isMobile={isMobile}
            storeCatalog={storeCatalog}
          />
        )}
        
        {/* Only show on mobile when inventory is open - and only for owners */}
        <AnimatePresence>
          {isInventoryOpen && isMobile && canEdit && (
            <InventoryPanel
              editingMode={editingMode}
              isMobile={isMobile}
              storeCatalog={storeCatalog}
            />
          )}
        </AnimatePresence>

        {/* Store Modal - Only for owners */}
        {canEdit && (
          <StoreModal
            open={showStore}
            onOpenChange={setShowStore}
            storeStatus={storeStatus}
            storeCatalog={storeCatalog}
            availableBalance={wallet.total}
            onPurchaseClick={handlePurchaseClick}
          />
        )}

        {/* Purchase Confirmation Dialog - Only for owners */}
        {canEdit && (
          <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Purchase</DialogTitle>
              <DialogDescription>
                Your coins will be deducted immediately and the item will be added to your inventory.
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
                  <div className="text-sm">
                    <div>Current balance: <span className="font-semibold">{wallet.total}</span> coins</div>
                    <div className={cn(
                      "mt-1",
                      wallet.total - selectedItem.cost < 0 ? "text-red-600" : "text-green-600"
                    )}>
                      After purchase: <span className="font-semibold">{wallet.total - selectedItem.cost}</span> coins
                    </div>
                  </div>
                </div>
                {wallet.total < selectedItem.cost && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertDescription className="text-red-800">
                      You don't have enough coins for this purchase.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmPurchase} 
                disabled={purchaseMutation.isPending || (selectedItem ? wallet.total < selectedItem.cost : false)}
                className={cn(
                  selectedItem && wallet.total >= selectedItem.cost 
                    ? "bg-green-600 hover:bg-green-700" 
                    : ""
                )}
              >
                {purchaseMutation.isPending ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Buy Now
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>
    </>
  );
}

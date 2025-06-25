import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Sparkles, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DataState } from "@/components/data-states";
import { safeHandler } from "@/lib/error-handling";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";

// Import new components
import MainRoomView from "@/components/island/MainRoomView";
import InventoryPanel from "@/components/island/InventoryPanel";
import WelcomeAnimation from "@/components/island/WelcomeAnimation";
import StoreModal from "@/components/island/StoreModal";
import IslandHeader from "@/components/island/IslandHeader";
import IslandInfoBar from "@/components/island/IslandInfoBar";
import ActionButtons from "@/components/island/ActionButtons";
import PurchaseConfirmDialog from "@/components/island/PurchaseConfirmDialog";

// Import hooks
import { useStudentIsland, usePurchaseItem, type StoreItem } from "@/hooks/data";
import { useIslandDataInitializer } from "@/hooks/useIslandDataInitializer";
import { useIslandStore } from "@/stores/islandStore";

export default function StudentIsland() {
  const { passportCode } = useParams();
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  // Island store
  const isInventoryOpen = useIslandStore((state) => state.ui.isInventoryOpen);
  const showInventoryTab = useIslandStore((state) => state.ui.showInventoryTab);
  const editingMode = useIslandStore((state) => state.ui.editingMode);
  const isStoreModalOpen = useIslandStore((state) => state.ui.isStoreModalOpen);
  const openStoreModal = useIslandStore((state) => state.openStoreModal);
  const closeStoreModal = useIslandStore((state) => state.closeStoreModal);

  // Check if we're on mobile
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Use our data hooks
  const { data: pageData, isLoading, error } = useStudentIsland(passportCode);
  const purchaseMutation = usePurchaseItem(passportCode);

  // Initialize island data and check welcome status
  const { shouldShowWelcome } = useIslandDataInitializer(pageData, passportCode);
  
  useEffect(() => {
    if (shouldShowWelcome) {
      setShowWelcome(true);
    }
  }, [shouldShowWelcome]);

  const handlePurchaseClick = safeHandler((item: StoreItem) => {
    setSelectedItem(item);
    setShowPurchaseDialog(true);
  }, 'Purchase click');

  const handleMutationSettled = (message: { type: 'success' | 'error'; message: string }) => {
    setPurchaseMessage(message);
    setShowPurchaseDialog(false);
    setTimeout(() => setPurchaseMessage(null), 5000);
  };

  const confirmPurchase = safeHandler(() => {
    if (!selectedItem || !passportCode) {
      handleMutationSettled({ 
        type: 'error', 
        message: 'Missing item or island data for purchase.' 
      });
      return;
    }
    
    purchaseMutation.mutate(selectedItem.id, {
      onSuccess: (data) => {
        handleMutationSettled({ type: 'success', message: data.message });
      },
      onError: (error: any) => {
        handleMutationSettled({ 
          type: 'error', 
          message: error.message || 'Failed to submit purchase request' 
        });
      },
    });
  }, 'Confirm purchase');

  // Check if item has pending request
  const hasPendingRequest = (itemId: string) => {
    return pageData?.purchaseRequests?.some(
      (req: any) => req.itemId === itemId && req.status === 'pending'
    );
  };

  const handleWelcomeComplete = safeHandler(() => {
    setShowWelcome(false);
    localStorage.setItem(`island-welcomed-${passportCode}`, 'true');
  }, 'Welcome complete');

  // Toggle performance monitor with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + P
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowPerformanceMonitor(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <DataState
      isLoading={isLoading}
      error={error}
      isEmpty={!pageData}
      loadingMessage="Loading your island..."
      errorMessage={error ? "Island Not Found" : undefined}
      emptyTitle="Island Not Found"
      emptyMessage={`We couldn't find an island with passport code: ${passportCode}. Double-check your passport code or ask your teacher for help.`}
      className="min-h-screen"
    >

      {pageData && (() => {
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
            onComplete={handleWelcomeComplete}
          />
        )}
      </AnimatePresence>
      
      <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" id="island-container">
        {/* Header */}
        <IslandHeader 
          studentName={island.studentName}
          animalType={island.animalType}
          className={island.className}
        />

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

        {/* Main Room View */}
        <MainRoomView 
          island={island}
          storeCatalog={storeCatalog}
          passportCode={passportCode}
        />

        {/* Info Bar */}
        <IslandInfoBar 
          totalCoins={wallet.total}
          availableCoins={wallet.available}
          pendingCoins={wallet.pending}
        />

        {/* Action Buttons */}
        <ActionButtons 
          storeIsOpen={storeStatus?.isOpen || false}
          onStoreClick={openStoreModal}
        />

        {/* Inventory Panel Overlay */}
        <AnimatePresence>
          {showInventoryTab && (
            <InventoryPanel
              editingMode={editingMode}
              isMobile={isMobile}
              storeCatalog={storeCatalog}
            />
          )}
        </AnimatePresence>

        {/* Store Modal */}
        <StoreModal
          open={isStoreModalOpen}
          onOpenChange={(open) => {
            if (!open) closeStoreModal();
            else openStoreModal();
          }}
          storeStatus={storeStatus}
          storeCatalog={storeCatalog}
          availableBalance={wallet.available}
          hasPendingRequest={hasPendingRequest}
          onPurchaseClick={handlePurchaseClick}
        />

        {/* Purchase Confirmation Dialog */}
        <PurchaseConfirmDialog
          open={showPurchaseDialog}
          onOpenChange={setShowPurchaseDialog}
          selectedItem={selectedItem}
          availableCoins={wallet.available}
          pendingCoins={wallet.pending}
          onConfirm={confirmPurchase}
          isPending={purchaseMutation.isPending}
        />

        {/* Performance Monitor (toggle with Ctrl+Shift+P) */}
        {showPerformanceMonitor && (
          <PerformanceMonitor onClose={() => setShowPerformanceMonitor(false)} />
        )}
          </div>
          </>
        );
      })()}
    </DataState>
  );
}

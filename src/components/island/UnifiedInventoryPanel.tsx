import { AnimatePresence, motion } from 'framer-motion';
import { X, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIslandStore } from '@/stores/islandStore';
import AvatarCustomizerView from './AvatarCustomizerView';
import RoomDecoratorView from './RoomDecoratorView';

export default function UnifiedInventoryPanel() {
  const { 
    inventoryMode,
    saveDraftChanges,
    discardDraftChanges,
    setInventoryMode,
    isSaving
  } = useIslandStore((state) => ({
    inventoryMode: state.ui.inventoryMode,
    saveDraftChanges: state.saveDraftChanges,
    discardDraftChanges: state.discardDraftChanges,
    setInventoryMode: state.setInventoryMode,
    isSaving: state.ui.isSaving,
  }));

  const isOpen = inventoryMode !== null;

  const handleClose = () => {
    setInventoryMode(null);
  };

  const handleDiscard = () => {
    discardDraftChanges();
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
              <h2 className="text-xl font-bold">
                {inventoryMode === 'avatar' ? 'Customize Your Avatar' : 'Decorate Your Room'}
              </h2>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleClose}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                {inventoryMode === 'avatar' && <AvatarCustomizerView />}
                {inventoryMode === 'room' && <RoomDecoratorView />}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleDiscard}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                onClick={saveDraftChanges}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
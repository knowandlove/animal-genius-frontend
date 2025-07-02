import { AnimatePresence, motion } from 'framer-motion';
import { Wand2, Home, ShoppingBag, Undo2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRoomStore } from '@/stores/roomStore';
import AvatarCustomizerView from './AvatarCustomizerView';
import RoomDecoratorView from './RoomDecoratorView';
import React from 'react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function UnifiedInventoryPanel() {
  const inventoryMode = useRoomStore((state) => state.ui.inventoryMode);
  const editingMode = useRoomStore((state) => state.ui.editingMode);
  const saveDraftChanges = useRoomStore((state) => state.saveDraftChanges);
  const discardDraftChanges = useRoomStore((state) => state.discardDraftChanges);
  const setInventoryMode = useRoomStore((state) => state.setInventoryMode);
  const isSaving = useRoomStore((state) => state.ui.isSaving);
  const draftAvatar = useRoomStore((state) => state.draftAvatar);
  const openInventory = useRoomStore((state) => state.openInventory);
  const closeInventory = useRoomStore((state) => state.closeInventory);
  const undo = useRoomStore((state) => state.undo);
  const canUndo = useRoomStore((state) => state.canUndo);
  const clearAvatar = useRoomStore((state) => state.clearAvatar);
  const clearRoom = useRoomStore((state) => state.clearRoom);
  
  // Removed selected preview item state - no longer needed with auto-equip
  
  // State for clear confirmation dialog
  const [showClearDialog, setShowClearDialog] = React.useState(false);
  

  const handleClose = () => {
    setInventoryMode(null);
  };

  const handleDiscard = () => {
    discardDraftChanges();
    handleClose();
  };

  // Handle action button clicks
  const handleActionButtonClick = (action: 'avatar' | 'room' | 'store') => {
    if (action === 'store') {
      closeInventory();
      // Trigger store opening event
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openStore'));
      }, 100);
    } else {
      if (editingMode === action) {
        // If clicking the same mode, close the panel
        closeInventory();
      } else {
        // Switch to the new mode
        openInventory(action);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Action Buttons */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex items-center justify-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleActionButtonClick('avatar')}
            className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center transition-colors",
              editingMode === 'avatar'
                ? "bg-purple-700 text-white ring-4 ring-purple-400"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            )}
            title="Customize Avatar"
          >
            <Wand2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleActionButtonClick('room')}
            className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center transition-colors",
              editingMode === 'room'
                ? "bg-blue-700 text-white ring-4 ring-blue-400"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
            title="Decorate Room"
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleActionButtonClick('store')}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center transition-colors bg-green-600 hover:bg-green-700 text-white"
            title="Visit Store"
          >
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4">
          {inventoryMode === 'avatar' && <AvatarCustomizerView />}
          {inventoryMode === 'room' && <RoomDecoratorView />}
        </div>
      </ScrollArea>
      
      {/* Footer with Undo/Clear */}
      <div className="p-4 border-t flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={undo}
            disabled={!canUndo()}
            className="flex items-center gap-2"
          >
            <Undo2 className="w-3 h-3" />
            Undo
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowClearDialog(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </Button>
      </div>
      
      {/* Clear Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear {editingMode === 'avatar' ? 'Avatar' : 'Room'}?</AlertDialogTitle>
            <AlertDialogDescription>
              {editingMode === 'avatar' 
                ? 'This will remove all equipped items from your avatar. You can undo this action.'
                : 'This will remove all items from your room and return them to your inventory. You can undo this action.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (editingMode === 'avatar') {
                  clearAvatar();
                } else if (editingMode === 'room') {
                  clearRoom();
                }
                setShowClearDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
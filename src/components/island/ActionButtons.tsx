import { ShoppingBag, Wand2, Home, Undo2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIslandStore } from "@/stores/islandStore";

interface ActionButtonsProps {
  storeIsOpen: boolean;
  onStoreClick: () => void;
}

export default function ActionButtons({ storeIsOpen, onStoreClick }: ActionButtonsProps) {
  const store = useIslandStore();
  const isInventoryOpen = store.ui.isInventoryOpen;
  const editingMode = store.ui.editingMode;
  const undo = store.undo;
  const canUndo = store.canUndo();

  const handleEditModeClick = (mode: 'avatar' | 'room') => {
    if (isInventoryOpen && editingMode === mode) {
      store.closeInventory();
    } else {
      store.openInventory(mode);
    }
  };

  const handleStoreClick = () => {
    if (!storeIsOpen) return;
    
    // Exit editing mode if active
    if (store.ui.editingMode) {
      store.exitEditingMode();
    }
    onStoreClick();
  };

  return (
    <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-30">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Undo Button - Shows when editing */}
        <AnimatePresence>
          {editingMode && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: canUndo ? 1.1 : 1 }}
              whileTap={{ scale: canUndo ? 0.95 : 1 }}
              onClick={undo}
              disabled={!canUndo}
              className={cn(
                "w-12 h-12 sm:w-16 sm:h-16 rounded-full shadow-lg flex items-center justify-center transition-colors",
                canUndo
                  ? "bg-gray-600 hover:bg-gray-700 text-white cursor-pointer"
                  : "bg-gray-400 text-gray-600 cursor-not-allowed opacity-50"
              )}
              title={canUndo ? "Undo last action" : "Nothing to undo"}
            >
              <Undo2 className="w-5 h-5 sm:w-7 sm:h-7" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Customize Avatar Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleEditModeClick('avatar')}
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
          onClick={() => handleEditModeClick('room')}
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
          whileHover={{ scale: storeIsOpen ? 1.1 : 1 }}
          whileTap={{ scale: storeIsOpen ? 0.95 : 1 }}
          onClick={handleStoreClick}
          className={cn(
            "w-12 h-12 sm:w-16 sm:h-16 rounded-full shadow-lg flex items-center justify-center transition-colors relative",
            storeIsOpen 
              ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer" 
              : "bg-gray-400 text-gray-600 cursor-not-allowed"
          )}
          title={storeIsOpen ? "Visit Store" : "Store Closed"}
          disabled={!storeIsOpen}
        >
          <ShoppingBag className="w-5 h-5 sm:w-7 sm:h-7" />
          {!storeIsOpen && (
            <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold">
              ✕
            </div>
          )}
        </motion.button>
      </div>
    </div>
  );
}

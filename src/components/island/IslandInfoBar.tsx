import { Coins, Home } from "lucide-react";
import { motion } from "framer-motion";
import { useIslandStore, ROOM_ITEM_LIMIT } from "@/stores/islandStore";

interface IslandInfoBarProps {
  totalCoins: number;
  availableCoins: number;
  pendingCoins: number;
}

export default function IslandInfoBar({ totalCoins, availableCoins, pendingCoins }: IslandInfoBarProps) {
  const isInventoryOpen = useIslandStore((state) => state.ui.isInventoryOpen);
  const editingMode = useIslandStore((state) => state.ui.editingMode);
  const placedItemsCount = useIslandStore((state) => state.draftRoom.placedItems.length);

  return (
    <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 z-30">
      <div className="space-y-2">
        {/* Coin Balance */}
        <div className="flex items-center gap-2 bg-yellow-100 rounded-full px-3 py-1.5 shadow-md">
          <Coins className="w-4 h-4 text-yellow-600" />
          <span className="font-bold text-sm">{totalCoins}</span>
          {pendingCoins > 0 && (
            <span className="text-xs text-yellow-700">({availableCoins} available)</span>
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
              {placedItemsCount} / {ROOM_ITEM_LIMIT}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

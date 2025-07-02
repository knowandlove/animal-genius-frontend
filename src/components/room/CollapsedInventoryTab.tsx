import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Wand2, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoomStore } from "@/stores/roomStore";

export default function CollapsedInventoryTab() {
  const editingMode = useRoomStore((state) => state.ui.editingMode);
  const openInventory = useRoomStore((state) => state.openInventory);
  
  // If no editing mode has been set yet, default to avatar
  const mode = editingMode || 'avatar';
  
  return (
    <motion.button
      className={cn(
        "fixed right-0 top-1/2 -translate-y-1/2 w-4 h-16 flex items-center justify-center hover:w-5 transition-all rounded-l-lg shadow-md z-40",
        mode === 'avatar' ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"
      )}
      onClick={() => openInventory(mode)}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ 
        type: "spring", 
        damping: 25, 
        stiffness: 300 
      }}
      title={mode === 'avatar' ? "Customize Avatar" : "Decorate Room"}
    >
      <ChevronLeft className="w-3 h-3 text-white" />
    </motion.button>
  );
}

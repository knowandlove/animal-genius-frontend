import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wand2, Home, Minimize2, Maximize2, GripVertical, ChevronRight, ChevronLeft, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIslandStore } from "@/stores/islandStore";
import UnifiedInventoryPanel from "@/components/island/UnifiedInventoryPanel";

interface InventoryPanelProps {
  editingMode: 'avatar' | 'room' | null;
  isMobile: boolean;
  storeCatalog: any[];
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({ editingMode, isMobile }) => {
  const closeInventory = useIslandStore((state) => state.closeInventory);
  const undo = useIslandStore((state) => state.undo);
  const canUndo = useIslandStore((state) => state.canUndo());
  const isSaving = useIslandStore((state) => state.ui.isSaving);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Mobile: Slide-up panel
  if (isMobile) {
    return (
      <>
        {/* Mobile Panel - No backdrop so dragging works */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 h-[70vh] bg-white rounded-t-2xl shadow-2xl z-50 flex flex-col"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 300 
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              {editingMode === 'avatar' ? (
                <>
                  <Wand2 className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold">Customize Avatar</h2>
                </>
              ) : (
                <>
                  <Home className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Decorate Room</h2>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Saving indicator */}
              {isSaving && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse" />
                  <span>Saving...</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={undo}
                  disabled={!canUndo}
                  className="hover:bg-gray-100 disabled:opacity-50"
                  title="Undo last change"
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeInventory}
                  className="hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Drag Handle for Mobile */}
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto -mt-2 mb-2" />

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <UnifiedInventoryPanel />
          </div>

          {/* Mode Indicator */}
          <div className={cn(
            "absolute top-0 left-0 w-1 h-full",
            editingMode === 'avatar' ? "bg-purple-600" : "bg-blue-600"
          )} />
        </motion.div>
      </>
    );
  }

  // Desktop: Slide-out sidebar from right
  return (
    <>
      {/* Desktop Sidebar Container - includes panel and arrow button */}
      <motion.div
        className="fixed right-0 top-0 h-full z-50 flex"
        initial={{ x: '100%' }}
        animate={{ x: isCollapsed ? 'calc(100% - 1rem)' : 0 }}
        exit={{ x: '100%' }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 300 
        }}
      >
        {/* Edge Collapse/Expand Button */}
        <motion.button
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -left-4 w-4 h-16 flex items-center justify-center hover:w-5 transition-all rounded-l-lg shadow-md",
            editingMode === 'avatar' ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"
          )}
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Open panel" : "Collapse panel"}
        >
          {isCollapsed ? (
            <ChevronLeft className="w-3 h-3 text-white" />
          ) : (
            <ChevronRight className="w-3 h-3 text-white" />
          )}
        </motion.button>

        {/* Desktop Sidebar Panel */}
        <div className="w-[280px] h-full bg-white shadow-2xl flex flex-col">
          {/* Header with Collapse Button */}
          <div className={cn(
            "flex items-center justify-between p-4",
            editingMode === 'avatar' ? "bg-purple-600" : "bg-blue-600"
          )}>
            <div className="flex items-center gap-2 text-white">
              {editingMode === 'avatar' ? (
                <>
                  <Wand2 className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Customize Avatar</h2>
                </>
              ) : (
                <>
                  <Home className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Decorate Room</h2>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Saving indicator */}
              {isSaving && (
                <div className="flex items-center gap-1 text-xs text-white/80">
                  <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                  <span>Saving...</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={undo}
                  disabled={!canUndo}
                  className="hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Undo last change"
                >
                  <Undo2 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeInventory}
                  className="hover:bg-white/20 text-white"
                  title="Close panel"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <UnifiedInventoryPanel />
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default InventoryPanel;

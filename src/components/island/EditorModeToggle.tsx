import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Home, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIslandStore } from "@/stores/islandStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useParams } from "wouter";

const EditorModeToggle: React.FC = () => {
  const { passportCode } = useParams();
  const queryClient = useQueryClient();
  
  const editingMode = useIslandStore((state) => state.ui.editingMode);
  const isInventoryOpen = useIslandStore((state) => state.ui.isInventoryOpen);
  const openInventory = useIslandStore((state) => state.openInventory);
  const closeInventory = useIslandStore((state) => state.closeInventory);
  const isDirty = useIslandStore((state) => state.isDirty);
  const saveDraftToServer = useIslandStore((state) => state.saveDraftToServer);
  const cancelDraft = useIslandStore((state) => state.cancelDraft);

  // Save mutations
  const saveAvatarMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('POST', `/api/island/${passportCode}/avatar`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/island-page-data/${passportCode}`] });
    },
  });

  const saveRoomMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('POST', `/api/island/${passportCode}/room`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/island-page-data/${passportCode}`] });
    },
  });

  const handleSave = async () => {
    const result = await saveDraftToServer(
      editingMode === 'avatar' ? saveAvatarMutation : saveRoomMutation
    );
    if (result) {
      closeInventory();
    }
  };

  const handleCancel = () => {
    cancelDraft();
    closeInventory();
  };

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence mode="wait">
        {!isInventoryOpen ? (
          <motion.div
            key="buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col gap-2"
          >
            <Button
              size="lg"
              variant="default"
              onClick={() => openInventory('avatar')}
              className="shadow-lg bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Wand2 className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Customize Avatar</span>
              <span className="sm:hidden">Avatar</span>
            </Button>
            <Button
              size="lg"
              variant="default"
              onClick={() => openInventory('room')}
              className="shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Home className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Decorate Room</span>
              <span className="sm:hidden">Room</span>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="save-cancel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex gap-2"
          >
            {isDirty() && (
              <>
                <Button
                  size="lg"
                  variant="default"
                  onClick={handleSave}
                  disabled={saveAvatarMutation.isPending || saveRoomMutation.isPending}
                  className="shadow-lg bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleCancel}
                  className="shadow-lg"
                >
                  <X className="w-5 h-5 mr-2" />
                  Cancel
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Indicator */}
      {isInventoryOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg",
            editingMode === 'avatar' ? "bg-purple-600" : "bg-blue-600"
          )}
        >
          {editingMode === 'avatar' ? "Avatar Mode" : "Room Mode"}
        </motion.div>
      )}
    </div>
  );
};

export default EditorModeToggle;

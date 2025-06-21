import { AnimatePresence, motion } from 'framer-motion';
import { X, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIslandStore } from '@/stores/islandStore';
import AvatarCustomizerView from './AvatarCustomizerView';
import RoomDecoratorView from './RoomDecoratorView';
import React from 'react';

export default function UnifiedInventoryPanel() {
  const inventoryMode = useIslandStore((state) => state.ui.inventoryMode);
  const saveDraftChanges = useIslandStore((state) => state.saveDraftChanges);
  const discardDraftChanges = useIslandStore((state) => state.discardDraftChanges);
  const setInventoryMode = useIslandStore((state) => state.setInventoryMode);
  const isSaving = useIslandStore((state) => state.ui.isSaving);
  const draftAvatar = useIslandStore((state) => state.draftAvatar);
  
  // State for selected preview item (lifted up from AvatarCustomizerView)
  const [selectedPreviewItem, setSelectedPreviewItem] = React.useState<{
    id: string;
    slot: string;
    item: any;
  } | null>(null);
  
  // Determine if remove button should be enabled based on selected slot
  const isRemoveEnabled = () => {
    if (!selectedPreviewItem) return false;
    const { slot } = selectedPreviewItem;
    return !!draftAvatar.equipped[slot as keyof typeof draftAvatar.equipped];
  };

  const handleClose = () => {
    setInventoryMode(null);
    setSelectedPreviewItem(null);
  };

  const handleDiscard = () => {
    discardDraftChanges();
    handleClose();
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {inventoryMode === 'avatar' ? '👗 Customize Avatar' : '🏠 Room Decorations'}
          </CardTitle>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleClose}
            className="h-7 w-7"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(600px-8rem)]">
          <div className="p-4">
            {inventoryMode === 'avatar' && (
              <AvatarCustomizerView 
                selectedPreviewItem={selectedPreviewItem}
                setSelectedPreviewItem={setSelectedPreviewItem}
              />
            )}
            {inventoryMode === 'room' && <RoomDecoratorView />}
          </div>
        </ScrollArea>
        
        {/* Footer with Equip/Remove/Save/Cancel */}
        <div className="p-4 border-t flex items-center justify-between">
          {/* Left side - Equip and Remove buttons (only for avatar mode) */}
          <div className="flex items-center gap-2">
            {inventoryMode === 'avatar' && (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    const event = new CustomEvent('equip-item');
                    window.dispatchEvent(event);
                  }}
                  disabled={!selectedPreviewItem}
                  className="flex items-center gap-2"
                >
                  Equip Item
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const event = new CustomEvent('remove-item');
                    window.dispatchEvent(event);
                  }}
                  disabled={!selectedPreviewItem || !isRemoveEnabled()}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:text-red-300"
                >
                  Remove
                </Button>
              </>
            )}
          </div>
          
          {/* Right side - Save and Cancel */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={saveDraftChanges}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="w-3 h-3" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDiscard}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-3 h-3" />
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
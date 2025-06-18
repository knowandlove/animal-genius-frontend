import { AnimatePresence, motion } from 'framer-motion';
import { X, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIslandStore } from '@/stores/islandStore';
import AvatarCustomizerView from './AvatarCustomizerView';
import RoomDecoratorView from './RoomDecoratorView';

export default function UnifiedInventoryPanel() {
  const inventoryMode = useIslandStore((state) => state.ui.inventoryMode);
  const saveDraftChanges = useIslandStore((state) => state.saveDraftChanges);
  const discardDraftChanges = useIslandStore((state) => state.discardDraftChanges);
  const setInventoryMode = useIslandStore((state) => state.setInventoryMode);
  const isSaving = useIslandStore((state) => state.ui.isSaving);

  const handleClose = () => {
    setInventoryMode(null);
  };

  const handleDiscard = () => {
    discardDraftChanges();
    handleClose();
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {inventoryMode === 'avatar' ? '👗 Customize Avatar' : '🏠 Room Decorations'}
          </CardTitle>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(600px-8rem)]">
          <div className="p-4">
            {inventoryMode === 'avatar' && <AvatarCustomizerView />}
            {inventoryMode === 'room' && <RoomDecoratorView />}
          </div>
        </ScrollArea>
        
        {/* Footer with Save/Cancel */}
        <div className="p-4 border-t flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDiscard}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-3 h-3" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={saveDraftChanges}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-3 h-3" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
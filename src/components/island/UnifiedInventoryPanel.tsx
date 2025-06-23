import { ScrollArea } from '@/components/ui/scroll-area';
import { useIslandStore } from '@/stores/islandStore';
import AvatarCustomizerView from './AvatarCustomizerView';
import RoomDecoratorView from './RoomDecoratorView';
import React from 'react';

export default function UnifiedInventoryPanel() {
  const inventoryMode = useIslandStore((state) => state.ui.inventoryMode);
  
  // State for selected preview item (lifted up from AvatarCustomizerView)
  const [selectedPreviewItem, setSelectedPreviewItem] = React.useState<{
    id: string;
    slot: string;
    item: any;
  } | null>(null);

  return (
    <div className="h-full flex flex-col">
      {/* Content area - will grow and scroll */}
      <ScrollArea className="flex-1 p-4">
        {inventoryMode === 'avatar' && (
          <AvatarCustomizerView 
            selectedPreviewItem={selectedPreviewItem}
            setSelectedPreviewItem={setSelectedPreviewItem}
          />
        )}
        {inventoryMode === 'room' && <RoomDecoratorView />}
      </ScrollArea>
    </div>
  );
}
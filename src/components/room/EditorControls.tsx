import React from 'react';
import { Button } from '@/components/ui/button';
import { Shirt, Home } from 'lucide-react';
import { useRoomStore } from "@/stores/roomStore";

const EditorControls = React.memo(() => {
  const inventoryMode = useRoomStore((state) => state.ui.inventoryMode);
  const setInventoryMode = useRoomStore((state) => state.setInventoryMode);

  const handleAvatarClick = React.useCallback(() => {
    setInventoryMode(inventoryMode === 'avatar' ? null : 'avatar');
  }, [inventoryMode, setInventoryMode]);

  const handleRoomClick = React.useCallback(() => {
    setInventoryMode(inventoryMode === 'room' ? null : 'room');
  }, [inventoryMode, setInventoryMode]);

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant={inventoryMode === 'avatar' ? 'default' : 'outline'}
        onClick={handleAvatarClick}
        className="flex items-center gap-2"
      >
        <Shirt className="w-4 h-4" />
        Customize Avatar
      </Button>
      <Button
        size="sm"
        variant={inventoryMode === 'room' ? 'default' : 'outline'}
        onClick={handleRoomClick}
        className="flex items-center gap-2"
      >
        <Home className="w-4 h-4" />
        Decorate Room
      </Button>
    </div>
  );
});

EditorControls.displayName = 'EditorControls';

export default EditorControls;
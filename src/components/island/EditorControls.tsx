import React from 'react';
import { Button } from '@/components/ui/button';
import { Shirt, Home, Undo2 } from 'lucide-react';
import { useIslandStore } from '@/stores/islandStore';

const EditorControls = React.memo(() => {
  const inventoryMode = useIslandStore((state) => state.ui.inventoryMode);
  const setInventoryMode = useIslandStore((state) => state.setInventoryMode);
  const editingMode = useIslandStore((state) => state.ui.editingMode);
  const undo = useIslandStore((state) => state.undo);
  const canUndo = useIslandStore((state) => state.canUndo());

  const handleAvatarClick = React.useCallback(() => {
    setInventoryMode(inventoryMode === 'avatar' ? null : 'avatar');
  }, [inventoryMode, setInventoryMode]);

  const handleRoomClick = React.useCallback(() => {
    setInventoryMode(inventoryMode === 'room' ? null : 'room');
  }, [inventoryMode, setInventoryMode]);

  const handleUndo = React.useCallback(() => {
    undo();
  }, [undo]);

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
      {editingMode && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleUndo}
          disabled={!canUndo}
          className="flex items-center gap-2"
          title="Undo last action"
        >
          <Undo2 className="w-4 h-4" />
          Undo
        </Button>
      )}
    </div>
  );
});

EditorControls.displayName = 'EditorControls';

export default EditorControls;
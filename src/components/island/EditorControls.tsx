import { Button } from '@/components/ui/button';
import { Shirt, Home } from 'lucide-react';
import { useIslandStore } from '@/stores/islandStore';

export default function EditorControls() {
  const inventoryMode = useIslandStore((state) => state.ui.inventoryMode);
  const setInventoryMode = useIslandStore((state) => state.setInventoryMode);

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant={inventoryMode === 'avatar' ? 'default' : 'outline'}
        onClick={() => setInventoryMode(inventoryMode === 'avatar' ? null : 'avatar')}
        className="flex items-center gap-2"
      >
        <Shirt className="w-4 h-4" />
        Customize Avatar
      </Button>
      <Button
        size="sm"
        variant={inventoryMode === 'room' ? 'default' : 'outline'}
        onClick={() => setInventoryMode(inventoryMode === 'room' ? null : 'room')}
        className="flex items-center gap-2"
      >
        <Home className="w-4 h-4" />
        Decorate Room
      </Button>
    </div>
  );
}
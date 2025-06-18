import { useIslandStore } from '@/stores/islandStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Shirt, Home, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function IslandInventory() {
  const { 
    inventory, 
    ui,
    setInventoryFilter,
    selectInventoryItem,
    startDragging,
    setUIMode
  } = useIslandStore();

  // Filter items based on current filter
  const filteredItems = inventory.items.filter(item => {
    if (inventory.filter === 'all') return true;
    if (inventory.filter === 'clothing') return item.type.startsWith('avatar');
    if (inventory.filter === 'furniture') return item.type.includes('furniture') || item.type.includes('decoration');
    if (inventory.filter === 'special') return item.rarity === 'rare' || item.rarity === 'legendary';
    return false;
  });

  const handleItemClick = (item: any) => {
    if (ui.mode === 'placing' && (item.type.includes('furniture') || item.type.includes('decoration'))) {
      // Start dragging for placement
      startDragging({
        itemId: item.id,
        fromInventory: true
      });
      selectInventoryItem(item.id);
    } else if (ui.mode === 'customizing' && item.type.startsWith('avatar')) {
      // Open customization modal
      selectInventoryItem(item.id);
    } else {
      // Just select the item
      selectInventoryItem(item.id === inventory.selectedItem ? undefined : item.id);
    }
  };

  const handleDragStart = (item: any, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    startDragging({
      itemId: item.id,
      fromInventory: true
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="w-5 h-5" />
          Inventory
          <Badge variant="secondary" className="ml-auto">
            {filteredItems.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={inventory.filter} onValueChange={(v) => setInventoryFilter(v as any)}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="all" className="text-xs">
              <Package className="w-4 h-4 mr-1" />
              All
            </TabsTrigger>
            <TabsTrigger value="clothing" className="text-xs">
              <Shirt className="w-4 h-4 mr-1" />
              Clothing
            </TabsTrigger>
            <TabsTrigger value="furniture" className="text-xs">
              <Home className="w-4 h-4 mr-1" />
              Furniture
            </TabsTrigger>
            <TabsTrigger value="special" className="text-xs">
              <Sparkles className="w-4 h-4 mr-1" />
              Special
            </TabsTrigger>
          </TabsList>

          <TabsContent value={inventory.filter} className="mt-0">
            <div className="grid grid-cols-4 gap-2 max-h-[400px] overflow-y-auto">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "relative p-3 border rounded-lg cursor-pointer transition-all",
                    "hover:border-primary hover:shadow-md",
                    inventory.selectedItem === item.id && "border-primary bg-primary/5",
                    ui.mode === 'placing' && !item.type.includes('furniture') && !item.type.includes('decoration') && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handleItemClick(item)}
                  draggable={ui.mode === 'placing' && (item.type.includes('furniture') || item.type.includes('decoration'))}
                  onDragStart={(e) => handleDragStart(item, e)}
                >
                  <div className="aspect-square bg-gray-100 rounded mb-1 flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  {item.quantity && item.quantity > 1 && (
                    <Badge variant="secondary" className="absolute top-1 right-1 text-xs px-1">
                      {item.quantity}
                    </Badge>
                  )}
                  {item.rarity && item.rarity !== 'common' && (
                    <Badge 
                      variant={item.rarity === 'rare' ? 'default' : 'destructive'}
                      className="absolute bottom-1 right-1 text-xs px-1 py-0"
                    >
                      {item.rarity === 'rare' ? '★' : '⭐'}
                    </Badge>
                  )}
                </motion.div>
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-4 text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No items in this category</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Item Details */}
        {inventory.selectedItem && (
          <div className="mt-4 p-3 bg-secondary/20 rounded-lg">
            {(() => {
              const selectedItem = filteredItems.find(i => i.id === inventory.selectedItem);
              if (!selectedItem) return null;
              
              return (
                <>
                  <h4 className="font-semibold text-sm">{selectedItem.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{selectedItem.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {selectedItem.type.startsWith('avatar') && ui.mode !== 'placing' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setUIMode('customizing')}
                        className="text-xs"
                      >
                        Try On
                      </Button>
                    )}
                    {(selectedItem.type.includes('furniture') || selectedItem.type.includes('decoration')) && ui.mode === 'placing' && (
                      <p className="text-xs text-muted-foreground">
                        Drag to place in room
                      </p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

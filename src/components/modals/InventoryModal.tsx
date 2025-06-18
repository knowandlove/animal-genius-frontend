import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoreItem } from "@shared/currency-types";

// Interface for categorized inventory items
export interface CategorizedItems {
  hats: (StoreItem & { id: string })[];
  glasses: (StoreItem & { id: string })[];
  accessories: (StoreItem & { id: string })[];
}

interface InventoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categorizedItems: CategorizedItems;
  equippedItems: {
    hat?: string;
    glasses?: string;
    accessory?: string;
  };
  onEquipItem: (slot: string, itemId: string | null) => void;
  isEquipPending: boolean;
}

export function InventoryModal({
  isOpen,
  onOpenChange,
  categorizedItems,
  equippedItems,
  onEquipItem,
  isEquipPending,
}: InventoryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">Inventory</DialogTitle>
          <DialogDescription>
            Manage your avatar items and room decorations
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="avatar" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="avatar">Avatar Items</TabsTrigger>
            <TabsTrigger value="room" disabled>Room Items (Coming Soon)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="avatar" className="space-y-6 max-h-[50vh] overflow-y-auto">
            {/* Hats */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">🎩</span> Hats
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {categorizedItems.hats.length > 0 ? (
                  categorizedItems.hats.map((item) => {
                    const isEquipped = equippedItems.hat === item.id;
                    return (
                      <Card 
                        key={item.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-lg",
                          isEquipped && "ring-2 ring-green-500 bg-green-50",
                          isEquipPending && "opacity-50 cursor-wait"
                        )}
                        onClick={() => !isEquipPending && onEquipItem('hat', isEquipped ? null : item.id)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-3xl">🎩</span>
                          </div>
                          <h4 className="font-semibold text-sm">{item.name}</h4>
                          <Badge variant={item.rarity === 'rare' ? 'default' : 'outline'} className="mt-1 text-xs">
                            {item.rarity}
                          </Badge>
                          {isEquipped && (
                            <Badge variant="secondary" className="mt-2 bg-green-100">
                              Equipped
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground col-span-full text-center py-8">
                    No hats owned yet. Visit the store to buy some!
                  </p>
                )}
              </div>
            </div>

            {/* Glasses */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">🕶️</span> Glasses
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {categorizedItems.glasses.length > 0 ? (
                  categorizedItems.glasses.map((item) => {
                    const isEquipped = equippedItems.glasses === item.id;
                    return (
                      <Card 
                        key={item.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-lg",
                          isEquipped && "ring-2 ring-green-500 bg-green-50",
                          isEquipPending && "opacity-50 cursor-wait"
                        )}
                        onClick={() => !isEquipPending && onEquipItem('glasses', isEquipped ? null : item.id)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-3xl">🕶️</span>
                          </div>
                          <h4 className="font-semibold text-sm">{item.name}</h4>
                          <Badge variant={item.rarity === 'rare' ? 'default' : 'outline'} className="mt-1 text-xs">
                            {item.rarity}
                          </Badge>
                          {isEquipped && (
                            <Badge variant="secondary" className="mt-2 bg-green-100">
                              Equipped
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground col-span-full text-center py-8">
                    No glasses owned yet. Visit the store to buy some!
                  </p>
                )}
              </div>
            </div>

            {/* Accessories */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">💎</span> Accessories
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {categorizedItems.accessories.length > 0 ? (
                  categorizedItems.accessories.map((item) => {
                    const isEquipped = equippedItems.accessory === item.id;
                    return (
                      <Card 
                        key={item.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-lg",
                          isEquipped && "ring-2 ring-green-500 bg-green-50",
                          isEquipPending && "opacity-50 cursor-wait"
                        )}
                        onClick={() => !isEquipPending && onEquipItem('accessory', isEquipped ? null : item.id)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-3xl">💎</span>
                          </div>
                          <h4 className="font-semibold text-sm">{item.name}</h4>
                          <Badge variant={item.rarity === 'rare' ? 'default' : 'outline'} className="mt-1 text-xs">
                            {item.rarity}
                          </Badge>
                          {isEquipped && (
                            <Badge variant="secondary" className="mt-2 bg-green-100">
                              Equipped
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground col-span-full text-center py-8">
                    No accessories owned yet. Visit the store to buy some!
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="room">
            <div className="text-center py-12 text-muted-foreground">
              <Home className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Room decoration coming soon!</p>
              <p className="text-sm mt-2">You'll be able to customize your den with furniture and decorations.</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

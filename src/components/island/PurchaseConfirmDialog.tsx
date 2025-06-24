import { Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StoreItem } from "@/hooks/data";

interface PurchaseConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: StoreItem | null;
  availableCoins: number;
  pendingCoins: number;
  onConfirm: () => void;
  isPending: boolean;
}

export default function PurchaseConfirmDialog({
  open,
  onOpenChange,
  selectedItem,
  availableCoins,
  pendingCoins,
  onConfirm,
  isPending,
}: PurchaseConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Purchase</DialogTitle>
          <DialogDescription>
            Are you sure you want to buy this item?
          </DialogDescription>
        </DialogHeader>
        {selectedItem && (
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{selectedItem.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
              </div>
              <Badge variant={selectedItem.rarity === 'rare' ? 'default' : 'outline'}>
                {selectedItem.rarity || 'common'}
              </Badge>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-lg">{selectedItem.cost} coins</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Available: {availableCoins} coins
                {pendingCoins > 0 && (
                  <span className="text-xs"> ({pendingCoins} pending)</span>
                )}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isPending}
          >
            {isPending ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Submitting...
              </>
            ) : (
              'Confirm Purchase'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

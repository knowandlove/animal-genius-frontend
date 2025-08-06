import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { getPassportAuthHeaders } from '@/lib/passport-auth';
import { useQueryClient } from '@tanstack/react-query';

interface Seed {
  id: string;
  storeItemId: string;
  name: string;
  emoji: string;
  growthTime: number;
  quantity: number;
}

interface PlantingModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  plotId: string;
  onPlantSuccess: () => void;
}

export function PlantingModal({
  isOpen,
  onClose,
  position,
  plotId,
  onPlantSuccess
}: PlantingModalProps) {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanting, setIsPlanting] = useState(false);
  const queryClient = useQueryClient();

  // Load available seeds when modal opens
  useState(() => {
    if (isOpen) {
      loadAvailableSeeds();
    }
  });

  const loadAvailableSeeds = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('GET', '/api/garden/available-seeds', undefined, {
        headers: getPassportAuthHeaders()
      });
      
      // Transform inventory items into seed format
      const seedList = response.seeds.map((item: any) => ({
        id: item.seedType,
        storeItemId: item.storeItemId,
        name: item.name.replace(' Seeds', ''),
        emoji: item.emoji || '🌱',
        growthTime: item.growthHours,
        quantity: item.quantity
      }));
      
      setSeeds(seedList);
    } catch (error) {
      console.error('Failed to load seeds:', error);
      setSeeds([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlant = async () => {
    if (!selectedSeed) return;
    
    try {
      setIsPlanting(true);
      
      await apiRequest('POST', '/api/garden/plant', {
        plotId,
        seedType: selectedSeed,
        positionX: position.x,
        positionY: position.y
      }, {
        headers: getPassportAuthHeaders()
      });
      
      // Invalidate queries to refresh garden view
      queryClient.invalidateQueries({ queryKey: ['garden'] });
      queryClient.invalidateQueries({ queryKey: ['student-inventory'] });
      
      onPlantSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to plant seed:', error);
      alert(error.message || 'Failed to plant seed');
    } finally {
      setIsPlanting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Plant a Seed</DialogTitle>
          <DialogDescription>
            Choose a seed to plant at position ({position.x}, {position.y})
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : seeds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>You don't have any seeds!</p>
              <p className="text-sm mt-2">Visit the store to buy some.</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {seeds.map((seed) => (
                  <button
                    key={seed.id}
                    onClick={() => setSelectedSeed(seed.id)}
                    className={`w-full p-4 rounded-lg border transition-colors text-left ${
                      selectedSeed === seed.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{seed.emoji}</span>
                        <div>
                          <p className="font-medium">{seed.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Grows in {seed.growthTime} hours
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        x{seed.quantity}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPlanting}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePlant}
            disabled={!selectedSeed || isPlanting}
          >
            {isPlanting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Planting...
              </>
            ) : (
              'Plant'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
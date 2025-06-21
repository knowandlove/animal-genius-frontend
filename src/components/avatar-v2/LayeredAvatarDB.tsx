import React, { useState, CSSProperties, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ANIMAL_CONFIGS } from '@/config/animal-sizing';
import { getItemFolder } from '@shared/currency-types';
import { getAssetUrl } from '@/utils/cloud-assets';
import { useStoreItems, useItemPositions } from '@/contexts/StoreDataContext';

interface AvatarLayer {
  id: string;
  src?: string;
  emoji?: string;
  zIndex: number;
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  scale?: number;
  rotation?: number;
}

interface LayeredAvatarDBProps {
  animalType: string;
  width?: number;
  height?: number;
  items?: {
    hat?: string;
    glasses?: string;
    accessory?: string;
  };
  onClick?: () => void;
  className?: string;
  animated?: boolean;
  storeCatalog?: any[]; // Add store catalog for item lookups
}

// Emoji fallbacks for when images aren't loaded yet
const animalEmojis: Record<string, string> = {
  beaver: '🦫',
  elephant: '🐘',
  owl: '🦉',
  otter: '🦦',
  parrot: '🦜',
  'border collie': '🐕',
  meerkat: '🦫',
  panda: '🐼',
};

function LayeredAvatarDB({
  animalType,
  width = 300,
  height = 300,
  items = {},
  onClick,
  className,
  animated = true,
}: LayeredAvatarDBProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [useAvatarImage, setUseAvatarImage] = useState(true);

  // Get store data from context instead of fetching individually
  const storeItems = useStoreItems();
  const itemPositions = useItemPositions();



  const handleClick = () => {
    onClick?.();
  };

  // Determine which image to use for the base animal
  const getAnimalImage = () => {
    const normalizedAnimal = animalType.toLowerCase().replace(' ', '-');
    
    // Use head icons from cloud storage
    // Special case for border collie -> collie.png
    const fileName = normalizedAnimal === 'border-collie' ? 'collie' : normalizedAnimal;
    
    // Use the cloud assets utility which handles the cloud/local switching
    return getAssetUrl(`/images/${fileName}.png`);
  };

  // Get position from database or use default
  const getItemPosition = (itemId: string, animalType: string) => {
    if (!itemPositions) {
      // No item positions loaded yet
      return null;
    }
    
    // Find position for this item and animal
    // Handle different naming conventions (e.g., "Border Collie" vs "border-collie")
    const normalizedAnimal = animalType.toLowerCase().replace(/\s+/g, '-');
    const position = itemPositions.find(
      (pos: any) => {
        // Try exact match first
        if (pos.item_id === itemId && pos.animal_type === normalizedAnimal) {
          return true;
        }
        // Also try without dashes (for backward compatibility)
        if (pos.item_id === itemId && pos.animal_type === animalType.toLowerCase()) {
          return true;
        }
        return false;
      }
    );
    

    
    if (position) {
      const result = {
        x: position.position_x || 50,
        y: position.position_y || 50,
        scale: (position.scale || 50) / 100,
        rotation: position.rotation || 0
      };

      return result;
    }
    
    // No position found, using default
    return null;
  };

  // Build layers array
  const layers: AvatarLayer[] = [
    // Base animal layer
    {
      id: 'base',
      src: getAnimalImage(),
      emoji: animalEmojis[animalType.toLowerCase()] || '🐾',
      zIndex: 1,
      position: { top: '50%', left: '50%' },
    },
  ];

  // Add equipped items as layers with database positions
  Object.entries(items).forEach(([slot, itemId]) => {
    if (!itemId) return;
    
    const dbPosition = getItemPosition(itemId, animalType);
    const storeItem = storeItems?.find((item: any) => item.id === itemId);
    
    // Simple: Just use the imageUrl from the store item
    const imagePath = storeItem?.imageUrl;
    if (!imagePath) return; // Skip if no image
    
    // Determine z-index based on slot
    const zIndex = slot === 'hat' ? 10 : slot === 'glasses' ? 8 : 7;
    
    const position = dbPosition ? {
      top: `${dbPosition.y}%`,
      left: `${dbPosition.x}%`
    } : {
      top: '50%',
      left: '50%'
    };
    
    layers.push({
      id: `${slot}-${itemId}`,
      src: imagePath,
      emoji: '🎩', // Generic fallback emoji
      zIndex,
      position,
      scale: dbPosition?.scale || 0.5,
      rotation: dbPosition?.rotation || 0,
    });
  });

  return (
    <div
      className={cn(
        'relative cursor-pointer transition-all duration-300',
        isHovered && 'scale-105',
        className
      )}
      style={{ width, height, overflow: 'visible' }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Render each layer */}
      {layers.map((layer) => {
        const isBaseLayer = layer.id === 'base';
        const animalConfig = ANIMAL_CONFIGS[animalType.toLowerCase().replace(' ', '-')] || {};
        const animalItemScale = animalConfig.itemScale || 1;
        
        const style: CSSProperties = {
          position: 'absolute',
          zIndex: layer.zIndex,
          ...layer.position,
          transform: `
            translate(-50%, -50%) 
            scale(${isBaseLayer ? (animalConfig.baseScale || 1) : (layer.scale || 1)}) 
            rotate(${layer.rotation || 0}deg)
          `,
          transformOrigin: 'center',
          transition: animated ? 'all 0.3s ease' : undefined,
          // Base layer should fill the container
          ...(isBaseLayer ? {
            width: '75%',
            height: '75%',
            maxWidth: '75%',
            maxHeight: '75%',
          } : {}),
        };
        


        if (layer.src) {
          const imgElement = (
            <img
              key={layer.id}
              src={layer.src}
              alt=""
              className={isBaseLayer ? "object-contain" : "absolute"}
              style={style}
              draggable={false}
              onError={(e) => {
                if (isBaseLayer && useAvatarImage) {
                  // Fallback to SVG for base animal
                  setUseAvatarImage(false);
                } else {
                  // Image failed to load
                }
              }}
            />
          );
          

          
          return imgElement;
        } else if (layer.emoji) {
          return (
            <span
              key={layer.id}
              className={cn(
                'absolute block text-center select-none',
                isBaseLayer ? 'text-8xl' : 'text-6xl'
              )}
              style={style}
            >
              {layer.emoji}
            </span>
          );
        }
        return null;
      })}
    </div>
  );
}

export default React.memo(LayeredAvatarDB);

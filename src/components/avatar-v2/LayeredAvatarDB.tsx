import React, { useState, CSSProperties, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ANIMAL_CONFIGS } from '@/config/animal-sizing';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { getItemFolder } from '@shared/currency-types';

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

// Default positioning (used when no database position exists)
const defaultItemConfigs: Record<string, Partial<AvatarLayer>> = {
  // Hats
  explorer: {
    src: '/avatars/items/hats/explorer.png',
    emoji: '🎩',
    zIndex: 10,
  },
  safari: {
    src: '/avatars/items/hats/safari.png',
    emoji: '👒',
    zIndex: 10,
  },
  
  // Glasses
  greenblinds: {
    src: '/avatars/items/glasses/greenblinds.png',
    emoji: '🕶️',
    zIndex: 8,
  },
  hearts: {
    src: '/avatars/items/glasses/hearts.png',
    emoji: '😍',
    zIndex: 8,
  },
  
  // Accessories
  bow_tie: {
    src: '/avatars/items/accessories/bow_tie.png',
    emoji: '🎀',
    zIndex: 7,
  },
  necklace: {
    src: '/avatars/items/accessories/necklace.png',
    emoji: '📿',
    zIndex: 7,
  },
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

  console.log('LayeredAvatarDB rendering with:', {
    animalType,
    items,
    width,
    height
  });

  // Fetch item positions from database
  const { data: itemPositions } = useQuery({
    queryKey: ['/api/item-positions'],
    queryFn: () => apiRequest('GET', '/api/item-positions'),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  console.log('Fetched item positions:', itemPositions);

  const handleClick = () => {
    onClick?.();
  };

  // Determine which image to use for the base animal
  const getAnimalImage = () => {
    const normalizedAnimal = animalType.toLowerCase().replace(' ', '-');
    
    if (!useAvatarImage) {
      // Fallback to SVG
      const svgName = normalizedAnimal === 'border-collie' ? 'border_collie' : normalizedAnimal;
      return `/images/${svgName}.svg`;
    }
    
    // Special case for border collie -> collie.png
    if (normalizedAnimal === 'border-collie') {
      return '/avatars/animals/collie.png';
    }
    
    // For all other animals, use the normalized name
    return `/avatars/animals/${normalizedAnimal}.png`;
  };

  // Get position from database or use default
  const getItemPosition = (itemId: string, animalType: string) => {
    if (!itemPositions) {
      console.log('No item positions loaded yet');
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
    
    console.log(`Looking for position: item=${itemId}, animal=${normalizedAnimal} (original: ${animalType})`);
    console.log('Found position:', position);
    
    if (position) {
      const result = {
        x: position.position_x || 50,
        y: position.position_y || 50,
        scale: (position.scale || 50) / 100,
        rotation: position.rotation || 0
      };
      console.log('Returning position:', result);
      return result;
    }
    
    console.log('No position found, using default');
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
    if (itemId && defaultItemConfigs[itemId]) {
      const baseConfig = defaultItemConfigs[itemId];
      const dbPosition = getItemPosition(itemId, animalType);
      
      // Get image path using the helper function
      const folder = getItemFolder(itemId);
      const imagePath = `/avatars/items/${folder}/${itemId}.png`;
      
      if (dbPosition) {
        layers.push({
          id: `${slot}-${itemId}`,
          ...baseConfig,
          src: imagePath,
          position: { 
            top: `${dbPosition.y}%`, 
            left: `${dbPosition.x}%` 
          },
          scale: dbPosition.scale,
          rotation: dbPosition.rotation,
        });
      } else {
        // Fallback to default center position
        layers.push({
          id: `${slot}-${itemId}`,
          ...baseConfig,
          src: imagePath,
          position: { 
            top: '50%', 
            left: '50%' 
          },
          scale: 0.5,
          rotation: 0,
        });
      }
    }
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
            scale(${isBaseLayer ? (animalConfig.baseScale || 1) : ((layer.scale || 1) * animalItemScale)}) 
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
          return (
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
                  console.error(`Failed to load image: ${(e.target as HTMLImageElement).src}`);
                }
              }}
            />
          );
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

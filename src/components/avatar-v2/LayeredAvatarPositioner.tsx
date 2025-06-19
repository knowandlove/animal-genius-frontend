import React, { useState, CSSProperties, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ANIMAL_CONFIGS } from '@/config/animal-sizing';
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

interface LayeredAvatarPositionerProps {
  animalType: string;
  width?: number;
  height?: number;
  selectedItem?: string;
  itemPosition?: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
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

// Default positioning (used when no position provided)
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

function LayeredAvatarPositioner({
  animalType,
  width = 300,
  height = 300,
  selectedItem,
  itemPosition,
  animated = true,
}: LayeredAvatarPositionerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [useAvatarImage, setUseAvatarImage] = useState(true);

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

  // Add selected item as layer with manual position
  if (selectedItem && itemPosition && defaultItemConfigs[selectedItem]) {
    const baseConfig = defaultItemConfigs[selectedItem];
    const folder = getItemFolder(selectedItem);
    const imagePath = `/avatars/items/${folder}/${selectedItem}.png`;
    
    layers.push({
      id: `item-${selectedItem}`,
      ...baseConfig,
      src: imagePath,
      position: { 
        top: `${itemPosition.y}%`, 
        left: `${itemPosition.x}%` 
      },
      scale: itemPosition.scale,
      rotation: itemPosition.rotation,
    });
  }

  return (
    <div
      className={cn(
        'relative transition-all duration-300',
        isHovered && 'scale-105'
      )}
      style={{ width, height, overflow: 'visible' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Render each layer */}
      {layers.map((layer) => {
        const isBaseLayer = layer.id === 'base';
        const animalConfig = ANIMAL_CONFIGS[animalType.toLowerCase().replace(' ', '-')] || {};
        
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

export default React.memo(LayeredAvatarPositioner);

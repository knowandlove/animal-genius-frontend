import React, { useState, CSSProperties, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ANIMAL_CONFIGS } from '@/config/animal-sizing';
import { getItemFolder } from '@shared/currency-types';
import { getAnimalScale, getItemScale, AVATAR_RENDER_CONFIG } from '@/utils/avatar-render';

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
    // Base animal layer - using unified positioning
    {
      id: 'base',
      src: getAnimalImage(),
      emoji: animalEmojis[animalType.toLowerCase()] || '🐾',
      zIndex: 1,
      position: AVATAR_RENDER_CONFIG.baseAnimalPosition,
      scale: getAnimalScale(animalType),
    },
  ];

  // Add selected item as layer with manual position
  if (selectedItem && itemPosition) {
    // Check if it's a legacy item with config
    const baseConfig = defaultItemConfigs[selectedItem] || {};
    
    // Determine the image path
    let imagePath: string;
    if (defaultItemConfigs[selectedItem]) {
      // Legacy item - use old path structure
      const folder = getItemFolder(selectedItem);
      imagePath = `/avatars/items/${folder}/${selectedItem}.png`;
    } else {
      // New database item - assume it's in uploads folder
      // The store management system saves images with the item ID
      imagePath = `/uploads/store-items/${selectedItem}.png`;
      // If it starts with /uploads/, add the backend URL
      if (!imagePath.startsWith('http')) {
        imagePath = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${imagePath}`;
      }
    }
    
    // Determine z-index based on item type if not in config
    let zIndex = baseConfig.zIndex || 10; // Default to 10 for hats
    
    layers.push({
      id: `item-${selectedItem}`,
      ...baseConfig,
      src: imagePath,
      emoji: baseConfig.emoji || '🎩', // Default emoji
      zIndex: zIndex,
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
            scale(${layer.scale || 1}) 
            rotate(${layer.rotation || 0}deg)
          `,
          transformOrigin: 'center',
          transition: animated ? 'all 0.3s ease' : undefined,
          // Remove the width/height for base layer - let transform handle it
        };

        if (layer.src) {
          return (
            <img
              key={layer.id}
              src={layer.src}
              alt=""
              className={isBaseLayer ? "object-contain w-full h-full" : "absolute"}
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

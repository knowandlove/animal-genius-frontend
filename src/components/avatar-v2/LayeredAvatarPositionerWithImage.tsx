import React, { useState, CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { ANIMAL_CONFIGS } from '@/config/animal-sizing';
import { getAssetUrl } from '@/utils/cloud-assets';
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

interface LayeredAvatarPositionerWithImageProps {
  animalType: string;
  width?: number;
  height?: number;
  selectedItem?: string;
  selectedItemImageUrl?: string;
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

function LayeredAvatarPositionerWithImage({
  animalType,
  width = 600,  // Standardized to 600
  height = 600, // Standardized to 600
  selectedItem,
  selectedItemImageUrl,
  itemPosition,
  animated = true,
}: LayeredAvatarPositionerWithImageProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine which image to use for the base animal
  const getAnimalImage = () => {
    const normalizedAnimal = animalType.toLowerCase().replace(' ', '-');
    
    // Use full-body images for positioning - matching LayeredAvatarRoom path format
    const animalFileName = normalizedAnimal === 'border-collie' ? 'border_collie' : normalizedAnimal;
    
    // Use the cloud assets utility which handles the cloud/local switching
    return getAssetUrl(`/images/${animalFileName}_full.png`);
  };

  // Build layers array
  const layers: AvatarLayer[] = [
    // Base animal layer - using unified rendering
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
  if (selectedItem && itemPosition && selectedItemImageUrl) {
    // The image URL should already be properly formatted from the backend
    // (either a full Supabase URL or a local path with API URL)
    let imagePath = selectedItemImageUrl;
    
    // Only process if it's not already a full URL
    if (!imagePath.startsWith('http')) {
      // If it's a relative path without leading slash, add it
      if (!imagePath.startsWith('/')) {
        imagePath = '/' + imagePath;
      }
      
      // If it's a backend upload path, add the API URL
      if (imagePath.startsWith('/uploads/')) {
        imagePath = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${imagePath}`;
      }
    }
    
    layers.push({
      id: `item-${selectedItem}`,
      src: imagePath,
      emoji: '🎩', // Default emoji for items
      zIndex: 10,
      position: { 
        top: `${itemPosition.y}%`, 
        left: `${itemPosition.x}%` 
      },
      scale: getItemScale(itemPosition.scale * 100, animalType),
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
          // Base layer should be contained within the area
          ...(isBaseLayer ? {
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
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
                console.error(`Failed to load image: ${(e.target as HTMLImageElement).src}`);
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

export default React.memo(LayeredAvatarPositionerWithImage);

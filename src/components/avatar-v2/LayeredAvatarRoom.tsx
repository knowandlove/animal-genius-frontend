import React, { useState, CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { ANIMAL_CONFIGS } from '@/config/animal-sizing';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { getAssetUrl } from '@/utils/cloud-assets';

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

interface LayeredAvatarRoomProps {
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
  'border-collie': '🐕',
  meerkat: '🦫',
  panda: '🐼',
};

function LayeredAvatarRoom({
  animalType,
  width = 504,
  height = 504,
  items = {},
  onClick,
  className,
  animated = true,
}: LayeredAvatarRoomProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Fetch store items from database
  const { data: storeItems } = useQuery({
    queryKey: ['/api/store/catalog'],
    queryFn: () => apiRequest('GET', '/api/store/catalog'),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch item positions from database
  const { data: itemPositions } = useQuery({
    queryKey: ['/api/item-positions'],
    queryFn: () => apiRequest('GET', '/api/item-positions'),
    staleTime: 1000 * 60 * 5,
  });

  const handleClick = () => {
    onClick?.();
  };

  // Determine which image to use for the base animal
  const getAnimalImage = () => {
    const normalizedAnimal = animalType.toLowerCase().replace(' ', '-');
    
    // Use full-body images for rooms
    const animalFileName = normalizedAnimal === 'border-collie' ? 'border_collie' : normalizedAnimal;
    
    // Use the cloud assets utility which handles the cloud/local switching
    return getAssetUrl(`/animals/full-body/${animalFileName}.png`);
  };

  // Get position from database
  const getItemPosition = (itemId: string, animalType: string) => {
    if (!itemPositions) return null;
    
    const normalizedAnimal = animalType.toLowerCase().replace(/\s+/g, '-');
    const position = itemPositions.find(
      (pos: any) => {
        if (pos.item_id === itemId && pos.animal_type === normalizedAnimal) {
          return true;
        }
        if (pos.item_id === itemId && pos.animal_type === animalType.toLowerCase()) {
          return true;
        }
        return false;
      }
    );
    
    if (position) {
      return {
        x: position.position_x || 50,
        y: position.position_y || 50,
        scale: (position.scale || 50) / 100,
        rotation: position.rotation || 0
      };
    }
    
    return null;
  };

  // Build layers array
  const layers: AvatarLayer[] = [
    // Base animal layer - full body
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
    
    // Determine the image path
    let imagePath: string;
    if (storeItem?.imageUrl) {
      imagePath = storeItem.imageUrl;
      // If it's a relative URL, make it absolute
      if (!imagePath.startsWith('http') && !imagePath.startsWith('/')) {
        imagePath = '/' + imagePath;
      }
      // If it's a backend URL without domain, add the API URL
      if (imagePath.startsWith('/uploads/')) {
        imagePath = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${imagePath}`;
      }
    } else {
      // Fallback
      imagePath = `/uploads/store-items/${itemId}.png`;
      if (!imagePath.startsWith('http')) {
        imagePath = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${imagePath}`;
      }
    }
    
    // Determine z-index based on slot
    const zIndex = slot === 'hat' ? 10 : slot === 'glasses' ? 8 : 7;
    
    if (dbPosition) {
      layers.push({
        id: `${slot}-${itemId}`,
        src: imagePath,
        emoji: '🎩',
        zIndex: zIndex,
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
        src: imagePath,
        emoji: '🎩',
        zIndex: zIndex,
        position: { 
          top: '50%', 
          left: '50%' 
        },
        scale: 0.5,
        rotation: 0,
      });
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
        
        const style: CSSProperties = {
          position: 'absolute',
          zIndex: layer.zIndex,
          ...layer.position,
          transform: `
            translate(-50%, -50%) 
            scale(${isBaseLayer ? 1 : (layer.scale || 1)}) 
            rotate(${layer.rotation || 0}deg)
          `,
          transformOrigin: 'center',
          transition: animated ? 'all 0.3s ease' : undefined,
          // Base layer should fill the container for full body
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

export default React.memo(LayeredAvatarRoom);

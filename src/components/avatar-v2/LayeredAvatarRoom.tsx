import React, { useState, CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { ANIMAL_CONFIGS } from '@/config/animal-sizing';
import { getAssetUrl } from '@/utils/cloud-assets';
import { useStoreItems, useItemPositions } from '@/contexts/StoreDataContext';
import { getAnimalScale, getItemScale, parsePositionData, AVATAR_RENDER_CONFIG } from '@/utils/avatar-render';

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
  storeCatalog?: any[]; // Optional prop to pass store catalog directly
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
  width,
  height,
  items = {},
  onClick,
  className,
  animated = true,
  storeCatalog, // Optional prop to use instead of context
}: LayeredAvatarRoomProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 300, height: 300 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Get store data from context OR use provided catalog
  const contextStoreItems = useStoreItems();
  const storeItems = storeCatalog || contextStoreItems;
  const itemPositions = useItemPositions();

  // Measure container size
  React.useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleClick = () => {
    onClick?.();
  };

  // Determine which image to use for the base animal
  const getAnimalImage = () => {
    const normalizedAnimal = animalType.toLowerCase().replace(' ', '-');
    
    // Use full-body images for rooms with _full suffix
    const animalFileName = normalizedAnimal === 'border-collie' ? 'border_collie' : normalizedAnimal;
    
    // Use the cloud assets utility which handles the cloud/local switching
    return getAssetUrl(`/images/${animalFileName}_full.png`);
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
      return parsePositionData(position);
    }
    
    return null;
  };

  // Calculate size ratio for scale-aware positioning
  // Use provided width or fall back to measured size
  const effectiveWidth = width || containerSize.width || 300;
  const sizeRatio = effectiveWidth / AVATAR_RENDER_CONFIG.standardContainerSize;

  // Build layers array
  const layers: AvatarLayer[] = [
    // Base animal layer - using unified scale
    {
      id: 'base',
      src: getAnimalImage(),
      emoji: animalEmojis[animalType.toLowerCase()] || '🐾',
      zIndex: 1,
      position: AVATAR_RENDER_CONFIG.baseAnimalPosition,
      scale: getAnimalScale(animalType), // No container size needed anymore
    },
  ];

  // Add equipped items as layers with database positions
  Object.entries(items).forEach(([slot, itemId]) => {
    if (!itemId) return;
    
    const dbPosition = getItemPosition(itemId, animalType);
    const storeItem = storeItems?.find((item: any) => item.id === itemId);
    
    // Simple: Just use the imageUrl from the store item
    const imagePath = storeItem?.imageUrl;
    if (!imagePath) {
      return; // Skip if no image
    }
    
    // Determine z-index based on slot
    const zIndex = slot === 'hat' ? 10 : slot === 'glasses' ? 8 : 7;
    
    // Use database position if available, otherwise use default positions
    const position = dbPosition ? {
      top: `${dbPosition.y}%`,
      left: `${dbPosition.x}%`
    } : {
      // Default positions for each slot type
      top: slot === 'hat' ? '20%' : slot === 'glasses' ? '35%' : '50%',
      left: '50%'
    };
    
    const scale = dbPosition 
      ? getItemScale(dbPosition.scale * 100, animalType, effectiveWidth)
      : (slot === 'hat' ? 0.8 : 0.6) * sizeRatio; // Default scales
    
    layers.push({
      id: `${slot}-${itemId}`,
      src: imagePath,
      emoji: '🎩',
      zIndex: zIndex,
      position,
      scale,
      rotation: dbPosition?.rotation || 0,
    });
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative cursor-pointer transition-all duration-300 w-full h-full',
        isHovered && 'scale-105',
        className
      )}
      style={{ overflow: 'visible' }}
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
            scale(${layer.scale || 1}) 
            rotate(${layer.rotation || 0}deg)
          `,
          transformOrigin: 'center',
          transition: animated ? 'all 0.3s ease' : undefined,
          // Base layer should be contained
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
                // Image failed to load
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

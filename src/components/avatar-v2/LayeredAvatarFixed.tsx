import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { getAssetUrl } from '@/utils/cloud-assets';
import { useStoreItems, useItemPositions } from '@/contexts/StoreDataContext';
import { 
  getAnimalScale, 
  getItemScale, 
  parsePositionData, 
  AVATAR_RENDER_CONFIG,
  getContainedImageBounds 
} from '@/utils/avatar-render';

interface LayeredAvatarFixedProps {
  animalType: string;
  width: number;
  height: number;
  items?: {
    hat?: string;
    glasses?: string;
    accessory?: string;
  };
  onClick?: () => void;
  className?: string;
  animated?: boolean;
  storeCatalog?: any[];
  itemPosition?: { // For positioning tool
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
  selectedItem?: string; // For positioning tool
  selectedItemImageUrl?: string; // For positioning tool
}

// Emoji fallbacks
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

function LayeredAvatarFixed({
  animalType,
  width,
  height,
  items = {},
  onClick,
  className,
  animated = true,
  storeCatalog,
  itemPosition,
  selectedItem,
  selectedItemImageUrl,
}: LayeredAvatarFixedProps) {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width, height });

  // Get store data from context OR use provided catalog
  const contextStoreItems = useStoreItems();
  const storeItems = storeCatalog || contextStoreItems;
  const itemPositions = useItemPositions();

  // Update container size when props change
  useEffect(() => {
    setContainerSize({ width, height });
  }, [width, height]);

  const handleClick = () => {
    onClick?.();
  };

  // Get the base animal image
  const getAnimalImage = () => {
    const normalizedAnimal = animalType.toLowerCase().replace(' ', '-');
    const animalFileName = normalizedAnimal === 'border-collie' ? 'border_collie' : normalizedAnimal;
    
    // Check if we're in positioning mode
    if (itemPosition !== undefined) {
      return getAssetUrl(`/images/${animalFileName}_full.png`);
    }
    
    // Room view uses full images
    return getAssetUrl(`/images/${animalFileName}_full.png`);
  };

  // Get position from database
  const getItemPositionFromDB = (itemId: string, animalType: string) => {
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

  // Calculate actual image bounds for object-contain
  const imageBounds = getContainedImageBounds(containerSize.width, containerSize.height);

  // Render an item with proper positioning
  const renderItem = (
    itemId: string, 
    slot: string, 
    position: { x: number; y: number; scale: number; rotation: number } | null,
    imageUrl?: string
  ) => {
    if (!position) {
      // Default positions if no DB position
      const defaults = {
        hat: { x: 50, y: 20, scale: 0.5, rotation: 0 },
        glasses: { x: 50, y: 35, scale: 0.4, rotation: 0 },
        accessory: { x: 50, y: 50, scale: 0.4, rotation: 0 },
      };
      position = defaults[slot as keyof typeof defaults] || defaults.accessory;
    }

    // Calculate absolute position within the actual image bounds
    const itemX = imageBounds.offsetX + (position.x / 100) * imageBounds.width;
    const itemY = imageBounds.offsetY + (position.y / 100) * imageBounds.height;
    
    // Scale item based on actual image size, not container
    const itemScale = getItemScale(position.scale * 100, animalType, imageBounds.width);

    const style: CSSProperties = {
      position: 'absolute',
      left: `${itemX}px`,
      top: `${itemY}px`,
      transform: `translate(-50%, -50%) scale(${itemScale}) rotate(${position.rotation || 0}deg)`,
      transformOrigin: 'center',
      zIndex: slot === 'hat' ? 10 : slot === 'glasses' ? 8 : 7,
      transition: animated ? 'all 0.3s ease' : undefined,
    };

    return (
      <img
        key={`${slot}-${itemId}`}
        src={imageUrl}
        alt=""
        style={style}
        draggable={false}
      />
    );
  };

  return (
    <div
      ref={containerRef}
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
      {/* Base animal layer */}
      <img
        src={getAnimalImage()}
        alt=""
        className="absolute inset-0 w-full h-full object-contain"
        style={{
          zIndex: 1,
        }}
        draggable={false}
      />

      {/* Items for positioning tool */}
      {itemPosition && selectedItem && selectedItemImageUrl && (
        renderItem(selectedItem, 'hat', itemPosition, selectedItemImageUrl)
      )}

      {/* Items for regular view */}
      {!itemPosition && Object.entries(items).map(([slot, itemId]) => {
        if (!itemId) return null;
        
        const dbPosition = getItemPositionFromDB(itemId, animalType);
        const storeItem = storeItems?.find((item: any) => item.id === itemId);
        const imagePath = storeItem?.imageUrl;
        
        if (!imagePath) return null;
        
        return renderItem(itemId, slot, dbPosition, imagePath);
      })}
    </div>
  );
}

export default React.memo(LayeredAvatarFixed);
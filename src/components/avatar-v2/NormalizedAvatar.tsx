import React, { useRef, useEffect, useState, CSSProperties, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getAssetUrl } from '@/utils/cloud-assets';
import { useStoreItems, useItemPositions } from '@/contexts/StoreDataContext';
import AvatarItemRenderer from './AvatarItemRenderer';
import { 
  NormalizedPosition,
  ImageBounds,
  getImageElementBounds,
  normalizedToPixels,
  calculateItemSize,
  getItemTransform,
  getTransformOrigin,
  DEFAULT_ANCHORS
} from '@/utils/normalized-positioning';
import { ServerAvatar } from '../avatar/ServerAvatar';
import { useRoomStore } from '@/stores/roomStore';

interface NormalizedAvatarProps {
  animalType: string;
  width: number;
  height: number;
  items?: {
    hat?: string;
    glasses?: string;
    accessory?: string;
  };
  // For positioning tool
  selectedItem?: string;
  selectedItemImageUrl?: string;
  itemPosition?: Partial<NormalizedPosition>;
  onItemDrag?: (position: { x: number; y: number }) => void;
  
  onClick?: () => void;
  className?: string;
  animated?: boolean;
  storeCatalog?: any[];
  
  // Custom colors
  primaryColor?: string;
  secondaryColor?: string;
}

export default function NormalizedAvatar({
  animalType,
  width,
  height,
  items = {},
  selectedItem,
  selectedItemImageUrl,
  itemPosition,
  onItemDrag,
  onClick,
  className,
  animated = true,
  storeCatalog,
  primaryColor,
  secondaryColor,
}: NormalizedAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const avatarImgRef = useRef<HTMLImageElement>(null);
  const [imageBounds, setImageBounds] = useState<ImageBounds | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Debug component lifecycle and position changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('NormalizedAvatar mounted/updated:', {
      timestamp: new Date().toISOString(),
      animalType,
      items,
      width,
      height,
      isPositioningTool: !!onItemDrag,
      itemPosition: itemPosition // Add this to see position changes
    });
    }
    
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('NormalizedAvatar unmounting at:', new Date().toISOString());
      }
    };
  }, [animalType, items, width, height, onItemDrag]);
  
  // Get store data
  const contextStoreItems = useStoreItems();
  const storeItems = Array.isArray(storeCatalog) ? storeCatalog : 
                     Array.isArray(contextStoreItems) ? contextStoreItems : [];
  const itemPositions = useItemPositions();
  
  // Track when positions data changes
  useEffect(() => {
    if (itemPositions) {
      if (process.env.NODE_ENV === 'development') {
        console.log('itemPositions updated:', {
        timestamp: new Date().toISOString(),
        count: itemPositions.length,
        hatPositions: itemPositions ? itemPositions.filter((p: any) => p.item_id === 'b0d64da3-d5f1-41d5-8fb8-25b48c6cf2e4') : []
      });
      }
    }
  }, [itemPositions]);
  
  // Create optimized lookup maps for O(1) access
  const positionsMap = useMemo(() => {
    if (!itemPositions) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No itemPositions available yet at:', new Date().toISOString());
      }
      return {};
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('Building positionsMap from itemPositions:', {
      timestamp: new Date().toISOString(),
      count: itemPositions.length,
      hatCount: itemPositions ? itemPositions.filter((p: any) => p.item_id === 'b0d64da3-d5f1-41d5-8fb8-25b48c6cf2e4').length : 0,
      firstFew: itemPositions ? itemPositions.slice(0, 3) : []
    });
    }
    const map: Record<string, any> = {};
    if (itemPositions && Array.isArray(itemPositions)) {
      itemPositions.forEach((pos: any) => {
        const key = `${pos.item_id}-${pos.animal_type}`;
        map[key] = pos;
      });
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('Built positionsMap:', {
      timestamp: new Date().toISOString(),
      totalKeys: Object.keys(map).length,
      hatKeys: Object.keys(map).filter(k => k.includes('b0d64da3-d5f1-41d5-8fb8-25b48c6cf2e4'))
    });
    }
    return map;
  }, [itemPositions]);
  
  const storeItemsMap = useMemo(() => {
    if (!storeItems || !Array.isArray(storeItems)) return {};
    const map: Record<string, any> = {};
    storeItems.forEach((item: any) => {
      if (item && item.id) {
        map[item.id] = item;
      }
    });
    return map;
  }, [storeItems]);
  
  // Update image bounds when avatar loads or container resizes
  useEffect(() => {
    if (!containerRef.current || !avatarImgRef.current) return;
    
    let mounted = true;
    const updateBounds = async () => {
      if (!mounted) return;
      
      const bounds = await getImageElementBounds(
        avatarImgRef.current!,
        containerRef.current!
      );
      
      if (!mounted) return;
      
      // Debug logging only in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Image bounds calculated:', {
          component: onItemDrag ? 'Positioning Tool' : 'Room View',
          containerSize: { width, height },
          imageBounds: bounds,
          animalType,
          timestamp: new Date().toISOString()
        });
      }
      
      setImageBounds(bounds);
    };
    
    updateBounds();
    
    // Use ResizeObserver for responsive updates
    const resizeObserver = new ResizeObserver(() => {
      if (mounted) updateBounds();
    });
    resizeObserver.observe(containerRef.current);
    
    return () => {
      mounted = false;
      resizeObserver.disconnect();
    };
  }, [animalType, width, height, onItemDrag]);
  
  // Get avatar image path
  // Check if we should use SVG avatar (when colors are customized)
  const avatarColors = useRoomStore((state) => state.avatar?.colors);
  
  // Use props if provided, otherwise fall back to store
  const effectivePrimaryColor = primaryColor || avatarColors?.primaryColor;
  const effectiveSecondaryColor = secondaryColor || avatarColors?.secondaryColor;
  const hasCustomColors = (effectivePrimaryColor && effectiveSecondaryColor) || 
                         (avatarColors?.hasCustomized && avatarColors?.primaryColor && avatarColors?.secondaryColor);
  
  // If we have custom colors, use ServerAvatar instead
  if (hasCustomColors) {
    return (
      <ServerAvatar
        animalType={animalType}
        primaryColor={effectivePrimaryColor}
        secondaryColor={effectiveSecondaryColor}
        width={width}
        height={height}
        equippedItems={Object.values(items).filter(Boolean) as string[]}
        className={className}
        onClick={onClick}
        animated={animated}
      />
    );
  }
  
  const getAvatarImage = () => {
    const normalizedAnimal = animalType.toLowerCase().replace(' ', '-');
    const animalFileName = normalizedAnimal === 'border-collie' ? 'collie' : normalizedAnimal;
    return getAssetUrl(`/avatars/animals/${animalFileName}.png`);
  };
  
  // Get item position from database
  const getItemPositionFromDB = (itemId: string): NormalizedPosition | null => {
    if (!positionsMap) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('No positionsMap available');
      }
      return null;
    }
    
    const normalizedAnimal = animalType.toLowerCase().replace(/\s+/g, '-');
    const lookupKey = `${itemId}-${normalizedAnimal}`;
    
    // Debug: Log all available keys
    if (process.env.NODE_ENV === 'development') {
      console.log('Looking for position:', {
      itemId,
      animalType,
      normalizedAnimal,
      lookupKey,
      availableKeys: Object.keys(positionsMap).filter(k => k.includes(itemId))
    });
    }
    
    // Try with normalized animal name first
    let dbPosition = positionsMap[lookupKey];
    
    // Fallback to lowercase without normalization
    if (!dbPosition) {
      const fallbackKey = `${itemId}-${animalType.toLowerCase()}`;
      dbPosition = positionsMap[fallbackKey];
      if (dbPosition && process.env.NODE_ENV === 'development') {
        console.log('Found with fallback key:', fallbackKey);
      }
    }
    
    if (!dbPosition) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No position found for:', itemId, animalType);
      }
      return null;
    }
    
    // Log raw values before parsing
    if (process.env.NODE_ENV === 'development') {
      console.log('Raw DB position values:', {
      position_x: dbPosition.position_x,
      position_y: dbPosition.position_y,
      scale: dbPosition.scale,
      rotation: dbPosition.rotation,
      anchor_x: dbPosition.anchor_x,
      anchor_y: dbPosition.anchor_y,
      types: {
        x: typeof dbPosition.position_x,
        y: typeof dbPosition.position_y,
        scale: typeof dbPosition.scale
      }
    });
    }
    
    const position = {
      x: parseFloat(dbPosition.position_x) || 0.5,
      y: parseFloat(dbPosition.position_y) || 0.5,
      scale: parseFloat(dbPosition.scale) || 0.5,
      rotation: parseFloat(dbPosition.rotation) || 0,
      anchorX: parseFloat(dbPosition.anchor_x) || 0.5,
      anchorY: parseFloat(dbPosition.anchor_y) || 0.5,
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Parsed position:', position);
    }
    
    return position;
  };
  
  // Handle drag for positioning tool
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onItemDrag || !imageBounds) return;
    
    e.preventDefault();
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect();
      const mouseX = moveEvent.clientX - rect.left;
      const mouseY = moveEvent.clientY - rect.top;
      
      // For dragging, we want the mouse position to be the anchor point position
      // Convert mouse position to normalized coordinates within the image bounds
      const normalizedX = Math.max(0, Math.min(1, 
        (mouseX - imageBounds.left) / imageBounds.width
      ));
      const normalizedY = Math.max(0, Math.min(1,
        (mouseY - imageBounds.top) / imageBounds.height
      ));
      
      onItemDrag({ x: normalizedX, y: normalizedY });
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Render an item
  const renderItem = (
    itemId: string,
    slot: string,
    position: NormalizedPosition,
    imageUrl: string,
    riveUrl?: string,
    assetType: 'image' | 'rive' = 'image'
  ) => {
    try {
      if (!imageBounds) return null;
      
      if (process.env.NODE_ENV === 'development' && slot === 'positioning') {
        console.log('RENDER ITEM CALLED:', {
          itemId,
          slot,
          assetType,
          hasImageUrl: !!imageUrl,
          hasRiveUrl: !!riveUrl,
          imageBounds: !!imageBounds
        });
      }
    
    // Calculate where we want the anchor point to be (in pixels)
    const anchorPointPixels = normalizedToPixels(position.x, position.y, imageBounds);
    
    // For both Rive and images, we'll use CSS scale transform
    // This ensures consistent positioning behavior
    const baseSize = Math.max(imageBounds.width, imageBounds.height) * 0.3;
    const itemSize = { width: baseSize, height: baseSize };
    const actualScale = position.scale;
    
    // Calculate top-left position
    // Always use base size for position calculation, scale is handled by transform
    const topLeftX = anchorPointPixels.x - (itemSize.width * position.anchorX);
    const topLeftY = anchorPointPixels.y - (itemSize.height * position.anchorY);
    
    // Debug logging for positioning tool scale changes
    if (onItemDrag && process.env.NODE_ENV === 'development') {
      console.log('POSITIONING TOOL - Item positioning:', {
        itemId,
        scale: position.scale,
        itemSize,
        actualScale,
        anchorPoint: { x: position.anchorX, y: position.anchorY },
        anchorPixels: anchorPointPixels,
        topLeft: { x: topLeftX, y: topLeftY },
        imageBounds,
        transformOrigin: getTransformOrigin(position.anchorX, position.anchorY)
      });
    }
    
    // Debug logging for room display
    if (!onItemDrag && process.env.NODE_ENV === 'development' && slot === 'hat') {
      console.log('Rendering HAT item:', {
        timestamp: new Date().toISOString(),
        item: itemId,
        slot,
        imageBounds,
        normalizedPos: position,
        anchorPixels: anchorPointPixels,
        itemSize,
        containerSize: { width, height }
      });
    }
    
    const style: CSSProperties = {
      position: 'absolute',
      left: `${topLeftX}px`,
      top: `${topLeftY}px`,
      width: `${itemSize.width}px`,
      height: `${itemSize.height}px`,
      // Always use CSS transform for consistent behavior
      transform: `scale(${actualScale}) rotate(${position.rotation}deg)`,
      transformOrigin: getTransformOrigin(position.anchorX, position.anchorY),
      zIndex: slot === 'hat' ? 10 : slot === 'glasses' ? 8 : 7,
      transition: animated ? 'all 0.3s ease' : undefined,
      cursor: onItemDrag ? 'move' : (assetType === 'rive' ? 'pointer' : 'default'),
      pointerEvents: assetType === 'rive' && !onItemDrag ? 'auto' : undefined,
    };
    
      return (
        <AvatarItemRenderer
          key={itemId} // itemId already includes position key from caller
          itemId={itemId}
          imageUrl={imageUrl}
          riveUrl={riveUrl}
          assetType={assetType}
          style={style}
          onMouseDown={onItemDrag ? handleMouseDown : undefined}
          animated={animated}
        />
      );
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error rendering item:', {
          itemId,
          slot,
          error,
          position,
          imageBounds
        });
      }
      return null;
    }
  };
  
  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-visible',
        isHovered && 'scale-105',
        'transition-all duration-300',
        className
      )}
      style={{ width, height }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Base avatar */}
      <img
        ref={avatarImgRef}
        src={getAvatarImage()}
        alt={animalType}
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
      />
      
      {/* Items for positioning tool */}
      {selectedItem && selectedItemImageUrl && itemPosition && imageBounds && (() => {
        // For positioning tool, check if this is a Rive item
        const storeItem = storeCatalog?.find((item: any) => item.id === selectedItem);
        const assetType = storeItem?.assetType || 'image';
        const riveUrl = storeItem?.riveUrl;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('POSITIONER ITEM CHECK:', {
            selectedItem,
            storeItem,
            assetType,
            hasRiveUrl: !!riveUrl,
            riveUrl,
            imageUrl: selectedItemImageUrl
          });
        }
        
        return renderItem(
          selectedItem,
          'positioning',
          {
            x: itemPosition.x ?? 0.5,
            y: itemPosition.y ?? 0.5,
            scale: itemPosition.scale ?? 0.5,
            rotation: itemPosition.rotation ?? 0,
            anchorX: itemPosition.anchorX ?? DEFAULT_ANCHORS.hat.x,
            anchorY: itemPosition.anchorY ?? DEFAULT_ANCHORS.hat.y,
          },
          selectedItemImageUrl,
          riveUrl,
          assetType as 'image' | 'rive'
        );
      })()}
      
      {/* Items for regular display - key includes positionsMap length to force re-render when positions load */}
      {!selectedItem && imageBounds && items && Object.entries(items).map(([slot, itemId]) => {
        if (!itemId) return null;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Rendering item slot:', {
          slot,
          itemId,
          hasImageBounds: !!imageBounds,
          positionsMapSize: Object.keys(positionsMap).length,
          timestamp: new Date().toISOString()
        });
        }
        
        // Get store item and its asset URLs
        const storeItem = storeItemsMap[itemId];
        if (!storeItem) {
          if (process.env.NODE_ENV === 'development') {
            console.log('No store item found for:', itemId);
          }
          return null;
        }
        
        // Debug log the store item data
        if (process.env.NODE_ENV === 'development') {
          console.log('🎨 ROOM DISPLAY - Store Item Data:', {
            id: storeItem.id,
            name: storeItem.name,
            assetType: storeItem.assetType,
            imageUrl: storeItem.imageUrl,
            riveUrl: storeItem.riveUrl,
            hasAssetType: 'assetType' in storeItem,
            hasRiveUrl: 'riveUrl' in storeItem,
            fullItem: storeItem
          });
        }
        
        // Determine asset type and URLs
        const assetType = storeItem.assetType || 'image';
        const imageUrl = storeItem.imageUrl;
        const riveUrl = storeItem.riveUrl;
        
        // Must have at least one valid URL
        if (!imageUrl && !riveUrl) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('No valid asset URL for item:', itemId);
          }
          return null;
        }
        
        // Get position from database or use defaults
        let position = getItemPositionFromDB(itemId);
        if (!position) {
          console.warn('Using DEFAULT position for item:', {
            itemId,
            slot,
            reason: 'No position found in database',
            timestamp: new Date().toISOString()
          });
          // Use defaults based on slot type
          const defaultAnchors = DEFAULT_ANCHORS[slot as keyof typeof DEFAULT_ANCHORS] || DEFAULT_ANCHORS.accessory;
          position = {
            x: 0.5,
            y: slot === 'hat' ? 0.2 : slot === 'glasses' ? 0.35 : 0.5,
            scale: 0.3,
            rotation: 0,
            anchorX: defaultAnchors.x,
            anchorY: defaultAnchors.y,
          };
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('Using SAVED position for item:', {
            itemId,
            slot,
            position,
            positionsMapSize: Object.keys(positionsMap).length,
            timestamp: new Date().toISOString()
          });
          }
        }
        
        // Use a key that includes position data to force re-render when position changes
        const positionKey = position ? `${position.x}-${position.y}-${position.scale}` : 'default';
        return renderItem(
          `${itemId}-${positionKey}`, 
          slot, 
          position, 
          imageUrl || '', 
          riveUrl,
          assetType as 'image' | 'rive'
        );
      })}
    </div>
  );
}
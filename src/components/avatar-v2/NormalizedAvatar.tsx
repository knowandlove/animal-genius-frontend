import React, { useRef, useEffect, useState, CSSProperties, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getAssetUrl } from '@/utils/cloud-assets';
import { useStoreItems, useItemPositions } from '@/contexts/StoreDataContext';
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
      isPositioningTool: !!onItemDrag
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
  const storeItems = storeCatalog || contextStoreItems;
  const itemPositions = useItemPositions();
  
  // Track when positions data changes
  useEffect(() => {
    if (itemPositions) {
      if (process.env.NODE_ENV === 'development') {
        console.log('itemPositions updated:', {
        timestamp: new Date().toISOString(),
        count: itemPositions.length,
        hatPositions: itemPositions.filter((p: any) => p.item_id === 'b0d64da3-d5f1-41d5-8fb8-25b48c6cf2e4')
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
      hatCount: itemPositions.filter((p: any) => p.item_id === 'b0d64da3-d5f1-41d5-8fb8-25b48c6cf2e4').length,
      firstFew: itemPositions.slice(0, 3)
    });
    }
    const map: Record<string, any> = {};
    itemPositions.forEach((pos: any) => {
      const key = `${pos.item_id}-${pos.animal_type}`;
      map[key] = pos;
    });
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
    if (!storeItems) return {};
    const map: Record<string, any> = {};
    storeItems.forEach((item: any) => {
      map[item.id] = item;
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
  const getAvatarImage = () => {
    const normalizedAnimal = animalType.toLowerCase().replace(' ', '-');
    const animalFileName = normalizedAnimal === 'border-collie' ? 'border_collie' : normalizedAnimal;
    return getAssetUrl(`/images/${animalFileName}_full.png`);
  };
  
  // Get item position from database
  const getItemPositionFromDB = (itemId: string): NormalizedPosition | null => {
    if (!positionsMap) {
      console.warn('No positionsMap available');
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
    const startX = e.clientX;
    const startY = e.clientY;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect();
      const relativeX = moveEvent.clientX - rect.left;
      const relativeY = moveEvent.clientY - rect.top;
      
      // Convert to normalized coordinates
      const normalizedX = Math.max(0, Math.min(1, 
        (relativeX - imageBounds.left) / imageBounds.width
      ));
      const normalizedY = Math.max(0, Math.min(1,
        (relativeY - imageBounds.top) / imageBounds.height
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
    imageUrl: string
  ) => {
    if (!imageBounds) return null;
    
    // Convert normalized position to pixels
    const pixelPos = normalizedToPixels(position.x, position.y, imageBounds);
    const itemSize = calculateItemSize(position.scale, imageBounds);
    
    // Debug logging for room display
    if (!onItemDrag && process.env.NODE_ENV === 'development' && slot === 'hat') {
      console.log('Rendering HAT item:', {
        timestamp: new Date().toISOString(),
        item: itemId,
        slot,
        imageBounds,
        normalizedPos: position,
        pixelPos,
        itemSize,
        containerSize: { width, height }
      });
    }
    
    const style: CSSProperties = {
      position: 'absolute',
      left: `${pixelPos.x}px`,
      top: `${pixelPos.y}px`,
      width: `${itemSize.width}px`,
      height: 'auto',
      transform: getItemTransform(position),
      transformOrigin: getTransformOrigin(position.anchorX, position.anchorY),
      zIndex: slot === 'hat' ? 10 : slot === 'glasses' ? 8 : 7,
      transition: animated ? 'all 0.3s ease' : undefined,
      cursor: onItemDrag ? 'move' : 'default',
    };
    
    return (
      <img
        key={itemId} // itemId already includes position key from caller
        src={imageUrl}
        alt=""
        style={style}
        draggable={false}
        onMouseDown={onItemDrag ? handleMouseDown : undefined}
      />
    );
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
      {selectedItem && selectedItemImageUrl && itemPosition && imageBounds && (
        renderItem(
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
          selectedItemImageUrl
        )
      )}
      
      {/* Items for regular display - key includes positionsMap length to force re-render when positions load */}
      {!selectedItem && Object.entries(items).map(([slot, itemId]) => {
        if (!itemId || !imageBounds) return null;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Rendering item slot:', {
          slot,
          itemId,
          hasImageBounds: !!imageBounds,
          positionsMapSize: Object.keys(positionsMap).length,
          timestamp: new Date().toISOString()
        });
        }
        
        // Get store item and its image URL first
        const storeItem = storeItemsMap[itemId];
        if (!storeItem?.imageUrl) {
          if (process.env.NODE_ENV === 'development') {
            console.log('No store item found for:', itemId);
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
        return renderItem(`${itemId}-${positionKey}`, slot, position, storeItem.imageUrl);
      })}
    </div>
  );
}
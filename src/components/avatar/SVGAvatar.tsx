import React, { useEffect, useRef, useState, useContext } from 'react';
import DOMPurify from 'dompurify';
import { StoreDataContext } from '@/contexts/StoreDataContext';
import { getAssetUrl } from '@/utils/cloud-assets';
import { darkenColor, lightenColor } from '@/utils/color-utils';

interface SVGAvatarProps {
  animalType: string;
  primaryColor?: string;
  secondaryColor?: string;
  width: number;
  height: number;
  className?: string;
  items?: {
    hat?: string;
    glasses?: string;
    accessory?: string;
  };
  onClick?: () => void;
  animated?: boolean;
}

export const SVGAvatar: React.FC<SVGAvatarProps> = ({
  animalType,
  primaryColor = '#D4A574',
  secondaryColor = '#FFFDD0',
  width,
  height,
  className = '',
  items,
  onClick,
  animated
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyingColors, setIsApplyingColors] = useState(false);
  const [animationClass, setAnimationClass] = useState('animate-avatar-idle');
  const [hasRendered, setHasRendered] = useState(false);
  
  // Get store data for item positions and catalog
  const storeContext = useContext(StoreDataContext);
  const storeItems = storeContext?.storeItems || [];
  const itemPositions = storeContext?.itemPositions || [];

  useEffect(() => {
    const loadSVG = async () => {
      try {
        setIsLoading(true);
        // Handle animal type to file name mapping
        const fileName = animalType.toLowerCase().replace(/-/g, '_'); // Convert border-collie to border_collie
        const response = await fetch(`/avatars/animals/${fileName}.svg`);
        if (!response.ok) {
          throw new Error(`Failed to load SVG for ${animalType}`);
        }
        const text = await response.text();
        // Sanitize SVG content before using it
        const sanitized = DOMPurify.sanitize(text, {
          USE_PROFILES: { svg: true, svgFilters: true }
        });
        setSvgContent(sanitized);
      } catch (error) {
        console.error('Error loading SVG:', error);
        // Fallback to PNG if SVG fails
        setSvgContent('');
      } finally {
        setIsLoading(false);
      }
    };

    loadSVG();
  }, [animalType]);

  useEffect(() => {
    if (!svgContent || !containerRef.current) return;

    // Show loading state when colors change
    setIsApplyingColors(true);
    console.log('Applying colors:', { primaryColor, secondaryColor });

    // Parse the SVG and apply colors
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    
    if (!svg) return;

    // Set dimensions
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());
    
    // Calculate darker shade of primary color for shading
    const primaryDark = darkenColor(primaryColor, 0.3); // 30% darker
    
    // Calculate lighter shade of secondary color
    const secondaryLight = lightenColor(secondaryColor, 0.3); // 30% lighter
    
    // Calculate darker shade of secondary color
    const secondaryDark = darkenColor(secondaryColor, 0.3); // 30% darker
    
    // Apply colors to elements using ID suffix naming convention
    // Elements with IDs ending in suffixes get their colors changed
    const primaryIdElements = svg.querySelectorAll('[id$="_primary"]');
    const secondaryIdElements = svg.querySelectorAll('[id$="_secondary"]');
    const primaryDarkIdElements = svg.querySelectorAll('[id$="_primaryDark"], [id$="_primarydark"]');
    const secondaryLightIdElements = svg.querySelectorAll('[id$="_secondaryLight"], [id$="_secondarylight"]');
    const secondaryDarkIdElements = svg.querySelectorAll('[id$="_secondaryDark"], [id$="_secondarydark"]');
    
    console.log(`Found ${primaryIdElements.length} elements with _primary suffix`);
    console.log(`Found ${secondaryIdElements.length} elements with _secondary suffix`);
    console.log(`Found ${primaryDarkIdElements.length} elements with _primaryDark suffix`);
    console.log(`Found ${secondaryLightIdElements.length} elements with _secondaryLight suffix`);
    console.log(`Found ${secondaryDarkIdElements.length} elements with _secondaryDark suffix`);
    
    // Apply primary color
    primaryIdElements.forEach(element => {
      element.setAttribute('fill', primaryColor || '#9A8B7A');
      (element as HTMLElement).style.fill = primaryColor || '#9A8B7A';
    });
    
    // Apply secondary color
    secondaryIdElements.forEach(element => {
      element.setAttribute('fill', secondaryColor || '#F5DDD6');
      (element as HTMLElement).style.fill = secondaryColor || '#F5DDD6';
    });
    
    // Apply primary dark color
    primaryDarkIdElements.forEach(element => {
      element.setAttribute('fill', primaryDark);
      (element as HTMLElement).style.fill = primaryDark;
    });
    
    // Apply secondary light color
    secondaryLightIdElements.forEach(element => {
      element.setAttribute('fill', secondaryLight);
      (element as HTMLElement).style.fill = secondaryLight;
    });
    
    // Apply secondary dark color
    secondaryDarkIdElements.forEach(element => {
      element.setAttribute('fill', secondaryDark);
      (element as HTMLElement).style.fill = secondaryDark;
    });

    // Clear container safely
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    // Append the SVG element directly
    containerRef.current.appendChild(svg.cloneNode(true));
    
    // Add equipped items on top of the avatar
    if (items && containerRef.current) {
      const svgRect = containerRef.current.getBoundingClientRect();
      
      // Process each equipped item
      Object.entries(items).forEach(([slot, itemId]) => {
        if (!itemId) return;
        
        // Find the item in store catalog
        const storeItem = storeItems?.find((item: any) => item.id === itemId);
        if (!storeItem) return;
        
        // Find positioning data for this item and animal
        const positionData = itemPositions?.find((pos: any) => 
          pos.item_id === itemId && pos.animal_type === animalType.toLowerCase()
        );
        
        if (!positionData) {
          console.warn(`No position data for item ${itemId} on animal ${animalType}`);
          return;
        }
        
        // Create and position the item image
        const itemImg = document.createElement('img');
        itemImg.src = getAssetUrl(storeItem.imageUrl);
        itemImg.style.position = 'absolute';
        itemImg.style.pointerEvents = 'none';
        
        // Apply positioning from admin tool
        const xPos = (positionData.position_x || 50) * width / 100;
        const yPos = (positionData.position_y || 50) * height / 100;
        const scale = positionData.scale || 1;
        const rotation = positionData.rotation || 0;
        
        // Calculate item size based on scale
        const itemWidth = 80 * scale; // Base size of 80px
        const itemHeight = 80 * scale;
        
        itemImg.style.width = `${itemWidth}px`;
        itemImg.style.height = `${itemHeight}px`;
        itemImg.style.left = `${xPos - itemWidth/2}px`;
        itemImg.style.top = `${yPos - itemHeight/2}px`;
        itemImg.style.transform = `rotate(${rotation}deg)`;
        itemImg.style.zIndex = '10';
        
        containerRef.current?.appendChild(itemImg);
      });
    }
    
    // Hide loading state after colors are applied
    setTimeout(() => {
      setIsApplyingColors(false);
      setHasRendered(true);
    }, 50);
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [svgContent, primaryColor, secondaryColor, width, height, items, animalType, storeItems, itemPositions]);

  // Fallback to PNG if SVG loading fails
  if (!isLoading && !svgContent) {
    // Try border_collie.png first, fallback to collie.png for backward compatibility
    const fileName = animalType.toLowerCase().replace(/-/g, '_');
    const fallbackFileName = animalType.toLowerCase() === 'border-collie' ? 'collie' : fileName;
    return (
      <img
        src={`/avatars/animals/${fileName}.png`}
        alt={`${animalType} avatar`}
        width={width}
        height={height}
        className={className}
        onError={(e) => {
          // If border_collie.png doesn't exist, try collie.png
          e.currentTarget.src = `/avatars/animals/${fallbackFileName}.png`;
        }}
      />
    );
  }

  // Show loading state while loading OR applying colors OR not yet rendered
  if (isLoading || (isApplyingColors && hasRendered) || (!hasRendered && !svgContent)) {
    return (
      <div 
        className={`flex items-center justify-center bg-white/80 backdrop-blur rounded-2xl shadow-sm ${className}`}
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium text-sm">
            {isLoading || !svgContent ? 'Loading avatar...' : 'Applying colors...'}
          </p>
        </div>
      </div>
    );
  }

  // Handle mouse interactions for animations
  const handleMouseEnter = () => {
    if (animated) {
      setAnimationClass('animate-avatar-wave');
    }
  };

  const handleMouseLeave = () => {
    if (animated) {
      setAnimationClass('animate-avatar-idle');
    }
  };

  const handleClick = () => {
    if (animated) {
      setAnimationClass('animate-avatar-bounce');
      setTimeout(() => {
        setAnimationClass('animate-avatar-idle');
      }, 600);
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <>
      {/* Always show loading state overlay when applying colors */}
      {isApplyingColors && hasRendered && (
        <div 
          className={`flex items-center justify-center bg-white/80 backdrop-blur rounded-2xl shadow-sm ${className}`}
          style={{ width, height, position: 'absolute', zIndex: 10 }}
        >
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium text-sm">Applying colors...</p>
          </div>
        </div>
      )}
      <div 
        ref={containerRef}
        className={`relative ${animated ? animationClass : ''} ${className}`}
        style={{ 
          width, 
          height, 
          cursor: onClick ? 'pointer' : undefined, 
          position: 'relative',
          transformOrigin: 'bottom center',
          transition: 'transform 0.3s ease',
          // Ensure the container has a white background initially to prevent gray flash
          backgroundColor: 'transparent',
          opacity: isApplyingColors && hasRendered ? 0 : 1
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Show loading overlay if still processing but container is rendered */}
        {!svgContent && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur rounded-2xl shadow-sm">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 font-medium text-sm">Loading avatar...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
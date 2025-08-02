import React, { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';

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

// Helper function to darken a color
const darkenColor = (color: string, amount: number = 0.3): string => {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Darken by reducing each component
  const newR = Math.round(r * (1 - amount));
  const newG = Math.round(g * (1 - amount));
  const newB = Math.round(b * (1 - amount));
  
  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

// Helper function to lighten a color
const lightenColor = (color: string, amount: number = 0.3): string => {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Lighten by moving each component closer to 255
  const newR = Math.round(r + (255 - r) * amount);
  const newG = Math.round(g + (255 - g) * amount);
  const newB = Math.round(b + (255 - b) * amount);
  
  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

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
      element.setAttribute('fill', primaryColor);
      (element as HTMLElement).style.fill = primaryColor;
    });
    
    // Apply secondary color
    secondaryIdElements.forEach(element => {
      element.setAttribute('fill', secondaryColor);
      (element as HTMLElement).style.fill = secondaryColor;
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

    // Clear the container and append the modified SVG
    // Instead of using innerHTML, we'll use appendChild for safety
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(svg);
  }, [svgContent, primaryColor, secondaryColor, width, height]);

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

  if (isLoading) {
    return (
      <div 
        className={`bg-gray-200 animate-pulse rounded-lg ${className}`}
        style={{ width, height }}
      />
    );
  }

  return (
    <div 
      ref={containerRef}
      className={className}
      style={{ width, height, cursor: onClick ? 'pointer' : undefined }}
      onClick={onClick}
    />
  );
};
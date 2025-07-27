import React, { useEffect, useRef, useState } from 'react';

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
const darkenColor = (color: string, amount: number = 0.2): string => {
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
        const response = await fetch(`/avatars/animals/${animalType.toLowerCase()}.svg`);
        if (!response.ok) {
          throw new Error(`Failed to load SVG for ${animalType}`);
        }
        const text = await response.text();
        setSvgContent(text);
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
    
    // Apply primary color to all elements in primary-color group
    const primaryElements = svg.querySelectorAll('#primary-color path, #primary-color circle, #primary-color ellipse, #primary-color polygon');
    primaryElements.forEach(element => {
      element.setAttribute('fill', primaryColor);
    });

    // Calculate darker shade of primary color
    const primaryDark = darkenColor(primaryColor, 0.3); // 30% darker
    
    // For existing SVGs using class-based coloring, we need to map classes to color groups
    // Updated mapping based on meerkat SVG structure
    const classToColorMap: { [key: string]: 'primary' | 'secondary' | 'primary-dark' | 'fixed' } = {
      'cls-4': 'primary', // Main body color (beige)
      'cls-5': 'primary-dark', // Darker body parts (inner ears)
      'cls-1': 'primary', // Medium body color
      'cls-2': 'primary', // Tail base - now uses primary color
      'cls-3': 'secondary', // Belly/light areas
      'cls-6': 'fixed', // Dark fixed parts
      'cls-7': 'fixed', // White (eyes)
      'cls-8': 'primary-dark', // Tail end - now uses dark primary
      'cls-9': 'primary-dark', // Eye patches - now uses dark primary
      'cls-10': 'fixed', // Nose pink
      'cls-11': 'fixed', // Nose shadow
      'cls-12': 'fixed', // Black
    };

    // First, try to update the CSS styles in the SVG
    const styleElement = svg.querySelector('style');
    if (styleElement) {
      // Get the current style content
      let styleContent = styleElement.textContent || '';
      
      // Replace colors for each class
      Object.entries(classToColorMap).forEach(([className, colorType]) => {
        if (colorType === 'primary') {
          // Replace fill color for this class
          const regex = new RegExp(`\\.${className}\\s*{[^}]*fill:\\s*#[a-fA-F0-9]{6}`, 'g');
          styleContent = styleContent.replace(regex, (match) => {
            return match.replace(/#[a-fA-F0-9]{6}/, primaryColor);
          });
        } else if (colorType === 'secondary') {
          // Replace fill color for this class
          const regex = new RegExp(`\\.${className}\\s*{[^}]*fill:\\s*#[a-fA-F0-9]{6}`, 'g');
          styleContent = styleContent.replace(regex, (match) => {
            return match.replace(/#[a-fA-F0-9]{6}/, secondaryColor);
          });
        } else if (colorType === 'primary-dark') {
          // Replace fill color for this class with darker primary
          const regex = new RegExp(`\\.${className}\\s*{[^}]*fill:\\s*#[a-fA-F0-9]{6}`, 'g');
          styleContent = styleContent.replace(regex, (match) => {
            return match.replace(/#[a-fA-F0-9]{6}/, primaryDark);
          });
        }
      });
      
      styleElement.textContent = styleContent;
    }
    
    // Also apply colors directly to elements (fallback for inline styles)
    Object.entries(classToColorMap).forEach(([className, colorType]) => {
      const elements = svg.querySelectorAll(`.${className}`);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with class ${className} (${colorType})`);
      }
      elements.forEach(element => {
        if (colorType === 'primary') {
          element.setAttribute('fill', primaryColor);
          // Also set style attribute to override CSS
          element.style.fill = primaryColor;
        } else if (colorType === 'secondary') {
          element.setAttribute('fill', secondaryColor);
          // Also set style attribute to override CSS
          element.style.fill = secondaryColor;
        } else if (colorType === 'primary-dark') {
          element.setAttribute('fill', primaryDark);
          // Also set style attribute to override CSS
          element.style.fill = primaryDark;
        }
        // Fixed colors remain unchanged
      });
    });

    // Apply secondary color to all elements in secondary-color group
    const secondaryElements = svg.querySelectorAll('#secondary-color path, #secondary-color circle, #secondary-color ellipse, #secondary-color polygon');
    secondaryElements.forEach(element => {
      element.setAttribute('fill', secondaryColor);
    });

    // Clear the container and append the modified SVG
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(svg);
  }, [svgContent, primaryColor, secondaryColor, width, height]);

  // Fallback to PNG if SVG loading fails
  if (!isLoading && !svgContent) {
    return (
      <img
        src={`/avatars/animals/${animalType.toLowerCase()}.png`}
        alt={`${animalType} avatar`}
        width={width}
        height={height}
        className={className}
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
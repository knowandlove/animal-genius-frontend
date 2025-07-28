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
        // Handle border-collie -> collie file name mapping
        const fileName = animalType.toLowerCase() === 'border-collie' ? 'collie' : animalType.toLowerCase();
        const response = await fetch(`/avatars/animals/${fileName}.svg`);
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
    const primaryElements = svg.querySelectorAll('#primary-color path, #primary-color circle, #primary-color ellipse, #primary-color polygon, #primary-color rect');
    primaryElements.forEach(element => {
      element.setAttribute('fill', primaryColor);
      // Also set style to ensure it overrides any CSS
      (element as HTMLElement).style.fill = primaryColor;
    });

    // Apply secondary color to all elements in secondary-color group
    const secondaryElements = svg.querySelectorAll('#secondary-color path, #secondary-color circle, #secondary-color ellipse, #secondary-color polygon, #secondary-color rect');
    secondaryElements.forEach(element => {
      element.setAttribute('fill', secondaryColor);
      (element as HTMLElement).style.fill = secondaryColor;
    });

    // Calculate darker shade of primary color for shading
    const primaryDark = darkenColor(primaryColor, 0.3); // 30% darker
    
    // Apply primary-dark to any elements in primary-dark group (for animals that have explicit shading)
    const primaryDarkElements = svg.querySelectorAll('#primary-dark path, #primary-dark circle, #primary-dark ellipse, #primary-dark polygon, #primary-dark rect');
    primaryDarkElements.forEach(element => {
      element.setAttribute('fill', primaryDark);
      (element as HTMLElement).style.fill = primaryDark;
    });
    
    // For existing SVGs using class-based coloring, we need to map classes to color groups
    // Different animals may have different class mappings
    let classToColorMap: { [key: string]: 'primary' | 'secondary' | 'primary-dark' | 'fixed' } = {};
    
    // Animal-specific mappings
    if (animalType.toLowerCase() === 'beaver' || animalType.toLowerCase() === 'meerkat') {
      // Beaver and Meerkat now use ID suffix naming, so we don't need class-based coloring
      classToColorMap = {};
    } else {
      // Default mapping for animals still using class-based approach
      // We'll update this as more animals are converted to ID suffix naming
      classToColorMap = {
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
    }

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
        const svgElement = element as SVGElement;
        if (colorType === 'primary') {
          svgElement.setAttribute('fill', primaryColor);
          // Also set style attribute to override CSS
          svgElement.style.fill = primaryColor;
        } else if (colorType === 'secondary') {
          svgElement.setAttribute('fill', secondaryColor);
          // Also set style attribute to override CSS
          svgElement.style.fill = secondaryColor;
        } else if (colorType === 'primary-dark') {
          svgElement.setAttribute('fill', primaryDark);
          // Also set style attribute to override CSS
          svgElement.style.fill = primaryDark;
        }
        // Fixed colors remain unchanged
      });
    });

    // NEW: Apply colors to elements using ID suffix naming convention
    // This supports the new Illustrator workflow where elements have IDs with suffixes
    const primaryIdElements = svg.querySelectorAll('[id$="_primary"]');
    const secondaryIdElements = svg.querySelectorAll('[id$="_secondary"]');
    const primaryDarkIdElements = svg.querySelectorAll('[id$="_primaryDark"], [id$="_primarydark"]');
    
    console.log(`Found ${primaryIdElements.length} elements with _primary suffix`);
    console.log(`Found ${secondaryIdElements.length} elements with _secondary suffix`);
    console.log(`Found ${primaryDarkIdElements.length} elements with _primaryDark suffix`);
    
    primaryIdElements.forEach(element => {
      element.setAttribute('fill', primaryColor);
      (element as HTMLElement).style.fill = primaryColor;
    });
    
    secondaryIdElements.forEach(element => {
      element.setAttribute('fill', secondaryColor);
      (element as HTMLElement).style.fill = secondaryColor;
    });
    
    primaryDarkIdElements.forEach(element => {
      element.setAttribute('fill', primaryDark);
      (element as HTMLElement).style.fill = primaryDark;
    });

    // Clear the container and append the modified SVG
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(svg);
  }, [svgContent, primaryColor, secondaryColor, width, height]);

  // Fallback to PNG if SVG loading fails
  if (!isLoading && !svgContent) {
    const fileName = animalType.toLowerCase() === 'border-collie' ? 'collie' : animalType.toLowerCase();
    return (
      <img
        src={`/avatars/animals/${fileName}.png`}
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
import { useState, useEffect } from 'react';

interface ServerAvatarProps {
  animalType: string;
  primaryColor?: string;
  secondaryColor?: string;
  equippedItems?: string[];
  width: number;
  height: number;
  className?: string;
  animated?: boolean;
  onClick?: () => void;
}

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  // Remove # if present
  const color = hex.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // Darken each component
  const newR = Math.round(r * (1 - percent));
  const newG = Math.round(g * (1 - percent));
  const newB = Math.round(b * (1 - percent));
  
  // Convert back to hex
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Process SVG by targeting specific elements with IDs
 * Only elements with IDs containing 'primary' or 'secondary' should be colored
 */
function processSvgColors(svgContent: string, primaryColor: string, secondaryColor: string): string {
  console.log('Processing SVG with colors:', { primaryColor, secondaryColor });
  
  // Create darker versions of the colors for primaryDark and secondaryDark
  const primaryDark = darkenColor(primaryColor, 0.2);
  const secondaryDark = darkenColor(secondaryColor, 0.2);
  
  let replacementCount = 0;
  
  // Strategy: Find elements by ID and add inline style to override class
  // Match both self-closing and regular tags with id attributes
  svgContent = svgContent.replace(
    /<(path|circle|ellipse|rect|polygon|g)(\s+[^>]*?id="([^"]*?)"[^>]*?)(\/?>)/g,
    (match, tagName, attributes, id, closingTag) => {
      // Check if this element's ID indicates it should be colored
      const idLower = id.toLowerCase();
      let newFill: string | null = null;
      
      if (idLower.includes('_primary') && !idLower.includes('dark')) {
        newFill = primaryColor;
      } else if (idLower.includes('_primarydark')) {
        newFill = primaryDark;
      } else if (idLower.includes('_secondary') && !idLower.includes('dark')) {
        newFill = secondaryColor;
      } else if (idLower.includes('_secondarydark')) {
        newFill = secondaryDark;
      }
      
      if (newFill) {
        replacementCount++;
        console.log(`Adding style for #${id} with ${newFill}`);
        
        // Check if there's already a style attribute
        if (attributes.includes('style="')) {
          // Update existing style attribute
          const updatedAttributes = attributes.replace(
            /style="([^"]*)"/g,
            (styleMatch, styleContent) => {
              // Remove any existing fill from style
              const cleanedStyle = styleContent.replace(/fill:\s*[^;]+;?/g, '').trim();
              // Add new fill at the beginning
              const separator = cleanedStyle ? '; ' : '';
              return `style="fill: ${newFill}${separator}${cleanedStyle}"`;
            }
          );
          return `<${tagName}${updatedAttributes}${closingTag}`;
        } else {
          // Add style attribute before the closing bracket
          // Insert the style attribute right before the closing tag
          return `<${tagName}${attributes} style="fill: ${newFill}"${closingTag}`;
        }
      }
      
      return match; // Return unchanged if not a target element
    }
  );
  
  console.log(`Total elements with colors updated: ${replacementCount}`);
  
  return svgContent;
}

/**
 * ServerAvatar - Fetches SVG from Supabase and applies colors using the exact same
 * logic as the backend server used to do
 */
export function ServerAvatar({
  animalType,
  primaryColor = '#D4A574',
  secondaryColor = '#FFFDD0',
  equippedItems = [],
  width,
  height,
  className = '',
  animated = false,
  onClick
}: ServerAvatarProps) {
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Normalize animal type for file name
  const normalizedAnimalType = animalType
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
  
  // Supabase public URL for avatars
  const svgUrl = `https://zqyvfnbwpagguutzdvpy.supabase.co/storage/v1/object/public/public-assets/avatars/${normalizedAnimalType}.svg`;
  const fallbackUrl = `/avatars/animals/${normalizedAnimalType}.png`;
  
  useEffect(() => {
    const fetchAndProcessSvg = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // Fetch the SVG content
        const response = await fetch(svgUrl);
        if (!response.ok) throw new Error('Failed to fetch SVG');
        
        let svg = await response.text();
        
        // Process the SVG to replace colors only on specific elements
        // This is the exact same logic the backend used
        svg = processSvgColors(svg, primaryColor, secondaryColor);
        
        // Set dimensions
        svg = svg.replace(/<svg([^>]*)>/, (match, attrs) => {
          // Remove existing width/height
          const cleanedAttrs = attrs
            .replace(/width="[^"]*"/g, '')
            .replace(/height="[^"]*"/g, '');
          
          // Add our dimensions and ensure viewBox
          if (!cleanedAttrs.includes('viewBox')) {
            return `<svg${cleanedAttrs} width="${width}" height="${height}" viewBox="0 0 600 600">`;
          } else {
            return `<svg${cleanedAttrs} width="${width}" height="${height}">`;
          }
        });
        
        setSvgContent(svg);
      } catch (err) {
        console.error('Error loading avatar SVG from Supabase:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAndProcessSvg();
  }, [animalType, primaryColor, secondaryColor, svgUrl, width, height]);
  
  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-200 animate-pulse rounded-lg ${className}`}
        style={{ width, height }}
      />
    );
  }
  
  if (error) {
    // Fallback to PNG if available
    return (
      <img
        src={fallbackUrl}
        alt={`${animalType} avatar`}
        width={width}
        height={height}
        className={`object-contain ${className}`}
        onClick={onClick}
        onError={(e) => {
          // Last resort - show a colored circle with initial
          const target = e.currentTarget as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            const fallbackDiv = document.createElement('div');
            fallbackDiv.style.cssText = `
              width: ${width}px; 
              height: ${height}px; 
              background: ${primaryColor}; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              border: 3px solid ${secondaryColor};
              cursor: ${onClick ? 'pointer' : 'default'};
            `;
            fallbackDiv.innerHTML = `
              <span style="color: white; font-size: ${Math.min(width, height) / 3}px; font-weight: bold;">
                ${animalType.charAt(0).toUpperCase()}
              </span>
            `;
            if (onClick) {
              fallbackDiv.addEventListener('click', onClick);
            }
            parent.appendChild(fallbackDiv);
          }
        }}
      />
    );
  }
  
  return (
    <div 
      className={`${className} ${animated ? 'transition-transform hover:scale-105' : ''}`}
      style={{ width, height, cursor: onClick ? 'pointer' : undefined }}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

// Export a default as well for easier imports
export default ServerAvatar;
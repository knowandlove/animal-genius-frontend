/**
 * Avatar Thumbnail Generation System
 * Generates and caches small PNG thumbnails of customized avatars
 */

import { ANIMAL_COLOR_PALETTES, getDefaultColors } from '@/config/animal-color-palettes';

interface ThumbnailOptions {
  size?: number;
  quality?: number;
  includeBackground?: boolean;
}

interface AvatarColors {
  primaryColor: string;
  secondaryColor: string;
}

// Cache for generated thumbnails
const thumbnailCache = new Map<string, string>();

// Helper to create cache key
function getCacheKey(animalType: string, colors: AvatarColors, size: number): string {
  return `${animalType}-${colors.primaryColor}-${colors.secondaryColor}-${size}`;
}

/**
 * Generates a thumbnail of an avatar by rendering the SVG to a canvas
 * and extracting just the head portion
 */
export async function generateAvatarThumbnail(
  animalType: string,
  colors: AvatarColors,
  options: ThumbnailOptions = {}
): Promise<string> {
  const {
    size = 128,
    quality = 0.9,
    includeBackground = true
  } = options;

  // Check cache first
  const cacheKey = getCacheKey(animalType, colors, size);
  const cached = thumbnailCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Create offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    // Add background if requested
    if (includeBackground) {
      // Use a gradient background based on animal colors
      const gradient = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2
      );
      gradient.addColorStop(0, colors.primaryColor + '20');
      gradient.addColorStop(1, colors.primaryColor + '10');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }

    // Load the SVG
    const fileName = animalType.toLowerCase() === 'border-collie' ? 'collie' : animalType.toLowerCase();
    const svgUrl = `/avatars/animals/${fileName}.svg`;
    
    // Fetch and modify SVG colors
    const response = await fetch(svgUrl);
    const svgText = await response.text();
    
    // Apply colors to SVG
    const coloredSvg = applyColorsToSvg(svgText, colors, animalType);
    
    // Convert to blob URL
    const svgBlob = new Blob([coloredSvg], { type: 'image/svg+xml' });
    const svgBlobUrl = URL.createObjectURL(svgBlob);
    
    // Load as image
    const img = new Image();
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load SVG'));
      img.src = svgBlobUrl;
    });

    // Calculate positioning to show just the head
    // Most animals have their head in the top 30-40% of the image
    const sourceY = 0;
    const sourceHeight = img.height * 0.4;
    const aspectRatio = img.width / sourceHeight;
    
    // Center the head in the circle
    const drawWidth = size * aspectRatio;
    const drawX = (size - drawWidth) / 2;
    
    ctx.drawImage(
      img,
      0, sourceY, img.width, sourceHeight,  // Source rectangle (head area)
      drawX, 0, drawWidth, size              // Destination (full circle)
    );
    
    // Clean up
    URL.revokeObjectURL(svgBlobUrl);
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png', quality);
    
    // Cache the result
    thumbnailCache.set(cacheKey, dataUrl);
    
    // Limit cache size
    if (thumbnailCache.size > 100) {
      const firstKey = thumbnailCache.keys().next().value;
      if (firstKey !== undefined) {
        thumbnailCache.delete(firstKey);
      }
    }
    
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate avatar thumbnail:', error);
    
    // Return a fallback colored circle
    return generateFallbackThumbnail(animalType, colors, size);
  }
}

/**
 * Apply colors to SVG string using ID-based suffix approach
 */
function applyColorsToSvg(svgText: string, colors: AvatarColors, animalType: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  
  if (!svg) return svgText;
  
  // Calculate darker shade
  const primaryDark = darkenColor(colors.primaryColor, 0.3);
  
  // Apply colors to ID-based elements
  const primaryElements = svg.querySelectorAll('[id$="_primary"]');
  const secondaryElements = svg.querySelectorAll('[id$="_secondary"]');
  const primaryDarkElements = svg.querySelectorAll('[id$="_primaryDark"], [id$="_primarydark"]');
  
  primaryElements.forEach(el => {
    el.setAttribute('fill', colors.primaryColor);
  });
  
  secondaryElements.forEach(el => {
    el.setAttribute('fill', colors.secondaryColor);
  });
  
  primaryDarkElements.forEach(el => {
    el.setAttribute('fill', primaryDark);
  });
  
  // Update any CSS styles
  const styleElement = svg.querySelector('style');
  if (styleElement && styleElement.textContent) {
    let styleContent = styleElement.textContent;
    
    // Replace hex colors in styles
    styleContent = styleContent.replace(/#[a-fA-F0-9]{6}/g, (match) => {
      // This is a simple heuristic - in production you'd want more sophisticated color mapping
      return colors.primaryColor;
    });
    
    styleElement.textContent = styleContent;
  }
  
  return new XMLSerializer().serializeToString(doc);
}

/**
 * Generate a simple colored circle as fallback
 */
function generateFallbackThumbnail(animalType: string, colors: AvatarColors, size: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Draw circle with animal's primary color
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = colors.primaryColor;
  ctx.fill();
  
  // Add animal emoji in center
  const animalEmojis: Record<string, string> = {
    'meerkat': '🦫',
    'panda': '🐼',
    'owl': '🦉',
    'beaver': '🦝',
    'elephant': '🐘',
    'otter': '🦦',
    'parrot': '🦜',
    'border-collie': '🐕',
  };
  
  const emoji = animalEmojis[animalType.toLowerCase()] || '🐾';
  ctx.font = `${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText(emoji, size / 2, size / 2);
  
  return canvas.toDataURL('image/png');
}

/**
 * Helper to darken a color
 */
function darkenColor(color: string, amount: number = 0.3): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const newR = Math.round(r * (1 - amount));
  const newG = Math.round(g * (1 - amount));
  const newB = Math.round(b * (1 - amount));
  
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Clear thumbnail cache
 */
export function clearThumbnailCache(): void {
  thumbnailCache.clear();
}

/**
 * Preload thumbnails for a list of students
 */
export async function preloadThumbnails(
  students: Array<{
    animalType: string;
    avatarData?: { colors?: AvatarColors };
  }>,
  options?: ThumbnailOptions
): Promise<void> {
  const promises = students.map(student => {
    const colors = student.avatarData?.colors || getDefaultColors(student.animalType);
    return generateAvatarThumbnail(student.animalType, colors, options);
  });
  
  await Promise.all(promises);
}
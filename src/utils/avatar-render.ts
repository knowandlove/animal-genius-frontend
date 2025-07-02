import { ANIMAL_CONFIGS } from '@/config/animal-sizing';

/**
 * Unified avatar rendering configuration
 * All avatar components should use these exact values for consistency
 */
export const AVATAR_RENDER_CONFIG = {
  // Base animal should be 75% of container
  baseAnimalSize: 0.75,
  
  // How the base animal is positioned
  baseAnimalPosition: {
    top: '50%',
    left: '50%'
  },
  
  // Standard container size - ALL views should use this
  standardContainerSize: 600,
  
  // Assume square avatars for now
  avatarAspectRatio: 1.0,
} as const;

/**
 * Get the final scale for the base animal layer
 * This includes both the 75% base size and the animal-specific scale
 */
export function getAnimalScale(animalType: string): number {
  const config = ANIMAL_CONFIGS[animalType.toLowerCase().replace(/\s+/g, '-')];
  const baseScale = config?.baseScale ?? 1.0;
  return AVATAR_RENDER_CONFIG.baseAnimalSize * baseScale;
}

/**
 * Get the final scale for an item on an animal
 * @param dbScale - Scale from database (0-100)
 * @param animalType - Type of animal
 * @param containerSize - Optional container size for responsive scaling
 * @returns Final scale value for CSS transform
 */
export function getItemScale(dbScale: number, animalType: string, containerSize?: number): number {
  const config = ANIMAL_CONFIGS[animalType.toLowerCase().replace(/\s+/g, '-')];
  const animalItemScale = config?.itemScale ?? 1.0;
  const itemScale = dbScale / 100; // Convert from DB integer to decimal
  
  // Apply container size ratio if provided
  const sizeRatio = containerSize ? containerSize / AVATAR_RENDER_CONFIG.standardContainerSize : 1;
  
  return itemScale * animalItemScale * sizeRatio;
}

/**
 * Get position data from database with proper type conversion
 */
export function parsePositionData(position: any) {
  return {
    x: position.position_x || 50,
    y: position.position_y || 50,
    scale: (position.scale || 50) / 100, // DB stores as integer 0-100
    rotation: position.rotation || 0
  };
}

/**
 * Calculate the actual rendered dimensions of an object-contain image
 * This is critical for correct positioning when the container aspect ratio doesn't match the image
 */
export function getContainedImageBounds(
  containerWidth: number,
  containerHeight: number,
  imageAspectRatio: number = AVATAR_RENDER_CONFIG.avatarAspectRatio
) {
  const containerAspect = containerWidth / containerHeight;
  let renderedWidth = containerWidth;
  let renderedHeight = containerHeight;
  
  if (containerAspect > imageAspectRatio) {
    // Container wider than image - height constrained
    renderedWidth = containerHeight * imageAspectRatio;
  } else {
    // Container taller than image - width constrained  
    renderedHeight = containerWidth / imageAspectRatio;
  }
  
  const offsetX = (containerWidth - renderedWidth) / 2;
  const offsetY = (containerHeight - renderedHeight) / 2;
  
  return {
    width: renderedWidth,
    height: renderedHeight,
    offsetX,
    offsetY
  };
}

/**
 * Convert percentage-based position to absolute position accounting for object-contain
 */
export function percentToAbsolute(
  percentX: number,
  percentY: number,
  containerWidth: number,
  containerHeight: number,
  imageAspectRatio: number = AVATAR_RENDER_CONFIG.avatarAspectRatio
) {
  const bounds = getContainedImageBounds(containerWidth, containerHeight, imageAspectRatio);
  
  // Convert percentage (0-100) to position within the actual rendered image bounds
  const absoluteX = bounds.offsetX + (percentX / 100) * bounds.width;
  const absoluteY = bounds.offsetY + (percentY / 100) * bounds.height;
  
  return { x: absoluteX, y: absoluteY };
}

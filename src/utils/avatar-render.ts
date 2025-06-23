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
 * @returns Final scale value for CSS transform
 */
export function getItemScale(dbScale: number, animalType: string): number {
  const config = ANIMAL_CONFIGS[animalType.toLowerCase().replace(/\s+/g, '-')];
  const animalItemScale = config?.itemScale ?? 1.0;
  const itemScale = dbScale / 100; // Convert from DB integer to decimal
  return itemScale * animalItemScale;
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

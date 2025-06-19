// Animal Sizing Configuration
// This handles different animal sizes and item positioning

export type AnimalConfig = {
  displayName: string;
  baseScale: number; // How much to scale the animal to fit standard container
  itemScale: number; // How much to scale items on this animal
  anchors: {
    hat: { x: number; y: number }; // Percentage positions
    glasses: { x: number; y: number };
    accessory: { x: number; y: number };
  };
};

export const ANIMAL_CONFIGS: Record<string, AnimalConfig> = {
  'meerkat': {
    displayName: 'Meerkat',
    baseScale: 0.9,
    itemScale: 0.8,
    anchors: {
      hat: { x: 50, y: 20 },
      glasses: { x: 50, y: 35 },
      accessory: { x: 50, y: 60 }
    }
  },
  
  'otter': {
    displayName: 'Otter',
    baseScale: 1.8,  // Increased from 1.5
    itemScale: 0.75,
    anchors: {
      hat: { x: 50, y: 18 },
      glasses: { x: 50, y: 32 },
      accessory: { x: 50, y: 58 }
    }
  },
  
  'owl': {
    displayName: 'Owl',
    baseScale: 1,
    itemScale: 0.85,
    anchors: {
      hat: { x: 50, y: 15 },
      glasses: { x: 50, y: 30 },
      accessory: { x: 50, y: 55 }
    }
  },
  
  'beaver': {
    displayName: 'Beaver',
    baseScale: 0.95,
    itemScale: 0.9,
    anchors: {
      hat: { x: 50, y: 18 },
      glasses: { x: 50, y: 35 },
      accessory: { x: 50, y: 60 }
    }
  },
  
  'parrot': {
    displayName: 'Parrot',
    baseScale: 1.05,
    itemScale: 0.8,
    anchors: {
      hat: { x: 50, y: 12 },
      glasses: { x: 50, y: 28 },
      accessory: { x: 50, y: 55 }
    }
  },
  
  'border-collie': {
    displayName: 'Border Collie',
    baseScale: 1,
    itemScale: 0.75,
    anchors: {
      hat: { x: 50, y: 20 },
      glasses: { x: 50, y: 35 },
      accessory: { x: 50, y: 65 }
    }
  },
  
  'panda': {
    displayName: 'Panda',
    baseScale: 1.15,
    itemScale: 0.95,
    anchors: {
      hat: { x: 50, y: 18 },
      glasses: { x: 50, y: 35 },
      accessory: { x: 50, y: 62 }
    }
  },
  
  'elephant': {
    displayName: 'Elephant',
    baseScale: 1.8,  // Increased from 1.5
    itemScale: 0.85,
    anchors: {
      hat: { x: 50, y: 15 },
      glasses: { x: 50, y: 30 },
      accessory: { x: 50, y: 60 }
    }
  }
};

// Helper function to get item type from item ID
export function getItemType(itemId: string): 'hat' | 'glasses' | 'accessory' | null {
  // This would need to check against STORE_CATALOG
  // For now, simple pattern matching
  if (itemId.includes('hat') || itemId.includes('cap') || itemId.includes('crown')) return 'hat';
  if (itemId.includes('glass') || itemId.includes('goggles') || itemId.includes('sunglasses')) return 'glasses';
  if (itemId.includes('tie') || itemId.includes('necklace') || itemId.includes('scarf')) return 'accessory';
  return null;
}

// Get the appropriate scale for an item on a specific animal
export function getItemScaleForAnimal(animalType: string, baseItemScale: number = 1): number {
  const config = ANIMAL_CONFIGS[animalType];
  if (!config) return baseItemScale;
  
  return baseItemScale * config.itemScale;
}

// Get default position for an item type on a specific animal
export function getDefaultItemPosition(animalType: string, itemType: 'hat' | 'glasses' | 'accessory'): { x: number; y: number } {
  const config = ANIMAL_CONFIGS[animalType];
  if (!config || !config.anchors[itemType]) {
    return { x: 50, y: 50 }; // Center as fallback
  }
  
  return config.anchors[itemType];
}

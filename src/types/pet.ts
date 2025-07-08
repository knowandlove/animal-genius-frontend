// Pet-related types for the frontend

export interface Pet {
  id: string;
  species: string;
  name: string;
  description: string;
  assetUrl: string;
  cost: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  baseStats: {
    hungerDecayRate: number;
    happinessDecayRate: number;
  };
  isActive: boolean;
  sortOrder: number;
}

export interface StudentPet {
  id: string;
  studentId: string;
  petId: string;
  pet?: Pet; // Populated when fetched
  customName: string;
  hunger: number; // 0-100
  happiness: number; // 0-100
  lastInteractionAt: Date;
  position: { x: number; y: number };
  acquiredAt: Date;
  // Calculated fields (from backend)
  calculatedStats?: {
    hunger: number;
    happiness: number;
  };
  visualState?: 'happy' | 'neutral' | 'sad';
}

export type PetInteractionType = 'feed' | 'play' | 'pet';

export interface PetInteraction {
  type: PetInteractionType;
  cost?: number;
  hungerEffect?: number;
  happinessEffect?: number;
}

export const PET_INTERACTIONS: Record<PetInteractionType, PetInteraction> = {
  feed: { type: 'feed', cost: 5, hungerEffect: 30, happinessEffect: 0 },
  play: { type: 'play', cost: 0, hungerEffect: 0, happinessEffect: 20 },
  pet: { type: 'pet', cost: 0, hungerEffect: 0, happinessEffect: 10 }
};

// Pet animations for display
export type PetAnimation = 'idle' | 'happy' | 'sad' | 'eating' | 'playing' | 'sleeping';

// Pet-related API responses
export interface PetCatalogResponse {
  pets: Pet[];
}

export interface StudentPetResponse {
  pet: StudentPet | null;
}

export interface PetPurchaseResponse {
  success: boolean;
  pet?: StudentPet;
  error?: string;
}

export interface PetInteractionResponse {
  success: boolean;
  newStats?: {
    hunger: number;
    happiness: number;
  };
  error?: string;
}
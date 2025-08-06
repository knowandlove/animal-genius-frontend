/**
 * Pet Store - Virtual pet management
 * 
 * Responsibilities:
 * - Pet data (name, type, stats)
 * - Pet position in room
 * - Hunger and happiness stats
 * - Pet interactions
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { StudentPet } from '@/types/pet';

export interface PetStats {
  hunger: number;
  happiness: number;
}

export interface PetPosition {
  x: number;
  y: number;
}

export interface PetStore {
  // Pet state
  pet: StudentPet | null;
  
  // Actions
  setPet: (pet: StudentPet | null) => void;
  updatePetStats: (stats: PetStats) => void;
  updatePetPosition: (position: PetPosition) => void;
  updatePetName: (name: string) => void;
  clearPet: () => void;
}

export const usePetStore = create<PetStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    pet: null,
    
    // Actions
    setPet: (pet) => {
      set({ pet });
    },
    
    updatePetStats: (stats) => {
      set((state) => {
        if (!state.pet) return state;
        
        return {
          pet: {
            ...state.pet,
            calculatedStats: {
              ...state.pet.calculatedStats,
              hunger: stats.hunger,
              happiness: stats.happiness,
            },
          },
        };
      });
    },
    
    updatePetPosition: (position) => {
      set((state) => {
        if (!state.pet) return state;
        
        return {
          pet: {
            ...state.pet,
            position: position,
          },
        };
      });
    },
    
    updatePetName: (name) => {
      set((state) => {
        if (!state.pet) return state;
        
        return {
          pet: {
            ...state.pet,
            name: name,
          },
        };
      });
    },
    
    clearPet: () => {
      set({ pet: null });
    },
  }))
);
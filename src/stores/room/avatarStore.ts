/**
 * Avatar Store - Avatar appearance and customization
 * 
 * Responsibilities:
 * - Animal type and equipped items
 * - Avatar position and animation
 * - Color customization
 * - Draft state for optimistic updates
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type AnimalType = string;
export type ItemId = string;
export type AvatarAnimation = 'idle' | 'happy' | 'sleeping' | 'wave' | 'dance';

export interface AvatarColors {
  primaryColor: string;
  secondaryColor: string;
  hasCustomized: boolean;
}

export interface EquippedItems {
  hat?: ItemId;
  glasses?: ItemId;
  neckwear?: ItemId;
  held?: ItemId;
}

export interface Position {
  x: number;
  y: number;
}

export interface AvatarStore {
  // Avatar state
  type: AnimalType;
  equipped: EquippedItems;
  position: Position;
  animation: AvatarAnimation;
  colors?: AvatarColors;
  
  // Draft state for optimistic updates
  draftEquipped: EquippedItems;
  
  // Actions
  initializeAvatar: (data: {
    animalType: string;
    avatarData?: {
      equipped?: EquippedItems;
      colors?: AvatarColors;
    };
  }) => void;
  setEquipment: (slot: string, itemId: ItemId | null) => void;
  updateDraftEquipment: (slot: string, itemId: ItemId | null) => void;
  commitDraftEquipment: () => void;
  setAnimation: (animation: AvatarAnimation) => void;
  setColors: (colors: AvatarColors) => void;
  moveAvatar: (x: number, y: number) => void;
  clearAvatar: () => void;
}

export const useAvatarStore = create<AvatarStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    type: 'dolphin',
    equipped: {},
    position: { x: 50, y: 85 },
    animation: 'idle',
    colors: undefined,
    draftEquipped: {},
    
    // Actions
    initializeAvatar: (data) => {
      const equipped = data.avatarData?.equipped || {};
      set({
        type: data.animalType.toLowerCase(),
        equipped: equipped,
        position: { x: 50, y: 85 },
        animation: 'idle',
        colors: data.avatarData?.colors || undefined,
        draftEquipped: { ...equipped },
      });
    },
    
    setEquipment: (slot, itemId) => {
      set((state) => ({
        equipped: {
          ...state.equipped,
          [slot]: itemId || undefined,
        },
        draftEquipped: {
          ...state.equipped,
          [slot]: itemId || undefined,
        },
      }));
    },
    
    updateDraftEquipment: (slot, itemId) => {
      set((state) => ({
        draftEquipped: {
          ...state.draftEquipped,
          [slot]: itemId || undefined,
        },
      }));
    },
    
    commitDraftEquipment: () => {
      const { draftEquipped } = get();
      set({
        equipped: { ...draftEquipped },
      });
    },
    
    setAnimation: (animation) => {
      set({ animation });
    },
    
    setColors: (colors) => {
      set({ colors });
    },
    
    moveAvatar: (x, y) => {
      set({ position: { x, y } });
    },
    
    clearAvatar: () => {
      set({
        equipped: {},
        draftEquipped: {},
        colors: undefined,
      });
    },
  }))
);

// Export as avatarStore for compatibility
export const avatarStore = useAvatarStore;
/**
 * Room Data Store - Room decoration and layout
 * 
 * Responsibilities:
 * - Room theme and surface customization
 * - Placed furniture items and positions
 * - Wall and floor patterns/colors
 * - Draft state for optimistic updates
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type RoomTheme = 'wood' | 'modern' | 'cozy' | 'space' | 'underwater' | 'blank';
export type ItemId = string;

export const ROOM_ITEM_LIMIT = 50;

export interface PlacedItem {
  id: string;
  itemId: ItemId;
  x: number; // Percentage of room width (0-100)
  y: number; // Percentage of room height (0-100)
  zIndex?: number; // Auto-calculated based on Y position
  rotation?: 0 | 90 | 180 | 270;
}

export interface SurfaceConfig {
  type: 'color' | 'pattern';
  value: string; // color hex or pattern ID
  patternType?: 'css' | 'image';
  patternValue?: string; // CSS string or image URL
}

export interface RoomDataStore {
  // Room state
  theme: RoomTheme;
  wallColor?: string;
  floorColor?: string;
  wallPattern?: string;
  floorPattern?: string;
  wall?: SurfaceConfig;
  floor?: SurfaceConfig;
  placedItems: PlacedItem[];
  
  // Draft state for optimistic updates
  draftPlacedItems: PlacedItem[];
  draftWall?: SurfaceConfig;
  draftFloor?: SurfaceConfig;
  draftWallColor?: string;
  draftFloorColor?: string;
  draftWallPattern?: string;
  draftFloorPattern?: string;
  
  // Actions
  initializeRoom: (data: {
    roomData?: {
      theme?: RoomTheme;
      wallColor?: string;
      floorColor?: string;
      wallPattern?: string;
      floorPattern?: string;
      wall?: SurfaceConfig;
      floor?: SurfaceConfig;
      furniture?: any[];
    };
  }) => void;
  placeItem: (itemId: ItemId, x: number, y: number) => void;
  moveItem: (placedItemId: string, x: number, y: number) => void;
  removeItem: (placedItemId: string) => void;
  updateRoomColors: (wallColor?: string, floorColor?: string) => void;
  updateRoomPatterns: (
    wallPattern?: string | null | SurfaceConfig,
    floorPattern?: string | null | SurfaceConfig
  ) => void;
  updateDraftRoom: (placedItems: PlacedItem[]) => void;
  commitDraftRoom: () => void;
  clearRoom: () => void;
}

// Helper to convert old grid positions to percentages
const convertGridToPercent = (item: any): PlacedItem => {
  if (item.x <= 3 && item.y <= 3) {
    return {
      ...item,
      x: (item.x / 3) * 80 + 10,
      y: (item.y / 3) * 80 + 10,
      zIndex: Math.floor(((item.y / 3) * 80 + 10) * 10)
    };
  }
  return item;
};

export const useRoomDataStore = create<RoomDataStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    theme: 'wood',
    wallColor: '#f5ddd9',
    floorColor: '#d4875f',
    placedItems: [],
    draftPlacedItems: [],
    draftWallColor: '#f5ddd9',
    draftFloorColor: '#d4875f',
    
    // Actions
    initializeRoom: (data) => {
      const roomData = data.roomData || {};
      const rawPlacedItems = roomData.furniture || [];
      const placedItems = rawPlacedItems.map(convertGridToPercent);
      
      set({
        theme: roomData.theme || 'wood',
        wallColor: roomData.wallColor || '#f5ddd9',
        floorColor: roomData.floorColor || '#d4875f',
        wallPattern: roomData.wallPattern,
        floorPattern: roomData.floorPattern,
        wall: roomData.wall,
        floor: roomData.floor,
        placedItems: placedItems,
        draftPlacedItems: [...placedItems],
        draftWallColor: roomData.wallColor || '#f5ddd9',
        draftFloorColor: roomData.floorColor || '#d4875f',
        draftWallPattern: roomData.wallPattern,
        draftFloorPattern: roomData.floorPattern,
        draftWall: roomData.wall,
        draftFloor: roomData.floor,
      });
    },
    
    placeItem: (itemId, x, y) => {
      const { draftPlacedItems } = get();
      
      if (draftPlacedItems.length >= ROOM_ITEM_LIMIT) {
        console.warn('Room item limit reached');
        return;
      }
      
      const newItem: PlacedItem = {
        id: `placed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        itemId,
        x,
        y,
        zIndex: Math.floor(y * 10),
      };
      
      set({
        draftPlacedItems: [...draftPlacedItems, newItem],
      });
    },
    
    moveItem: (placedItemId, x, y) => {
      set((state) => ({
        draftPlacedItems: state.draftPlacedItems.map(item =>
          item.id === placedItemId
            ? { ...item, x, y, zIndex: Math.floor(y * 10) }
            : item
        ),
      }));
    },
    
    removeItem: (placedItemId) => {
      set((state) => ({
        draftPlacedItems: state.draftPlacedItems.filter(item => item.id !== placedItemId),
      }));
    },
    
    updateRoomColors: (wallColor, floorColor) => {
      set({
        draftWallColor: wallColor,
        draftFloorColor: floorColor,
      });
    },
    
    updateRoomPatterns: (wallPattern, floorPattern) => {
      const updates: any = {};
      
      if (wallPattern !== undefined) {
        if (wallPattern === null) {
          updates.draftWallPattern = undefined;
          updates.draftWall = undefined;
        } else if (typeof wallPattern === 'string') {
          updates.draftWallPattern = wallPattern;
        } else {
          updates.draftWall = wallPattern;
        }
      }
      
      if (floorPattern !== undefined) {
        if (floorPattern === null) {
          updates.draftFloorPattern = undefined;
          updates.draftFloor = undefined;
        } else if (typeof floorPattern === 'string') {
          updates.draftFloorPattern = floorPattern;
        } else {
          updates.draftFloor = floorPattern;
        }
      }
      
      set(updates);
    },
    
    updateDraftRoom: (placedItems) => {
      set({ draftPlacedItems: placedItems });
    },
    
    commitDraftRoom: () => {
      const state = get();
      set({
        placedItems: [...state.draftPlacedItems],
        wallColor: state.draftWallColor,
        floorColor: state.draftFloorColor,
        wallPattern: state.draftWallPattern,
        floorPattern: state.draftFloorPattern,
        wall: state.draftWall,
        floor: state.draftFloor,
      });
    },
    
    clearRoom: () => {
      set({
        placedItems: [],
        draftPlacedItems: [],
      });
    },
  }))
);
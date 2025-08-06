/**
 * Room History Store - Undo/redo functionality
 * 
 * Responsibilities:
 * - Track state changes for undo
 * - Maintain history stack (max 10 items)
 * - Restore previous states
 * - Support both avatar and room changes
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface UndoHistoryItem {
  type: 'avatar' | 'room';
  timestamp: Date;
  state: {
    avatar?: {
      equipped: { [key: string]: string | undefined };
      colors?: {
        primaryColor: string;
        secondaryColor: string;
        hasCustomized: boolean;
      };
    };
    room?: {
      placedItems: any[];
      wallColor?: string;
      floorColor?: string;
      wallPattern?: string;
      floorPattern?: string;
      wall?: any;
      floor?: any;
    };
  };
}

export interface RoomHistoryStore {
  // History state
  undoHistory: UndoHistoryItem[];
  maxUndoSteps: number;
  
  // Actions
  pushToHistory: (item: UndoHistoryItem) => void;
  undo: () => UndoHistoryItem | null;
  canUndo: () => boolean;
  clearHistory: () => void;
}

export const useRoomHistoryStore = create<RoomHistoryStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    undoHistory: [],
    maxUndoSteps: 10,
    
    // Actions
    pushToHistory: (item) => {
      set((state) => {
        const newHistory = [item, ...state.undoHistory];
        
        // Limit history size
        if (newHistory.length > state.maxUndoSteps) {
          newHistory.pop();
        }
        
        return { undoHistory: newHistory };
      });
    },
    
    undo: () => {
      const { undoHistory } = get();
      
      if (undoHistory.length === 0) {
        return null;
      }
      
      const lastItem = undoHistory[0];
      
      set({
        undoHistory: undoHistory.slice(1),
      });
      
      return lastItem;
    },
    
    canUndo: () => {
      return get().undoHistory.length > 0;
    },
    
    clearHistory: () => {
      set({ undoHistory: [] });
    },
  }))
);
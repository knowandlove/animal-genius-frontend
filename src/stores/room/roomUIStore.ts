/**
 * Room UI Store - User interface state management
 * 
 * Responsibilities:
 * - Inventory panel open/closed state
 * - Editing modes (avatar vs room)
 * - Drag and drop state
 * - Tutorial visibility
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type UIMode = 'normal' | 'placing' | 'inventory' | 'customizing';
export type InventoryMode = 'avatar' | 'room' | null;
export type EditingMode = 'avatar' | 'room';
export type ItemId = string;

export interface DraggedItem {
  itemId: ItemId;
  fromInventory: boolean;
  originalPosition?: { x: number; y: number };
}

export interface RoomUIStore {
  // UI state
  mode: UIMode;
  inventoryMode: InventoryMode;
  isInventoryOpen: boolean;
  editingMode: EditingMode | null;
  draggedItem?: DraggedItem;
  showTutorial: boolean;
  isArranging: boolean;
  pendingModeChange: InventoryMode | null;
  
  // Actions
  setUIMode: (mode: UIMode) => void;
  setInventoryMode: (mode: InventoryMode) => void;
  openInventory: (mode: EditingMode) => void;
  closeInventory: () => void;
  startDragging: (item: DraggedItem) => void;
  stopDragging: () => void;
  startArranging: () => void;
  stopArranging: () => void;
  setShowTutorial: (show: boolean) => void;
  setPendingModeChange: (mode: InventoryMode | null) => void;
  resetUI: () => void;
}

export const useRoomUIStore = create<RoomUIStore>()(
  subscribeWithSelector((set) => ({
    // Initial state
    mode: 'normal',
    inventoryMode: null,
    isInventoryOpen: false,
    editingMode: null,
    draggedItem: undefined,
    showTutorial: true,
    isArranging: false,
    pendingModeChange: null,
    
    // Actions
    setUIMode: (mode) => {
      set({ mode });
    },
    
    setInventoryMode: (mode) => {
      set({ inventoryMode: mode });
    },
    
    openInventory: (mode) => {
      set({
        isInventoryOpen: true,
        inventoryMode: mode,
        editingMode: mode,
        isArranging: mode === 'room',
      });
    },
    
    closeInventory: () => {
      set({
        isInventoryOpen: false,
        inventoryMode: null,
        editingMode: null,
        isArranging: false,
        pendingModeChange: null,
      });
    },
    
    startDragging: (item) => {
      set({
        draggedItem: item,
        mode: 'placing',
      });
    },
    
    stopDragging: () => {
      set({
        draggedItem: undefined,
        mode: 'normal',
      });
    },
    
    startArranging: () => {
      set({ isArranging: true });
    },
    
    stopArranging: () => {
      set({ isArranging: false });
    },
    
    setShowTutorial: (show) => {
      set({ showTutorial: show });
    },
    
    setPendingModeChange: (mode) => {
      set({ pendingModeChange: mode });
    },
    
    resetUI: () => {
      set({
        mode: 'normal',
        inventoryMode: null,
        isInventoryOpen: false,
        editingMode: null,
        draggedItem: undefined,
        isArranging: false,
        pendingModeChange: null,
      });
    },
  }))
);
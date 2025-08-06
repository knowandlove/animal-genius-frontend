/**
 * Inventory Store - Student item inventory management
 * 
 * Responsibilities:
 * - Track owned items and quantities
 * - Filter and selection state
 * - Add/remove items from inventory
 * - Quantity updates when items are placed/removed
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { StoreItem } from '@shared/currency-types';

export type ItemId = string;
export type InventoryFilter = 'all' | 'clothing' | 'furniture' | 'special';

export interface InventoryItem extends StoreItem {
  quantity?: number;
  obtainedAt?: Date;
}

export interface InventoryStore {
  // Inventory state
  items: InventoryItem[];
  filter: InventoryFilter;
  selectedItem?: ItemId;
  
  // Actions
  initializeInventory: (items: InventoryItem[]) => void;
  addToInventory: (item: StoreItem) => void;
  removeFromInventory: (itemId: ItemId) => void;
  updateItemQuantity: (itemId: ItemId, change: number) => void;
  setFilter: (filter: InventoryFilter) => void;
  selectItem: (itemId: ItemId | undefined) => void;
  clearInventory: () => void;
}

export const useInventoryStore = create<InventoryStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    items: [],
    filter: 'all',
    selectedItem: undefined,
    
    // Actions
    initializeInventory: (items) => {
      set({
        items: items || [],
        filter: 'all',
        selectedItem: undefined,
      });
    },
    
    addToInventory: (item) => {
      set((state) => {
        const existingItem = state.items.find(i => i.id === item.id);
        
        if (existingItem) {
          // Update quantity if item already exists
          return {
            items: state.items.map(i =>
              i.id === item.id
                ? { ...i, quantity: (i.quantity || 1) + 1 }
                : i
            ),
          };
        } else {
          // Add new item
          return {
            items: [...state.items, { ...item, quantity: 1, obtainedAt: new Date() }],
          };
        }
      });
    },
    
    removeFromInventory: (itemId) => {
      set((state) => {
        const item = state.items.find(i => i.id === itemId);
        
        if (!item) return state;
        
        const currentQuantity = item.quantity || 1;
        
        if (currentQuantity > 1) {
          // Decrease quantity
          return {
            items: state.items.map(i =>
              i.id === itemId
                ? { ...i, quantity: currentQuantity - 1 }
                : i
            ),
          };
        } else {
          // Remove item completely
          return {
            items: state.items.filter(i => i.id !== itemId),
            selectedItem: state.selectedItem === itemId ? undefined : state.selectedItem,
          };
        }
      });
    },
    
    updateItemQuantity: (itemId, change) => {
      set((state) => {
        const item = state.items.find(i => i.id === itemId);
        
        if (!item) return state;
        
        const newQuantity = (item.quantity || 1) + change;
        
        if (newQuantity <= 0) {
          // Remove item if quantity becomes 0 or negative
          return {
            items: state.items.filter(i => i.id !== itemId),
            selectedItem: state.selectedItem === itemId ? undefined : state.selectedItem,
          };
        } else {
          // Update quantity
          return {
            items: state.items.map(i =>
              i.id === itemId
                ? { ...i, quantity: newQuantity }
                : i
            ),
          };
        }
      });
    },
    
    setFilter: (filter) => {
      set({ filter });
    },
    
    selectItem: (itemId) => {
      set({ selectedItem: itemId });
    },
    
    clearInventory: () => {
      set({
        items: [],
        selectedItem: undefined,
      });
    },
  }))
);
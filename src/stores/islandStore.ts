import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { StoreItem } from '@shared/currency-types';
import { apiRequest } from '@/lib/queryClient';

// Types for our Animal Crossing-style island
export type AnimalType = string; // e.g., 'dolphin', 'elephant', etc.
export type ItemId = string;
export type RoomTheme = 'wood' | 'modern' | 'cozy' | 'space' | 'underwater';

export interface PlacedItem {
  id: string;
  itemId: ItemId;
  x: number; // Percentage of room width (0-100)
  y: number; // Percentage of room height (0-100)
  scale?: number; // Auto-calculated based on Y position
  zIndex?: number; // Auto-calculated based on Y position
  rotation?: 0 | 90 | 180 | 270;
}

// Hotspots no longer needed for sticker-style placement
// export interface Hotspot {...}

export interface InventoryItem extends StoreItem {
  quantity?: number;
  obtainedAt?: Date;
}

export interface DraggedItem {
  itemId: ItemId;
  fromInventory: boolean;
  originalPosition?: { x: number; y: number };
}

// Animation states for the avatar
export type AvatarAnimation = 'idle' | 'happy' | 'sleeping' | 'wave' | 'dance';

// Inventory modes
export type InventoryMode = 'avatar' | 'room' | null;

// Main store interface
export interface IslandStore {
  // Player data
  passportCode: string;
  playerName: string;
  balance: number;
  
  // Avatar state
  avatar: {
    type: AnimalType;
    equipped: {
      hat?: ItemId;
      glasses?: ItemId;
      neckwear?: ItemId;
      held?: ItemId;
    };
    position: { x: number; y: number };
    animation: AvatarAnimation;
  };
  
  // Room state
  room: {
    theme: RoomTheme;
    placedItems: PlacedItem[];
  };
  
  // Inventory
  inventory: {
    items: InventoryItem[];
    filter: 'all' | 'clothing' | 'furniture' | 'special';
    selectedItem?: ItemId;
  };
  
  // UI state
  ui: {
    mode: 'normal' | 'placing' | 'inventory' | 'customizing';
    inventoryMode: InventoryMode;
    draggedItem?: DraggedItem;
    showTutorial: boolean;
    lastSaved: Date | null;
    isSaving: boolean;
  };
  
  // Draft states for unsaved changes
  draftAvatar: {
    equipped: {
      hat?: ItemId;
      glasses?: ItemId;
      accessory?: ItemId;
    };
  };
  draftRoom: {
    placedItems: PlacedItem[];
  };
  
  // Actions
  initializeFromServerData: (data: any) => void;
  setBalance: (balance: number) => void;
  setAvatarEquipment: (slot: string, itemId: ItemId | null) => void;
  setAvatarAnimation: (animation: AvatarAnimation) => void;
  moveAvatar: (x: number, y: number) => void;
  placeItem: (itemId: ItemId, x: number, y: number) => void;
  moveItem: (placedItemId: string, x: number, y: number) => void;
  removeItem: (placedItemId: string) => void;
  setInventoryFilter: (filter: IslandStore['inventory']['filter']) => void;
  selectInventoryItem: (itemId: ItemId | undefined) => void;
  setUIMode: (mode: IslandStore['ui']['mode']) => void;
  setInventoryMode: (mode: InventoryMode) => void;
  updateDraftAvatar: (slot: string, itemId: ItemId | null) => void;
  updateDraftRoom: (placedItems: PlacedItem[]) => void;
  saveDraftChanges: () => Promise<void>;
  discardDraftChanges: () => void;
  startDragging: (item: DraggedItem) => void;
  stopDragging: () => void;
  // highlightHotspots removed for sticker-style
  saveToServer: () => Promise<void>;
  addToInventory: (item: StoreItem) => void;
  removeFromInventory: (itemId: ItemId) => void;
  setShowTutorial: (show: boolean) => void;
}

// Create the store with auto-save functionality
export const useIslandStore = create<IslandStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    passportCode: '',
    playerName: '',
    balance: 0,
    
    avatar: {
      type: 'dolphin',
      equipped: {},
      position: { x: 400, y: 190 }, // Center of room
      animation: 'idle',
    },
    
    room: {
      theme: 'wood',
      placedItems: [],
    },
    
    inventory: {
      items: [],
      filter: 'all',
      selectedItem: undefined,
    },
    
    ui: {
      mode: 'normal',
      inventoryMode: null,
      draggedItem: undefined,
      showTutorial: true,
      lastSaved: null,
      isSaving: false,
    },
    
    draftAvatar: {
      equipped: {},
    },
    
    draftRoom: {
      placedItems: [],
    },
    
    // Actions
    initializeFromServerData: (data) => {
      const equipped = data.avatarData?.equipped || {};
      const placedItems = data.roomData?.furniture || [];
      
      set({
        passportCode: data.passportCode,
        playerName: data.studentName,
        balance: data.currencyBalance,
        avatar: {
          type: data.animalType.toLowerCase(),
          equipped: equipped,
          position: { x: 400, y: 190 }, // Always use centered position for now
          animation: 'idle',
        },
        room: {
          theme: data.roomData?.theme || 'wood',
          placedItems: placedItems,
        },
        inventory: {
          items: data.inventoryItems || [],
          filter: 'all',
          selectedItem: undefined,
        },
        // Initialize drafts with current values
        draftAvatar: {
          equipped: { ...equipped },
        },
        draftRoom: {
          placedItems: [...placedItems],
        },
      });
    },
    
    setBalance: (balance) => set({ balance }),
    
    setAvatarEquipment: (slot, itemId) => {
      set((state) => ({
        avatar: {
          ...state.avatar,
          equipped: {
            ...state.avatar.equipped,
            [slot]: itemId || undefined,
          },
        },
      }));
      
      // Also update the drafts to keep them in sync
      set((state) => ({
        draftAvatar: {
          equipped: {
            ...state.avatar.equipped,
            [slot]: itemId || undefined,
          },
        },
      }));
    },
    
    setAvatarAnimation: (animation) => {
      set((state) => ({
        avatar: { ...state.avatar, animation },
      }));
    },
    
    moveAvatar: (x, y) => {
      set((state) => ({
        avatar: { ...state.avatar, position: { x, y } },
      }));
    },
    
    placeItem: (itemId, x, y) => {
      // Calculate scale and z-index based on Y position
      // Items higher up (lower Y) are smaller and behind
      const scale = 0.7 + (y / 100) * 0.5; // Scale from 0.7 to 1.2
      const zIndex = Math.floor(y); // Higher Y = higher z-index
      
      const newPlacedItem: PlacedItem = {
        id: `placed-${Date.now()}`,
        itemId,
        x,
        y,
        scale,
        zIndex,
      };
      
      const state = get();
      
      // If in room edit mode, update draft room
      if (state.ui.inventoryMode === 'room') {
        set({
          draftRoom: {
            placedItems: [...state.draftRoom.placedItems, newPlacedItem],
          },
          inventory: {
            ...state.inventory,
            items: state.inventory.items.map(item =>
              item.id === itemId && item.quantity
                ? { ...item, quantity: item.quantity - 1 }
                : item
            ).filter(item => !item.quantity || item.quantity > 0),
          },
        });
      } else {
        // Otherwise update main room state
        set({
          room: {
            ...state.room,
            placedItems: [...state.room.placedItems, newPlacedItem],
          },
          inventory: {
            ...state.inventory,
            items: state.inventory.items.map(item =>
              item.id === itemId && item.quantity
                ? { ...item, quantity: item.quantity - 1 }
                : item
            ).filter(item => !item.quantity || item.quantity > 0),
          },
        });
      }
    },
    
    removeItem: (placedItemId) => {
      const state = get();
      
      // Find the item in either draft or main room
      const placedItems = state.ui.inventoryMode === 'room' 
        ? state.draftRoom.placedItems 
        : state.room.placedItems;
      
      const removedItem = placedItems.find(item => item.id === placedItemId);
      if (!removedItem) return;
      
      // Add item back to inventory
      const existingItem = state.inventory.items.find(item => item.id === removedItem.itemId);
      
      if (state.ui.inventoryMode === 'room') {
        // Update draft room
        set({
          draftRoom: {
            placedItems: state.draftRoom.placedItems.filter(item => item.id !== placedItemId),
          },
          inventory: {
            ...state.inventory,
            items: existingItem
              ? state.inventory.items.map(item =>
                  item.id === removedItem.itemId
                    ? { ...item, quantity: (item.quantity || 1) + 1 }
                    : item
                )
              : [...state.inventory.items, { 
                  id: removedItem.itemId, 
                  name: 'Returned Item',
                  type: 'room_furniture' as const,
                  cost: 0,
                  description: 'Item returned from room',
                  rarity: 'common' as const,
                  quantity: 1,
                  obtainedAt: new Date()
                }],
          },
        });
      } else {
        // Update main room
        set({
          room: {
            ...state.room,
            placedItems: state.room.placedItems.filter(item => item.id !== placedItemId),
          },
          inventory: {
            ...state.inventory,
            items: existingItem
              ? state.inventory.items.map(item =>
                  item.id === removedItem.itemId
                    ? { ...item, quantity: (item.quantity || 1) + 1 }
                    : item
                )
              : [...state.inventory.items, { 
                  id: removedItem.itemId, 
                  name: 'Returned Item',
                  type: 'room_furniture' as const,
                  cost: 0,
                  description: 'Item returned from room',
                  rarity: 'common' as const,
                  quantity: 1,
                  obtainedAt: new Date()
                }],
          },
        });
      }
    },
    
    setInventoryFilter: (filter) => {
      set((state) => ({
        inventory: { ...state.inventory, filter },
      }));
    },
    
    selectInventoryItem: (itemId) => {
      set((state) => ({
        inventory: { ...state.inventory, selectedItem: itemId },
      }));
    },
    
    setUIMode: (mode) => {
      set((state) => ({
        ui: { ...state.ui, mode },
      }));
    },
    
    setInventoryMode: (mode) => {
      const state = get();
      
      // Check for unsaved changes when switching modes
      if (state.ui.inventoryMode && state.ui.inventoryMode !== mode) {
        const hasChanges = 
          (state.ui.inventoryMode === 'avatar' && 
           JSON.stringify(state.avatar.equipped) !== JSON.stringify(state.draftAvatar.equipped)) ||
          (state.ui.inventoryMode === 'room' && 
           JSON.stringify(state.room.placedItems) !== JSON.stringify(state.draftRoom.placedItems));
           
        if (hasChanges && !confirm('You have unsaved changes. Do you want to discard them?')) {
          return; // User cancelled, don't switch modes
        }
        
        // Discard changes if switching
        if (hasChanges) {
          get().discardDraftChanges();
        }
      }
      
      set((state) => ({
        ui: { ...state.ui, inventoryMode: mode },
      }));
    },
    
    updateDraftAvatar: (slot, itemId) => {
      set((state) => ({
        draftAvatar: {
          equipped: {
            ...state.draftAvatar.equipped,
            [slot]: itemId || undefined,
          },
        },
      }));
    },
    
    updateDraftRoom: (placedItems) => {
      set({
        draftRoom: { placedItems },
      });
    },
    
    saveDraftChanges: async () => {
      const state = get();
      
      if (state.ui.inventoryMode === 'avatar') {
        // Apply avatar changes
        set({
          avatar: {
            ...state.avatar,
            equipped: { ...state.draftAvatar.equipped },
          },
        });
      } else if (state.ui.inventoryMode === 'room') {
        // Apply room changes
        set({
          room: {
            ...state.room,
            placedItems: [...state.draftRoom.placedItems],
          },
        });
      }
      
      // Save to server
      await get().saveToServer();
      
      // Close inventory
      set((state) => ({
        ui: { ...state.ui, inventoryMode: null },
      }));
    },
    
    discardDraftChanges: () => {
      const state = get();
      
      // Reset drafts to current values
      set({
        draftAvatar: {
          equipped: { ...state.avatar.equipped },
        },
        draftRoom: {
          placedItems: [...state.room.placedItems],
        },
      });
    },
    
    startDragging: (item) => {
      set((state) => ({
        ui: { ...state.ui, draggedItem: item },
      }));
    },
    
    stopDragging: () => {
      set((state) => ({
        ui: { ...state.ui, draggedItem: undefined },
      }));
    },
    
    moveItem: (placedItemId, x, y) => {
      // Calculate scale and z-index based on Y position
      const scale = 0.7 + (y / 100) * 0.5; // Scale from 0.7 to 1.2
      const zIndex = Math.floor(y); // Higher Y = higher z-index
      
      const state = get();
      
      // If in room edit mode, update draft room
      if (state.ui.inventoryMode === 'room') {
        set({
          draftRoom: {
            placedItems: state.draftRoom.placedItems.map(item =>
              item.id === placedItemId
                ? { ...item, x, y, scale, zIndex }
                : item
            ),
          },
        });
      } else {
        // Otherwise update main room state
        set({
          room: {
            ...state.room,
            placedItems: state.room.placedItems.map(item =>
              item.id === placedItemId
                ? { ...item, x, y, scale, zIndex }
                : item
            ),
          },
        });
      }
    },
    
    saveToServer: async () => {
      const state = get();
      if (!state.passportCode) return;
      
      set((state) => ({
        ui: { ...state.ui, isSaving: true },
      }));
      
      try {
        await apiRequest('POST', `/api/island/${state.passportCode}/state`, {
          avatarData: {
            equipped: state.avatar.equipped,
            position: state.avatar.position,
          },
          roomData: {
            theme: state.room.theme,
            furniture: state.room.placedItems,
          },
        });
        
        set((state) => ({
          ui: { ...state.ui, lastSaved: new Date(), isSaving: false },
        }));
      } catch (error) {
        console.error('Failed to save island state:', error);
        set((state) => ({
          ui: { ...state.ui, isSaving: false },
        }));
      }
    },
    
    addToInventory: (item) => {
      set((state) => ({
        inventory: {
          ...state.inventory,
          items: [...state.inventory.items, { ...item, quantity: 1, obtainedAt: new Date() }],
        },
      }));
    },
    
    removeFromInventory: (itemId) => {
      set((state) => ({
        inventory: {
          ...state.inventory,
          items: state.inventory.items.filter(item => item.id !== itemId),
        },
      }));
    },
    
    setShowTutorial: (show) => {
      set((state) => ({
        ui: { ...state.ui, showTutorial: show },
      }));
    },
  }))
);

// Auto-save subscription
let saveTimeout: NodeJS.Timeout | null = null;

// Subscribe to state changes and auto-save
useIslandStore.subscribe(
  (state) => [state.avatar, state.room, state.inventory],
  () => {
    // Clear existing timeout
    if (saveTimeout) clearTimeout(saveTimeout);
    
    // Set new timeout for auto-save (5 seconds after last change)
    saveTimeout = setTimeout(() => {
      useIslandStore.getState().saveToServer();
    }, 5000);
  }
);

// Make store accessible in development for testing
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).useIslandStore = useIslandStore;
}

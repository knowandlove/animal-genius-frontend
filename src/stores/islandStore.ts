import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { StoreItem } from '@shared/currency-types';
import { apiRequest } from '@/lib/queryClient';

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  
  const debounced = (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  
  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
  };
  
  return debounced as T & { cancel: () => void };
}

// Types for our Animal Crossing-style island
export type AnimalType = string; // e.g., 'dolphin', 'elephant', etc.
export type ItemId = string;
export type RoomTheme = 'wood' | 'modern' | 'cozy' | 'space' | 'underwater' | 'blank';

export const ROOM_ITEM_LIMIT = 50; // Maximum items allowed in a room for performance

export interface PlacedItem {
  id: string;
  itemId: ItemId;
  x: number; // Percentage of room width (0-100)
  y: number; // Percentage of room height (0-100)
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
export type EditingMode = 'avatar' | 'room';

// Main store interface
// Undo history types
export interface UndoHistoryItem {
  type: 'avatar' | 'room';
  timestamp: Date;
  state: {
    avatar?: IslandStore['avatar'];
    room?: IslandStore['room'];
  };
}

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
    wallColor?: string;
    floorColor?: string;
    wallPattern?: string;
    floorPattern?: string;
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
    isInventoryOpen: boolean;
    editingMode: EditingMode | null;
    draggedItem?: DraggedItem;
    showTutorial: boolean;
    lastSaved: Date | null;
    isSaving: boolean;
    saveError: string | null;
    pendingModeChange: InventoryMode | null;
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
    wallColor?: string;
    floorColor?: string;
    wallPattern?: string;
    floorPattern?: string;
    placedItems: PlacedItem[];
  };
  
  // Undo history
  undoHistory: UndoHistoryItem[];
  maxUndoSteps: number;
  
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
  openInventory: (mode: EditingMode) => void;
  closeInventory: () => void;
  updateDraftAvatar: (slot: string, itemId: ItemId | null) => void;
  updateDraftRoom: (placedItems: PlacedItem[]) => void;
  updateRoomColors: (wallColor?: string, floorColor?: string) => void;
  updateRoomPatterns: (wallPattern?: string, floorPattern?: string) => void;
  startDragging: (item: DraggedItem) => void;
  stopDragging: () => void;
  // highlightHotspots removed for sticker-style
  saveToServer: () => Promise<void>;
  addToInventory: (item: StoreItem) => void;
  removeFromInventory: (itemId: ItemId) => void;
  setShowTutorial: (show: boolean) => void;
  undo: () => void;
  canUndo: () => boolean;
  isDirty: () => boolean;
}

// Create the debounced save function outside the store
const debouncedSave = debounce(() => {
  useIslandStore.getState().saveToServer();
}, 2000);

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
      position: { x: 50, y: 85 }, // Centered horizontally, near bottom
      animation: 'idle',
    },
    
    room: {
      theme: 'wood',
      wallColor: '#f5ddd9',
      floorColor: '#d4875f',
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
      isInventoryOpen: false,
      editingMode: null,
      draggedItem: undefined,
      showTutorial: true,
      lastSaved: null,
      isSaving: false,
      saveError: null,
      pendingModeChange: null,
    },
    
    draftAvatar: {
      equipped: {},
    },
    
    draftRoom: {
      wallColor: '#f5ddd9',
      floorColor: '#d4875f',
      placedItems: [],
    },
    
    undoHistory: [],
    maxUndoSteps: 10,
    
    // Actions
    initializeFromServerData: (data) => {
      const equipped = data.avatarData?.equipped || {};
      const rawPlacedItems = data.roomData?.furniture || [];
      
      // Convert any old grid positions to percentages
      const placedItems = rawPlacedItems.map((item: any) => {
        if (item.x <= 3 && item.y <= 3) {
          // Convert from old grid system (0-3) to percentage (0-100)
          return {
            ...item,
            x: (item.x / 3) * 80 + 10,
            y: (item.y / 3) * 80 + 10,
            zIndex: Math.floor(((item.y / 3) * 80 + 10) * 10)
          };
        }
        return item;
      });
      
      set({
        passportCode: data.passportCode,
        playerName: data.studentName,
        balance: data.currencyBalance,
        avatar: {
          type: data.animalType.toLowerCase(),
          equipped: equipped,
          position: { x: 50, y: 85 }, // Centered horizontally, near bottom
          animation: 'idle',
        },
        room: {
          theme: data.roomData?.theme || 'wood',
          wallColor: data.roomData?.wallColor || '#f5ddd9',
          floorColor: data.roomData?.floorColor || '#d4875f',
          wallPattern: data.roomData?.wallPattern,
          floorPattern: data.roomData?.floorPattern,
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
          wallColor: data.roomData?.wallColor || '#f5ddd9',
          floorColor: data.roomData?.floorColor || '#d4875f',
          wallPattern: data.roomData?.wallPattern,
          floorPattern: data.roomData?.floorPattern,
          placedItems: [...placedItems],
        },
      });
      
      console.log('Island store initialized:', {
        room: get().room,
        draftRoom: get().draftRoom,
        inventory: get().inventory
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
      console.log('placeItem called with:', { itemId, x, y });
      
      const state = get();
      
      // Check if we've hit the room item limit
      const currentItemCount = state.room.placedItems.length;
        
      if (currentItemCount >= ROOM_ITEM_LIMIT) {
        console.warn(`Room item limit reached (${ROOM_ITEM_LIMIT} items)`);
        alert(`Room is full! Maximum ${ROOM_ITEM_LIMIT} items allowed. Remove some items to place more.`);
        return;
      }
      
      // Save current state to undo history before making changes
      const undoItem: UndoHistoryItem = {
        type: 'room',
        timestamp: new Date(),
        state: {
          room: { ...state.room, placedItems: [...state.room.placedItems] }
        }
      };
      
      // Add to undo history (keep only last N items)
      const newHistory = [undoItem, ...state.undoHistory.slice(0, state.maxUndoSteps - 1)];
      
      // Calculate z-index based on Y position
      const zIndex = Math.floor(y * 10);
      
      const newPlacedItem: PlacedItem = {
        id: `placed-${Date.now()}`,
        itemId,
        x,
        y,
        zIndex,
      };
      
      // Update room and inventory
      set({
        room: {
          ...state.room,
          placedItems: [...state.room.placedItems, newPlacedItem],
        },
        draftRoom: {
          ...state.draftRoom,
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
        undoHistory: newHistory,
      });
      
      // Auto-save after placing
      get().saveToServer();
    },
    
    removeItem: (placedItemId) => {
      const state = get();
      
      const removedItem = state.room.placedItems.find(item => item.id === placedItemId);
      if (!removedItem) return;
      
      // Save current state to undo history
      const undoItem: UndoHistoryItem = {
        type: 'room',
        timestamp: new Date(),
        state: {
          room: { ...state.room, placedItems: [...state.room.placedItems] }
        }
      };
      
      const newHistory = [undoItem, ...state.undoHistory.slice(0, state.maxUndoSteps - 1)];
      
      // Add item back to inventory
      const existingItem = state.inventory.items.find(item => item.id === removedItem.itemId);
      
      // Update room and inventory
      const newPlacedItems = state.room.placedItems.filter(item => item.id !== placedItemId);
      
      set({
        room: {
          ...state.room,
          placedItems: newPlacedItems,
        },
        draftRoom: {
          ...state.draftRoom,
          placedItems: newPlacedItems,
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
        undoHistory: newHistory,
      });
      
      // Auto-save
      get().saveToServer();
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
      set((state) => ({
        ui: { ...state.ui, inventoryMode: mode },
      }));
    },
    
    updateDraftAvatar: (slot, itemId) => {
      const state = get();
      
      // Save current state to undo history
      const undoItem: UndoHistoryItem = {
        type: 'avatar',
        timestamp: new Date(),
        state: {
          avatar: { ...state.avatar, equipped: { ...state.avatar.equipped } }
        }
      };
      
      const newHistory = [undoItem, ...state.undoHistory.slice(0, state.maxUndoSteps - 1)];
      
      // Update both avatar and draft
      const newEquipped = {
        ...state.avatar.equipped,
        [slot]: itemId || undefined,
      };
      
      set({
        avatar: {
          ...state.avatar,
          equipped: newEquipped,
        },
        draftAvatar: {
          equipped: newEquipped,
        },
        undoHistory: newHistory,
      });
      
      // Auto-save
      get().saveToServer();
    },
    
    updateDraftRoom: (placedItems) => {
      set((state) => ({
        draftRoom: {
          ...state.draftRoom,  // Preserve existing colors and patterns
          placedItems,
        },
      }));
    },
    
    updateRoomColors: (wallColor, floorColor) => {
      set((state) => ({
        draftRoom: {
          ...state.draftRoom,
          ...(wallColor !== undefined && { wallColor }),
          ...(floorColor !== undefined && { floorColor }),
        },
      }));
    },
    
    updateRoomPatterns: (wallPattern, floorPattern) => {
      set((state) => ({
        draftRoom: {
          ...state.draftRoom,
          ...(wallPattern !== undefined && { wallPattern }),
          ...(floorPattern !== undefined && { floorPattern }),
        },
      }));
    },
    

    
    startDragging: (item) => {
      set((state) => ({
        ui: { ...state.ui, draggedItem: item },
      }));
    },
    
    stopDragging: () => {
      // Cancel any pending debounced save and save immediately
      debouncedSave.cancel();
      get().saveToServer();
      
      set((state) => ({
        ui: { ...state.ui, draggedItem: undefined },
      }));
    },
    
    moveItem: (placedItemId, x, y) => {
      const state = get();
      
      // Save current state to undo history
      const undoItem: UndoHistoryItem = {
        type: 'room',
        timestamp: new Date(),
        state: {
          room: { ...state.room, placedItems: [...state.room.placedItems] }
        }
      };
      
      const newHistory = [undoItem, ...state.undoHistory.slice(0, state.maxUndoSteps - 1)];
      
      // Calculate z-index based on Y position
      const zIndex = Math.floor(y * 10);
      
      // Update both room and draft
      const newPlacedItems = state.room.placedItems.map(item =>
        item.id === placedItemId
          ? { ...item, x, y, zIndex }
          : item
      );
      
      set({
        room: {
          ...state.room,
          placedItems: newPlacedItems,
        },
        draftRoom: {
          ...state.draftRoom,
          placedItems: newPlacedItems,
        },
        undoHistory: newHistory,
      });
      
      // Use debounced save instead of immediate save
      debouncedSave();
    },
    
    saveToServer: async () => {
      const state = get();
      if (!state.passportCode || !state.ui.editingMode) return;
      
      set((state) => ({
        ui: { ...state.ui, isSaving: true, saveError: null },
      }));
      
      try {
        if (state.ui.editingMode === 'avatar') {
          // Save current avatar state
          await apiRequest('POST', `/api/island/${state.passportCode}/avatar`, {
            equipped: state.avatar.equipped,
          });
        } else if (state.ui.editingMode === 'room') {
          // Save current room state
          await apiRequest('POST', `/api/island/${state.passportCode}/room`, {
            theme: state.room.theme,
            wallColor: state.room.wallColor,
            floorColor: state.room.floorColor,
            wallPattern: state.room.wallPattern,
            floorPattern: state.room.floorPattern,
            furniture: state.room.placedItems,
          });
        }
        
        set((state) => ({
          ui: { ...state.ui, lastSaved: new Date(), isSaving: false, saveError: null },
        }));
      } catch (error) {
        console.error('Failed to save island state:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to save changes';
        set((state) => ({
          ui: { ...state.ui, isSaving: false, saveError: errorMessage },
        }));
        // Clear error after 5 seconds
        setTimeout(() => {
          set((state) => ({
            ui: { ...state.ui, saveError: null },
          }));
        }, 5000);
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
    
    openInventory: (mode: EditingMode) => {
      const state = get();
      
      // Sync drafts with current state when opening
      if (mode === 'avatar') {
        set({
          draftAvatar: {
            equipped: { ...state.avatar.equipped },
          },
          ui: {
            ...state.ui,
            isInventoryOpen: true,
            editingMode: mode,
            inventoryMode: mode,
          },
        });
      } else if (mode === 'room') {
        set({
          draftRoom: {
            wallColor: state.room.wallColor,
            floorColor: state.room.floorColor,
            wallPattern: state.room.wallPattern,
            floorPattern: state.room.floorPattern,
            placedItems: [...state.room.placedItems],
          },
          ui: {
            ...state.ui,
            isInventoryOpen: true,
            editingMode: mode,
            inventoryMode: mode,
          },
        });
      }
    },
    
    closeInventory: () => {
      set((state) => ({
        ui: {
          ...state.ui,
          isInventoryOpen: false,
          // Keep editingMode and inventoryMode active so changes persist
          // editingMode: null,
          // inventoryMode: null,
        },
      }));
    },
    


    
    undo: () => {
      const state = get();
      if (state.undoHistory.length === 0) return;
      
      const lastUndo = state.undoHistory[0];
      const newHistory = state.undoHistory.slice(1);
      
      if (lastUndo.type === 'avatar' && lastUndo.state.avatar) {
        set({
          avatar: lastUndo.state.avatar,
          draftAvatar: {
            equipped: { ...lastUndo.state.avatar.equipped },
          },
          undoHistory: newHistory,
        });
      } else if (lastUndo.type === 'room' && lastUndo.state.room) {
        set({
          room: lastUndo.state.room,
          draftRoom: {
            ...state.draftRoom,
            placedItems: [...lastUndo.state.room.placedItems],
          },
          undoHistory: newHistory,
        });
      }
      
      // Save the undo action
      get().saveToServer();
    },
    
    canUndo: () => {
      return get().undoHistory.length > 0;
    },
    
    isDirty: () => {
      const { avatar, room, draftAvatar, draftRoom, ui } = get();
      if (ui.editingMode === 'avatar') {
        return JSON.stringify(avatar.equipped) !== JSON.stringify(draftAvatar.equipped);
      }
      if (ui.editingMode === 'room') {
        return JSON.stringify(room.placedItems) !== JSON.stringify(draftRoom.placedItems);
      }
      return false;
    },
  }))
);

// Note: Auto-save is now handled immediately on each action (placeItem, removeItem, etc.)
// No need for debounced saving since we want instant feedback

// Make store accessible in development for testing
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).useIslandStore = useIslandStore;
}

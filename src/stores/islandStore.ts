import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { StoreItem } from '@shared/currency-types';
import { apiRequest } from '@/lib/queryClient';
import { handleAsync, showErrorToast } from '@/lib/error-handling';

// =============================================================================
// UTILITIES
// =============================================================================

// Simple debounce function for auto-saving
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

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// Basic Types
export type AnimalType = string; // e.g., 'dolphin', 'elephant', etc.
export type ItemId = string;
export type RoomTheme = 'wood' | 'modern' | 'cozy' | 'space' | 'underwater' | 'blank';
export type AvatarAnimation = 'idle' | 'happy' | 'sleeping' | 'wave' | 'dance';
export type InventoryMode = 'avatar' | 'room' | null;
export type EditingMode = 'avatar' | 'room';

// Constants
export const ROOM_ITEM_LIMIT = 50; // Maximum items allowed in a room for performance

// Room-related types
export interface PlacedItem {
  id: string;
  itemId: ItemId;
  x: number; // Percentage of room width (0-100)
  y: number; // Percentage of room height (0-100)
  zIndex?: number; // Auto-calculated based on Y position
  rotation?: 0 | 90 | 180 | 270;
}

// Inventory types
export interface InventoryItem extends StoreItem {
  quantity?: number;
  obtainedAt?: Date;
}

export interface DraggedItem {
  itemId: ItemId;
  fromInventory: boolean;
  originalPosition?: { x: number; y: number };
}

// Undo/Redo types
export interface UndoHistoryItem {
  type: 'avatar' | 'room';
  timestamp: Date;
  state: {
    avatar?: IslandStore['avatar'];
    room?: IslandStore['room'];
  };
}

// =============================================================================
// MAIN STORE INTERFACE
// =============================================================================

export interface IslandStore {
  // ===== PLAYER DATA =====
  passportCode: string;
  playerName: string;
  balance: number;
  
  // ===== AVATAR STATE =====
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
  
  // ===== ROOM STATE =====
  room: {
    theme: RoomTheme;
    wallColor?: string;
    floorColor?: string;
    wallPattern?: string;
    floorPattern?: string;
    placedItems: PlacedItem[];
  };
  
  // ===== INVENTORY STATE =====
  inventory: {
    items: InventoryItem[];
    filter: 'all' | 'clothing' | 'furniture' | 'special';
    selectedItem?: ItemId;
  };
  
  // ===== UI STATE =====
  ui: {
    mode: 'normal' | 'placing' | 'inventory' | 'customizing';
    inventoryMode: InventoryMode;
    isInventoryOpen: boolean;
    showInventoryTab: boolean; // New: tracks if the tab should be visible
    isStoreModalOpen: boolean;
    editingMode: EditingMode | null;
    draggedItem?: DraggedItem;
    showTutorial: boolean;
    lastSaved: Date | null;
    isSaving: boolean;
    saveError: string | null;
    pendingModeChange: InventoryMode | null;
  };
  
  // ===== DRAFT STATES (for unsaved changes) =====
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
  
  // ===== UNDO/REDO SYSTEM =====
  undoHistory: UndoHistoryItem[];
  maxUndoSteps: number;
  
  // =============================================================================
  // ACTIONS
  // =============================================================================
  
  // ===== INITIALIZATION =====
  initializeFromServerData: (data: any) => void;
  
  // ===== PLAYER ACTIONS =====
  setBalance: (balance: number) => void;
  
  // ===== AVATAR ACTIONS =====
  setAvatarEquipment: (slot: string, itemId: ItemId | null) => void;
  setAvatarAnimation: (animation: AvatarAnimation) => void;
  moveAvatar: (x: number, y: number) => void;
  updateDraftAvatar: (slot: string, itemId: ItemId | null) => void;
  
  // ===== ROOM ACTIONS =====
  placeItem: (itemId: ItemId, x: number, y: number) => void;
  moveItem: (placedItemId: string, x: number, y: number) => void;
  removeItem: (placedItemId: string) => void;
  updateDraftRoom: (placedItems: PlacedItem[]) => void;
  updateRoomColors: (wallColor?: string, floorColor?: string) => void;
  updateRoomPatterns: (wallPattern?: string, floorPattern?: string) => void;
  
  // ===== INVENTORY ACTIONS =====
  setInventoryFilter: (filter: IslandStore['inventory']['filter']) => void;
  selectInventoryItem: (itemId: ItemId | undefined) => void;
  addToInventory: (item: StoreItem) => void;
  removeFromInventory: (itemId: ItemId) => void;
  
  // ===== UI ACTIONS =====
  setUIMode: (mode: IslandStore['ui']['mode']) => void;
  setInventoryMode: (mode: InventoryMode) => void;
  openInventory: (mode: EditingMode) => void;
  closeInventory: () => void;
  startDragging: (item: DraggedItem) => void;
  stopDragging: () => void;
  setShowTutorial: (show: boolean) => void;
  openStoreModal: () => void;
  closeStoreModal: () => void;
  exitEditingMode: () => void;
  
  // ===== PERSISTENCE ACTIONS =====
  saveToServer: () => Promise<void>;
  
  // ===== UNDO/REDO ACTIONS =====
  undo: () => void;
  canUndo: () => boolean;
  isDirty: () => boolean;
}

// =============================================================================
// STORE CREATION
// =============================================================================

// Create the debounced save function outside the store
const debouncedSave = debounce(() => {
  useIslandStore.getState().saveToServer();
}, 2000);

// Create the store with auto-save functionality
export const useIslandStore = create<IslandStore>()(
  subscribeWithSelector((set, get) => ({
    // =========================================================================
    // INITIAL STATE
    // =========================================================================
    
    // Player data
    passportCode: '',
    playerName: '',
    balance: 0,
    
    // Avatar state
    avatar: {
      type: 'dolphin',
      equipped: {},
      position: { x: 50, y: 85 }, // Centered horizontally, near bottom
      animation: 'idle',
    },
    
    // Room state
    room: {
      theme: 'wood',
      wallColor: '#f5ddd9',
      floorColor: '#d4875f',
      placedItems: [],
    },
    
    // Inventory state
    inventory: {
      items: [],
      filter: 'all',
      selectedItem: undefined,
    },
    
    // UI state
    ui: {
      mode: 'normal',
      inventoryMode: null,
      isInventoryOpen: false,
      showInventoryTab: false,
      isStoreModalOpen: false,
      editingMode: null,
      draggedItem: undefined,
      showTutorial: true,
      lastSaved: null,
      isSaving: false,
      saveError: null,
      pendingModeChange: null,
    },
    
    // Draft states
    draftAvatar: {
      equipped: {},
    },
    
    draftRoom: {
      wallColor: '#f5ddd9',
      floorColor: '#d4875f',
      placedItems: [],
    },
    
    // Undo system
    undoHistory: [],
    maxUndoSteps: 10,
    
    // =========================================================================
    // ACTION IMPLEMENTATIONS
    // =========================================================================
    
    // ===== INITIALIZATION =====
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
          position: { x: 50, y: 85 },
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
    
    // ===== PLAYER ACTIONS =====
    setBalance: (balance) => set({ balance }),
    
    // ===== AVATAR ACTIONS =====
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
    
    // ===== ROOM ACTIONS =====
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
    
    // ===== INVENTORY ACTIONS =====
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
    
    // ===== UI ACTIONS =====
    setUIMode: (mode) => {
      set((state) => ({
        ui: { ...state.ui, mode },
      }));
    },
    
    setInventoryMode: (mode) => {
      const state = get();
      
      if (mode === null) {
        // If setting to null, close everything
        set({
          ui: {
            ...state.ui,
            inventoryMode: null,
            isInventoryOpen: false,
            showInventoryTab: false,
            editingMode: null,
          },
        });
      } else {
        // If switching modes, open the new mode
        get().openInventory(mode);
      }
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
            showInventoryTab: true,
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
            showInventoryTab: true,
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
          // Keep editingMode, inventoryMode, and showInventoryTab active so tab remains visible
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
    
    setShowTutorial: (show) => {
      set((state) => ({
        ui: { ...state.ui, showTutorial: show },
      }));
    },
    
    openStoreModal: () => {
      set((state) => ({
        ui: { ...state.ui, isStoreModalOpen: true },
      }));
    },
    
    closeStoreModal: () => {
      set((state) => ({
        ui: { ...state.ui, isStoreModalOpen: false },
      }));
    },
    
    exitEditingMode: () => {
      set((state) => ({
        ui: {
          ...state.ui,
          isInventoryOpen: false,
          showInventoryTab: false,
          editingMode: null,
          inventoryMode: null,
        },
      }));
    },
    
    // ===== PERSISTENCE ACTIONS =====
    saveToServer: async () => {
      const state = get();
      if (!state.passportCode || !state.ui.editingMode) return;
      
      set((state) => ({
        ui: { ...state.ui, isSaving: true, saveError: null },
      }));
      
      const result = await handleAsync(async () => {
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
        return true;
      }, {
        context: 'Saving changes',
        showToast: true,
        onError: (error) => {
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
      });
      
      if (result) {
        set((state) => ({
          ui: { ...state.ui, lastSaved: new Date(), isSaving: false, saveError: null },
        }));
      }
    },
    
    // ===== UNDO/REDO ACTIONS =====
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

// =============================================================================
// DEVELOPMENT HELPERS
// =============================================================================

// Make store accessible in development for testing
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).useIslandStore = useIslandStore;
}

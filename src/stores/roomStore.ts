import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { StoreItem } from '@shared/currency-types';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { getPassportAuthHeaders } from '@/lib/passport-auth';
import type { StudentPet, PetAnimation } from '@/types/pet';

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

// Types for our Animal Crossing-style room
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
    avatar?: RoomStore['avatar'];
    room?: RoomStore['room'];
  };
}

export interface RoomStore {
  // Player data
  passportCode: string;
  playerName: string;
  balance: number;
  canEdit: boolean; // Whether the current user can edit this room
  classId?: string; // The class ID for leaderboards
  
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
    wall?: {
      type: 'color' | 'pattern';
      value: string; // color hex or pattern ID
      patternType?: 'css' | 'image';
      patternValue?: string; // CSS string or image URL
    };
    floor?: {
      type: 'color' | 'pattern';
      value: string; // color hex or pattern ID
      patternType?: 'css' | 'image';
      patternValue?: string; // CSS string or image URL
    };
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
    isArranging: boolean;
  };
  
  // Pet state
  pet: StudentPet | null;
  
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
    wall?: {
      type: 'color' | 'pattern';
      value: string; // color hex or pattern ID
      patternType?: 'css' | 'image';
      patternValue?: string; // CSS string or image URL
    };
    floor?: {
      type: 'color' | 'pattern';
      value: string; // color hex or pattern ID
      patternType?: 'css' | 'image';
      patternValue?: string; // CSS string or image URL
    };
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
  setInventoryFilter: (filter: RoomStore['inventory']['filter']) => void;
  selectInventoryItem: (itemId: ItemId | undefined) => void;
  setUIMode: (mode: RoomStore['ui']['mode']) => void;
  setInventoryMode: (mode: InventoryMode) => void;
  openInventory: (mode: EditingMode) => void;
  closeInventory: () => void;
  updateDraftAvatar: (slot: string, itemId: ItemId | null) => void;
  updateDraftRoom: (placedItems: PlacedItem[]) => void;
  updateRoomColors: (wallColor?: string, floorColor?: string) => void;
  updateRoomPatterns: (
    wallPattern?: string | null | { type: 'pattern'; value: string; patternType?: 'css' | 'image'; patternValue?: string },
    floorPattern?: string | null | { type: 'pattern'; value: string; patternType?: 'css' | 'image'; patternValue?: string }
  ) => void;
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
  saveDraftChanges: () => void;
  discardDraftChanges: () => void;
  clearAvatar: () => void;
  clearRoom: () => void;
  startArranging: () => void;
  stopArranging: () => void;
  
  // Pet actions
  setPet: (pet: StudentPet | null) => void;
  updatePetStats: (stats: { hunger: number; happiness: number }) => void;
  updatePetPosition: (position: { x: number; y: number }) => void;
  updatePetName: (name: string) => void;
}

// Create the debounced save function outside the store
// Reduced to 2 second delay for better UX while still preventing rate limits
const debouncedSave = debounce(() => {
  useRoomStore.getState().saveToServer();
}, 2000);

// Create the store with auto-save functionality
export const useRoomStore = create<RoomStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    passportCode: '',
    playerName: '',
    balance: 0,
    canEdit: false, // Default to read-only for security
    classId: undefined,
    
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
      isArranging: false,
    },
    
    // Pet initial state
    pet: null,
    
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
        canEdit: data.canEdit || false, // Set edit permission from server
        classId: data.classId,
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
          wall: data.roomData?.wall,
          floor: data.roomData?.floor,
          placedItems: placedItems,
        },
        inventory: {
          items: data.inventoryItems || [],
          filter: 'all',
          selectedItem: undefined,
        },
        pet: data.pet || null, // Initialize pet from server data
        // Initialize drafts with current values
        draftAvatar: {
          equipped: { ...equipped },
        },
        draftRoom: {
          wallColor: data.roomData?.wallColor || '#f5ddd9',
          floorColor: data.roomData?.floorColor || '#d4875f',
          wallPattern: data.roomData?.wallPattern,
          floorPattern: data.roomData?.floorPattern,
          wall: data.roomData?.wall,
          floor: data.roomData?.floor,
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
      
      const state = get();
      
      // Don't allow placement if user can't edit
      if (!state.canEdit) {
        return;
      }
      
      // Check if we've hit the room item limit
      const currentItemCount = state.draftRoom.placedItems.length;
        
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
          room: { ...state.room, placedItems: [...state.draftRoom.placedItems] }
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
      
      // Update only draft room and inventory
      set({
        draftRoom: {
          ...state.draftRoom,
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
        undoHistory: newHistory,
      });
      
      // Use debounced save after placing
      debouncedSave();
    },
    
    removeItem: (placedItemId) => {
      const state = get();
      
      const removedItem = state.draftRoom.placedItems.find(item => item.id === placedItemId);
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
      
      // Update only draft room and inventory
      const newPlacedItems = state.draftRoom.placedItems.filter(item => item.id !== placedItemId);
      
      set({
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
      
      // Use debounced save
      debouncedSave();
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
        ui: { 
          ...state.ui, 
          inventoryMode: mode,
          // Turn off arranging mode when switching away from room decoration
          isArranging: mode === 'room' ? state.ui.isArranging : false
        },
      }));
    },
    
    updateDraftAvatar: (slot, itemId) => {
      const state = get();
      
      // Don't allow updates if user can't edit
      if (!state.canEdit) {
        return;
      }
      
      // Save current state to undo history
      const undoItem: UndoHistoryItem = {
        type: 'avatar',
        timestamp: new Date(),
        state: {
          avatar: { ...state.avatar, equipped: { ...state.avatar.equipped } }
        }
      };
      
      const newHistory = [undoItem, ...state.undoHistory.slice(0, state.maxUndoSteps - 1)];
      
      // Update ONLY the draft avatar (not the current avatar)
      const newEquipped = {
        ...state.draftAvatar.equipped,
        [slot]: itemId || undefined,
      };
      
      set({
        draftAvatar: {
          equipped: newEquipped,
        },
        undoHistory: newHistory,
      });
      
      // Use debounced save
      debouncedSave();
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
      const state = get();
      
      // Don't allow updates if user can't edit
      if (!state.canEdit) {
        return;
      }
      
      // Save current state to undo history
      const undoItem: UndoHistoryItem = {
        type: 'room',
        timestamp: new Date(),
        state: {
          room: { 
            ...state.room,
            wallColor: state.room.wallColor,
            floorColor: state.room.floorColor,
          }
        }
      };
      
      const newHistory = [undoItem, ...state.undoHistory.slice(0, state.maxUndoSteps - 1)];
      
      // Update only draft (room state should only change after save)
      set((state) => ({
        draftRoom: {
          ...state.draftRoom,
          ...(wallColor !== undefined && { wallColor }),
          ...(floorColor !== undefined && { floorColor }),
        },
        undoHistory: newHistory,
      }));
      
      // Use debounced save
      debouncedSave();
    },
    
    updateRoomPatterns: (wallPattern, floorPattern) => {
      const state = get();
      
      // Don't allow updates if user can't edit
      if (!state.canEdit) {
        return;
      }
      
      // Save current state to undo history
      const undoItem: UndoHistoryItem = {
        type: 'room',
        timestamp: new Date(),
        state: {
          room: { 
            ...state.room,
            wallPattern: state.room.wallPattern,
            floorPattern: state.room.floorPattern,
            wall: state.room.wall,
            floor: state.room.floor,
          }
        }
      };
      
      const newHistory = [undoItem, ...state.undoHistory.slice(0, state.maxUndoSteps - 1)];
      
      // Update only draft (room state should only change after save)
      set((state) => {
        const updates: any = {
          draftRoom: { ...state.draftRoom },
          undoHistory: newHistory,
        };
        
        // Handle wall pattern
        if (wallPattern !== undefined) {
          if (wallPattern === null) {
            // Clear pattern
            updates.draftRoom.wallPattern = undefined;
            updates.draftRoom.wall = undefined;
          } else if (typeof wallPattern === 'object') {
            // New pattern format
            updates.draftRoom.wall = wallPattern;
            updates.draftRoom.wallPattern = wallPattern.value; // Keep for backwards compat
          } else {
            // Legacy string format
            updates.draftRoom.wallPattern = wallPattern;
          }
        }
        
        // Handle floor pattern
        if (floorPattern !== undefined) {
          if (floorPattern === null) {
            // Clear pattern
            updates.draftRoom.floorPattern = undefined;
            updates.draftRoom.floor = undefined;
          } else if (typeof floorPattern === 'object') {
            // New pattern format
            updates.draftRoom.floor = floorPattern;
            updates.draftRoom.floorPattern = floorPattern.value; // Keep for backwards compat
          } else {
            // Legacy string format
            updates.draftRoom.floorPattern = floorPattern;
          }
        }
        
        return updates;
      });
      
      // Use debounced save
      debouncedSave();
    },
    
    startDragging: (item) => {
      set((state) => ({
        ui: { ...state.ui, draggedItem: item },
      }));
    },
    
    stopDragging: () => {
      // Don't save immediately - let the debounced save handle it
      // This prevents too many requests when dragging items
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
      
      // Update only draft room
      const newPlacedItems = state.draftRoom.placedItems.map(item =>
        item.id === placedItemId
          ? { ...item, x, y, zIndex }
          : item
      );
      
      set({
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
      // Check permissions first
      if (!state.canEdit) {
        return;
      }
      
      if (!state.passportCode) {
        return;
      }
      
      set((state) => ({
        ui: { ...state.ui, isSaving: true, saveError: null },
      }));
      
      try {
        // Check if we have avatar changes to save
        const hasAvatarChanges = JSON.stringify(state.avatar.equipped) !== JSON.stringify(state.draftAvatar.equipped);
        // Check if we have room changes to save
        const hasRoomChanges = JSON.stringify(state.room) !== JSON.stringify(state.draftRoom);
        
        if (hasAvatarChanges) {
          // Save current avatar state
          await apiRequest('POST', `/api/room/${state.passportCode}/avatar`, {
            equipped: state.draftAvatar.equipped,
          }, {
            headers: getPassportAuthHeaders()
          });
          }
        
        if (hasRoomChanges) {
          // Save draft room state (which contains the current changes)
          const saveData = {
            theme: state.room.theme,
            wallColor: state.draftRoom.wallColor || state.room.wallColor,
            floorColor: state.draftRoom.floorColor || state.room.floorColor,
            wallPattern: state.draftRoom.wallPattern,
            floorPattern: state.draftRoom.floorPattern,
            // Include new wall/floor format from draft
            wall: state.draftRoom.wall,
            floor: state.draftRoom.floor,
            furniture: state.draftRoom.placedItems,
          };
          
          await apiRequest('POST', `/api/room/${state.passportCode}/room`, saveData, {
            headers: getPassportAuthHeaders()
          });
        }
        
        // After successful save, update the main state with draft changes
        set((state) => ({
          room: {
            ...state.room,
            wallColor: state.draftRoom.wallColor,
            floorColor: state.draftRoom.floorColor,
            wallPattern: state.draftRoom.wallPattern,
            floorPattern: state.draftRoom.floorPattern,
            wall: state.draftRoom.wall,
            floor: state.draftRoom.floor,
            placedItems: [...state.draftRoom.placedItems],
          },
          avatar: {
            ...state.avatar,
            equipped: { ...state.draftAvatar.equipped },
          },
          ui: { 
            ...state.ui, 
            lastSaved: new Date(), 
            isSaving: false, 
            saveError: null,
            // Turn off arranging mode after successful save
            isArranging: false
          },
        }));
        
        // Invalidate the room page data query to ensure fresh data on navigation
        queryClient.invalidateQueries({ queryKey: [`/api/room-page-data/${state.passportCode}`] });
      } catch (error) {
        console.error('Failed to save room state:', error);
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
            wall: state.room.wall,
            floor: state.room.floor,
            placedItems: [...state.room.placedItems],
          },
          ui: {
            ...state.ui,
            isInventoryOpen: true,
            editingMode: mode,
            inventoryMode: mode,
            isArranging: true, // Enable arranging mode when opening room editor
          },
        });
      }
    },
    
    closeInventory: () => {
      set((state) => ({
        ui: {
          ...state.ui,
          isInventoryOpen: false,
          isArranging: false, // Stop arranging when closing inventory
          // Keep editingMode active so we remember what was open
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
      
      // Use debounced save for undo action
      debouncedSave();
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
    
    saveDraftChanges: () => {
      const state = get();
      // Save immediately
      state.saveToServer();
    },
    
    discardDraftChanges: () => {
      const state = get();
      if (state.ui.editingMode === 'avatar') {
        // Revert draft to current avatar state
        set({
          draftAvatar: {
            equipped: { ...state.avatar.equipped },
          },
        });
      } else if (state.ui.editingMode === 'room') {
        // Revert draft to current room state
        set({
          draftRoom: {
            ...state.room,
            placedItems: [...state.room.placedItems],
          },
        });
      }
      // Close the inventory
      state.closeInventory();
    },
    
    clearAvatar: () => {
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
      
      // Clear all equipped items
      set({
        avatar: {
          ...state.avatar,
          equipped: {},
        },
        draftAvatar: {
          equipped: {},
        },
        undoHistory: newHistory,
      });
      
      // Use debounced save
      debouncedSave();
    },
    
    clearRoom: () => {
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
      
      // Return all placed items to inventory
      const itemsToReturn = state.room.placedItems.map(placedItem => {
        const existingItem = state.inventory.items.find(item => item.id === placedItem.itemId);
        return existingItem || {
          id: placedItem.itemId,
          name: 'Returned Item',
          type: 'room_furniture' as const,
          cost: 0,
          description: 'Item returned from room',
          rarity: 'common' as const,
          quantity: 1,
          obtainedAt: new Date()
        };
      });
      
      // Update room and inventory
      set({
        room: {
          ...state.room,
          placedItems: [],
        },
        draftRoom: {
          ...state.draftRoom,
          placedItems: [],
        },
        inventory: {
          ...state.inventory,
          items: [...state.inventory.items, ...itemsToReturn],
        },
        undoHistory: newHistory,
      });
      
      // Use debounced save
      debouncedSave();
    },
    
    startArranging: () => {
      set((state) => ({
        ui: {
          ...state.ui,
          isArranging: true,
        },
      }));
    },
    
    stopArranging: () => {
      set((state) => ({
        ui: {
          ...state.ui,
          isArranging: false,
        },
      }));
      // Save when exiting arranging mode
      get().saveToServer();
    },
    
    // Pet actions
    setPet: (pet) => {
      set({ pet });
    },
    
    updatePetStats: (stats) => {
      set((state) => ({
        pet: state.pet ? {
          ...state.pet,
          calculatedStats: stats
        } : null
      }));
    },
    
    updatePetPosition: (position) => {
      set((state) => ({
        pet: state.pet ? {
          ...state.pet,
          position
        } : null
      }));
      // Use debounced save for position updates
      debouncedSave();
    },
    
    updatePetName: (name) => {
      set((state) => ({
        pet: state.pet ? {
          ...state.pet,
          customName: name
        } : null
      }));
    },
  }))
);

// Note: Auto-save now uses debounced saving (2 second delay) to reduce API calls
// This prevents excessive backend writes during rapid user interactions

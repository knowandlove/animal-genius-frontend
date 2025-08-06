import { useCallback, useEffect } from 'react';
import { 
  useStudentStore,
  useAvatarStore,
  useRoomDataStore,
  useRoomUIStore,
  useInventoryStore,
  usePetStore,
  useRoomHistoryStore,
  useRoomSyncStore,
} from '@/stores/room';
import type { StoreItem } from '@shared/currency-types';
import type { StudentPet } from '@/types/pet';

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

// Create debounced save function
const debouncedSave = debounce(() => {
  const student = useStudentStore.getState();
  const avatar = useAvatarStore.getState();
  const roomData = useRoomDataStore.getState();
  const sync = useRoomSyncStore.getState();
  
  sync.saveToServer({
    passportCode: student.passportCode,
    avatar: {
      equipped: avatar.equipped as { [key: string]: string | undefined },
      colors: avatar.colors,
    },
    room: {
      theme: roomData.theme,
      wall: roomData.wall,
      floor: roomData.floor,
      placedItems: roomData.placedItems,
    },
    draftAvatar: {
      equipped: avatar.draftEquipped as { [key: string]: string | undefined },
    },
    draftRoom: {
      wallColor: roomData.draftWallColor,
      floorColor: roomData.draftFloorColor,
      wallPattern: roomData.draftWallPattern,
      floorPattern: roomData.draftFloorPattern,
      wall: roomData.draftWall,
      floor: roomData.draftFloor,
      placedItems: roomData.draftPlacedItems,
    },
    canEdit: student.canEdit,
  });
}, 2000);

/**
 * Hook that provides unified access to all room stores
 * Maintains backward compatibility with the original roomStore API
 */
export function useRoomStores() {
  const student = useStudentStore();
  const avatar = useAvatarStore();
  const roomData = useRoomDataStore();
  const ui = useRoomUIStore();
  const inventory = useInventoryStore();
  const pet = usePetStore();
  const history = useRoomHistoryStore();
  const sync = useRoomSyncStore();

  // Helper to push state to history
  const pushToHistory = useCallback((type: 'avatar' | 'room') => {
    if (!student.canEdit) return;
    
    if (type === 'avatar') {
      history.pushToHistory({
        type: 'avatar',
        timestamp: new Date(),
        state: {
          avatar: {
            equipped: { ...avatar.equipped },
            colors: avatar.colors,
          },
        },
      });
    } else {
      history.pushToHistory({
        type: 'room',
        timestamp: new Date(),
        state: {
          room: {
            placedItems: [...roomData.placedItems],
            wallColor: roomData.wallColor,
            floorColor: roomData.floorColor,
            wallPattern: roomData.wallPattern,
            floorPattern: roomData.floorPattern,
            wall: roomData.wall,
            floor: roomData.floor,
          },
        },
      });
    }
  }, [student.canEdit, avatar, roomData, history]);

  // Create mapped actions that maintain the original API
  const actions = {
    // Initialize all stores from server data
    initializeFromServerData: useCallback((data: any) => {
      student.initializeStudent(data);
      avatar.initializeAvatar(data);
      roomData.initializeRoom(data);
      inventory.initializeInventory(data.inventoryItems);
      pet.setPet(data.pet);
    }, [student, avatar, roomData, inventory, pet]),

    // Student actions
    setBalance: student.updateBalance,

    // Avatar actions
    setAvatarEquipment: useCallback((slot: string, itemId: string | null) => {
      avatar.setEquipment(slot, itemId);
    }, [avatar]),

    setAvatarAnimation: avatar.setAnimation,
    setAvatarColors: useCallback((colors: any) => {
      avatar.setColors(colors);
      debouncedSave();
    }, [avatar]),
    moveAvatar: avatar.moveAvatar,

    // Room actions
    placeItem: useCallback((itemId: string, x: number, y: number) => {
      if (!student.canEdit) return;
      
      roomData.placeItem(itemId, x, y);
      inventory.updateItemQuantity(itemId, -1);
      debouncedSave();
    }, [student.canEdit, roomData, inventory]),

    moveItem: useCallback((placedItemId: string, x: number, y: number) => {
      if (!student.canEdit) return;
      
      roomData.moveItem(placedItemId, x, y);
      debouncedSave();
    }, [student.canEdit, roomData]),

    removeItem: useCallback((placedItemId: string) => {
      if (!student.canEdit) return;
      
      const item = roomData.draftPlacedItems.find(i => i.id === placedItemId);
      if (item) {
        roomData.removeItem(placedItemId);
        inventory.updateItemQuantity(item.itemId, 1);
        debouncedSave();
      }
    }, [student.canEdit, roomData, inventory]),

    // Inventory actions
    setInventoryFilter: inventory.setFilter,
    selectInventoryItem: inventory.selectItem,
    addToInventory: inventory.addToInventory,
    removeFromInventory: inventory.removeFromInventory,

    // UI actions
    setUIMode: ui.setUIMode,
    setInventoryMode: ui.setInventoryMode,
    openInventory: useCallback((mode: 'avatar' | 'room') => {
      if (!student.canEdit) return;
      
      ui.openInventory(mode);
      
      // Sync draft states
      if (mode === 'room') {
        roomData.updateDraftRoom(roomData.placedItems);
      }
    }, [student.canEdit, ui, roomData]),
    
    closeInventory: useCallback(() => {
      ui.closeInventory();
      sync.setSaveStatus({ isSaving: false });
    }, [ui, sync]),

    // Draft actions
    updateDraftAvatar: useCallback((slot: string, itemId: string | null) => {
      if (!student.canEdit) return;
      
      pushToHistory('avatar');
      avatar.updateDraftEquipment(slot, itemId);
      debouncedSave();
    }, [student.canEdit, avatar, pushToHistory]),

    updateDraftRoom: useCallback((placedItems: any[]) => {
      if (!student.canEdit) return;
      
      roomData.updateDraftRoom(placedItems);
      debouncedSave();
    }, [student.canEdit, roomData]),

    updateRoomColors: useCallback((wallColor?: string, floorColor?: string) => {
      if (!student.canEdit) return;
      
      pushToHistory('room');
      roomData.updateRoomColors(wallColor, floorColor);
      debouncedSave();
    }, [student.canEdit, roomData, pushToHistory]),

    updateRoomPatterns: useCallback((wallPattern?: any, floorPattern?: any) => {
      if (!student.canEdit) return;
      
      pushToHistory('room');
      roomData.updateRoomPatterns(wallPattern, floorPattern);
      debouncedSave();
    }, [student.canEdit, roomData, pushToHistory]),

    // Drag actions
    startDragging: ui.startDragging,
    stopDragging: ui.stopDragging,

    // Save actions
    saveToServer: useCallback(async () => {
      await sync.saveToServer({
        passportCode: student.passportCode,
        avatar: {
          equipped: avatar.equipped as { [key: string]: string | undefined },
          colors: avatar.colors,
        },
        room: {
          theme: roomData.theme,
          wall: roomData.wall,
          floor: roomData.floor,
          placedItems: roomData.placedItems,
        },
        draftAvatar: {
          equipped: avatar.draftEquipped as { [key: string]: string | undefined },
        },
        draftRoom: {
          wallColor: roomData.draftWallColor,
          floorColor: roomData.draftFloorColor,
          wallPattern: roomData.draftWallPattern,
          floorPattern: roomData.draftFloorPattern,
          wall: roomData.draftWall,
          floor: roomData.draftFloor,
          placedItems: roomData.draftPlacedItems,
        },
        canEdit: student.canEdit,
      });
      
      // Commit drafts after successful save
      avatar.commitDraftEquipment();
      roomData.commitDraftRoom();
      ui.stopArranging();
    }, [student, avatar, roomData, sync, ui]),

    // Tutorial
    setShowTutorial: ui.setShowTutorial,

    // Undo/redo
    undo: useCallback(() => {
      const lastUndo = history.undo();
      if (!lastUndo) return;
      
      if (lastUndo.type === 'avatar' && lastUndo.state.avatar) {
        avatar.setEquipment('hat', lastUndo.state.avatar.equipped.hat || null);
        avatar.setEquipment('glasses', lastUndo.state.avatar.equipped.glasses || null);
        avatar.setEquipment('neckwear', lastUndo.state.avatar.equipped.neckwear || null);
        avatar.setEquipment('held', lastUndo.state.avatar.equipped.held || null);
        if (lastUndo.state.avatar.colors) {
          avatar.setColors(lastUndo.state.avatar.colors);
        }
      } else if (lastUndo.type === 'room' && lastUndo.state.room) {
        roomData.updateDraftRoom(lastUndo.state.room.placedItems);
        roomData.updateRoomColors(
          lastUndo.state.room.wallColor,
          lastUndo.state.room.floorColor
        );
      }
      
      debouncedSave();
    }, [history, avatar, roomData]),

    canUndo: history.canUndo,

    // Status checks
    isDirty: useCallback(() => {
      const avatarDirty = JSON.stringify(avatar.equipped) !== JSON.stringify(avatar.draftEquipped);
      const roomDirty = JSON.stringify(roomData.placedItems) !== JSON.stringify(roomData.draftPlacedItems);
      return avatarDirty || roomDirty;
    }, [avatar, roomData]),

    // Draft management
    saveDraftChanges: useCallback(() => {
      avatar.commitDraftEquipment();
      roomData.commitDraftRoom();
    }, [avatar, roomData]),

    discardDraftChanges: useCallback(() => {
      avatar.updateDraftEquipment('hat', avatar.equipped.hat || null);
      avatar.updateDraftEquipment('glasses', avatar.equipped.glasses || null);
      avatar.updateDraftEquipment('neckwear', avatar.equipped.neckwear || null);
      avatar.updateDraftEquipment('held', avatar.equipped.held || null);
      roomData.updateDraftRoom(roomData.placedItems);
    }, [avatar, roomData]),

    // Clear actions
    clearAvatar: avatar.clearAvatar,
    clearRoom: roomData.clearRoom,

    // Arrange mode
    startArranging: ui.startArranging,
    stopArranging: ui.stopArranging,

    // Pet actions
    setPet: pet.setPet,
    updatePetStats: pet.updatePetStats,
    updatePetPosition: pet.updatePetPosition,
    updatePetName: pet.updatePetName,
  };

  // Return unified state that matches original roomStore structure
  return {
    // Player data
    passportCode: student.passportCode,
    playerName: student.playerName,
    balance: student.balance,
    canEdit: student.canEdit,
    classId: student.classId,

    // Avatar state
    avatar: {
      type: avatar.type,
      equipped: avatar.equipped,
      position: avatar.position,
      animation: avatar.animation,
      colors: avatar.colors,
    },

    // Room state
    room: {
      theme: roomData.theme,
      wallColor: roomData.wallColor,
      floorColor: roomData.floorColor,
      wallPattern: roomData.wallPattern,
      floorPattern: roomData.floorPattern,
      wall: roomData.wall,
      floor: roomData.floor,
      placedItems: roomData.placedItems,
    },

    // Inventory
    inventory: {
      items: inventory.items,
      filter: inventory.filter,
      selectedItem: inventory.selectedItem,
    },

    // UI state
    ui: {
      mode: ui.mode,
      inventoryMode: ui.inventoryMode,
      isInventoryOpen: ui.isInventoryOpen,
      editingMode: ui.editingMode,
      draggedItem: ui.draggedItem,
      showTutorial: ui.showTutorial,
      lastSaved: sync.lastSaved,
      isSaving: sync.isSaving,
      saveError: sync.saveError,
      pendingModeChange: ui.pendingModeChange,
      isArranging: ui.isArranging,
    },

    // Pet state
    pet: pet.pet,

    // Draft states
    draftAvatar: {
      equipped: avatar.draftEquipped,
    },
    draftRoom: {
      wallColor: roomData.draftWallColor,
      floorColor: roomData.draftFloorColor,
      wallPattern: roomData.draftWallPattern,
      floorPattern: roomData.draftFloorPattern,
      wall: roomData.draftWall,
      floor: roomData.draftFloor,
      placedItems: roomData.draftPlacedItems,
    },

    // Undo history
    undoHistory: history.undoHistory,
    maxUndoSteps: history.maxUndoSteps,

    // All actions
    ...actions,
  };
}
/**
 * Store coordination - manages cross-store communication
 * This file sets up subscriptions between stores for automatic updates
 */

import { useStudentStore } from './studentStore';
import { useRoomDataStore } from './roomDataStore';
import { useInventoryStore } from './inventoryStore';
import { useRoomSyncStore } from './roomSyncStore';
import { useRoomUIStore } from './roomUIStore';

// Track if coordination is initialized to avoid duplicate subscriptions
let isInitialized = false;

export function initializeStoreCoordination() {
  if (isInitialized) return;
  isInitialized = true;

  // When student canEdit changes, reset UI if needed
  useStudentStore.subscribe(
    (state) => state.canEdit,
    (canEdit) => {
      if (!canEdit) {
        const ui = useRoomUIStore.getState();
        if (ui.isInventoryOpen || ui.editingMode) {
          ui.closeInventory();
        }
      }
    }
  );

  // When items are placed or removed, we don't need to update inventory
  // because that's handled by the actions in useRoomStores hook
  // This prevents circular updates

  // Clear save error after 5 seconds
  useRoomSyncStore.subscribe(
    (state) => state.saveError,
    (saveError) => {
      if (saveError) {
        setTimeout(() => {
          useRoomSyncStore.getState().clearSaveError();
        }, 5000);
      }
    }
  );

  // When inventory mode changes with pending change, handle it
  useRoomUIStore.subscribe(
    (state) => state.pendingModeChange,
    (pendingMode) => {
      if (pendingMode !== null) {
        setTimeout(() => {
          const ui = useRoomUIStore.getState();
          if (pendingMode && ui.editingMode !== pendingMode) {
            ui.openInventory(pendingMode);
          }
          ui.setPendingModeChange(null);
        }, 100);
      }
    }
  );
}

// Helper function to get snapshot of all stores for debugging
export function getAllStoresSnapshot() {
  return {
    student: useStudentStore.getState(),
    avatar: useRoomDataStore.getState(),
    roomData: useRoomDataStore.getState(),
    ui: useRoomUIStore.getState(),
    inventory: useInventoryStore.getState(),
    sync: useRoomSyncStore.getState(),
  };
}

// Initialize coordination when this module is imported
if (typeof window !== 'undefined') {
  initializeStoreCoordination();
}
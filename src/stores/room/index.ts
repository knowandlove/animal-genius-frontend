// Export all room-related stores
export { useStudentStore } from './studentStore';
export { useAvatarStore } from './avatarStore';
export { useRoomDataStore } from './roomDataStore';
export { useRoomUIStore } from './roomUIStore';
export { useInventoryStore } from './inventoryStore';
export { usePetStore } from './petStore';
export { useRoomHistoryStore } from './roomHistoryStore';
export { useRoomSyncStore } from './roomSyncStore';

// Re-export types
export type { StudentStore } from './studentStore';
export type { AvatarStore, AnimalType, ItemId, AvatarAnimation, AvatarColors, EquippedItems, Position } from './avatarStore';
export type { RoomDataStore, RoomTheme, PlacedItem, SurfaceConfig } from './roomDataStore';
export type { RoomUIStore, UIMode, InventoryMode, EditingMode, DraggedItem } from './roomUIStore';
export type { InventoryStore, InventoryItem, InventoryFilter } from './inventoryStore';
export type { PetStore, PetStats, PetPosition } from './petStore';
export type { RoomHistoryStore, UndoHistoryItem } from './roomHistoryStore';
export type { RoomSyncStore, SaveStatus } from './roomSyncStore';

// Export constants
export { ROOM_ITEM_LIMIT } from './roomDataStore';
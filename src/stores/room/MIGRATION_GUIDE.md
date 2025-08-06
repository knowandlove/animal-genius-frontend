# Room Store Migration Guide

## Overview

The monolithic `roomStore.ts` has been refactored into 8 focused stores. This guide helps migrate components to use the new structure.

## Migration Strategy

### Option 1: Use the Compatibility Hook (Recommended for Initial Migration)

Replace:
```typescript
import { useRoomStore } from '@/stores/roomStore';
```

With:
```typescript
import { useRoomStores } from '@/hooks/useRoomStores';
```

Then replace `useRoomStore` with `useRoomStores`:
```typescript
// Before
const balance = useRoomStore(state => state.balance);

// After  
const { balance } = useRoomStores();
```

### Option 2: Use Individual Stores (Recommended for New Code)

Import only the stores you need:
```typescript
import { useStudentStore, useAvatarStore } from '@/stores/room';

// Use specific stores
const balance = useStudentStore(state => state.balance);
const equipped = useAvatarStore(state => state.equipped);
```

## Store Mapping

### Student Data
- `passportCode` → `useStudentStore`
- `playerName` → `useStudentStore`
- `balance` → `useStudentStore`
- `canEdit` → `useStudentStore`
- `classId` → `useStudentStore`

### Avatar
- `avatar.*` → `useAvatarStore`
- `draftAvatar.*` → `useAvatarStore`

### Room Data
- `room.*` → `useRoomDataStore`
- `draftRoom.*` → `useRoomDataStore`

### UI State
- `ui.*` → `useRoomUIStore` (except save-related)
- `ui.lastSaved` → `useRoomSyncStore`
- `ui.isSaving` → `useRoomSyncStore`
- `ui.saveError` → `useRoomSyncStore`

### Inventory
- `inventory.*` → `useInventoryStore`

### Pet
- `pet` → `usePetStore`

### History
- `undoHistory` → `useRoomHistoryStore`
- `maxUndoSteps` → `useRoomHistoryStore`

## Common Patterns

### Reading State
```typescript
// Old way
const { balance, avatar, room } = useRoomStore();

// New way - Option 1 (compatibility)
const { balance, avatar, room } = useRoomStores();

// New way - Option 2 (individual stores)
const balance = useStudentStore(state => state.balance);
const avatar = useAvatarStore(state => ({
  type: state.type,
  equipped: state.equipped,
  position: state.position,
  animation: state.animation,
  colors: state.colors,
}));
const room = useRoomDataStore(state => ({
  theme: state.theme,
  wallColor: state.wallColor,
  floorColor: state.floorColor,
  placedItems: state.placedItems,
}));
```

### Calling Actions
```typescript
// Old way
const { setBalance, openInventory } = useRoomStore();

// New way - Option 1 (compatibility)
const { setBalance, openInventory } = useRoomStores();

// New way - Option 2 (individual stores)
const setBalance = useStudentStore(state => state.updateBalance);
const openInventory = useRoomUIStore(state => state.openInventory);
```

### Subscribing to Changes
```typescript
// Old way
useEffect(() => {
  const unsubscribe = useRoomStore.subscribe(
    state => state.balance,
    balance => console.log('Balance changed:', balance)
  );
  return unsubscribe;
}, []);

// New way
useEffect(() => {
  const unsubscribe = useStudentStore.subscribe(
    state => state.balance,
    balance => console.log('Balance changed:', balance)
  );
  return unsubscribe;
}, []);
```

## Testing

Run these tests after migration:

1. **Room Decoration**
   - Place items via drag & drop
   - Move items around
   - Remove items to trash
   - Verify auto-save (2 second delay)

2. **Avatar Customization**
   - Equip/unequip items
   - Change colors
   - Verify draft state updates

3. **Undo/Redo**
   - Make changes
   - Use undo
   - Verify state restoration

4. **Save System**
   - Make changes
   - Watch save indicator
   - Verify server sync

5. **Cross-Tab Sync**
   - Open room in two tabs
   - Make changes in one
   - Verify other tab updates

## Rollback Plan

If issues arise, you can temporarily switch back by:

1. Keep the original `roomStore.ts` file
2. Update imports back to original
3. The new stores can coexist during migration

## Component Migration Checklist

- [ ] NormalizedAvatar.tsx
- [ ] MainRoomView.tsx
- [ ] StudentRoom.tsx
- [ ] RoomDecoratorView.tsx
- [ ] StoreModal.tsx
- [ ] UnifiedInventoryPanel.tsx
- [ ] SaveStatusIndicator.tsx
- [ ] RoomSticker.tsx
- [ ] PetDisplay.tsx
- [ ] PetCarePanel.tsx
- [ ] InventoryPanel.tsx
- [ ] EditorModeToggle.tsx
- [ ] EditorControls.tsx
- [ ] CollapsedInventoryTab.tsx
- [ ] AvatarCustomizerView.tsx

## Benefits After Migration

1. **Better Performance**: Components only re-render when their specific data changes
2. **Easier Testing**: Each store can be tested independently
3. **Clearer Code**: Each store has a single responsibility
4. **Better TypeScript**: Smaller interfaces = better type inference
5. **Easier Debugging**: Smaller stores are easier to understand
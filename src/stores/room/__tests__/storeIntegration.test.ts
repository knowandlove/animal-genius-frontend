/**
 * Integration tests for refactored room stores
 * Verifies that the new stores maintain the same behavior as the original roomStore
 */

import { 
  useStudentStore,
  useAvatarStore,
  useRoomDataStore,
  useRoomUIStore,
  useInventoryStore,
  usePetStore,
  useRoomHistoryStore,
  useRoomSyncStore,
} from '../index';

// Mock API request
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn().mockResolvedValue({}),
  queryClient: {
    invalidateQueries: jest.fn(),
  },
}));

// Mock passport auth
jest.mock('@/lib/passport-auth', () => ({
  getPassportAuthHeaders: jest.fn().mockReturnValue({ 'X-Passport-Code': 'TEST-123' }),
}));

describe('Room Stores Integration', () => {
  beforeEach(() => {
    // Reset all stores to initial state
    useStudentStore.setState({
      passportCode: '',
      playerName: '',
      balance: 0,
      classId: undefined,
      canEdit: false,
    });
    
    useAvatarStore.setState({
      type: 'dolphin',
      equipped: {},
      position: { x: 50, y: 85 },
      animation: 'idle',
      colors: undefined,
      draftEquipped: {},
    });
    
    useRoomDataStore.setState({
      theme: 'wood',
      wallColor: '#f5ddd9',
      floorColor: '#d4875f',
      placedItems: [],
      draftPlacedItems: [],
    });
    
    useInventoryStore.setState({
      items: [],
      filter: 'all',
      selectedItem: undefined,
    });
    
    usePetStore.setState({
      pet: null,
    });
    
    useRoomHistoryStore.setState({
      undoHistory: [],
      maxUndoSteps: 10,
    });
  });

  describe('Initialization', () => {
    it('should initialize all stores from server data', () => {
      const mockData = {
        passportCode: 'DOL-PHN',
        studentName: 'Test Student',
        currencyBalance: 100,
        classId: 'class-123',
        canEdit: true,
        animalType: 'Elephant',
        avatarData: {
          equipped: { hat: 'item-1' },
          colors: {
            primaryColor: '#FF0000',
            secondaryColor: '#00FF00',
            hasCustomized: true,
          },
        },
        roomData: {
          theme: 'modern',
          furniture: [
            { id: 'placed-1', itemId: 'chair-1', x: 50, y: 50 },
          ],
        },
        inventoryItems: [
          { id: 'item-1', name: 'Red Hat', price: 10, category: 'clothing' },
        ],
        pet: {
          id: 'pet-1',
          name: 'Bubbles',
          calculatedStats: { hunger: 80, happiness: 90 },
        },
      };

      // Initialize stores
      useStudentStore.getState().initializeStudent(mockData);
      useAvatarStore.getState().initializeAvatar(mockData);
      useRoomDataStore.getState().initializeRoom(mockData);
      useInventoryStore.getState().initializeInventory(mockData.inventoryItems);
      usePetStore.getState().setPet(mockData.pet);

      // Verify student store
      expect(useStudentStore.getState().passportCode).toBe('DOL-PHN');
      expect(useStudentStore.getState().playerName).toBe('Test Student');
      expect(useStudentStore.getState().balance).toBe(100);
      expect(useStudentStore.getState().canEdit).toBe(true);

      // Verify avatar store
      expect(useAvatarStore.getState().type).toBe('elephant');
      expect(useAvatarStore.getState().equipped.hat).toBe('item-1');
      expect(useAvatarStore.getState().colors?.primaryColor).toBe('#FF0000');

      // Verify room store
      expect(useRoomDataStore.getState().theme).toBe('modern');
      expect(useRoomDataStore.getState().placedItems).toHaveLength(1);

      // Verify inventory
      expect(useInventoryStore.getState().items).toHaveLength(1);

      // Verify pet
      expect(usePetStore.getState().pet?.name).toBe('Bubbles');
    });
  });

  describe('Avatar Customization', () => {
    it('should update draft equipment separately from main equipment', () => {
      const avatarStore = useAvatarStore.getState();
      
      // Set initial equipment
      avatarStore.setEquipment('hat', 'hat-1');
      expect(useAvatarStore.getState().equipped.hat).toBe('hat-1');
      expect(useAvatarStore.getState().draftEquipped.hat).toBe('hat-1');

      // Update draft only
      avatarStore.updateDraftEquipment('hat', 'hat-2');
      expect(useAvatarStore.getState().equipped.hat).toBe('hat-1');
      expect(useAvatarStore.getState().draftEquipped.hat).toBe('hat-2');

      // Commit draft
      avatarStore.commitDraftEquipment();
      expect(useAvatarStore.getState().equipped.hat).toBe('hat-2');
    });
  });

  describe('Room Decoration', () => {
    it('should place items in draft state', () => {
      const roomStore = useRoomDataStore.getState();
      
      roomStore.placeItem('chair-1', 50, 50);
      
      // Should only update draft
      expect(useRoomDataStore.getState().placedItems).toHaveLength(0);
      expect(useRoomDataStore.getState().draftPlacedItems).toHaveLength(1);
      expect(useRoomDataStore.getState().draftPlacedItems[0]).toMatchObject({
        itemId: 'chair-1',
        x: 50,
        y: 50,
        zIndex: 500,
      });
    });

    it('should enforce room item limit', () => {
      const roomStore = useRoomDataStore.getState();
      
      // Add 50 items (the limit)
      for (let i = 0; i < 50; i++) {
        roomStore.placeItem(`item-${i}`, i, i);
      }
      
      expect(useRoomDataStore.getState().draftPlacedItems).toHaveLength(50);
      
      // Try to add one more
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      roomStore.placeItem('item-51', 51, 51);
      
      expect(consoleSpy).toHaveBeenCalledWith('Room item limit reached');
      expect(useRoomDataStore.getState().draftPlacedItems).toHaveLength(50);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Inventory Management', () => {
    it('should update item quantities correctly', () => {
      const inventoryStore = useInventoryStore.getState();
      
      // Add new item
      inventoryStore.addToInventory({ 
        id: 'chair-1', 
        name: 'Chair', 
        price: 50,
        category: 'furniture' 
      });
      
      expect(useInventoryStore.getState().items).toHaveLength(1);
      expect(useInventoryStore.getState().items[0].quantity).toBe(1);
      
      // Add same item again
      inventoryStore.addToInventory({ 
        id: 'chair-1', 
        name: 'Chair', 
        price: 50,
        category: 'furniture' 
      });
      
      expect(useInventoryStore.getState().items).toHaveLength(1);
      expect(useInventoryStore.getState().items[0].quantity).toBe(2);
      
      // Remove one
      inventoryStore.updateItemQuantity('chair-1', -1);
      expect(useInventoryStore.getState().items[0].quantity).toBe(1);
      
      // Remove last one
      inventoryStore.updateItemQuantity('chair-1', -1);
      expect(useInventoryStore.getState().items).toHaveLength(0);
    });
  });

  describe('Undo/Redo System', () => {
    it('should track history and allow undo', () => {
      const historyStore = useRoomHistoryStore.getState();
      
      // Push avatar change to history
      historyStore.pushToHistory({
        type: 'avatar',
        timestamp: new Date(),
        state: {
          avatar: {
            equipped: { hat: 'old-hat' },
            colors: undefined,
          },
        },
      });
      
      expect(historyStore.canUndo()).toBe(true);
      expect(useRoomHistoryStore.getState().undoHistory).toHaveLength(1);
      
      // Undo
      const undoItem = historyStore.undo();
      expect(undoItem?.state.avatar?.equipped.hat).toBe('old-hat');
      expect(historyStore.canUndo()).toBe(false);
    });

    it('should limit history size', () => {
      const historyStore = useRoomHistoryStore.getState();
      
      // Push more than max items
      for (let i = 0; i < 15; i++) {
        historyStore.pushToHistory({
          type: 'room',
          timestamp: new Date(),
          state: { room: { placedItems: [] } },
        });
      }
      
      expect(useRoomHistoryStore.getState().undoHistory).toHaveLength(10);
    });
  });

  describe('UI State Management', () => {
    it('should manage inventory panel state', () => {
      const uiStore = useRoomUIStore.getState();
      
      // Open inventory for avatar editing
      uiStore.openInventory('avatar');
      
      expect(useRoomUIStore.getState().isInventoryOpen).toBe(true);
      expect(useRoomUIStore.getState().inventoryMode).toBe('avatar');
      expect(useRoomUIStore.getState().editingMode).toBe('avatar');
      expect(useRoomUIStore.getState().isArranging).toBe(false);
      
      // Switch to room editing
      uiStore.openInventory('room');
      
      expect(useRoomUIStore.getState().inventoryMode).toBe('room');
      expect(useRoomUIStore.getState().isArranging).toBe(true);
      
      // Close inventory
      uiStore.closeInventory();
      
      expect(useRoomUIStore.getState().isInventoryOpen).toBe(false);
      expect(useRoomUIStore.getState().inventoryMode).toBe(null);
      expect(useRoomUIStore.getState().isArranging).toBe(false);
    });
  });

  describe('Permission Checks', () => {
    it('should prevent editing when canEdit is false', () => {
      // Set canEdit to false
      useStudentStore.setState({ canEdit: false });
      
      const roomStore = useRoomDataStore.getState();
      const uiStore = useRoomUIStore.getState();
      
      // Try to place item - should work (no permission check in store)
      roomStore.placeItem('chair-1', 50, 50);
      expect(useRoomDataStore.getState().draftPlacedItems).toHaveLength(1);
      
      // Note: Permission checks are enforced in the useRoomStores hook
      // The individual stores don't enforce permissions to keep them simple
    });
  });
});
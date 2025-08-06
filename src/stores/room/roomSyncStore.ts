/**
 * Room Sync Store - Server synchronization
 * 
 * Responsibilities:
 * - Save room and avatar data to server
 * - Track save status (saving, error, last saved)
 * - Handle save errors
 * - Invalidate cache after successful save
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { getPassportAuthHeaders } from '@/lib/passport-auth';

export interface SaveStatus {
  lastSaved: Date | null;
  isSaving: boolean;
  saveError: string | null;
}

export interface RoomSyncStore {
  // Save state
  lastSaved: Date | null;
  isSaving: boolean;
  saveError: string | null;
  
  // Actions
  saveToServer: (data: {
    passportCode: string;
    avatar: {
      equipped: { [key: string]: string | undefined };
      colors?: any;
    };
    room: {
      theme: string;
      wall?: any;
      floor?: any;
      placedItems: any[];
    };
    draftAvatar: {
      equipped: { [key: string]: string | undefined };
    };
    draftRoom: {
      wallColor?: string;
      floorColor?: string;
      wallPattern?: string;
      floorPattern?: string;
      wall?: any;
      floor?: any;
      placedItems: any[];
    };
    canEdit: boolean;
  }) => Promise<void>;
  setSaveStatus: (status: Partial<SaveStatus>) => void;
  clearSaveError: () => void;
}

export const useRoomSyncStore = create<RoomSyncStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    lastSaved: null,
    isSaving: false,
    saveError: null,
    
    // Actions
    saveToServer: async (data) => {
      const { passportCode, avatar, room, draftAvatar, draftRoom, canEdit } = data;
      
      // Check permissions
      if (!canEdit) {
        console.log('Cannot save - user does not have edit permissions');
        return;
      }
      
      set({ isSaving: true, saveError: null });
      
      try {
        // Check if we have avatar changes to save
        const hasAvatarChanges = JSON.stringify(avatar.equipped) !== JSON.stringify(draftAvatar.equipped);
        
        if (hasAvatarChanges) {
          console.log('Saving avatar changes...');
          await apiRequest('POST', `/api/room/${passportCode}/avatar`, {
            equipped: draftAvatar.equipped,
            colors: avatar.colors,
          }, {
            headers: getPassportAuthHeaders()
          });
        }
        
        // Check if we have room changes to save
        const hasRoomChanges = 
          JSON.stringify(room.placedItems) !== JSON.stringify(draftRoom.placedItems) ||
          room.wall !== draftRoom.wall ||
          room.floor !== draftRoom.floor;
        
        if (hasRoomChanges) {
          console.log('Saving room changes...');
          await apiRequest('POST', `/api/room/${passportCode}/room`, {
            theme: room.theme,
            wallColor: draftRoom.wallColor,
            floorColor: draftRoom.floorColor,
            wallPattern: draftRoom.wallPattern,
            floorPattern: draftRoom.floorPattern,
            wall: draftRoom.wall,
            floor: draftRoom.floor,
            furniture: draftRoom.placedItems.map(item => ({
              id: item.id,
              itemId: item.itemId,
              x: item.x,
              y: item.y,
              zIndex: item.zIndex,
              rotation: item.rotation,
            })),
          }, {
            headers: getPassportAuthHeaders()
          });
        }
        
        set({
          lastSaved: new Date(),
          isSaving: false,
          saveError: null,
        });
        
        // Invalidate the room page data query to ensure fresh data
        queryClient.invalidateQueries({ 
          queryKey: [`/api/room-page-data/${passportCode}`] 
        });
        
      } catch (error) {
        console.error('Failed to save:', error);
        set({
          isSaving: false,
          saveError: error instanceof Error ? error.message : 'Failed to save changes',
        });
      }
    },
    
    setSaveStatus: (status) => {
      set((state) => ({
        ...state,
        ...status,
      }));
    },
    
    clearSaveError: () => {
      set({ saveError: null });
    },
  }))
);
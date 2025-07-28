import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ThumbnailCacheEntry {
  dataUrl: string;
  timestamp: number;
  animalType: string;
  primaryColor: string;
  secondaryColor: string;
}

interface AvatarCacheStore {
  // Thumbnail cache indexed by passport code
  thumbnails: Record<string, ThumbnailCacheEntry>;
  
  // Add or update a thumbnail
  setThumbnail: (
    passportCode: string,
    dataUrl: string,
    animalType: string,
    primaryColor: string,
    secondaryColor: string
  ) => void;
  
  // Get a thumbnail by passport code
  getThumbnail: (passportCode: string) => ThumbnailCacheEntry | null;
  
  // Check if thumbnail needs refresh (e.g., colors changed)
  needsRefresh: (
    passportCode: string,
    primaryColor: string,
    secondaryColor: string
  ) => boolean;
  
  // Clear old entries
  cleanupOldEntries: () => void;
  
  // Clear all cache
  clearCache: () => void;
}

// 7 days in milliseconds
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// Maximum number of cached thumbnails
const MAX_ENTRIES = 100;

export const useAvatarCacheStore = create<AvatarCacheStore>()(
  persist(
    (set, get) => ({
      thumbnails: {},
      
      setThumbnail: (passportCode, dataUrl, animalType, primaryColor, secondaryColor) => {
        set((state) => {
          let newThumbnails = { ...state.thumbnails };
          
          // Add new entry
          newThumbnails[passportCode] = {
            dataUrl,
            timestamp: Date.now(),
            animalType,
            primaryColor,
            secondaryColor
          };
          
          // Limit cache size
          const entries = Object.entries(newThumbnails);
          if (entries.length > MAX_ENTRIES) {
            // Sort by timestamp and keep only the most recent
            entries.sort(([, a], [, b]) => b.timestamp - a.timestamp);
            const keepEntries = entries.slice(0, MAX_ENTRIES);
            newThumbnails = Object.fromEntries(keepEntries);
          }
          
          return { thumbnails: newThumbnails };
        });
      },
      
      getThumbnail: (passportCode) => {
        const entry = get().thumbnails[passportCode];
        
        if (!entry) return null;
        
        // Check if entry is too old
        if (Date.now() - entry.timestamp > MAX_AGE) {
          // Remove old entry
          set((state) => {
            const newThumbnails = { ...state.thumbnails };
            delete newThumbnails[passportCode];
            return { thumbnails: newThumbnails };
          });
          return null;
        }
        
        return entry;
      },
      
      needsRefresh: (passportCode, primaryColor, secondaryColor) => {
        const entry = get().thumbnails[passportCode];
        
        if (!entry) return true;
        
        // Check if colors have changed
        return entry.primaryColor !== primaryColor || 
               entry.secondaryColor !== secondaryColor;
      },
      
      cleanupOldEntries: () => {
        set((state) => {
          const now = Date.now();
          const newThumbnails: Record<string, ThumbnailCacheEntry> = {};
          
          Object.entries(state.thumbnails).forEach(([key, entry]) => {
            if (now - entry.timestamp < MAX_AGE) {
              newThumbnails[key] = entry;
            }
          });
          
          return { thumbnails: newThumbnails };
        });
      },
      
      clearCache: () => {
        set({ thumbnails: {} });
      }
    }),
    {
      name: 'avatar-thumbnail-cache',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle future migrations if needed
        return persistedState;
      }
    }
  )
);

// Run cleanup on store initialization
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useAvatarCacheStore.getState().cleanupOldEntries();
  }, 1000);
}
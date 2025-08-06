import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiRequest } from '@/lib/queryClient';
import { getPassportAuthHeaders } from '@/lib/passport-auth';

interface Crop {
  id: string;
  plotId: string;
  seedType: string;
  plantedAt: string;
  growthStage: number;
  lastWatered: string | null;
  waterBoostUntil: string | null;
  harvestReadyAt: string;
  positionX: number;
  positionY: number;
  isHarvested: boolean;
  version: number;
  seed: {
    id: string;
    name: string;
    category: string;
    baseGrowthHours: number;
    baseSellPrice: number;
    purchasePrice: number;
    iconEmoji: string;
    rarity: string;
  };
  growthInfo: {
    currentStage: number;
    percentComplete: number;
    isReady: boolean;
    minutesRemaining: number;
  };
}

interface GardenPlot {
  id: string;
  studentId: string;
  classId: string;
  plotPosition: number;
  gardenTheme: string;
  createdAt: string;
  updatedAt: string;
}

interface DraggedSeed {
  seedType: string;
  seedName: string;
  fromInventory: boolean;
}

interface GardenState {
  // Core data
  plot: GardenPlot | null;
  crops: Crop[];
  
  // Student data (keep from room system)
  student: {
    id: string;
    passportCode: string;
    studentName: string;
    animalType: string;
    currencyBalance: number;
    avatarData: any;
    classId: string;
    className: string;
  } | null;
  
  // Avatar state (keep from room system)
  avatar: {
    equipped: any[];
  };
  draftAvatar: {
    equipped: any[];
  };
  
  // Inventory (for seeds)
  inventory: any[];
  
  // UI state
  ui: {
    editingMode: 'garden' | 'avatar' | null;
    selectedSeed: string | null;
    isPlanting: boolean;
    isSaving: boolean;
    isWatering: boolean;
    waterCooldownEnd: Date | null;
  };
  
  // Drag state
  isDragging: boolean;
  draggedSeed: DraggedSeed | null;
  
  // Auth
  passportCode: string | null;
  canEdit: boolean;
  
  // Actions
  setPlot: (plot: GardenPlot) => void;
  setCrops: (crops: Crop[]) => void;
  setStudent: (student: any) => void;
  setInventory: (inventory: any[]) => void;
  setSelectedSeed: (seedId: string | null) => void;
  setEditingMode: (mode: 'garden' | 'avatar' | null) => void;
  
  // Drag actions
  startDragging: (seed: DraggedSeed) => void;
  stopDragging: () => void;
  
  // Garden actions
  plantSeed: (x: number, y: number, seedType: string) => Promise<void>;
  harvestCrop: (cropId: string) => Promise<void>;
  waterGarden: () => Promise<void>;
  
  // Avatar actions (keep from room system)
  equipItem: (itemId: string) => void;
  unequipItem: (itemId: string) => void;
  saveAvatar: () => Promise<void>;
  
  // Helper methods
  getCropAt: (x: number, y: number) => Crop | undefined;
  canPlantAt: (x: number, y: number) => boolean;
  getWaterCooldownRemaining: () => number;
}

export const useGardenStore = create<GardenState>()(
  devtools(
    (set, get) => ({
      // Initial state
      plot: null,
      crops: [],
      student: null,
      avatar: { equipped: [] },
      draftAvatar: { equipped: [] },
      inventory: [],
      ui: {
        editingMode: null,
        selectedSeed: null,
        isPlanting: false,
        isSaving: false,
        isWatering: false,
        waterCooldownEnd: null,
      },
      isDragging: false,
      draggedSeed: null,
      passportCode: null,
      canEdit: false,

      // Setters
      setPlot: (plot) => set({ plot }),
      setCrops: (crops) => set({ crops }),
      setStudent: (student) => set({ student }),
      setInventory: (inventory) => set({ inventory }),
      setSelectedSeed: (seedId) => set((state) => ({
        ui: { ...state.ui, selectedSeed: seedId }
      })),
      setEditingMode: (mode) => set((state) => ({
        ui: { ...state.ui, editingMode: mode }
      })),
      
      // Drag actions
      startDragging: (seed) => set({
        isDragging: true,
        draggedSeed: seed
      }),
      
      stopDragging: () => set({
        isDragging: false,
        draggedSeed: null
      }),

      // Garden actions
      plantSeed: async (x, y, seedType) => {
        const state = get();
        if (!state.plot || !state.passportCode || !state.canEdit) return;
        
        set((state) => ({ ui: { ...state.ui, isPlanting: true } }));
        
        try {
          const response = await apiRequest('POST', '/api/garden/plant', {
            plotId: state.plot.id,
            seedType,
            positionX: x,
            positionY: y
          }, {
            headers: getPassportAuthHeaders()
          });

          if (response.success) {
            // Add the new crop to state
            const newCrop = response.data.planted;
            set((state) => ({
              crops: [...state.crops, newCrop],
              ui: { ...state.ui, isPlanting: false, selectedSeed: null }
            }));
            
            // Remove seed from inventory
            set((state) => ({
              inventory: state.inventory.filter(item => 
                item.storeItem.name !== `${seedType} Seeds`
              ).slice(1) // Remove one seed
            }));
          }
        } catch (error) {
          console.error('Failed to plant seed:', error);
          set((state) => ({ ui: { ...state.ui, isPlanting: false } }));
        }
      },

      harvestCrop: async (cropId) => {
        const state = get();
        if (!state.passportCode || !state.canEdit) return;
        
        try {
          const response = await apiRequest('POST', '/api/garden/harvest', {
            cropId
          }, {
            headers: getPassportAuthHeaders()
          });

          if (response.success) {
            // Remove harvested crop
            set((state) => ({
              crops: state.crops.filter(c => c.id !== cropId)
            }));
            
            // Update currency balance
            const { coinsEarned } = response.data;
            set((state) => ({
              student: state.student ? {
                ...state.student,
                currencyBalance: state.student.currencyBalance + coinsEarned
              } : null
            }));
          }
        } catch (error) {
          console.error('Failed to harvest crop:', error);
        }
      },

      waterGarden: async () => {
        const state = get();
        if (!state.passportCode || !state.canEdit || !state.student) return;
        
        set((state) => ({ ui: { ...state.ui, isWatering: true } }));
        
        try {
          const response = await apiRequest('POST', '/api/garden/water', {
            classId: state.student.classId
          }, {
            headers: getPassportAuthHeaders()
          });

          if (response.success) {
            // Update water boost for all crops
            const { boostUntil } = response.data;
            set((state) => ({
              crops: state.crops.map(crop => ({
                ...crop,
                lastWatered: new Date().toISOString(),
                waterBoostUntil: boostUntil
              })),
              ui: {
                ...state.ui,
                isWatering: false,
                waterCooldownEnd: new Date(Date.now() + 30 * 60 * 1000) // 30 min cooldown
              }
            }));
          }
        } catch (error: any) {
          console.error('Failed to water garden:', error);
          
          // Handle rate limit
          if (error.code === 'RATE_001') {
            const match = error.message.match(/(\d+) minutes/);
            if (match) {
              const minutes = parseInt(match[1]);
              set((state) => ({
                ui: {
                  ...state.ui,
                  isWatering: false,
                  waterCooldownEnd: new Date(Date.now() + minutes * 60 * 1000)
                }
              }));
            }
          }
          
          set((state) => ({ ui: { ...state.ui, isWatering: false } }));
        }
      },

      // Avatar actions (simplified from room system)
      equipItem: (itemId) => {
        set((state) => ({
          draftAvatar: {
            equipped: [...state.draftAvatar.equipped, itemId]
          }
        }));
      },

      unequipItem: (itemId) => {
        set((state) => ({
          draftAvatar: {
            equipped: state.draftAvatar.equipped.filter(id => id !== itemId)
          }
        }));
      },

      saveAvatar: async () => {
        const state = get();
        if (!state.passportCode) return;
        
        set((state) => ({ ui: { ...state.ui, isSaving: true } }));
        
        try {
          await apiRequest('POST', `/api/room/${state.passportCode}/avatar`, {
            equipped: state.draftAvatar.equipped
          }, {
            headers: getPassportAuthHeaders()
          });
          
          set((state) => ({
            avatar: { ...state.draftAvatar },
            ui: { ...state.ui, isSaving: false }
          }));
        } catch (error) {
          console.error('Failed to save avatar:', error);
          set((state) => ({ ui: { ...state.ui, isSaving: false } }));
        }
      },

      // Helper methods
      getCropAt: (x, y) => {
        const state = get();
        return state.crops.find(crop => 
          crop.positionX === x && crop.positionY === y && !crop.isHarvested
        );
      },

      canPlantAt: (x, y) => {
        const state = get();
        return !state.getCropAt(x, y) && state.ui.selectedSeed !== null;
      },

      getWaterCooldownRemaining: () => {
        const state = get();
        if (!state.ui.waterCooldownEnd) return 0;
        
        const remaining = state.ui.waterCooldownEnd.getTime() - Date.now();
        return Math.max(0, Math.ceil(remaining / 1000 / 60)); // minutes
      }
    }),
    {
      name: 'garden-store',
    }
  )
);
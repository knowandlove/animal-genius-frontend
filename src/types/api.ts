// API response types for the island system

export interface IslandData {
  id: number;
  passportCode: string;
  studentName: string;
  gradeLevel: string;
  animalType: string;
  personalityType: string;
  animalGenius: string;
  learningStyle: string;
  currencyBalance: number;
  avatarData?: {
    equipped?: {
      hat?: string;
      glasses?: string;
      neckwear?: string;
      held?: string;
    };
    owned?: string[];
  };
  roomData?: {
    theme?: string;
    wallColor?: string;
    floorColor?: string;
    wallPattern?: string;
    floorPattern?: string;
    furniture?: any[];
  };
  className: string;
  classId: number;
  completedAt: string;
}

export interface PurchaseRequest {
  id: string;
  itemId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  cost: number;
}

export interface WalletData {
  total: number;
  pending: number;
  available: number;
}

export interface StoreStatus {
  isOpen: boolean;
  message: string;
  classId: number;
  className: string;
}

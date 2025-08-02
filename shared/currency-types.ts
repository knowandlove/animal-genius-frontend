// Currency System Types and Constants
// Shared between client and server

// Transaction types for currency movements
export type TransactionType = 
  | 'teacher_gift'      // Teacher manually gives coins
  | 'quiz_complete'     // Automatic reward for completing quiz
  | 'achievement'       // Milestone rewards
  | 'purchase'          // Spending coins in store
  | 'lesson_complete';  // Automatic reward for lesson completion

// Store item categories
export type ItemType = 
  | 'avatar_hat'
  | 'avatar_accessory' 
  | 'room_furniture'
  | 'room_decoration'
  | 'room_wallpaper'
  | 'room_flooring';


// Store catalog interface
export interface StoreItem {
  id: string;
  name: string;
  type: ItemType;
  cost: number;
  description: string;
  imageUrl?: string;
  rarity?: 'common' | 'rare' | 'legendary';
  unlockLevel?: number; // Future feature
}

// Student room data structure
export interface StudentRoom {
  id: number;
  passportCode: string;
  studentName: string;
  animalType: string;
  personalityType: string;
  currencyBalance: number;
  avatarData: AvatarData;
  roomData: RoomData;
  className: string;
  completedAt: Date;
}

// Avatar customization data  
export interface AvatarData {
  owned?: string[];       // List of item IDs the student owns
  equipped?: {           // Currently equipped items by slot
    hat?: string;
    glasses?: string;
    accessory?: string;
  };
  color?: string;        // Future feature: avatar color customization
}

// Room decoration data
export interface RoomData {
  furniture: FurnitureItem[];
  wallpaper?: string;
  flooring?: string;
}

export interface FurnitureItem {
  id: string;
  type: string;
  x: number; // 0-3 for 4x4 grid
  y: number; // 0-3 for 4x4 grid
}

// Passport code generation utility
export function generatePassportCode(animalType: string): string {
  // Handle multi-word animal types (e.g., "border collie" -> "BOR")
  const cleanAnimal = animalType.replace(/\s+/g, '');
  const prefix = cleanAnimal.substring(0, 3).toUpperCase().padEnd(3, 'X');
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 3; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${random}`;
}

// Validate passport code format (3-4 character suffix for legacy support)
export function isValidPassportCode(code: string): boolean {
  return /^[A-Z]{3}-[A-Z0-9]{3,4}$/.test(code);
}

// Currency constants
export const CURRENCY_CONSTANTS = {
  QUIZ_COMPLETION_REWARD: 50,  // Coins for completing a quiz
  LESSON_COMPLETION_REWARD: 10, // Coins for completing a lesson
  MAX_TRANSACTION_AMOUNT: 1000, // Max coins per teacher gift
  MAX_ITEM_COST: 10000,        // Max cost for store items
  STARTING_BALANCE: 0,         // Starting currency balance
} as const;

// ============================================
// DEPRECATED: Store catalog moved to database!
// ============================================
// The store catalog is now managed in the database (Supabase).
// These exports are kept temporarily for backwards compatibility
// but should NOT be used in new code.
// 
// Use the API endpoints instead:
// - GET /api/store/catalog - Get all store items
// - GET /api/room-page-data/:passportCode - Get page data including store
// ============================================

/** @deprecated Use database/API instead */
export const STORE_CATALOG: StoreItem[] = [];

/** @deprecated This function always returns undefined. Use server data instead. */
export function getItemById(_itemId: string): StoreItem | undefined {
  console.warn('getItemById is deprecated. Store items should come from the server.');
  return undefined;
}

/** @deprecated This function always returns empty array. Use server data instead. */
export function getItemsByType(_type: ItemType): StoreItem[] {
  console.warn('getItemsByType is deprecated. Store items should come from the server.');
  return [];
}

// This is still valid as it's just a utility
export function canAffordItem(balance: number, itemCost: number): boolean {
  return balance >= itemCost;
}

// Transaction reason templates
export const TRANSACTION_REASONS = {
  QUIZ_COMPLETE: 'Quiz completion reward',
  LESSON_COMPLETE: 'Lesson completion reward',
  TEACHER_GIFT: 'Teacher bonus',
  GOOD_BEHAVIOR: 'Excellent behavior',
  PARTICIPATION: 'Great participation',
  IMPROVEMENT: 'Amazing improvement',
  PURCHASE: 'Store purchase',
} as const;

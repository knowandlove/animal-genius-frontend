// Currency System Types and Constants
// Shared between client and server

// Transaction types for currency movements
export type TransactionType = 
  | 'teacher_gift'      // Teacher manually gives coins
  | 'quiz_complete'     // Automatic reward for completing quiz
  | 'achievement'       // Milestone rewards
  | 'purchase';         // Spending coins in store

// Store item categories
export type ItemType = 
  | 'avatar_hat'
  | 'avatar_accessory' 
  | 'room_furniture'
  | 'room_decoration'
  | 'room_wallpaper'
  | 'room_flooring';

// Purchase request status
export type PurchaseStatus = 'pending' | 'approved' | 'denied';

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

// Student island data structure
export interface StudentIsland {
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
  MAX_TRANSACTION_AMOUNT: 1000, // Max coins per teacher gift
  MAX_ITEM_COST: 10000,        // Max cost for store items
  STARTING_BALANCE: 0,         // Starting currency balance
} as const;

// Helper function to get the correct folder for an item
// This is now based on item type from the database
export function getItemFolder(itemType: ItemType, itemId: string): string {
  // Special case for legacy glasses items
  if (itemId === 'greenblinds' || itemId === 'hearts' || itemId === 'sunglasses' || itemId === 'star_glasses') {
    return 'glasses';
  }
  
  // Based on item type
  if (itemType === 'avatar_hat') {
    return 'hats';
  }
  
  // Check if it's glasses based on naming pattern
  if (itemId.includes('glass') || itemId.includes('blind') || itemId.includes('shade')) {
    return 'glasses';
  }
  
  // Default to accessories
  return 'accessories';
}

// Helper function to check affordability
export function canAffordItem(balance: number, itemCost: number): boolean {
  return balance >= itemCost;
}

// Transaction reason templates
export const TRANSACTION_REASONS = {
  QUIZ_COMPLETE: 'Quiz completion reward',
  TEACHER_GIFT: 'Teacher bonus',
  GOOD_BEHAVIOR: 'Excellent behavior',
  PARTICIPATION: 'Great participation',
  IMPROVEMENT: 'Amazing improvement',
  PURCHASE: 'Store purchase',
} as const;
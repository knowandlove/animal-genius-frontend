/**
 * Student Store - Core student data and permissions
 * 
 * Responsibilities:
 * - Student identity (passport code, name)
 * - Currency balance
 * - Edit permissions
 * - Class association
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface StudentStore {
  // Core student data
  passportCode: string;
  playerName: string;
  balance: number;
  classId?: string;
  canEdit: boolean;
  
  // Actions
  initializeStudent: (data: {
    passportCode: string;
    studentName: string;
    currencyBalance: number;
    classId?: string;
    canEdit?: boolean;
  }) => void;
  updateBalance: (balance: number) => void;
  setCanEdit: (canEdit: boolean) => void;
  clearStudent: () => void;
}

export const useStudentStore = create<StudentStore>()(
  subscribeWithSelector((set) => ({
    // Initial state
    passportCode: '',
    playerName: '',
    balance: 0,
    classId: undefined,
    canEdit: false,
    
    // Actions
    initializeStudent: (data) => {
      set({
        passportCode: data.passportCode,
        playerName: data.studentName,
        balance: data.currencyBalance,
        classId: data.classId,
        canEdit: data.canEdit || false,
      });
    },
    
    updateBalance: (balance) => {
      set({ balance });
    },
    
    setCanEdit: (canEdit) => {
      set({ canEdit });
    },
    
    clearStudent: () => {
      set({
        passportCode: '',
        playerName: '',
        balance: 0,
        classId: undefined,
        canEdit: false,
      });
    },
  }))
);
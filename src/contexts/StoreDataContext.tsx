import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface StoreDataContextType {
  storeItems: any[] | undefined;
  itemPositions: any[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

const StoreDataContext = createContext<StoreDataContextType | undefined>(undefined);

// Provider component that fetches data once at app level
export function StoreDataProvider({ children }: { children: ReactNode }) {
  // Fetch store items from database
  const { 
    data: storeItems, 
    isLoading: isLoadingStore,
    error: storeError 
  } = useQuery({
    queryKey: ['/api/store/catalog'],
    queryFn: () => apiRequest('GET', '/api/store/catalog'),
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    cacheTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  // Fetch item positions from database
  const { 
    data: itemPositions,
    isLoading: isLoadingPositions,
    error: positionsError
  } = useQuery({
    queryKey: ['/api/item-positions'],
    queryFn: () => apiRequest('GET', '/api/item-positions'),
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    cacheTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  const contextValue: StoreDataContextType = {
    storeItems,
    itemPositions,
    isLoading: isLoadingStore || isLoadingPositions,
    error: storeError || positionsError,
  };

  return (
    <StoreDataContext.Provider value={contextValue}>
      {children}
    </StoreDataContext.Provider>
  );
}

// Hook to use the store data
export function useStoreData() {
  const context = useContext(StoreDataContext);
  if (context === undefined) {
    throw new Error('useStoreData must be used within a StoreDataProvider');
  }
  return context;
}

// Optional: Specific hooks for convenience
export function useStoreItems() {
  const { storeItems } = useStoreData();
  return storeItems;
}

export function useItemPositions() {
  const { itemPositions } = useStoreData();
  return itemPositions;
}

// Hook to invalidate store data cache
export function useInvalidateStoreData() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['/api/store/catalog'] });
    queryClient.invalidateQueries({ queryKey: ['/api/item-positions'] });
  };
}

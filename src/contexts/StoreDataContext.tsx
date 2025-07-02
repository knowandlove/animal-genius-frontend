import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface StoreDataContextType {
  storeItems: any[] | undefined;
  itemPositions: any[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetchPositions: () => void;
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
    error: positionsError,
    refetch: refetchPositions
  } = useQuery({
    queryKey: ['/api/item-positions-normalized'],
    queryFn: () => apiRequest('GET', '/api/item-positions-normalized'),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes to reduce API calls
    cacheTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: false, // Don't refetch on every mount to reduce API calls
    onSuccess: (data) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Fetched item positions from API:', {
        timestamp: new Date().toISOString(),
        count: data?.length,
        hatPositions: data?.filter((p: any) => p.item_id === 'b0d64da3-d5f1-41d5-8fb8-25b48c6cf2e4'),
        sample: data?.slice(0, 3)
      });
      }
    }
  });

  const contextValue: StoreDataContextType = {
    storeItems,
    itemPositions,
    isLoading: isLoadingStore || isLoadingPositions,
    error: storeError || positionsError,
    refetchPositions: () => refetchPositions(),
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


import { useEffect, useState } from 'react';
import { useIslandStore } from '@/stores/islandStore';
import type { StoreItem } from '@/hooks/data';
import type { IslandData, PurchaseRequest } from '@/types/api';

interface IslandPageData {
  island: IslandData;
  storeCatalog: StoreItem[];
  purchaseRequests: PurchaseRequest[];
}

export function useIslandDataInitializer(
  pageData: IslandPageData | undefined,
  passportCode: string | undefined
) {
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);
  const initializeFromServerData = useIslandStore((state) => state.initializeFromServerData);

  useEffect(() => {
    if (!pageData) return;

    const { island, storeCatalog, purchaseRequests } = pageData;
    
    // Create a map of store items for quick lookup
    const itemMap = new Map<string, StoreItem>();
    storeCatalog.forEach(item => {
      itemMap.set(item.id, item);
    });
    
    // Convert owned items to inventory format using the store catalog
    const inventoryItems: any[] = [];
    if (island.avatarData?.owned) {
      island.avatarData.owned.forEach((itemId: string) => {
        const item = itemMap.get(itemId);
        if (item) {
          inventoryItems.push({
            ...item,
            quantity: 1,
            obtainedAt: new Date()
          });
        }
      });
    }
    
    // Add approved purchase requests that aren't in owned yet (in case of sync issues)
    const approvedItems = purchaseRequests
      .filter(req => req.status === 'approved')
      .map(req => req.itemId);
    
    approvedItems.forEach(itemId => {
      if (!island.avatarData?.owned?.includes(itemId)) {
        const item = itemMap.get(itemId);
        if (item && !inventoryItems.find(i => i.id === itemId)) {
          inventoryItems.push({
            ...item,
            quantity: 1,
            obtainedAt: new Date()
          });
        }
      }
    });
    
    initializeFromServerData({
      ...island,
      inventoryItems
    });
  }, [pageData, initializeFromServerData]);

  // Check if this is first visit
  useEffect(() => {
    if (!pageData || !passportCode) return;
    
    const hasBeenWelcomed = localStorage.getItem(`island-welcomed-${passportCode}`);
    if (!hasBeenWelcomed) {
      setShouldShowWelcome(true);
    }
  }, [pageData, passportCode]);

  return { shouldShowWelcome };
}

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { IslandData, PurchaseRequest, WalletData, StoreStatus } from "@/types/api";
import type { StoreItem } from "./useStoreCatalog";

interface IslandPageData {
  island: IslandData;
  wallet: WalletData;
  storeStatus: StoreStatus;
  storeCatalog: StoreItem[];
  purchaseRequests: PurchaseRequest[];
}

export function useStudentIsland(passportCode: string | undefined) {
  return useQuery<IslandPageData>({
    queryKey: [`/api/island-page-data/${passportCode}`],
    queryFn: () => apiRequest('GET', `/api/island-page-data/${passportCode}`),
    enabled: !!passportCode,
  });
}

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface StoreItem {
  id: string;
  name: string;
  type: string;
  cost: number;
  description?: string;
  rarity?: string;
  imageUrl?: string;
}

export function useStoreCatalog() {
  return useQuery<StoreItem[]>({
    queryKey: ['/api/store/catalog'],
    queryFn: () => apiRequest('GET', '/api/store/catalog'),
    staleTime: 30 * 60 * 1000, // 30 minutes - store items don't change often
  });
}

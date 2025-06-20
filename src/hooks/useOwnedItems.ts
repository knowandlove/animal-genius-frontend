import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useOwnedItems(itemIds: string[] | undefined) {
  return useQuery({
    queryKey: ['/api/store/items/batch', itemIds],
    queryFn: async () => {
      if (!itemIds || itemIds.length === 0) return [];
      
      const response = await apiRequest('POST', '/api/store/items/batch', {
        itemIds
      });
      
      return response;
    },
    enabled: !!itemIds && itemIds.length > 0,
  });
}

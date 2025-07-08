import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Pet } from '@/types/pet';

export function usePetCatalog() {
  return useQuery<Pet[]>({
    queryKey: ['/api/pets/catalog'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/pets/catalog');
      return response;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}

export function useMyPet() {
  return useQuery({
    queryKey: ['/api/pets/my-pet'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/pets/my-pet');
      return response;
    },
  });
}
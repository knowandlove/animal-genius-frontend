import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Tag, TagsByCategory } from '@/types/community';

// Fetch all tags grouped by category
export function useTags(category?: string) {
  return useQuery({
    queryKey: ['tags', category],
    queryFn: async () => {
      const url = category 
        ? `/api/community/tags?category=${category}` 
        : '/api/community/tags';
      
      return apiRequest('GET', url) as Promise<TagsByCategory>;
    },
    staleTime: 1000 * 60 * 10, // Tags don't change often - 10 minutes
  });
}

// Search tags
export function useSearchTags(query: string) {
  return useQuery({
    queryKey: ['tags', 'search', query],
    queryFn: async () => {
      if (!query) return [];
      
      return apiRequest('GET', `/api/community/tags/search?q=${encodeURIComponent(query)}`) as Promise<Tag[]>;
    },
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get tag suggestions based on text
export function useTagSuggestions(title: string, body: string) {
  return useQuery({
    queryKey: ['tags', 'suggestions', title, body],
    queryFn: async () => {
      if (!title && !body) return [];
      
      return apiRequest('POST', '/api/community/tags/suggestions', {
        title,
        body
      }) as Promise<Tag[]>;
    },
    enabled: !!(title || body),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
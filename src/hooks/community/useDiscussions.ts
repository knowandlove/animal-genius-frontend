import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { 
  Discussion, 
  CreateDiscussionRequest,
  UpdateDiscussionRequest, 
  ListDiscussionsParams, 
  ListDiscussionsResponse 
} from '@/types/community';

// Fetch discussions with filters
export function useDiscussions(params: ListDiscussionsParams = {}) {
  return useQuery({
    queryKey: ['discussions', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params.category) searchParams.append('category', params.category);
      if (params.tags?.length) params.tags.forEach(tag => searchParams.append('tags', tag));
      if (params.grade) searchParams.append('grade', params.grade);
      if (params.sort) searchParams.append('sort', params.sort);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.search) searchParams.append('search', params.search);
      
      const queryString = searchParams.toString();
      const url = `/api/community/discussions${queryString ? `?${queryString}` : ''}`;
      
      return apiRequest('GET', url) as Promise<ListDiscussionsResponse>;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Fetch single discussion
export function useDiscussion(id: string | undefined) {
  return useQuery({
    queryKey: ['discussion', id],
    queryFn: async () => {
      if (!id) throw new Error('Discussion ID is required');
      console.log('[Community] Fetching discussion:', id);
      const result = await apiRequest('GET', `/api/community/discussions/${id}`) as Discussion;
      console.log('[Community] Discussion fetched:', {
        id: result.id,
        title: result.title,
        replyCount: result.replies?.length || 0,
        hasReplies: !!result.replies,
        repliesArray: result.replies,
        fullResult: result
      });
      return result;
    },
    enabled: !!id,
    staleTime: 0, // Always consider data stale to force refetch
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });
}

// Create discussion
export function useCreateDiscussion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateDiscussionRequest) => {
      return apiRequest('POST', '/api/community/discussions', data) as Promise<Discussion>;
    },
    onSuccess: () => {
      // Invalidate discussions list to show the new discussion
      queryClient.invalidateQueries({ 
        queryKey: ['discussions'],
        exact: false // This ensures it matches ['discussions', params] too
      });
    },
  });
}

// Update discussion
export function useUpdateDiscussion(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateDiscussionRequest) => {
      return apiRequest('PUT', `/api/community/discussions/${id}`, data) as Promise<Discussion>;
    },
    onSuccess: (updatedDiscussion) => {
      // Update the specific discussion in cache
      queryClient.setQueryData(['discussion', id], updatedDiscussion);
      // Invalidate discussions list
      queryClient.invalidateQueries({ 
        queryKey: ['discussions'],
        exact: false // This ensures it matches ['discussions', params] too
      });
    },
  });
}

// Archive discussion (soft delete)
export function useArchiveDiscussion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('[Community] Attempting to delete discussion:', id);
      return apiRequest('DELETE', `/api/community/discussions/${id}`);
    },
    onSuccess: (_, id) => {
      console.log('[Community] Successfully deleted discussion:', id);
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['discussion', id] });
      console.log('[Community] Removed discussion from cache:', id);
      // Invalidate ALL discussions queries regardless of params
      queryClient.invalidateQueries({ 
        queryKey: ['discussions'],
        exact: false // This ensures it matches ['discussions', params] too
      });
      console.log('[Community] Invalidated all discussions caches');
    },
    onError: (error: any) => {
      console.error('[Community] Failed to delete discussion:', error);
      console.error('[Community] Error details:', {
        message: error.message,
        status: error.status,
        details: error.details
      });
    },
  });
}
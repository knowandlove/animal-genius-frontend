import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Reply, CreateReplyRequest } from '@/types/community';

// Create reply
export function useCreateReply(discussionId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateReplyRequest) => {
      console.log('[Community] Creating reply for discussion:', discussionId, data);
      return apiRequest('POST', `/api/community/replies/${discussionId}`, data) as Promise<Reply>;
    },
    onSuccess: () => {
      console.log('[Community] Successfully created reply, invalidating caches...');
      
      // Force refetch the specific discussion
      queryClient.invalidateQueries({ 
        queryKey: ['discussion', discussionId],
        refetchType: 'active' 
      });
      
      // Also refetch the discussion immediately to ensure UI updates
      queryClient.refetchQueries({
        queryKey: ['discussion', discussionId],
        type: 'active'
      });
      
      console.log('[Community] Force refetched discussion:', discussionId);
      
      // Also invalidate ALL discussions queries to update reply count
      queryClient.invalidateQueries({ 
        queryKey: ['discussions'],
        exact: false // This ensures it matches ['discussions', params] too
      });
      console.log('[Community] Invalidated all discussions caches');
    },
    onError: (error: any) => {
      console.error('[Community] Failed to create reply:', error);
      console.error('[Community] Error details:', {
        message: error.message,
        status: error.status,
        details: error.details
      });
    },
  });
}

// Update reply
export function useUpdateReply(discussionId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (variables: { replyId: string; body: string }) => {
      const { replyId, body } = variables;
      return apiRequest('PUT', `/api/community/replies/${replyId}`, { body }) as Promise<Reply>;
    },
    onSuccess: () => {
      // Invalidate the discussion to refresh replies
      queryClient.invalidateQueries({ queryKey: ['discussion', discussionId] });
    },
  });
}

// Delete reply
export function useDeleteReply(discussionId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (replyId: string) => {
      return apiRequest('DELETE', `/api/community/replies/${replyId}`);
    },
    onSuccess: () => {
      // Invalidate the discussion to refresh replies
      queryClient.invalidateQueries({ queryKey: ['discussion', discussionId] });
      // Also invalidate ALL discussions queries to update reply count
      queryClient.invalidateQueries({ 
        queryKey: ['discussions'],
        exact: false // This ensures it matches ['discussions', params] too
      });
    },
  });
}

// Accept answer
export function useAcceptAnswer(discussionId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (replyId: string) => {
      return apiRequest('PUT', `/api/community/replies/${replyId}/accept`) as Promise<Reply>;
    },
    onSuccess: () => {
      // Invalidate the discussion to refresh replies
      queryClient.invalidateQueries({ queryKey: ['discussion', discussionId] });
    },
  });
}
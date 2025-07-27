import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Interaction, CreateInteractionRequest, GroupedInteractions } from '@/types/community';

// Create or toggle interaction
export function useCreateInteraction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateInteractionRequest) => {
      return apiRequest('POST', '/api/community/interactions', data) as Promise<{ action: 'created' | 'removed'; created: boolean }>;
    },
    onSuccess: (result, variables) => {
      // For helpful and tried_it interactions, manually update the count
      if (variables.discussionId && (variables.type === 'helpful' || variables.type === 'tried_it')) {
        const increment = result.action === 'created' ? 1 : -1;
        
        queryClient.setQueryData(['discussion', variables.discussionId], (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            helpfulCount: variables.type === 'helpful' 
              ? Math.max(0, (oldData.helpfulCount || 0) + increment) 
              : oldData.helpfulCount,
            triedCount: variables.type === 'tried_it' 
              ? Math.max(0, (oldData.triedCount || 0) + increment) 
              : oldData.triedCount,
          };
        });
        
        // Also update in the list view
        queryClient.setQueriesData(
          { queryKey: ['discussions'], exact: false },
          (oldData: any) => {
            if (!oldData?.discussions) return oldData;
            
            return {
              ...oldData,
              discussions: oldData.discussions.map((d: any) => 
                d.id === variables.discussionId
                  ? {
                      ...d,
                      helpfulCount: variables.type === 'helpful' 
                        ? Math.max(0, (d.helpfulCount || 0) + increment) 
                        : d.helpfulCount,
                      triedCount: variables.type === 'tried_it' 
                        ? Math.max(0, (d.triedCount || 0) + increment) 
                        : d.triedCount,
                    }
                  : d
              ),
            };
          }
        );
      }
      
      // For replies, we still need to invalidate to show the new helpful count
      if (variables.replyId) {
        queryClient.invalidateQueries({ queryKey: ['discussion'] });
      }
      
      // Always invalidate user's interactions to update button states
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
    },
  });
}

// Get user's interactions
export function useMyInteractions() {
  return useQuery({
    queryKey: ['interactions', 'my'],
    queryFn: async () => {
      return apiRequest('GET', '/api/community/interactions/my') as Promise<GroupedInteractions>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get interactions for a specific discussion
export function useDiscussionInteractions(discussionId: string | undefined) {
  return useQuery({
    queryKey: ['interactions', 'discussion', discussionId],
    queryFn: async () => {
      if (!discussionId) throw new Error('Discussion ID required');
      return apiRequest('GET', `/api/community/interactions/discussion/${discussionId}`) as Promise<{
        viewed: boolean;
        helpful: boolean;
        saved: boolean;
        tried_it: boolean;
        shared: boolean;
      }>;
    },
    enabled: !!discussionId,
  });
}
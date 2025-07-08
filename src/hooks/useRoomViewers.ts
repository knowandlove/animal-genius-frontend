import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Viewer {
  id: string;
  name: string;
  joinedAt: Date;
}

interface UseRoomViewersOptions {
  passportCode: string;
  viewerId: string;
  viewerName: string;
  enabled?: boolean;
}

export function useRoomViewers({ 
  passportCode, 
  viewerId, 
  viewerName, 
  enabled = true 
}: UseRoomViewersOptions) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const heartbeatInterval = useRef<NodeJS.Timeout>();

  // Join room mutation
  const joinMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/room/${passportCode}/viewers/join`, {
        viewerId,
        viewerName
      });
    },
    onSuccess: (data) => {
      setViewers(data.viewers);
    }
  });

  // Leave room mutation
  const leaveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/room/${passportCode}/viewers/leave`, {
        viewerId
      });
    }
  });

  // Heartbeat mutation
  const heartbeatMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/room/${passportCode}/viewers/heartbeat`, {
        viewerId
      });
    }
  });

  // Poll for viewers
  const { data: viewersData } = useQuery({
    queryKey: ['room-viewers', passportCode],
    queryFn: async () => {
      const data = await apiRequest('GET', `/api/room/${passportCode}/viewers`);
      return data.viewers as Viewer[];
    },
    enabled: enabled && !!passportCode,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Update local viewers when data changes
  useEffect(() => {
    console.log('Viewers data from query:', viewersData);
    if (viewersData) {
      setViewers(viewersData);
    }
  }, [viewersData]);

  // Join room and start heartbeat
  useEffect(() => {
    console.log('useRoomViewers effect:', { enabled, passportCode, viewerId, viewerName });
    if (!enabled || !passportCode || !viewerId || !viewerName) return;

    // Join the room
    console.log('Joining room:', passportCode, 'as', viewerName);
    joinMutation.mutate();

    // Start heartbeat every 30 seconds
    heartbeatInterval.current = setInterval(() => {
      heartbeatMutation.mutate();
    }, 30000);

    // Cleanup: leave room and stop heartbeat
    return () => {
      leaveMutation.mutate();
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [enabled, passportCode, viewerId, viewerName]);

  // Filter out self from viewers
  const otherViewers = viewers.filter(v => v.id !== viewerId);

  return {
    viewers: otherViewers,
    viewerCount: otherViewers.length,
    isLoading: joinMutation.isPending,
  };
}
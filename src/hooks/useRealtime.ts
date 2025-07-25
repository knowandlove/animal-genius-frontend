import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { RealtimeChannel } from '@supabase/supabase-js';

// Initialize Supabase client for real-time connections
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface RealtimeEvent {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: any;
  old?: any;
  errors?: any;
}

export interface UseRealtimeOptions {
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onError?: (error: any) => void;
}

/**
 * Custom hook for subscribing to Supabase Realtime events
 * 
 * @param options - Configuration for the realtime subscription
 * @param callback - Function to call when events are received
 * @param deps - Dependencies array for effect re-subscription
 * 
 * @example
 * // Listen to all quiz submissions
 * useRealtime(
 *   { table: 'quiz_submissions' },
 *   (event) => {
 *     console.log('New quiz submission:', event.new);
 *     // Update your state here
 *   },
 *   []
 * );
 * 
 * @example
 * // Listen to quiz submissions for specific class
 * useRealtime(
 *   { 
 *     table: 'quiz_submissions',
 *     filter: `student_id=in.(${studentIds.join(',')})`
 *   },
 *   (event) => {
 *     if (event.eventType === 'INSERT') {
 *       setQuizSubmissions(prev => [...prev, event.new]);
 *     }
 *   },
 *   [studentIds]
 * );
 */
export function useRealtime(
  options: UseRealtimeOptions,
  callback: (event: RealtimeEvent) => void,
  deps: React.DependencyList = []
) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const {
      table,
      schema = 'public',
      event = '*',
      filter,
      onError
    } = options;

    // Create unique channel name
    const channelName = `realtime-${table}-${Date.now()}`;
    
    try {
      // Create channel
      const channel = supabase.channel(channelName);
      channelRef.current = channel;

      // Configure postgres changes listener
      const postgresConfig: any = {
        event,
        schema,
        table
      };

      if (filter) {
        postgresConfig.filter = filter;
      }

      channel
        .on('postgres_changes', postgresConfig, (payload: any) => {
          const realtimeEvent: RealtimeEvent = {
            schema: payload.schema,
            table: payload.table,
            commit_timestamp: payload.commit_timestamp,
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
            errors: payload.errors
          };
          
          callback(realtimeEvent);
        })
        .on('system', {}, (payload) => {
          if (payload.status === 'ok') {
            setIsConnected(true);
            setError(null);
          }
        })
        .subscribe((status, error) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setError(null);
          } else if (status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            const errorMsg = `Failed to subscribe to realtime channel: ${error?.message || 'Unknown error'}`;
            setError(errorMsg);
            onError?.(errorMsg);
          } else if (status === 'TIMED_OUT') {
            setIsConnected(false);
            const errorMsg = 'Realtime subscription timed out';
            setError(errorMsg);
            onError?.(errorMsg);
          } else if (status === 'CLOSED') {
            setIsConnected(false);
          }
        });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown realtime error';
      setError(errorMsg);
      options.onError?.(err);
    }

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
      setError(null);
    };
  }, deps);

  return {
    isConnected,
    error
  };
}

/**
 * Hook specifically for listening to quiz submissions in a class
 * This is a convenience wrapper around useRealtime for the common use case
 */
export function useQuizSubmissionsRealtime(
  classId: string,
  onNewSubmission: (submission: any) => void,
  onError?: (error: any) => void
) {
  // We need to filter by students in the class
  // This would require getting student IDs first, which adds complexity
  // For now, we'll listen to all submissions and filter in the callback
  
  return useRealtime(
    {
      table: 'quiz_submissions',
      event: 'INSERT',
      onError
    },
    (event) => {
      if (event.eventType === 'INSERT' && event.new) {
        // Note: We'll need to verify this submission belongs to the class
        // This could be done by joining with students table or passing classId context
        onNewSubmission(event.new);
      }
    },
    [classId]
  );
}
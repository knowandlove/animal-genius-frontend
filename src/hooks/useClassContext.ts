import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ClassContext {
  classId: string | undefined;
  className: string | undefined;
  isLoading: boolean;
  role?: string;
}

export function useClassContext(): ClassContext {
  const params = useParams();
  const [classId, setClassId] = useState<string | undefined>();

  // Extract classId from various route patterns
  useEffect(() => {
    // Check various param names that might contain classId
    const id = params.classId || params.id;
    if (id) {
      setClassId(id);
    } else {
      // Check if we're in a route that has classId in the path
      const path = window.location.pathname;
      const match = path.match(/\/class(?:es)?\/(\d+)/);
      if (match) {
        setClassId(match[1]);
      } else {
        setClassId(undefined);
      }
    }
  }, [params]);

  const { data, isLoading } = useQuery({
    queryKey: [`/api/classes/${classId}/context`],
    queryFn: async () => {
      if (!classId) return null;
      try {
        // Try to get class info with role
        return await apiRequest("GET", `/api/classes/${classId}`);
      } catch (error) {
        // If that fails, try basic class info
        return null;
      }
    },
    enabled: !!classId,
  });

  return {
    classId,
    className: data?.name,
    isLoading: !!classId && isLoading,
    role: data?.role || 'teacher', // Default to teacher role
  };
}
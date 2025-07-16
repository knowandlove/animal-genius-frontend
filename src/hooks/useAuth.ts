import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  personalityAnimal?: string;
  isAdmin?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const mountedRef = useRef(true);
  const queryClient = useQueryClient();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
      }
    }
    setHasInitialized(true);
    setIsLoading(false);
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Sync with server if token exists - only enable after initial load
  const { data: serverUser } = useQuery<User>({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const data = await response.json();
      // Handle the nested response structure from the API
      if (data.success && data.data) {
        return data.data;
      }
      return data;
    },
    enabled: hasInitialized && !!localStorage.getItem("authToken") && !user,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Update user state when server data loads
  useEffect(() => {
    if (serverUser && mountedRef.current) {
      setUser(serverUser);
      localStorage.setItem("user", JSON.stringify(serverUser));
    }
  }, [serverUser]);

  const login = (token: string, userData: User, refreshToken?: string) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(userData));
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    setUser(userData);
    setIsLoading(false);
    
    // Dispatch event for same-window listeners
    window.dispatchEvent(new Event('authTokenChanged'));
  };

  const logout = () => {
    // Clear all queries to prevent any ongoing requests
    queryClient.cancelQueries();
    queryClient.clear();
    
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    
    // Dispatch event for same-window listeners
    window.dispatchEvent(new Event('authTokenChanged'));
  };

  const refreshUser = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const response = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Handle the nested response structure from the API
        const userData = data.success && data.data ? data.data : data;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !!localStorage.getItem("authToken"),
    login,
    logout,
    refreshUser,
  };
}
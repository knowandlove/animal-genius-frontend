import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/config/api';

interface User {
  id: string;  // Changed from number to string for Supabase UUIDs
  firstName: string;
  lastName: string;
  email: string;
  personalityAnimal?: string;
  isAdmin?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use React Query to fetch user data from server
  const { data: serverUser, refetch } = useQuery<User>({
    queryKey: ['/api/me'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No auth token');
      }
      
      const response = await fetch(api('/api/me'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token is invalid, clear it
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch user data');
      }
      
      const data = await response.json();
      return data.data; // API returns { success: true, data: userData }
    },
    enabled: !!localStorage.getItem('authToken'),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update user state when server data loads
  useEffect(() => {
    if (serverUser) {
      setUser(serverUser);
      setIsLoading(false);
    } else if (!localStorage.getItem('authToken')) {
      setIsLoading(false);
    }
  }, [serverUser]);

  const login = (token: string, userData: User, refreshToken?: string) => {
    // SECURITY FIX: Only store tokens, not user data
    localStorage.setItem('authToken', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    // Do NOT store user data in localStorage anymore
    // The user data will be fetched from /api/me endpoint
    
    setUser(userData); // Set it in state temporarily
    setIsLoading(false);
    
    // Trigger a refetch to get fresh data from server
    refetch();
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    // Remove the old user data if it exists
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshUser = async () => {
    // Simply refetch from the server
    await refetch();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !!localStorage.getItem('authToken'),
    login,
    logout,
    refreshUser,
  };
}
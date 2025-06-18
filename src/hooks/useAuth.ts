import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  personalityAnimal?: string;
  isAdmin?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    setIsLoading(false);
  }, []);

  // Sync with server if token exists
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
      return response.json();
    },
    enabled: !!localStorage.getItem("authToken") && !user,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Update user state when server data loads
  useEffect(() => {
    if (serverUser) {
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
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
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
        const userData = await response.json();
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
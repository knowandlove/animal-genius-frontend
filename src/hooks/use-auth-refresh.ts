import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

// Hook to refresh auth token before it expires
export function useAuthRefresh() {
  useEffect(() => {
    // Function to decode JWT and get expiry
    function getTokenExpiry(token: string): number | null {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
      } catch {
        return null;
      }
    }

    // Function to refresh token
    async function refreshToken() {
      try {
        const response = await apiRequest('POST', '/api/auth/refresh');
        if (response.token) {
          localStorage.setItem('authToken', response.token);
          console.log('Token refreshed successfully');
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    }

    // Check token and set up refresh
    function setupTokenRefresh() {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const expiry = getTokenExpiry(token);
      if (!expiry) return;

      const now = Date.now();
      const timeUntilExpiry = expiry - now;
      
      // Refresh 5 minutes before expiry
      const refreshTime = timeUntilExpiry - (5 * 60 * 1000);
      
      if (refreshTime > 0) {
        console.log(`Token expires in ${Math.round(timeUntilExpiry / 1000 / 60)} minutes`);
        console.log(`Will refresh in ${Math.round(refreshTime / 1000 / 60)} minutes`);
        
        const timeoutId = setTimeout(() => {
          refreshToken();
        }, refreshTime);
        
        return () => clearTimeout(timeoutId);
      } else {
        // Token is about to expire or already expired, refresh immediately
        refreshToken();
      }
    }

    // Initial setup
    const cleanup = setupTokenRefresh();

    // Re-setup when token changes
    const handleStorageChange = () => {
      cleanup?.();
      setupTokenRefresh();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authTokenChanged', handleStorageChange);

    return () => {
      cleanup?.();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authTokenChanged', handleStorageChange);
    };
  }, []);
}
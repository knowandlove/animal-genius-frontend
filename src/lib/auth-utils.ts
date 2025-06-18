/**
 * Authentication utilities for handling token expiration and cleanup
 */

export function clearAuthState() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  
  // Clear any cached query data that might depend on authentication
  if (typeof window !== 'undefined') {
    sessionStorage.clear();
  }
}

export function isTokenExpired(token: string): boolean {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    // If we can't parse the token, consider it expired
    return true;
  }
}

export function redirectToLogin() {
  clearAuthState();
  window.location.href = '/login';
}

export function checkAuthStateOnLoad() {
  const token = localStorage.getItem("authToken");
  const refreshToken = localStorage.getItem("refreshToken");
  
  // If we have tokens but they're both expired, clear everything
  if (token && refreshToken) {
    if (isTokenExpired(token) && isTokenExpired(refreshToken)) {
      console.log('Both tokens expired, clearing authentication state');
      clearAuthState();
      return false;
    }
  }
  
  // If we have an auth token but no refresh token, that's an inconsistent state
  if (token && !refreshToken) {
    console.log('Inconsistent auth state, clearing tokens');
    clearAuthState();
    return false;
  }
  
  return !!token;
}
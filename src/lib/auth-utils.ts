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
  
  // TEMPORARILY DISABLED: Token expiration check
  // The Supabase JWTs might have different expiration handling
  // TODO: Implement proper token refresh logic
  
  // For now, just check if we have a token
  return !!token;
}
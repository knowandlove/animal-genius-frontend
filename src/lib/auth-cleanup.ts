/**
 * Authentication cleanup utility to fix expired token issues
 * This runs on app startup to clear any invalid authentication state
 */

export function performAuthCleanup() {
  const authToken = localStorage.getItem("authToken");
  const refreshToken = localStorage.getItem("refreshToken");
  const user = localStorage.getItem("user");

  let shouldClear = false;

  // Check if we have incomplete auth state
  if (authToken && !refreshToken) {
    console.log("Found auth token without refresh token, clearing...");
    shouldClear = true;
  }

  // Check if tokens are malformed
  if (authToken) {
    try {
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // If token is expired and we don't have a valid refresh token
      if (payload.exp < currentTime) {
        if (!refreshToken || !isValidJWT(refreshToken)) {
          console.log("Auth token expired with no valid refresh token, clearing...");
          shouldClear = true;
        }
      }
    } catch (error) {
      console.log("Malformed auth token found, clearing...");
      shouldClear = true;
    }
  }

  // Check refresh token validity
  if (refreshToken && !isValidJWT(refreshToken)) {
    console.log("Invalid refresh token found, clearing...");
    shouldClear = true;
  }

  if (shouldClear) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    sessionStorage.clear();
    console.log("Authentication state cleared due to invalid tokens");
    return false;
  }

  return !!(authToken && refreshToken);
}

function isValidJWT(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Try to decode the header and payload
    JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has expired
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
}

// Run cleanup immediately when this module is imported
const authState = performAuthCleanup();
console.log('Auth cleanup complete. Valid auth state:', authState);

// If we cleared auth state, reload the page to ensure clean state
if (!authState && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
  console.log('Auth state was cleared, redirecting to login...');
  setTimeout(() => {
    window.location.href = '/login';
  }, 500);
}
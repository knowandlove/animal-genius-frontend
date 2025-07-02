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
    if (process.env.NODE_ENV === 'development') {
      console.log("Found auth token without refresh token, clearing...");
    }
    shouldClear = true;
  }

  // Check if tokens are malformed
  if (authToken) {
    try {
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // If token is expired and we don't have a refresh token
      if (payload.exp < currentTime) {
        if (!refreshToken) {
          if (process.env.NODE_ENV === 'development') {
            console.log("Auth token expired with no refresh token, clearing...");
          }
          shouldClear = true;
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log("Malformed auth token found, clearing...");
      }
      shouldClear = true;
    }
  }

  // Note: Supabase refresh tokens are not JWTs, they're simple strings
  // So we just check if it exists, not if it's a valid JWT
  if (refreshToken && typeof refreshToken !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.log("Invalid refresh token found, clearing...");
    }
    shouldClear = true;
  }

  if (shouldClear) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    sessionStorage.clear();
    if (process.env.NODE_ENV === 'development') {
      console.log("Authentication state cleared due to invalid tokens");
    }
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

// Only run cleanup if we detect a problem - don't be aggressive
if (process.env.NODE_ENV === 'development') {
  console.log('Auth cleanup module loaded - will only clear if tokens are clearly invalid');
}
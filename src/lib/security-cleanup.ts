// Clean up old user data from localStorage
// This runs once when the app loads to remove sensitive data

(function cleanupLocalStorage() {
  // Check if we've already done this cleanup
  const cleanupDone = localStorage.getItem('security_cleanup_v1');
  
  if (!cleanupDone) {
    console.log('[Security] Cleaning up sensitive data from localStorage...');
    
    // Remove user object if it exists (old system)
    const oldUserData = localStorage.getItem('user');
    if (oldUserData) {
      console.log('[Security] Removing user data from localStorage');
      localStorage.removeItem('user');
    }
    
    // Mark cleanup as done
    localStorage.setItem('security_cleanup_v1', 'true');
    console.log('[Security] Cleanup complete');
  }
})();

export {}; // Make this a module

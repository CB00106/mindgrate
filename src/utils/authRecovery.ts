// Utility functions for handling authentication recovery
import { supabase } from '@/services/supabaseClient';

/**
 * Clears all authentication data from localStorage and Supabase
 * Useful when dealing with corrupted tokens or refresh token errors
 */
export const clearAuthenticationData = async (): Promise<void> => {
  try {
    // Clear localStorage auth data
    const authKeys = [
      'mindops-auth',
      'sb-mindops-auth-token',
      'supabase.auth.token',
      // Clear any other potential auth keys
    ];
    
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key} from localStorage:`, error);
      }
    });

    // Also clear sessionStorage
    authKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key} from sessionStorage:`, error);
      }
    });

    // Sign out from Supabase to clear server-side session
    await supabase.auth.signOut();
    
    console.log('Authentication data cleared successfully');
  } catch (error) {
    console.error('Error clearing authentication data:', error);
  }
};

/**
 * Attempts to recover from refresh token errors
 * This function should be called when encountering "Invalid Refresh Token" errors
 */
export const recoverFromRefreshTokenError = async (): Promise<void> => {
  console.log('Attempting to recover from refresh token error...');
  
  try {
    // Clear all authentication data
    await clearAuthenticationData();
    
    // Force a page reload to restart the authentication flow
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('Error during refresh token recovery:', error);
  }
};

/**
 * Enhanced error handler for authentication errors
 * Automatically handles common auth errors and provides recovery
 */
export const handleAuthError = async (error: any): Promise<void> => {
  const errorMessage = error?.message?.toLowerCase() || '';
  
  if (errorMessage.includes('refresh') && errorMessage.includes('token')) {
    console.log('Detected refresh token error, initiating recovery...');
    await recoverFromRefreshTokenError();
  } else if (errorMessage.includes('invalid') && errorMessage.includes('token')) {
    console.log('Detected invalid token error, clearing auth data...');
    await clearAuthenticationData();
  } else {
    console.error('Unhandled authentication error:', error);
  }
};

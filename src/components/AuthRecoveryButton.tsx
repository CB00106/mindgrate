import React from 'react';
import { clearAuthenticationData } from '@/utils/authRecovery';

interface AuthRecoveryButtonProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Emergency button to clear authentication data
 * Useful for debugging or when users encounter persistent auth issues
 */
export const AuthRecoveryButton: React.FC<AuthRecoveryButtonProps> = ({ 
  className = "px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors",
  children = "Clear Auth Data" 
}) => {
  const handleClearAuth = async () => {
    if (window.confirm('This will clear all authentication data and refresh the page. Continue?')) {
      await clearAuthenticationData();
      window.location.reload();
    }
  };

  return (
    <button 
      onClick={handleClearAuth}
      className={className}
      type="button"
    >
      {children}
    </button>
  );
};

export default AuthRecoveryButton;

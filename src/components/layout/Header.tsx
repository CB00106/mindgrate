import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components';
import logoImage from '@/images/imageq1_lay.png';

const Header: React.FC = () => {
  const location = useLocation();
  const { user, signOut, loading } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };  return (
    <header className="bg-white shadow-sm border-b border-gray-200 w-full">
      <div className="w-full px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <img 
              src={logoImage} 
              alt="Mindgrate Logo" 
              className="h-12 w-auto object-contain"
            />
          </Link>          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {user && (
              <Link
                to="/chat"
                className={`text-sm font-medium transition-all duration-200 px-3 py-2 rounded-xl ${
                  isActive('/chat') 
                    ? 'text-black bg-gray-100' 
                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                }`}
              >
                Chat
              </Link>
            )}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden md:block">
                  <p className="text-sm text-gray-700">
                    Hola, <span className="font-semibold">{user.user_metadata?.first_name || user.email}</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                >
                  Cerrar Sesión
                </Button>
              </div>            ) : (
              <>                <Link to="/auth">
                  <Button variant="secondary" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
                <a href="https://form.typeform.com/to/bZkqm16V" target="_blank" rel="noopener noreferrer">
                  <Button variant="primary" size="sm">
                    Feedback
                  </Button>
                </a>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-600 hover:text-black hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-xl p-2 transition-all duration-200"
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components';
import { Menu, X } from 'lucide-react';
import { logger } from '@/utils/logger';
import logoImage from '@/images/imageq1_lay.png';

const Header: React.FC = () => {
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMenuOpen(false);
    } catch (error) {
      logger.error('Error signing out:', error);
    }
  };  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 w-full relative">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <img 
              src={logoImage} 
              alt="Mindgrate Logo" 
              className="h-8 sm:h-10 lg:h-12 w-auto object-contain"
            />
          </Link>          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {user && user.email && (
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

          {/* Desktop Auth Section */}
          <div className="hidden lg:flex items-center space-x-3 lg:space-x-4">
            {loading ? (
              <div className="w-6 h-6 sm:w-8 sm:h-8 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
            ) : user && user.email ? (
              <div className="flex items-center space-x-3 lg:space-x-4">
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-700">
                    Hola, <span className="font-semibold">{user.user_metadata?.first_name || user.email}</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-xs sm:text-sm"
                >
                  Cerrar Sesión
                </Button>
              </div>
            ) : (              <>
                <Link to="/login">
                  <Button variant="secondary" size="sm" className="text-xs sm:text-sm px-3 sm:px-4">
                    Iniciar Sesión
                  </Button>
                </Link>
                <a href="https://form.typeform.com/to/d2VE1GL0" target="_blank" rel="noopener noreferrer">
                  <Button variant="primary" size="sm" className="text-xs sm:text-sm px-3 sm:px-4">
                    Feedback
                  </Button>
                </a>
              </>
            )}
          </div>          {/* Mobile menu button */}
          <div className="lg:hidden relative z-50">
            <button
              type="button"
              onClick={toggleMenu}
              className="text-gray-600 hover:text-black hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg p-2 transition-all duration-200"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50"
            >              <div className="px-4 py-4 space-y-4">
                {user && user.email && (
                  <div className="border-b border-gray-100 pb-4">
                    <Link
                      to="/chat"
                      onClick={() => setIsMenuOpen(false)}
                      className={`block text-base font-medium py-2 px-3 rounded-lg ${
                        isActive('/chat') 
                          ? 'text-black bg-gray-100' 
                          : 'text-gray-600 hover:text-black hover:bg-gray-50'
                      }`}
                    >
                      Chat
                    </Link>
                  </div>
                )}
                
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex justify-center py-2">
                      <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
                    </div>
                  ) : user && user.email ? (
                    <div className="space-y-3">
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-700">
                          Hola, <span className="font-semibold">{user.user_metadata?.first_name || user.email}</span>
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSignOut}
                        className="w-full"
                      >
                        Cerrar Sesión
                      </Button>
                    </div>                ) : (
                    <div className="space-y-3">
                      <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="secondary" size="sm" className="w-full">
                          Iniciar Sesión
                        </Button>
                      </Link>
                      <a 
                        href="https://form.typeform.com/to/bZkqm16V" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Button variant="primary" size="sm" className="w-full">
                          Feedback
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
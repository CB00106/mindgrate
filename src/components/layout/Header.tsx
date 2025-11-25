import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components';
import { Menu, X } from 'lucide-react';
import { logger } from '@/utils/logger';
import logoImage from '@/images/icon.png';

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
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-blue-100/20 rounded-full px-6 py-3 flex items-center justify-between max-w-5xl w-full transition-all duration-300">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity flex-shrink-0 mr-8"
        >
          <img
            src={logoImage}
            alt="Mindgrate Logo"
            className="h-8 w-auto object-contain"
          />
        </Link>

        {/* Desktop Navigation & Actions Combined */}
        <div className="hidden lg:flex items-center space-x-2 flex-1 justify-end">
          {user && user.email ? (
            <>
              <Link to="/chat" className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${isActive('/chat') ? 'bg-gray-100 text-black' : 'text-gray-600 hover:text-black hover:bg-gray-50'}`}>
                Chat
              </Link>
              <div className="h-4 w-px bg-gray-200 mx-2"></div>
              <span className="text-sm text-gray-600 px-2">
                {user.user_metadata?.first_name || user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="rounded-full text-gray-600 hover:text-red-600">
                Salir
              </Button>
            </>
          ) : (
            <>
              <a href="https://form.typeform.com/to/d2VE1GL0" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-600 hover:text-black px-4 py-2 rounded-full hover:bg-gray-50 transition-colors">
                Feedback
              </a>
              <Link to="/login">
                <Button variant="primary" size="sm" className="rounded-full px-6 bg-[#2383e2] hover:bg-[#1d6ab8] text-white border-none shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                  Iniciar Sesión
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden relative z-50 ml-auto">
          <button
            type="button"
            onClick={toggleMenu}
            className="text-gray-600 hover:text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full p-2 transition-all duration-200"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-20 left-4 right-4 bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-3xl p-4 z-40 flex flex-col space-y-2 max-w-md mx-auto"
          >
            {user && user.email ? (
              <>
                <Link to="/chat" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-800 font-medium">Chat</Link>
                <div className="h-px bg-gray-100 my-1"></div>
                <button onClick={handleSignOut} className="block w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 font-medium">Cerrar Sesión</button>
              </>
            ) : (
              <>
                <a href="https://form.typeform.com/to/d2VE1GL0" target="_blank" rel="noopener noreferrer" className="block px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-800 font-medium text-center">
                  Feedback
                </a>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 rounded-xl bg-[#2383e2] text-white font-bold text-center shadow-md">
                  Iniciar Sesión
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
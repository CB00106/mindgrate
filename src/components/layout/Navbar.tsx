
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '@/services/notificationService';
import { logger } from '@/utils/logger';
import logoImage from '@/images/imageq1_lay.png';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, signOut, userMindOpId } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadNotificationCount = async () => {
      if (!userMindOpId) return;
      try {
        const count = await notificationService.getPendingCount(userMindOpId);
        setNotificationCount(count);
      } catch (error) {
        logger.error('Error loading notification count:', error);
      }
    };

    if (userMindOpId) {
      loadNotificationCount();
      const interval = setInterval(loadNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userMindOpId]);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      closeMobileMenu(); // Cierra el menú móvil después de cerrar sesión
    } catch (error) {
      logger.error('Error signing out:', error);
    }
  };
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  
  const navLinks = [
    { path: '/chat', label: 'Chat' },
    { path: '/mindop', label: 'MindOp' },
    { path: '/search', label: 'Search' },
    { path: '/notifications', label: 'Follow Request' },  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm relative z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <img 
              src={logoImage} 
              alt="Logo" 
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          {user && user.email ? (
            <>
              <div className="flex items-center space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-sm font-medium transition-all duration-200 relative px-3 py-2 rounded-lg ${
                      isActive(link.path)
                        ? 'text-black bg-gray-100'
                        : 'text-gray-600 hover:text-black hover:bg-gray-50'
                    }`}
                  >
                    {link.label}
                    {link.path === '/notifications' && notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    {user.user_metadata?.first_name?.charAt(0) || user.email?.charAt(0)}
                  </span>
                </div>
                <div className="flex flex-col justify-center">
                  <Link to="/profile" className="text-sm font-medium text-black hover:text-gray-700">
                    {user.user_metadata?.first_name || 'Usuario'}
                  </Link>
                  <button onClick={handleSignOut} className="text-xs text-gray-500 hover:text-gray-700 text-left">
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <a href="https://form.typeform.com/to/d2VE1GL0" className="text-gray-600 hover:text-black font-medium transition-colors ml-4">Feedback</a>
              <Link to="/login" className="bg-[#2383e2] text-white font-bold py-2 px-4 rounded-[13px] hover:bg-[#1d6ab8] transition-colors ml-2">Iniciar Sesión</Link>
            </>
          )}
        </div>

        {/* Mobile menu button - Solo visible para usuarios autenticados */}
        {user && user.email && (
          <div className="md:hidden relative z-50">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100"
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu - Solo visible para usuarios autenticados */}
      {user && user.email && (
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-200 p-4 z-50"
            >
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user.user_metadata?.first_name?.charAt(0) || user.email?.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-black">{user.user_metadata?.first_name || 'Usuario'}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center justify-between py-3 px-4 rounded-lg transition-colors ${
                      isActive(link.path) ? 'text-black bg-gray-100' : 'text-gray-600 hover:text-black hover:bg-gray-50'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.path === '/notifications' && notificationCount > 0 && (
                      <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </Link>
                ))}
                <Link to="/profile" onClick={closeMobileMenu} className="block py-3 px-4 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-colors">
                  Perfil
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left py-3 px-4 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </nav>
  );
};

export default Navbar;
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '@/services/notificationService';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, signOut, userMindOpId } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  // Cargar el contador de notificaciones
  useEffect(() => {
    const loadNotificationCount = async () => {
      if (!userMindOpId) return;
      
      try {
        const count = await notificationService.getPendingCount(userMindOpId);
        setNotificationCount(count);
      } catch (error) {
        console.error('Error loading notification count:', error);
      }
    };

    if (userMindOpId) {
      loadNotificationCount();
      
      // Configurar un intervalo para actualizar el contador cada 30 segundos
      const interval = setInterval(loadNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userMindOpId]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }  };
  const navLinks = [
    { path: '/chat', label: 'Chat' },
    { path: '/mindop', label: 'MindOp' },
    { path: '/search', label: 'Search' },
    { path: '/notifications', label: 'Follow Request' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/chat" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-bold text-black">Mindgrate</span>
          </Link>
        </div>        {/* Navigation Links */}
        <div className="flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors relative ${
                isActive(link.path)
                  ? 'text-black border-b-2 border-black pb-1'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              {link.label}
              {/* Notification indicator for Follow Request */}
              {link.path === '/notifications' && notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Link>
          ))}
          
          {/* Notification Bell Icon - Alternative placement */}
          <Link
            to="/notifications"
            className={`relative p-2 rounded-full transition-colors ${
              isActive('/notifications') 
                ? 'bg-black text-white' 
                : 'text-gray-600 hover:text-black hover:bg-gray-100'
            }`}
            title="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Link>
        </div>

        {/* User Profile Section */}
        <div className="flex items-center space-x-3">
          {user && (
            <>
              {/* Avatar */}
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {user.user_metadata?.first_name?.charAt(0) || user.email?.charAt(0)}
                </span>
              </div>
              
              {/* User Info */}
              <div className="hidden md:block">
                <div className="flex flex-col">
                  <Link
                    to="/profile"
                    className="text-sm font-medium text-black hover:text-gray-700"
                  >
                    {user.user_metadata?.first_name || 'Usuario'}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-xs text-gray-500 hover:text-gray-700 text-left"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={handleSignOut}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Salir
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

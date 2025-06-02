import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Navbar from './Navbar';
import Header from './Header';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Conditional Navigation */}
      {user ? <Navbar /> : <Header />}
      
      {/* Main Content Area */}
      <main className="flex-1 min-h-0">
        {/* Add container and padding only for non-authenticated users */}
        {user ? (
          children || <Outlet />
        ) : (
          <div className="container mx-auto px-4 py-8 h-full">
            {children || <Outlet />}
          </div>
        )}
      </main>
        {/* Footer - Solo para usuarios no autenticados */}
      {!user && (
        <footer className="bg-white border-t border-gray-200 flex-shrink-0">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-gray-600 text-sm">
              © 2025 Mindgrate. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default MainLayout;

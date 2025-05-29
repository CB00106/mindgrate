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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Conditional Navigation */}
      {user ? <Navbar /> : <Header />}
      
      {/* Main Content Area */}
      <main className="flex-1">
        {/* Add container and padding only for non-authenticated users */}
        {user ? (
          children || <Outlet />
        ) : (
          <div className="container mx-auto px-4 py-8">
            {children || <Outlet />}
          </div>
        )}
      </main>
        {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-600 text-sm">
            © 2025 Mindgrate. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

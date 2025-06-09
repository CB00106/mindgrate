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
    <div className="h-screen bg-white flex flex-col m-0 p-0">
      {/* Conditional Navigation */}
      {user ? <Navbar /> : <Header />}
      
      {/* Main Content Area */}
      <main className="flex-1 min-h-0 m-0 p-0">
        {/* Remove container and padding for full-width layout */}
        {children || <Outlet />}      </main>
    </div>
  );
};

export default MainLayout;

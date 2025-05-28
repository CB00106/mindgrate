import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/LoginForm';
import SignupForm from '@/components/SignupForm';

type AuthMode = 'login' | 'signup';

interface AuthPageProps {
  defaultMode?: AuthMode;
}

const AuthPage: React.FC<AuthPageProps> = ({ defaultMode = 'login' }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(defaultMode);

  // Redirect if user is already authenticated
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleToggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
  };

  const handleAuthSuccess = () => {
    // Small delay to allow auth state to update
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Brand */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 rounded-lg p-3">
              <span className="text-white font-bold text-2xl">M</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">MindOps</span>
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Tab Navigation */}
          <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Forms */}
          <div className="transition-all duration-300 ease-in-out">
            {mode === 'login' ? (
              <LoginForm 
                onToggleMode={handleToggleMode}
                onSuccess={handleAuthSuccess}
              />
            ) : (
              <SignupForm 
                onToggleMode={handleToggleMode}
                onSuccess={handleAuthSuccess}
              />
            )}
          </div>
        </div>

        {/* Additional Links */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">¿Necesitas ayuda?</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a
              href="mailto:support@mindops.com"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Contactar soporte
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          © 2025 MindOps. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;

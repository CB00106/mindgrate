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
    return <Navigate to="/chat" replace />;
  }

  const handleToggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
  };

  const handleAuthSuccess = () => {
    // Small delay to allow auth state to update
    setTimeout(() => {
      navigate('/chat');
    }, 500);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Brand */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-black rounded-xl p-3">
              <span className="text-white font-bold text-2xl">M</span>
            </div>
            <span className="text-2xl font-semibold text-black">Mindgrate</span>
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-100 sm:rounded-2xl sm:px-10">
          {/* Tab Navigation */}
          <div className="flex mb-8 bg-gray-50 rounded-xl p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'signup'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
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
        </div>        {/* Additional Links */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">¿Necesitas ayuda?</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a
              href="mailto:support@mindgrate.com"
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              Contactar soporte
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          © 2025 Mindgrate. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;

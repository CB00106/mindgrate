import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components';

interface LoginFormProps {
  onToggleMode?: () => void;
  onSuccess?: () => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormState {
  loading: boolean;
  error: string | null;
  success: string | null;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode, onSuccess }) => {
  const { signIn } = useAuth();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  const [state, setState] = useState<LoginFormState>({
    loading: false,
    error: null,
    success: null
  });

  const [showClearSessionOption, setShowClearSessionOption] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (state.error) {
      setState(prev => ({ ...prev, error: null }));
    }
  };  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setState(prev => ({ ...prev, error: 'Por favor completa todos los campos' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        let errorMessage = 'Error al iniciar sesión';
        
        // Handle specific error types
        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña.';
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = 'Por favor confirma tu email antes de iniciar sesión.';
        } else if (error.message?.includes('refresh_token_not_found') || error.message?.includes('Invalid Refresh Token')) {
          errorMessage = 'Sesión expirada. Intenta nuevamente.';
          setShowClearSessionOption(true);
        } else {
          errorMessage = error.message || 'Error al iniciar sesión';
        }
        
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: errorMessage
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          success: 'Inicio de sesión exitoso' 
        }));
        setShowClearSessionOption(false);
        onSuccess?.();
      }
    } catch (err) {
      console.error('Login error:', err);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Error inesperado. Por favor intenta nuevamente.' 
      }));
    }
  };

  const handleClearSession = async () => {
    try {
      // Clear localStorage items related to Supabase
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.refreshToken');
      
      // Clear all localStorage items that start with 'sb-'
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage as well
      sessionStorage.clear();
      
      setState(prev => ({ 
        ...prev, 
        error: null, 
        success: 'Sesión limpiada. Intenta iniciar sesión nuevamente.' 
      }));
      setShowClearSessionOption(false);
      
      // Reload the page to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error clearing session:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Error al limpiar la sesión' 
      }));
    }
  };
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-black">Iniciar Sesión</h2>
        <p className="mt-2 text-gray-600">Accede a tu cuenta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
            Correo Electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            disabled={state.loading}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200"
            placeholder="tu@email.com"
          />
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={handleChange}
            disabled={state.loading}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200"
            placeholder="••••••••"
          />
        </div>        {/* Error Message */}
        {state.error && (
          <div className="rounded-xl bg-red-50 border border-red-100 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{state.error}</p>
                {showClearSessionOption && (
                  <button
                    type="button"
                    onClick={handleClearSession}
                    className="mt-2 text-sm text-red-600 hover:text-red-700 underline transition-colors"
                  >
                    Limpiar datos de sesión y reintentar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {state.success && (
          <div className="rounded-xl bg-green-50 border border-green-100 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{state.success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={state.loading}
          className="w-full"
          size="lg"
        >
          {state.loading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Iniciando sesión...
            </div>
          ) : (
            'Iniciar Sesión'
          )}
        </Button>        {/* Forgot Password Link */}
        <div className="text-center">
          <a 
            href="#" 
            className="text-sm text-gray-600 hover:text-black font-medium transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {/* Toggle to Register */}
        {onToggleMode && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <button
                type="button"
                onClick={onToggleMode}
                className="font-medium text-black hover:text-gray-700 transition-colors"
              >
                Registrarse
              </button>
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default LoginForm;
